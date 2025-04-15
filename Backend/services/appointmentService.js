const AppointmentModel = require('../models/appointmentModel');
const CustomerService = require('./customerService');
const VehicleService = require('./vehicleService');
const UserService = require('./userService');
const JobsheetService = require('./jobsheetService');

class AppointmentService {
  static async getAllAppointments(filters = {}) {
    return await AppointmentModel.getAll(filters);
  }
  
  static async getAppointmentById(id) {
    const appointment = await AppointmentModel.getById(id);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    return appointment;
  }
  
  static async createAppointment(appointmentData, userId) {
    // Validar disponibilidad
    const isAvailable = await AppointmentModel.checkAvailability(
      appointmentData.scheduled_date,
      appointmentData.scheduled_time,
      appointmentData.duration || 60,
      appointmentData.assigned_to
    );
    
    if (!isAvailable) {
      throw new Error('El horario seleccionado no está disponible');
    }
    
    // Validar cliente
    const customer = await CustomerService.getCustomerById(appointmentData.customer_id);
    if (!customer) {
      throw new Error('Cliente no encontrado');
    }
    
    // Validar vehículo
    const vehicle = await VehicleService.getVehicleById(appointmentData.vehicle_id);
    if (!vehicle) {
      throw new Error('Vehículo no encontrado');
    }
    
    // Agregar usuario que crea
    appointmentData.created_by = userId;
    
    return await AppointmentModel.create(appointmentData);
  }
  
  static async updateAppointment(id, appointmentData) {
    // Verificar que el turno existe
    const currentAppointment = await AppointmentModel.getById(id);
    if (!currentAppointment) {
      throw new Error('Turno no encontrado');
    }
    
    // Comprobar disponibilidad si se cambia fecha/hora
    if (
      (appointmentData.scheduled_date && appointmentData.scheduled_date !== currentAppointment.scheduled_date) ||
      (appointmentData.scheduled_time && appointmentData.scheduled_time !== currentAppointment.scheduled_time)
    ) {
      const isAvailable = await AppointmentModel.checkAvailability(
        appointmentData.scheduled_date || currentAppointment.scheduled_date,
        appointmentData.scheduled_time || currentAppointment.scheduled_time,
        appointmentData.duration || currentAppointment.duration,
        appointmentData.assigned_to || currentAppointment.assigned_to,
        id // Excluir el turno actual de la verificación
      );
      
      if (!isAvailable) {
        throw new Error('El nuevo horario no está disponible');
      }
    }
    
    return await AppointmentModel.update(id, appointmentData);
  }
  
  static async deleteAppointment(id) {
    const appointment = await AppointmentModel.getById(id);
    if (!appointment) {
      throw new Error('Turno no encontrado');
    }
    
    // No permitir eliminar turnos ya completados o convertidos
    if (['completed', 'in_progress'].includes(appointment.status)) {
      throw new Error('No se puede eliminar un turno ya completado o en progreso');
    }
    
    return await AppointmentModel.delete(id);
  }
  
  static async convertToJobsheet(appointmentId, userId) {
    const appointment = await AppointmentModel.getById(appointmentId);
    if (!appointment) {
      throw new Error('Turno no encontrado');
    }
    
    if (appointment.jobsheet_id) {
      throw new Error('Este turno ya fue convertido a una orden de trabajo');
    }
    
    if (appointment.status === 'cancelled' || appointment.status === 'no_show') {
      throw new Error('No se puede crear una orden de trabajo para un turno cancelado');
    }
    
    const jobsheetId = await AppointmentModel.convertToJobsheet(appointmentId, userId);
    return await JobsheetService.getJobsheetById(jobsheetId);
  }
  
  static async getAppointmentsByDate(date) {
    return await AppointmentModel.getAll({ date });
  }
  
  static async getAppointmentsByMechanic(mechanicId) {
    return await AppointmentModel.getAll({ mechanic_id: mechanicId });
  }
  
  static async getAppointmentsByCustomer(customerId) {
    return await AppointmentModel.getAll({ customer_id: customerId });
  }
  
  static async getPriorityQueue(date) {
    // Obtener todos los turnos para la fecha
    const appointments = await AppointmentModel.getAll({ 
      date,
      status: 'scheduled' 
    });
    
    // Ordenar por prioridad y hora
    return appointments.sort((a, b) => {
      // Primero por prioridad (si está disponible)
      if (a.priority_id && b.priority_id) {
        return b.priority_id - a.priority_id; // Mayor prioridad primero
      } else if (a.priority_id) {
        return -1; // a tiene prioridad, va primero
      } else if (b.priority_id) {
        return 1; // b tiene prioridad, va primero
      }
      
      // Si no hay prioridad o son iguales, ordenar por hora
      return a.scheduled_time.localeCompare(b.scheduled_time);
    });
  }
}

module.exports = AppointmentService;