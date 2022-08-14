import {Message, TextChannel} from 'discord.js'
import {logStack} from '../src/cache'
import * as db from '../src/database'
import {displayHistory} from '../command/display'

const logger = logStack.getLogger()

async function handleCreate(message: Message) {
  const filter = (msg: Message) => msg.author.id === message.author.id
  const collector = message.channel.createMessageCollector({filter, time: 15000})

  logger.logging(`Try to create new record`)
  const botMsg = await message.channel.send(`Please enter Link, Tilte and Info Hash.`)

  collector.on('collect', async (msg: Message) => {
    const data = msg.content.split(' ')
    if (data.length !== 4) {
      message.channel.send(`Invalid length.`)
      return
    }

    const result = await db.updateShopList([data[0]], [data[1]], [data[2]], [Number(data[3])])
    if (result[0] === 0) {
      logger.logging(`Record of ${data[0]} successfully created`)
      message.channel.send(`Record of ${data[0]} successfully created`)
    } else {
      logger.logging(`Record of ${data[0]} already esixt and update to new values`)
      message.channel.send(`Record of ${data[0]} already esixt and update to new values`)
    }

    try {
      await botMsg.delete()
      await msg.delete()
    } catch (err) {
      if (err instanceof Error) {
        logger.logging(err.message)
      }
    }
  })
}

async function handleUpdate(message: Message) {
  const filter = (msg: Message) => msg.author.id === message.author.id
  const collector = message.channel.createMessageCollector({filter, time: 15000})

  logger.logging(`Try to update record`)
  const botMsg = await message.channel.send(`Please enter the Link of record, new tilte, info and hash.`)

  collector.on('collect', async (msg: Message) => {
    const data = msg.content.split(' ')
    if (data.length !== 4) {
      message.channel.send(`Invalid length.`)
      return
    }

    const result = await db.updateShopList([data[0]], [data[1]], [data[2]], [Number(data[3])], false)
    if (result[1]) {
      logger.logging(`Record of ${data[0]} successfully updated`)
      message.channel.send(`Record of ${data[0]} successfully updated`)
    } else {
      logger.logging(`Record of ${data[0]} not found`)
      message.channel.send(`Record of ${data[0]} not found`)
    }

    try {
      await botMsg.delete()
      await msg.delete()
    } catch (err) {
      if (err instanceof Error) {
        logger.logging(err.message)
      }
    }
  })
  return
}

async function handleDelete(message: Message) {
  const filter = (msg: Message) => msg.author.id === message.author.id
  const collector = message.channel.createMessageCollector({filter, time: 15000})

  logger.logging(`Try to delete record`)
  const botMsg = await message.channel.send(`Please enter the Link of record`)

  collector.on('collect', async (msg: Message) => {
    const result = msg.content === 'all' ? await db.deleteAllShop() : await db.deleteShop(msg.content)
    if (result) {
      logger.logging(`Successfully deleted ${result} document.`)
      message.channel.send(`Successfully deleted ${result} document.`)
    } else {
      logger.logging(`Record not found`)
      message.channel.send(`Record not found`)
    }
    try {
      await botMsg.delete()
      await msg.delete()
    } catch (err) {
      if (err instanceof Error) {
        logger.logging(err.message)
      }
    }
  })
  return
}

async function handleHistory(message: Message) {
  const filter = (msg: Message) => msg.author.id === message.author.id
  const collector = message.channel.createMessageCollector({filter, time: 15000})

  logger.logging(`Try to get history record`)
  const botMsg = await message.channel.send(`Please enter the Link of record`)

  collector.on('collect', async (msg: Message) => {
    const result = await db.getShopHistory(msg.content)
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
      await msg.delete()
    } catch (err) {
      if (err instanceof Error) {
        logger.logging(err.message)
      }
    }
  })
  return
}

const funcDict: {[key: string]: Function} = {
  create: handleCreate,
  update: handleUpdate,
  delete: handleDelete,
  history: handleHistory
}

export async function dbManger(message: Message) {
  if (message.author.id !== '472053971406815242') return

  const channel = message.channel
  const args = message.content.split(' ')

  if (args.length !== 2) {
    channel.send('Invalid arguments count\nUsage:  !!database/db  create/update/delete/history')
    return
  }

  const options = ['create', 'update', 'delete', 'history']
  const type = args[1]
  if (options.includes(type)) {
    await funcDict[type](message)
  } else {
    channel.send('Invalid options\nUsage:  !!database/db  create/update/delete/history')
  }
  return
}
