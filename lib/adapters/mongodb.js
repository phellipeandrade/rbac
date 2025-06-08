"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoRoleAdapter = void 0;
let MongoClient;
function loadMongoClient() {
    if (!MongoClient) {
        try {
            MongoClient = require('mongodb').MongoClient;
        }
        catch (err) {
            throw new Error('Please install "mongodb" to use MongoRoleAdapter');
        }
    }
    return MongoClient;
}
class MongoRoleAdapter {
    constructor(options) {
        this.options = options;
        const Mongo = loadMongoClient();
        this.client = new Mongo(options.uri);
        this.collectionName = options.collection;
    }
    async getCollection() {
        if (!this.db) {
            await this.client.connect();
            this.db = this.client.db(this.options.dbName);
        }
        return this.db.collection(this.collectionName);
    }
    async getRoles() {
        const col = await this.getCollection();
        const docs = await col.find({}).toArray();
        return docs.reduce((acc, doc) => ({ ...acc, [doc.name]: doc.role }), {});
    }
    async addRole(roleName, role) {
        const col = await this.getCollection();
        await col.insertOne({ name: roleName, role });
    }
    async updateRoles(roles) {
        const col = await this.getCollection();
        await Promise.all(Object.entries(roles).map(([name, role]) => col.updateOne({ name }, { $set: { role } }, { upsert: true })));
    }
}
exports.MongoRoleAdapter = MongoRoleAdapter;
