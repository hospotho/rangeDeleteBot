import DiscordJS, {Intents, Message, TextChannel, Permissions} from 'discord.js'
import dotenv from 'dotenv'
dotenv.config()
const prefix = '!!'
const client = new DiscordJS.Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
})

client.on('ready', () => {
  console.log('The bot is ready.')
})

function msToMinSec(ms: number) {
  let min = Math.floor(ms / 60000)
  let sec = Math.floor((ms % 60000) / 1000)
  return (min > 0 ? min + 'm' : '') + (sec < 10 && min > 0 ? '0' : '') + sec + 's'
}

async function rangedelete(message: Message) {
  if (!message.member || message.channel.type == 'DM') return
  const args = message.content.split(' ')
  if (args[1] === args[2]) {
    message.channel.send(`MessageID(1) and MessageID(2) should not be the same.`)
    return
  }
  if (parseInt(args[1]) > parseInt(args[2])) {
    message.channel.send(`Message(1) is newer than Message(2).`)
    return
  }

  async function fetch(id: string, channel: TextChannel = message.channel as TextChannel): Promise<Message | undefined> {
    try {
      const msg = await channel.messages.fetch(id)
      return msg
    } catch (error) {
      const channels = channel.guild.channels.cache
      for (const [_, ch] of channels) {
        if (!ch.isText()) continue
        try {
          const msg = await ch.messages.fetch(id)
          return msg
        } catch (error) {
          continue
        }
      }
    }
  }

  const msg1 = await fetch(args[1])
  if (!msg1) {
    message.channel.send(`Message(1) ${args[1]} not found.`)
    return
  }
  const msg2 = await fetch(args[2])
  if (!msg2) {
    message.channel.send(`Message(2) ${args[2]} not found.`)
    return
  }

  if (msg1.channel != msg2.channel) {
    message.channel.send(`Messages need to be in same channel.`)
    return
  }

  let startTime = Date.now()
  let botMsg = await message.channel.send(`Starting to delete messages from ${args[1]} to ${args[2]}.`).then(sent => {
    return sent
  })
  console.log(`range delete start by ${message.author.username} at #${message.channel.name} id: ${message.id}`)
  await message.channel.send(`<:gbf_makira_gun:685481376400932895>`)
  let msgs = await msg1.channel.messages.fetch({
    after: msg1.id,
    limit: 99
  })
  msgs = msgs.filter(m => m.createdTimestamp <= msg2.createdTimestamp)
  msgs = msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
  await msg1.delete()
  let count = 1
  await message.channel.bulkDelete(msgs).then(msg => (count += msg.size))

  while (!msgs.has(msg2.id)) {
    await botMsg.edit(`Still deleting, ${count} messages deleted so far`).then(() => console.log(`${count} messages deleted`))
    let tmp = msgs.lastKey()
    msgs = await msg1.channel.messages.fetch({
      after: tmp,
      limit: 100
    })
    msgs = msgs.filter(m => m.createdTimestamp <= msg2.createdTimestamp)
    msgs = msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    await message.channel.bulkDelete(msgs).then(msg => (count += msg.size))
  }

  let timeCost = msToMinSec(Date.now() - startTime)
  await botMsg.edit(`Complete, ${count} messages deleted in ${timeCost}`).then(() => {
    console.log(`Complete, ${count} messages deleted in ${timeCost} id: ${message.id}`)
  })
}

client.on('messageCreate', message => {
  if (!message.content.startsWith(prefix)) return

  let args = message.content.split(' ')

  if (args[0].slice(2) === 'rangedelete') {
    if (!message.member) return
    if (!message.guild) return
    // check permissions
    if (message.author.id !== message.guild.ownerId) {
      if (
        !message.member.permissionsIn(message.channel as TextChannel).has(DiscordJS.Permissions.FLAGS.MANAGE_MESSAGES) ||
        message.author.bot
      ) {
        console.log('permission denied')
        return
      }
    }
    if (args.length != 3) {
      message.channel.send({
        content: 'Invalid arguments count\nUsage:  !!rangedelete  MessageID1  MessageID2'
      })
      return
    }
    rangedelete(message)
    return
  }
})

client.login(process.env.TOKEN)
