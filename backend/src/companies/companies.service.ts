import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './company.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async create(name: string): Promise<Company> {
    const company = await this.companyModel.create({ name });
    return company.toObject();
  }

  async findById(id: string): Promise<Company> {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9-]+$/.test(id)) {
      throw new BadRequestException('Invalid company ID');
    }
    const company = await this.companyModel.findById(id).exec();
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }
}
