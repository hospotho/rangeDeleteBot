import DiscordJS, {
  Intents,
  Message,
  TextChannel,
  Permissions,
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  Interaction,
  MessageComponentInteraction
} from 'discord.js'
import undici from 'undici'
import jsdom from 'jsdom'
// global.HTMLAnchorElement = new jsdom.JSDOM().window.HTMLAnchorElement
import * as db from './database'
import {sleep, hashCode, html2text, text2price, msToMinSec, timeString, diff} from './utility'
import dotenv from 'dotenv'
dotenv.config()

const prefix = '!!'
var checkerFlag = false
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

class dataPool {
  link: Array<string>
  title: Array<string>
  info: Array<string>
  hash: Array<number>
  date: Array<number>
  constructor() {
    this.link = []
    this.title = []
    this.info = []
    this.hash = []
    this.date = []
  }
}

var logger = new logStack()
var checkerData = new dataPool()

async function init() {
  logger.logging('Reading old data.')
  const data = await db.getShopList()
  for (const shop of data) {
    checkerData.link.push(shop.link)
    checkerData.title.push(shop.title)
    checkerData.info.push(shop.info)
    checkerData.hash.push(shop.hash)
    checkerData.date.push(shop.date)
  }
  logger.logging(`${data.length} record found`)

  const channel = (await client.channels.fetch('938732984973017129')) as TextChannel
  const msg = await channel.messages.fetch({limit: 1}).then(coll => coll.first())
  if (msg === undefined) return
  if (!msg.content.startsWith('Last updated')) return
  if (client.user !== null && msg.author.id === client.user.id) {
    logger.logging('Auto restart checker.')
    await channel.send(`Auto restart checker.`)
    checkerFlag = true
    checker()
  }
}

client.on('ready', () => {
  logger.logging('The bot is ready.')
  init()
})

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

async function displayChecker(channel: TextChannel, data: dataPool) {
  const length = data.link.length
  console.log(`Display data, length:  ${length}.`)
  channel.send(`Display data, length:  ${length}.`)
  for (var i = 0; i < length - (length % 5); i += 5) {
    var content = ''
    content += `[${data.title[i]}](${data.link[i]})\n`
    content += `[${data.title[i + 1]}](${data.link[i + 1]})\n`
    content += `[${data.title[i + 2]}](${data.link[i + 2]})\n`
    content += `[${data.title[i + 3]}](${data.link[i + 3]})\n`
    content += `[${data.title[i + 4]}](${data.link[i + 4]})\n`
    const embed = new MessageEmbed().addFields({name: `${i + 1}-${i + 5}`, value: content})
    channel.send({
      embeds: [embed]
    })
  }
  if (length % 5 > 0) {
    var content = ''
    for (var i = Math.floor(length / 5) * 5; i < length; i++) {
      content += `[${data.title[i]}](${data.link[i]})\n`
    }
    const embed = new MessageEmbed().addFields({name: `${Math.floor(length / 5) * 5 + 1}-${data.link.length}`, value: content})
    channel.send({embeds: [embed]})
  }
}

async function displayHistory(channel: TextChannel, data: Array<db.Shop>) {
  var index = 0

  const embed = () =>
    new MessageEmbed().addFields({
      name: timeString(data[index].date),
      value: `[${data[index].title}](${data[index].link})` + '\n' + data[index].info
    })

  const row = new MessageActionRow()
    .addComponents(new MessageButton().setCustomId('left').setLabel('<-').setStyle('PRIMARY'))
    .addComponents(new MessageButton().setCustomId('right').setLabel('->').setStyle('PRIMARY'))

  let botmsg = await channel.send({
    embeds: [embed()],
    components: [row]
  })

  const filter = (butInt: Interaction) => {
    return butInt.user.id === '472053971406815242'
  }
  const collector = channel.createMessageComponentCollector({
    filter,
    time: 1000 * 60 * 3
  })
  collector.on('collect', async (i: MessageComponentInteraction) => {
    if (i.customId === 'left') {
      index ? index-- : (index = data.length - 1)
    }
    if (i.customId === 'right') {
      index < data.length - 1 ? index++ : (index = 0)
    }
    botmsg = await botmsg.edit({
      embeds: [embed()],
      components: [row]
    })
    i.deferUpdate()
  })
}

async function displayPrice(channel: TextChannel, data: dataPool) {
  var index = 0

  const embed = () =>
    new MessageEmbed().addFields({
      name: `${index + 1}/${data.link.length}`,
      value: `[${data.title[index]}](${data.link[index]})` + '\n' + text2price(data.info[index])
    })

  const row = new MessageActionRow()
    .addComponents(new MessageButton().setCustomId('left').setLabel('<-').setStyle('PRIMARY'))
    .addComponents(new MessageButton().setCustomId('right').setLabel('->').setStyle('PRIMARY'))

  let botmsg = await channel.send({
    embeds: [embed()],
    components: [row]
  })

  const filter = (butInt: Interaction) => {
    //t,w,c,s,p
    const user = ['472053971406815242', '353364518795083778', '376419671039148032', '740470141028008036', '443703141519720448']
    return user.includes(butInt.user.id)
  }
  const collector = channel.createMessageComponentCollector({
    filter,
    time: 1000 * 60 * 3
  })
  collector.on('collect', async (i: MessageComponentInteraction) => {
    if (i.customId === 'left') {
      index ? index-- : (index = data.link.length - 1)
    }
    if (i.customId === 'right') {
      index < data.link.length - 1 ? index++ : (index = 0)
    }
    botmsg = await botmsg.edit({
      embeds: [embed()],
      components: [row]
    })
    i.deferUpdate()
  })
}

async function displayDiff(message: Message) {
  const filter = (m: Message) => m.author.id === message.author.id
  const collector = message.channel.createMessageCollector({filter, time: 15000})

  logger.logging(`Try to diff record`)
  var botMsg = await message.channel.send(`Please enter Link of the shop to diff.`)
  collector.on('collect', async m => {
    const data = await db.getShopHistory(m.content, true)
    if (data.length !== 2) {
      logger.logging(`Older record not found`)
      message.channel.send('Older record not found')
      return
    }
    const embed = new MessageEmbed().addFields({
      name: `info diff`,
      value: `[${data[0].title}](${data[0].link})` + '\n' + diff(data[0].info, data[1].info)
    })
    logger.logging(`successfully diff ${m.content}`)
    message.channel.send({embeds: [embed]})
    try {
      await botMsg.delete()
      await m.delete()
    } catch (err) {
      console.log(err)
    }
  })
}

async function checker() {
  async function getShopList() {
    const searchPage = [
      'https://www.8591.com.tw/mobileGame-list.html?searchGame=35864&searchType=4',
      'https://www.8591.com.tw/mobileGame-list.html?searchGame=35864&searchServer=&searchType=4&searchKey=&firstRow=40'
    ]
    const Wlist = ['代打', '試煉', '競速', 'SS']
    const Blist = ['代抽', '代練', '代刷', '共鬥', '肝弟', '地獄']

    const result: Array<string> = []
    const titleList: Array<string> = []
    for (const url of searchPage) {
      const {body} = await undici.request(url)
      const {window} = new jsdom.JSDOM(await body.text())
      const shops = window.document.querySelectorAll('.w-currency')
      shops.forEach(shop => {
        const title = shop.querySelector('.c-title-line.c-title-head > a') as HTMLAnchorElement
        if (title != null) {
          if (titleList.indexOf(title.title) != -1) return
          let flag = true
          let w = Wlist.map(text => title.title.includes(text)).reduce((acc, curr) => acc || curr, false)
          let b = !Blist.map(text => title.title.includes(text)).reduce((acc, curr) => acc || curr, false)
          flag = w && b
          if (flag) {
            result.push('https://www.8591.com.tw' + title.href.substring(1))
            titleList.push(title.title)
          }
        }
      })
    }
    return result
  }

  async function compare(current: dataPool, old: dataPool = checkerData) {
    var modified = false
    if (channel == null) return
    if (old.link.length === 0) {
      displayChecker(channel, current)
      await db.updateShopList(current.link, current.title, current.info, current.hash)
      return true
    }

    var contentList: Array<string> = ['', '', '', '']
    const tag = ['new shop', 'title change', 'info change', 'shop delete']

    for (var i = 0; i < current.link.length; i++) {
      const oldIndex = old.link.indexOf(current.link[i])

      if (oldIndex === -1) {
        contentList[0] += `[${current.title[i]}](${current.link[i]})\n`
        await db.updateShopList([current.link[i]], [current.title[i]], [current.info[i]], [current.hash[i]])
        continue
      }

      if (current.title[i] != old.title[oldIndex]) {
        await db.discardShop(current.link[i])
        contentList[1] += `[${old.title[oldIndex]}](${current.link[i]})->\n[${current.title[i]}](${current.link[i]})\n`
        await db.updateShopList([current.link[i]], [current.title[i]], [current.info[i]], [current.hash[i]])
        continue
      }

      if (current.info[i] != old.info[oldIndex]) {
        await db.discardShop(current.link[i])
        contentList[2] += `[${current.title[i]}](${current.link[i]})\n`
        await db.updateShopList([current.link[i]], [current.title[i]], [current.info[i]], [current.hash[i]])
      }
    }

    for (var i = 0; i < old.link.length; i++) {
      const newIndex = current.link.indexOf(old.link[i])
      if (newIndex === -1) {
        await db.discardShop(old.link[i], true)
        contentList[3] += `${old.title[i]}](${old.link[i]})\n`
      }
    }

    for (var i = 0; i < contentList.length; i++) {
      if (contentList[i].length > 0) {
        modified = true
        const embed = new MessageEmbed().addFields({name: tag[i], value: contentList[i]})
        channel.send({
          embeds: [embed]
        })
      }
    }
    return modified
  }
  console.log('Init checker.')
  checkerData = new dataPool()
  const channel = (await client.channels.fetch('938732984973017129')) as TextChannel
  await channel.send(`Init checker.`)
  let botMsg = await channel.send(`Fetching shop list.`)

  while (checkerFlag) {
    console.log('Fetching shop list.')
    const shopList = await getShopList()
    var currentData = new dataPool()

    for (const link of shopList) {
      const {body} = await undici.request(link)
      const {window} = new jsdom.JSDOM(await body.text())
      const info = window.document.querySelector('#editer_main > div')
      if (info != null) {
        let images = window.document.querySelectorAll('#editer_main > div > img') as NodeListOf<HTMLImageElement>
        let str = ''
        images.forEach(img => {
          str = str + img.src + '\n'
        })
        currentData.link.push(link)
        currentData.title.push(window.document.title)
        currentData.info.push(str + html2text(info.innerHTML))
        currentData.hash.push(hashCode(info.innerHTML))
        currentData.date.push(Date.now())
      }
    }

    console.log('Checking data.')
    await botMsg.edit(`Checking data.`)
    var modified = await compare(currentData)
    var atLast = await channel.messages.fetch({limit: 1}).then(msg => {
      let lastMsg = msg.first()
      return lastMsg?.id === botMsg.id
    })
    if (modified || !atLast) {
      botMsg.delete()
      botMsg = await channel.send(`Last updated: ${timeString()}`)
    } else {
      botMsg.edit(`Last updated: ${timeString()}`)
    }
    checkerData = currentData
    //move update to compare()
    //db.updateDBShopList(checkerData.link, checkerData.title, checkerData.info, checkerData.hash)

    //update per 10 min
    for (var i = 0; i < 600; i++) {
      await sleep(1000)
      if (!checkerFlag) break
    }
  }

  channel.send(`Checker exited.`)
}

async function dbManger(message: Message, type: string) {
  const filter = (m: Message) => m.author.id === message.author.id
  const collector = message.channel.createMessageCollector({filter, time: 15000})
  if (type === 'create') {
    logger.logging(`Try to create new record`)
    var botMsg = await message.channel.send(`Please enter Link, Tilte and Info Hash.`)
    collector.on('collect', async m => {
      let data = m.content.split(' ')
      if (data.length !== 4) {
        message.channel.send(`Invalid length.`)
        return
      }
      let result = await db.updateShopList([data[0]], [data[1]], [data[2]], [Number(data[3])])
      if (result[0] === 0) {
        logger.logging(`Record of ${data[0]} successfully created`)
        message.channel.send(`Record of ${data[0]} successfully created`)
      } else {
        logger.logging(`Record of ${data[0]} already esixt and update to new values`)
        message.channel.send(`Record of ${data[0]} already esixt and update to new values`)
      }
      try {
        await botMsg.delete()
        await m.delete()
      } catch (err) {
        console.log(err)
      }
    })
  }
  if (type === 'update') {
    logger.logging(`Try to update record`)
    var botMsg = await message.channel.send(`Please enter the Link of record, new tilte, info and hash.`)
    collector.on('collect', async m => {
      let data = m.content.split(' ')
      if (data.length !== 4) {
        message.channel.send(`Invalid length.`)
        return
      }
      let result = await db.updateShopList([data[0]], [data[1]], [data[2]], [Number(data[3])], false)
      if (result[1]) {
        logger.logging(`Record of ${data[0]} successfully updated`)
        message.channel.send(`Record of ${data[0]} successfully updated`)
      } else {
        logger.logging(`Record of ${data[0]} not found`)
        message.channel.send(`Record of ${data[0]} not found`)
      }
      try {
        await botMsg.delete()
        await m.delete()
      } catch (err) {
        console.log(err)
      }
    })
  }
  if (type === 'delete') {
    logger.logging(`Try to delete record`)
    var botMsg = await message.channel.send(`Please enter the Link of record`)
    collector.on('collect', async m => {
      if (m.content === 'all') {
        var result = await db.deleteAllShop()
      } else {
        var result = await db.deleteShop(m.content)
      }
      if (result) {
        logger.logging(`Successfully deleted ${result} document.`)
        message.channel.send(`Successfully deleted ${result} document.`)
      } else {
        logger.logging(`Record not found`)
        message.channel.send(`Record not found`)
      }
      try {
        await botMsg.delete()
        await m.delete()
      } catch (err) {
        console.log(err)
      }
    })
  }
  if (type === 'history') {
    logger.logging(`Try to get history record`)
    var botMsg = await message.channel.send(`Please enter the Link of record`)
    collector.on('collect', async m => {
      var result = await db.getShopHistory(m.content)
      if (result.length) {
        displayHistory(message.channel as TextChannel, result)
        logger.logging(`Found ${result.length} record`)
        message.channel.send(`Found ${result.length} record`)
      } else {
        logger.logging(`Record not found`)
        message.channel.send(`Record not found`)
      }
      try {
        await botMsg.delete()
        await m.delete()
      } catch (err) {
        console.log(err)
      }
    })
  }
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

  if (args[0].slice(2) === 'rangedelete' || args[0].slice(2) === 'rd') {
    if (args.length != 3) {
      message.channel.send('Invalid arguments count\nUsage:  !!rangedelete  MessageID1  MessageID2')
      return
    }
    rangedelete(message)
    return
  }

  if (args[0].slice(2) === 'logs') {
    let size = 20
    if (args.length == 2) {
      if (isNaN(parseInt(args[1], 10))) {
        message.channel.send('Invalid arguments count\nUsage:  !!logs  (size)')
        return
      }
      size = parseInt(args[1], 10)
    }
    let log = '`' + logger.getLog(size).reduce((a, b) => a + '\n' + b) + '`'
    message.channel.send({
      content: log
    })
  }

  if (args[0].slice(2) === 'checker') {
    if (message.guild.id != '923553217671987201') {
      return
    }
    if (args.length != 2) {
      message.channel.send('Invalid arguments count\nUsage:  !!checker  on/off/display/price/diff')
      return
    }
    if (args[1] === 'on' && !checkerFlag) {
      checkerFlag = true
      checker()
    }
    if (args[1] === 'off') {
      checkerFlag = false
    }
    if (args[1] === 'display') {
      if (checkerFlag) {
        displayChecker(message.channel as TextChannel, checkerData)
      } else {
        message.channel.send({
          content: 'Checker off.'
        })
      }
    }
    if (args[1] === 'price') {
      if (checkerFlag) {
        displayPrice(message.channel as TextChannel, checkerData)
      } else {
        message.channel.send({
          content: 'Checker off.'
        })
      }
    }
    if (args[1] === 'diff') {
      if (checkerFlag) {
        displayDiff(message)
      } else {
        message.channel.send({
          content: 'Checker off.'
        })
      }
    }
  }

  if (args[0].slice(2) === 'db') {
    if (message.guild.id !== '923553217' && message.author.id !== '472053971406815242') {
      return
    }
    if (args.length != 2) {
      message.channel.send('Invalid arguments count\nUsage:  !!db  create/update/delete/history')
      return
    }
    const options = ['create', 'update', 'delete', 'history']
    if (options.map(o => args[1] === o).reduce((acc, curr) => acc || curr, false)) {
      dbManger(message, args[1])
    } else {
      message.channel.send('Invalid options\nUsage:  !!db  create/update/delete/history')
      return
    }
  }

  if (args[0].slice(2) === 'help') {
    message.channel.send(
      '**`command list:`**`\n!!rangedelete  MessageID1  MessageID2\n!!logs  (Size)\n!!checker  (on/off/display/price/diff)\n!!db  (create/update/delete/history)\n!!help`'
    )
    // message.channel.send({
    //   content:
    //     '**`command list:`**`\n!!rangedelete  MessageID1  MessageID2\n!!logs  (Size)\n!!checker  (on/off/display)\n!!db  (create/update/delete)\n!!help`'
    // })
  }
})

client.login(process.env.TOKEN)
