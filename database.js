"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDBShopList = exports.updateDBShopList = exports.getDBShopList = void 0;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uri = process.env.DB_CONN_STRING;
const client = new mongodb_1.MongoClient(uri);
async function getDBShopList() {
    try {
        await client.connect();
        const database = client.db('BotDB');
        const shops = database.collection('ShopList');
        const cursor = shops.find({
            sort: { title: 1 },
            projection: { _id: 0, link: 1, title: 1, info: 1 }
        });
        if ((await shops.countDocuments()) === 0) {
            console.warn('No documents found!');
        }
        return await cursor.toArray();
    }
    finally {
        await client.close();
    }
}
exports.getDBShopList = getDBShopList;
async function updateDBShopList(links, titles, infos, _upsert = true) {
    try {
        await client.connect();
        const database = client.db('BotDB');
        const shops = database.collection('ShopList');
        const promiseList = [];
        for (let i = 0; i < links.length; i++) {
            promiseList.push(shops.updateOne({
                link: links[i]
            }, {
                $set: {
                    title: titles[i],
                    info: infos[i]
                }
            }, { upsert: _upsert }));
        }
        const result = await Promise.all(promiseList);
        const match = result.reduce((r, c) => r + c.matchedCount, 0);
        const update = result.reduce((r, c) => r + c.modifiedCount, 0);
        console.log(`${match} document(s) matched the filter, updated ${update} document(s)`);
        return [match, update];
    }
    finally {
        await client.close();
    }
}
exports.updateDBShopList = updateDBShopList;
async function deleteDBShopList(_link) {
    try {
        await client.connect();
        const database = client.db('BotDB');
        const shops = database.collection('ShopList');
        const query = { link: _link };
        const result = await shops.deleteOne(query);
        if (result.deletedCount === 1) {
            console.log('Successfully deleted one document.');
            return true;
        }
        else {
            console.log('No documents matched the query. Deleted 0 documents.');
            return false;
        }
    }
    finally {
        await client.close();
    }
}
exports.deleteDBShopList = deleteDBShopList;
