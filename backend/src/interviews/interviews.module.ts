import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Interview, InterviewSchema } from './interview.entity';
import {
  Application,
  ApplicationSchema,
} from '../applications/application.entity';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { QuestionSuggesterService } from './question-suggester.service';
import { JobsModule } from '../jobs/jobs.module';
import { ApplicationsModule } from '../applications/applications.module';
import { AiProxyModule } from '../ai-proxy/ai-proxy.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Interview.name, schema: InterviewSchema },
      { name: Application.name, schema: ApplicationSchema },
    ]),
    JobsModule,
    ApplicationsModule,
    AiProxyModule,
    NotificationsModule,
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService, QuestionSuggesterService],
  exports: [InterviewsService, QuestionSuggesterService],
})
export class InterviewsModule {}
