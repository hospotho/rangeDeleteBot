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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importStar(require("discord.js"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prefix = '!!';
var debug = false;
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
var logger = new logStack();
client.on('ready', () => {
    logger.logging('The bot is ready.');
});
function msToMinSec(ms) {
    let min = Math.floor(ms / 60000);
    let sec = Math.floor((ms % 60000) / 1000);
    return (min > 0 ? min + 'm' : '') + (sec < 10 && min > 0 ? '0' : '') + sec + 's';
}
function rangedelete(msg) {
    return __awaiter(this, void 0, void 0, function* () {
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
        function fetch(_id, _ch = channel) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const msg = yield _ch.messages.fetch(_id);
                    return msg;
                }
                catch (error) {
                    const channels = _ch.guild.channels.cache;
                    for (const [_, ch] of channels) {
                        if (!ch.isText())
                            continue;
                        try {
                            const msg = yield ch.messages.fetch(_id);
                            return msg;
                        }
                        catch (error) {
                            continue;
                        }
                    }
                }
            });
        }
        const msg1 = yield fetch(args[1]);
        if (!msg1) {
            channel.send(`Message(1) ${args[1]} not found.`);
            return;
        }
        const msg2 = yield fetch(args[2]);
        if (!msg2) {
            channel.send(`Message(2) ${args[2]} not found.`);
            return;
        }
        if (channel != msg1.channel || msg1.channel != msg2.channel) {
            channel.send(`Messages need to be in same channel.`);
            return;
        }
        let startTime = Date.now();
        yield message.delete();
        let botMsg = yield channel.send(`Starting to delete messages from ${args[1]} to ${args[2]}.`).then(sent => {
            return sent;
        });
        logger.logging(`Range delete start by ${message.author.username} at #${channel.name} id: ${message.id}`);
        yield channel.send(`<:gbf_makira_gun:685481376400932895>`);
        let msgs = yield channel.messages.fetch({
            after: msg1.id,
            limit: 99
        });
        msgs = msgs.filter(m => m.createdTimestamp <= msg2.createdTimestamp);
        msgs = msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        yield msg1.delete();
        let count = 1;
        yield channel.bulkDelete(msgs).then(msg => (count += msg.size));
        while (!msgs.has(msg2.id)) {
            yield botMsg.edit(`Still deleting, ${count} messages deleted so far`).then(() => logger.logging(`${count} messages deleted`));
            let tmp = msgs.lastKey();
            msgs = yield channel.messages.fetch({
                after: tmp,
                limit: 100
            });
            msgs = msgs.filter(m => m.createdTimestamp <= msg2.createdTimestamp);
            msgs = msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
            yield channel.bulkDelete(msgs).then(msg => (count += msg.size));
        }
        let timeCost = msToMinSec(Date.now() - startTime);
        yield botMsg.edit(`Complete, ${count} messages deleted in ${timeCost}`).then(() => {
            logger.logging(`Complete, ${count} messages deleted in ${timeCost} id: ${message.id}`);
        });
    });
}
client.on('messageCreate', message => {
    if (!message.content.startsWith(prefix))
        return;
    if (!message.member || !message.guild)
        return;
    // check permissions
    if (message.author.id !== message.guild.ownerId) {
        if (!message.member.permissionsIn(message.channel).has(discord_js_1.default.Permissions.FLAGS.MANAGE_MESSAGES) ||
            message.author.bot) {
            logger.logging(`permission denied, range delete start by ${message.author.username} at #${message.channel.name} id: ${message.id}`);
            return;
        }
    }
    let args = message.content.split(' ');
    if (args[0].slice(2) === 'rangedelete') {
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
    if (args[0].slice(2) === 'help') {
        message.channel.send({
            content: '**`command list:`**`\n!!rangedelete  MessageID1  MessageID2\n!!logs (Size)\n!!help`'
        });
    }
});
client.login(process.env.TOKEN);
//# sourceMappingURL=index.js.map