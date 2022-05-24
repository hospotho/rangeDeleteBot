import DiscordJS, {Intents, TextChannel} from 'discord.js'

import {logStack, dataPool} from './src/cache'
import * as db from './src/database'
import {crawler} from './src/checker'

import {rangedelete} from './command/delete'
import {displayChecker, displayPrice, displayDiff} from './command/display'
import {dbManger} from './command/dbManger'
import {shReader} from './command/shReader'

import dotenv from 'dotenv'
dotenv.config()

const prefix = '!!'
const client = new DiscordJS.Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
})

const logger = logStack.getLogger()
const checkerData = dataPool.getDataPool()
const checker = new crawler()

client.on('ready', async () => {
  logger.logging('The bot is ready.')
  const channel = (await client.channels.fetch('938732984973017129')) as TextChannel
  checker.channel = channel

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
  if (!msg.content.startsWith('Last updated')) return
  if (client.user !== null && msg.author.id === client.user.id) {
    logger.logging('Auto restart checker.')
    await channel.send(`Auto restart checker.`)
    checker.start()
  }
})

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

  let args = message.content.split(' ')

  if (args[0].slice(2) === 'rangedelete' || args[0].slice(2) === 'rd') {
    if (args.length !== 3) {
      channel.send('Invalid arguments count\nUsage:  !!rangedelete  MessageID1  MessageID2')
      return
    }
    rangedelete(message)
    return
  }

  if (args[0].slice(2) === 'logs') {
    if (message.author.id !== '472053971406815242') {
      return
    }
    let size = 20
    if (args.length > 2) {
      channel.send('Invalid arguments count\nUsage:  !!logs  (size)')
      return
    }
    if (args.length === 2) {
      if (!Number.isInteger(Number(args[1]))) {
        channel.send('Invalid arguments\nUsage:  !!logs  (size)')
        return
      }
      size = Number(args[1])
    }
    let log = '`' + logger.getLog(size).reduce((a, b) => a + '\n' + b) + '`'
    channel.send(log)
  }

  if (args[0].slice(2) === 'help') {
    if (message.guild.id === '923553217671987201') {
      channel.send(
        '**`command list:`**`\n!!rangedelete/rd  MessageID1  MessageID2\n!!logs  (Size)\n!!checker  on/off/update/display/price/diff\n!!database/db  (create/update/delete/history)\n!!googlesheet/gs  (id)  [85/all]\n!!help`'
      )
      return
    }
    channel.send('**`command list:`**`\n!!rangedelete/rd  MessageID1  MessageID2\n!!logs  (Size)\n!!help`')
    return
  }

  //commands only for studio
  if (message.guild.id !== '923553217671987201') {
    return
  }

  if (args[0].slice(2) === 'checker') {
    if (args.length !== 2) {
      channel.send('Invalid arguments count\nUsage:  !!checker  on/off/update/display/price/diff')
      return
    }
    if (args[1] === 'on') {
      if (!checker.checkerFlag) {
        checker.start()
        return
      } else {
        channel.send('Checker already on.')
        return
      }
    }
    if (args[1] === 'off') {
      checker.exit()
      channel.send('Checker is now off.')
      return
    }
    if (!checker.checkerFlag) {
      channel.send('Checker off.')
      return
    }
    if (args[1] === 'update') {
      channel.send('Checker will start update by command.')
      checker.updaeFlag = true
      return
    }
    if (args[1] === 'display') {
      displayChecker(channel, checkerData)
      return
    }
    if (args[1] === 'price') {
      displayPrice(channel, checkerData)
      return
    }
    if (args[1] === 'diff') {
      displayDiff(message)
      return
    }
    channel.send('Invalid arguments option\nUsage:  !!checker  on/off/update/display/price/diff')
    return
  }

  if (args[0].slice(2) === 'database' || args[0].slice(2) === 'db') {
    if (message.author.id !== '472053971406815242') {
      return
    }
    if (args.length !== 2) {
      channel.send('Invalid arguments count\nUsage:  !!database/db  create/update/delete/history')
      return
    }
    const options = ['create', 'update', 'delete', 'history']
    if (options.map(o => args[1] === o).reduce((acc, curr) => acc || curr, false)) {
      dbManger(message, args[1])
      return
    } else {
      channel.send('Invalid options\nUsage:  !!database/db  create/update/delete/history')
      return
    }
  }

  if (args[0].slice(2) === 'googlesheet' || args[0].slice(2) === 'gs') {
    if ((args.length !== 2 && args.length !== 3) || !Number.isInteger(Number(args[1]))) {
      channel.send('Invalid arguments count\nUsage:  !!googlesheet/gs  id  [85/all]')
      return
    }
    const options = ['', '85', 'all']
    var type = args.length === 2 ? '' : args[2]
    if (options.includes(type)) {
      shReader(channel, Number(args[1]), type)
      return
    } else {
      channel.send('Invalid options\nUsage:  !!googlesheet/gs  id  [85/all]')
      return
    }
  }
})

client.login(process.env.TOKEN)
