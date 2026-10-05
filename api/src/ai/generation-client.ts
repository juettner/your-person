import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import type { ProfileLocation } from '../profiles/profile.model.js';
import { AI_CONFIG, type AiConfig } from './ai.config.js';

/**
 * The shape we ask the model for. Structured outputs guarantee the response
 * parses into exactly this, so no regex-scraping of prose.
 */
export const RawQuestionSchema = z.object({
  /** The question, as you'd say it to your person. */
  text: z.string().min(8).max(240),
  /** The interest id it relates to, or null for a general one. */
  interest: z.string().nullable(),
  /** One line on why this question fits this person. */
  basis: z.string().max(200),
});

export const GenerationOutputSchema = z.object({
  questions: z.array(RawQuestionSchema).min(1).max(25),
});

export type RawGeneratedQuestion = z.infer<typeof RawQuestionSchema>;

export interface GenerationRequest {
  /** Stable instructions; cached across calls. */
  system: string;
  /** The profile, feedback, and research for this call. */
  user: string;
}

/**
 * Port for the language model. The generator service builds prompts and
 * validates results; this is the only place that knows about the Anthropic SDK.
 *
 * Spring analogy: an interface with a real adapter and a no-op one chosen by
 * configuration, so tests and key-less dev never make network calls.
 */
export abstract class GenerationClient {
  abstract readonly enabled: boolean;
  abstract generateQuestions(request: GenerationRequest): Promise<RawGeneratedQuestion[]>;
  /** Returns a short research brief, or null when research is off or found nothing. */
  abstract research(brief: string, location?: ProfileLocation): Promise<string | null>;
}

/** Used when no API key is configured. */
@Injectable()
export class NoopGenerationClient extends GenerationClient {
  readonly enabled = false;
  async generateQuestions(): Promise<RawGeneratedQuestion[]> {
    return [];
  }
  async research(): Promise<string | null> {
    return null;
  }
}

@Injectable()
export class AnthropicGenerationClient extends GenerationClient {
  readonly enabled = true;
  private readonly logger = new Logger(AnthropicGenerationClient.name);
  private readonly client: Anthropic;

  constructor(@Inject(AI_CONFIG) private readonly config: AiConfig) {
    super();
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  async generateQuestions(request: GenerationRequest): Promise<RawGeneratedQuestion[]> {
    const response = await this.client.messages.parse({
      model: this.config.model,
      max_tokens: 16000,
      // Thinking is adaptive by default on this model; effort is the depth control.
      output_config: { effort: 'medium', format: zodOutputFormat(GenerationOutputSchema) },
      system: [{ type: 'text', text: request.system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: request.user }],
    });

    if (response.stop_reason === 'refusal') {
      this.logger.warn(`Generation refused: ${response.stop_details?.category ?? 'unknown'}`);
      return [];
    }
    return response.parsed_output?.questions ?? [];
  }

  async research(brief: string, location?: ProfileLocation): Promise<string | null> {
    if (!this.config.research) return null;

    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: brief }];

    // A web-search turn can pause when it hits its iteration limit; resume by
    // echoing the assistant turn back. Cap the loop so a runaway never spins.
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await this.client.beta.messages.create({
        model: this.config.model,
        max_tokens: 16000,
        // Server-side refusal fallback: if the model declines, the API re-runs on a sibling model.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium' },
        tools: [
          {
            type: 'web_search_20260209',
            name: 'web_search',
            max_uses: 6,
            ...(location
              ? { user_location: { type: 'approximate' as const, city: location.city, region: location.region } }
              : {}),
          },
        ],
        messages,
      });

      if (response.stop_reason === 'pause_turn') {
        messages.push({ role: 'assistant', content: response.content });
        continue;
      }
      if (response.stop_reason === 'refusal') return null;

      const text = response.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
      return text || null;
    }
    return null;
  }
}
