import 'reflect-metadata'

require('dotenv').config()

import { TYPES } from './types'
import container from './inversify.config'
import { Bot } from './bot'

export const bot = container.get<Bot>(TYPES.Bot)

const listenArgumentFound = process.argv.slice(2)?.[0]

if (listenArgumentFound) {
  bot.listen().then(() => {
    bot.loadActiveProposals()
  })
}

export default bot
