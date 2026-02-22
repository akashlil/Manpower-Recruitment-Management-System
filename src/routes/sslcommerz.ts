import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const router = express.Router();

// SSLCommerz Sandbox Credentials
const STORE_ID = 'testbox';
const STORE_PASS = 'qwerty';
const IS_SANDBOX = true;
const SSL_API_URL = IS_SANDBOX 
  ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php' 
  : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

// Initialize SSLCommerz Payment
router.post('/init', authenticateToken, async (req: any, res) => {
  const { candidate_id, amount, payment_type } = req.body;
  const tran_id = `SSLC_${uuidv4().slice(0, 8).toUpperCase()}`;

  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidate_id) as any;
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

  // Store transaction as pending
  db.prepare(`
    INSERT INTO ssl_transactions (candidate_id, amount, payment_type, tran_id, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(candidate_id, parseFloat(amount), payment_type, tran_id);

  // Robust App URL detection
  let appUrl = process.env.APP_URL;
  if (!appUrl) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['host'];
    appUrl = `${protocol}://${host}`;
  }
  
  // Ensure no trailing slash
  appUrl = appUrl.replace(/\/$/, '');
  
  console.log('Initializing SSLCommerz with App URL:', appUrl);

  const data = new URLSearchParams();
  data.append('store_id', STORE_ID);
  data.append('store_passwd', STORE_PASS);
  data.append('total_amount', amount.toString());
  data.append('currency', 'BDT');
  data.append('tran_id', tran_id);
  data.append('success_url', `${appUrl}/api/sslcommerz/success`);
  data.append('fail_url', `${appUrl}/api/sslcommerz/fail`);
  data.append('cancel_url', `${appUrl}/api/sslcommerz/cancel`);
  data.append('ipn_url', `${appUrl}/api/sslcommerz/ipn`);
  data.append('shipping_method', 'NO');
  data.append('product_name', payment_type || 'Service Payment');
  data.append('product_category', 'Service');
  data.append('product_profile', 'general');
  data.append('cus_name', candidate.name || 'Customer');
  data.append('cus_email', candidate.email || 'customer@example.com');
  data.append('cus_phone', candidate.phone || '01700000000');
  data.append('cus_add1', 'Dhaka');
  data.append('cus_city', 'Dhaka');
  data.append('cus_country', 'Bangladesh');

  try {
    const response = await axios.post(SSL_API_URL, data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (response.data.status === 'SUCCESS') {
      res.json({ url: response.data.GatewayPageURL });
    } else {
      console.error('SSL Init Error Response:', response.data);
      res.status(400).json({ message: response.data.failedreason || 'Failed to initialize payment' });
    }
  } catch (error: any) {
    console.error('SSL API Error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Success Callback
router.post('/success', (req, res) => {
  const { tran_id, status } = req.body;
  console.log('SSL Success Callback Received:', { tran_id, status });
  
  let appUrl = process.env.APP_URL;
  if (!appUrl) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['host'];
    appUrl = `${protocol}://${host}`;
  }
  appUrl = appUrl.replace(/\/$/, '');

  if (status !== 'VALID') {
    return res.redirect(`${appUrl}/payment/fail?msg=Payment Validation Failed&tran_id=${tran_id}`);
  }

  const transaction = db.prepare('SELECT * FROM ssl_transactions WHERE tran_id = ?').get(tran_id) as any;
  if (!transaction) {
    console.error('Transaction not found for tran_id:', tran_id);
    return res.redirect(`${appUrl}/payment/fail?msg=Transaction Not Found&tran_id=${tran_id}`);
  }

  if (transaction.status === 'success') {
    return res.redirect(`${appUrl}/payment/success/${tran_id}?candidate_id=${transaction.candidate_id}`);
  }

  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(transaction.candidate_id) as any;

  const dbTransaction = db.transaction(() => {
    db.prepare("UPDATE ssl_transactions SET status = 'success' WHERE tran_id = ?").run(tran_id);
    db.prepare(`
      INSERT INTO payments (candidate_id, amount, payment_type, payment_method, transaction_id, notes)
      VALUES (?, ?, ?, 'sslcommerz', ?, ?)
    `).run(transaction.candidate_id, transaction.amount, transaction.payment_type, tran_id, 'SSLCommerz Online Payment');

    const amountNum = parseFloat(transaction.amount);
    const newTotalPaid = (parseFloat(candidate.total_paid) || 0) + amountNum;
    const newDue = (parseFloat(candidate.package_amount) || 0) - newTotalPaid;
    
    db.prepare('UPDATE candidates SET total_paid = ?, due_amount = ? WHERE id = ?')
      .run(newTotalPaid, newDue, transaction.candidate_id);
  });

  try {
    dbTransaction();
    console.log('Payment processed successfully for tran_id:', tran_id);
    res.redirect(`${appUrl}/payment/success/${tran_id}?candidate_id=${transaction.candidate_id}`);
  } catch (error) {
    console.error('SSL Success DB Error:', error);
    res.redirect(`${appUrl}/payment/fail?msg=Database Update Failed&candidate_id=${transaction.candidate_id}`);
  }
});

// Fail Callback
router.post('/fail', (req, res) => {
  const { tran_id } = req.body;
  let appUrl = process.env.APP_URL;
  if (!appUrl) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['host'];
    appUrl = `${protocol}://${host}`;
  }
  appUrl = appUrl.replace(/\/$/, '');

  const transaction = db.prepare('SELECT * FROM ssl_transactions WHERE tran_id = ?').get(tran_id) as any;
  db.prepare("UPDATE ssl_transactions SET status = 'failed' WHERE tran_id = ?").run(tran_id);
  res.redirect(`${appUrl}/payment/fail?msg=Payment Failed&candidate_id=${transaction?.candidate_id}`);
});

// Cancel Callback
router.post('/cancel', (req, res) => {
  const { tran_id } = req.body;
  let appUrl = process.env.APP_URL;
  if (!appUrl) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['host'];
    appUrl = `${protocol}://${host}`;
  }
  appUrl = appUrl.replace(/\/$/, '');

  const transaction = db.prepare('SELECT * FROM ssl_transactions WHERE tran_id = ?').get(tran_id) as any;
  db.prepare("UPDATE ssl_transactions SET status = 'cancelled' WHERE tran_id = ?").run(tran_id);
  res.redirect(`${appUrl}/payment/cancel?candidate_id=${transaction?.candidate_id}`);
});

// IPN Callback (Instant Payment Notification)
router.post('/ipn', (req, res) => {
  const { tran_id, status } = req.body;
  console.log('SSL IPN received:', { tran_id, status });
  // In a real app, you'd verify the transaction here as well
  res.status(200).send('OK');
});

export default router;
