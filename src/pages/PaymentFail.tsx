import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCcw, ArrowLeft } from 'lucide-react';

const PaymentFail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const msg = searchParams.get('msg') || 'Your payment could not be processed at this time.';
  const candidateId = searchParams.get('candidate_id');

  useEffect(() => {
    console.log('PaymentFail mounted with msg:', msg);
  }, [msg]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Failed</h1>
        <p className="text-slate-500 mb-8">{msg}</p>
        
        <div className="space-y-3">
          <button 
            onClick={() => window.history.back()}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          {window.opener && (
            <button 
              onClick={() => window.close()}
              className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-900 transition-all"
            >
              <span>Close This Window</span>
            </button>
          )}
          <Link 
            to={candidateId ? `/candidates/${candidateId}` : '/'}
            className="w-full bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFail;
