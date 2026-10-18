import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';
import { Company } from '../companies/company.entity';
import { User } from '../users/user.entity';
import { JobStatus, JobType } from '../common/enums/job.enum';

export type JobPostingDocument = JobPosting & Document;

@Schema({
  collection: 'job_postings',
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
export class JobPosting {
  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  get id(): string {
    return this._id;
  }

  @Prop({ type: String, required: true, ref: 'Company', index: true })
  companyId: string;

  company?: Company;

  @Prop({ type: String, ref: 'User', default: null })
  createdById: string | null;

  createdBy?: User | null;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  department: string;

  @Prop({ type: String, enum: Object.values(JobType), required: true })
  type: JobType;

  @Prop({ type: Number, default: null })
  salaryMin: number | null;

  @Prop({ type: Number, default: null })
  salaryMax: number | null;

  @Prop({ type: [String], default: [] })
  requiredSkills: string[];

  @Prop({ required: true })
  responsibilities: string;

  @Prop({ type: String, default: null })
  cultureNotes: string | null;

  @Prop({ type: String, default: null })
  description: string | null;

  @Prop({
    type: String,
    enum: Object.values(JobStatus),
    default: JobStatus.DRAFT,
    index: true,
  })
  status: JobStatus;

  createdAt: Date;
  updatedAt: Date;
}

export const JobPostingSchema = SchemaFactory.createForClass(JobPosting);

JobPostingSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true,
});

JobPostingSchema.virtual('createdBy', {
  ref: 'User',
  localField: 'createdById',
  foreignField: '_id',
  justOne: true,
});
