const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

let db = [];
let id = 1;

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/deliveries', (_req, res) => {
  res.json(db.slice().reverse());
});

app.post('/deliveries', (req, res) => {
  const { customerName, chickType, loadedBoxWeight, emptyBoxWeight, numberOfBoxes, notes } = req.body || {};
  if (!customerName || !chickType || typeof loadedBoxWeight !== 'number' || typeof emptyBoxWeight !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const netWeight = Number(loadedBoxWeight) - Number(emptyBoxWeight);
  const item = {
    id: id++,
    customerName,
    chickType,
    loadedBoxWeight: Number(loadedBoxWeight),
    emptyBoxWeight: Number(emptyBoxWeight),
    numberOfBoxes: typeof numberOfBoxes === 'number' ? numberOfBoxes : undefined,
    netWeight,
    notes: notes || undefined,
    createdAt: new Date().toISOString(),
  };
  db.push(item);
  res.status(201).json(item);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Dev server listening on http://localhost:${PORT}`));
