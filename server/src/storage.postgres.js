const { Pool } = require('pg');

class PostgresStorage {
  constructor() {
    // Use Render's free PostgreSQL or other free services
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    this.initialized = false;
  }

  async initDatabase() {
    if (this.initialized) return;
    
    try {
      // Test connection first
      await this.pool.query('SELECT NOW()');
      console.log('✅ Database connection successful');
      
      // Create deliveries table (only if it doesn't exist)
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS deliveries (
          id SERIAL PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(20),
          chick_type VARCHAR(100) NOT NULL,
          loaded_box_weight DECIMAL(10,2) NOT NULL,
          empty_box_weight DECIMAL(10,2) NOT NULL,
          net_weight DECIMAL(10,2) NOT NULL,
          number_of_boxes INTEGER,
          notes TEXT,
          loaded_weights_list JSONB DEFAULT '[]',
          empty_weights_list JSONB DEFAULT '[]',
          order_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if they don't exist (for existing databases)
      try {
        await this.pool.query(`
          ALTER TABLE deliveries 
          ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20)
        `);
        await this.pool.query(`
          ALTER TABLE deliveries 
          ADD COLUMN IF NOT EXISTS loaded_weights_list JSONB DEFAULT '[]'
        `);
        await this.pool.query(`
          ALTER TABLE deliveries 
          ADD COLUMN IF NOT EXISTS empty_weights_list JSONB DEFAULT '[]'
        `);
        await this.pool.query(`
          ALTER TABLE deliveries 
          ADD COLUMN IF NOT EXISTS order_id INTEGER
        `);
        console.log('✅ Database schema updated with missing columns');
      } catch (alterErr) {
        console.log('ℹ️ Schema already up to date or error:', alterErr.message);
      }
      
      console.log('✅ Deliveries table ready');
      
      // Create orders table (only if it doesn't exist)
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          chick_type VARCHAR(100) NOT NULL,
          quantity INTEGER NOT NULL,
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255),
          customer_phone VARCHAR(20) NOT NULL,
          notes TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Orders table ready');
      
      // Create backups table to store automatic backups
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS backups (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          backup_data JSONB NOT NULL,
          backup_type VARCHAR(50) DEFAULT 'automatic',
          deliveries_count INTEGER DEFAULT 0,
          orders_count INTEGER DEFAULT 0,
          file_size INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Backups table ready');
      
      this.initialized = true;
      console.log('✅ Database tables initialized successfully');
    } catch (err) {
      console.error('❌ Database initialization error:', err);
      throw err;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initDatabase();
    }
  }

  safeJsonParse(jsonString, defaultValue = []) {
    try {
      if (!jsonString) return defaultValue;
      if (typeof jsonString === 'object') return jsonString; // Already parsed (JSONB)
      if (typeof jsonString === 'string') {
        return JSON.parse(jsonString);
      }
      return defaultValue;
    } catch (err) {
      console.error('JSON parse error:', err, 'Input:', jsonString);
      return defaultValue;
    }
  }

  safeJsonStringify(data) {
    try {
      if (typeof data === 'string') return data;
      return JSON.stringify(data || []);
    } catch (err) {
      console.error('JSON stringify error:', err);
      return '[]';
    }
  }

  async list() {
    try {
      await this.ensureInitialized();
      const result = await this.pool.query(
        'SELECT * FROM deliveries ORDER BY created_at DESC'
      );
      return result.rows.map(row => ({
        id: row.id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        chickType: row.chick_type,
        loadedBoxWeight: parseFloat(row.loaded_box_weight),
        emptyBoxWeight: parseFloat(row.empty_box_weight),
        netWeight: parseFloat(row.net_weight),
        numberOfBoxes: row.number_of_boxes,
        notes: row.notes,
        loadedWeightsList: this.safeJsonParse(row.loaded_weights_list, []),
        emptyWeightsList: this.safeJsonParse(row.empty_weights_list, []),
        orderId: row.order_id,
        createdAt: row.created_at.toISOString()
      }));
    } catch (err) {
      console.error('❌ Error listing deliveries:', err);
      return [];
    }
  }

  async create(input) {
    try {
      await this.ensureInitialized();
      const netWeight = input.loadedBoxWeight - input.emptyBoxWeight;
      
      console.log('📝 Creating delivery:', {
        customer: input.customerName,
        phone: input.customerPhone,
        type: input.chickType,
        netWeight: netWeight
      });
      
      const result = await this.pool.query(`
        INSERT INTO deliveries (
          customer_name, customer_phone, chick_type, loaded_box_weight, empty_box_weight, 
          net_weight, number_of_boxes, notes, loaded_weights_list, empty_weights_list, order_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        input.customerName,
        input.customerPhone,
        input.chickType,
        input.loadedBoxWeight,
        input.emptyBoxWeight,
        netWeight,
        input.numberOfBoxes,
        input.notes,
        this.safeJsonStringify(input.loadedWeightsList || []),
        this.safeJsonStringify(input.emptyWeightsList || []),
        input.orderId || null
      ]);

      const row = result.rows[0];
      const delivery = {
        id: row.id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        chickType: row.chick_type,
        loadedBoxWeight: parseFloat(row.loaded_box_weight),
        emptyBoxWeight: parseFloat(row.empty_box_weight),
        netWeight: parseFloat(row.net_weight),
        numberOfBoxes: row.number_of_boxes,
        notes: row.notes,
        loadedWeightsList: this.safeJsonParse(row.loaded_weights_list, []),
        emptyWeightsList: this.safeJsonParse(row.empty_weights_list, []),
        orderId: row.order_id,
        createdAt: row.created_at.toISOString()
      };
      
      console.log('✅ Delivery created successfully:', delivery.id);
      return delivery;
    } catch (err) {
      console.error('❌ Error creating delivery:', err);
      throw err;
    }
  }

  async update(id, input) {
    try {
      await this.ensureInitialized();
      const netWeight = input.loadedBoxWeight - input.emptyBoxWeight;
      
      const result = await this.pool.query(`
        UPDATE deliveries SET 
          customer_name = $1, customer_phone = $2, chick_type = $3, loaded_box_weight = $4, 
          empty_box_weight = $5, net_weight = $6, number_of_boxes = $7, 
          notes = $8, loaded_weights_list = $9, empty_weights_list = $10, order_id = $11
        WHERE id = $12
        RETURNING *
      `, [
        input.customerName,
        input.customerPhone,
        input.chickType,
        input.loadedBoxWeight,
        input.emptyBoxWeight,
        netWeight,
        input.numberOfBoxes,
        input.notes,
        this.safeJsonStringify(input.loadedWeightsList || []),
        this.safeJsonStringify(input.emptyWeightsList || []),
        input.orderId || null,
        id
      ]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        chickType: row.chick_type,
        loadedBoxWeight: parseFloat(row.loaded_box_weight),
        emptyBoxWeight: parseFloat(row.empty_box_weight),
        netWeight: parseFloat(row.net_weight),
        numberOfBoxes: row.number_of_boxes,
        notes: row.notes,
        loadedWeightsList: this.safeJsonParse(row.loaded_weights_list, []),
        emptyWeightsList: this.safeJsonParse(row.empty_weights_list, []),
        orderId: row.order_id,
        createdAt: row.created_at.toISOString()
      };
    } catch (err) {
      console.error('❌ Error updating delivery:', err);
      throw err;
    }
  }

  async delete(id) {
    try {
      await this.ensureInitialized();
      const result = await this.pool.query('DELETE FROM deliveries WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (err) {
      console.error('❌ Error deleting delivery:', err);
      return false;
    }
  }

  async deleteAll() {
    try {
      await this.ensureInitialized();
      const result = await this.pool.query('DELETE FROM deliveries');
      return { count: result.rowCount };
    } catch (err) {
      console.error('❌ Error deleting all deliveries:', err);
      throw err;
    }
  }

  async deleteByDate(date) {
    try {
      await this.ensureInitialized();
      // Delete deliveries for a specific date (YYYY-MM-DD format)
      const result = await this.pool.query(
        'DELETE FROM deliveries WHERE DATE(created_at) = $1',
        [date]
      );
      return { count: result.rowCount };
    } catch (err) {
      console.error('❌ Error deleting deliveries by date:', err);
      throw err;
    }
  }

  async exportData() {
    try {
      const deliveries = await this.list();
      return {
        deliveries,
        exportTime: new Date().toISOString(),
        totalDeliveries: deliveries.length
      };
    } catch (err) {
      console.error('❌ Error exporting data:', err);
      return { deliveries: [], exportTime: new Date().toISOString(), totalDeliveries: 0 };
    }
  }

  // Order Management Methods
  async listOrders() {
    try {
      await this.ensureInitialized();
      const result = await this.pool.query(
        'SELECT * FROM orders ORDER BY created_at DESC'
      );
      return result.rows.map(row => ({
        id: row.id,
        chickType: row.chick_type,
        quantity: row.quantity,
        customerName: row.customer_name,
        customerEmail: row.customer_email || '',
        customerPhone: row.customer_phone,
        notes: row.notes || '',
        status: row.status,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      }));
    } catch (err) {
      console.error('❌ Error listing orders:', err);
      return [];
    }
  }

  async createOrder(input) {
    try {
      await this.ensureInitialized();
      const result = await this.pool.query(`
        INSERT INTO orders (
          chick_type, quantity, customer_name, customer_email, customer_phone, notes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        input.chickType,
        input.quantity,
        input.customerName,
        input.customerEmail || '',
        input.customerPhone,
        input.notes || '',
        input.status || 'pending'
      ]);

      const row = result.rows[0];
      return {
        id: row.id,
        chickType: row.chick_type,
        quantity: row.quantity,
        customerName: row.customer_name,
        customerEmail: row.customer_email || '',
        customerPhone: row.customer_phone,
        notes: row.notes || '',
        status: row.status,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      };
    } catch (err) {
      console.error('❌ Error creating order:', err);
      throw err;
    }
  }

  async getOrder(id) {
    try {
      await this.ensureInitialized();
      const result = await this.pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [id]
      );
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        id: row.id,
        chickType: row.chick_type,
        quantity: row.quantity,
        customerName: row.customer_name,
        customerEmail: row.customer_email || '',
        customerPhone: row.customer_phone,
        notes: row.notes || '',
        status: row.status,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      };
    } catch (err) {
      console.error('❌ Error getting order:', err);
      return null;
    }
  }

  async updateOrder(id, updates) {
    try {
      await this.ensureInitialized();
      const result = await this.pool.query(`
        UPDATE orders 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [updates.status, id]);

      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        id: row.id,
        chickType: row.chick_type,
        quantity: row.quantity,
        customerName: row.customer_name,
        customerEmail: row.customer_email || '',
        customerPhone: row.customer_phone,
        notes: row.notes || '',
        status: row.status,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      };
    } catch (err) {
      console.error('❌ Error updating order:', err);
      throw err;
    }
  }

  async deleteOrder(id) {
    try {
      await this.ensureInitialized();
      const result = await this.pool.query(
        'DELETE FROM orders WHERE id = $1',
        [id]
      );
      return { success: result.rowCount > 0 };
    } catch (err) {
      console.error('❌ Error deleting order:', err);
      throw err;
    }
  }

  async deleteAllOrders() {
    try {
      await this.ensureInitialized();
      const result = await this.pool.query('DELETE FROM orders');
      return { count: result.rowCount };
    } catch (err) {
      console.error('❌ Error deleting all orders:', err);
      throw err;
    }
  }

  // ==================== BACKUP & RESTORE METHODS ====================

  async listBackups() {
    try {
      await this.ensureInitialized();
      
      // Get stored backups from database
      const result = await this.pool.query(`
        SELECT 
          id,
          filename,
          backup_type,
          deliveries_count,
          orders_count,
          file_size,
          created_at
        FROM backups
        ORDER BY created_at DESC
        LIMIT 30
      `);
      
      return result.rows.map(row => ({
        id: row.id,
        filename: row.filename,
        type: row.backup_type,
        deliveriesCount: row.deliveries_count,
        ordersCount: row.orders_count,
        size: row.file_size,
        createdAt: row.created_at.toISOString()
      }));
    } catch (err) {
      console.error('❌ Error listing backups:', err);
      return [];
    }
  }

  async createBackup(backupType = 'manual') {
    try {
      await this.ensureInitialized();
      const deliveries = await this.list();
      const orders = await this.listOrders();
      
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        deliveries,
        orders,
        counts: {
          deliveries: deliveries.length,
          orders: orders.length
        }
      };
      
      const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const backupJson = JSON.stringify(backup);
      const fileSize = backupJson.length;
      
      // Store backup in database
      const result = await this.pool.query(`
        INSERT INTO backups (
          filename, backup_data, backup_type, deliveries_count, orders_count, file_size
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, created_at
      `, [
        filename,
        backup,
        backupType,
        deliveries.length,
        orders.length,
        fileSize
      ]);
      
      // Keep only backups from last 15 days to save space
      await this.pool.query(`
        DELETE FROM backups
        WHERE created_at < NOW() - INTERVAL '15 days'
      `);
      
      return {
        id: result.rows[0].id,
        filename,
        type: backupType,
        data: backup,
        size: fileSize,
        timestamp: result.rows[0].created_at.toISOString(),
        counts: backup.counts
      };
    } catch (err) {
      console.error('❌ Error creating backup:', err);
      throw err;
    }
  }

  async getBackup(filename) {
    try {
      await this.ensureInitialized();
      const result = await this.pool.query(
        'SELECT backup_data FROM backups WHERE filename = $1',
        [filename]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Backup not found');
      }
      
      return result.rows[0].backup_data;
    } catch (err) {
      console.error('❌ Error getting backup:', err);
      throw err;
    }
  }

  async exportToCSV() {
    try {
      await this.ensureInitialized();
      const deliveries = await this.list();
      
      // CSV header
      let csv = 'ID,Customer Name,Customer Phone,Chick Type,Loaded Weight (kg),Empty Weight (kg),Net Weight (kg),Number of Boxes,Notes,Order ID,Created At\n';
      
      // CSV rows
      deliveries.forEach(d => {
        csv += `${d.id},"${d.customerName}","${d.customerPhone || ''}","${d.chickType}",${d.loadedBoxWeight},${d.emptyBoxWeight},${d.netWeight},${d.numberOfBoxes || ''},"${(d.notes || '').replace(/"/g, '""')}",${d.orderId || ''},"${d.createdAt}"\n`;
      });
      
      return csv;
    } catch (err) {
      console.error('❌ Error exporting to CSV:', err);
      throw err;
    }
  }

  async exportToExcel() {
    try {
      await this.ensureInitialized();
      const ExcelJS = require('exceljs');
      const deliveries = await this.list();
      const orders = await this.listOrders();
      
      const workbook = new ExcelJS.Workbook();
      
      // Deliveries sheet
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
        { header: 'Order ID', key: 'orderId', width: 10 },
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
          orderId: d.orderId || '',
          createdAt: d.createdAt
        });
      });
      
      // Style header row
      deliveriesSheet.getRow(1).font = { bold: true };
      deliveriesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Orders sheet
      const ordersSheet = workbook.addWorksheet('Orders');
      ordersSheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Chick Type', key: 'chickType', width: 15 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Customer Name', key: 'customerName', width: 20 },
        { header: 'Customer Phone', key: 'customerPhone', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Notes', key: 'notes', width: 30 },
        { header: 'Created At', key: 'createdAt', width: 20 }
      ];
      
      orders.forEach(o => {
        ordersSheet.addRow({
          id: o.id,
          chickType: o.chickType,
          quantity: o.quantity,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          status: o.status,
          notes: o.notes || '',
          createdAt: o.createdAt
        });
      });
      
      // Style header row
      ordersSheet.getRow(1).font = { bold: true };
      ordersSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (err) {
      console.error('❌ Error exporting to Excel:', err);
      throw err;
    }
  }

  async restoreBackup(filename) {
    try {
      await this.ensureInitialized();
      
      // Get backup from database
      const result = await this.pool.query(
        'SELECT backup_data FROM backups WHERE filename = $1',
        [filename]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Backup not found');
      }
      
      const backupData = result.rows[0].backup_data;
      return await this.restoreFromData(backupData);
    } catch (err) {
      console.error('❌ Error restoring backup:', err);
      throw err;
    }
  }

  async restoreFromData(backupData) {
    try {
      await this.ensureInitialized();
      
      // Start transaction
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Clear existing data
        await client.query('DELETE FROM deliveries');
        await client.query('DELETE FROM orders');
        
        // Restore deliveries
        if (backupData.deliveries && backupData.deliveries.length > 0) {
          for (const d of backupData.deliveries) {
            await client.query(`
              INSERT INTO deliveries (
                customer_name, customer_phone, chick_type, loaded_box_weight, empty_box_weight,
                net_weight, number_of_boxes, notes, loaded_weights_list, empty_weights_list, order_id, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
              d.customerName,
              d.customerPhone,
              d.chickType,
              d.loadedBoxWeight,
              d.emptyBoxWeight,
              d.netWeight,
              d.numberOfBoxes,
              d.notes,
              this.safeJsonStringify(d.loadedWeightsList || []),
              this.safeJsonStringify(d.emptyWeightsList || []),
              d.orderId || null,
              d.createdAt
            ]);
          }
        }
        
        // Restore orders
        if (backupData.orders && backupData.orders.length > 0) {
          for (const o of backupData.orders) {
            await client.query(`
              INSERT INTO orders (
                chick_type, quantity, customer_name, customer_email, customer_phone, notes, status, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              o.chickType,
              o.quantity,
              o.customerName,
              o.customerEmail || '',
              o.customerPhone,
              o.notes || '',
              o.status,
              o.createdAt
            ]);
          }
        }
        
        await client.query('COMMIT');
        
        return {
          success: true,
          deliveriesRestored: backupData.deliveries?.length || 0,
          ordersRestored: backupData.orders?.length || 0
        };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('❌ Error restoring from data:', err);
      throw err;
    }
  }

  async mergeFromData(backupData) {
    try {
      await this.ensureInitialized();
      
      // Start transaction
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        let deliveriesAdded = 0;
        let ordersAdded = 0;
        
        // Add deliveries (don't delete existing)
        if (backupData.deliveries && backupData.deliveries.length > 0) {
          for (const d of backupData.deliveries) {
            await client.query(`
              INSERT INTO deliveries (
                customer_name, customer_phone, chick_type, loaded_box_weight, empty_box_weight,
                net_weight, number_of_boxes, notes, loaded_weights_list, empty_weights_list, order_id, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
              d.customerName,
              d.customerPhone,
              d.chickType,
              d.loadedBoxWeight,
              d.emptyBoxWeight,
              d.netWeight,
              d.numberOfBoxes,
              d.notes,
              this.safeJsonStringify(d.loadedWeightsList || []),
              this.safeJsonStringify(d.emptyWeightsList || []),
              d.orderId || null,
              d.createdAt
            ]);
            deliveriesAdded++;
          }
        }
        
        // Add orders (don't delete existing)
        if (backupData.orders && backupData.orders.length > 0) {
          for (const o of backupData.orders) {
            await client.query(`
              INSERT INTO orders (
                chick_type, quantity, customer_name, customer_email, customer_phone, notes, status, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              o.chickType,
              o.quantity,
              o.customerName,
              o.customerEmail || '',
              o.customerPhone,
              o.notes || '',
              o.status,
              o.createdAt
            ]);
            ordersAdded++;
          }
        }
        
        await client.query('COMMIT');
        
        return {
          success: true,
          deliveriesAdded,
          ordersAdded
        };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('❌ Error merging from data:', err);
      throw err;
    }
  }

  async deleteBackup(filename) {
    try {
      await this.ensureInitialized();
      const result = await this.pool.query(
        'DELETE FROM backups WHERE filename = $1',
        [filename]
      );
      return { success: result.rowCount > 0 };
    } catch (err) {
      console.error('❌ Error deleting backup:', err);
      throw err;
    }
  }
}

module.exports = { PostgresStorage };