const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Initialize storage
let storage;

async function initStorage() {
  if (process.env.DATABASE_URL) {
    try {
      const { PostgresStorage } = require('./server/src/storage.postgres.js');
      storage = new PostgresStorage();
      await storage.initDatabase(); // Wait for database initialization
      console.log('✅ Using PostgreSQL storage - data will persist');
      return;
    } catch (err) {
      console.error('❌ PostgreSQL failed, falling back to file storage:', err);
    }
  }
  
  // Fallback to file storage
  const { FileStorage } = require('./server/src/storage.file.js');
  storage = new FileStorage();
  console.log('⚠️ Using file storage (data may not persist on free hosting)');
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
    chickType, 
    loadedBoxWeight, 
    emptyBoxWeight, 
    numberOfBoxes, 
    notes,
    loadedWeightsList,
    emptyWeightsList
  } = req.body;
  
  console.log('📝 Received delivery request:', { customerName, chickType, loadedBoxWeight, emptyBoxWeight });
  
  if (!customerName || !chickType || loadedBoxWeight === undefined || emptyBoxWeight === undefined) {
    console.log('❌ Missing required fields');
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