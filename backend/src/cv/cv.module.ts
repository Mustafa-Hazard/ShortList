import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cv } from './cv.entity';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cv]), ApplicationsModule],
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService],
})
export class CvModule {}
