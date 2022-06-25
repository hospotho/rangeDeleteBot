import {TextChannel, MessageEmbed} from 'discord.js'
import undici from 'undici'
import jsdom from 'jsdom'

import {logStack, dataPool} from './cache'
import * as db from './database'
import {sleep, hashCode, html2text, timeString} from './utility'
import {displayChecker} from '../command/display'

const logger = logStack.getLogger()

export class crawler {
  channel?: TextChannel
  checkerFlag: boolean
  newFlag: boolean
  updaeFlag: boolean

  constructor() {
    this.checkerFlag = false
    this.newFlag = true
    this.updaeFlag = false
  }

  public async start() {
    const channel = this.channel
    this.checkerFlag = true
    if (!channel) {
      logger.logging('Channel undefined.')
      return
    }

    async function getShopList() {
      const searchPage = [
        'https://www.8591.com.tw/mobileGame-list.html?searchGame=35864&searchType=4',
        'https://www.8591.com.tw/mobileGame-list.html?searchGame=35864&searchServer=&searchType=4&searchKey=&firstRow=40'
      ]
      const Wlist = ['代打', '試煉', '競速', 'SS']
      const Blist = ['代抽', '代練', '代刷', '共鬥', '肝弟', '地獄', '大蛇', '青之女王', '5200']

      const result: Array<string> = []
      const titleList: Array<string> = []
      const currentData = dataPool.getEmptyDataPool()

      async function safeRequest(url: string) {
        var count = 0
        var response = await undici.request(url)
        while (response.statusCode !== 200 && count < 5) {
          await sleep(1000)
          count++
          response = await undici.request(url)
        }
        if (response.statusCode !== 200) {
          throw new Error(`Fail to fetch ${url} within 5 tries, statusCode: ${response.statusCode}.`)
        }
        return response
      }

      try {
        for (const url of searchPage) {
          const {body} = await safeRequest(url)
          const {window} = new jsdom.JSDOM(await body.text())
          const shops = window.document.querySelectorAll('.w-currency')
          shops.forEach(shop => {
            const title = shop.querySelector('.c-title-line.c-title-head > a') as HTMLAnchorElement
            if (title != null) {
              if (titleList.indexOf(title.title) != -1) return
              let w = Wlist.map(text => title.title.includes(text)).reduce((acc, curr) => acc || curr, false)
              let b = !Blist.map(text => title.title.includes(text)).reduce((acc, curr) => acc || curr, false)
              if (w && b) {
                result.push('https://www.8591.com.tw' + title.href.substring(1))
                titleList.push(title.title)
              }
            }
          })
        }

        for (const link of result) {
          const {body} = await safeRequest(link)
          const {window} = new jsdom.JSDOM(await body.text())
          const info = window.document.querySelector('#editer_main > div')
          if (info) {
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
      } catch (e) {
        if (e instanceof Error) {
          return e
        }
      }

      return currentData
    }

    async function compareAndDisplay(current: dataPool, old: dataPool) {
      var modified = false
      if (channel == null) return
      if (old.link.length === 0) {
        await db.updateShopList(current.link, current.title, current.info, current.hash)
        return true
      }

      var contentList: Array<string> = ['', '', '', '']
      const tag = ['new shop', 'title change', 'info change', 'shop delete']

      for (var i = 0; i < current.link.length; i++) {
        const oldIndex = old.link.indexOf(current.link[i])
        let discard = false
        let insert = false

        if (oldIndex === -1) {
          insert = true
          contentList[0] += `[${current.title[i]}](${current.link[i]})\n`
          continue
        }

        if (current.title[i] !== old.title[oldIndex]) {
          discard = true
          insert = true
          contentList[1] += `[${old.title[oldIndex]}](${current.link[i]})->\n[${current.title[i]}](${current.link[i]})\n`
        }

        if (current.hash[i] !== old.hash[oldIndex]) {
          discard = true
          insert = true
          contentList[2] += `[${current.title[i]}](${current.link[i]})\n`
        }

        if (discard) await db.discardShop(current.link[i])
        if (insert) await db.insertShop(current.link[i], current.title[i], current.info[i], current.hash[i])
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

    const eventLoop = async () => {
      const checkerData = dataPool.getDataPool()
      this.updaeFlag = false
      logger.logging('Fetching shop list.')
      var currentData = await getShopList()
      if (currentData instanceof Error) {
        logger.logging(currentData.message)
        channel.send(currentData.message)
        return
      }

      if (this.newFlag) {
        this.newFlag = false
        botMsg.delete()
        displayChecker(channel, currentData)
        await compareAndDisplay(currentData, checkerData)
        dataPool.setNewDataPool(currentData)
        botMsg = await channel.send(`Last updated: ${timeString()}`)
        return
      }

      logger.logging('Checking data.')
      await botMsg.edit(`Checking data.`)
      var modified = await compareAndDisplay(currentData, checkerData)
      var atLast = await channel.messages.fetch({limit: 1}).then(msgs => msgs.first()?.id === botMsg.id)
      dataPool.setNewDataPool(currentData)

      if (modified || !atLast) {
        botMsg.delete()
        botMsg = await channel.send(`Last updated: ${timeString()}`)
      } else {
        botMsg.edit(`Last updated: ${timeString()}`)
      }
    }

    logger.logging('Init checker.')
    let initMsg = await channel.send(`Init checker.`)
    setTimeout(() => {
      initMsg.delete()
    }, 60000)
    let botMsg = await channel.send(`Fetching shop list.`)
    while (this.checkerFlag) {
      await eventLoop()
      //update per 10 min
      for (var i = 0; i < 600; i++) {
        await sleep(1000)
        if (!this.checkerFlag || this.updaeFlag) break
      }
    }
    logger.logging(`Checker exited.`)
    channel.send(`Checker exited.`)
  }

  public exit() {
    if (!this.checkerFlag) {
      logger.logging('Checker is already stopped')
      return
    } else {
      this.checkerFlag = false
      this.newFlag = true
      this.updaeFlag = false
      return
    }
  }
}
