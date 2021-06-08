import { MessageEmbed } from 'discord.js'
import { injectable } from 'inversify'
import { EmbedMessageParams } from '../types'
import { loadReactionMonitors } from './loadReactionMonitors'
import { etherscanUrl } from '../constants'

@injectable()
export class EmbedMessage {
  warning ({
    title,
    description,
    footerMessage,
    authorUrl
  }: EmbedMessageParams): MessageEmbed {
    const validationWarning = new MessageEmbed()
      .setColor('#d09625')
      .setTitle(title)
    if (description) {
      validationWarning.setDescription(description)
    }
    if (footerMessage) {
      validationWarning.setFooter(footerMessage, authorUrl)
    }
    return validationWarning
  }

  error ({
    title,
    description,
    footerMessage,
    authorUrl
  }: EmbedMessageParams): MessageEmbed {
    const errorMessage = new MessageEmbed().setColor('#b9182f').setTitle(title)
    if (description) {
      errorMessage.setDescription(description)
    }
    if (footerMessage) {
      errorMessage.setFooter(footerMessage, authorUrl)
    }
    return errorMessage
  }

  info ({
    title,
    description,
    footerMessage,
    authorUrl
  }: EmbedMessageParams): MessageEmbed {
    const infoMessage = new MessageEmbed().setColor('#0099ff').setTitle(title)
    if (description) {
      infoMessage.setDescription(description)
    }
    if (footerMessage) {
      infoMessage.setFooter(footerMessage, authorUrl)
    }
    return infoMessage
  }

  result ({
    title,
    description,
    footerMessage,
    authorUrl,
    result
  }: EmbedMessageParams): MessageEmbed {
    const resultMessage = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(title)
      .setDescription(description)
      .setThumbnail('attachment://aragon.png')
      .addFields(
        { name: ':thumbsup::', value: result?.positive, inline: true },
        { name: ':thumbsdown::', value: result?.negative, inline: true }
      )
      .setTimestamp()
      .setFooter(footerMessage, authorUrl)
    return resultMessage
  }

  proposal ({
    proposalDescription,
    proposalDeadlineDate,
    authorUrl,
    amount,
    address,
    footerMessage
  }: EmbedMessageParams) {
    const proposalEmbedMessage = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`New proposal ***${proposalDescription}***`)
      .setDescription(
        `The request for creating the proposal ***${proposalDescription}*** has been received. A positive result will schedule the action, thus eventually sending ***${amount} ETH*** to the address ***${address}***. React to this proposal to vote!`
      )
      .setThumbnail('attachment://aragon.png')
      .addFields(
        { name: 'Vote yes', value: ':thumbsup:', inline: true },
        { name: 'Vote no', value: ':thumbsdown:', inline: true },
        {
          name: 'The time for voting will end on',
          value: `${proposalDeadlineDate}`
        }
      )
      .setTimestamp()
      .setFooter(footerMessage, authorUrl)
    return {
      embed: proposalEmbedMessage,
      files: [
        {
          attachment: 'src/static/aragon.png',
          name: 'aragon.png'
        }
      ]
    }
  }

  dao ({ daoName, role, executorAddress }: EmbedMessageParams) {
    const daoMessage = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Congrats to you and your fellow Discord users!')
      .setDescription(
        `This server is now connected to the DAO named ***${daoName}*** (check address on [Etherscan](${etherscanUrl}/address/${executorAddress})). Only users with the role ***${role}*** can create proposals but **anyone with access to this channel can vote**. **Remember to also add these other bots to your server**, otherwise the integration will fail:`
      )
      .setThumbnail('attachment://aragon.png')
      .addFields(
        loadReactionMonitors().map(monitor => ({
          name: monitor.name,
          value: `[Click to add >](${monitor.link})`,
          inline: true
        }))
      )
    return {
      embed: daoMessage,
      files: [
        {
          attachment: 'src/static/aragon.png',
          name: 'aragon.png'
        }
      ]
    }
  }

  proposalInstructions ({ role, daoName }: EmbedMessageParams) {
    const daoMessage = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`**${role}** can create proposals!`)
      .setDescription(
        `Only users with the role **${role}** can create proposals for **${daoName}**.

        The proposal should follow this format:\n\`!proposal <deadline> <description> to:<address> value:<ETH> data?:<data>\`.
        An example of valid proposal is \`!proposal 2021/03/26 15:07:00 do you want to give a grant to ENTITY? to:0x199eA5114D1612e40E3457Eaf9DF2779340EAD12 value:0.01\``
      )
      .addFields(
        {
          name: 'deadline',
          value:
            'Date in UTC with the following format `YYYY MM DD HH:MM:SS` that indicates when the voting time finishes.',
          inline: false
        },
        {
          name: 'description',
          value: 'Description of the proposal.',
          inline: false
        },
        {
          name: 'address',
          value: 'Ethereum address where funds will be sent.',
          inline: false
        },
        {
          name: 'eth',
          value: 'Eth amount in wei to be sent if the proposal is accepted.',
          inline: false
        },
        {
          name: 'data',
          value:
            'An optional [ABI byte string](https://docs.soliditylang.org/en/latest/abi-spec.html) containing the data of the function call on a contract. Default value is `0x00`.',
          inline: false
        }
      )
    return {
      embed: daoMessage
    }
  }
}
