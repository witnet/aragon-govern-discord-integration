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

    expect(result).toStrictEqual({ changes: 0, lastID: 0 })
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

    expect(result).toStrictEqual({ lastID: 1, changes: 1 })
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
        guildId TEXT,
        channelId TEXT,
        channelName TEXT
      )
    `
    const result = await new Promise((resolve, reject) => {
      setTimeout(async () => {
        resolve(db.run(sql))
      }, 1000)
    })

    expect(result).toStrictEqual({ lastID: 0, changes: 0 })
  })

  it('should allow insert rows', async () => {
    const db = new Database('./bot.db')

    const createTableSql = `
      CREATE TABLE IF NOT EXISTS setup (
        role TEXT,
        daoName TEXT,
        guildId TEXT,
        channelId TEXT,
        channelName TEXT
      )
    `

    const insertSql = `
        INSERT INTO setup (role, daoName, guildId, channelId, channelName)
        VALUES (?, ?, ?, ?, ?) 
    `

    const result = await new Promise((resolve, reject) => {
      setTimeout(async () => {
        const role = 'admin'
        const daoName = 'bitconnect'
        const guildId = '1234'
        const channelId = '1234'
        const channelName = 'general'
        await db.run(createTableSql)
        const a = await db.run(insertSql, [
          role,
          daoName,
          guildId,
          channelId,
          channelName
        ])
        resolve(a)
      }, 1000)
    })

    expect(result).toStrictEqual({ lastID: 1, changes: 1 })
  })

  it('all method should return stored elements', async () => {
    const db = new Database('./bot.db')
    const role = 'admin'
    const daoName = 'bitconnect'
    const guildId = '1234'
    const channelId = '1234'
    const channelName = 'general'
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
      guildId,
      channelId,
      channelName
    }
    const expected = [row]

    expect(result).toEqual(expected)
  })

  it('should update elements', async () => {
    const db = new Database('./bot.db')
    const role = '@everybody'
    const daoName = 'bitconnect'
    const guildId = '1234'
    const channelId = '1234'
    const channelName = 'general'
    const result = await new Promise((resolve, reject) => {
      setTimeout(async () => {
        const updateSql = `
          UPDATE setup
          SET 
            role=?,
            daoName=?,
            guildId=?,
            channelId=?,
            channelName=?
        `
        const sql = `SELECT * FROM setup`
        await db.all(updateSql, [
          role,
          daoName,
          guildId,
          channelId,
          channelName
        ])
        const a = await db.all(sql)
        resolve(a)
      }, 1000)
    })

    const row = {
      role,
      daoName,
      guildId,
      channelId,
      channelName
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
        guildId TEXT,
        channelId TEXT,
        channelName TEXT
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
    const channelId = '1234'
    const channelName = 'general'

    const setupRepository = new SetupRepository(database)

    await setupRepository.insert({
      role,
      daoName,
      guildId,
      channelId,
      channelName
    })
  })
  it('update values in setup table', async () => {
    const database = new Database()
    const runMock = jest.fn()
    database.run = runMock

    const role = 'admin'
    const daoName = 'bitconnect'
    const guildId = '1234'
    const channelId = '1234'
    const channelName = 'general'

    const setupRepository = new SetupRepository(database)
    await setupRepository.updateOnly({
      role,
      daoName,
      guildId,
      channelId,
      channelName
    })

    const sql = `
      UPDATE setup
      SET 
        role=?,
        daoName=?,
        guildId=?,
        channelId=?,
        channelName=?
    `
    expect(runMock).toHaveBeenNthCalledWith(1, sql, [
      role,
      daoName,
      guildId,
      channelId,
      channelName
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
    const to = 'to'
    const value = 'value'
    const data = 'data'
    const action = {
      to,
      value,
      data
    }
    const proposalRepository = new ProposalRepository(database)

    proposalRepository.insert({
      messageId,
      channelId,
      guildId,
      description,
      createdAt,
      deadline,
      daoName,
      action
      // report: {
      //   payload: {
      //     allowsFailuresMap: 'allowsFailersMap',
      //     executionTime: 'executionTime',
      //     nonce: 'nonce',
      //     proof: 'proof',
      //     submitter: 'submitter',
      //     actions: [
      //       {
      //         data: 'data1',
      //         to: 'to1',
      //         value: 'value1'
      //       },
      //       {
      //         data: 'data2',
      //         to: 'to2',
      //         value: 'value2'
      //       }
      //     ]
      //   },
      //   transactionHash: 'hash'
      // }
    })

    const sql = `
        INSERT INTO proposals (messageId, channelId, guildId, description, createdAt, deadline, daoName, actionTo, actionValue, actionData, executeError, scheduleError, drTxHash, report)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    expect(runMock).toHaveBeenNthCalledWith(1, sql, [
      messageId,
      channelId,
      guildId,
      description,
      createdAt,
      deadline,
      daoName,
      'to',
      'value',
      'data',
      0,
      0,
      '',
      undefined
    ])
  })

  it('getActives should call all', async () => {
    const database = new Database()
    const allMock = jest.fn()

    database.all = allMock

    const proposalRepository = new ProposalRepository(database)

    await proposalRepository.getActives()
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
          daoName,
          action: {
            data: 'data',
            to: 'to',
            value: 'value'
          }
        })

        await proposalRepository.insert({
          messageId,
          channelId,
          guildId,
          description,
          createdAt: oldCreatedAt,
          deadline: oldDeadline,
          daoName,
          action: {
            data: 'data',
            to: 'to',
            value: 'value'
          }
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
      daoName,
      action: {
        data: 'data',
        to: 'to',
        value: 'value'
      },
      drTxHash: '',
      executeError: false,
      scheduleError: false,
      report: null
    }
    const expected = [row]

    expect(result).toEqual(expected)
  })

  it.todo('setScheduleReport should add a scheduleReport to the proposal')

  it('setDrTxHash should add a drTxHash to the proposal', async () => {
    const database = new Database('./bot.db')

    const proposalRepository = new ProposalRepository(database)

    const messageId = '1'
    const channelId = '2'
    const guildId = '3'
    const description = 'description'
    const createdAt = Date.now()
    const deadline = Date.now() + 1000000
    const daoName = 'bitconnect'

    await proposalRepository.createTable()

    await proposalRepository.insert({
      messageId,
      channelId,
      guildId,
      description,
      createdAt,
      deadline,
      daoName,
      action: {
        data: 'data',
        to: 'to',
        value: 'value'
      }
    })

    await proposalRepository.setDrTxHash(messageId, 'drTxHash')

    const proposal = await proposalRepository.getProposalByMessageId(messageId)
    console.log('proposal')
    expect(proposal.drTxHash).toStrictEqual('drTxHash')
  })

  it('getProposalById should return a proposal', async () => {
    const database = new Database('./bot.db')

    const proposalRepository = new ProposalRepository(database)

    const messageId = '1'
    const channelId = '2'
    const guildId = '3'
    const description = 'description'
    const createdAt = Date.now()
    const deadline = Date.now() + 1000000
    const daoName = 'bitconnect'
    await proposalRepository.createTable()
    await proposalRepository.insert({
      messageId,
      channelId,
      guildId,
      description,
      createdAt,
      deadline,
      daoName,
      action: {
        data: 'data',
        to: 'to',
        value: 'value'
      }
    })

    const proposal = await proposalRepository.getProposalByMessageId(messageId)
    const expected = {
      action: {
        data: 'data',
        to: 'to',
        value: 'value'
      },
      channelId: '2',
      createdAt: 1623053264901,
      daoName: 'bitconnect',
      deadline: 1633053264901,
      description: 'description',
      drTxHash: '',
      executeError: false,
      guildId: '3',
      messageId: '1',
      report: null,
      scheduleError: false
    }
    expect(proposal).toStrictEqual(expected)
  })

  it('addScheduleError', async () => {
    const database = new Database('./bot.db')

    const proposalRepository = new ProposalRepository(database)

    const messageId = '1'
    const channelId = '2'
    const guildId = '3'
    const description = 'description'
    const createdAt = Date.now()
    const deadline = Date.now() + 1000000
    const daoName = 'bitconnect'
    await proposalRepository.createTable()
    await proposalRepository.insert({
      messageId,
      channelId,
      guildId,
      description,
      createdAt,
      deadline,
      daoName,
      action: {
        data: 'data',
        to: 'to',
        value: 'value'
      }
    })

    await proposalRepository.addScheduleError(messageId)

    const activeProposals = await proposalRepository.getActives()

    expect(activeProposals[0].scheduleError).toBe(true)
  })

  it('addExecuteError', async () => {
    const database = new Database('./bot.db')

    const proposalRepository = new ProposalRepository(database)

    const messageId = '1'
    const channelId = '2'
    const guildId = '3'
    const description = 'description'
    const createdAt = Date.now()
    const deadline = Date.now() + 1000000
    const daoName = 'bitconnect'
    await proposalRepository.createTable()
    await proposalRepository.insert({
      messageId,
      channelId,
      guildId,
      description,
      createdAt,
      deadline,
      daoName,
      action: {
        data: 'data',
        to: 'to',
        value: 'value'
      }
    })

    await proposalRepository.addExecuteError(messageId)

    const activeProposals = await proposalRepository.getActives()

    expect(activeProposals[0].executeError).toBe(true)
  })

  it('removeScheduleError', async () => {
    const database = new Database('./bot.db')

    const proposalRepository = new ProposalRepository(database)

    const messageId = '1'
    const channelId = '2'
    const guildId = '3'
    const description = 'description'
    const createdAt = Date.now()
    const deadline = Date.now() + 1000000
    const daoName = 'bitconnect'
    await proposalRepository.createTable()
    await proposalRepository.insert({
      messageId,
      channelId,
      guildId,
      description,
      createdAt,
      deadline,
      daoName,
      action: {
        data: 'data',
        to: 'to',
        value: 'value'
      }
    })
    await proposalRepository.addScheduleError(messageId)

    await proposalRepository.removeScheduleError(messageId)

    const activeProposals = await proposalRepository.getActives()
    expect(activeProposals[0].scheduleError).toBe(false)
  })

  it('removeExecuteError', async () => {
    const database = new Database('./bot.db')

    const proposalRepository = new ProposalRepository(database)

    const messageId = '1'
    const channelId = '2'
    const guildId = '3'
    const description = 'description'
    const createdAt = Date.now()
    const deadline = Date.now() + 1000000
    const daoName = 'bitconnect'
    await proposalRepository.createTable()
    await proposalRepository.insert({
      messageId,
      channelId,
      guildId,
      description,
      createdAt,
      deadline,
      daoName,
      action: {
        data: 'data',
        to: 'to',
        value: 'value'
      }
    })
    await proposalRepository.addExecuteError(messageId)

    await proposalRepository.removeExecuteError(messageId)

    const activeProposals = await proposalRepository.getActives()
    expect(activeProposals[0].executeError).toBe(false)
  })
})
