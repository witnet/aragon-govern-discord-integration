import bot from '@adi/bot'
const express = require('express')
import { Request, Response } from 'express'

const app = express()
const port = process.env.PORT || 3000

app.get('/', async (req: Request, res: Response) => {
  const messageId: string = req.query.messageId as string
  const channelId: string = req.query.channelId as string

  if (messageId && channelId) {
    const content = await bot.fetchReactions(messageId, channelId)
    return res.json(content)
  } else {
    let errorMessage = 'The following parameters are mandatory: '
    if (!messageId) {
      errorMessage += 'messageId '
    }
    if (!channelId) {
      errorMessage += 'channelId'
    }
    return res.status(400).send(errorMessage)
  }
})

app.listen(port)
