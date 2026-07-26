import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPosting } from './job-posting.entity';
import { Application } from '../applications/application.entity';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JdGeneratorService } from './jd-generator.service';
import { AiProxyModule } from '../ai-proxy/ai-proxy.module';

@Module({
  imports: [TypeOrmModule.forFeature([JobPosting, Application]), AiProxyModule],
  controllers: [JobsController],
  providers: [JobsService, JdGeneratorService],
  exports: [JobsService, JdGeneratorService],
})
export class JobsModule {}
