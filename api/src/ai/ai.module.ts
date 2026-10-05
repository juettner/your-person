import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { AI_CONFIG, aiConfigFromEnv } from './ai.config.js';
import { AnthropicGenerationClient, GenerationClient, NoopGenerationClient } from './generation-client.js';
import { GenerationScheduler } from './generation-scheduler.service.js';
import { QuestionGeneratorService } from './question-generator.service.js';

/**
 * The AI question engine. Global so profiles and questions can both reach the
 * scheduler without importing this module everywhere.
 *
 * Spring analogy: @ConditionalOnProperty("ANTHROPIC_API_KEY") picks the real
 * client; otherwise a no-op bean keeps the rest of the app unchanged.
 */
@Global()
@Module({})
export class AiModule {
  static forRoot(): DynamicModule {
    const config = aiConfigFromEnv();
    const logger = new Logger(AiModule.name);
    if (config.apiKey) {
      logger.log(`AI question engine on (${config.model}${config.research ? ', with research' : ''})`);
    } else {
      logger.warn('ANTHROPIC_API_KEY not set: AI question engine off, curated bank only');
    }
    return {
      module: AiModule,
      providers: [
        { provide: AI_CONFIG, useValue: config },
        {
          provide: GenerationClient,
          useClass: config.apiKey ? AnthropicGenerationClient : NoopGenerationClient,
        },
        QuestionGeneratorService,
        GenerationScheduler,
      ],
      exports: [AI_CONFIG, GenerationClient, QuestionGeneratorService, GenerationScheduler],
    };
  }
}
