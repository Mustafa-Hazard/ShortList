import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './offer.entity';
import { Application } from '../applications/application.entity';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { OfferDrafterService } from './offer-drafter.service';
import { JobsModule } from '../jobs/jobs.module';
import { ApplicationsModule } from '../applications/applications.module';
import { AiProxyModule } from '../ai-proxy/ai-proxy.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, Application]),
    JobsModule,
    ApplicationsModule,
    AiProxyModule,
    NotificationsModule,
  ],
  controllers: [OffersController],
  providers: [OffersService, OfferDrafterService],
  exports: [OffersService, OfferDrafterService],
})
export class OffersModule {}
