import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interview } from './interview.entity';
import { Application } from '../applications/application.entity';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { QuestionSuggesterService } from './question-suggester.service';
import { JobsModule } from '../jobs/jobs.module';
import { ApplicationsModule } from '../applications/applications.module';
import { AiProxyModule } from '../ai-proxy/ai-proxy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Interview, Application]),
    JobsModule,
    ApplicationsModule,
    AiProxyModule,
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService, QuestionSuggesterService],
  exports: [InterviewsService, QuestionSuggesterService],
})
export class InterviewsModule {}
