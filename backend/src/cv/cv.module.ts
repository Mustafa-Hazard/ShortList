import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cv, CvSchema } from './cv.entity';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cv.name, schema: CvSchema }]),
    ApplicationsModule,
  ],
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService],
})
export class CvModule {}
