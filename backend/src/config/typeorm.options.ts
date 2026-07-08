import { DataSourceOptions } from 'typeorm';
import { User } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { JobPosting } from '../jobs/job-posting.entity';
import { Application } from '../applications/application.entity';
import { Cv } from '../cv/cv.entity';
import { Interview } from '../interviews/interview.entity';
import { Offer } from '../offers/offer.entity';
import { Notification } from '../notifications/notification.entity';

export const entities = [
  User,
  Company,
  JobPosting,
  Application,
  Cv,
  Interview,
  Offer,
  Notification,
];

export function buildDataSourceOptions(env: NodeJS.ProcessEnv = process.env): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USERNAME ?? 'talentbridge',
    password: env.DB_PASSWORD ?? 'talentbridge',
    database: env.DB_NAME ?? 'talentbridge',
    entities,
    migrations: [__dirname + '/../migrations/*.{ts,js}'],
    // Never true outside local dev — schema changes must go through a
    // reviewed migration once you're past the first prototype (spec 5.1:
    // "Database migrations that run cleanly from scratch").
    synchronize: env.NODE_ENV === 'development' && env.TYPEORM_SYNC === 'true',
    logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  };
}
