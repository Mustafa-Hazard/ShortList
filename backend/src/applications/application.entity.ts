import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';
import { User } from '../users/user.entity';
import { JobPosting } from '../jobs/job-posting.entity';
import { Cv } from '../cv/cv.entity';
import { Interview } from '../interviews/interview.entity';
import { Offer } from '../offers/offer.entity';
import { ApplicationStage } from '../common/enums/application-stage.enum';

export type ApplicationDocument = Application & Document;

@Schema({
  collection: 'applications',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_doc, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Application {
  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  get id(): string {
    return this._id;
  }

  @Prop({ type: String, required: true, ref: 'JobPosting', index: true })
  jobPostingId: string;

  jobPosting?: JobPosting;

  @Prop({ type: String, required: true, ref: 'User', index: true })
  candidateId: string;

  candidate?: User;

  @Prop({ type: String, default: null })
  coverLetter: string | null;

  @Prop({ type: Number, default: null })
  yearsOfExperience: number | null;

  @Prop({ type: Number, default: null })
  salaryExpectation: number | null;

  @Prop({ type: String, default: null })
  availabilityDate: string | null;

  @Prop({
    type: String,
    enum: Object.values(ApplicationStage),
    default: ApplicationStage.APPLIED,
    index: true,
  })
  stage: ApplicationStage;

  cv?: Cv;

  @Prop({ type: Number, default: null })
  aiScore: number | null;

  @Prop({ type: Object, default: null })
  aiExtraction: {
    name?: string;
    yearsOfExperience?: number;
    topSkills?: string[];
    educationLevel?: string;
    lastRole?: string;
  } | null;

  @Prop({ type: [String], default: null })
  aiStrengths: string[] | null;

  @Prop({ type: [String], default: null })
  aiGaps: string[] | null;

  interviews?: Interview[];
  offer?: Offer;

  createdAt: Date;
  updatedAt: Date;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

ApplicationSchema.index({ jobPostingId: 1, candidateId: 1 }, { unique: true });

ApplicationSchema.virtual('jobPosting', {
  ref: 'JobPosting',
  localField: 'jobPostingId',
  foreignField: '_id',
  justOne: true,
});

ApplicationSchema.virtual('candidate', {
  ref: 'User',
  localField: 'candidateId',
  foreignField: '_id',
  justOne: true,
});

ApplicationSchema.virtual('cv', {
  ref: 'Cv',
  localField: '_id',
  foreignField: 'applicationId',
  justOne: true,
});

ApplicationSchema.virtual('interviews', {
  ref: 'Interview',
  localField: '_id',
  foreignField: 'applicationId',
});

ApplicationSchema.virtual('offer', {
  ref: 'Offer',
  localField: '_id',
  foreignField: 'applicationId',
  justOne: true,
});
