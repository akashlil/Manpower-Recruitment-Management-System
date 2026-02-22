import express from 'express';
import db from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Add payment
router.post('/', authenticateToken, authorizeRoles('super_admin', 'admin', 'accountant', 'agent'), (req: any, res) => {
  const { candidate_id, amount, payment_type, payment_method, transaction_id, notes } = req.body;

  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidate_id) as any;
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

  // Agents can only add payments for their own candidates
  if (req.user.role === 'agent' && candidate.agent_id !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden: You can only add payments for your own candidates' });
  }

  const transaction = db.transaction(() => {
    // Insert payment
    db.prepare(`
      INSERT INTO payments (candidate_id, amount, payment_type, payment_method, transaction_id, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(candidate_id, amount, payment_type, payment_method, transaction_id, notes);

    // Update candidate totals
    const newTotalPaid = candidate.total_paid + parseFloat(amount);
    const newDue = candidate.package_amount - newTotalPaid;

    db.prepare(`
      UPDATE candidates SET total_paid = ?, due_amount = ? WHERE id = ?
    `).run(newTotalPaid, newDue, candidate_id);
  });

  try {
    transaction();
    res.status(201).json({ message: 'Payment recorded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Transaction failed' });
  }
});

// Get payments for a candidate
router.get('/candidate/:id', authenticateToken, (req: any, res) => {
  const candidateId = req.params.id;
  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidateId) as any;
  
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
  if (req.user.role === 'agent' && candidate.agent_id !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const payments = db.prepare('SELECT * FROM payments WHERE candidate_id = ? ORDER BY created_at DESC').all(candidateId);
  res.json(payments);
});

// Get payment by transaction ID
router.get('/transaction/:tranId', authenticateToken, (req: any, res) => {
  const { tranId } = req.params;
  console.log(`Fetching payment for tranId: ${tranId}, User: ${req.user.email} (${req.user.role})`);
  
  try {
    const payment = db.prepare(`
      SELECT p.*, c.name as candidate_name, c.phone as candidate_phone, c.email as candidate_email
      FROM payments p
      JOIN candidates c ON p.candidate_id = c.id
      WHERE p.transaction_id = ?
    `).get(tranId) as any;

    if (!payment) {
      console.warn(`Payment not found for tranId: ${tranId}`);
      return res.status(404).json({ message: 'Payment record not found in database' });
    }
    
    // Check permission
    if (req.user.role === 'agent') {
      const candidate = db.prepare('SELECT agent_id FROM candidates WHERE id = ?').get(payment.candidate_id) as any;
      if (candidate.agent_id !== req.user.id) {
        console.warn(`Unauthorized access attempt by agent ${req.user.id} for payment ${payment.id}`);
        return res.status(403).json({ message: 'You do not have permission to access this receipt' });
      }
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment transaction:', error);
    res.status(500).json({ message: 'Internal server error while fetching payment details' });
  }
});

export default router;
