import { IsInt, IsString, Length, Max, Min } from 'class-validator';

/** One recurring date: a birthday, an anniversary, the recital. */
export class ImportantDateDto {
  @IsString()
  @Length(1, 60)
  label: string;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  @Min(1)
  @Max(31)
  day: number;
}
