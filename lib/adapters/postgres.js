"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresRoleAdapter = void 0;
let PG;
function loadPG() {
    if (!PG) {
        try {
            PG = require('pg');
        }
        catch (err) {
            throw new Error('Please install "pg" to use PostgresRoleAdapter');
        }
    }
    return PG;
}
class PostgresRoleAdapter {
    constructor(options) {
        this.options = options;
        this.connected = false;
        const { Client } = loadPG();
        this.client = new Client(options);
    }
    async getClient() {
        if (!this.connected) {
            await this.client.connect();
            this.connected = true;
        }
        return this.client;
    }
    async getRoles() {
        const client = await this.getClient();
        const res = await client.query(`SELECT name, role FROM ${this.options.table}`);
        return res.rows.reduce((acc, row) => {
            acc[row.name] = JSON.parse(row.role);
            return acc;
        }, {});
    }
    async addRole(roleName, role) {
        const client = await this.getClient();
        await client.query(`INSERT INTO ${this.options.table}(name, role) VALUES ($1, $2)`, [roleName, JSON.stringify(role)]);
    }
    async updateRoles(roles) {
        const client = await this.getClient();
        await Promise.all(Object.entries(roles).map(([name, role]) => client.query(`INSERT INTO ${this.options.table}(name, role) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET role = EXCLUDED.role`, [name, JSON.stringify(role)])));
    }
}
exports.PostgresRoleAdapter = PostgresRoleAdapter;
