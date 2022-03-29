import {MongoClient, UpdateResult} from 'mongodb'
import dotenv from 'dotenv'
dotenv.config()

const uri = process.env.DB_CONN_STRING
const client = new MongoClient(uri as string)

interface Shop {
  link: string
  title: string
  info: number
}

export async function getDBShopList() {
  try {
    await client.connect()
    const database = client.db('BotDB')
    const shops = database.collection<Shop>('ShopList')
    const cursor = shops.find<Shop>({
      sort: {title: 1},
      projection: {_id: 0, link: 1, title: 1, info: 1}
    })
    if ((await shops.countDocuments()) === 0) {
      console.warn('No documents found!')
    }
    return await cursor.toArray()
  } finally {
    await client.close()
  }
}

export async function updateDBShopList(links: Array<string>, titles: Array<string>, infos: Array<number>) {
  try {
    await client.connect()
    const database = client.db('BotDB')
    const shops = database.collection<Shop>('ShopList')
    const promiseList: Array<Promise<UpdateResult>> = []
    for (let i = 0; i < links.length; i++) {
      promiseList.push(
        shops.updateOne(
          {
            link: links[i]
          },
          {
            $set: {
              title: titles[i],
              info: infos[i]
            }
          },
          {upsert: true}
        )
      )
    }
    const result = await Promise.all(promiseList)
    const match = result.reduce((r, c) => r + c.matchedCount, 0)
    const update = result.reduce((r, c) => r + c.modifiedCount, 0)
    console.log(`${match} document(s) matched the filter, updated ${update} document(s)`)
  } finally {
    await client.close()
  }
}

export async function deleteDBShopList(_link: string) {
  try {
    await client.connect()
    const database = client.db('BotDB')
    const shops = database.collection<Shop>('ShopList')
    const query = {link: _link}
    const result = await shops.deleteOne(query)
    if (result.deletedCount === 1) {
      console.log('Successfully deleted one document.')
    } else {
      console.log('No documents matched the query. Deleted 0 documents.')
    }
  } finally {
    await client.close()
  }
}
