const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

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

let deliveries = [];
let orders = [];
let customers = [];
let deliveryId = 1;
let orderId = 1;
let customerId = 1;

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Deliveries endpoints
app.get('/deliveries', (_req, res) => {
  res.json(deliveries.slice().reverse());
});

app.post('/deliveries', (req, res) => {
  const { customerName, customerPhone, chickType, loadedBoxWeight, emptyBoxWeight, numberOfBoxes, notes, loadedWeightsList, emptyWeightsList } = req.body || {};
  if (!customerName || !chickType || typeof loadedBoxWeight !== 'number' || typeof emptyBoxWeight !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const netWeight = Number(loadedBoxWeight) - Number(emptyBoxWeight);
  const item = {
    id: deliveryId++,
    customerName,
    customerPhone,
    chickType,
    loadedBoxWeight: Number(loadedBoxWeight),
    emptyBoxWeight: Number(emptyBoxWeight),
    numberOfBoxes: typeof numberOfBoxes === 'number' ? numberOfBoxes : undefined,
    netWeight,
    notes: notes || undefined,
    loadedWeightsList: loadedWeightsList || [],
    emptyWeightsList: emptyWeightsList || [],
    createdAt: new Date().toISOString(),
  };
  deliveries.push(item);
  console.log('✅ Delivery created:', item);
  res.status(201).json(item);
});

app.put('/deliveries/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { customerName, customerPhone, chickType, loadedBoxWeight, emptyBoxWeight, numberOfBoxes, notes, loadedWeightsList, emptyWeightsList } = req.body;
  
  const index = deliveries.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Delivery not found' });
  }

  const netWeight = Number(loadedBoxWeight) - Number(emptyBoxWeight);
  const updated = {
    ...deliveries[index],
    customerName,
    customerPhone,
    chickType,
    loadedBoxWeight: Number(loadedBoxWeight),
    emptyBoxWeight: Number(emptyBoxWeight),
    numberOfBoxes: typeof numberOfBoxes === 'number' ? numberOfBoxes : undefined,
    netWeight,
    notes: notes || undefined,
    loadedWeightsList: loadedWeightsList || [],
    emptyWeightsList: emptyWeightsList || [],
  };
  
  deliveries[index] = updated;
  res.json(updated);
});

app.delete('/deliveries/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = deliveries.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Delivery not found' });
  }
  deliveries.splice(index, 1);
  res.json({ success: true });
});

app.delete('/deliveries', (req, res) => {
  const count = deliveries.length;
  deliveries = [];
  res.json({ success: true, deletedCount: count });
});

app.delete('/deliveries/date/:date', (req, res) => {
  const date = req.params.date;
  const beforeCount = deliveries.length;
  deliveries = deliveries.filter(d => !d.createdAt.startsWith(date));
  const deletedCount = beforeCount - deliveries.length;
  res.json({ success: true, deletedCount, date });
});

// Orders endpoints
app.get('/orders', (_req, res) => {
  res.json(orders);
});

app.post('/orders', (req, res) => {
  const { chickType, quantity, customerName, customerPhone, notes } = req.body;
  
  console.log('📝 Received order request:', { chickType, quantity, customerName, customerPhone });
  
  if (!chickType || !quantity || !customerName || !customerPhone) {
    console.log('❌ Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const order = {
    id: orderId++,
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
  console.log('✅ Order created:', order);
  res.status(201).json(order);
});

app.put('/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { status, notes } = req.body;
  
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const updated = {
    ...orders[index],
    status: status || orders[index].status,
    notes: notes !== undefined ? notes : orders[index].notes,
    updatedAt: new Date().toISOString()
  };
  
  orders[index] = updated;
  console.log('✅ Order updated:', updated);
  res.json(updated);
});

app.delete('/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  orders.splice(index, 1);
  res.json({ success: true });
});

app.delete('/orders', (req, res) => {
  const count = orders.length;
  orders = [];
  res.json({ success: true, deletedCount: count });
});

app.delete('/orders/date/:date', (req, res) => {
  const date = req.params.date;
  const beforeCount = orders.length;
  orders = orders.filter(o => !o.createdAt.startsWith(date));
  const deletedCount = beforeCount - orders.length;
  res.json({ success: true, deletedCount, date });
});

// Customer Management Endpoints
app.post('/customers/register', (req, res) => {
  const { phone, name } = req.body;
  
  if (!phone || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if customer already exists
  const existing = customers.find(c => c.phone === phone);
  if (existing) {
    return res.status(400).json({ error: 'Customer already registered with this phone number' });
  }

  const customer = {
    id: customerId++,
    phone,
    name,
    createdAt: new Date().toISOString()
  };
  
  customers.push(customer);
  console.log('✅ Customer registered:', phone);
  res.status(201).json({ id: customer.id, phone: customer.phone, name: customer.name });
});

app.post('/customers/login', (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: 'Missing phone number' });
  }

  const customer = customers.find(c => c.phone === phone);
  
  if (!customer) {
    return res.status(404).json({ error: 'Account not found. Please create an account first.' });
  }

  console.log('✅ Customer logged in:', phone);
  res.json({ id: customer.id, phone: customer.phone, name: customer.name });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Dev server listening on http://localhost:${PORT}`));
