import { Guild } from 'discord.js'
import 'reflect-metadata'

import { Database, ProposalRepository, SetupRepository } from '../src/database'

async function clearDatabase (table: 'proposals' | 'setup') {
  const db = new Database('./bot.db')

  const sql = `DROP TABLE IF EXISTS ${table}`

  return await new Promise((resolve, reject) => {
    setTimeout(async () => {
      resolve(db.run(sql))
    }, 1000)
  })
}

describe('database', () => {
  afterAll(() => {
    return clearDatabase('proposals')
  })

  it('should allow create table', async () => {
    const db = new Database('./bot.db')

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
    const result = await new Promise((resolve, reject) => {
      setTimeout(async () => {
        resolve(db.run(sql))
      }, 1000)
    })

    expect(result).toStrictEqual({ id: 0 })
  })

  it('should allow insert rows', async () => {
    const db = new Database('./bot.db')

    const createTableSql = `
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

    const insertSql = `
        INSERT INTO proposals (messageId, channelId, guildId, description, createdAt, deadline, daoName)
        VALUES (?, ?, ?, ?, ?, ?, ?) 
    `

    const result = await new Promise((resolve, reject) => {
      setTimeout(async () => {
        const messageId = '1'
        const channelId = '2'
        const guildId = '3'
        const description = 'description'
        const createdAt = 1623053264901
        const deadline = 1633053264901
        const daoName = 'bitconnect'
        await db.run(createTableSql)
        const a = await db.run(insertSql, [
          messageId,
          channelId,
          guildId,
          description,
          createdAt,
          deadline,
          daoName
        ])
        resolve(a)
      }, 1000)
    })

    expect(result).toStrictEqual({ id: 1 })
  })

  it('all method should return stored elements', async () => {
    const db = new Database('./bot.db')
    const messageId = '1'
    const channelId = '2'
    const guildId = '3'
    const description = 'description'
    const createdAt = 1623053264901
    const deadline = 1633053264901
    const daoName = 'bitconnect'
    const result = await new Promise((resolve, reject) => {
      setTimeout(async () => {
        const createTableSql = `
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
        const insertSql = `
            INSERT INTO proposals (messageId, channelId, guildId, description, createdAt, deadline, daoName)
            VALUES (?, ?, ?, ?, ?, ?, ?) 
        `
        await db.run(createTableSql)
        await db.run(insertSql, [
          messageId,
          channelId,
          guildId,
          description,
          createdAt,
          deadline,
          daoName
        ])
        await db.run(insertSql, [
          messageId,
          channelId,
          guildId,
          description,
          createdAt,
          deadline,
          daoName
        ])

        const sql = `SELECT * FROM proposals`
        const a = await db.all(sql)
        resolve(a)
      }, 1000)
    })

    const row = {
      messageId,
      channelId,
      guildId,
      description,
      createdAt,
      deadline,
      daoName
    }
    const expected = [row, row, row]

    expect(result).toEqual(expected)
  })
})

describe('setup database', () => {
  afterAll(() => {
    return clearDatabase('setup')
  })

  it('should allow create table', async () => {
    const db = new Database('./bot.db')

    const sql = `
      CREATE TABLE IF NOT EXISTS setup (
        role TEXT,
        daoName TEXT,
        guildId TEXT
      )
    `
    const result = await new Promise((resolve, reject) => {
      setTimeout(async () => {
        resolve(db.run(sql))
      }, 1000)
    })

    expect(result).toStrictEqual({ id: 0 })
  })

  it('should allow insert rows', async () => {
    const db = new Database('./bot.db')

    const createTableSql = `
      CREATE TABLE IF NOT EXISTS setup (
        role TEXT,
        daoName TEXT,
        guildId TEXT
      )
    `

    const insertSql = `
        INSERT INTO setup (role, daoName, guildId)
        VALUES (?, ?, ?) 
    `

    const result = await new Promise((resolve, reject) => {
      setTimeout(async () => {
        const role = 'admin'
        const daoName = 'bitconnect'
        const guildId = '1234'
        await db.run(createTableSql)
        const a = await db.run(insertSql, [
          role,
          daoName,
          guildId
        ])
        resolve(a)
      }, 1000)
    })

    expect(result).toStrictEqual({ id: 1 })
  })

  it('all method should return stored elements', async () => {
    const db = new Database('./bot.db')
    const role = 'admin'
    const daoName = 'bitconnect'
    const guildId = '1234'
    const result = await new Promise((resolve, reject) => {
      setTimeout(async () => {
        const sql = `SELECT * FROM setup`
        const a = await db.all(sql)
        resolve(a)
      }, 1000)
    })

    const row = {
      role,
      daoName,
      guildId
    }
    const expected = [row]

    expect(result).toEqual(expected)
  })

  it('should update elements', async () => {
    const db = new Database('./bot.db')
    const role = '@everybody'
    const daoName = 'bitconnect'
    const guildId = '1234'
    const result = await new Promise((resolve, reject) => {
      setTimeout(async () => {
        const updateSql = `
          UPDATE setup
          SET 
            role=?,
            daoName=?,
            guildId=?
        `
        const sql = `SELECT * FROM setup`
        await db.all(updateSql, [role, daoName, guildId])
        const a = await db.all(sql)
        resolve(a)
      }, 1000)
    })

    const row = {
      role,
      daoName,
      guildId
    }
    const expected = [row]

    expect(result).toEqual(expected)
  })
})

describe('SetupRepository', () => {
  afterAll(() => {
    return clearDatabase('setup')
  })
  it('create table setup', async () => {
    const database = new Database()
    const runMock = jest.fn()
    database.run = runMock
    const setupRepository = new SetupRepository(database)
    await setupRepository.createTable()

    const sql = `
      CREATE TABLE IF NOT EXISTS setup (
        role TEXT,
        daoName TEXT,
        guildId TEXT
      )
    `
    expect(runMock).toHaveBeenNthCalledWith(1, sql)
  })
  it('inset values into setup table', async () => {
    const database = new Database()
    const runMock = jest.fn()

    database.run = runMock

    const role = 'admin'
    const daoName = 'bitconnect'
    const guildId = '1234'

    const setupRepository = new SetupRepository(database)

    await setupRepository.insert({
      role,
      daoName,
      guildId
    })
  })
  it('update values in setup table', async() => {
    const database = new Database()
    const runMock = jest.fn()
    database.run = runMock

    const role = 'admin'
    const daoName = 'bitconnect'
    const guildId = '1234'
    
    const setupRepository = new SetupRepository(database)
    await setupRepository.updateOnly({
      role,
      daoName,
      guildId
    })

    const sql = `
      UPDATE setup
      SET 
        role=?,
        daoName=?,
        guildId=?
    `
    expect(runMock).toHaveBeenNthCalledWith(1, sql, [
      role,
      daoName,
      guildId
    ])
  })
  it('update setup values', () => {
    const database = new Database()
    const allMock = jest.fn()

    database.all = allMock

    const setupRepository = new SetupRepository(database)

    setupRepository.getSetup()

    const sql = `
      SELECT *
      FROM setup
    `
    expect(allMock.mock.calls[0][0]).toBe(sql)
    expect(typeof allMock.mock.calls[0][0]).toBe('string')
  })
})

describe('ProposalRepository', () => {
  afterAll(() => {
    return clearDatabase('proposals')
  })

  it('createTable should create a proposals table', async () => {
    const database = new Database()
    const runMock = jest.fn()

    database.run = runMock

    const proposalRepository = new ProposalRepository(database)

    proposalRepository.createTable()

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

    expect(runMock).toHaveBeenNthCalledWith(1, sql)
  })

  it('insert should call run with name, createdAt and finishAt', () => {
    const database = new Database()
    const runMock = jest.fn()

    database.run = runMock

    const messageId = '1'
    const channelId = '2'
    const guildId = '3'
    const description = 'description'
    const createdAt = 1613053264901
    const deadline = 1633053264901
    const daoName = 'bitconnect'

    const proposalRepository = new ProposalRepository(database)

    proposalRepository.insert({
      messageId,
      channelId,
      guildId,
      description,
      createdAt,
      deadline,
      daoName
    })

    const sql = `
        INSERT INTO proposals (messageId, channelId, guildId, description, createdAt, deadline, daoName)
        VALUES (?, ?, ?, ?, ?, ?, ?) 
    `

    expect(runMock).toHaveBeenNthCalledWith(1, sql, [
      messageId,
      channelId,
      guildId,
      description,
      createdAt,
      deadline,
      daoName
    ])
  })

  it('getActives should call all', () => {
    const database = new Database()
    const allMock = jest.fn()

    database.all = allMock

    const proposalRepository = new ProposalRepository(database)

    proposalRepository.getActives()
    const sql = `
      SELECT *
      FROM proposals
      WHERE deadline > ?
    `
    expect(allMock.mock.calls[0][0]).toBe(sql)
    expect(typeof allMock.mock.calls[0][1][0]).toBe('number')
  })

  it('getActives should return only active proposals', async () => {
    const database = new Database('./bot.db')

    const proposalRepository = new ProposalRepository(database)

    const messageId = '1'
    const channelId = '2'
    const guildId = '3'
    const description = 'description'
    const createdAt = 1623053264901
    const deadline = 1633053264901
    const daoName = 'bitconnect'

    const oldCreatedAt = 1513054659827
    const oldDeadline = 1513054659827

    const result = await new Promise((resolve, reject) => {
      setTimeout(async () => {
        await proposalRepository.createTable()
        await proposalRepository.insert({
          messageId,
          channelId,
          guildId,
          description,
          createdAt,
          deadline,
          daoName
        })
        await proposalRepository.insert({
          messageId,
          channelId,
          guildId,
          description,
          createdAt: oldCreatedAt,
          deadline: oldDeadline,
          daoName
        })

        const activeProposals = await proposalRepository.getActives()
        resolve(activeProposals)
      }, 1000)
    })

    const row = {
      messageId,
      channelId,
      guildId,
      description,
      createdAt,
      deadline,
      daoName
    }
    const expected = [row]

    expect(result).toEqual(expected)
  })
})
