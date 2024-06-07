import { Pool } from 'pg';

export async function retrieveAppointments(
  dbClient: Pool,
  providerId: number,
): Promise<void> {
  await dbClient.query('BEGIN');

  const res = await dbClient.query(
    `SELECT * FROM appointments
          WHERE provider_id = $1
            AND status = 'available' AND appointment_time > NOW() + INTERVAL '24 hours'
          FOR UPDATE`,
    [providerId],
  );

  if (res.rowCount === 0) {
    throw new Error('No available appointments');
  }

  console.log('RETRIEVE APPOINTMENTS RESULT ====> ', res);

  await dbClient.query('COMMIT');
  console.log('Appointments successfully retrieved');
}
