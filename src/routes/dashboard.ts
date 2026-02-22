import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, (req: any, res) => {
  try {
    if (req.user.role === 'agent') {
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_candidates,
          SUM(total_paid) as total_collection,
          SUM(due_amount) as total_due
        FROM candidates 
        WHERE agent_id = ?
      `).get(req.user.id) as any;

      res.json({
        totalCandidates: stats.total_candidates || 0,
        totalCollection: stats.total_collection || 0,
        totalDue: stats.total_due || 0
      });
    } else if (['super_admin', 'admin', 'accountant'].includes(req.user.role)) {
      const totalAgents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'agent'").get() as any;
      const totalCandidates = db.prepare("SELECT COUNT(*) as count FROM candidates").get() as any;
      const financialStats = db.prepare("SELECT SUM(total_paid) as total_revenue, SUM(due_amount) as total_due FROM candidates").get() as any;

      const agentWiseReport = db.prepare(`
        SELECT u.name, COUNT(c.id) as candidate_count, SUM(c.total_paid) as collection
        FROM users u
        LEFT JOIN candidates c ON u.id = c.agent_id
        WHERE u.role = 'agent'
        GROUP BY u.id
      `).all();

      res.json({
        totalAgents: totalAgents.count,
        totalCandidates: totalCandidates.count,
        totalRevenue: financialStats.total_revenue || 0,
        totalDue: financialStats.total_due || 0,
        agentWiseReport
      });
    } else {
      // data_entry might not need full financial dashboard
      res.json({ message: 'Limited dashboard for your role' });
    }
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

export default router;
