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
const client = new discord_js_1.default.Client({
    intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_MESSAGES]
});
client.on('ready', () => {
    console.log('The bot is ready.');
});
function rangedelete(message) {
    return __awaiter(this, void 0, void 0, function* () {
        function fetch(id, channel = message.channel) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const msg = yield channel.messages.fetch(id);
                    return msg;
                }
                catch (error) {
                    const channels = channel.guild.channels.cache;
                    for (const [_, ch] of channels) {
                        if (!ch.isText())
                            continue;
                        try {
                            const msg = yield ch.messages.fetch(id);
                            return msg;
                        }
                        catch (error) {
                            continue;
                        }
                    }
                }
            });
        }
        const args = message.content.split(' ');
        if (args[1] === args[2]) {
            message.channel.send(`MessageID(1) and MessageID(2) should not be the same.`);
            return;
        }
        if (parseInt(args[1]) > parseInt(args[2])) {
            message.channel.send(`Message(1) is newer than Message(2).`);
            return;
        }
        const msg1 = yield fetch(args[1]);
        if (!msg1) {
            message.channel.send(`Message(1) ${args[1]} not found.`);
            return;
        }
        const msg2 = yield fetch(args[2]);
        if (!msg2) {
            message.channel.send(`Message(2) ${args[2]} not found.`);
            return;
        }
        if (msg1.channel != msg2.channel) {
            message.channel.send(`Messages need to be in same channel.`);
            return;
        }
        let msgs = yield msg1.channel.messages.fetch({
            after: msg1.id
        });
        msgs = msgs.filter(m => m.createdTimestamp <= msg2.createdTimestamp);
        message.channel.send(`Starting to delete messages from ${args[1]} to ${args[2]}.`);
        message.channel.send(`:gbf_makira_gun:`);
        yield msg1.delete();
        const count = (yield Promise.all(msgs.map(m => m.delete()))).length + 1;
        yield message.channel.send(`${count} messages deleted.`);
    });
}
client.on('messageCreate', message => {
    if (!message.content.startsWith(prefix))
        return;
    let args = message.content.split(' ');
    if (args[0].slice(2) === 'rangedelete') {
        if (!message.member)
            return;
        if (!message.guild)
            return;
        // check permissions
        if (message.author.id !== message.guild.ownerId) {
            if (!message.member.permissions.has(discord_js_1.Permissions.FLAGS.MANAGE_MESSAGES)) {
                console.log('permission denied');
                return;
            }
        }
        if (args.length != 3) {
            message.channel.send({
                content: 'Invalid arguments count\nUsage:  !!rangedelete  MessageID1  MessageID2'
            });
            return;
        }
        rangedelete(message);
        return;
    }
});
client.login(process.env.TOKEN);
