import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { email, password, fullName } = req.body;
  try {
    const { rows: existing } = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
      [email, hashedPassword, fullName]
    );
    const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    res.json({ user: rows[0], token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0 || !await bcrypt.compare(password, rows[0].password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    res.json({ user: rows[0], token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Signin failed' });
  }
});

export default router;
