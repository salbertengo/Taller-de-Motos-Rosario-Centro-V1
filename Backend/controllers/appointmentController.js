const AppointmentService = require('../services/appointmentService');

class AppointmentController {
  static async getAllAppointments(req, res) {
    try {
      const { date, status, mechanic_id, customer_id } = req.query;
      const filters = { date, status, mechanic_id, customer_id };
      
      const appointments = await AppointmentService.getAllAppointments(filters);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  static async getAppointmentById(req, res) {
    try {
      const { id } = req.params;
      const appointment = await AppointmentService.getAppointmentById(id);
      res.json(appointment);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      
      if (error.message === 'Appointment not found') {
        return res.status(404).json({ error: 'Turno no encontrado' });
      }
      
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  static async createAppointment(req, res) {
    try {
      const appointmentData = req.body;
      const userId = req.user.id;
      
      // Validaciones básicas
      if (!appointmentData.customer_id || !appointmentData.vehicle_id) {
        return res.status(400).json({ error: 'Se requiere cliente y vehículo' });
      }
      
      if (!appointmentData.scheduled_date || !appointmentData.scheduled_time) {
        return res.status(400).json({ error: 'Se requiere fecha y hora' });
      }
      
      if (!appointmentData.service_type) {
        return res.status(400).json({ error: 'Se requiere tipo de servicio' });
      }
      
      const newAppointment = await AppointmentService.createAppointment(appointmentData, userId);
      res.status(201).json(newAppointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      
      if (error.message.includes('no está disponible')) {
        return res.status(400).json({ error: error.message });
      }
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  static async updateAppointment(req, res) {
    try {
      const { id } = req.params;
      const appointmentData = req.body;
      
      await AppointmentService.updateAppointment(id, appointmentData);
      res.json({ message: 'Turno actualizado exitosamente' });
    } catch (error) {
      console.error('Error updating appointment:', error);
      
      if (error.message.includes('no está disponible')) {
        return res.status(400).json({ error: error.message });
      }
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  static async deleteAppointment(req, res) {
    try {
      const { id } = req.params;
      await AppointmentService.deleteAppointment(id);
      res.json({ message: 'Turno eliminado exitosamente' });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message.includes('No se puede eliminar')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  static async convertToJobsheet(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const jobsheet = await AppointmentService.convertToJobsheet(id, userId);
      res.json({
        message: 'Turno convertido a orden de trabajo',
        jobsheet
      });
    } catch (error) {
      console.error('Error converting appointment to jobsheet:', error);
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message.includes('ya fue convertido') || 
          error.message.includes('No se puede crear')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  static async getPriorityQueue(req, res) {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ error: 'Se requiere fecha' });
      }
      
      const queue = await AppointmentService.getPriorityQueue(date);
      res.json(queue);
    } catch (error) {
      console.error('Error fetching priority queue:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = AppointmentController;