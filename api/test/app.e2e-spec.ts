import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

/**
 * End-to-end test through real HTTP against the in-memory storage.
 * Spring Boot analogy: @SpringBootTest + MockMvc.
 */
describe('your-person API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    delete process.env.MONGODB_URI; // force in-memory storage
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health reports in-memory storage', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', storage: 'memory' });
  });

  it('GET /api/interests lists the questionnaire chips', async () => {
    const res = await request(app.getHttpServer()).get('/api/interests').expect(200);
    expect(res.body.length).toBeGreaterThan(10);
    expect(res.body[0]).toMatchObject({ id: expect.any(String), label: expect.any(String), followUps: expect.any(Array) });
  });

  it('rejects an invalid profile', async () => {
    await request(app.getHttpServer())
      .post('/api/profiles')
      .send({ name: '', interests: ['not-a-real-interest'] })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/profiles')
      .send({ name: 'Sam', interests: [], unexpected: 'field' })
      .expect(400);
  });

  it('creates, reads, and updates a profile', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/profiles')
      .send({ name: '  Sam ', interests: ['cooking', 'cooking', 'running'], currentFocus: '  ' })
      .expect(201);

    expect(created.body).toMatchObject({
      id: expect.any(String),
      name: 'Sam',
      interests: ['cooking', 'running'],
      hiddenCount: 0,
    });
    expect(created.body.currentFocus).toBeUndefined();
    expect(created.body.feedback).toBeUndefined(); // internal bookkeeping stays server-side

    const id = created.body.id;
    await request(app.getHttpServer()).get(`/api/profiles/${id}`).expect(200);

    const updated = await request(app.getHttpServer())
      .patch(`/api/profiles/${id}`)
      .send({ interests: ['reading'], currentFocus: 'Big deadline at work' })
      .expect(200);
    expect(updated.body).toMatchObject({ name: 'Sam', interests: ['reading'], currentFocus: 'Big deadline at work' });
  });

  it('returns 404 for an unknown profile', async () => {
    await request(app.getHttpServer()).get('/api/profiles/nope').expect(404);
    await request(app.getHttpServer()).get('/api/profiles/nope/questions').expect(404);
  });

  it('serves prompts, avoids repeats, and hides down-voted questions', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/profiles')
      .send({ name: 'Sam', interests: ['gaming'] })
      .expect(201);
    const id = created.body.id;

    const first = await request(app.getHttpServer()).get(`/api/profiles/${id}/questions?count=2`).expect(200);
    expect(first.body.askName).toBe('Sam');
    expect(first.body.questions).toHaveLength(2);
    expect(first.body.questions[0]).toEqual({
      id: expect.any(String),
      text: expect.any(String),
      interest: expect.toSatisfy((v: unknown) => v === null || v === 'Gaming'),
    });

    const second = await request(app.getHttpServer()).get(`/api/profiles/${id}/questions?count=2`).expect(200);
    const firstIds = first.body.questions.map((q: { id: string }) => q.id);
    for (const q of second.body.questions) expect(firstIds).not.toContain(q.id);

    // Thumbs-down hides a question for good.
    const victim = first.body.questions[0].id;
    const rating = await request(app.getHttpServer())
      .post(`/api/profiles/${id}/questions/${victim}/rating`)
      .send({ score: -1 })
      .expect(201);
    expect(rating.body).toEqual({ questionId: victim, score: -1, hidden: true });

    const profile = await request(app.getHttpServer()).get(`/api/profiles/${id}`).expect(200);
    expect(profile.body.hiddenCount).toBe(1);

    // Exhaust the pool many times over; the hidden question never comes back.
    for (let i = 0; i < 20; i++) {
      const batch = await request(app.getHttpServer()).get(`/api/profiles/${id}/questions?count=5`).expect(200);
      for (const q of batch.body.questions) expect(q.id).not.toBe(victim);
    }

    // Changing your mind replaces the earlier rating.
    await request(app.getHttpServer())
      .post(`/api/profiles/${id}/questions/${victim}/rating`)
      .send({ score: 1 })
      .expect(201);
    const after = await request(app.getHttpServer()).get(`/api/profiles/${id}`).expect(200);
    expect(after.body.hiddenCount).toBe(0);
  });

  it('serves the follow-up taxonomy with the interests', async () => {
    const res = await request(app.getHttpServer()).get('/api/interests').expect(200);
    const sports = res.body.find((i: { id: string }) => i.id === 'sports');
    expect(sports.followUps.map((f: { id: string }) => f.id)).toEqual(['sport', 'team', 'involvement']);
    expect(sports.followUps[0]).toMatchObject({ kind: 'choice', multi: true });
    expect(sports.followUps[1]).toMatchObject({ kind: 'text' });
  });

  it('validates interest details against the taxonomy', async () => {
    const post = (body: unknown) => request(app.getHttpServer()).post('/api/profiles').send(body);
    await post({ name: 'Sam', interests: ['sports'], interestDetails: { nope: {} } }).expect(400);
    await post({ name: 'Sam', interests: ['sports'], interestDetails: { sports: { nope: 'x' } } }).expect(400);
    await post({ name: 'Sam', interests: ['sports'], interestDetails: { sports: { team: ['a list'] } } }).expect(400);
    await post({ name: 'Sam', interests: ['sports'], interestDetails: { sports: { sport: 'not a list' } } }).expect(400);
    await post({ name: 'Sam', interests: ['sports'], interestDetails: { sports: { team: 'x'.repeat(121) } } }).expect(400);
  });

  it('stores details, drops them for deselected interests, and personalizes questions', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/profiles')
      .send({
        name: 'Sam',
        interests: ['sports'],
        interestDetails: {
          sports: { sport: ['Football'], team: '  Vikings ', involvement: '' },
          music: { genre: ['Jazz'] }, // not a selected interest: dropped
        },
      })
      .expect(201);
    expect(created.body.interestDetails).toEqual({ sports: { sport: ['Football'], team: 'Vikings' } });

    const id = created.body.id;
    let sawTeam = false;
    for (let i = 0; i < 30; i++) {
      const batch = await request(app.getHttpServer()).get(`/api/profiles/${id}/questions?count=5`).expect(200);
      for (const q of batch.body.questions) {
        expect(q.text).not.toMatch(/\{[a-z]+\.[a-zA-Z]+/); // never leak a placeholder
        if (q.text.includes('Vikings')) sawTeam = true;
      }
    }
    expect(sawTeam).toBe(true);

    // Deselecting the interest removes its details.
    const updated = await request(app.getHttpServer())
      .patch(`/api/profiles/${id}`)
      .send({ interests: ['music'] })
      .expect(200);
    expect(updated.body.interestDetails).toEqual({});
  });

  it('validates ratings', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/profiles')
      .send({ name: 'Sam', interests: [] })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/profiles/${created.body.id}/questions/g01/rating`)
      .send({ score: 5 })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/api/profiles/${created.body.id}/questions/does-not-exist/rating`)
      .send({ score: 1 })
      .expect(404);
  });
});
