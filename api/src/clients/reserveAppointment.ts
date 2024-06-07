import { Pool } from 'pg';

export async function reserveAppointment(
  dbClient: Pool,
  clientId: number,
  appointmentId: number,
): Promise<void> {
  await dbClient.query('BEGIN');

  const res = await dbClient.query(
    `SELECT * FROM appointments
          WHERE id = $1
            AND status = 'locked' 
            AND client_id = $2
            AND appointment_time > NOW() + INTERVAL '24 hours'
          FOR UPDATE`,
    [appointmentId, clientId],
  );

  if (res.rowCount === 0) {
    throw new Error('Appointment slot is not available');
  }

  const updateRes = await dbClient.query(
    `UPDATE appointments
          SET status = 'reserved'
          WHERE id = $1
            AND status = 'available'
            AND appointment_time > NOW() + INTERVAL '24 hours'`,
    [appointmentId],
  );

  if (updateRes.rowCount === 0) {
    throw new Error('Failed to reserve the appointment');
  }

  await dbClient.query('COMMIT');
  console.log('Appointment reserved successfully');
}
