import DiscordJS, {Intents, TextChannel} from 'discord.js'

import {logStack, dataPool} from './src/cache'
import * as db from './src/database'
import {crawler} from './src/checker'

import {rangedelete} from './command/delete'
import {displayLog, displayHelp} from './command/display'
import {dbManger} from './command/dbManger'
import {shReader, shSubmitTime} from './command/shManger'

import dotenv from 'dotenv'
dotenv.config()

const prefix = '!!'
const client = new DiscordJS.Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
})

const logger = logStack.getLogger()
const checker = new crawler()

client.on('ready', async () => {
  logger.logging('The bot is ready.')
  const channel = (await client.channels.fetch('938732984973017129')) as TextChannel
  checker.channel = channel
  const checkerData = dataPool.getDataPool()

  logger.logging('Reading old data.')
  const data = await db.getShopList()
  logger.logging(`${data.length} record found.`)
  for (const shop of data) {
    checkerData.link.push(shop.link)
    checkerData.title.push(shop.title)
    checkerData.info.push(shop.info)
    checkerData.hash.push(shop.hash)
    checkerData.date.push(shop.date)
  }

  const msg = await channel.messages.fetch({limit: 1}).then(coll => coll.first())
  if (msg === undefined) return
  if (msg.content.startsWith('Last updated') && client.user !== null && msg.author.id === client.user.id) {
    logger.logging('Auto restart checker.')
    await channel.send(`Auto restart checker.`)
    checker.start()
  }
})

const commandDict: {[key: string]: Function} = {
  rangedelete: rangedelete,
  rd: rangedelete,
  logs: displayLog,
  help: displayHelp
}

const studioCommandDict: {[key: string]: Function} = {
  checker: checker.handleCommand.bind(checker),
  database: dbManger,
  db: dbManger,
  googlesheet: shReader,
  gs: shReader,
  submit: shSubmitTime
}

client.on('messageCreate', message => {
  if (!message.content.startsWith(prefix)) return

  if (!message.member || !message.guild) return

  const channel = message.channel as TextChannel
  logger.logging(`${message.author.tag} at #${channel.name}: "${message.content}" id: ${message.id}`)

  // check permissions
  if (message.author.id !== message.guild.ownerId) {
    if (!message.member.permissionsIn(channel).has(DiscordJS.Permissions.FLAGS.MANAGE_MESSAGES) || message.author.bot) {
      logger.logging(`permission denied.`)
      return
    }
  }

  const args = message.content.split(' ')
  const cmd = args[0].slice(2)

  if (cmd in commandDict) {
    commandDict[cmd](message)
    return
  }

  //commands only for studio
  if (message.guild.id === '923553217671987201' && cmd in studioCommandDict) {
    studioCommandDict[cmd](message)
    return
  }
})

client.login(process.env.TOKEN)
