import { Pool } from 'pg';
import { Appointments } from '../types/appointments';

export async function confirmAppointment(
  dbClient: Pool,
  clientId: number,
): Promise<Appointments[]> {
  try {
    await dbClient.query('BEGIN');
    const res = await dbClient.query(
      `SELECT * FROM appointments AND client_id = $1 AND status = 'reserved' FOR UPDATE`,
      [clientId],
    );
    if (res.rowCount === 0) {
      throw Error;
    }
    await dbClient.query('COMMIT');
    return res.rows;
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw new Error('No confirmed appointments');
  }
}
