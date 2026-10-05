import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { RateQuestionDto } from './dto/rate-question.dto.js';
import { QuestionsService } from './questions.service.js';

const MIN_COUNT = 1;
const MAX_COUNT = 5;
const DEFAULT_COUNT = 3;

/**
 * Prompts are a sub-resource of a profile:
 *   GET  /api/profiles/:profileId/questions?count=3
 *   POST /api/profiles/:profileId/questions/:questionId/rating   { "score": 1 | -1 }
 */
@Controller('profiles/:profileId/questions')
export class QuestionsController {
  constructor(private readonly service: QuestionsService) {}

  @Get()
  getPrompts(
    @Param('profileId') profileId: string,
    @Query('count', new DefaultValuePipe(DEFAULT_COUNT), ParseIntPipe) count: number,
  ) {
    const clamped = Math.min(MAX_COUNT, Math.max(MIN_COUNT, count));
    return this.service.getPrompts(profileId, clamped);
  }

  @Post(':questionId/rating')
  rate(
    @Param('profileId') profileId: string,
    @Param('questionId') questionId: string,
    @Body() dto: RateQuestionDto,
  ) {
    return this.service.rate(profileId, questionId, dto.score);
  }
}
