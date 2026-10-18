import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';
import { User } from '../users/user.entity';

export enum NotificationType {
  APPLICATION_STAGE_CHANGED = 'application_stage_changed',
  INTERVIEW_PROPOSED = 'interview_proposed',
  INTERVIEW_CONFIRMED = 'interview_confirmed',
  INTERVIEW_REMINDER = 'interview_reminder',
  OFFER_ISSUED = 'offer_issued',
  OFFER_RESPONDED = 'offer_responded',
}

export type NotificationDocument = Notification & Document;

@Schema({
  collection: 'notifications',
  timestamps: { createdAt: true, updatedAt: false },
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
export class Notification {
  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  get id(): string {
    return this._id;
  }

  @Prop({ type: String, required: true, ref: 'User', index: true })
  userId: string;

  user?: User;

  @Prop({ type: String, enum: Object.values(NotificationType), required: true })
  type: NotificationType;

  @Prop({ type: Object, required: true })
  payload: Record<string, unknown>;

  @Prop({ type: Boolean, default: false })
  read: boolean;

  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});
