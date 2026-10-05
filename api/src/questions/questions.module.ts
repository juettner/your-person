import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module.js';
import { InterestsController } from './interests.controller.js';
import { QUESTION_BANK } from './question-bank.js';
import { QUESTION_SOURCE, QuestionSelectorService } from './question-selector.service.js';
import { QuestionsController } from './questions.controller.js';
import { QuestionsService } from './questions.service.js';

@Module({
  imports: [ProfilesModule],
  controllers: [QuestionsController, InterestsController],
  providers: [
    QuestionsService,
    QuestionSelectorService,
    { provide: QUESTION_SOURCE, useValue: QUESTION_BANK },
  ],
})
export class QuestionsModule {}
