"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importStar(require("discord.js"));
const undici_1 = __importDefault(require("undici"));
const jsdom_1 = __importDefault(require("jsdom"));
global.HTMLAnchorElement = new jsdom_1.default.JSDOM().window.HTMLAnchorElement;
const db = __importStar(require("./database"));
const utility_1 = require("./utility");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prefix = '!!';
var checkerFlag = false;
const client = new discord_js_1.default.Client({
    intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_MESSAGES]
});
class logStack {
    constructor(_size = 50) {
        this.logs = [];
        this.maxsize = _size;
    }
    logging(str) {
        if (this.logs.length === this.maxsize)
            this.logs.shift();
        this.logs.push(str);
        console.log(str);
    }
    getLog(size) {
        return this.logs.slice(Math.max(this.logs.length - size, 0));
    }
    clear() {
        this.logs = [];
    }
}
class dataPool {
    constructor() {
        this.link = [];
        this.title = [];
        this.info = [];
    }
}
var logger = new logStack();
var checkerData = new dataPool();
async function init() {
    const data = await db.getDBShopList();
    for (const shop of data) {
        checkerData.link.push(shop.link);
        checkerData.title.push(shop.title);
        checkerData.info.push(shop.info);
    }
    logger.logging('Old data is ready to use.');
    const channel = (await client.channels.fetch('938732984973017129'));
    const msg = await channel.messages.fetch({ limit: 1 }).then(coll => coll.first());
    if (msg === undefined)
        return;
    if (client.user !== null && msg.author.id === client.user.id) {
        logger.logging('Auto restart checker.');
        await channel.send(`Auto restart checker.`);
        checkerFlag = true;
        checker();
    }
}
client.on('ready', () => {
    logger.logging('The bot is ready.');
    init();
});
async function rangedelete(msg) {
    const message = msg;
    const channel = message.channel;
    const args = message.content.split(' ');
    if (args[1] === args[2]) {
        channel.send(`MessageID(1) and MessageID(2) should not be the same.`);
        return;
    }
    if (parseInt(args[1]) > parseInt(args[2])) {
        channel.send(`Message(1) is newer than Message(2).`);
        return;
    }
    async function fetch(_id, _ch = channel) {
        try {
            const msg = await _ch.messages.fetch(_id);
            return msg;
        }
        catch (error) {
            const channels = _ch.guild.channels.cache;
            for (const [_, ch] of channels) {
                if (!ch.isText())
                    continue;
                try {
                    const msg = await ch.messages.fetch(_id);
                    return msg;
                }
                catch (error) {
                    continue;
                }
            }
        }
    }
    const msg1 = await fetch(args[1]);
    if (!msg1) {
        channel.send(`Message(1) ${args[1]} not found.`);
        return;
    }
    const msg2 = await fetch(args[2]);
    if (!msg2) {
        channel.send(`Message(2) ${args[2]} not found.`);
        return;
    }
    if (channel != msg1.channel || msg1.channel != msg2.channel) {
        channel.send(`Messages need to be in same channel.`);
        return;
    }
    let startTime = Date.now();
    await message.delete();
    let botMsg = await channel.send(`Starting to delete messages from ${args[1]} to ${args[2]}.`).then(sent => {
        return sent;
    });
    logger.logging(`Range delete start by ${message.author.username} at #${channel.name} id: ${message.id}`);
    await channel.send(`<:gbf_makira_gun:685481376400932895>`);
    let msgs = await channel.messages.fetch({
        after: msg1.id,
        limit: 99
    });
    msgs = msgs.filter(m => m.createdTimestamp <= msg2.createdTimestamp);
    msgs = msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    await msg1.delete();
    let count = 1;
    await channel.bulkDelete(msgs).then(msg => (count += msg.size));
    while (!msgs.has(msg2.id)) {
        await botMsg.edit(`Still deleting, ${count} messages deleted so far`).then(() => logger.logging(`${count} messages deleted`));
        let tmp = msgs.lastKey();
        msgs = await channel.messages.fetch({
            after: tmp,
            limit: 100
        });
        msgs = msgs.filter(m => m.createdTimestamp <= msg2.createdTimestamp);
        msgs = msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        await channel.bulkDelete(msgs).then(msg => (count += msg.size));
    }
    let timeCost = (0, utility_1.msToMinSec)(Date.now() - startTime);
    await botMsg.edit(`Complete, ${count} messages deleted in ${timeCost}`).then(() => {
        logger.logging(`Complete, ${count} messages deleted in ${timeCost} id: ${message.id}`);
    });
}
async function displayChecker(channel, data) {
    const length = data.link.length;
    console.log(`Display data, length:  ${length}.`);
    channel.send(`Display data, length:  ${length}.`);
    for (var i = 0; i < length - (length % 5); i += 5) {
        var content = '';
        content += `[${data.title[i]}](${data.link[i]})\n`;
        content += `[${data.title[i + 1]}](${data.link[i + 1]})\n`;
        content += `[${data.title[i + 2]}](${data.link[i + 2]})\n`;
        content += `[${data.title[i + 3]}](${data.link[i + 3]})\n`;
        content += `[${data.title[i + 4]}](${data.link[i + 4]})\n`;
        const embed = new discord_js_1.MessageEmbed().addFields({ name: `${i + 1}-${i + 5}`, value: content });
        channel.send({
            embeds: [embed]
        });
    }
    if (length % 5 > 0) {
        var content = '';
        for (var i = Math.floor(length / 5) * 5; i < length; i++) {
            content += `[${data.title[i]}](${data.link[i]})\n`;
        }
        const embed = new discord_js_1.MessageEmbed().addFields({ name: `${Math.floor(length / 5) * 5 + 1}-${data.link.length}`, value: content });
        channel.send({
            embeds: [embed]
        });
    }
}
async function checker() {
    const searchPage = [
        'https://www.8591.com.tw/mobileGame-list.html?searchGame=35864&searchType=4',
        'https://www.8591.com.tw/mobileGame-list.html?searchGame=35864&searchServer=&searchType=4&searchKey=&firstRow=40'
    ];
    const conditions = ['代抽', '代練', '代刷', '共鬥', '肝弟', '地獄'];
    async function getShopList() {
        const result = [];
        const titleList = [];
        for (const url of searchPage) {
            const { body } = await undici_1.default.request(url);
            const { window } = new jsdom_1.default.JSDOM(await body.text());
            const shops = window.document.querySelectorAll('.w-currency');
            shops.forEach(shop => {
                const title = shop.querySelector('.c-title-line.c-title-head > a');
                if (title != null) {
                    if (titleList.indexOf(title.title) != -1)
                        return;
                    let flag = true;
                    for (let text of conditions) {
                        if (title.title.includes(text))
                            flag = false;
                    }
                    if (flag) {
                        result.push('https://www.8591.com.tw' + title.href.substring(1));
                        titleList.push(title.title);
                    }
                }
            });
        }
        return result;
    }
    async function compare(current, old = checkerData) {
        var modified = false;
        if (channel == null)
            return;
        if (old.link.length === 0) {
            displayChecker(channel, current);
            return true;
        }
        var contentList = ['', '', '', ''];
        const tag = ['new shop', 'title change', 'info change', 'shop delete'];
        for (var i = 0; i < current.link.length; i++) {
            const oldIndex = old.link.indexOf(current.link[i]);
            if (oldIndex === -1) {
                contentList[0] += `[${current.title[i]}](${current.link[i]})\n`;
                continue;
            }
            if (current.title[i] != old.title[oldIndex]) {
                contentList[1] += `[${old.title[oldIndex]}](${current.link[i]})->\n[${current.title[i]}](${current.link[i]})\n`;
                continue;
            }
            if (current.info[i] != old.info[oldIndex]) {
                contentList[2] += `[${current.title[oldIndex]}](${current.link[i]})\n`;
            }
        }
        for (var i = 0; i < old.link.length; i++) {
            const newIndex = current.link.indexOf(old.link[i]);
            if (newIndex === -1) {
                await db.deleteDBShopList(old.link[i]);
                contentList[3] += `${old.title[i]}](${old.link[i]})\n`;
            }
        }
        for (var i = 0; i < contentList.length; i++) {
            if (contentList[i].length > 0) {
                modified = true;
                const embed = new discord_js_1.MessageEmbed().addFields({ name: tag[i], value: contentList[i] });
                channel.send({
                    embeds: [embed]
                });
            }
        }
        return modified;
    }
    console.log('Init checker.');
    checkerData = new dataPool();
    const channel = (await client.channels.fetch('938732984973017129'));
    await channel.send(`Init checker.`);
    let botMsg = await channel.send(`Fetching shop list.`);
    while (checkerFlag) {
        console.log('Fetching shop list.');
        const shopList = await getShopList();
        var currentData = new dataPool();
        for (const link of shopList) {
            const { body } = await undici_1.default.request(link);
            const { window } = new jsdom_1.default.JSDOM(await body.text());
            const info = window.document.querySelector('#editer_main > div');
            if (info != null) {
                currentData.link.push(link);
                currentData.title.push(window.document.title);
                currentData.info.push((0, utility_1.hashCode)(info.innerHTML));
            }
        }
        console.log('Checking data.');
        await botMsg.edit(`Checking data.`);
        var modified = await compare(currentData);
        if (!modified) {
            await botMsg.edit(`Last updated: ${(0, utility_1.timeString)()}`);
        }
        else {
            botMsg.delete();
            botMsg = await channel.send(`Last updated: ${(0, utility_1.timeString)()}`);
        }
        checkerData = currentData;
        db.updateDBShopList(checkerData.link, checkerData.title, checkerData.info);
        for (var i = 0; i < 600; i++) {
            await (0, utility_1.sleep)(1000);
            if (!checkerFlag)
                break;
        }
    }
    channel.send(`Checker exited.`);
}
client.on('messageCreate', message => {
    if (!message.content.startsWith(prefix))
        return;
    if (!message.member || !message.guild)
        return;
    if (message.author.id !== message.guild.ownerId) {
        if (!message.member.permissionsIn(message.channel).has(discord_js_1.default.Permissions.FLAGS.MANAGE_MESSAGES) ||
            message.author.bot) {
            logger.logging(`permission denied, range delete start by ${message.author.username} at #${message.channel.name} id: ${message.id}`);
            return;
        }
    }
    let args = message.content.split(' ');
    if (args[0].slice(2) === 'rangedelete' || args[0].slice(2) === 'rd') {
        if (args.length != 3) {
            message.channel.send({
                content: 'Invalid arguments count\nUsage:  !!rangedelete  MessageID1  MessageID2'
            });
            return;
        }
        rangedelete(message);
        return;
    }
    if (args[0].slice(2) === 'logs') {
        let size = 20;
        if (args.length == 2) {
            if (isNaN(parseInt(args[1], 10))) {
                message.channel.send({
                    content: 'Invalid arguments count\nUsage:  !!logs  (size)'
                });
                return;
            }
            size = parseInt(args[1], 10);
        }
        let log = '`' + logger.getLog(size).reduce((a, b) => a + '\n' + b) + '`';
        message.channel.send({
            content: log
        });
    }
    if (args[0].slice(2) === 'checker') {
        if (message.guild.id != '923553217671987201') {
            return;
        }
        if (args.length != 2) {
            message.channel.send({
                content: 'Invalid arguments count\nUsage:  !!checker  on/off'
            });
            return;
        }
        if (args[1] === 'on' && !checkerFlag) {
            checkerFlag = true;
            checker();
        }
        if (args[1] === 'off') {
            checkerFlag = false;
        }
        if (args[1] === 'display') {
            if (checkerFlag) {
                displayChecker(message.channel, checkerData);
            }
        }
    }
    if (args[0].slice(2) === 'help') {
        message.channel.send({
            content: '**`command list:`**`\n!!rangedelete  MessageID1  MessageID2\n!!logs (Size)\n!!checker (on/off/display)\n!!help`'
        });
    }
});
client.login(process.env.TOKEN);
