// models/bikeSpecificationModel.js
const pool = require('../db');

class BikeSpecificationModel {
  static async getByBrandAndModel(model) {
    const [rows] = await pool.query(
      `SELECT bs.id, bs.model, st.name as spec_name, 
              st.display_name, bs.value, st.unit, st.category
       FROM bike_specifications bs
       JOIN specification_types st ON bs.spec_type_id = st.id
       WHERE bs.model = ?
       ORDER BY st.category, st.display_name`,
      [model]
    );
    
    // Transform into a grouped structure
    const result = {
      model,
      categories: {}
    };
    
    rows.forEach(row => {
      if (!result.categories[row.category]) {
        result.categories[row.category] = [];
      }
      
      result.categories[row.category].push({
        name: row.spec_name,
        display_name: row.display_name,
        value: row.value,
        unit: row.unit
      });
    });
    
    return result;
  }

  static async getEssentialSpecsByBrandAndModel(brand, model) {
    const [rows] = await pool.query(
      `SELECT bs.id, bs.brand, bs.model, st.name as spec_name, 
              st.display_name, bs.value, st.unit, st.category
       FROM bike_specifications bs
       JOIN specification_types st ON bs.spec_type_id = st.id
       WHERE bs.brand = ? AND bs.model = ? AND st.is_essential = TRUE
       ORDER BY st.category, st.display_name`,
      [brand, model]
    );
    
    return rows;
  }

  static async saveSpecification(data) {
    const {model, spec_name, value } = data;
    
    // Get spec_type_id from name
    const [specTypes] = await pool.query(
      'SELECT id FROM specification_types WHERE name = ?',
      [spec_name]
    );
    
    if (specTypes.length === 0) {
      throw new Error(`Specification type ${spec_name} does not exist`);
    }
    
    const spec_type_id = specTypes[0].id;
    
    // Check if this specification already exists for this brand/model
    const [existing] = await pool.query(
      'SELECT id FROM bike_specifications WHERE model = ? AND spec_type_id = ?',
      [ model, spec_type_id]
    );
    
    if (existing.length > 0) {
      // Update existing specification
      await pool.query(
        'UPDATE bike_specifications SET value = ? WHERE id = ?',
        [value, existing[0].id]
      );
      return existing[0].id;
    } else {
      // Create new specification
      const [result] = await pool.query(
        'INSERT INTO bike_specifications (model, spec_type_id, value) VALUES ( ?, ?, ?)',
        [ model, spec_type_id, value]
      );
      return result.insertId;
    }
  }

  static async bulkSaveSpecifications(brand, model, specifications) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      for (const spec of specifications) {
        // Get spec_type_id from name
        const [specTypes] = await connection.query(
          'SELECT id FROM specification_types WHERE name = ?',
          [spec.spec_name]
        );
        
        if (specTypes.length === 0) {
          throw new Error(`Specification type ${spec.spec_name} does not exist`);
        }
        
        const spec_type_id = specTypes[0].id;
        
        // Insert or update specification
        await connection.query(
          `INSERT INTO bike_specifications (brand, model, spec_type_id, value)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE value = VALUES(value)`,
          [brand, model, spec_type_id, spec.value]
        );
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async importFromExcel(data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      let importCount = 0;
      
      for (const item of data) {
        const { brand, model, specifications } = item;
        
        for (const [specName, value] of Object.entries(specifications)) {
          // Skip empty values
          if (value === null || value === undefined || value === '') {
            continue;
          }
          
          // Get spec_type_id from name
          const [specTypes] = await connection.query(
            'SELECT id FROM specification_types WHERE name = ?',
            [specName]
          );
          
          if (specTypes.length === 0) {
            console.warn(`Specification type ${specName} does not exist, skipping...`);
            continue;
          }
          
          const spec_type_id = specTypes[0].id;
          
          // Insert or update specification
          await connection.query(
            `INSERT INTO bike_specifications (brand, model, spec_type_id, value)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE value = VALUES(value)`,
            [brand, model, spec_type_id, value]
          );
          
          importCount++;
        }
      }
      
      await connection.commit();
      return { count: importCount };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async deleteSpecification(id) {
    await pool.query('DELETE FROM bike_specifications WHERE id = ?', [id]);
    return true;
  }
}

module.exports = BikeSpecificationModel;