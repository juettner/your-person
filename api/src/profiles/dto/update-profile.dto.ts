import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { INTEREST_IDS } from '../../questions/interests.js';

/** Request body for PATCH /api/profiles/:id. Every field is optional; only sent fields change. */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 60)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(INTEREST_IDS.length)
  @IsIn(INTEREST_IDS, { each: true })
  interests?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  currentFocus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
