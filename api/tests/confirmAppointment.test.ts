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

describe('confirmAppointment', () => {
  beforeEach(() => {
    (pool.query as jest.Mock).mockClear();
  });

  afterAll(async () => {
    await pool.end();
  });

  test('confirms client has appointments', async () => {
    const response = await request(app).get('/appointments/1');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Client has .... appointments');
    expect(pool.query).toHaveBeenCalledWith(`BEGIN`);
    expect(pool.query).toHaveBeenCalledWith(
      `SELECT * FROM appointments
            AND client_id = $1 
            AND status = 'reserved'
          FOR UPDATE`,
      [1],
    );
    expect(pool.query).toHaveBeenCalledWith(`COMMIT`);
  });

  test('throws an error when failure to server', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Test Error'));

    const response = await request(app).get('/appointments/1');

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error finding appointments');
  });
});
