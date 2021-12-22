import DiscordJS, {Intents, Message, TextChannel, Permissions} from 'discord.js'
import dotenv from 'dotenv'
dotenv.config()
const prefix = '!!'
var debug = false
const client = new DiscordJS.Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
})

class logStack {
  logs: Array<string>
  maxsize: number
  constructor(_size: number = 50) {
    this.logs = []
    this.maxsize = _size
  }
  logging(str: string) {
    if (this.logs.length === this.maxsize) this.logs.shift()
    this.logs.push(str)
    console.log(str)
  }
  getLog(size: number) {
    return this.logs.slice(Math.max(this.logs.length - size, 0))
  }
  clear() {
    this.logs = []
  }
}

var logger = new logStack()

client.on('ready', () => {
  logger.logging('The bot is ready.')
})

function msToMinSec(ms: number) {
  let min = Math.floor(ms / 60000)
  let sec = Math.floor((ms % 60000) / 1000)
  return (min > 0 ? min + 'm' : '') + (sec < 10 && min > 0 ? '0' : '') + sec + 's'
}

async function rangedelete(msg: Message) {
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
    } catch (error) {
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
  let botMsg = await channel.send(`Starting to delete messages from ${args[1]} to ${args[2]}.`).then(sent => {
    return sent
  })
  logger.logging(`Range delete start by ${message.author.username} at #${channel.name} id: ${message.id}`)
  await channel.send(`<:gbf_makira_gun:685481376400932895>`)

  let msgs = await channel.messages.fetch({
    after: msg1.id,
    limit: 99
  })
  msgs = msgs.filter(m => m.createdTimestamp <= msg2.createdTimestamp)
  msgs = msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
  await msg1.delete()
  let count = 1
  await channel.bulkDelete(msgs).then(msg => (count += msg.size))

  while (!msgs.has(msg2.id)) {
    await botMsg.edit(`Still deleting, ${count} messages deleted so far`).then(() => logger.logging(`${count} messages deleted`))
    let tmp = msgs.lastKey()
    msgs = await channel.messages.fetch({
      after: tmp,
      limit: 100
    })
    msgs = msgs.filter(m => m.createdTimestamp <= msg2.createdTimestamp)
    msgs = msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    await channel.bulkDelete(msgs).then(msg => (count += msg.size))
  }

  let timeCost = msToMinSec(Date.now() - startTime)
  await botMsg.edit(`Complete, ${count} messages deleted in ${timeCost}`).then(() => {
    logger.logging(`Complete, ${count} messages deleted in ${timeCost} id: ${message.id}`)
  })
}

client.on('messageCreate', message => {
  if (!message.content.startsWith(prefix)) return

  if (!message.member || !message.guild) return
  // check permissions
  if (message.author.id !== message.guild.ownerId) {
    if (
      !message.member.permissionsIn(message.channel as TextChannel).has(DiscordJS.Permissions.FLAGS.MANAGE_MESSAGES) ||
      message.author.bot
    ) {
      logger.logging(
        `permission denied, range delete start by ${message.author.username} at #${(message.channel as TextChannel).name} id: ${message.id}`
      )
      return
    }
  }

  let args = message.content.split(' ')

  if (args[0].slice(2) === 'rangedelete') {
    if (args.length != 3) {
      message.channel.send({
        content: 'Invalid arguments count\nUsage:  !!rangedelete  MessageID1  MessageID2'
      })
      return
    }
    rangedelete(message)
    return
  }

  if (args[0].slice(2) === 'logs') {
    let size = 20
    if (args.length == 2) {
      if (isNaN(parseInt(args[1], 10))) {
        message.channel.send({
          content: 'Invalid arguments count\nUsage:  !!logs  (size)'
        })
        return
      }
      size = parseInt(args[1], 10)
    }
    let log = '`' + logger.getLog(size).reduce((a, b) => a + '\n' + b) + '`'
    message.channel.send({
      content: log
    })
  }

  if (args[0].slice(2) === 'help') {
    message.channel.send({
      content: '**`command list:`**`\n!!rangedelete  MessageID1  MessageID2\n!!logs (Size)\n!!help`'
    })
  }
})

client.login(process.env.TOKEN)
