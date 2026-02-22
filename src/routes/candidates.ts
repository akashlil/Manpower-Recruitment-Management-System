import express from 'express';
import multer from 'multer';
import path from 'path';
import db from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get all candidates (Admin, Accountant, Data Entry see all; Agent sees only theirs)
router.get('/', authenticateToken, (req: any, res) => {
  try {
    let candidates;
    if (req.user.role === 'agent') {
      candidates = db.prepare('SELECT * FROM candidates WHERE agent_id = ? ORDER BY created_at DESC').all(req.user.id);
    } else {
      // super_admin, admin, accountant, data_entry see all
      candidates = db.prepare(`
        SELECT c.*, u.name as agent_name 
        FROM candidates c 
        JOIN users u ON c.agent_id = u.id 
        ORDER BY c.created_at DESC
      `).all();
    }
    res.json(candidates);
  } catch (error) {
    console.error('Get Candidates Error:', error);
    res.status(500).json({ message: 'Failed to fetch candidates' });
  }
});

// Get single candidate
router.get('/:id', authenticateToken, (req: any, res) => {
  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id) as any;
  
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
  
  // Check permission
  if (req.user.role === 'agent' && candidate.agent_id !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  res.json(candidate);
});

// Create candidate
router.post('/', authenticateToken, authorizeRoles('super_admin', 'admin', 'agent', 'data_entry'), upload.fields([{ name: 'passport_copy' }, { name: 'cv' }]), (req: any, res) => {
  const { name, passport_number, phone, email, date_of_birth, package_amount } = req.body;
  const agent_id = req.user.role === 'agent' ? req.user.id : req.body.agent_id;
  
  const files = req.files as any;
  const passport_copy_url = files?.passport_copy ? `/uploads/${files.passport_copy[0].filename}` : null;
  const cv_url = files?.cv ? `/uploads/${files.cv[0].filename}` : null;

  try {
    const info = db.prepare(`
      INSERT INTO candidates (agent_id, name, passport_number, phone, email, date_of_birth, package_amount, due_amount, passport_copy_url, cv_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(agent_id, name, passport_number, phone, email, date_of_birth, package_amount, package_amount, passport_copy_url, cv_url);

    res.status(201).json({ id: info.lastInsertRowid });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ message: 'Passport number already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update candidate
router.put('/:id', authenticateToken, authorizeRoles('super_admin', 'admin', 'agent', 'data_entry'), upload.fields([{ name: 'passport_copy' }, { name: 'cv' }]), (req: any, res) => {
  try {
    const { name, phone, email, date_of_birth, package_amount, status } = req.body;
    const candidateId = req.params.id;

    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidateId) as any;
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    // Role-based restrictions
    if (req.user.role === 'agent' && candidate.agent_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only edit your own candidates' });
    }

    const files = req.files as any;
    const passport_copy_url = files?.passport_copy ? `/uploads/${files.passport_copy[0].filename}` : candidate.passport_copy_url;
    const cv_url = files?.cv ? `/uploads/${files.cv[0].filename}` : candidate.cv_url;

    // Data Entry cannot change package_amount
    let pkgAmt = candidate.package_amount;
    if (req.user.role !== 'data_entry') {
      pkgAmt = parseFloat(package_amount) || candidate.package_amount;
    }
    
    const newDue = pkgAmt - candidate.total_paid;

    db.prepare(`
      UPDATE candidates 
      SET name = ?, phone = ?, email = ?, date_of_birth = ?, package_amount = ?, due_amount = ?, status = ?, passport_copy_url = ?, cv_url = ?
      WHERE id = ?
    `).run(
      name || candidate.name, 
      phone || candidate.phone, 
      email || candidate.email, 
      date_of_birth || candidate.date_of_birth, 
      pkgAmt, 
      newDue, 
      status || candidate.status, 
      passport_copy_url, 
      cv_url, 
      candidateId
    );

    res.json({ message: 'Candidate updated' });
  } catch (error) {
    console.error('Update Candidate Error:', error);
    res.status(500).json({ message: 'Failed to update candidate' });
  }
});

export default router;
