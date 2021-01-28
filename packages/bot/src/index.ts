import 'reflect-metadata'

require('dotenv').config()

import { TYPES } from './types'
import container from './inversify.config'
import { Bot } from './bot'

export const bot = container.get<Bot>(TYPES.Bot)

export default bot
