import { Database as SqliteDatabase } from 'sqlite3'
import { inject, injectable } from 'inversify'

import { TYPES, Proposal, Setup } from './types'
import { DEFAULT_DB_PATH } from './config'

@injectable()
export class Database {
  db: SqliteDatabase

  constructor (dbFilePath: string = DEFAULT_DB_PATH) {
    this.db = new SqliteDatabase(dbFilePath, (err: Error | null) => {
      if (err) {
        console.log('Could not connect to database', err)
      } else {
        console.log('Connected to database')
      }
    })
  }

  run (sql: string, params: Array<any> = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          console.log('Error running sql ' + sql)
          console.log(err)
          reject(err)
        } else {
          resolve({ id: this.lastID })
        }
      })
    })
  }

  all<T> (sql: string, params: Array<any> = []): Promise<Array<T>> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, function (err, rows) {
        if (err) {
          reject(err)
        }
        resolve(rows)
      })
    })
  }

  get<T> (sql: string, params: Array<any> = []): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, function (err, row) {
        if (err) {
          reject(err)
        }
        resolve(row)
      })
    })
  }
}

@injectable()
export class SetupRepository {
  db: Database

  constructor (@inject(TYPES.Database) database: Database) {
    this.db = database
  }

  createTable () {
    const sql = `
      CREATE TABLE IF NOT EXISTS setup (
        role TEXT,
        daoName TEXT,
        guildId TEXT,
        channelId TEXT,
        channelName TEXT
      )
    `
    return this.db.run(sql)
  }

  async insert (setup: Setup) {
    const sql = `
      INSERT INTO setup (role, daoName, guildId, channelId, channelName)
      VALUES (?, ?, ?, ?, ?)
    `
    return await this.db.run(sql, [
      setup.role,
      setup.daoName,
      setup.guildId,
      setup.channelId,
      setup.channelName
    ])
  }

  async updateOnly (setup: Setup) {
    const sql = `
      UPDATE setup
      SET 
        role=?,
        daoName=?,
        guildId=?,
        channelId=?,
        channelName=?
    `
    return await this.db.run(sql, [
      setup.role,
      setup.daoName,
      setup.guildId,
      setup.channelId,
      setup.channelName
    ])
  }

  async getSetup (): Promise<Setup> {
    const sql = `
      SELECT *
      FROM setup
    `
    // FIXME: handle undefined
    const result = await this.db.all<Setup>(sql)
    return result?.[0]
  }
}

@injectable()
export class ProposalRepository {
  db: Database

  constructor (@inject(TYPES.Database) database: Database) {
    this.db = database
  }

  createTable () {
    const sql = `
      CREATE TABLE IF NOT EXISTS proposals (
        messageId TEXT,
        channelId TEXT,
        guildId TEXT,
        description TEXT,
        createdAt NUMERIC,
        deadline NUMERIC,
        daoName TEXT
      )
    `
    return this.db.run(sql)
  }

  async insert (proposal: Proposal) {
    const sql = `
        INSERT INTO proposals (messageId, channelId, guildId, description, createdAt, deadline, daoName)
        VALUES (?, ?, ?, ?, ?, ?, ?) 
    `

    return await this.db.run(sql, [
      proposal.messageId,
      proposal.channelId,
      proposal.guildId,
      proposal.description,
      proposal.createdAt,
      proposal.deadline,
      proposal.daoName
    ])
  }

  async getActives (): Promise<Array<Proposal>> {
    const sql = `
      SELECT *
      FROM proposals
      WHERE deadline > ?
    `

    return await this.db.all<Proposal>(sql, [Date.now()])
  }

  async getActive (id: string): Promise<Proposal> {
    const sql = `
      SELECT *
      FROM proposals
      WHERE (deadline > ?) AND messageId = ?
    `

    return await this.db.get<Proposal>(sql, [Date.now(), id])
  }
}
