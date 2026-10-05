import { Controller, Get, Inject } from '@nestjs/common';
import { STORAGE_KIND, type StorageKind } from '../persistence/persistence.module.js';

/** GET /api/health: liveness check plus which storage backend is active. */
@Controller('health')
export class HealthController {
  constructor(@Inject(STORAGE_KIND) private readonly storage: StorageKind) {}

  @Get()
  check() {
    return { status: 'ok', storage: this.storage };
  }
}
