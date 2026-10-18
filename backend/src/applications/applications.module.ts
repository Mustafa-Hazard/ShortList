import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from './application.entity';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { CvScorerService } from './cv-scorer.service';
import { JobsModule } from '../jobs/jobs.module';
import { AiProxyModule } from '../ai-proxy/ai-proxy.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
    ]),
    JobsModule,
    AiProxyModule,
    NotificationsModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, CvScorerService],
  exports: [ApplicationsService, CvScorerService, MongooseModule],
})
export class ApplicationsModule {}
