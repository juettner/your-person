import { IsIn } from 'class-validator';
import type { Score } from '../../profiles/profile.model.js';

/** Request body for POST /api/profiles/:profileId/questions/:questionId/rating */
export class RateQuestionDto {
  @IsIn([1, -1])
  score: Score;
}
