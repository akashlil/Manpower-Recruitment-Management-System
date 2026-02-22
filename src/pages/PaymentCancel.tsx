import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const PaymentCancel: React.FC = () => {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('candidate_id');

  useEffect(() => {
    console.log('PaymentCancel mounted');
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-amber-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Cancelled</h1>
        <p className="text-slate-500 mb-8">You have cancelled the payment process. No funds have been deducted from your account.</p>
        
        <div className="space-y-3">
          <Link 
            to={candidateId ? `/candidates/${candidateId}` : '/'}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Profile</span>
          </Link>
          {window.opener && (
            <button 
              onClick={() => window.close()}
              className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-900 transition-all"
            >
              <span>Close This Window</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
