import { EMPTY_GENERATED, PartnerProfile } from '../profiles/profile.model.js';
import { GenerationClient, GenerationRequest, RawGeneratedQuestion } from './generation-client.js';
import { buildResearchBrief, buildUserPrompt, QuestionGeneratorService } from './question-generator.service.js';

class FakeClient extends GenerationClient {
  readonly enabled = true;
  requests: GenerationRequest[] = [];
  researchCalls = 0;
  constructor(
    private readonly answers: RawGeneratedQuestion[],
    private readonly brief: string | null = null,
  ) {
    super();
  }
  async generateQuestions(request: GenerationRequest) {
    this.requests.push(request);
    return this.answers;
  }
  async research() {
    this.researchCalls++;
    return this.brief;
  }
}

function profile(overrides: Partial<PartnerProfile> = {}): PartnerProfile {
  const now = new Date();
  return {
    id: 'p1',
    name: 'Sam',
    interests: ['sports', 'cooking'],
    interestDetails: { sports: { sport: ['Football'], team: 'Vikings' }, cooking: { cuisine: ['Thai'] } },
    location: { city: 'Minneapolis', region: 'MN' },
    currentFocus: 'Big deadline at work',
    feedback: [{ questionId: 'g01', score: -1, ratedAt: now }, { questionId: 'spo03', score: 1, ratedAt: now }],
    recentlyShown: [],
    generated: { ...EMPTY_GENERATED },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('QuestionGeneratorService', () => {
  it('puts the profile, details, location, and feedback into the prompt', () => {
    const text = buildUserPrompt(profile(), null, 5);
    expect(text).toContain("Partner's name: Sam");
    expect(text).toContain('Lives in: Minneapolis, MN');
    expect(text).toContain('team: Vikings');
    expect(text).toContain('cuisine: Thai');
    expect(text).toContain('Big deadline at work');
    expect(text).toContain("What's been taking up the most space in your head this week?"); // hidden g01
    expect(text).toContain('How are the {sports.team} looking right now, honestly?'); // liked spo03
    expect(text).toContain('Write 5 questions.');
  });

  it('asks research for the things it can look up', () => {
    const brief = buildResearchBrief(profile());
    expect(brief).toContain('Vikings');
    expect(brief).toContain('Thai');
    expect(brief).toContain('Minneapolis, MN');
  });

  it('validates and labels the model output', async () => {
    const client = new FakeClient(
      [
        { text: 'How are the Vikings looking this year?', interest: 'sports', basis: 'team' },
        { text: '  how are the vikings looking this year? ', interest: 'sports', basis: 'dup' },
        { text: 'Want to try that new Thai place?', interest: 'made-up', basis: 'cuisine' },
        { text: 'short', interest: null, basis: '' },
      ],
      'Vikings play Sunday',
    );
    const service = new QuestionGeneratorService(client);
    const out = await service.generate(profile(), 10);

    expect(out).toHaveLength(3); // duplicate dropped (the client already filtered length, so 'short' survives here)
    expect(out[0]).toMatchObject({ text: 'How are the Vikings looking this year?', tags: ['sports'] });
    expect(out[0].id).toMatch(/^ai-[0-9a-f]{8}$/);
    expect(out[1].tags).toEqual(['general']); // unknown interest id -> general
    expect(client.requests[0].user).toContain('Research brief');
    expect(client.requests[0].user).toContain('Vikings play Sunday');
    expect(client.researchCalls).toBe(1);
  });

  it('changes the basis when inputs change and not otherwise', () => {
    const service = new QuestionGeneratorService(new FakeClient([]));
    const a = service.basisFor(profile());
    expect(service.basisFor(profile())).toBe(a);
    expect(service.basisFor(profile({ currentFocus: 'Vacation next week' }))).not.toBe(a);
    expect(service.basisFor(profile({ feedback: [] }))).toBe(a); // feedback is not part of the basis
  });
});
