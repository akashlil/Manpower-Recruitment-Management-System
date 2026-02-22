import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Register (Admin only can create users)
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const info = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
      .run(name, email, hashedPassword, role);
    
    if (role === 'agent') {
      db.prepare('INSERT INTO agents (user_id) VALUES (?)').run(info.lastInsertRowid);
    }

    res.status(201).json({ message: 'User created successfully', id: info.lastInsertRowid });
  } catch (error: any) {
    console.error('Register Error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error: ' + (error.message || 'Unknown error') });
  }
});

// Initial Setup (Seed demo accounts and data)
router.post('/setup', async (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  if (count.count > 0) return res.status(400).json({ message: 'System already setup' });

  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const seed = db.transaction(() => {
      // 1. Create Users for all roles
      const superAdminId = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
        .run('Super Admin', 'admin@example.com', hashedPassword, 'super_admin').lastInsertRowid;

      const adminId = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
        .run('Office Admin', 'office@example.com', hashedPassword, 'admin').lastInsertRowid;

      const agentUserId = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
        .run('Demo Agent', 'agent@example.com', hashedPassword, 'agent').lastInsertRowid;

      const accountantId = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
        .run('Main Accountant', 'accounts@example.com', hashedPassword, 'accountant').lastInsertRowid;

      const deoId = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
        .run('Data Entry Op', 'deo@example.com', hashedPassword, 'data_entry').lastInsertRowid;

      // 2. Create Agent Profile
      db.prepare('INSERT INTO agents (user_id, phone, address, commission_rate) VALUES (?, ?, ?, ?)')
        .run(agentUserId, '01711223344', 'Dhaka, Bangladesh', 5000);

      // 3. Create Demo Candidates
      const c1Id = db.prepare(`
        INSERT INTO candidates (agent_id, name, passport_number, phone, email, date_of_birth, package_amount, total_paid, due_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(agentUserId, 'Rahim Uddin', 'A01234567', '01811000111', 'rahim@example.com', '1995-05-10', 450000, 50000, 400000, 'processing').lastInsertRowid;

      const c2Id = db.prepare(`
        INSERT INTO candidates (agent_id, name, passport_number, phone, email, date_of_birth, package_amount, total_paid, due_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(agentUserId, 'Karim Ali', 'B98765432', '01911000222', 'karim@example.com', '1992-11-20', 450000, 150000, 300000, 'medical_completed').lastInsertRowid;

      // 4. Create Demo Payments
      db.prepare(`
        INSERT INTO payments (candidate_id, amount, payment_type, payment_method, transaction_id, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(c1Id, 50000, 'service', 'cash', 'TXN-001', 'Initial booking');

      db.prepare(`
        INSERT INTO payments (candidate_id, amount, payment_type, payment_method, transaction_id, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(c2Id, 100000, 'visa', 'bank', 'BANK-998', 'Visa processing fee');

      db.prepare(`
        INSERT INTO payments (candidate_id, amount, payment_type, payment_method, transaction_id, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(c2Id, 50000, 'medical', 'bkash', 'BK-776', 'Medical fee');
    });

    seed();

    res.json({ 
      message: 'System setup successful with demo data',
      accounts: {
        super_admin: 'admin@example.com / admin123',
        admin: 'office@example.com / admin123',
        agent: 'agent@example.com / admin123',
        accountant: 'accounts@example.com / admin123',
        data_entry: 'deo@example.com / admin123'
      }
    });
  } catch (error: any) {
    console.error('Setup Error:', error);
    res.status(500).json({ message: 'Setup failed: ' + error.message });
  }
});

export default router;
