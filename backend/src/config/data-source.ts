import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './typeorm.options';

// Used only by the TypeORM CLI (npm run migration:*), which needs a plain
// DataSource outside of Nest's DI container. The running app builds its own
// connection via TypeOrmModule.forRootAsync in app.module.ts, using the same
// buildDataSourceOptions() so both stay in sync.
export default new DataSource(buildDataSourceOptions(process.env));
