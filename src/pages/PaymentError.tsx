import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

const PaymentError: React.FC = () => {
  const [searchParams] = useSearchParams();
  const msg = searchParams.get('msg') || 'Something went wrong with your payment.';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Error</h1>
        <p className="text-slate-500 mb-8">{msg}</p>
        
        <Link
          to="/candidates"
          className="flex items-center justify-center space-x-2 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Candidates</span>
        </Link>
      </div>
    </div>
  );
};

export default PaymentError;
