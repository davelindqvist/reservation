import { Pool } from 'pg';

export async function confirmAppointment(
  dbClient: Pool,
  clientId: number,
): Promise<void> {
  await dbClient.query('BEGIN');

  const res = await dbClient.query(
    `SELECT * FROM appointments
            AND client_id = $1 
            AND status = 'reserved'
          FOR UPDATE`,
    [clientId],
  );

  if (res.rowCount === 0) {
    throw new Error('No confirmed appointment');
  }

  console.log('CONFIRMED APPOINTMENT RESULT =====> ', res);

  await dbClient.query('COMMIT');
  console.log('Appointment reserved successfully');
}
