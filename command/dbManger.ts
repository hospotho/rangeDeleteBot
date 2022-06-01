import {Message, TextChannel} from 'discord.js'
import {logStack} from '../src/cache'
import * as db from '../src/database'
import {displayHistory} from '../command/display'

const logger = logStack.getLogger()

export async function dbManger(message: Message, type: string) {
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
        if (err instanceof Error) {
          logger.logging(err.message)
        }
      }
    })
    return
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
        if (err instanceof Error) {
          logger.logging(err.message)
        }
      }
    })
    return
  }
  if (type === 'delete') {
    logger.logging(`Try to delete record`)
    var botMsg = await message.channel.send(`Please enter the Link of record`)
    collector.on('collect', async m => {
      let result
      if (m.content === 'all') {
        result = await db.deleteAllShop()
      } else {
        result = await db.deleteShop(m.content)
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
        if (err instanceof Error) {
          logger.logging(err.message)
        }
      }
    })
    return
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
        if (err instanceof Error) {
          logger.logging(err.message)
        }
      }
    })
    return
  }
}
