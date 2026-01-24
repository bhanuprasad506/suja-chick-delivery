const express = require('express');
const path = require('path');
const { FileStorage } = require('./server/src/storage.file.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Use file-based storage for persistence
const storage = new FileStorage();

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

  try {
    const delivery = await storage.create({
      customerName,
      chickType,
      loadedBoxWeight,
      emptyBoxWeight,
      numberOfBoxes,
      notes,
      loadedWeightsList,
      emptyWeightsList
    });
    res.status(201).json(delivery);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create delivery' });
  }
});

app.put('/deliveries/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { 
    customerName, 
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

  try {
    const updatedDelivery = await storage.update(id, {
      customerName,
      chickType,
      loadedBoxWeight,
      emptyBoxWeight,
      numberOfBoxes,
      notes,
      loadedWeightsList,
      emptyWeightsList
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

// Serve static files from frontend/dist
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Suja Chick Delivery app running on port ${PORT}`);
});