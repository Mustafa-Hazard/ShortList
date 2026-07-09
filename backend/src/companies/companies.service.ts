import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';

@Injectable()
export class CompaniesService {
  constructor(@InjectRepository(Company) private companiesRepository: Repository<Company>) {}

  async create(name: string): Promise<Company> {
    const company = this.companiesRepository.create({ name });
    return this.companiesRepository.save(company);
  }

  async findById(id: string): Promise<Company> {
    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }
}
