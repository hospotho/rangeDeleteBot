import {Message, TextChannel} from 'discord.js'
import {msToMinSec} from '../src/utility'
import {logStack} from '../src/cache'

const logger = logStack.getLogger()

export async function rangedelete(msg: Message) {
  const message = msg
  const channel = message.channel as TextChannel
  const args = message.content.split(' ')

  if (args.length !== 3) {
    channel.send('Invalid arguments count\nUsage:  !!rangedelete  MessageID1  MessageID2')
    return
  }

  let msgID1 = args[1]
  let msgID2 = args[2]

  if (isNaN(parseInt(msgID1)) || isNaN(parseInt(msgID2))) {
    const msg = await channel.send(`Invaild messageID.`)
    //delete() must inside a function
    setTimeout(() => msg.delete(), 5000)
    return
  }
  if (msgID1 === msgID2) {
    const msg = await channel.send(`MessageID(1) and MessageID(2) should not be the same.`)
    setTimeout(() => msg.delete(), 5000)
    return
  }
  if (BigInt(msgID1) > BigInt(msgID2)) {
    ;[msgID1, msgID2] = [msgID2, msgID1]
    const msg = await channel.send(`Message(1) is newer than Message(2).`)
    setTimeout(() => msg.delete(), 5000)
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

  const msg1 = await fetch(msgID1)
  if (!msg1) {
    const msg = await channel.send(`Message(1) ${msgID1} not found.`)
    setTimeout(() => msg.delete(), 5000)
    return
  }
  const msg2 = await fetch(msgID2)
  if (!msg2) {
    const msg = await channel.send(`Message(2) ${msgID2} not found.`)
    setTimeout(() => msg.delete(), 5000)
    return
  }

  if (channel != msg1.channel || msg1.channel != msg2.channel) {
    const msg = await channel.send(`Messages need to be in same channel.`)
    setTimeout(() => msg.delete(), 5000)
    return
  }

  const startTime = Date.now()
  await message.delete()
  logger.logging(`Range delete start by ${message.author.username} at #${channel.name}`)
  const botMsg = await channel.send(`Starting to delete messages from ${msgID1} to ${msgID2}.`)
  const emoji = await channel.send(`<:gbf_makira_gun:685481376400932895>`)

  const toDay = 1 / 1000 / 60 / 60 / 24
  let count = 1

  let msgs = await channel.messages.fetch({
    before: msg2.id,
    limit: 99
  })
  msgs = msgs.filter(m => m.createdTimestamp >= msg1.createdTimestamp && m.createdTimestamp >= startTime - 13.9 / toDay).sort((a, b) => a.createdTimestamp - b.createdTimestamp)
  await msg2.delete()
  await channel.bulkDelete(msgs).then(msg => (count += msg.size))

  while (!msgs.has(msg1.id) && msgs.size) {
    logger.logging(`${count} messages deleted`)
    await botMsg.edit(`Still deleting, ${count} messages deleted so far`)
    msgs = await channel.messages.fetch({
      before: msg2.id,
      limit: 100
    })
    msgs = msgs.filter(m => m.createdTimestamp >= msg1.createdTimestamp && m.createdTimestamp >= startTime - 13.9 / toDay).sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    await channel.bulkDelete(msgs).then(msg => (count += msg.size))
  }

  while (!msgs.has(msg1.id)) {
    logger.logging(`${count} messages deleted`)
    await botMsg.edit(`Deleting in slow mode, ${count} messages deleted so far`)
    msgs = await channel.messages.fetch({
      before: msg2.id,
      limit: 19
    })
    msgs = msgs.filter(m => m.createdTimestamp >= msg1.createdTimestamp).sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    count += msgs.size
    await Promise.all(msgs.map(msg => msg.delete()))
  }

  const timeCost = msToMinSec(Date.now() - startTime)
  logger.logging(`Complete, ${count} messages deleted in ${timeCost}`)
  await botMsg.edit(`Complete, ${count} messages deleted in ${timeCost}`)
  setTimeout(() => {
    botMsg.delete()
    emoji.delete()
  }, 5000)
}
