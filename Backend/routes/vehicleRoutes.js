const express = require('express');
const VehicleController = require('../controllers/vehicleController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth());

// GET /vehicles
router.get('/', VehicleController.getAll);

// GET /vehicles/:id
router.get('/:id', VehicleController.getById);

// POST /vehicles
router.post('/', VehicleController.create);

// PUT /vehicles/:id
router.put('/:id', VehicleController.update);

// DELETE /vehicles/:id
router.delete('/:id', VehicleController.delete);

module.exports = router;