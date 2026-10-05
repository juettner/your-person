import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { INTEREST_IDS } from '../../questions/interests.js';
import type { InterestDetails } from '../profile.model.js';
import { IsInterestDetails } from './interest-details.validator.js';

/**
 * Request body for POST /api/profiles.
 *
 * Spring Boot analogy: a request record with Bean Validation annotations
 * (@NotBlank, @Size). The global ValidationPipe in main.ts rejects invalid
 * bodies with a 400 before the controller runs, just like @Valid does.
 */
export class CreateProfileDto {
  @IsString()
  @Length(1, 60)
  name: string;

  @IsArray()
  @ArrayMaxSize(INTEREST_IDS.length)
  @IsIn(INTEREST_IDS, { each: true })
  interests: string[];

  @IsOptional()
  @IsInterestDetails()
  interestDetails?: InterestDetails;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  currentFocus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
