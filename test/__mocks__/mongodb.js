class FakeMongoCollection {
  constructor() {
    this.docs = [];
  }
  find(query = {}) {
    return {
      toArray: async () =>
        this.docs
          .filter(d => Object.keys(query).every(k => d[k] === query[k]))
          .map(d => ({ ...d }))
    };
  }
  insertOne(doc) {
    this.docs.push(doc);
    return Promise.resolve();
  }
  updateOne(filter, update, options) {
    const idx = this.docs.findIndex(d =>
      Object.keys(filter).every(k => d[k] === filter[k])
    );
    if (idx >= 0) {
      Object.assign(this.docs[idx], update.$set);
    } else if (options && options.upsert) {
      this.docs.push({ ...filter, ...update.$set });
    }
    return Promise.resolve();
  }
}

class FakeMongoDB {
  constructor() {
    this.collections = {};
  }
  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = new FakeMongoCollection();
    }
    return this.collections[name];
  }
}

class FakeMongoClient {
  constructor(uri) {
    this.uri = uri;
    this.dbInstance = new FakeMongoDB();
  }
  connect() {
    return Promise.resolve();
  }
  db() {
    return this.dbInstance;
  }
}

module.exports = {
  MongoClient: FakeMongoClient
};
