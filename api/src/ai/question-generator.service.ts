import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { GeneratedQuestion, PartnerProfile } from '../profiles/profile.model.js';
import { findInterest, INTEREST_IDS, INTERESTS } from '../questions/interests.js';
import { findQuestion } from '../questions/question-bank.js';
import { GenerationClient } from './generation-client.js';

/**
 * Turns a profile into a deck of questions written for that person.
 *
 * The flow is two calls at most:
 *   1. (optional) research: web-search for timely local facts
 *   2. generate: write N questions as structured JSON, given the profile,
 *      the user's thumbs up/down history, and the research brief
 *
 * Everything here is prompt assembly and validation. Network goes through
 * GenerationClient, so this class is unit-tested with a fake.
 */
@Injectable()
export class QuestionGeneratorService {
  private readonly logger = new Logger(QuestionGeneratorService.name);

  constructor(private readonly client: GenerationClient) {}

  get enabled(): boolean {
    return this.client.enabled;
  }

  /** A fingerprint of the inputs; when it changes, the deck is stale. */
  basisFor(profile: PartnerProfile): string {
    const input = JSON.stringify({
      name: profile.name,
      interests: [...profile.interests].sort(),
      details: profile.interestDetails,
      location: profile.location ?? null,
      currentFocus: profile.currentFocus ?? null,
    });
    return createHash('sha1').update(input).digest('hex').slice(0, 16);
  }

  async generate(profile: PartnerProfile, count: number): Promise<GeneratedQuestion[]> {
    let research: string | null = null;
    try {
      research = await this.client.research(buildResearchBrief(profile), profile.location);
    } catch (err) {
      // Research is a bonus; never let it block generation.
      this.logger.warn(`Research failed for ${profile.id}: ${(err as Error).message}`);
    }

    const raw = await this.client.generateQuestions({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(profile, research, count),
    });

    const now = new Date();
    const seen = new Set<string>();
    const out: GeneratedQuestion[] = [];
    for (const q of raw) {
      const text = q.text.trim();
      const key = text.toLowerCase();
      if (!text || seen.has(key)) continue;
      seen.add(key);
      // The model may invent an interest id; only keep ones we know.
      const interest = q.interest && INTEREST_IDS.includes(q.interest) ? q.interest : null;
      out.push({
        id: `ai-${randomUUID().slice(0, 8)}`,
        text,
        tags: [interest ?? 'general'],
        basis: q.basis.trim(),
        createdAt: now,
      });
      if (out.length >= count) break;
    }
    return out;
  }
}

/**
 * Stable across calls so it can be prompt-cached. Keep anything per-profile
 * out of here and in the user message.
 */
export const SYSTEM_PROMPT = `You write conversation questions for one half of a couple to ask the other. The person using the app (the asker) has filled in a profile of their partner. You will be given that profile, which questions the asker liked or hid, and sometimes a short research brief with current local facts.

Write questions the asker would say out loud, in the second person, to their partner. Warm, specific, curious, a little playful. One or two sentences each. No therapy voice, no "how does that make you feel", no lists inside a question, no emoji.

What makes a question good here:
- It uses a real detail from the profile: a team, a dish, a trail, a friend's name, the thing going on in their world lately. A question that could be asked of anyone is a weak one.
- It is easy to answer and opens a door. "What's the next step on the basement?" beats "Tell me about your home projects."
- It is timely when the brief allows it: a game this weekend, an event in their city this month, a new place that just opened.
- It respects hidden questions: do not write near-duplicates of anything the asker hid. Lean toward the shape of questions they liked.
- Spread across their interests; do not write five about the same thing. Include one or two general questions about their week.
- Keep it positive. Ask about what they're enjoying, proud of, looking forward to, or would love more of. Never ask them to list problems, complaints, dreads, worries, or things the asker does wrong. If a detail is a stressor, ask about the relief, the help, or the win, not the stress.

Return only the structured output. For each question set interest to the matching interest id from the list in the profile, or null for a general question. Keep basis to one short line.`;

/** The per-profile message: profile, feedback, research, and the ask. */
export function buildUserPrompt(profile: PartnerProfile, research: string | null, count: number): string {
  const interestLines = profile.interests.map((id) => {
    const interest = findInterest(id);
    const answers = profile.interestDetails[id];
    const detail = answers
      ? Object.entries(answers)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('; ')
      : '';
    return `- ${id} (${interest?.label ?? id})${detail ? `: ${detail}` : ''}`;
  });

  const hidden = profile.feedback.filter((f) => f.score === -1).map((f) => questionText(profile, f.questionId)).filter(Boolean);
  const liked = profile.feedback.filter((f) => f.score === 1).map((f) => questionText(profile, f.questionId)).filter(Boolean);
  const existing = profile.generated.questions.map((q) => q.text);

  const parts: string[] = [];
  parts.push(`Partner's name: ${profile.name}`);
  parts.push(
    profile.location
      ? `Lives in: ${[profile.location.city, profile.location.region, profile.location.country].filter(Boolean).join(', ')}`
      : 'Lives in: (not given)',
  );
  parts.push(`What's going on in their world lately: ${profile.currentFocus ?? '(not given)'}`);
  parts.push(`Interests (id (label): follow-up answers):\n${interestLines.join('\n') || '- none selected'}`);
  parts.push(`Valid interest ids: ${INTERESTS.map((i) => i.id).join(', ')}`);
  if (liked.length) parts.push(`Questions the asker liked:\n${liked.map((t) => `- ${t}`).join('\n')}`);
  if (hidden.length) parts.push(`Questions the asker hid (avoid anything like these):\n${hidden.map((t) => `- ${t}`).join('\n')}`);
  if (existing.length) parts.push(`Already in the deck (do not repeat):\n${existing.map((t) => `- ${t}`).join('\n')}`);
  if (research) parts.push(`Research brief (current, use where it fits, do not invent beyond it):\n${research}`);
  parts.push(`Write ${count} questions.`);
  return parts.join('\n\n');
}

/** What we ask the web-search step to find out. */
export function buildResearchBrief(profile: PartnerProfile): string {
  const where = profile.location
    ? [profile.location.city, profile.location.region].filter(Boolean).join(', ')
    : 'their area (location unknown; skip local lookups)';
  const facts: string[] = [];
  const d = profile.interestDetails;
  if (d.sports?.team) facts.push(`upcoming games and recent results for ${String(d.sports.team)}`);
  if (d.music?.artist) facts.push(`recent releases or nearby tour dates for ${String(d.music.artist)}`);
  if (d.cooking?.cuisine) facts.push(`well-reviewed or newly opened ${(d.cooking.cuisine as string[]).join(' or ')} restaurants in ${where}`);
  if (d.running?.race) facts.push(`date and details of ${String(d.running.race)}`);
  if (d.outdoors?.spot) facts.push(`seasonal conditions or events at ${String(d.outdoors.spot)}`);
  if (d.tv?.show) facts.push(`whether ${String(d.tv.show)} has a new season or episode out`);
  if (d.gaming?.game) facts.push(`recent updates or news about ${String(d.gaming.game)}`);
  if (profile.location) facts.push(`notable events, festivals, markets, or openings in ${where} in the next few weeks`);

  return `Find a handful of current, specific facts that would help someone ask their partner good questions this week. Today's date matters: prefer things happening in the next few weeks. Look up:\n${facts.map((f) => `- ${f}`).join('\n') || '- nothing specific; skip searching and reply "nothing found"'}\n\nReply with a short bulleted brief: one line per fact, with a date where relevant. No preamble, no advice, no questions. If a lookup finds nothing useful, leave it out.`;
}

function questionText(profile: PartnerProfile, id: string): string {
  return findQuestion(id)?.text ?? profile.generated.questions.find((q) => q.id === id)?.text ?? '';
}
