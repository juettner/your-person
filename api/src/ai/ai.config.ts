/** Settings for the AI question engine, read once from the environment. */
export interface AiConfig {
  /** Unset = engine off; the app runs on the curated bank only. */
  apiKey?: string;
  model: string;
  /** Let the engine web-search for timely local facts before writing questions. */
  research: boolean;
  /** How many questions to ask for per refresh. */
  batchSize: number;
  /** A deck older than this is refreshed in the background. */
  maxAgeDays: number;
}

export const AI_CONFIG = 'AI_CONFIG';

export function aiConfigFromEnv(env: NodeJS.ProcessEnv = process.env): AiConfig {
  return {
    apiKey: env.ANTHROPIC_API_KEY?.trim() || undefined,
    model: env.ANTHROPIC_MODEL?.trim() || 'claude-opus-5-5',
    research: env.AI_RESEARCH === 'true',
    batchSize: 10,
    maxAgeDays: 7,
  };
}
