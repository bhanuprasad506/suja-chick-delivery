const fs = require('fs');
const path = require('path');

class CustomerStorage {
  constructor() {
    this.filePath = path.join(__dirname, '../data/customers.json');
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
        this.customers = data.customers || [];
        console.log(`✅ Loaded ${this.customers.length} customers from storage`);
      } else {
        this.customers = [];
        console.log('📝 Starting with empty customer list');
      }
    } catch (err) {
      console.error('Error loading customers:', err);
      this.customers = [];
    }
  }

  saveData() {
    try {
      const data = {
        customers: this.customers,
        lastSaved: new Date().toISOString()
      };
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
      console.log(`✅ Saved ${this.customers.length} customers`);
    } catch (err) {
      console.error('Error saving customers:', err);
    }
  }

  findByPhone(phone) {
    return this.customers.find(c => c.phone === phone);
  }

  register(phone, name) {
    // Check if customer already exists
    const existing = this.findByPhone(phone);
    if (existing) {
      return existing;
    }

    const customer = {
      id: Date.now(),
      phone,
      name,
      createdAt: new Date().toISOString()
    };

    this.customers.push(customer);
    this.saveData();
    console.log('✅ Customer registered:', phone);
    return customer;
  }

  login(phone, name) {
    let customer = this.findByPhone(phone);

    if (!customer) {
      // Do NOT auto-create - return null if customer doesn't exist
      console.log('❌ Customer not found:', phone);
      return null;
    } else {
      console.log('✅ Customer logged in:', phone);
    }

    return customer;
  }

  getAll() {
    return this.customers;
  }

  delete(phone) {
    const index = this.customers.findIndex(c => c.phone === phone);
    if (index !== -1) {
      this.customers.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  deleteAll() {
    const count = this.customers.length;
    this.customers = [];
    this.saveData();
    return count;
  }
}

module.exports = { CustomerStorage };
