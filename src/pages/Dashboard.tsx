import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, DollarSign, Clock, TrendingUp, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  const adminCards = [
    { label: 'Total Agents', value: stats?.totalAgents, icon: UserCheck, color: 'bg-blue-500' },
    { label: 'Total Candidates', value: stats?.totalCandidates, icon: Users, color: 'bg-indigo-500' },
    { label: 'Total Revenue', value: `৳${stats?.totalRevenue?.toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Total Due', value: `৳${stats?.totalDue?.toLocaleString()}`, icon: Clock, color: 'bg-amber-500' },
  ];

  const agentCards = [
    { label: 'My Candidates', value: stats?.totalCandidates, icon: Users, color: 'bg-indigo-500' },
    { label: 'My Collection', value: `৳${stats?.totalCollection?.toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'My Due', value: `৳${stats?.totalDue?.toLocaleString()}`, icon: Clock, color: 'bg-amber-500' },
  ];

  const cards = user?.role === 'agent' ? agentCards : adminCards;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
        <p className="text-slate-500">Here's what's happening with your recruitment business today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-xl text-white`}>
                <card.icon className="w-6 h-6" />
              </div>
              <TrendingUp className="text-slate-300 w-5 h-5" />
            </div>
            <p className="text-slate-500 text-sm font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {user?.role !== 'agent' && stats?.agentWiseReport && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Agent-wise Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Agent Name</th>
                  <th className="px-6 py-4 font-semibold">Candidates</th>
                  <th className="px-6 py-4 font-semibold">Total Collection</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.agentWiseReport.map((report: any) => (
                  <tr key={report.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{report.name}</td>
                    <td className="px-6 py-4 text-slate-600">{report.candidate_count}</td>
                    <td className="px-6 py-4 text-slate-900 font-semibold">৳{report.collection?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
