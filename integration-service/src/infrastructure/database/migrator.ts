import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { config } from '../../config/environment';
import { Logger } from '../../utils/logger';

/**
 * Database Migration Manager
 * Handles running database migrations
 */
class DatabaseMigrator {
  private pool: Pool;
  private readonly logger: Logger;
  private readonly migrationsPath: string;

  constructor() {
    this.logger = new Logger({ service: 'DatabaseMigrator' });
    this.migrationsPath = join(__dirname, 'migrations');

    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    });
  }

  /**
   * Initializes migrations table
   */
  async initMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await this.pool.query(query);
    this.logger.info('Migrations table initialized');
  }

  /**
   * Gets list of applied migrations
   */
  async getAppliedMigrations(): Promise<string[]> {
    const result = await this.pool.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    return result.rows.map((row) => row.version);
  }

  /**
   * Gets list of pending migrations
   */
  async getPendingMigrations(): Promise<string[]> {
    const allMigrations = readdirSync(this.migrationsPath)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const appliedMigrations = await this.getAppliedMigrations();
    return allMigrations.filter((migration) => !appliedMigrations.includes(migration));
  }

  /**
   * Runs pending migrations
   */
  async runMigrations(): Promise<void> {
    await this.initMigrationsTable();

    const pendingMigrations = await this.getPendingMigrations();

    if (pendingMigrations.length === 0) {
      this.logger.info('No pending migrations');
      return;
    }

    this.logger.info(`Running ${pendingMigrations.length} migrations`);

    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }

    this.logger.info('All migrations completed successfully');
  }

  /**
   * Runs a single migration
   */
  private async runMigration(filename: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const migrationPath = join(this.migrationsPath, filename);
      const sql = readFileSync(migrationPath, 'utf-8');

      this.logger.info(`Running migration: ${filename}`);
      await client.query(sql);

      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [filename]);

      await client.query('COMMIT');
      this.logger.info(`Migration completed: ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Migration failed: ${filename}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Rolls back last migration
   */
  async rollbackLastMigration(): Promise<void> {
    const appliedMigrations = await this.getAppliedMigrations();

    if (appliedMigrations.length === 0) {
      this.logger.info('No migrations to rollback');
      return;
    }

    const lastMigration = appliedMigrations[appliedMigrations.length - 1];
    this.logger.warn(`Rolling back migration: ${lastMigration}`);

    await this.pool.query('DELETE FROM schema_migrations WHERE version = $1', [lastMigration]);
    this.logger.info(`Migration rolled back: ${lastMigration}`);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// CLI interface
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  const command = process.argv[2];

  (async () => {
    try {
      switch (command) {
        case 'up':
          await migrator.runMigrations();
          break;
        case 'down':
          await migrator.rollbackLastMigration();
          break;
        default:
          console.log('Usage: node migrator.js [up|down]');
          process.exit(1);
      }

      await migrator.close();
      process.exit(0);
    } catch (error) {
      console.error('Migration error:', error);
      await migrator.close();
      process.exit(1);
    }
  })();
}

export default DatabaseMigrator;
