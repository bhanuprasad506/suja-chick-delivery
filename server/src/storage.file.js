const fs = require('fs');
const path = require('path');

class FileStorage {
  constructor() {
    this.filePath = path.join(__dirname, '../data/deliveries.json');
    this.idCounter = 1;
    this.ensureDataDir();
    this.loadData();
  }

  ensureDataDir() {
    const dataDir = path.dirname(this.filePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  loadData() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        this.deliveries = data.deliveries || [];
        this.idCounter = data.idCounter || 1;
      } else {
        this.deliveries = [];
      }
    } catch (err) {
      console.error('Error loading data:', err);
      this.deliveries = [];
    }
  }

  saveData() {
    try {
      const data = {
        deliveries: this.deliveries,
        idCounter: this.idCounter
      };
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error saving data:', err);
    }
  }

  async list() {
    return this.deliveries.slice().reverse();
  }

  async create(input) {
    const netWeight = input.loadedBoxWeight - input.emptyBoxWeight;
    
    const delivery = {
      id: this.idCounter++,
      customerName: input.customerName,
      chickType: input.chickType,
      loadedBoxWeight: input.loadedBoxWeight,
      emptyBoxWeight: input.emptyBoxWeight,
      numberOfBoxes: input.numberOfBoxes,
      notes: input.notes,
      netWeight: netWeight,
      loadedWeightsList: input.loadedWeightsList || [],
      emptyWeightsList: input.emptyWeightsList || [],
      createdAt: new Date().toISOString()
    };

    this.deliveries.push(delivery);
    this.saveData();
    return delivery;
  }

  async delete(id) {
    const index = this.deliveries.findIndex(item => item.id === id);
    if (index !== -1) {
      this.deliveries.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  async update(id, input) {
    const index = this.deliveries.findIndex(item => item.id === id);
    if (index === -1) return null;

    const netWeight = input.loadedBoxWeight - input.emptyBoxWeight;
    
    const updatedDelivery = {
      ...this.deliveries[index],
      customerName: input.customerName,
      chickType: input.chickType,
      loadedBoxWeight: input.loadedBoxWeight,
      emptyBoxWeight: input.emptyBoxWeight,
      numberOfBoxes: input.numberOfBoxes,
      notes: input.notes,
      netWeight: netWeight,
      loadedWeightsList: input.loadedWeightsList || [],
      emptyWeightsList: input.emptyWeightsList || [],
    };

    this.deliveries[index] = updatedDelivery;
    this.saveData();
    return updatedDelivery;
  }
}

module.exports = { FileStorage };