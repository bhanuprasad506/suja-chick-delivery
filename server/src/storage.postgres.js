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
      
      // Create table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS deliveries (
          id SERIAL PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          chick_type VARCHAR(100) NOT NULL,
          loaded_box_weight DECIMAL(10,2) NOT NULL,
          empty_box_weight DECIMAL(10,2) NOT NULL,
          net_weight DECIMAL(10,2) NOT NULL,
          number_of_boxes INTEGER,
          notes TEXT,
          loaded_weights_list JSONB DEFAULT '[]',
          empty_weights_list JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      this.initialized = true;
      console.log('✅ Database table initialized successfully');
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
        chickType: row.chick_type,
        loadedBoxWeight: parseFloat(row.loaded_box_weight),
        emptyBoxWeight: parseFloat(row.empty_box_weight),
        netWeight: parseFloat(row.net_weight),
        numberOfBoxes: row.number_of_boxes,
        notes: row.notes,
        loadedWeightsList: this.safeJsonParse(row.loaded_weights_list, []),
        emptyWeightsList: this.safeJsonParse(row.empty_weights_list, []),
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
        type: input.chickType,
        netWeight: netWeight
      });
      
      const result = await this.pool.query(`
        INSERT INTO deliveries (
          customer_name, chick_type, loaded_box_weight, empty_box_weight, 
          net_weight, number_of_boxes, notes, loaded_weights_list, empty_weights_list
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        input.customerName,
        input.chickType,
        input.loadedBoxWeight,
        input.emptyBoxWeight,
        netWeight,
        input.numberOfBoxes,
        input.notes,
        this.safeJsonStringify(input.loadedWeightsList || []),
        this.safeJsonStringify(input.emptyWeightsList || [])
      ]);

      const row = result.rows[0];
      const delivery = {
        id: row.id,
        customerName: row.customer_name,
        chickType: row.chick_type,
        loadedBoxWeight: parseFloat(row.loaded_box_weight),
        emptyBoxWeight: parseFloat(row.empty_box_weight),
        netWeight: parseFloat(row.net_weight),
        numberOfBoxes: row.number_of_boxes,
        notes: row.notes,
        loadedWeightsList: this.safeJsonParse(row.loaded_weights_list, []),
        emptyWeightsList: this.safeJsonParse(row.empty_weights_list, []),
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
          customer_name = $1, chick_type = $2, loaded_box_weight = $3, 
          empty_box_weight = $4, net_weight = $5, number_of_boxes = $6, 
          notes = $7, loaded_weights_list = $8, empty_weights_list = $9
        WHERE id = $10
        RETURNING *
      `, [
        input.customerName,
        input.chickType,
        input.loadedBoxWeight,
        input.emptyBoxWeight,
        netWeight,
        input.numberOfBoxes,
        input.notes,
        this.safeJsonStringify(input.loadedWeightsList || []),
        this.safeJsonStringify(input.emptyWeightsList || []),
        id
      ]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        customerName: row.customer_name,
        chickType: row.chick_type,
        loadedBoxWeight: parseFloat(row.loaded_box_weight),
        emptyBoxWeight: parseFloat(row.empty_box_weight),
        netWeight: parseFloat(row.net_weight),
        numberOfBoxes: row.number_of_boxes,
        notes: row.notes,
        loadedWeightsList: this.safeJsonParse(row.loaded_weights_list, []),
        emptyWeightsList: this.safeJsonParse(row.empty_weights_list, []),
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
}

module.exports = { PostgresStorage };