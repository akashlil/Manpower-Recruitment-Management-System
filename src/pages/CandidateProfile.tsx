import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, DollarSign, CreditCard, Calendar, FileText, Download, Plus, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CandidateProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_type: 'visa',
    payment_method: 'cash',
    transaction_id: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get(`/candidates/${id}`),
        api.get(`/payments/candidate/${id}`)
      ]);
      setCandidate(cRes.data);
      setPayments(pRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (tranId: string) => {
    if (!tranId) {
      alert('No Transaction ID found for this payment.');
      return;
    }
    
    try {
      const response = await api.get(`/payments/transaction/${tranId}`);
      const payment = response.data;

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); // Indigo-600
      doc.text('PAYMENT RECEIPT', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(`Date: ${new Date(payment.created_at).toLocaleDateString()}`, 20, 35);
      doc.text(`Receipt No: #REC-${payment.id}`, 20, 40);
      doc.text(`Transaction ID: ${payment.transaction_id}`, 20, 45);
      
      // Divider
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.line(20, 55, 190, 55);
      
      // Candidate Info
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text('Candidate Details:', 20, 65);
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85); // Slate-700
      doc.text(`Name: ${payment.candidate_name}`, 20, 72);
      doc.text(`Phone: ${payment.candidate_phone}`, 20, 77);
      doc.text(`Email: ${payment.candidate_email}`, 20, 82);
      
      // Payment Info Table
      autoTable(doc, {
        startY: 95,
        head: [['Description', 'Method', 'Amount']],
        body: [[
          payment.payment_type.toUpperCase(),
          payment.payment_method.toUpperCase(),
          `BDT ${payment.amount.toLocaleString()}`
        ]],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        styles: { fontSize: 10, cellPadding: 5 }
      });
      
      // Summary
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`Total Paid: BDT ${payment.amount.toLocaleString()}`, 190, finalY, { align: 'right' });
      
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text('Thank you for your payment.', 105, 270, { align: 'center' });
      doc.text('This is a computer-generated receipt and does not require a signature.', 105, 275, { align: 'center' });
      
      doc.save(`Receipt_${payment.transaction_id}.pdf`);
    } catch (error: any) {
      console.error('Failed to download receipt:', error);
      alert(error.response?.data?.message || 'Failed to generate receipt.');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (paymentForm.payment_method === 'sslcommerz') {
        const response = await api.post('/sslcommerz/init', {
          candidate_id: id,
          amount: parseFloat(paymentForm.amount),
          payment_type: paymentForm.payment_type
        });
        // Open in new tab to avoid iframe restrictions
        window.open(response.data.url, '_blank');
        setShowPaymentModal(false);
        return;
      }

      await api.post('/payments', { ...paymentForm, candidate_id: id });
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', payment_type: 'visa', payment_method: 'cash', transaction_id: '', notes: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment failed');
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (!candidate) return <div>Candidate not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to List</span>
        </button>
        <div className="flex items-center space-x-3">
          {user?.role !== 'accountant' && (
            <Link
              to={`/candidates/${id}/edit`}
              className="flex items-center space-x-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-semibold hover:bg-slate-200 transition-all"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </Link>
          )}
          {['super_admin', 'admin', 'accountant', 'agent'].includes(user?.role || '') && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              <Plus className="w-5 h-5" />
              <span>Add Payment</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <FileText className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{candidate.name}</h2>
              <p className="text-slate-500 text-sm">{candidate.passport_number}</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Phone</span>
                <span className="text-slate-900 font-medium">{candidate.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Email</span>
                <span className="text-slate-900 font-medium">{candidate.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium capitalize">
                  {candidate.status}
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Documents</h3>
              {candidate.passport_copy_url && (
                <a
                  href={candidate.passport_copy_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                    <span className="text-sm text-slate-700">Passport Copy</span>
                  </div>
                </a>
              )}
              {candidate.cv_url && (
                <a
                  href={candidate.cv_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                    <span className="text-sm text-slate-700">CV / Resume</span>
                  </div>
                </a>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <h3 className="text-slate-400 text-sm font-medium mb-4">Financial Overview</h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-xs uppercase">Total Package</p>
                <p className="text-2xl font-bold">৳{candidate.package_amount?.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-xs uppercase">Paid</p>
                  <p className="text-lg font-bold text-emerald-400">৳{candidate.total_paid?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase">Due</p>
                  <p className="text-lg font-bold text-red-400">৳{candidate.due_amount?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger / Payment History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Candidate Ledger</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Method</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Transaction ID</th>
                    <th className="px-6 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No payments recorded yet.</td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {format(new Date(p.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium capitalize">
                            {p.payment_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 capitalize">{p.payment_method}</td>
                        <td className="px-6 py-4 text-slate-900 font-bold">৳{p.amount?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">{p.transaction_id || '-'}</td>
                        <td className="px-6 py-4">
                          {p.transaction_id && (
                            <button
                              onClick={() => handleDownloadReceipt(p.transaction_id)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1 text-xs font-bold"
                            >
                              <Download className="w-3 h-3" />
                              <span>Receipt</span>
                            </button>
                          )}
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Record New Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (৳)</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={paymentForm.payment_type}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_type: e.target.value })}
                  >
                    <option value="visa">Visa</option>
                    <option value="medical">Medical</option>
                    <option value="ticket">Ticket</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
                  <select
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  >
                    <option value="cash">Cash Payment</option>
                    <option value="sslcommerz">SSLCommerz (Online)</option>
                  </select>
                </div>
              </div>
              {paymentForm.payment_method !== 'sslcommerz' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Transaction ID (Optional)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={paymentForm.transaction_id}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg mt-4 ${
                  paymentForm.payment_method === 'sslcommerz' 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
                }`}
              >
                {paymentForm.payment_method === 'sslcommerz' ? 'Pay with SSLCommerz' : 'Confirm Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateProfile;
