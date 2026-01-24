const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// In-memory storage for simplicity in deployment
let deliveries = [];
let idCounter = 1;

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/deliveries', (req, res) => {
  res.json(deliveries.slice().reverse());
});

app.post('/deliveries', (req, res) => {
  const { customerName, chickType, loadedBoxWeight, emptyBoxWeight, numberOfBoxes, notes } = req.body;
  
  if (!customerName || !chickType || loadedBoxWeight === undefined || emptyBoxWeight === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const netWeight = loadedBoxWeight - emptyBoxWeight;
  const delivery = {
    id: idCounter++,
    customerName,
    chickType,
    loadedBoxWeight,
    emptyBoxWeight,
    numberOfBoxes,
    notes,
    netWeight,
    createdAt: new Date().toISOString()
  };

  deliveries.push(delivery);
  res.status(201).json(delivery);
});

app.delete('/deliveries/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = deliveries.findIndex(d => d.id === id);
  
  if (index !== -1) {
    deliveries.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Delivery not found' });
  }
});

// Serve static files from frontend/dist
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Suja Chick Delivery app running on port ${PORT}`);
});