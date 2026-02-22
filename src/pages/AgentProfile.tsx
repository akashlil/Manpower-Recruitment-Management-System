import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, User, Phone, MapPin, Mail, Users, DollarSign, Clock, FileText, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';

const AgentProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const response = await api.get(`/agents/${id}`);
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch agent data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgentData();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64">Loading agent profile...</div>;
  if (!data) return <div className="text-center py-12 text-slate-500">Agent not found</div>;

  const { agent, candidates } = data;

  const stats = {
    totalCandidates: candidates.length,
    totalCollection: candidates.reduce((sum: number, c: any) => sum + (c.total_paid || 0), 0),
    totalDue: candidates.reduce((sum: number, c: any) => sum + (c.due_amount || 0), 0),
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Agents</span>
        </button>
        <Link
          to={`/agents/${id}/edit`}
          className="flex items-center space-x-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-semibold hover:bg-slate-200 transition-all"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit Agent Profile</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                <User className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{agent.name}</h2>
              <p className="text-indigo-600 text-sm font-semibold uppercase tracking-wider">Agent / Dalal</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-slate-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{agent.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{agent.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{agent.address || 'N/A'}</span>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Commission Rate</span>
                  <span className="text-sm font-bold text-slate-900">{agent.commission_rate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-6">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Performance Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg"><Users className="w-4 h-4 text-indigo-400" /></div>
                  <span className="text-sm text-slate-300">Candidates</span>
                </div>
                <span className="text-lg font-bold">{stats.totalCandidates}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg"><DollarSign className="w-4 h-4 text-emerald-400" /></div>
                  <span className="text-sm text-slate-300">Collection</span>
                </div>
                <span className="text-lg font-bold text-emerald-400">৳{stats.totalCollection.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/20 rounded-lg"><Clock className="w-4 h-4 text-red-400" /></div>
                  <span className="text-sm text-slate-300">Total Due</span>
                </div>
                <span className="text-lg font-bold text-red-400">৳{stats.totalDue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Candidates List under this Agent */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Candidates under {agent.name}</h2>
              <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                {candidates.length} Total
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Candidate</th>
                    <th className="px-6 py-4 font-semibold">Passport</th>
                    <th className="px-6 py-4 font-semibold">Paid</th>
                    <th className="px-6 py-4 font-semibold">Due</th>
                    <th className="px-6 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No candidates registered by this agent yet.
                      </td>
                    </tr>
                  ) : (
                    candidates.map((candidate: any) => (
                      <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                              <User className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-slate-900">{candidate.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{candidate.passport_number}</td>
                        <td className="px-6 py-4 text-emerald-600 font-bold">৳{candidate.total_paid?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-red-600 font-bold">৳{candidate.due_amount?.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/candidates/${candidate.id}`}
                            className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors inline-block"
                          >
                            <FileText className="w-5 h-5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentProfile;
