import bot from '@adi/bot'
const express = require('express')
import { Request, Response } from 'express'

const app = express()
const port = process.env.PORT || 3000

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
