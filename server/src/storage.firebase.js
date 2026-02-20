const admin = require('firebase-admin');

class FirebaseStorage {
  constructor() {
    this.db = admin.firestore();
  }

  async initDatabase() {
    try {
      // Test connection
      await this.db.collection('_test').doc('_test').set({ test: true });
      await this.db.collection('_test').doc('_test').delete();
      console.log('✅ Firebase Firestore connected successfully');
    } catch (err) {
      console.error('❌ Firebase connection error:', err);
      throw err;
    }
  }

  async list() {
    try {
      const snapshot = await this.db
        .collection('deliveries')
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: parseInt(doc.id) || doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error('Error listing deliveries:', err);
      return [];
    }
  }

  async create(input) {
    try {
      const netWeight = input.loadedBoxWeight - input.emptyBoxWeight;
      
      const delivery = {
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

      const docRef = await this.db.collection('deliveries').add(delivery);
      console.log('✅ Delivery created:', docRef.id);
      
      return {
        id: docRef.id,
        ...delivery
      };
    } catch (err) {
      console.error('Error creating delivery:', err);
      throw err;
    }
  }

  async update(id, input) {
    try {
      const netWeight = input.loadedBoxWeight - input.emptyBoxWeight;
      
      const updatedDelivery = {
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        chickType: input.chickType,
        loadedBoxWeight: input.loadedBoxWeight,
        emptyBoxWeight: input.emptyBoxWeight,
        numberOfBoxes: input.numberOfBoxes,
        notes: input.notes,
        netWeight: netWeight,
        loadedWeightsList: input.loadedWeightsList || [],
        emptyWeightsList: input.emptyWeightsList || []
      };

      await this.db.collection('deliveries').doc(id.toString()).update(updatedDelivery);
      console.log('✅ Delivery updated:', id);
      
      return {
        id,
        ...updatedDelivery
      };
    } catch (err) {
      console.error('Error updating delivery:', err);
      throw err;
    }
  }

  async delete(id) {
    try {
      await this.db.collection('deliveries').doc(id.toString()).delete();
      console.log('✅ Delivery deleted:', id);
      return true;
    } catch (err) {
      console.error('Error deleting delivery:', err);
      return false;
    }
  }

  async deleteAll() {
    try {
      const snapshot = await this.db.collection('deliveries').get();
      const batch = this.db.batch();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`✅ Deleted all deliveries: ${snapshot.size} items`);
      return { count: snapshot.size };
    } catch (err) {
      console.error('Error deleting all deliveries:', err);
      throw err;
    }
  }

  async deleteByDate(date) {
    try {
      const targetDate = new Date(date).toDateString();
      const snapshot = await this.db.collection('deliveries').get();
      
      const batch = this.db.batch();
      let count = 0;
      
      snapshot.docs.forEach(doc => {
        const deliveryDate = new Date(doc.data().createdAt).toDateString();
        if (deliveryDate === targetDate) {
          batch.delete(doc.ref);
          count++;
        }
      });
      
      await batch.commit();
      console.log(`✅ Deleted deliveries for ${date}: ${count} items`);
      return { count };
    } catch (err) {
      console.error('Error deleting deliveries by date:', err);
      throw err;
    }
  }

  async exportData() {
    try {
      const snapshot = await this.db.collection('deliveries').get();
      const deliveries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        deliveries,
        exportTime: new Date().toISOString(),
        totalDeliveries: deliveries.length
      };
    } catch (err) {
      console.error('Error exporting data:', err);
      return {
        deliveries: [],
        exportTime: new Date().toISOString(),
        totalDeliveries: 0
      };
    }
  }

  // For compatibility with file storage interface
  saveData() {
    // Firebase auto-saves, no need to do anything
    return Promise.resolve();
  }
}

module.exports = { FirebaseStorage };
