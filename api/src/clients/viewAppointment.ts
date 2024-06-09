import { Pool } from 'pg';
import { Appointments } from '../types/appointments';

export async function viewAppointment(
  dbClient: Pool,
  clientId: number,
  appointmentId: number,
): Promise<Appointments[]> {
  try {
    await dbClient.query('BEGIN');
    const res = await dbClient.query(
      `UPDATE appointments SET status = 'locked', client_id = $1 WHERE id = $2 FOR UPDATE`,
      [clientId, appointmentId],
    );
    if (res.rowCount === 0) {
      throw Error;
    }
    await dbClient.query('COMMIT');
    return res.rows;
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw new Error('Appointment unavailable');
  }
}
