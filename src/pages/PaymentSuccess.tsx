import React, { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Download } from 'lucide-react';
import api from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PaymentSuccess: React.FC = () => {
  const { tranId } = useParams();
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('candidate_id');

  useEffect(() => {
    console.log('PaymentSuccess mounted for tranId:', tranId);
  }, [tranId]);

  const handleDownloadReceipt = async () => {
    if (!tranId) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Your session is restricted in this tab. Please go back to the "Candidate Profile" page in your main app window and download the receipt from the ledger list.');
      return;
    }

    try {
      const cleanTranId = tranId.trim();
      console.log('Attempting to fetch payment details for:', cleanTranId);
      const response = await api.get(`/payments/transaction/${cleanTranId}`);
      const payment = response.data;
      console.log('Payment details fetched:', payment);

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
      const errorMsg = error.response?.data?.message || error.message || 'Failed to generate receipt. Please ensure you are logged in.';
      alert(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
        <p className="text-slate-500 mb-8">Your transaction has been completed successfully. The candidate's balance has been updated.</p>
        
        <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Transaction ID</span>
            <span className="font-mono font-bold text-slate-900">{tranId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Status</span>
            <span className="text-emerald-600 font-bold uppercase">Success</span>
          </div>
        </div>

        {!localStorage.getItem('token') && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 text-left">
            <strong>Note:</strong> You are currently in a guest session. To download your receipt, please return to the <strong>Candidate Profile</strong> in the main app window.
          </div>
        )}

        <div className="space-y-3">
          <Link 
            to={candidateId ? `/candidates/${candidateId}` : '/'}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-all"
          >
            <span>Back to Profile</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          {window.opener && (
            <button 
              onClick={() => window.close()}
              className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-900 transition-all"
            >
              <span>Close This Window</span>
            </button>
          )}
          <button 
            onClick={handleDownloadReceipt}
            className="w-full bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
