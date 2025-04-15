const express = require('express');
const router = express.Router();
const SpecificationsController = require('../controllers/specificationsController');
const { auth } = require('../middleware/auth');

// =======================================
// Rutas para tipos de especificaciones (requieren admin)
// =======================================

// Obtener todos los tipos de especificaciones
router.get('/types', 
  auth({ requiredRole: 'admin' }), 
  SpecificationsController.getAllSpecTypes
);

// Crear un nuevo tipo de especificación
router.post('/types', 
  auth({ requiredRole: 'admin' }), 
  SpecificationsController.createSpecType
);

// Actualizar un tipo de especificación existente
router.put('/types/:id', 
  auth({ requiredRole: 'admin' }), 
  SpecificationsController.updateSpecType
);

// Eliminar un tipo de especificación
router.delete('/types/:id', 
  auth({ requiredRole: 'admin' }), 
  SpecificationsController.deleteSpecType
);

// =======================================
// Rutas para especificaciones de motos
// =======================================

// Obtener especificaciones completas para una marca/modelo
router.get('/', 
  auth(), 
  SpecificationsController.getBikeSpecifications
);

// Obtener solo especificaciones esenciales para una marca/modelo
router.get('/essential', 
  auth(), 
  SpecificationsController.getEssentialBikeSpecifications
);

// Guardar una especificación individual
router.post('/', 
  auth({ requiredRole: 'admin' }), 
  SpecificationsController.saveSpecification
);

// Guardar múltiples especificaciones a la vez
router.post('/bulk', 
  auth({ requiredRole: 'admin' }), 
  SpecificationsController.bulkSaveSpecifications
);

// Importar especificaciones desde un archivo Excel
router.post('/import', 
  auth({ requiredRole: 'admin' }),
  SpecificationsController.upload,  // Middleware para manejar la carga del archivo
  SpecificationsController.importSpecifications
);

module.exports = router;