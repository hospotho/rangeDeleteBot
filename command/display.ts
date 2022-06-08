import {Message, TextChannel, MessageEmbed, MessageActionRow, MessageButton, Interaction, MessageComponentInteraction} from 'discord.js'
import {logStack, dataPool} from '../src/cache'
import * as db from '../src/database'
import {timeString, text2price, diff, text2view} from '../src/utility'

const logger = logStack.getLogger()

export async function displayChecker(channel: TextChannel, data: dataPool) {
  const length = data.link.length
  logger.logging(`Display data, length:  ${length}.`)
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

export async function displayHistory(channel: TextChannel, data: Array<db.Shop>) {
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

export async function displayPrice(channel: TextChannel, data: dataPool, full: boolean = false) {
  var index = 0
  var textFunc = full ? text2view : text2price

  const embed = () =>
    new MessageEmbed().addFields({
      name: `${index + 1}/${data.link.length}`,
      value: `[${data.title[index]}](${data.link[index]})\n${textFunc(data.info[index])}`
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
      index ? index-- : index = data.link.length - 1
    }
    if (i.customId === 'right') {
      index < data.link.length - 1 ? index++ : index = 0
    }
    botmsg = await botmsg.edit({
      embeds: [embed()],
      components: [row]
    })
    i.deferUpdate()
  })
}

export async function displayDiff(message: Message) {
  logger.logging(`Try to diff record`)
  var botMsg = await message.channel.send(`Please enter Link of the shop to diff.`)

  const filter = (m: Message) => m.author.id === message.author.id
  const collector = message.channel.createMessageCollector({filter, time: 15000})

  collector.on('collect', async m => {
    const data = await db.getShopHistory(m.content, true)
    if (data.length !== 2) {
      logger.logging(`Older record not found`)
      message.channel.send('Older record not found')
      return
    }

    const embed = new MessageEmbed().addFields({
      name: 'info diff',
      value: `[${data[0].title}](${m.content})\n${diff(data[0].info, data[1].info)}`
    })
    logger.logging(`successfully diff ${m.content}`)
    message.channel.send({embeds: [embed]})

    try {
      await botMsg.delete()
      await m.delete()
    } catch (e) {
      if (e instanceof Error) {
        logger.logging(e.message)
      }
    }
  })
}

export async function displaySheet(channel: TextChannel, data: Array<string>) {
  const embed = new MessageEmbed()
  const fields = []
  for (let i = 0; i < data.length; i += 2) {
    fields.push({name: data[i], value: data[i + 1], inline: true})
  }
  embed.addFields(fields)
  channel.send({embeds: [embed]})
}
