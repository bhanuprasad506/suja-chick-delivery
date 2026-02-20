const express = require('express');
const compression = require('compression');
const path = require('path');

try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional
}

const app = express();
const PORT = process.env.PORT || 4000;

// Enable gzip compression for all responses
app.use(compression());

// Parse JSON bodies
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Initialize Twilio for SMS (optional - only if credentials are provided)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  console.log('✅ Twilio SMS service initialized');
} else {
  console.log('⚠️ Twilio credentials not configured - SMS notifications disabled');
}

// Initialize storage
let storage;
let customerStorage;
let accountsStorage;

async function initStorage() {
  // Try Firebase first if credentials are provided
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      const admin = require('firebase-admin');
      
      // Parse private key (handle newline characters)
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      
      console.log('✅ Firebase initialized successfully');
      
      // Use Firebase storage
      const { FirebaseStorage } = require('./server/src/storage.firebase.js');
      storage = new FirebaseStorage();
      await storage.initDatabase();
      console.log('✅ Using Firebase Firestore - data will persist');
    } catch (err) {
      console.error('❌ Firebase failed, falling back to file storage:', err);
      const { FileStorage } = require('./server/src/storage.file.js');
      storage = new FileStorage();
      console.log('⚠️ Using file storage (data may not persist on free hosting)');
    }
  } else if (process.env.DATABASE_URL) {
    try {
      const { PostgresStorage } = require('./server/src/storage.postgres.js');
      storage = new PostgresStorage();
      await storage.initDatabase();
      console.log('✅ Using PostgreSQL storage - data will persist');
    } catch (err) {
      console.error('❌ PostgreSQL failed, falling back to file storage:', err);
      const { FileStorage } = require('./server/src/storage.file.js');
      storage = new FileStorage();
      console.log('⚠️ Using file storage (data may not persist on free hosting)');
    }
  } else {
    // Fallback to file storage
    const { FileStorage } = require('./server/src/storage.file.js');
    storage = new FileStorage();
    console.log('⚠️ Using file storage (data may not persist on free hosting)');
  }

  // Initialize customer storage
  const { CustomerStorage } = require('./server/src/storage.customers.js');
  customerStorage = new CustomerStorage();
  
  // Initialize accounts storage
  const { AccountsStorage } = require('./server/src/storage.accounts.js');
  accountsStorage = new AccountsStorage();
  console.log('✅ Accounts storage initialized');
  
  // Create accounts for existing customers
  try {
    const customers = customerStorage.getAll();
    let accountsCreated = 0;
    
    customers.forEach(customer => {
      const existingAccount = accountsStorage.getAccount(customer.phone);
      if (!existingAccount) {
        accountsStorage.getOrCreateAccount(customer.phone, customer.name);
        accountsCreated++;
      }
    });
    
    if (accountsCreated > 0) {
      console.log(`✅ Created accounts for ${accountsCreated} existing customers`);
    }
  } catch (err) {
    console.error('⚠️ Failed to create accounts for existing customers:', err.message);
  }
}

// Global error handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Try to save data before crashing
  try {
    storage.saveData();
    console.log('Emergency data save completed');
  } catch (saveErr) {
    console.error('Emergency save failed:', saveErr);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Try to save data
  try {
    storage.saveData();
    console.log('Emergency data save completed');
  } catch (saveErr) {
    console.error('Emergency save failed:', saveErr);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, saving data...');
  try {
    storage.saveData();
    console.log('Data saved successfully before shutdown');
  } catch (err) {
    console.error('Error saving data during shutdown:', err);
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, saving data...');
  try {
    storage.saveData();
    console.log('Data saved successfully before shutdown');
  } catch (err) {
    console.error('Error saving data during shutdown:', err);
  }
  process.exit(0);
});

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Debug endpoint to check database status
app.get('/debug', async (req, res) => {
  try {
    const hasDatabase = !!process.env.DATABASE_URL;
    const storageType = storage.constructor.name;
    const deliveries = await storage.list();
    const orders = await storage.listOrders();
    
    res.json({
      status: 'ok',
      storageType,
      hasDatabase,
      databaseUrl: hasDatabase ? 'Connected' : 'Not configured',
      deliveryCount: deliveries.length,
      orderCount: orders.length,
      timestamp: new Date().toISOString(),
      recentDeliveries: deliveries.slice(0, 3).map(d => ({
        id: d.id,
        customerName: d.customerName,
        createdAt: d.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message,
      stack: err.stack,
      storageType: storage ? storage.constructor.name : 'Not initialized',
      hasDatabase: !!process.env.DATABASE_URL
    });
  }
});

app.get('/deliveries', async (req, res) => {
  const deliveries = await storage.list();
  res.json(deliveries);
});

// ==================== BACKUP & RESTORE ENDPOINTS ====================

// Get list of all backups
app.get('/backups', async (req, res) => {
  try {
    const backups = await storage.listBackups();
    res.json(backups);
  } catch (err) {
    console.error('❌ Failed to list backups:', err);
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

// Create manual backup
app.post('/backups', async (req, res) => {
  try {
    const backup = await storage.createBackup();
    console.log('✅ Manual backup created:', backup.filename);
    res.status(201).json(backup);
  } catch (err) {
    console.error('❌ Failed to create backup:', err);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Download backup as JSON
app.get('/backups/:filename/download', async (req, res) => {
  try {
    const { filename } = req.params;
    const data = await storage.getBackup(filename);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(data);
  } catch (err) {
    console.error('❌ Failed to download backup:', err);
    res.status(404).json({ error: 'Backup not found' });
  }
});

// Export data as CSV
app.get('/export/csv', async (req, res) => {
  try {
    const csv = await storage.exportToCSV();
    const filename = `suja-deliveries-${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error('❌ Failed to export CSV:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export data as Excel
app.get('/export/excel', async (req, res) => {
  try {
    const buffer = await storage.exportToExcel();
    const filename = `suja-deliveries-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('❌ Failed to export Excel:', err);
    res.status(500).json({ error: 'Failed to export Excel' });
  }
});

// Restore from backup
app.post('/backups/:filename/restore', async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await storage.restoreBackup(filename);
    console.log('✅ Backup restored:', filename);
    res.json(result);
  } catch (err) {
    console.error('❌ Failed to restore backup:', err);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// Restore from uploaded JSON data
app.post('/restore', async (req, res) => {
  try {
    const backupData = req.body;
    
    if (!backupData || !backupData.deliveries) {
      return res.status(400).json({ error: 'Invalid backup data' });
    }
    
    const result = await storage.restoreFromData(backupData);
    console.log('✅ Data restored from upload');
    res.json(result);
  } catch (err) {
    console.error('❌ Failed to restore data:', err);
    res.status(500).json({ error: 'Failed to restore data' });
  }
});

// Merge backup data with existing data (add instead of replace)
app.post('/merge', async (req, res) => {
  try {
    const backupData = req.body;
    
    if (!backupData || !backupData.deliveries) {
      return res.status(400).json({ error: 'Invalid backup data' });
    }
    
    const result = await storage.mergeFromData(backupData);
    console.log('✅ Data merged from upload');
    res.json(result);
  } catch (err) {
    console.error('❌ Failed to merge data:', err);
    res.status(500).json({ error: 'Failed to merge data' });
  }
});

// Delete backup
app.delete('/backups/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    await storage.deleteBackup(filename);
    console.log('🗑️ Backup deleted:', filename);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to delete backup:', err);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// Legacy export endpoint (kept for backward compatibility)
app.get('/export', async (req, res) => {
  try {
    const data = await storage.exportData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="suja-deliveries-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

app.post('/deliveries', async (req, res) => {
  const { 
    customerName,
    customerPhone,
    chickType, 
    loadedBoxWeight, 
    emptyBoxWeight, 
    numberOfBoxes, 
    notes,
    loadedWeightsList,
    emptyWeightsList,
    orderId
  } = req.body;
  
  console.log('📝 Received delivery request:', { customerName, customerPhone, chickType, loadedBoxWeight, emptyBoxWeight, orderId });
  
  if (!customerName || !chickType || loadedBoxWeight === undefined || emptyBoxWeight === undefined) {
    console.log('❌ Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const delivery = await storage.create({
      customerName,
      customerPhone,
      chickType,
      loadedBoxWeight,
      emptyBoxWeight,
      numberOfBoxes,
      notes,
      loadedWeightsList,
      emptyWeightsList,
      orderId
    });
    console.log('✅ Delivery created successfully');
    
    // Automatically create account for the customer if phone is provided
    if (accountsStorage && customerPhone) {
      accountsStorage.getOrCreateAccount(customerPhone, customerName);
      console.log('✅ Account ensured for customer:', customerPhone);
    }
    
    // Automatically create backup after each delivery submission
    try {
      const backup = await storage.createBackup('automatic');
      console.log(`💾 Auto-backup created after delivery: ${backup.counts.deliveries} deliveries, ${backup.counts.orders} orders`);
    } catch (backupErr) {
      console.error('⚠️ Auto-backup failed (delivery still saved):', backupErr.message);
      // Don't fail the delivery creation if backup fails
    }
    
    res.status(201).json(delivery);
  } catch (err) {
    console.error('❌ Failed to create delivery:', err);
    res.status(500).json({ 
      error: 'Failed to create delivery', 
      details: err.message,
      hint: 'Check if database is properly connected'
    });
  }
});

app.put('/deliveries/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { 
    customerName,
    customerPhone,
    chickType, 
    loadedBoxWeight, 
    emptyBoxWeight, 
    numberOfBoxes, 
    notes,
    loadedWeightsList,
    emptyWeightsList,
    orderId
  } = req.body;
  
  if (!customerName || !chickType || loadedBoxWeight === undefined || emptyBoxWeight === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const updatedDelivery = await storage.update(id, {
      customerName,
      customerPhone,
      chickType,
      loadedBoxWeight,
      emptyBoxWeight,
      numberOfBoxes,
      notes,
      loadedWeightsList,
      emptyWeightsList,
      orderId
    });
    
    if (updatedDelivery) {
      res.json(updatedDelivery);
    } else {
      res.status(404).json({ error: 'Delivery not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update delivery' });
  }
});

app.delete('/deliveries/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    const deleted = await storage.delete(id);
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Delivery not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete delivery' });
  }
});

// Delete all deliveries
app.delete('/deliveries', async (req, res) => {
  try {
    const result = await storage.deleteAll();
    console.log(`🗑️ Deleted all deliveries: ${result.count} items`);
    res.json({ success: true, deletedCount: result.count });
  } catch (err) {
    console.error('❌ Failed to delete all deliveries:', err);
    res.status(500).json({ error: 'Failed to delete all deliveries' });
  }
});

// Delete deliveries by date
app.delete('/deliveries/date/:date', async (req, res) => {
  const date = req.params.date; // Format: YYYY-MM-DD
  
  try {
    const result = await storage.deleteByDate(date);
    console.log(`🗑️ Deleted deliveries for ${date}: ${result.count} items`);
    res.json({ success: true, deletedCount: result.count, date: date });
  } catch (err) {
    console.error('❌ Failed to delete deliveries by date:', err);
    res.status(500).json({ error: 'Failed to delete deliveries by date' });
  }
});

// Helper function to send SMS notification
async function sendSMSNotification(phoneNumber, message) {
  if (!twilioClient) {
    console.log('⚠️ SMS service not configured, skipping notification');
    return false;
  }

  try {
    // Format phone number to international format if needed
    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      // Assume Indian number if no country code
      formattedPhone = '+91' + phoneNumber.replace(/\D/g, '').slice(-10);
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log('✅ SMS sent successfully:', result.sid);
    return true;
  } catch (err) {
    console.error('❌ Failed to send SMS:', err.message);
    return false;
  }
}

// Customer Management Endpoints
// Register new customer
app.post('/customers/register', async (req, res) => {
  if (!customerStorage) {
    return res.status(500).json({ error: 'Server not ready. Please try again.' });
  }

  const { phone, name } = req.body;
  
  if (!phone || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const customer = customerStorage.register(phone, name);
    
    // Automatically create account for the customer
    if (accountsStorage) {
      accountsStorage.getOrCreateAccount(phone, name);
      console.log('✅ Account created for customer:', phone);
    }
    
    res.status(201).json({ id: customer.id, phone: customer.phone, name: customer.name });
  } catch (err) {
    console.error('❌ Failed to register customer:', err);
    res.status(500).json({ error: 'Failed to register customer' });
  }
});

// Customer login
app.post('/customers/login', async (req, res) => {
  if (!customerStorage) {
    return res.status(500).json({ error: 'Server not ready. Please try again.' });
  }

  const { phone, name } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: 'Missing phone number' });
  }

  try {
    const customer = customerStorage.login(phone, name);
    
    if (!customer) {
      return res.status(404).json({ error: 'Account not found. Please create an account first.' });
    }
    
    // Automatically create account for the customer if it doesn't exist
    if (accountsStorage) {
      accountsStorage.getOrCreateAccount(customer.phone, customer.name);
      console.log('✅ Account ensured for customer:', customer.phone);
    }
    
    res.json({ id: customer.id, phone: customer.phone, name: customer.name });
  } catch (err) {
    console.error('❌ Failed to login customer:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Order Management Endpoints

// Get all orders (admin only)
app.get('/orders', async (req, res) => {
  try {
    const orders = await storage.listOrders();
    res.json(orders);
  } catch (err) {
    console.error('❌ Error getting orders:', err);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Create new order (customer)
app.post('/orders', async (req, res) => {
  const { 
    chickType, 
    quantity, 
    customerName, 
    customerPhone, 
    notes 
  } = req.body;
  
  if (!chickType || !quantity || !customerName || !customerPhone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const order = await storage.createOrder({
      chickType,
      quantity: Number(quantity),
      customerName,
      customerPhone,
      notes: notes || '',
      status: 'pending'
    });
    
    // Automatically create account for the customer if it doesn't exist
    if (accountsStorage) {
      accountsStorage.getOrCreateAccount(customerPhone, customerName);
      console.log('✅ Account ensured for customer:', customerPhone);
    }
    
    console.log('📝 New order created:', order);
    res.status(201).json(order);
  } catch (err) {
    console.error('❌ Failed to create order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status (admin only)
app.put('/orders/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, notes } = req.body;
  
  try {
    const updatedOrder = await storage.updateOrder(id, { status, notes });
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log('📝 Order updated:', updatedOrder);
    res.json(updatedOrder);
  } catch (err) {
    console.error('❌ Failed to update order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order (admin only)
app.delete('/orders/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    const result = await storage.deleteOrder(id);
    
    if (!result.success) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log('🗑️ Order deleted:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to delete order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Delete all orders
app.delete('/orders', async (req, res) => {
  try {
    const result = await storage.deleteAllOrders();
    console.log(`🗑️ Deleted all orders: ${result.count} items`);
    res.json({ success: true, deletedCount: result.count });
  } catch (err) {
    console.error('❌ Failed to delete all orders:', err);
    res.status(500).json({ error: 'Failed to delete all orders' });
  }
});

// ==================== ACCOUNTS MANAGEMENT ENDPOINTS ====================

// Get all accounts (admin only)
app.get('/accounts', async (req, res) => {
  try {
    const includeHidden = req.query.includeHidden === 'true';
    const accounts = accountsStorage.getAllAccounts(includeHidden);
    res.json(accounts);
  } catch (err) {
    console.error('❌ Error getting accounts:', err);
    res.status(500).json({ error: 'Failed to get accounts' });
  }
});

// Get hidden accounts only
app.get('/accounts/hidden/list', async (req, res) => {
  try {
    const accounts = accountsStorage.getHiddenAccounts();
    res.json(accounts);
  } catch (err) {
    console.error('❌ Error getting hidden accounts:', err);
    res.status(500).json({ error: 'Failed to get hidden accounts' });
  }
});

// Get account by phone
app.get('/accounts/:phone', async (req, res) => {
  try {
    const account = accountsStorage.getAccount(req.params.phone);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(account);
  } catch (err) {
    console.error('❌ Error getting account:', err);
    res.status(500).json({ error: 'Failed to get account' });
  }
});

// Get or create account
app.post('/accounts', async (req, res) => {
  try {
    const { customerPhone, customerName } = req.body;
    if (!customerPhone || !customerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const account = accountsStorage.getOrCreateAccount(customerPhone, customerName);
    res.json(account);
  } catch (err) {
    console.error('❌ Error creating account:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Get transactions for customer
app.get('/accounts/:phone/transactions', async (req, res) => {
  try {
    const transactions = accountsStorage.getTransactions(req.params.phone);
    res.json(transactions);
  } catch (err) {
    console.error('❌ Error getting transactions:', err);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Add delivery transaction
app.post('/accounts/:phone/transactions/delivery', async (req, res) => {
  try {
    const { customerName, date, kgs, pricePerKg, notes } = req.body;
    const customerPhone = req.params.phone;
    
    if (!date || !kgs || !pricePerKg) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const totalAmount = Number(kgs) * Number(pricePerKg);
    
    const transaction = accountsStorage.addTransaction({
      customerPhone,
      customerName,
      date,
      kgs,
      pricePerKg,
      totalAmount,
      notes
    });
    
    console.log('✅ Delivery transaction added:', transaction);
    res.status(201).json(transaction);
  } catch (err) {
    console.error('❌ Error adding transaction:', err);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// Add payment
app.post('/accounts/:phone/transactions/payment', async (req, res) => {
  try {
    const { customerName, date, amount, notes } = req.body;
    const customerPhone = req.params.phone;
    
    if (!date || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const payment = accountsStorage.addPayment({
      customerPhone,
      customerName,
      date,
      amount,
      notes
    });
    
    console.log('✅ Payment added:', payment);
    res.status(201).json(payment);
  } catch (err) {
    console.error('❌ Error adding payment:', err);
    res.status(500).json({ error: 'Failed to add payment' });
  }
});

// Delete transaction
app.delete('/transactions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = accountsStorage.deleteTransaction(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    console.log('🗑️ Transaction deleted:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting transaction:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Update transaction
app.put('/transactions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const transaction = accountsStorage.updateTransaction(id, req.body);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    console.log('✅ Transaction updated:', transaction);
    res.json(transaction);
  } catch (err) {
    console.error('❌ Error updating transaction:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Toggle account visibility (hide/unhide)
app.put('/accounts/:phone/toggle-visibility', async (req, res) => {
  try {
    const customerPhone = req.params.phone;
    const account = accountsStorage.toggleAccountVisibility(customerPhone);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    console.log(`👁️ Account visibility toggled: ${customerPhone} - Hidden: ${account.hidden}`);
    res.json(account);
  } catch (err) {
    console.error('❌ Error toggling account visibility:', err);
    res.status(500).json({ error: 'Failed to toggle account visibility' });
  }
});

// Serve static files from frontend/dist with caching
app.use(express.static(path.join(__dirname, 'frontend/dist'), {
  maxAge: '1d', // Cache static files for 1 day
  etag: true,
  lastModified: true
}));

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', async () => {
  await initStorage();
  console.log(`Suja Chick Delivery app running on port ${PORT}`);
  
  // Start automatic daily backup (runs every 24 hours)
  startAutomaticBackup();
});

// Automatic backup function
async function startAutomaticBackup() {
  const BACKUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  async function performBackup() {
    try {
      console.log('🔄 Starting automatic backup...');
      const backup = await storage.createBackup('automatic');
      console.log(`✅ Automatic backup completed: ${backup.counts.deliveries} deliveries, ${backup.counts.orders} orders (stored in database)`);
    } catch (err) {
      console.error('❌ Automatic backup failed:', err);
    }
  }
  
  async function cleanupOldBackups() {
    try {
      console.log('🧹 Starting backup cleanup (removing backups older than 15 days)...');
      
      // For PostgreSQL storage, cleanup is automatic in createBackup
      // For FileStorage, call cleanOldBackups if it exists
      if (typeof storage.cleanOldBackups === 'function') {
        storage.cleanOldBackups();
        console.log('✅ Old backups cleaned up');
      } else {
        console.log('ℹ️ Backup cleanup handled automatically by storage');
      }
    } catch (err) {
      console.error('❌ Backup cleanup failed:', err);
    }
  }
  
  // Perform initial backup after 1 minute
  setTimeout(performBackup, 60 * 1000);
  
  // Then perform backup every 6 hours
  setInterval(performBackup, BACKUP_INTERVAL);
  
  // Perform cleanup daily
  setInterval(cleanupOldBackups, CLEANUP_INTERVAL);
  
  // Run cleanup once on startup (after 2 minutes)
  setTimeout(cleanupOldBackups, 2 * 60 * 1000);
  
  console.log('✅ Automatic backup scheduled (every 6 hours)');
  console.log('✅ Automatic cleanup scheduled (daily, removes backups >15 days old)');
}