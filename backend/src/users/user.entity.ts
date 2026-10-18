import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';
import { Exclude } from 'class-transformer';
import { Role } from '../common/enums/role.enum';
import { Company } from '../companies/company.entity';

export type UserDocument = User & Document;

@Schema({
  collection: 'users',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      delete ret.refreshTokenHash;
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
export class User {
  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  get id(): string {
    return this._id;
  }

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Exclude()
  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ type: String, enum: Object.values(Role), default: Role.CANDIDATE })
  role: Role;

  @Prop({ type: String, ref: 'Company', default: null })
  companyId: string | null;

  company?: Company | null;

  @Exclude()
  @Prop({ type: String, default: null })
  refreshTokenHash: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true,
});
