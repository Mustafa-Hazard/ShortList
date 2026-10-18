import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';
import { Application } from '../applications/application.entity';

export type CvDocument = Cv & Document;

@Schema({
  collection: 'cvs',
  timestamps: false,
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
export class Cv {
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

  @Prop({ required: true })
  originalFilename: string;

  @Prop({ required: true })
  storagePath: string;

  @Prop({ type: Number, required: true })
  fileSizeBytes: number;

  @Prop({ type: String, default: null })
  extractedText: string | null;

  @Prop({ type: Date, default: () => new Date() })
  uploadedAt: Date;
}

export const CvSchema = SchemaFactory.createForClass(Cv);

CvSchema.virtual('application', {
  ref: 'Application',
  localField: 'applicationId',
  foreignField: '_id',
  justOne: true,
});
