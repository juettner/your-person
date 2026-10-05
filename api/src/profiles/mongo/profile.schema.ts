import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

/**
 * Mongoose schema for the `profiles` collection.
 *
 * MongoDB has no tables or columns. A "collection" holds "documents" (JSON-like
 * objects), and documents in the same collection don't have to share a shape.
 * Mongoose adds an optional schema layer on top so we still get validation and
 * a typed model, much like a JPA @Entity gives you over a table.
 *
 * Notice `feedback` is an ARRAY OF OBJECTS stored inside the profile document.
 * In Postgres this would be a `question_feedback` table with a profile_id FK.
 *
 * `interestDetails` goes further: its shape depends on which interests were
 * picked, so it is declared as `Mixed` (schemaless). The API validates it on
 * the way in (dto/interest-details.validator.ts) instead of the database.
 */
@Schema({ _id: false })
export class FeedbackSubdocument {
  @Prop({ required: true })
  questionId: string;

  @Prop({ required: true, enum: [1, -1] })
  score: 1 | -1;

  @Prop({ required: true })
  ratedAt: Date;
}

@Schema({ _id: false })
export class LocationSubdocument {
  @Prop({ required: true })
  city: string;

  @Prop()
  region?: string;

  @Prop()
  country?: string;
}

@Schema({ _id: false })
export class GeneratedQuestionSubdocument {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  text: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: '' })
  basis: string;

  @Prop({ required: true })
  createdAt: Date;
}

@Schema({ _id: false })
export class GeneratedSetSubdocument {
  @Prop({ type: [SchemaFactory.createForClass(GeneratedQuestionSubdocument)], default: [] })
  questions: GeneratedQuestionSubdocument[];

  @Prop({ type: Date, default: null })
  generatedAt: Date | null;

  @Prop({ default: '' })
  basis: string;
}

@Schema({ collection: 'profiles', timestamps: true })
export class ProfileDocument {
  /** We supply our own UUID instead of letting Mongo generate an ObjectId. */
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  interestDetails: Record<string, Record<string, string | string[]>>;

  @Prop({ type: SchemaFactory.createForClass(LocationSubdocument) })
  location?: LocationSubdocument;

  @Prop()
  currentFocus?: string;

  @Prop()
  notes?: string;

  @Prop({ type: [SchemaFactory.createForClass(FeedbackSubdocument)], default: [] })
  feedback: FeedbackSubdocument[];

  @Prop({ type: [String], default: [] })
  recentlyShown: string[];

  @Prop({ type: SchemaFactory.createForClass(GeneratedSetSubdocument), default: () => ({ questions: [], generatedAt: null, basis: '' }) })
  generated: GeneratedSetSubdocument;

  // Filled in automatically by `timestamps: true`.
  createdAt: Date;
  updatedAt: Date;
}

export type ProfileHydratedDocument = HydratedDocument<ProfileDocument>;
export const ProfileSchema = SchemaFactory.createForClass(ProfileDocument);
