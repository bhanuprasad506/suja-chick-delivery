const fs = require('fs');
const path = require('path');

class AccountsStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.accountsFile = path.join(this.dataDir, 'accounts.json');
    this.transactionsFile = path.join(this.dataDir, 'transactions.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    this.accounts = this.loadAccounts();
    this.transactions = this.loadTransactions();
  }

  loadAccounts() {
    try {
      if (fs.existsSync(this.accountsFile)) {
        const data = fs.readFileSync(this.accountsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
    return [];
  }

  loadTransactions() {
    try {
      if (fs.existsSync(this.transactionsFile)) {
        const data = fs.readFileSync(this.transactionsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
    return [];
  }

  saveAccounts() {
    try {
      fs.writeFileSync(this.accountsFile, JSON.stringify(this.accounts, null, 2));
    } catch (err) {
      console.error('Failed to save accounts:', err);
      throw err;
    }
  }

  saveTransactions() {
    try {
      fs.writeFileSync(this.transactionsFile, JSON.stringify(this.transactions, null, 2));
    } catch (err) {
      console.error('Failed to save transactions:', err);
      throw err;
    }
  }

  // Get or create account for customer
  getOrCreateAccount(customerPhone, customerName) {
    let account = this.accounts.find(a => a.customerPhone === customerPhone);
    
    if (!account) {
      account = {
        id: this.accounts.length > 0 ? Math.max(...this.accounts.map(a => a.id)) + 1 : 1,
        customerPhone,
        customerName,
        totalAmount: 0,
        totalPaid: 0,
        outstandingAmount: 0,
        hidden: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.accounts.push(account);
      this.saveAccounts();
    }
    
    return account;
  }

  // Get account by phone
  getAccount(customerPhone) {
    return this.accounts.find(a => a.customerPhone === customerPhone);
  }

  // Get all accounts (excluding hidden by default)
  getAllAccounts(includeHidden = false) {
    if (includeHidden) {
      return this.accounts;
    }
    return this.accounts.filter(a => !a.hidden);
  }

  // Get hidden accounts only
  getHiddenAccounts() {
    return this.accounts.filter(a => a.hidden);
  }

  // Toggle account visibility
  toggleAccountVisibility(customerPhone) {
    const account = this.accounts.find(a => a.customerPhone === customerPhone);
    if (account) {
      account.hidden = !account.hidden;
      account.updatedAt = new Date().toISOString();
      this.saveAccounts();
      return account;
    }
    return null;
  }

  // Add transaction (delivery entry)
  addTransaction(data) {
    const { customerPhone, customerName, date, kgs, pricePerKg, totalAmount, notes } = data;
    
    // Use the exact date/time from the delivery (already includes time)
    const dateObj = new Date(date);
    
    const transaction = {
      id: this.transactions.length > 0 ? Math.max(...this.transactions.map(t => t.id)) + 1 : 1,
      customerPhone,
      customerName,
      type: 'delivery',
      date: dateObj.toISOString(),
      kgs: Number(kgs),
      pricePerKg: Number(pricePerKg),
      amount: Number(totalAmount),
      notes: notes || '',
      createdAt: new Date().toISOString()
    };
    
    this.transactions.push(transaction);
    this.saveTransactions();
    
    // Update account totals
    this.updateAccountTotals(customerPhone);
    
    return transaction;
  }

  // Add payment
  addPayment(data) {
    const { customerPhone, customerName, amount, date, notes } = data;
    
    // Combine the date with current time
    const dateObj = new Date(date);
    const now = new Date();
    dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    
    const payment = {
      id: this.transactions.length > 0 ? Math.max(...this.transactions.map(t => t.id)) + 1 : 1,
      customerPhone,
      customerName,
      type: 'payment',
      date: dateObj.toISOString(),
      amount: Number(amount),
      notes: notes || '',
      createdAt: new Date().toISOString()
    };
    
    this.transactions.push(payment);
    this.saveTransactions();
    
    // Update account totals
    this.updateAccountTotals(customerPhone);
    
    return payment;
  }

  // Get transactions for customer
  getTransactions(customerPhone) {
    return this.transactions
      .filter(t => t.customerPhone === customerPhone)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Update account totals
  updateAccountTotals(customerPhone) {
    const account = this.getOrCreateAccount(customerPhone, '');
    const transactions = this.getTransactions(customerPhone);
    
    let totalAmount = 0;
    let totalPaid = 0;
    
    transactions.forEach(t => {
      if (t.type === 'delivery') {
        totalAmount += t.amount;
      } else if (t.type === 'payment') {
        totalPaid += t.amount;
      }
    });
    
    account.totalAmount = totalAmount;
    account.totalPaid = totalPaid;
    account.outstandingAmount = totalAmount - totalPaid;
    account.updatedAt = new Date().toISOString();
    
    this.saveAccounts();
    
    return account;
  }

  // Delete transaction
  deleteTransaction(id) {
    const index = this.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      const transaction = this.transactions[index];
      this.transactions.splice(index, 1);
      this.saveTransactions();
      
      // Update account totals
      this.updateAccountTotals(transaction.customerPhone);
      
      return true;
    }
    return false;
  }

  // Update transaction
  updateTransaction(id, data) {
    const transaction = this.transactions.find(t => t.id === id);
    if (transaction) {
      Object.assign(transaction, data);
      this.saveTransactions();
      
      // Update account totals
      this.updateAccountTotals(transaction.customerPhone);
      
      return transaction;
    }
    return null;
  }
}

module.exports = { AccountsStorage };
