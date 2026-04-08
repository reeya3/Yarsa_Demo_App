import { Request, Response } from 'express';
import { pool } from '../models/db';

// Create table if not exists
export const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL
    );
  `);
};

// CREATE
export const createUser = async (req: Request, res: Response) => {
  const { name } = req.body;
  const result = await pool.query(
    'INSERT INTO users (name) VALUES ($1) RETURNING *',
    [name]
  );
  res.status(201).json(result.rows[0]);
};

// READ
export const getUsers = async (req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM users');
  res.json(result.rows);
};

// UPDATE
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  const result = await pool.query(
    'UPDATE users SET name=$1 WHERE id=$2 RETURNING *',
    [name, id]
  );

  res.json(result.rows[0]);
};

// DELETE
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  await pool.query('DELETE FROM users WHERE id=$1', [id]);
  res.json({ message: 'User deleted' });
};