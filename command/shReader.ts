import {TextChannel} from 'discord.js'
import {GoogleSpreadsheet, ServiceAccountCredentials} from 'google-spreadsheet'
import {timeString} from '../src/utility'
import {displaySheet} from '../command/display'
import dotenv from 'dotenv'
dotenv.config()

export async function shReader(channel: TextChannel, _id: number, type: string) {
  const doc = new GoogleSpreadsheet(process.env.docID)
  await doc.useServiceAccountAuth({
    client_email: process.env.client_email,
    private_key: process.env.private_key
  } as ServiceAccountCredentials)
  await doc.loadInfo()
  const sheet = doc.sheetsById['1568688647']
  await sheet.loadCells(`A${_id + 1}:H${_id + 1}`)
  const result = ['id', String(_id)]

  if (type === '') {
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
  }

  if (type === '85') {
    result.push('85id')
    result.push(String(sheet.getCell(_id, 2).value))
    result.push('Order no.')
    result.push(String(sheet.getCell(_id, 7).value))
    result.push('P.S')
    result.push(String(sheet.getCell(_id, 6).value))
  }

  if (type === 'all') {
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
  }

  displaySheet(channel, result)
}
