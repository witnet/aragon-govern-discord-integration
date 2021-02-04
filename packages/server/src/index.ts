import bot from '@adi/bot'
const express = require('express')
import { Request, Response } from 'express'

const app = express()
const port = process.env.PORT || 3000

// Make the bot listen, with the only purpose of giving it logged in status.
// This is required for the bots that act as reactions monitor to have their
// own role in the servers, so that they can be allowed into private channels.
bot.listen()

app.get('/', async (req: Request, res: Response) => {
  const messageId: string = req.query.message_id as string
  const channelId: string = req.query.channel_id as string

  if (messageId && channelId) {
    const content = await bot.fetchReactions(messageId, channelId)
    return res.json(content)
  } else {
    let errorMessage = 'The following parameters are mandatory: '
    if (!messageId) {
      errorMessage += 'message_id '
    }
    if (!channelId) {
      errorMessage += 'channel_id'
    }
    return res.status(400).send(errorMessage)
  }
})

app.listen(port)
