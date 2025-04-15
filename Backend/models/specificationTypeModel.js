// models/specificationTypeModel.js
const pool = require('../db');

class SpecificationTypeModel {
  static async getAll() {
    const [rows] = await pool.query(
      'SELECT * FROM specification_types ORDER BY category, display_name'
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM specification_types WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async getEssentialTypes() {
    const [rows] = await pool.query(
      'SELECT * FROM specification_types WHERE is_essential = TRUE ORDER BY category, display_name'
    );
    return rows;
  }

  static async create(data) {
    const { name, display_name, unit, category, is_essential } = data;
    
    const [result] = await pool.query(
      'INSERT INTO specification_types (name, display_name, unit, category, is_essential) VALUES (?, ?, ?, ?, ?)',
      [name, display_name, unit, category, is_essential || false]
    );
    
    return result.insertId;
  }

  static async update(id, data) {
    const { display_name, unit, category, is_essential } = data;
    
    await pool.query(
      'UPDATE specification_types SET display_name = ?, unit = ?, category = ?, is_essential = ? WHERE id = ?',
      [display_name, unit, category, is_essential || false, id]
    );
    
    return true;
  }

  static async delete(id) {
    // First check if this spec type is used in any bike specifications
    const [checkRows] = await pool.query(
      'SELECT COUNT(*) as count FROM bike_specifications WHERE spec_type_id = ?',
      [id]
    );
    
    if (checkRows[0].count > 0) {
      throw new Error('Cannot delete: This specification type is in use');
    }
    
    await pool.query('DELETE FROM specification_types WHERE id = ?', [id]);
    return true;
  }
}

module.exports = SpecificationTypeModel;