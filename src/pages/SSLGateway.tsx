import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { CreditCard, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';

const SSLGateway: React.FC = () => {
  const { session_id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const amount = searchParams.get('amount');
  const candidate_id = searchParams.get('candidate_id');
  const type = searchParams.get('type');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!amount || !candidate_id || !type) {
      alert('Invalid payment session');
      navigate(-1);
    }
  }, [amount, candidate_id, type, navigate]);

  const handlePay = async () => {
    setLoading(true);
    
    // Simulate network delay for payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      await api.post('/payments/ssl-success', {
        candidate_id,
        amount,
        payment_type: type,
        transaction_id: session_id,
      });
      
      setSuccess(true);
      
      // Redirect back after 2 seconds
      setTimeout(() => {
        navigate(`/candidates/${candidate_id}`);
      }, 2000);
      
    } catch (error) {
      alert('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Payment Successful!</h2>
          <p className="text-slate-500">Your transaction ID is {session_id}</p>
          <p className="text-sm text-slate-400">Redirecting back to profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel Payment
        </button>
      </div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SSLCOMMERZ</h1>
          <p className="text-slate-400 text-sm mt-1">Sandbox Payment Gateway</p>
        </div>

        {/* Order Details */}
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500">Total Amount</span>
            <span className="text-2xl font-bold text-slate-900">৳{Number(amount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Payment Type</span>
            <span className="text-slate-700 font-medium capitalize">{type}</span>
          </div>
        </div>

        {/* Payment Methods (Visual Only) */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-medium text-slate-700 mb-3">Select Payment Method</p>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="border-2 border-emerald-500 bg-emerald-50 rounded-xl p-3 flex items-center justify-center cursor-pointer">
              <span className="font-bold text-emerald-700">Cards</span>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 flex items-center justify-center cursor-pointer hover:border-slate-300">
              <span className="font-bold text-pink-600">bKash</span>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 flex items-center justify-center cursor-pointer hover:border-slate-300">
              <span className="font-bold text-orange-500">Nagad</span>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 flex items-center justify-center cursor-pointer hover:border-slate-300">
              <span className="font-bold text-purple-600">Rocket</span>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Pay ৳{Number(amount).toLocaleString()}</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100 flex items-center justify-center space-x-2 text-slate-400 text-xs">
          <ShieldCheck className="w-4 h-4" />
          <span>Secured by SSLCommerz Demo</span>
        </div>
      </div>
    </div>
  );
};

export default SSLGateway;
