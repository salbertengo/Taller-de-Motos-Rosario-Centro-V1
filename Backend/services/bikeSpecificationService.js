const BikeSpecificationModel = require('../models/bikeSpecificationModel');

class BikeSpecificationService {
  static async getSpecificationsByBrandAndModel(model) {
    return await BikeSpecificationModel.getByBrandAndModel(model);
  }

  static async getEssentialSpecifications(brand, model) {
    return await BikeSpecificationModel.getEssentialSpecsByBrandAndModel(brand, model);
  }

  static async saveSpecification(data) {
    return await BikeSpecificationModel.saveSpecification(data);
  }

  static async saveMultipleSpecifications(brand, model, specifications) {
    return await BikeSpecificationModel.bulkSaveSpecifications(brand, model, specifications);
  }

  static async importSpecificationsFromExcel(data) {
    // Procesar datos de Excel al formato esperado por el modelo
    const processedData = data.map(row => {
      // Extraer brand y model
      const { Brand, Model, ...specs } = row;
      
      // Convertir resto de campos a un objeto de especificaciones
      const specifications = {};
      Object.entries(specs).forEach(([key, value]) => {
        // Normalizar nombres de claves
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
        specifications[normalizedKey] = value;
      });
      
      return {
        brand: Brand,
        model: Model,
        specifications
      };
    }).filter(item => item.brand && item.model); // Filtrar entradas sin marca o modelo
    
    return await BikeSpecificationModel.importFromExcel(processedData);
  }

  static async deleteSpecification(id) {
    return await BikeSpecificationModel.deleteSpecification(id);
  }
  
  // Método para obtener especificaciones comunes para múltiples modelos
  static async getCommonSpecifications(brand, models) {
    if (!Array.isArray(models) || models.length === 0) {
      throw new Error('Se requiere al menos un modelo para buscar especificaciones comunes');
    }
    
    // Este método podría implementarse en el modelo o aquí directamente
    // Por ahora, lo implementaremos aquí
    
    const allSpecs = await Promise.all(
      models.map(model => BikeSpecificationModel.getByBrandAndModel(brand, model))
    );
    
    // Encontrar categorías y especificaciones comunes
    const commonSpecs = {
      brand,
      models,
      categories: {}
    };
    
    // Solo procesamos si tenemos al menos un resultado
    if (allSpecs.length > 0) {
      const firstModelSpecs = allSpecs[0];
      
      // Recorrer categorías del primer modelo
      Object.entries(firstModelSpecs.categories).forEach(([category, specs]) => {
        // Para cada especificación en esta categoría
        specs.forEach(spec => {
          // Verificar si esta especificación existe en todos los modelos con el mismo valor
          const isCommon = allSpecs.every(modelSpecs => {
            if (!modelSpecs.categories[category]) return false;
            
            return modelSpecs.categories[category].some(s => 
              s.name === spec.name && s.value === spec.value
            );
          });
          
          if (isCommon) {
            // Agregar a las especificaciones comunes
            if (!commonSpecs.categories[category]) {
              commonSpecs.categories[category] = [];
            }
            
            commonSpecs.categories[category].push(spec);
          }
        });
      });
    }
    
    return commonSpecs;
  }
}

module.exports = BikeSpecificationService;