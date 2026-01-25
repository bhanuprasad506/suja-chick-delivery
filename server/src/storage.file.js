const fs = require('fs');
const path = require('path');

class FileStorage {
  constructor() {
    this.filePath = path.join(__dirname, '../data/deliveries.json');
    this.backupPath = path.join(__dirname, '../data/deliveries_backup.json');
    this.idCounter = 1;
    this.ensureDataDir();
    this.loadData();
    this.setupAutoBackup();
  }

  ensureDataDir() {
    const dataDir = path.dirname(this.filePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  loadData() {
    try {
      // Try to load main file first
      if (fs.existsSync(this.filePath)) {
        const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        this.deliveries = data.deliveries || [];
        this.idCounter = data.idCounter || 1;
        console.log(`Loaded ${this.deliveries.length} deliveries from main file`);
      } 
      // If main file fails, try backup
      else if (fs.existsSync(this.backupPath)) {
        console.log('Main file not found, loading from backup...');
        const data = JSON.parse(fs.readFileSync(this.backupPath, 'utf8'));
        this.deliveries = data.deliveries || [];
        this.idCounter = data.idCounter || 1;
        console.log(`Recovered ${this.deliveries.length} deliveries from backup`);
        // Restore main file from backup
        this.saveData();
      } else {
        this.deliveries = [];
        console.log('No existing data found, starting fresh');
      }
    } catch (err) {
      console.error('Error loading main data, trying backup:', err);
      try {
        if (fs.existsSync(this.backupPath)) {
          const data = JSON.parse(fs.readFileSync(this.backupPath, 'utf8'));
          this.deliveries = data.deliveries || [];
          this.idCounter = data.idCounter || 1;
          console.log(`Recovered ${this.deliveries.length} deliveries from backup after error`);
        } else {
          this.deliveries = [];
        }
      } catch (backupErr) {
        console.error('Backup also failed, starting fresh:', backupErr);
        this.deliveries = [];
      }
    }
  }

  saveData() {
    try {
      const data = {
        deliveries: this.deliveries,
        idCounter: this.idCounter,
        lastSaved: new Date().toISOString()
      };
      
      // Save to main file
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
      
      // Also save to backup file
      fs.writeFileSync(this.backupPath, JSON.stringify(data, null, 2));
      
      console.log(`Data saved: ${this.deliveries.length} deliveries`);
    } catch (err) {
      console.error('Error saving data:', err);
      // Try to save at least to backup location
      try {
        const data = {
          deliveries: this.deliveries,
          idCounter: this.idCounter,
          lastSaved: new Date().toISOString(),
          emergencySave: true
        };
        fs.writeFileSync(this.backupPath, JSON.stringify(data, null, 2));
        console.log('Emergency backup saved');
      } catch (backupErr) {
        console.error('Emergency backup also failed:', backupErr);
      }
    }
  }

  setupAutoBackup() {
    // Create backup every 5 minutes
    setInterval(() => {
      this.createTimestampedBackup();
    }, 5 * 60 * 1000); // 5 minutes
  }

  createTimestampedBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const timestampedBackupPath = path.join(__dirname, `../data/backup_${timestamp}.json`);
      
      const data = {
        deliveries: this.deliveries,
        idCounter: this.idCounter,
        backupTime: new Date().toISOString()
      };
      
      fs.writeFileSync(timestampedBackupPath, JSON.stringify(data, null, 2));
      
      // Keep only last 10 timestamped backups
      this.cleanOldBackups();
      
      console.log(`Timestamped backup created: backup_${timestamp}.json`);
    } catch (err) {
      console.error('Error creating timestamped backup:', err);
    }
  }

  cleanOldBackups() {
    try {
      const dataDir = path.join(__dirname, '../data');
      const files = fs.readdirSync(dataDir);
      const backupFiles = files
        .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
        .sort()
        .reverse(); // Most recent first
      
      // Keep only the 10 most recent backups
      if (backupFiles.length > 10) {
        const filesToDelete = backupFiles.slice(10);
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(path.join(dataDir, file));
          } catch (err) {
            console.error(`Error deleting old backup ${file}:`, err);
          }
        });
      }
    } catch (err) {
      console.error('Error cleaning old backups:', err);
    }
  }

  // Export data for manual backup
  async exportData() {
    return {
      deliveries: this.deliveries,
      idCounter: this.idCounter,
      exportTime: new Date().toISOString(),
      totalDeliveries: this.deliveries.length
    };
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

  async deleteAll() {
    const count = this.deliveries.length;
    this.deliveries = [];
    this.saveData();
    return { count };
  }

  async deleteByDate(date) {
    const targetDate = new Date(date).toDateString();
    const initialCount = this.deliveries.length;
    
    this.deliveries = this.deliveries.filter(delivery => {
      const deliveryDate = new Date(delivery.createdAt).toDateString();
      return deliveryDate !== targetDate;
    });
    
    const deletedCount = initialCount - this.deliveries.length;
    this.saveData();
    return { count: deletedCount };
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