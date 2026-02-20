const fs = require('fs');
const path = require('path');

class FileStorage {
  constructor() {
    this.filePath = path.join(__dirname, '../data/deliveries.json');
    this.backupPath = path.join(__dirname, '../data/deliveries_backup.json');
    this.idCounter = 1;
    this.orders = [];
    this.orderIdCounter = 1;
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
        this.orders = data.orders || [];
        this.orderIdCounter = data.orderIdCounter || 1;
        console.log(`Loaded ${this.deliveries.length} deliveries from main file`);
      } 
      // If main file fails, try backup
      else if (fs.existsSync(this.backupPath)) {
        console.log('Main file not found, loading from backup...');
        const data = JSON.parse(fs.readFileSync(this.backupPath, 'utf8'));
        this.deliveries = data.deliveries || [];
        this.idCounter = data.idCounter || 1;
        this.orders = data.orders || [];
        this.orderIdCounter = data.orderIdCounter || 1;
        console.log(`Recovered ${this.deliveries.length} deliveries from backup`);
        // Restore main file from backup
        this.saveData();
      } else {
        this.deliveries = [];
        this.orders = [];
        console.log('No existing data found, starting fresh');
      }
    } catch (err) {
      console.error('Error loading main data, trying backup:', err);
      try {
        if (fs.existsSync(this.backupPath)) {
          const data = JSON.parse(fs.readFileSync(this.backupPath, 'utf8'));
          this.deliveries = data.deliveries || [];
          this.idCounter = data.idCounter || 1;
          this.orders = data.orders || [];
          this.orderIdCounter = data.orderIdCounter || 1;
          console.log(`Recovered ${this.deliveries.length} deliveries from backup after error`);
        } else {
          this.deliveries = [];
          this.orders = [];
        }
      } catch (backupErr) {
        console.error('Backup also failed, starting fresh:', backupErr);
        this.deliveries = [];
        this.orders = [];
      }
    }
  }

  saveData() {
    try {
      const data = {
        deliveries: this.deliveries,
        idCounter: this.idCounter,
        orders: this.orders || [],
        orderIdCounter: this.orderIdCounter || 1,
        lastSaved: new Date().toISOString()
      };
      
      // Save to main file
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
      
      // Also save to backup file
      fs.writeFileSync(this.backupPath, JSON.stringify(data, null, 2));
      
      console.log(`Data saved: ${this.deliveries.length} deliveries, ${(this.orders || []).length} orders`);
    } catch (err) {
      console.error('Error saving data:', err);
      // Try to save at least to backup location
      try {
        const data = {
          deliveries: this.deliveries,
          idCounter: this.idCounter,
          orders: this.orders || [],
          orderIdCounter: this.orderIdCounter || 1,
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
        .filter(file => file.startsWith('backup_') && file.endsWith('.json'));
      
      const fifteenDaysAgo = Date.now() - (15 * 24 * 60 * 60 * 1000); // 15 days in milliseconds
      
      backupFiles.forEach(file => {
        try {
          const filePath = path.join(dataDir, file);
          const stats = fs.statSync(filePath);
          const fileAge = stats.mtimeMs; // File modification time
          
          // Delete if older than 15 days
          if (fileAge < fifteenDaysAgo) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted old backup (>15 days): ${file}`);
          }
        } catch (err) {
          console.error(`Error processing backup ${file}:`, err);
        }
      });
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
      customerPhone: input.customerPhone,
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
      customerPhone: input.customerPhone,
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

  // Backup & Restore Methods
  async listBackups() {
    return [];
  }

  async createBackup(backupType = 'manual') {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      deliveries: this.deliveries,
      orders: [],
      counts: {
        deliveries: this.deliveries.length,
        orders: 0
      }
    };
    
    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    return {
      filename,
      type: backupType,
      data: backup,
      size: JSON.stringify(backup).length,
      timestamp: backup.timestamp,
      counts: backup.counts
    };
  }

  async getBackup(filename) {
    const backup = await this.createBackup();
    return backup.data;
  }

  async exportToCSV() {
    const deliveries = this.deliveries;
    
    let csv = 'ID,Customer Name,Customer Phone,Chick Type,Loaded Weight (kg),Empty Weight (kg),Net Weight (kg),Number of Boxes,Notes,Created At\n';
    
    deliveries.forEach(d => {
      csv += `${d.id},"${d.customerName}","${d.customerPhone || ''}","${d.chickType}",${d.loadedBoxWeight},${d.emptyBoxWeight},${d.netWeight},${d.numberOfBoxes || ''},"${(d.notes || '').replace(/"/g, '""')}","${d.createdAt}"\n`;
    });
    
    return csv;
  }

  async exportToExcel() {
    const ExcelJS = require('exceljs');
    const deliveries = this.deliveries;
    
    const workbook = new ExcelJS.Workbook();
    
    const deliveriesSheet = workbook.addWorksheet('Deliveries');
    deliveriesSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Customer Phone', key: 'customerPhone', width: 15 },
      { header: 'Chick Type', key: 'chickType', width: 15 },
      { header: 'Loaded Weight (kg)', key: 'loadedBoxWeight', width: 18 },
      { header: 'Empty Weight (kg)', key: 'emptyBoxWeight', width: 18 },
      { header: 'Net Weight (kg)', key: 'netWeight', width: 15 },
      { header: 'Number of Boxes', key: 'numberOfBoxes', width: 15 },
      { header: 'Notes', key: 'notes', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];
    
    deliveries.forEach(d => {
      deliveriesSheet.addRow({
        id: d.id,
        customerName: d.customerName,
        customerPhone: d.customerPhone || '',
        chickType: d.chickType,
        loadedBoxWeight: d.loadedBoxWeight,
        emptyBoxWeight: d.emptyBoxWeight,
        netWeight: d.netWeight,
        numberOfBoxes: d.numberOfBoxes || '',
        notes: d.notes || '',
        createdAt: d.createdAt
      });
    });
    
    deliveriesSheet.getRow(1).font = { bold: true };
    deliveriesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async restoreBackup(filename) {
    throw new Error('Restore from filename not supported for file storage');
  }

  async restoreFromData(backupData) {
    if (backupData.deliveries) {
      this.deliveries = backupData.deliveries;
      this.idCounter = Math.max(...this.deliveries.map(d => d.id), 0) + 1;
      this.saveData();
      
      return {
        success: true,
        deliveriesRestored: backupData.deliveries.length,
        ordersRestored: 0
      };
    }
    throw new Error('Invalid backup data');
  }

  async mergeFromData(backupData) {
    if (backupData.deliveries) {
      // Add backup deliveries to existing ones
      const maxId = this.deliveries.length > 0 ? Math.max(...this.deliveries.map(d => d.id)) : 0;
      
      const newDeliveries = backupData.deliveries.map((d, index) => ({
        ...d,
        id: maxId + index + 1
      }));
      
      this.deliveries = [...this.deliveries, ...newDeliveries];
      this.idCounter = Math.max(...this.deliveries.map(d => d.id), 0) + 1;
      this.saveData();
      
      return {
        success: true,
        deliveriesAdded: newDeliveries.length,
        ordersAdded: 0
      };
    }
    throw new Error('Invalid backup data');
  }

  async deleteBackup(filename) {
    return { success: true };
  }

  // Order methods for file storage
  async listOrders() {
    if (!this.orders) {
      this.orders = [];
      this.orderIdCounter = 1;
    }
    return this.orders.slice().reverse();
  }

  async createOrder(input) {
    if (!this.orders) {
      this.orders = [];
      this.orderIdCounter = 1;
    }
    
    const order = {
      id: this.orderIdCounter++,
      chickType: input.chickType,
      quantity: input.quantity,
      customerName: input.customerName,
      customerEmail: input.customerEmail || '',
      customerPhone: input.customerPhone,
      notes: input.notes || '',
      status: input.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.orders.push(order);
    this.saveData();
    return order;
  }

  async getOrder(id) {
    if (!this.orders) return null;
    return this.orders.find(o => o.id === id) || null;
  }

  async updateOrder(id, updates) {
    if (!this.orders) return null;
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return null;
    
    this.orders[index] = {
      ...this.orders[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveData();
    return this.orders[index];
  }

  async deleteOrder(id) {
    if (!this.orders) return { success: false };
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return { success: false };
    
    this.orders.splice(index, 1);
    this.saveData();
    return { success: true };
  }

  async deleteAllOrders() {
    if (!this.orders) {
      this.orders = [];
    } else {
      const count = this.orders.length;
      this.orders = [];
      this.saveData();
      return { count };
    }
    return { count: 0 };
  }
}


module.exports = { FileStorage };
