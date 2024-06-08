import { Pool } from 'pg';

export async function pgCron(client: Pool): Promise<void> {
  await client.query('BEGIN'); // Start transaction
  try {
    await client.query(`CREATE EXTENSION pg_cron;`);
    await client.query(`SELECT * FROM cron.job;`);
    await client.query(
      `SELECT cron.schedule('*/1 * * * *', 'SELECT release_locks();');`,
    );
    await client.query('COMMIT'); // Commit transaction
    console.log('CRON job successfully implemented to check every minute');
  } catch (err) {
    console.log('CRON job may already be implemented - check database');
  }
}
