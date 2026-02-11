const express = require('express');
const path = require('path');

try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional
}

const app = express();
const PORT = process.env.PORT || 4000;

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
    const storageType = hasDatabase ? 'PostgreSQL' : 'File Storage';
    const deliveries = await storage.list();
    
    res.json({
      status: 'ok',
      storageType,
      hasDatabase,
      deliveryCount: deliveries.length,
      databaseUrl: hasDatabase ? 'Connected' : 'Not configured',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message,
      storageType: process.env.DATABASE_URL ? 'PostgreSQL (failed)' : 'File Storage'
    });
  }
});

app.get('/deliveries', async (req, res) => {
  const deliveries = await storage.list();
  res.json(deliveries);
});

// Export data endpoint for backup
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
    
    res.json({ id: customer.id, phone: customer.phone, name: customer.name });
  } catch (err) {
    console.error('❌ Failed to login customer:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Order Management Endpoints
let orders = []; // Simple in-memory storage for orders (in production, use database)

// Get all orders (admin only)
app.get('/orders', async (req, res) => {
  res.json(orders);
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
    const order = {
      id: Date.now(), // Simple ID generation
      chickType,
      quantity: Number(quantity),
      customerName,
      customerPhone,
      notes: notes || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    orders.push(order);
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
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const updatedOrder = {
      ...orders[orderIndex],
      status: status || orders[orderIndex].status,
      notes: notes !== undefined ? notes : orders[orderIndex].notes,
      updatedAt: new Date().toISOString()
    };
    
    orders[orderIndex] = updatedOrder;
    
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
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    orders.splice(orderIndex, 1);
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
    const count = orders.length;
    orders = [];
    console.log(`🗑️ Deleted all orders: ${count} items`);
    res.json({ success: true, deletedCount: count });
  } catch (err) {
    console.error('❌ Failed to delete all orders:', err);
    res.status(500).json({ error: 'Failed to delete all orders' });
  }
});

// Delete orders by date
app.delete('/orders/date/:date', async (req, res) => {
  const date = req.params.date; // Format: YYYY-MM-DD
  
  try {
    const beforeCount = orders.length;
    orders = orders.filter(o => !o.createdAt.startsWith(date));
    const deletedCount = beforeCount - orders.length;
    console.log(`🗑️ Deleted orders for ${date}: ${deletedCount} items`);
    res.json({ success: true, deletedCount, date });
  } catch (err) {
    console.error('❌ Failed to delete orders by date:', err);
    res.status(500).json({ error: 'Failed to delete orders by date' });
  }
});

// Serve static files from frontend/dist
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', async () => {
  await initStorage();
  console.log(`Suja Chick Delivery app running on port ${PORT}`);
});