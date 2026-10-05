import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

/** Nested body for `location`. Validated through @ValidateNested on the parent DTO. */
export class LocationDto {
  @IsString()
  @Length(1, 80)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;
}
