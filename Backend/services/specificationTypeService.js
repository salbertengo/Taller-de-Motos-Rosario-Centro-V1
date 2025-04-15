// services/specificationTypeService.js
const SpecificationTypeModel = require('../models/specificationTypeModel');

class SpecificationTypeService {
  static async getAllTypes() {
    return await SpecificationTypeModel.getAll();
  }

  static async getTypeById(id) {
    return await SpecificationTypeModel.getById(id);
  }

  static async getEssentialTypes() {
    return await SpecificationTypeModel.getEssentialTypes();
  }

  static async createType(data) {
    // Normalizar el nombre (lowercase y reemplazar espacios con guiones bajos)
    const normalizedData = {
      ...data,
      name: data.name.toLowerCase().replace(/\s+/g, '_')
    };
    
    return await SpecificationTypeModel.create(normalizedData);
  }

  static async updateType(id, data) {
    return await SpecificationTypeModel.update(id, data);
  }

  static async deleteType(id) {
    return await SpecificationTypeModel.delete(id);
  }
}

module.exports = SpecificationTypeService;