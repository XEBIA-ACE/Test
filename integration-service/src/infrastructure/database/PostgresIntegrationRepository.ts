import { Pool, PoolClient } from 'pg';
import { IIntegrationRepository, IntegrationFilters } from '../../domain/repositories/IIntegrationRepository';
import { Integration, IntegrationStatus } from '../../domain/entities/Integration';
import { Logger } from '../../utils/logger';
import { config } from '../../config/environment';
import { v4 as uuidv4 } from 'uuid';

/**
 * PostgreSQL Integration Repository Implementation
 * Data access layer for integration entities
 */
export class PostgresIntegrationRepository implements IIntegrationRepository {
  private pool: Pool;
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger({ service: 'PostgresIntegrationRepository' });

    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      min: config.database.poolMin,
      max: config.database.poolMax,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    });

    this.pool.on('error', (error) => {
      this.logger.error('Unexpected database pool error', error);
    });
  }

  async create(integration: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Integration> {
    const client = await this.pool.connect();

    try {
      const id = uuidv4();
      const now = new Date();

      const query = `
        INSERT INTO integrations (
          id, source_system, target_system, operation, payload,
          status, request_timestamp, metadata, retry_count,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        id,
        integration.sourceSystem,
        integration.targetSystem,
        integration.operation,
        JSON.stringify(integration.payload),
        integration.status,
        integration.requestTimestamp,
        integration.metadata ? JSON.stringify(integration.metadata) : null,
        integration.retryCount,
        now,
        now,
      ];

      const result = await client.query(query, values);
      this.logger.info('Integration created', { id });

      return this.mapRowToIntegration(result.rows[0]);
    } catch (error) {
      this.logger.error('Error creating integration', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Integration | null> {
    const client = await this.pool.connect();

    try {
      const query = 'SELECT * FROM integrations WHERE id = $1';
      const result = await client.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToIntegration(result.rows[0]);
    } catch (error) {
      this.logger.error('Error finding integration by ID', { id, error });
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(filters?: IntegrationFilters): Promise<Integration[]> {
    const client = await this.pool.connect();

    try {
      let query = 'SELECT * FROM integrations WHERE 1=1';
      const values: any[] = [];
      let paramIndex = 1;

      if (filters?.sourceSystem) {
        query += ` AND source_system = $${paramIndex++}`;
        values.push(filters.sourceSystem);
      }

      if (filters?.targetSystem) {
        query += ` AND target_system = $${paramIndex++}`;
        values.push(filters.targetSystem);
      }

      if (filters?.status) {
        query += ` AND status = $${paramIndex++}`;
        values.push(filters.status);
      }

      if (filters?.startDate) {
        query += ` AND created_at >= $${paramIndex++}`;
        values.push(filters.startDate);
      }

      if (filters?.endDate) {
        query += ` AND created_at <= $${paramIndex++}`;
        values.push(filters.endDate);
      }

      query += ' ORDER BY created_at DESC';

      if (filters?.limit) {
        query += ` LIMIT $${paramIndex++}`;
        values.push(filters.limit);
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex++}`;
        values.push(filters.offset);
      }

      const result = await client.query(query, values);
      return result.rows.map(this.mapRowToIntegration);
    } catch (error) {
      this.logger.error('Error finding integrations', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateStatus(id: string, status: IntegrationStatus, errorMessage?: string): Promise<Integration> {
    const client = await this.pool.connect();

    try {
      const query = `
        UPDATE integrations
        SET status = $1, error_message = $2, response_timestamp = $3, updated_at = $4
        WHERE id = $5
        RETURNING *
      `;

      const values = [status, errorMessage || null, new Date(), new Date(), id];
      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error(`Integration not found: ${id}`);
      }

      this.logger.info('Integration status updated', { id, status });
      return this.mapRowToIntegration(result.rows[0]);
    } catch (error) {
      this.logger.error('Error updating integration status', { id, error });
      throw error;
    } finally {
      client.release();
    }
  }

  async updateWithResponse(
    id: string,
    status: IntegrationStatus,
    data?: Record<string, unknown>,
    errorMessage?: string
  ): Promise<Integration> {
    const client = await this.pool.connect();

    try {
      const query = `
        UPDATE integrations
        SET status = $1, payload = $2, error_message = $3,
            response_timestamp = $4, updated_at = $5
        WHERE id = $6
        RETURNING *
      `;

      const values = [
        status,
        data ? JSON.stringify(data) : null,
        errorMessage || null,
        new Date(),
        new Date(),
        id,
      ];

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error(`Integration not found: ${id}`);
      }

      this.logger.info('Integration updated with response', { id, status });
      return this.mapRowToIntegration(result.rows[0]);
    } catch (error) {
      this.logger.error('Error updating integration with response', { id, error });
      throw error;
    } finally {
      client.release();
    }
  }

  async incrementRetryCount(id: string): Promise<Integration> {
    const client = await this.pool.connect();

    try {
      const query = `
        UPDATE integrations
        SET retry_count = retry_count + 1, updated_at = $1
        WHERE id = $2
        RETURNING *
      `;

      const result = await client.query(query, [new Date(), id]);

      if (result.rows.length === 0) {
        throw new Error(`Integration not found: ${id}`);
      }

      return this.mapRowToIntegration(result.rows[0]);
    } catch (error) {
      this.logger.error('Error incrementing retry count', { id, error });
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const client = await this.pool.connect();

    try {
      const query = 'DELETE FROM integrations WHERE id = $1';
      const result = await client.query(query, [id]);

      this.logger.info('Integration deleted', { id });
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      this.logger.error('Error deleting integration', { id, error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Maps database row to Integration entity
   */
  private mapRowToIntegration(row: any): Integration {
    return {
      id: row.id,
      sourceSystem: row.source_system,
      targetSystem: row.target_system,
      operation: row.operation,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
      status: row.status as IntegrationStatus,
      requestTimestamp: new Date(row.request_timestamp),
      responseTimestamp: row.response_timestamp ? new Date(row.response_timestamp) : undefined,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      errorMessage: row.error_message,
      retryCount: row.retry_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    this.logger.info('Database connection pool closed');
  }
}
