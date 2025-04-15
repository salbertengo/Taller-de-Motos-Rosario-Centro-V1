const pool = require('../db');

class AppointmentModel {
  static async getAll(filters = {}) {
    let query = `
    SELECT a.*, c.name as customer_name, 
           v.model as vehicle_model, v.plate as license_plate,
           u.name as mechanic_name
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN vehicles v ON a.vehicle_id = v.id
    LEFT JOIN users u ON a.assigned_to = u.id
    WHERE 1=1
`;
    
    const params = [];
    
    if (filters.status) {
      query += ' AND a.status = ?';
      params.push(filters.status);
    }
    
    if (filters.date) {
      query += ' AND DATE(a.scheduled_date) = ?';
      params.push(filters.date);
    }
    
    if (filters.mechanic_id) {
      query += ' AND a.assigned_to = ?';
      params.push(filters.mechanic_id);
    }
    
    if (filters.customer_id) {
      query += ' AND a.customer_id = ?';
      params.push(filters.customer_id);
    }
    
    query += ' ORDER BY a.scheduled_date, a.scheduled_time ASC';
    
    const [rows] = await pool.query(query, params);
    return rows;
  }
  
  static async getById(id) {
    const [rows] = await pool.query(`
      SELECT a.*, 
             c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
             v.model as vehicle_model, v.plate as license_plate,
             u.name as mechanic_name
      FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE a.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    // Obtener factores de prioridad
    const [factors] = await pool.query(
      'SELECT factor_code FROM appointment_factors WHERE appointment_id = ?',
      [id]
    );
    
    const appointment = rows[0];
    appointment.priority_factors = factors.map(f => f.factor_code);
    
    return appointment;
  }
  
  static async create(data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const {
        customer_id,
        vehicle_id,
        scheduled_date,
        scheduled_time,
        duration,
        service_type,
        description,
        status,
        priority_id,
        assigned_to,
        notes,
        created_by,
        priority_factors = []
      } = data;
      
      // Insertar cita
      const [result] = await connection.query(`
        INSERT INTO appointments (
          customer_id, vehicle_id, scheduled_date, scheduled_time,
          duration, service_type, description, status,
          priority_id, assigned_to, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        customer_id, vehicle_id, scheduled_date, scheduled_time,
        duration || 60, service_type, description, status || 'scheduled',
        priority_id, assigned_to, notes, created_by
      ]);
      
      const appointmentId = result.insertId;
      
      // Guardar factores de prioridad
      if (priority_factors && priority_factors.length > 0) {
        const factorValues = priority_factors.map(factor => [appointmentId, factor]);
        await connection.query(`
          INSERT INTO appointment_factors (appointment_id, factor_code)
          VALUES ?
        `, [factorValues]);
      }
      
      await connection.commit();
      return { id: appointmentId, ...data };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  static async update(id, data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const allowedFields = [
        'customer_id', 'vehicle_id', 'scheduled_date', 'scheduled_time',
        'duration', 'service_type', 'description', 'status', 
        'priority_id', 'assigned_to', 'notes'
      ];
      
      // Construir consulta de actualización
      const fields = [];
      const values = [];
      
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      }
      
      if (fields.length === 0) {
        return false;
      }
      
      values.push(id);
      
      await connection.query(
        `UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      // Actualizar factores de prioridad
      if (data.priority_factors !== undefined) {
        // Eliminar factores actuales
        await connection.query(
          'DELETE FROM appointment_factors WHERE appointment_id = ?',
          [id]
        );
        
        // Insertar nuevos factores
        if (data.priority_factors && data.priority_factors.length > 0) {
          const factorValues = data.priority_factors.map(factor => [id, factor]);
          await connection.query(`
            INSERT INTO appointment_factors (appointment_id, factor_code)
            VALUES ?
          `, [factorValues]);
        }
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
  
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Eliminar factores
      await connection.query(
        'DELETE FROM appointment_factors WHERE appointment_id = ?',
        [id]
      );
      
      // Eliminar cita
      const [result] = await connection.query(
        'DELETE FROM appointments WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  static async checkAvailability(date, time, duration = 60, mechanicId = null, excludeAppointmentId = null) {
    let query = `
      SELECT COUNT(*) as count
      FROM appointments
      WHERE scheduled_date = ?
      AND (
        (scheduled_time <= ? AND ADDTIME(scheduled_time, SEC_TO_TIME(duration * 60)) > ?) OR
        (scheduled_time >= ? AND scheduled_time < ADDTIME(?, SEC_TO_TIME(? * 60)))
      )
      AND status NOT IN ('cancelled', 'completed', 'no_show')
    `;
    
    const params = [date, time, time, time, time, duration];
    
    if (mechanicId) {
      query += ' AND assigned_to = ?';
      params.push(mechanicId);
    }
    
    if (excludeAppointmentId) {
      query += ' AND id != ?';
      params.push(excludeAppointmentId);
    }
    
    const [rows] = await pool.query(query, params);
    return rows[0].count === 0; // Verdadero si el horario está disponible
  }
  
  static async convertToJobsheet(appointmentId, userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Obtener datos del turno
      const [appointment] = await connection.query(
        'SELECT * FROM appointments WHERE id = ?',
        [appointmentId]
      );
      
      if (!appointment[0]) {
        throw new Error('Turno no encontrado');
      }
      
      const {
        customer_id,
        vehicle_id,
      } = appointment[0];
      
      // Crear jobsheet con el esquema correcto
      const [jobsheetResult] = await connection.query(`
        INSERT INTO jobsheets (
          customer_id, vehicle_id, state, user_id, created_at
        ) VALUES (?, ?, 'pending', ?, NOW())
      `, [
        customer_id, 
        vehicle_id,
        userId
      ]);
      
      const jobsheetId = jobsheetResult.insertId;
      
      // Actualizar estado del turno
      await connection.query(`
        UPDATE appointments 
        SET status = 'completed', jobsheet_id = ? 
        WHERE id = ?
      `, [jobsheetId, appointmentId]);
      
      await connection.commit();
      return jobsheetId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = AppointmentModel;