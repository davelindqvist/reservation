import request from 'supertest';
import { app } from '../src/app';
import { Pool } from 'pg';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn(),
      release: jest.fn(),
    }),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const pool = new Pool();

describe('retrieveAppointments', () => {
  beforeEach(() => {
    (pool.query as jest.Mock).mockClear();
  });

  afterAll(async () => {
    await pool.end();
  });

  test('retrieves available appointments', async () => {
    const response = await request(app).get('/providers/1/appointments');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Successfully retrieved');
    expect(pool.query).toHaveBeenCalledWith(`BEGIN`);
    expect(pool.query).toHaveBeenCalledWith(
      `SELECT * FROM appointments
          WHERE provider_id = $1
            AND status = 'available' AND appointment_time > NOW() + INTERVAL '24 hours'
          FOR UPDATE`,
      [1],
    );
    expect(pool.query).toHaveBeenCalledWith(`COMMIT`);
  });

  test('throws an error when failure to server', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Test Error'));

    const response = await request(app).get('/providers/1/appointments');

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error finding appointments');
  });
});
