/**
 * The only file that knows the API's URLs and JSON shapes.
 *
 * Spring analogy: a Feign/RestTemplate client plus the DTO records, in one place.
 *
 * `EXPO_PUBLIC_*` environment variables are the one kind Expo bakes into the
 * app bundle at build time, which is why the prefix is required. Set it in
 * `app/.env` (see `.env.example`). Note that a physical phone cannot reach
 * `localhost` on your laptop: use your machine's LAN address there, and
 * `http://10.0.2.2:3000` inside the Android emulator.
 */
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// ---- Types mirrored from the API -------------------------------------------

/**
 * A follow-up question for one interest ("Which sport?", "Which team?").
 * The API owns this list, so the questionnaire is data-driven: a new
 * follow-up on the server shows up in the app with no release.
 */
export interface FollowUp {
  id: string;
  prompt: string;
  kind: 'choice' | 'text';
  options?: string[];
  multi?: boolean;
  placeholder?: string;
}

export interface Interest {
  id: string;
  label: string;
  followUps: FollowUp[];
}

/** Answers keyed by interest id, then follow-up id. Multi-choice answers are arrays. */
export type InterestDetails = Record<string, Record<string, string | string[]>>;

export interface ProfileInput {
  name: string;
  interests: string[];
  interestDetails?: InterestDetails;
  currentFocus?: string;
  notes?: string;
}

export interface Profile extends ProfileInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  hiddenCount: number;
}

export interface Prompt {
  id: string;
  text: string;
  /** Label of the interest this question matched, or null for a general one. */
  interest: string | null;
}

export interface PromptsResponse {
  askName: string;
  questions: Prompt[];
}

export type Score = 1 | -1;

export interface RatingResponse {
  questionId: string;
  score: Score;
  hidden: boolean;
}

// ---- Error handling --------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Turns any thrown value into something we can show a person. */
export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) return "We couldn't find that profile.";
    return err.message;
  }
  if (err instanceof TypeError) {
    // fetch() throws a TypeError when the server is unreachable.
    return `Can't reach the server at ${BASE_URL}. Is the API running?`;
  }
  return 'Something went wrong.';
}

// ---- The client ------------------------------------------------------------

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    // NestJS error bodies look like { statusCode, message: string | string[], error }.
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join('. ');
      else if (typeof body.message === 'string') message = body.message;
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(res.status, message);
  }

  return (await res.json()) as T;
}

export const api = {
  listInterests: () => request<Interest[]>('/interests'),

  createProfile: (body: ProfileInput) =>
    request<Profile>('/profiles', { method: 'POST', body: JSON.stringify(body) }),

  getProfile: (id: string) => request<Profile>(`/profiles/${encodeURIComponent(id)}`),

  updateProfile: (id: string, body: Partial<ProfileInput>) =>
    request<Profile>(`/profiles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  getPrompts: (id: string, count = 3) =>
    request<PromptsResponse>(`/profiles/${encodeURIComponent(id)}/questions?count=${count}`),

  rate: (id: string, questionId: string, score: Score) =>
    request<RatingResponse>(
      `/profiles/${encodeURIComponent(id)}/questions/${encodeURIComponent(questionId)}/rating`,
      { method: 'POST', body: JSON.stringify({ score }) },
    ),
};
