import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

/** POST /api/profiles/:id/memories: one thing your person said. */
export class CreateMemoryDto {
  @IsString()
  @Length(1, 500)
  text: string;

  /** The question it answered, if any. Lets the AI engine pair question and answer. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  questionId?: string;
}
