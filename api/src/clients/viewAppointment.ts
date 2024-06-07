import { Pool } from 'pg';

export async function viewAppointments(
  dbClient: Pool,
  clientId: number,
  appointmentId: number,
): Promise<void> {
  await dbClient.query('BEGIN');

  const res = await dbClient.query(
    `UPDATE appointments
          SET status = 'locked', client_id = $1
          WHERE id = $2
          FOR UPDATE`,
    [clientId, appointmentId],
  );

  if (res.rowCount === 0) {
    throw new Error('Unavailable to see appointment');
  }

  console.log('VIEW APPOINTMENTS RESULT ====> ', res);

  await dbClient.query('COMMIT');
  console.log('Appointments successfully viewed');
}
