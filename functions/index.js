const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== DELIVERIES ====================

// Get all deliveries
app.get('/deliveries', async (req, res) => {
  try {
    const snapshot = await db.collection('deliveries')
      .orderBy('createdAt', 'desc')
      .get();
    
    const deliveries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(deliveries);
  } catch (err) {
    console.error('Error getting deliveries:', err);
    res.status(500).json({ error: 'Failed to get deliveries' });
  }
});

// Create delivery
app.post('/deliveries', async (req, res) => {
  try {
    const { 
      customerName,
      customerPhone,
      chickType, 
      loadedBoxWeight, 
      emptyBoxWeight, 
      numberOfBoxes, 
      notes,
      loadedWeightsList,
      emptyWeightsList
    } = req.body;
    
    if (!customerName || !chickType || loadedBoxWeight === undefined || emptyBoxWeight === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const netWeight = loadedBoxWeight - emptyBoxWeight;
    
    const delivery = {
      customerName,
      customerPhone: customerPhone || '',
      chickType,
      loadedBoxWeight,
      emptyBoxWeight,
      numberOfBoxes: numberOfBoxes || 0,
      notes: notes || '',
      netWeight,
      loadedWeightsList: loadedWeightsList || [],
      emptyWeightsList: emptyWeightsList || [],
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('deliveries').add(delivery);
    
    res.status(201).json({
      id: docRef.id,
      ...delivery
    });
  } catch (err) {
    console.error('Error creating delivery:', err);
    res.status(500).json({ error: 'Failed to create delivery' });
  }
});

// Update delivery
app.put('/deliveries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      customerName,
      customerPhone,
      chickType, 
      loadedBoxWeight, 
      emptyBoxWeight, 
      numberOfBoxes, 
      notes,
      loadedWeightsList,
      emptyWeightsList
    } = req.body;
    
    if (!customerName || !chickType || loadedBoxWeight === undefined || emptyBoxWeight === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const netWeight = loadedBoxWeight - emptyBoxWeight;
    
    const updatedDelivery = {
      customerName,
      customerPhone: customerPhone || '',
      chickType,
      loadedBoxWeight,
      emptyBoxWeight,
      numberOfBoxes: numberOfBoxes || 0,
      notes: notes || '',
      netWeight,
      loadedWeightsList: loadedWeightsList || [],
      emptyWeightsList: emptyWeightsList || []
    };

    await db.collection('deliveries').doc(id).update(updatedDelivery);
    
    res.json({
      id,
      ...updatedDelivery
    });
  } catch (err) {
    console.error('Error updating delivery:', err);
    res.status(500).json({ error: 'Failed to update delivery' });
  }
});

// Delete delivery
app.delete('/deliveries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('deliveries').doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting delivery:', err);
    res.status(500).json({ error: 'Failed to delete delivery' });
  }
});

// Delete all deliveries
app.delete('/deliveries', async (req, res) => {
  try {
    const snapshot = await db.collection('deliveries').get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    res.json({ success: true, deletedCount: snapshot.size });
  } catch (err) {
    console.error('Error deleting all deliveries:', err);
    res.status(500).json({ error: 'Failed to delete all deliveries' });
  }
});

// Delete deliveries by date
app.delete('/deliveries/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date).toDateString();
    const snapshot = await db.collection('deliveries').get();
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach(doc => {
      const deliveryDate = new Date(doc.data().createdAt).toDateString();
      if (deliveryDate === targetDate) {
        batch.delete(doc.ref);
        count++;
      }
    });
    
    await batch.commit();
    res.json({ success: true, deletedCount: count, date });
  } catch (err) {
    console.error('Error deleting deliveries by date:', err);
    res.status(500).json({ error: 'Failed to delete deliveries by date' });
  }
});

// ==================== CUSTOMERS ====================

// Register customer
app.post('/customers/register', async (req, res) => {
  try {
    const { phone, name } = req.body;
    
    if (!phone || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if customer exists
    const existingCustomer = await db.collection('customers')
      .where('phone', '==', phone)
      .get();
    
    if (!existingCustomer.empty) {
      return res.status(400).json({ error: 'Customer already exists' });
    }

    const customer = {
      phone,
      name,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('customers').add(customer);
    
    res.status(201).json({
      id: docRef.id,
      phone: customer.phone,
      name: customer.name
    });
  } catch (err) {
    console.error('Error registering customer:', err);
    res.status(500).json({ error: 'Failed to register customer' });
  }
});

// Customer login
app.post('/customers/login', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Missing phone number' });
    }

    const snapshot = await db.collection('customers')
      .where('phone', '==', phone)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'Account not found. Please create an account first.' });
    }

    const doc = snapshot.docs[0];
    const customer = doc.data();
    
    res.json({
      id: doc.id,
      phone: customer.phone,
      name: customer.name
    });
  } catch (err) {
    console.error('Error logging in customer:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// ==================== ORDERS ====================

// Get all orders
app.get('/orders', async (req, res) => {
  try {
    const snapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(orders);
  } catch (err) {
    console.error('Error getting orders:', err);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Create order
app.post('/orders', async (req, res) => {
  try {
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

    const order = {
      chickType,
      quantity: Number(quantity),
      customerName,
      customerPhone,
      notes: notes || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('orders').add(order);
    
    res.status(201).json({
      id: docRef.id,
      ...order
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order
app.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const docRef = db.collection('orders').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = {
      ...doc.data(),
      status: status || doc.data().status,
      notes: notes !== undefined ? notes : doc.data().notes,
      updatedAt: new Date().toISOString()
    };
    
    await docRef.update(updatedOrder);
    
    res.json({
      id,
      ...updatedOrder
    });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order
app.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('orders').doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Delete all orders
app.delete('/orders', async (req, res) => {
  try {
    const snapshot = await db.collection('orders').get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    res.json({ success: true, deletedCount: snapshot.size });
  } catch (err) {
    console.error('Error deleting all orders:', err);
    res.status(500).json({ error: 'Failed to delete all orders' });
  }
});

// Export data
app.get('/export', async (req, res) => {
  try {
    const deliveriesSnapshot = await db.collection('deliveries').get();
    const ordersSnapshot = await db.collection('orders').get();
    const customersSnapshot = await db.collection('customers').get();
    
    const data = {
      deliveries: deliveriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      orders: ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      customers: customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      exportTime: new Date().toISOString()
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="suja-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(data);
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Export Express app as Firebase Function
exports.api = functions.https.onRequest(app);
