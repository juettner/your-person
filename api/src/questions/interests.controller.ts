import { Controller, Get } from '@nestjs/common';
import { INTERESTS } from './interests.js';

/** GET /api/interests: the chips the questionnaire shows. */
@Controller('interests')
export class InterestsController {
  @Get()
  list() {
    return INTERESTS;
  }
}
