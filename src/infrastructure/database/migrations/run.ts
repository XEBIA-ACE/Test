import * as fs from 'fs';
import * as path from 'path';
import { DatabaseConnection } from '../connection';
import { logger } from '../../logging/logger';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'notification_service',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  };

  const db = new DatabaseConnection(dbConfig);

  try {
    logger.info('Starting database migrations...');

    const migrationsDir = __dirname;
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      logger.info({ file }, `Running migration: ${file}`);

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await db.query(sql);

      logger.info({ file }, `Migration completed: ${file}`);
    }

    logger.info('All migrations completed successfully');
  } catch (error: any) {
    logger.error({ error: error.message }, 'Migration failed');
    throw error;
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runMigrations };
