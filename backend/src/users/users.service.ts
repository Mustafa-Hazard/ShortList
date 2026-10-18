import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.entity';
import { Role } from '../common/enums/role.enum';

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  companyId?: string | null;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async create(input: CreateUserInput): Promise<User> {
    const existing = await this.findByEmail(input.email);
    if (existing)
      throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(input.password, 10);
    try {
      const user = await this.userModel.create({
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        companyId: input.companyId ?? null,
      });
      return user.toObject();
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw err;
    }
  }

  async setRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { refreshTokenHash })
      .exec();
  }
}
