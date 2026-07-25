import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPosting } from './job-posting.entity';
import { Application } from '../applications/application.entity';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JobPosting, Application])],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
