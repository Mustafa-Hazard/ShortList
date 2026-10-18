import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Offer, OfferSchema } from './offer.entity';
import {
  Application,
  ApplicationSchema,
} from '../applications/application.entity';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { OfferDrafterService } from './offer-drafter.service';
import { JobsModule } from '../jobs/jobs.module';
import { ApplicationsModule } from '../applications/applications.module';
import { AiProxyModule } from '../ai-proxy/ai-proxy.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Offer.name, schema: OfferSchema },
      { name: Application.name, schema: ApplicationSchema },
    ]),
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
