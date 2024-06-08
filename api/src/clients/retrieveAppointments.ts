import { Pool } from 'pg';
import { Appointments } from '../types/appointments';

export async function retrieveAppointments(
  dbClient: Pool,
  providerId: number,
): Promise<Appointments[]> {
  try {
    await dbClient.query('BEGIN');
    const res = await dbClient.query(
      `SELECT * FROM appointments WHERE provider_id = $1 AND status = 'available' AND appointment_time > NOW() + INTERVAL '24 hours'`,
      [providerId],
    );
    if (res.rowCount === 0) {
      throw Error;
    }
    await dbClient.query('COMMIT');
    return res.rows;
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw new Error('No available appointments');
  }
}
