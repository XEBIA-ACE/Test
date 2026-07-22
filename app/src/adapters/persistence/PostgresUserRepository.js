'use strict';

const IUserRepository = require('../../domain/ports/IUserRepository');
const User = require('../../domain/entities/User');
const { getPool } = require('../../infrastructure/database/connection');

/**
 * PostgreSQL implementation of IUserRepository.
 */
class PostgresUserRepository extends IUserRepository {
  /**
   * @param {import('../../domain/entities/User')} user
   * @returns {Promise<import('../../domain/entities/User')>}
   */
  async save(user) {
    const pool = getPool();
    const query = `
      INSERT INTO users
        (id, email, mobile, password_hash, first_name, last_name, status,
         oauth_provider, oauth_subject, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `;
    const values = [
      user.id,
      user.email,
      user.mobile,
      user.passwordHash,
      user.firstName,
      user.lastName,
      user.status,
      user.oauthProvider,
      user.oauthSubject,
      user.createdAt,
      user.updatedAt,
    ];
    const { rows } = await pool.query(query, values);
    return this._toEntity(rows[0]);
  }

  /**
   * @param {string} id
   * @returns {Promise<import('../../domain/entities/User') | null>}
   */
  async findById(id) {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {string} email
   * @returns {Promise<import('../../domain/entities/User') | null>}
   */
  async findByEmail(email) {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [
      email.toLowerCase().trim(),
    ]);
    return rows[0] ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {string} mobile
   * @returns {Promise<import('../../domain/entities/User') | null>}
   */
  async findByMobile(mobile) {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM users WHERE mobile = $1', [mobile]);
    return rows[0] ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {import('../../domain/entities/User')} user
   * @returns {Promise<import('../../domain/entities/User')>}
   */
  async update(user) {
    const pool = getPool();
    user.updatedAt = new Date();
    const query = `
      UPDATE users
      SET email=$2, mobile=$3, password_hash=$4, first_name=$5, last_name=$6,
          status=$7, oauth_provider=$8, oauth_subject=$9, updated_at=$10
      WHERE id=$1
      RETURNING *
    `;
    const values = [
      user.id,
      user.email,
      user.mobile,
      user.passwordHash,
      user.firstName,
      user.lastName,
      user.status,
      user.oauthProvider,
      user.oauthSubject,
      user.updatedAt,
    ];
    const { rows } = await pool.query(query, values);
    return this._toEntity(rows[0]);
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    const pool = getPool();
    await pool.query(
      "UPDATE users SET status='DELETED', updated_at=NOW() WHERE id=$1",
      [id]
    );
  }

  /**
   * Map a raw DB row to a User entity.
   * @param {object} row
   * @returns {import('../../domain/entities/User')}
   */
  _toEntity(row) {
    return new User({
      id: row.id,
      email: row.email,
      mobile: row.mobile,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      status: row.status,
      oauthProvider: row.oauth_provider,
      oauthSubject: row.oauth_subject,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

module.exports = PostgresUserRepository;
