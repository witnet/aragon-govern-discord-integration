import 'reflect-metadata'
import { Container } from 'inversify'
import { TYPES } from './types'
import { Client } from 'discord.js'
import { Bot } from './bot'
import { MessageHandler } from './services/messageHandler'
import { CommandFinder } from './services/commandFinder'
import { EmbedMessage } from './services/embedMessage'
import { SubgraphClient } from './services/subgraph'
import { ProposalRepository, Database, SetupRepository } from './database'

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
container
  .bind<EmbedMessage>(TYPES.EmbedMessage)
  .to(EmbedMessage)
  .inSingletonScope()

container
  .bind<ProposalRepository>(TYPES.ProposalRepository)
  .to(ProposalRepository)
  .inSingletonScope()

container
  .bind<SetupRepository>(TYPES.SetupRepository)
  .to(SetupRepository)
  .inSingletonScope()

container
  .bind<SubgraphClient>(TYPES.SubgraphClient)
  .to(SubgraphClient)
  .inSingletonScope()

container
  .bind<Database>(TYPES.Database)
  .to(Database)
  .inSingletonScope()

export default container
