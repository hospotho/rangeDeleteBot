"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllShop = exports.deleteShop = exports.discardShop = exports.updateShopList = exports.getShopHistory = exports.getShopList = void 0;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uri = process.env.DB_CONN_STRING;
const client = new mongodb_1.MongoClient(uri);
async function getShopList() {
    try {
        await client.connect();
        const database = client.db('BotDB');
        const shops = database.collection('ShopList');
        const cursor = shops.find({
            modified: false,
            deleted: false
        }, {
            sort: { title: 1 },
            projection: { _id: 0, modified: 0, deleted: 0 }
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
exports.getShopList = getShopList;
async function getShopHistory(_link, last = false) {
    try {
        await client.connect();
        const database = client.db('BotDB');
        const shops = database.collection('ShopList');
        const cursor = shops.find({
            link: _link
        }, {
            sort: { title: 1 },
            projection: { _id: 0, link: 0, hash: 0, modified: 0 },
            limit: last ? 2 : 50
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
exports.getShopHistory = getShopHistory;
async function updateShopList(links, titles, infos, hashs, _upsert = true) {
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
                    info: infos[i],
                    hash: hashs[i],
                    date: Date.now(),
                    modified: false,
                    deleted: false
                }
            }, { upsert: _upsert }));
        }
        const result = await Promise.all(promiseList);
        const match = result.reduce((r, c) => r + c.matchedCount, 0);
        const update = result.reduce((r, c) => r + c.modifiedCount, 0);
        const upsert = result.reduce((r, c) => r + c.upsertedCount, 0);
        console.log(`${match} document(s) matched the filter, updated ${update} document(s), upserted ${upsert} document(s)`);
        return [match, update, upsert];
    }
    finally {
        await client.close();
    }
}
exports.updateShopList = updateShopList;
async function discardShop(_link, _deleted = false) {
    try {
        await client.connect();
        const database = client.db('BotDB');
        const shops = database.collection('ShopList');
        const result = await shops.updateOne({ link: _link, modified: false }, {
            $set: {
                modified: true,
                deleted: _deleted
            }
        });
        if (result.modifiedCount) {
            console.log(`Successfully discard old shop data.`);
            return true;
        }
        else {
            console.log('No documents matched the query.');
            return false;
        }
    }
    finally {
        await client.close();
    }
}
exports.discardShop = discardShop;
async function deleteShop(_link) {
    try {
        await client.connect();
        const database = client.db('BotDB');
        const shops = database.collection('ShopList');
        const result = await shops.deleteMany({ link: _link });
        if (result.deletedCount) {
            console.log(`Successfully deleted ${result.deletedCount} document.`);
        }
        else {
            console.log('No documents matched the query. Deleted 0 documents.');
        }
        return result.deletedCount;
    }
    finally {
        await client.close();
    }
}
exports.deleteShop = deleteShop;
async function deleteAllShop() {
    try {
        await client.connect();
        const database = client.db('BotDB');
        const shops = database.collection('ShopList');
        const query = {};
        const result = await shops.deleteMany(query);
        if (result.deletedCount) {
            console.log(`Successfully deleted ${result.deletedCount} document.`);
        }
        else {
            console.log('No documents matched the query. Deleted 0 documents.');
        }
        return result.deletedCount;
    }
    finally {
        await client.close();
    }
}
exports.deleteAllShop = deleteAllShop;
