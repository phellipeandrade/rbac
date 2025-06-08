"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLRoleAdapter = void 0;
let mysql;
function loadMySQL() {
    if (!mysql) {
        try {
            mysql = require('mysql2/promise');
        }
        catch (err) {
            throw new Error('Please install "mysql2" to use MySQLRoleAdapter');
        }
    }
    return mysql;
}
class MySQLRoleAdapter {
    constructor(options) {
        this.options = options;
    }
    async getConnection() {
        if (!this.connection) {
            const driver = loadMySQL();
            this.connection = this.options.uri
                ? await driver.createConnection(this.options.uri)
                : await driver.createConnection(this.options.config || {});
        }
        return this.connection;
    }
    async getRoles() {
        const conn = await this.getConnection();
        const [rows] = await conn.query(`SELECT name, role FROM \`${this.options.table}\``);
        return rows.reduce((acc, row) => {
            acc[row.name] = JSON.parse(row.role);
            return acc;
        }, {});
    }
    async addRole(roleName, role) {
        const conn = await this.getConnection();
        await conn.query(`INSERT INTO \`${this.options.table}\` (name, role) VALUES (?, ?)`, [roleName, JSON.stringify(role)]);
    }
    async updateRoles(roles) {
        const conn = await this.getConnection();
        await Promise.all(Object.entries(roles).map(([name, role]) => conn.query(`REPLACE INTO \`${this.options.table}\` (name, role) VALUES (?, ?)`, [name, JSON.stringify(role)])));
    }
}
exports.MySQLRoleAdapter = MySQLRoleAdapter;
