import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './typeorm.options';

@Module({
  imports: [
    // ConfigModule.forRoot() (registered globally in AppModule) has already
    // loaded .env into process.env by the time this factory runs, so
    // buildDataSourceOptions() (shared with the CLI in data-source.ts) can
    // read it directly — one source of truth for connection options.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => buildDataSourceOptions(process.env),
    }),
  ],
})
export class DatabaseModule {}
