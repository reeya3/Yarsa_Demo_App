"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUsers = exports.createUser = exports.initDB = void 0;
const db_1 = require("../models/db");
// Create table if not exists
const initDB = async () => {
    await db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL
    );
  `);
};
exports.initDB = initDB;
// CREATE
const createUser = async (req, res) => {
    const { name } = req.body;
    const result = await db_1.pool.query('INSERT INTO users (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json(result.rows[0]);
};
exports.createUser = createUser;
// READ
const getUsers = async (req, res) => {
    const result = await db_1.pool.query('SELECT * FROM users');
    res.json(result.rows);
};
exports.getUsers = getUsers;
// UPDATE
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const result = await db_1.pool.query('UPDATE users SET name=$1 WHERE id=$2 RETURNING *', [name, id]);
    res.json(result.rows[0]);
};
exports.updateUser = updateUser;
// DELETE
const deleteUser = async (req, res) => {
    const { id } = req.params;
    await db_1.pool.query('DELETE FROM users WHERE id=$1', [id]);
    res.json({ message: 'User deleted' });
};
exports.deleteUser = deleteUser;
