import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';
import { Application } from '../applications/application.entity';
import { User } from '../users/user.entity';
import { OfferStatus } from '../common/enums/offer-status.enum';

export type OfferDocument = Offer & Document;

@Schema({
  collection: 'offers',
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
export class Offer {
  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  get id(): string {
    return this._id;
  }

  @Prop({
    type: String,
    required: true,
    unique: true,
    ref: 'Application',
    index: true,
  })
  applicationId: string;

  application?: Application;

  @Prop({ type: String, ref: 'User', default: null })
  issuedById: string | null;

  issuedBy?: User | null;

  @Prop({ required: true })
  roleTitle: string;

  @Prop({ type: Number, required: true })
  salary: number;

  @Prop({ type: String, required: true })
  startDate: string;

  @Prop({ required: true })
  benefitsSummary: string;

  @Prop({
    type: String,
    enum: Object.values(OfferStatus),
    default: OfferStatus.ISSUED,
  })
  status: OfferStatus;

  @Prop({ type: String, default: null })
  candidateResponse: string | null;

  @Prop({ type: String, default: null })
  draftedLetter: string | null;

  @Prop({ type: Boolean, default: false })
  letterApproved: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);

OfferSchema.virtual('application', {
  ref: 'Application',
  localField: 'applicationId',
  foreignField: '_id',
  justOne: true,
});

OfferSchema.virtual('issuedBy', {
  ref: 'User',
  localField: 'issuedById',
  foreignField: '_id',
  justOne: true,
});
