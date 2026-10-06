import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { INTEREST_IDS } from '../../questions/interests.js';
import type { InterestDetails } from '../profile.model.js';
import { IsInterestDetails } from './interest-details.validator.js';
import { ImportantDateDto } from './important-date.dto.js';
import { LocationDto } from './location.dto.js';

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

  /** @ValidateNested + @Type is how class-validator descends into a child object (like @Valid on a field). */
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  /** Replaces the whole list when sent. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ImportantDateDto)
  dates?: ImportantDateDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  currentFocus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
