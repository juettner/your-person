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
import { LocationDto } from './location.dto.js';

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

  /** Replaces the whole details object when sent (the app always sends the full set). */
  @IsOptional()
  @IsInterestDetails()
  interestDetails?: InterestDetails;

  /** Send `null` to clear the location. */
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  currentFocus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
