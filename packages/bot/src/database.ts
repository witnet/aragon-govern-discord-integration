import { Database as SqliteDatabase } from 'sqlite3'
import { inject, injectable } from 'inversify'

import {
  TYPES,
  Proposal,
  Setup,
  DbProposal,
  ScheduleReport,
  RunResult
} from './types'
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

  run (sql: string, params: Array<any> = []): Promise<RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          console.log('Error running sql ' + sql)
          console.log(err)
          reject(err)
        } else {
          resolve({ lastID: this.lastID, changes: this.changes })
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
    console.log(`[BOT]: inserting setup`, setup)
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
    console.log(`[BOT]: updating setup`, setup)
    const sql = `
      UPDATE setup
      SET 
        role=?,
        daoName=?,
        guildId=?,
        channelId=?,
        channelName=?
      WHERE channelId = ?
    `

    return await this.db.run(sql, [
      setup.role,
      setup.daoName,
      setup.guildId,
      setup.channelId,
      setup.channelName,
      setup.channelId
    ])
  }

  async getSetupByChannelId (channelId: string): Promise<Setup> {
    console.log(`[BOT]: looking for setup by channelId`, channelId)

    const sql = `
      SELECT *
      FROM setup
      WHERE channelId = ?
    `

    const result = await this.db.get<Setup>(sql, [channelId])
    console.log(`[BOT]: setup by channelId: ${channelId} found`, result)
    return result
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
        daoName TEXT,
        executeError NUMERIC,
        scheduleError NUMERIC,
        actionTo TEXT,
        actionValue TEXT,
        actionData TEXT,
        drTxHash TEXT,
        report BLOB
      )
    `
    return this.db.run(sql)
  }

  async insert (proposal: Proposal) {
    console.log(`[BOT]: inserting proposal`, proposal)
    const sql = `
        INSERT INTO proposals (messageId, channelId, guildId, description, createdAt, deadline, daoName, actionTo, actionValue, actionData, executeError, scheduleError, drTxHash, report)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    return await this.db.run(sql, [
      proposal.messageId,
      proposal.channelId,
      proposal.guildId,
      proposal.description,
      proposal.createdAt,
      proposal.deadline,
      proposal.daoName,
      proposal.action.to,
      proposal.action.value,
      proposal.action.data,
      proposal.executeError || 0,
      proposal.scheduleError || 0,
      proposal.drTxHash || '',
      proposal.report
    ])
  }

  async getActives (): Promise<Array<Proposal>> {
    console.log(`[BOT]: looking for active proposals`)
    const sql = `
      SELECT *
      FROM proposals
      WHERE deadline > ?
    `

    const activeDbProposals: Array<DbProposal> =
      (await this.db.all<DbProposal>(sql, [Date.now()])) || []

    console.log(`[BOT]: active proposals found`, activeDbProposals)
    return await Promise.all(activeDbProposals.map(this._normalizeProposal))
  }

  async getActive (messageId: string): Promise<Proposal | null> {
    console.log(`[BOT]: looking for active proposal for messageId ${messageId}`)
    const sql = `
      SELECT *
      FROM proposals
      WHERE (deadline > ?) AND messageId = ?
    `

    const activeDbProposal = await this.db.get<DbProposal>(sql, [
      Date.now(),
      messageId
    ])

    if (activeDbProposal) {
      console.log(
        `[BOT]: active proposal for messageId ${messageId} found: `,
        activeDbProposal
      )
      return this._normalizeProposal(activeDbProposal)
    } else {
      console.error(
        `[BOT]: active proposal for messageId ${messageId} not found`
      )
      return null
    }
  }

  async removeExecuteError (messageId: string): Promise<RunResult> {
    console.log(`[BOT]: removing ExecuteError for messageId ${messageId}`)
    return this._updateError('executeError', 0, messageId)
  }

  async removeScheduleError (messageId: string): Promise<RunResult> {
    console.log(`[BOT]: removing ScheduleError for messageId ${messageId}`)
    return this._updateError('scheduleError', 0, messageId)
  }

  async addExecuteError (messageId: string): Promise<RunResult> {
    console.log(`[BOT]: saving ExecuteError for messageId ${messageId}`)
    return this._updateError('executeError', 1, messageId)
  }

  async addScheduleError (messageId: string): Promise<RunResult> {
    console.log(`[BOT]: saving ScheduleError for messageId ${messageId}`)
    return this._updateError('scheduleError', 1, messageId)
  }

  async getProposalByMessageId (messageId: string): Promise<Proposal | null> {
    console.log(`[BOT]: looking for proposal by messageId ${messageId}`)
    const sql = `
      SELECT *
      FROM proposals
      WHERE messageId = ?
    `

    const activeDbProposal = await this.db.get<DbProposal>(sql, [messageId])
    if (activeDbProposal) {
      console.log(
        `[BOT]: active proposal for message: ${messageId} found`,
        activeDbProposal
      )
      return this._normalizeProposal(activeDbProposal)
    } else {
      console.log(`[BOT]: active proposal for message: ${messageId} not found`)
      return null
    }
  }

  async setDrTxHash (messageId: string, drTxHash: string): Promise<RunResult> {
    console.log(
      `[BOT]: saving drTxHash: ${drTxHash} for messageId: ${messageId}`
    )
    const sql = `
      UPDATE proposals
      SET drTxHash=?
      WHERE messageId=?
    `

    return await this.db.run(sql, [drTxHash, messageId])
  }

  async setScheduleReport (messageId: string, scheduleReport: ScheduleReport) {
    const reportAsText = new Blob([JSON.stringify(scheduleReport)], {
      type: 'text/plain'
    })

    const sql = `
      UPDATE proposals
      set
        report=?
      WHERE messageId=?
    `

    return await this.db.run(sql, [reportAsText, messageId])
  }

  async _updateError (
    errorName: 'scheduleError' | 'executeError',
    hasError: 0 | 1,
    messageId: string
  ): Promise<RunResult> {
    const sql =
      errorName === 'scheduleError'
        ? `
      UPDATE proposals 
      SET 
        scheduleError=?
      WHERE messageId=?
    `
        : `
      UPDATE proposals 
      SET 
        executeError=?
      WHERE messageId=?
    `
    return await this.db.run(sql, [hasError, messageId])
  }

  async _normalizeProposal (dbProposal: DbProposal): Promise<Proposal> {
    return {
      channelId: dbProposal.channelId,
      createdAt: dbProposal.createdAt,
      daoName: dbProposal.daoName,
      deadline: dbProposal.deadline,
      description: dbProposal.description,
      guildId: dbProposal.guildId,
      messageId: dbProposal.messageId,
      drTxHash: dbProposal.drTxHash,
      executeError: !!dbProposal.executeError,
      scheduleError: !!dbProposal.scheduleError,
      action: {
        data: dbProposal.actionData,
        to: dbProposal.actionTo,
        value: dbProposal.actionValue
      },
      report: JSON.parse((await dbProposal?.report?.text()) || 'null')
    }
  }
}
