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

async function rangedelete(message: Message) {
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

  const args = message.content.split(' ')
  if (args[1] === args[2]) {
    message.channel.send(`MessageID(1) and MessageID(2) should not be the same.`)
    return
  }
  if (parseInt(args[1]) > parseInt(args[2])) {
    message.channel.send(`Message(1) is newer than Message(2).`)
    return
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

  let msgs = await msg1.channel.messages.fetch({
    after: msg1.id
  })
  console.log(msgs)
  msgs = msgs.filter(m => m.createdTimestamp <= msg2.createdTimestamp)
  message.channel.send(`Starting to delete messages from ${args[1]} to ${args[2]}.`)
  message.channel.send(`<:gbf_makira_gun:685481376400932895>`)
  await msg1.delete()
  const count = (await Promise.all(msgs.map(m => m.delete()))).length + 1
  await message.channel.send(`${count} messages deleted.`)
}

client.on('messageCreate', message => {
  if (!message.content.startsWith(prefix)) return

  let args = message.content.split(' ')

  if (args[0].slice(2) === 'rangedelete') {
    if (!message.member) return
    if (!message.guild) return
    // check permissions
    if (message.author.id !== message.guild.ownerId) {
      if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
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
