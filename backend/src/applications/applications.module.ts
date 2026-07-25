import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './application.entity';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { CvScorerService } from './cv-scorer.service';
import { JobsModule } from '../jobs/jobs.module';
import { AiProxyModule } from '../ai-proxy/ai-proxy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application]),
    JobsModule,
    AiProxyModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, CvScorerService],
  exports: [ApplicationsService, CvScorerService],
})
export class ApplicationsModule {}
