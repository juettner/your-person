import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EMPTY_GENERATED, type PartnerProfile } from '../profile.model.js';
import { ProfileRepository } from '../profile.repository.js';
import { ProfileDocument } from './profile.schema.js';

/**
 * MongoDB-backed repository. Active when MONGODB_URI is set.
 *
 * The mapping between the Mongoose document and our domain object is explicit
 * on purpose: the domain model stays free of persistence annotations, so the
 * question-selection logic can be unit tested without a database.
 */
@Injectable()
export class MongoProfileRepository extends ProfileRepository {
  constructor(
    @InjectModel(ProfileDocument.name)
    private readonly model: Model<ProfileDocument>,
  ) {
    super();
  }

  async findById(id: string): Promise<PartnerProfile | null> {
    // `.lean()` returns a plain object instead of a Mongoose document wrapper;
    // cheaper, and all we need for a read.
    const doc = await this.model.findById(id).lean().exec();
    return doc ? toDomain(doc) : null;
  }

  async save(profile: PartnerProfile): Promise<PartnerProfile> {
    // Upsert: insert if the _id is new, replace the fields otherwise.
    const doc = await this.model
      .findByIdAndUpdate(profile.id, toDocument(profile), {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })
      .lean()
      .exec();
    // `new: true` guarantees a document comes back after an upsert.
    return toDomain(doc!);
  }
}

function toDomain(doc: ProfileDocument): PartnerProfile {
  return {
    id: doc._id,
    name: doc.name,
    interests: doc.interests ?? [],
    interestDetails: doc.interestDetails ?? {},
    location: doc.location ? { city: doc.location.city, region: doc.location.region, country: doc.location.country } : undefined,
    currentFocus: doc.currentFocus,
    notes: doc.notes,
    feedback: (doc.feedback ?? []).map((f) => ({
      questionId: f.questionId,
      score: f.score,
      ratedAt: f.ratedAt,
    })),
    recentlyShown: doc.recentlyShown ?? [],
    generated: doc.generated
      ? {
          questions: (doc.generated.questions ?? []).map((q) => ({
            id: q.id,
            text: q.text,
            tags: q.tags ?? [],
            basis: q.basis ?? '',
            createdAt: q.createdAt,
          })),
          generatedAt: doc.generated.generatedAt ?? null,
          basis: doc.generated.basis ?? '',
        }
      : { ...EMPTY_GENERATED },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toDocument(profile: PartnerProfile): Partial<ProfileDocument> {
  return {
    name: profile.name,
    interests: profile.interests,
    interestDetails: profile.interestDetails,
    location: profile.location,
    currentFocus: profile.currentFocus,
    notes: profile.notes,
    feedback: profile.feedback,
    recentlyShown: profile.recentlyShown,
    generated: profile.generated,
  };
}
