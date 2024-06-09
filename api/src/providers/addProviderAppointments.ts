import { Pool } from 'pg';
import { Appointments } from '../types/appointments';

export async function addProviderAppointments(
  client: Pool,
  providerId: number,
  date: string,
  startTime: string,
  endTime: string,
): Promise<Appointments[]> {
  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(`${date}T${endTime}`);

  if (startDateTime >= endDateTime) {
    throw new Error('Start time must be before end time');
  }

  const timeSlots = [];
  for (
    let time = startDateTime;
    time < endDateTime;
    time.setMinutes(time.getMinutes() + 15)
  ) {
    timeSlots.push(new Date(time));
  }
  const lengthOfSlots = timeSlots.length;
  const statuses = Array(lengthOfSlots).fill('available');
  const providerIds = Array(lengthOfSlots).fill(providerId);
  const lastUpdated = Array(lengthOfSlots).fill(new Date());

  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO appointments (status, provider_id, appointment_time, last_updated) SELECT unnest($1::text[]), unnest($2::int[]), unnest($3::timestamp[]), unnest($4::timestamp[]) RETURNING *`,
      [statuses, providerIds, timeSlots, lastUpdated],
    );
    await client.query('COMMIT');
    return result.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
