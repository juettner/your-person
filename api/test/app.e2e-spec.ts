import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { GenerationClient, GenerationRequest } from './../src/ai/generation-client.js';

/**
 * End-to-end test through real HTTP against the in-memory storage.
 * Spring Boot analogy: @SpringBootTest + MockMvc.
 */
describe('your-person API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    delete process.env.MONGODB_URI; // force in-memory storage
    process.env.RATE_LIMIT_PER_MINUTE = '100000'; // the suite fires hundreds of requests
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
    expect(res.body).toEqual({ status: 'ok', storage: 'memory', ai: false });
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
      source: 'curated',
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
    expect(sports.followUps.map((f: { id: string }) => f.id)).toEqual(['sport', 'team', 'involvement', 'watchSpot', 'player', 'rival']);
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

  it('stores a location and serves city questions', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/profiles')
      .send({ name: 'Sam', interests: ['local'], location: { city: ' Minneapolis ', region: 'MN', country: '' } })
      .expect(201);
    expect(created.body.location).toEqual({ city: 'Minneapolis', region: 'MN' });

    let sawCity = false;
    for (let i = 0; i < 20; i++) {
      const batch = await request(app.getHttpServer()).get(`/api/profiles/${created.body.id}/questions?count=5`).expect(200);
      for (const q of batch.body.questions) {
        expect(q.text).not.toContain('{profile.city}');
        if (q.text.includes('Minneapolis')) sawCity = true;
      }
    }
    expect(sawCity).toBe(true);

    await request(app.getHttpServer()).post('/api/profiles').send({ name: 'Sam', interests: [], location: { city: '' } }).expect(400);
    const cleared = await request(app.getHttpServer()).patch(`/api/profiles/${created.body.id}`).send({ location: null }).expect(200);
    expect(cleared.body.location).toBeUndefined();
  });

  it('reports the AI engine as off and makes the generate endpoint a no-op', async () => {
    const health = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(health.body.ai).toBe(false);
    const created = await request(app.getHttpServer()).post('/api/profiles').send({ name: 'Sam', interests: [] }).expect(201);
    const res = await request(app.getHttpServer()).post(`/api/profiles/${created.body.id}/questions/generate`).expect(201);
    expect(res.body).toEqual({ enabled: false, generated: 0 });
    expect(created.body.aiQuestionCount).toBe(0);
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

/**
 * The same app with a fake language model plugged into the AI port, so the
 * whole generate -> select -> rate loop runs without a key or network.
 */
describe('your-person API with the AI engine (e2e)', () => {
  let app: INestApplication<App>;
  let calls = 0;

  class FakeGenerationClient extends GenerationClient {
    readonly enabled = true;
    async generateQuestions(request: GenerationRequest) {
      calls++;
      expect(request.user).toContain("Partner's name: Sam");
      expect(request.user).toContain('team: Vikings');
      return [
        { text: 'How are the Vikings looking this week, honestly?', interest: 'sports', basis: 'team' },
        { text: 'Want to try that new Thai place in Minneapolis on Friday?', interest: 'cooking', basis: 'cuisine + city' },
        { text: "What's one thing that would make your week lighter?", interest: null, basis: 'general' },
      ];
    }
    async research() {
      return null;
    }
  }

  beforeAll(async () => {
    delete process.env.MONGODB_URI;
    process.env.RATE_LIMIT_PER_MINUTE = '100000';
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GenerationClient)
      .useValue(new FakeGenerationClient())
      .compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('writes a deck on demand, mixes it into prompts, and lets it be rated and hidden', async () => {
    const health = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(health.body.ai).toBe(true);

    const created = await request(app.getHttpServer())
      .post('/api/profiles')
      .send({
        name: 'Sam',
        interests: ['sports', 'cooking'],
        interestDetails: { sports: { sport: ['Football'], team: 'Vikings' }, cooking: { cuisine: ['Thai'] } },
        location: { city: 'Minneapolis', region: 'MN' },
      })
      .expect(201);
    const id = created.body.id;

    const gen = await request(app.getHttpServer()).post(`/api/profiles/${id}/questions/generate`).expect(201);
    expect(gen.body).toEqual({ enabled: true, generated: 3 });
    expect(calls).toBeGreaterThanOrEqual(1);

    const profile = await request(app.getHttpServer()).get(`/api/profiles/${id}`).expect(200);
    expect(profile.body.aiQuestionCount).toBe(3);
    expect(profile.body.aiGeneratedAt).toBeTruthy();

    // AI questions are weighted heavily; over a few batches we must see one.
    let aiPrompt: { id: string; text: string; source: string } | undefined;
    for (let i = 0; i < 10 && !aiPrompt; i++) {
      const batch = await request(app.getHttpServer()).get(`/api/profiles/${id}/questions?count=5`).expect(200);
      aiPrompt = batch.body.questions.find((q: { source: string }) => q.source === 'ai');
    }
    expect(aiPrompt).toBeDefined();
    expect(aiPrompt!.id).toMatch(/^ai-/);

    // Rate it like any other question.
    await request(app.getHttpServer()).post(`/api/profiles/${id}/questions/${aiPrompt!.id}/rating`).send({ score: -1 }).expect(201);
    for (let i = 0; i < 20; i++) {
      const batch = await request(app.getHttpServer()).get(`/api/profiles/${id}/questions?count=5`).expect(200);
      for (const q of batch.body.questions) expect(q.id).not.toBe(aiPrompt!.id);
    }
  });
});
