import express from 'express';
import db from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all agents (Admin and Data Entry)
router.get('/', authenticateToken, authorizeRoles('super_admin', 'admin', 'data_entry'), (req, res) => {
  const agents = db.prepare(`
    SELECT u.id, u.name, u.email, a.phone, a.address, a.commission_rate,
    (SELECT COUNT(*) FROM candidates WHERE agent_id = u.id) as candidate_count
    FROM users u
    JOIN agents a ON u.id = a.user_id
    WHERE u.role = 'agent'
  `).all();
  res.json(agents);
});

// Get agent details and their candidates
router.get('/:id', authenticateToken, authorizeRoles('super_admin', 'admin'), (req, res) => {
  const agent = db.prepare(`
    SELECT u.id, u.name, u.email, a.phone, a.address, a.commission_rate
    FROM users u
    JOIN agents a ON u.id = a.user_id
    WHERE u.id = ? AND u.role = 'agent'
  `).get(req.params.id);

  if (!agent) return res.status(404).json({ message: 'Agent not found' });

  const candidates = db.prepare('SELECT * FROM candidates WHERE agent_id = ?').all(req.params.id);
  
  res.json({ agent, candidates });
});

// Update agent details (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('super_admin', 'admin'), (req: any, res) => {
  const { name, email, phone, address, commission_rate } = req.body;
  const agentId = parseInt(req.params.id);

  if (isNaN(agentId)) {
    return res.status(400).json({ message: 'Invalid agent ID' });
  }

  try {
    // Check if agent exists first
    const agent = db.prepare('SELECT * FROM users WHERE id = ? AND role = "agent"').get(agentId);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Execute updates
    const updateAgent = () => {
      // Update users table
      db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ? AND role = "agent"')
        .run(name, email, agentId);

      // Update agents table
      db.prepare('UPDATE agents SET phone = ?, address = ?, commission_rate = ? WHERE user_id = ?')
        .run(phone || null, address || null, parseFloat(commission_rate) || 0, agentId);
    };

    // Run in transaction
    db.transaction(updateAgent)();

    res.json({ message: 'Agent updated successfully' });
  } catch (error: any) {
    console.error('Update Agent Error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error: ' + (error.message || 'Unknown error') });
  }
});

export default router;
