import {TextChannel, Message} from 'discord.js'
import {GoogleSpreadsheet, ServiceAccountCredentials} from 'google-spreadsheet'
import {timeString} from '../src/utility'
import {displaySheet} from './display'
import dotenv from 'dotenv'
dotenv.config()

export async function shReader(message: Message) {
  const channel = message.channel as TextChannel
  const args = message.content.split(' ')

  if (args.length !== 2 && args.length !== 3) {
    channel.send('Invalid arguments count\nUsage:  !!googlesheet/gs  id/85id/DC  (85/all/state)')
    return
  }

  const options = ['', '85', 'all', 'state']
  const option = args.length === 2 ? '' : args[2]
  if (!options.includes(option)) {
    channel.send('Invalid options\nUsage:  !!googlesheet/gs  id/85id/DC  (85/all/state)')
    return
  }

  const id = args[1]
  let typeFlag = 0 || +/^\d{1,3}$/.test(id) || 2 * +/^\d{5,8}$/.test(id) || 3 * +/^.{2,}$/.test(id)
  if (!typeFlag) {
    channel.send('Invalid ID\nUsage:  !!googlesheet/gs  id/85id/DC  (85/all/state)')
    return
  }

  const doc = new GoogleSpreadsheet(process.env.docID)
  await doc.useServiceAccountAuth({
    client_email: process.env.client_email,
    private_key: process.env.private_key
  } as ServiceAccountCredentials)
  await doc.loadInfo()

  let _id = -1
  if (typeFlag === 1) {
    _id = Number(id) || -1
  }
  //search by formula
  if (typeFlag === 2) {
    const sheet = doc.sheetsByIndex[0]
    await sheet.loadCells('V17')
    const inputCell = sheet.getCellByA1('V17')
    inputCell.value = Number(id)
    await sheet.saveCells([inputCell])
    await sheet.loadCells('V18')
    let data = sheet.getCellByA1('V18').value
    _id = Number(data) || -1
  }
  if (typeFlag === 3) {
    const sheet = doc.sheetsByIndex[0]
    await sheet.loadCells('V22')
    const inputCell = sheet.getCellByA1('V22')
    inputCell.value = id
    await sheet.saveCells([inputCell])
    await sheet.loadCells('V23')
    let data = sheet.getCellByA1('V23').value
    _id = Number(data) || -1
  }

  if (_id === -1) {
    channel.send('ID not found\nUsage:  !!googlesheet/gs  id/85id/DC  (85/all/state)')
    return
  }

  //id of raw data
  if (option === '') {
    const sheet = doc.sheetsById[process.env.sheetID as string]
    await sheet.loadCells(`A${_id + 1}:H${_id + 1}`)
    const result = ['id', String(_id)]
    result.push('85ID')
    result.push(String(sheet.getCell(_id, 2).value))
    result.push('dcID')
    result.push(String(sheet.getCell(_id, 3).value))
    result.push('ACC')
    result.push(String(sheet.getCell(_id, 4).value))
    result.push('PWD')
    result.push(String(sheet.getCell(_id, 5).value))
    result.push('P.S')
    result.push(String(sheet.getCell(_id, 6).value))
    return displaySheet(channel, result)
  }

  if (option === '85') {
    const sheet = doc.sheetsById['1568688647']
    await sheet.loadCells(`A${_id + 1}:H${_id + 1}`)
    const result = ['id', String(_id)]
    result.push('85ID')
    result.push(String(sheet.getCell(_id, 2).value))
    result.push('Order no.')
    result.push(String(sheet.getCell(_id, 7).value))
    result.push('P.S')
    result.push(String(sheet.getCell(_id, 6).value))
    return displaySheet(channel, result)
  }

  if (option === 'all') {
    const sheet = doc.sheetsById['1568688647']
    await sheet.loadCells(`A${_id + 1}:H${_id + 1}`)
    const result = ['id', String(_id)]
    result.push('Date')
    result.push(timeString((((sheet.getCell(_id, 0).value as number) + 14 * 365) * 24 + 16) * 60 * 60 * 1000))
    result.push('Region')
    result.push(String(sheet.getCell(_id, 1).value))
    result.push('85ID')
    result.push(String(sheet.getCell(_id, 2).value))
    result.push('dcID')
    result.push(String(sheet.getCell(_id, 3).value))
    result.push('ACC')
    result.push(String(sheet.getCell(_id, 4).value))
    result.push('PWD')
    result.push(String(sheet.getCell(_id, 5).value))
    result.push('P.S')
    result.push(String(sheet.getCell(_id, 6).value))
    result.push('Order no.')
    result.push(String(sheet.getCell(_id, 7).value))
    return displaySheet(channel, result)
  }

  if (option === 'state') {
    const sheet = doc.sheetsByIndex[0]
    await sheet.loadCells(`A${_id + 1}:P${_id + 1}`)
    const result = ['id', String(_id)]
    result.push('Booster')
    result.push(String(sheet.getCell(_id, 7).value))
    result.push('State')
    result.push(String(sheet.getCell(_id, 11).value))
    result.push('Time')
    result.push((sheet.getCell(_id, 8).value as number).toFixed(2))
    result.push('Video')
    result.push(`[link](${String(sheet.getCell(_id, 9).hyperlink)})`)
    result.push('P.S')
    result.push(String(sheet.getCell(_id, 6).value))
    return displaySheet(channel, result)
  }
}

export async function shSubmitTime(message: Message) {
  const args = message.content.split(' ')
  const channel = message.channel

  if (args.length !== 4 && args.length !== 5) {
    channel.send('Invalid arguments count\nUsage:  !!submit  id/85id/DC  time  v_url  (7/t/w)')
    return
  }

  const id = args[1]
  const time = args[2]
  const v_url = args[3]
  const booster = args[4] || ''

  const boosterList: {[tag: string]: string} = {'Willie#4865': 'Willie', '7貓Lemon#1664': 'cat', 'tony#7515': 'Tony', w: 'Willie', '7': 'cat', t: 'Tony'}
  const name = boosterList[booster] || boosterList[message.author.tag] || ''

  if (!name && booster) {
    channel.send('Invalid booster\nUsage:  !!submit  id/85id/DC  time(xx.xx)  v_url  (7/t/w)')
    return
  }
  if (!name && !booster) {
    channel.send('Invalid sender, not in the list\nUsage:  !!submit  id/85id/DC  time(xx.xx)  v_url  (7/t/w)')
    return
  }

  let typeFlag = 0 || +/^\d{1,3}$/.test(id) || 2 * +/^\d{5,8}$/.test(id) || 3 * +/^.{2,}$/.test(id)
  if (!typeFlag) {
    channel.send('Invalid ID\nUsage:  !!submit  id/85id/DC  time(xx.xx)  v_url  (7/t/w)')
    return
  }

  if (!/\d{1,3}\.\d{2}/.test(time)) {
    channel.send('Invalid time\nUsage:  !!submit  id/85id/DC  time(xx.xx)  v_url  (7/t/w)')
    return
  }

  const doc = new GoogleSpreadsheet(process.env.docID)
  await doc.useServiceAccountAuth({
    client_email: process.env.client_email,
    private_key: process.env.private_key
  } as ServiceAccountCredentials)
  await doc.loadInfo()

  let _id = -1
  if (typeFlag === 1) {
    _id = Number(id) || -1
  }
  //search by formula
  if (typeFlag === 2) {
    const sheet = doc.sheetsByIndex[0]
    await sheet.loadCells('V17')
    const inputCell = sheet.getCellByA1('V17')
    inputCell.value = Number(id)
    await sheet.saveCells([inputCell])
    await sheet.loadCells('V18')
    let data = sheet.getCellByA1('V18').value
    _id = Number(data) || -1
  }
  if (typeFlag === 3) {
    const sheet = doc.sheetsByIndex[0]
    await sheet.loadCells('V22')
    const inputCell = sheet.getCellByA1('V22')
    inputCell.value = id
    await sheet.saveCells([inputCell])
    await sheet.loadCells('V23')
    let data = sheet.getCellByA1('V23').value
    _id = Number(data) || -1
  }

  if (_id === -1) {
    channel.send('ID not found\nUsage:  !!submit  id/85id/DC  time(xx.xx)  v_url  (7/t/w)')
    return
  }

  const sheet = doc.sheetsByIndex[0]
  await sheet.loadCells(`H${_id + 1}:J${_id + 1}`)
  sheet.getCellByA1(`H${_id + 1}`).value = name
  sheet.getCellByA1(`I${_id + 1}`).value = Number(time)
  sheet.getCellByA1(`J${_id + 1}`).formula = `=HYPERLINK("${v_url}", "link")`
  sheet.saveUpdatedCells()
  channel.send('Video submited')
  return
}
