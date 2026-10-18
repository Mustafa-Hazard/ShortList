import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';
import { Application } from '../applications/application.entity';
import { User } from '../users/user.entity';
import { InterviewStatus, InterviewType } from '../common/enums/interview.enum';

export interface SuggestedQuestion {
  question: string;
  listenFor: string;
}

export type InterviewDocument = Interview & Document;

@Schema({
  collection: 'interviews',
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
export class Interview {
  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  get id(): string {
    return this._id;
  }

  @Prop({ type: String, required: true, ref: 'Application', index: true })
  applicationId: string;

  application?: Application;

  @Prop({ type: String, ref: 'User', default: null })
  proposedById: string | null;

  proposedBy?: User | null;

  @Prop({ type: String, ref: 'User', default: null })
  hiringManagerId: string | null;

  hiringManager?: User | null;

  @Prop({ type: String, enum: Object.values(InterviewType), required: true })
  type: InterviewType;

  @Prop({ type: [Date], default: [] })
  proposedSlots: Date[];

  @Prop({ type: Date, default: null })
  confirmedSlot: Date | null;

  @Prop({
    type: String,
    enum: Object.values(InterviewStatus),
    default: InterviewStatus.PROPOSED,
  })
  status: InterviewStatus;

  @Prop({ type: Array, default: [] })
  questions: SuggestedQuestion[];

  @Prop({ type: String, default: null })
  notes: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);

InterviewSchema.virtual('application', {
  ref: 'Application',
  localField: 'applicationId',
  foreignField: '_id',
  justOne: true,
});

InterviewSchema.virtual('proposedBy', {
  ref: 'User',
  localField: 'proposedById',
  foreignField: '_id',
  justOne: true,
});

InterviewSchema.virtual('hiringManager', {
  ref: 'User',
  localField: 'hiringManagerId',
  foreignField: '_id',
  justOne: true,
});
