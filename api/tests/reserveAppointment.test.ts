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

describe('reserveAppointment', () => {
  beforeEach(() => {
    (pool.query as jest.Mock).mockClear();
  });

  afterAll(async () => {
    await pool.end();
  });

  test('reserves an available appointment', async () => {
    const response = await request(app).patch('/clients/1/appointments/1');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Reservation booked');
    expect(pool.query).toHaveBeenCalledWith(`BEGIN`);
    expect(pool.query).toHaveBeenCalledWith(
      `SELECT * FROM appointments
          WHERE id = $1
            AND status = 'locked' 
            AND client_id = $2
            AND appointment_time > NOW() + INTERVAL '24 hours'
          FOR UPDATE`,
      [1, 1],
    );
    expect(pool.query).toHaveBeenCalledWith(
      `UPDATE appointments
          SET status = 'reserved'
          WHERE id = $1
            AND status = 'available'
            AND appointment_time > NOW() + INTERVAL '24 hours'`,
      [1],
    );
    expect(pool.query).toHaveBeenCalledWith(`COMMIT`);
  });

  test('throws an error when trying to reserve an already reserved appointment', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Test Error'));

    const response = await request(app).patch('/clients/1/appointments/1');

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error submitting reservation');
  });
  // Test could be improved here to show two error handling paths: a) locked, b) generic failure
});
