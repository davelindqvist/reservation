import { Pool } from 'pg';
import { Appointments } from '../types/appointments';

export async function reserveAppointment(
  dbClient: Pool,
  clientId: number,
  appointmentId: number,
): Promise<Appointments[]> {
  try {
    await dbClient.query('BEGIN');
    const res = await dbClient.query(
      `SELECT * FROM appointments WHERE id = $1 AND status = 'locked' AND client_id = $2 AND appointment_time > NOW() + INTERVAL '24 hours' FOR UPDATE`,
      [appointmentId, clientId],
    );
    if (res.rowCount === 0) {
      throw new Error('Appointment slot is not available');
    }
    const updateRes = await dbClient.query(
      `UPDATE appointments SET status = 'reserved' WHERE id = $1 AND status = 'locked' AND appointment_time > NOW() + INTERVAL '24 hours' RETURNING *`,
      [appointmentId],
    );
    if (updateRes.rowCount === 0) {
      throw Error;
    }
    await dbClient.query('COMMIT');
    return updateRes.rows;
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw new Error('Failed to reserve appointment');
  }
}
