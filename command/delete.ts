import {Message, TextChannel} from 'discord.js'
import {msToMinSec} from '../src/utility'
import {logStack} from '../src/cache'

const logger = logStack.getLogger()

export async function rangedelete(msg: Message) {
  const message = msg
  const channel = message.channel as TextChannel

  const args = message.content.split(' ')
  if (args[1] === args[2]) {
    channel.send(`MessageID(1) and MessageID(2) should not be the same.`)
    return
  }
  if (parseInt(args[1]) > parseInt(args[2])) {
    channel.send(`Message(1) is newer than Message(2).`)
    return
  }

  async function fetch(_id: string, _ch: TextChannel = channel): Promise<Message | undefined> {
    try {
      const msg = await _ch.messages.fetch(_id)
      return msg
    } catch (error) {}

    const channels = _ch.guild.channels.cache
    for (const [_, ch] of channels) {
      if (!ch.isText()) continue
      try {
        const msg = await ch.messages.fetch(_id)
        return msg
      } catch (error) {
        continue
      }
    }
  }

  const msg1 = await fetch(args[1])
  if (!msg1) {
    channel.send(`Message(1) ${args[1]} not found.`)
    return
  }
  const msg2 = await fetch(args[2])
  if (!msg2) {
    channel.send(`Message(2) ${args[2]} not found.`)
    return
  }

  if (channel != msg1.channel || msg1.channel != msg2.channel) {
    channel.send(`Messages need to be in same channel.`)
    return
  }

  let startTime = Date.now()
  await message.delete()
  logger.logging(`Range delete start by ${message.author.username} at #${channel.name}`)
  let botMsg = await channel.send(`Starting to delete messages from ${args[1]} to ${args[2]}.`)
  await channel.send(`<:gbf_makira_gun:685481376400932895>`)

  let msgs = await channel.messages.fetch({
    after: msg1.id,
    limit: 99
  })
  msgs = msgs.filter(m => m.createdTimestamp <= msg2.createdTimestamp).sort((a, b) => a.createdTimestamp - b.createdTimestamp)

  await msg1.delete()
  let count = 1
  await channel.bulkDelete(msgs).then(msg => (count += msg.size))

  while (!msgs.has(msg2.id)) {
    logger.logging(`${count} messages deleted`)
    await botMsg.edit(`Still deleting, ${count} messages deleted so far`)
    let tmp = msgs.lastKey()
    msgs = await channel.messages.fetch({
      after: tmp,
      limit: 100
    })
    msgs = msgs.filter(m => m.createdTimestamp <= msg2.createdTimestamp).sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    await channel.bulkDelete(msgs).then(msg => (count += msg.size))
  }

  let timeCost = msToMinSec(Date.now() - startTime)
  logger.logging(`Complete, ${count} messages deleted in ${timeCost}`)
  await botMsg.edit(`Complete, ${count} messages deleted in ${timeCost}`)
}