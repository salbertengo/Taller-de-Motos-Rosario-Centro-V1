const SpecificationTypeService = require('../services/specificationTypeService');
const BikeSpecificationService = require('../services/bikeSpecificationService');
const multer = require('multer');
const XLSX = require('xlsx');

// Configurar almacenamiento temporal para archivos Excel
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

class SpecificationsController {
  // Controladores para tipos de especificaciones
  static async getAllSpecTypes(req, res) {
    try {
      const specTypes = await SpecificationTypeService.getAllTypes();
      res.json(specTypes);
    } catch (error) {
      console.error('Error getting specification types:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async createSpecType(req, res) {
    try {
      const { name, display_name, unit, category, is_essential } = req.body;
      
      if (!name || !display_name || !category) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }
      
      const id = await SpecificationTypeService.createType({
        name,
        display_name,
        unit,
        category,
        is_essential
      });
      
      res.status(201).json({ id, message: 'Tipo de especificación creado' });
    } catch (error) {
      console.error('Error creating specification type:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async updateSpecType(req, res) {
    try {
      const id = req.params.id;
      const { display_name, unit, category, is_essential } = req.body;
      
      await SpecificationTypeService.updateType(id, {
        display_name,
        unit,
        category,
        is_essential
      });
      
      res.json({ message: 'Tipo de especificación actualizado' });
    } catch (error) {
      console.error('Error updating specification type:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async deleteSpecType(req, res) {
    try {
      const id = req.params.id;
      await SpecificationTypeService.deleteType(id);
      res.json({ message: 'Tipo de especificación eliminado' });
    } catch (error) {
      console.error('Error deleting specification type:', error);
      if (error.message.includes('Cannot delete')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Controladores para especificaciones de motos
  static async getBikeSpecifications(req, res) {
    try {
      const {model } = req.query;
      
      if (!model) {
        return res.status(400).json({ error: 'Marca y modelo son requeridos' });
      }
      
      const specs = await BikeSpecificationService.getSpecificationsByBrandAndModel(model);
      res.json(specs);
    } catch (error) {
      console.error('Error getting bike specifications:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getEssentialBikeSpecifications(req, res) {
    try {
      const { brand, model } = req.query;
      
      if (!brand || !model) {
        return res.status(400).json({ error: 'Marca y modelo son requeridos' });
      }
      
      const specs = await BikeSpecificationService.getEssentialSpecifications(brand, model);
      res.json(specs);
    } catch (error) {
      console.error('Error getting essential bike specifications:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async saveSpecification(req, res) {
    try {
      const {model, spec_name, value } = req.body;
      
      if (!model || !spec_name || value === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }
      
      const id = await BikeSpecificationService.saveSpecification({
        model,
        spec_name,
        value
      });
      
      res.status(201).json({ id, message: 'Especificación guardada' });
    } catch (error) {
      console.error('Error saving specification:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async bulkSaveSpecifications(req, res) {
    try {
      const { brand, model, specifications } = req.body;
      
      if (!brand || !model || !specifications || !Array.isArray(specifications)) {
        return res.status(400).json({ error: 'Datos inválidos para guardar especificaciones' });
      }
      
      await BikeSpecificationService.saveMultipleSpecifications(brand, model, specifications);
      res.json({ message: 'Especificaciones guardadas' });
    } catch (error) {
      console.error('Error saving specifications:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async importSpecifications(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
      }
      
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      const result = await BikeSpecificationService.importSpecificationsFromExcel(data);
      res.json({ message: `${result.count} especificaciones importadas` });
    } catch (error) {
      console.error('Error importing specifications:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

SpecificationsController.upload = upload.single('file');

module.exports = SpecificationsController;