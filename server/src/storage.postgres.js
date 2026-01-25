const { Pool } = require('pg');

class PostgresStorage {
  constructor() {
    // Use Render's free PostgreSQL or other free services
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/suja_deliveries',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    this.initDatabase();
  }

  async initDatabase() {
    try {
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
      console.log('Database initialized successfully');
    } catch (err) {
      console.error('Database initialization error:', err);
    }
  }

  async list() {
    try {
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
        loadedWeightsList: row.loaded_weights_list || [],
        emptyWeightsList: row.empty_weights_list || [],
        createdAt: row.created_at.toISOString()
      }));
    } catch (err) {
      console.error('Error listing deliveries:', err);
      return [];
    }
  }

  async create(input) {
    try {
      const netWeight = input.loadedBoxWeight - input.emptyBoxWeight;
      
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
        JSON.stringify(input.loadedWeightsList || []),
        JSON.stringify(input.emptyWeightsList || [])
      ]);

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
        loadedWeightsList: JSON.parse(row.loaded_weights_list || '[]'),
        emptyWeightsList: JSON.parse(row.empty_weights_list || '[]'),
        createdAt: row.created_at.toISOString()
      };
    } catch (err) {
      console.error('Error creating delivery:', err);
      throw err;
    }
  }

  async update(id, input) {
    try {
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
        JSON.stringify(input.loadedWeightsList || []),
        JSON.stringify(input.emptyWeightsList || []),
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
        loadedWeightsList: JSON.parse(row.loaded_weights_list || '[]'),
        emptyWeightsList: JSON.parse(row.empty_weights_list || '[]'),
        createdAt: row.created_at.toISOString()
      };
    } catch (err) {
      console.error('Error updating delivery:', err);
      throw err;
    }
  }

  async delete(id) {
    try {
      const result = await this.pool.query('DELETE FROM deliveries WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (err) {
      console.error('Error deleting delivery:', err);
      return false;
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
      console.error('Error exporting data:', err);
      return { deliveries: [], exportTime: new Date().toISOString(), totalDeliveries: 0 };
    }
  }
}

module.exports = { PostgresStorage };