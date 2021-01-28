import 'reflect-metadata'
import { Container } from 'inversify'
import { TYPES } from './types'
import { Client } from 'discord.js'

import { Bot } from './bot'
import { MessageHandler } from './services/messageHandler'
import { CommandFinder } from './services/commandFinder'

let container = new Container()

container
  .bind<Bot>(TYPES.Bot)
  .to(Bot)
  .inSingletonScope()
container
  .bind<Client>(TYPES.Client)
  .toConstantValue(new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] }))
container
  .bind<string>(TYPES.Token)
  .toConstantValue(process.env.DISCORD_TOKEN || '')
container
  .bind<MessageHandler>(TYPES.MessageHandler)
  .to(MessageHandler)
  .inSingletonScope()
container
  .bind<CommandFinder>(TYPES.CommandFinder)
  .to(CommandFinder)
  .inSingletonScope()

export default container
