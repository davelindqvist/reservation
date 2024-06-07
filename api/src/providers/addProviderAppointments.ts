import { Pool } from 'pg';

export async function addProviderAppointments(
  client: Pool,
  providerId: number,
  date: string,
  startTime: string,
  endTime: string,
): Promise<void> {
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

  await client.query('BEGIN');

  try {
    for (const slot of timeSlots) {
      await client.query(
        `INSERT INTO appointments (status, provider_id, appointment_time, last_updated)
         VALUES ($1, $2, $3, NOW())`,
        ['available', providerId, slot],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
