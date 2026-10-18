import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobPosting, JobPostingSchema } from './job-posting.entity';
import {
  Application,
  ApplicationSchema,
} from '../applications/application.entity';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JdGeneratorService } from './jd-generator.service';
import { AiProxyModule } from '../ai-proxy/ai-proxy.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobPosting.name, schema: JobPostingSchema },
      { name: Application.name, schema: ApplicationSchema },
    ]),
    AiProxyModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, JdGeneratorService],
  exports: [JobsService, JdGeneratorService],
})
export class JobsModule {}
