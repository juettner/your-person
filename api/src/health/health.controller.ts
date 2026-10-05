import { Controller, Get, Inject } from '@nestjs/common';
import { QuestionGeneratorService } from '../ai/question-generator.service.js';
import { STORAGE_KIND, type StorageKind } from '../persistence/persistence.module.js';

/** GET /api/health: liveness check, which storage backend is active, and whether the AI engine is on. */
@Controller('health')
export class HealthController {
  constructor(
    @Inject(STORAGE_KIND) private readonly storage: StorageKind,
    private readonly generator: QuestionGeneratorService,
  ) {}

  @Get()
  check() {
    return { status: 'ok', storage: this.storage, ai: this.generator.enabled };
  }
}
