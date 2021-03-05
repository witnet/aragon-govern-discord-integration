import { Collection, MessageReaction } from 'discord.js'

export function countReactions (
  emojiList: Array<string>,
  reactions: Collection<string, MessageReaction>
) {
  return emojiList
    .map((emoji: string) => reactions.get(emoji)?.count || 0)
    .reduce((a: number, b: number) => a + b)
}

export default countReactions
