import {MongoClient, UpdateResult} from 'mongodb'
import dotenv from 'dotenv'
dotenv.config()

const uri = process.env.DB_CONN_STRING
const client = new MongoClient(uri as string)

export interface Shop {
  link: string
  title: string
  info: string
  hash: number
  date: number
  modified: boolean
  deleted: boolean
}

export async function getShopList() {
  try {
    await client.connect()
    const database = client.db('BotDB')
    const shops = database.collection<Shop>('ShopList')
    const cursor = shops.find<Shop>(
      {
        modified: false,
        deleted: false
      },
      {
        sort: {title: 1},
        projection: {_id: 0, modified: 0, deleted: 0}
      }
    )
    if ((await shops.countDocuments()) === 0) {
      console.warn('No documents found!')
    }
    return await cursor.toArray()
  } finally {
    await client.close()
  }
}

export async function getShopHistory(_link: string, last: boolean = false) {
  try {
    await client.connect()
    const database = client.db('BotDB')
    const shops = database.collection<Shop>('ShopList')
    const cursor = shops.find<Shop>(
      {
        link: _link
      },
      {
        sort: {title: 1},
        projection: {_id: 0, link: 0, hash: 0, modified: 0},
        limit: last ? 2 : 50
      }
    )
    if ((await shops.countDocuments()) === 0) {
      console.warn('No documents found!')
    }
    return await cursor.toArray()
  } finally {
    await client.close()
  }
}

export async function updateShopList(
  links: Array<string>,
  titles: Array<string>,
  infos: Array<string>,
  hashs: Array<number>,
  _upsert: boolean = true
) {
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
              info: infos[i],
              hash: hashs[i],
              date: Date.now(),
              modified: false,
              deleted: false
            }
          },
          {upsert: _upsert}
        )
      )
    }
    const result = await Promise.all(promiseList)
    const match = result.reduce((r, c) => r + c.matchedCount, 0)
    const update = result.reduce((r, c) => r + c.modifiedCount, 0)
    const upsert = result.reduce((r, c) => r + c.upsertedCount, 0)
    console.log(`${match} document(s) matched the filter, updated ${update} document(s), upserted ${upsert} document(s)`)
    return [match, update, upsert]
  } finally {
    await client.close()
  }
}

export async function discardShop(_link: string, _deleted: boolean = false) {
  try {
    await client.connect()
    const database = client.db('BotDB')
    const shops = database.collection<Shop>('ShopList')
    const result = await shops.updateOne(
      {link: _link, modified: false},
      {
        $set: {
          modified: true,
          deleted: _deleted
        }
      }
    )
    if (result.modifiedCount) {
      console.log(`Successfully discard old shop data.`)
      return true
    } else {
      console.log('No documents matched the query.')
      return false
    }
  } finally {
    await client.close()
  }
}

export async function deleteShop(_link: string) {
  try {
    await client.connect()
    const database = client.db('BotDB')
    const shops = database.collection<Shop>('ShopList')
    const result = await shops.deleteMany({link: _link})
    if (result.deletedCount) {
      console.log(`Successfully deleted ${result.deletedCount} document.`)
    } else {
      console.log('No documents matched the query. Deleted 0 documents.')
    }
    return result.deletedCount
  } finally {
    await client.close()
  }
}

export async function deleteAllShop() {
  try {
    await client.connect()
    const database = client.db('BotDB')
    const shops = database.collection<Shop>('ShopList')
    const query = {}
    const result = await shops.deleteMany(query)
    if (result.deletedCount) {
      console.log(`Successfully deleted ${result.deletedCount} document.`)
    } else {
      console.log('No documents matched the query. Deleted 0 documents.')
    }
    return result.deletedCount
  } finally {
    await client.close()
  }
}
