import { MessageEmbed } from 'discord.js'
import { injectable } from 'inversify'
import { EmbedMessageParams } from '../types'

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
    footerMessage,
    authorUrl
  }: EmbedMessageParams): MessageEmbed {
    const errorMessage = new MessageEmbed().setColor('#b9182f').setTitle(title)
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
    footerMessage
  }: EmbedMessageParams) {
    const proposalEmbedMessage = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`New proposal ***${proposalDescription}***`)
      .setDescription(
        `The request for creating the proposal ***${proposalDescription}*** has been received. React to this proposal to vote!`
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

  dao ({ daoName, role }: EmbedMessageParams) {
    const daoMessage = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Congrats to you and your fellow Discord users!')
      .setDescription(
        `This server is now connected to the DAO named ***${daoName}***. Only users with the role ***${role}*** can create proposals. **Remember to also add these other bots to your server**, otherwise the integration will fail:`
      )
      .setThumbnail('attachment://aragon.png')
      .addFields(
        {
          name: 'Witnet Foundation Reactions Monitor',
          value:
            '[Click to add >](https://discord.com/api/oauth2/authorize?client_id=806098500978343986&permissions=65536&scope=bot%20messages.read)',
          inline: true
        },
        {
          name: 'Aragon One Reactions Monitor',
          value:
            '[Click to add >](https://discord.com/api/oauth2/authorize?client_id=806819543460610068&permissions=65536&scope=bot%20messages.read)',
          inline: true
        },
        {
          name: 'OtherPlane Reactions Monitor',
          value:
            '[Click to add >](https://discord.com/api/oauth2/authorize?client_id=806821381844762625&permissions=65536&scope=bot%20messages.read)',
          inline: true
        }
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
}
