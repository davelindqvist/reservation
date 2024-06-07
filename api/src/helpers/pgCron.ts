import { Pool } from 'pg';

export async function pgCron(client: Pool): Promise<void> {
  await client.query('BEGIN'); // Start transaction

  await client.query(`CREATE EXTENSION pg_cron;`);

  await client.query(
    `SELECT cron.schedule('*/1 * * * *', 'SELECT release_locks();');`,
  );

  await client.query('COMMIT'); // Commit transaction
  console.log('CRON job successfully implemented to check every minute');
}

// test for existing cron.job with a return result of 1 for SELECT * FROM cron.job;
