const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');
const { auth } = require('../middleware/auth');

router.use(auth());

router.get('/', AppointmentController.getAllAppointments);
router.post('/', AppointmentController.createAppointment);

router.get('/queue', AppointmentController.getPriorityQueue);
router.post('/:id/convert', AppointmentController.convertToJobsheet);

router.get('/:id', AppointmentController.getAppointmentById);
router.put('/:id', AppointmentController.updateAppointment);
router.delete('/:id', AppointmentController.deleteAppointment);

module.exports = router;