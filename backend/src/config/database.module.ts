import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGODB_URI') ||
          process.env.MONGODB_URI ||
          'mongodb://localhost:27017/shortlist',
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
