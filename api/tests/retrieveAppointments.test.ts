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

  test('retrieves available appointments successfully', async () => {
    const mockAppointments = [
      {
        id: 1,
        provider_id: 1,
        status: 'available',
        appointment_time: '2024-06-07T15:00:00Z',
      },
      {
        id: 2,
        provider_id: 1,
        status: 'available',
        appointment_time: '2024-06-07T16:00:00Z',
      },
    ];

    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // For BEGIN
      .mockResolvedValueOnce({
        rows: mockAppointments,
        rowCount: mockAppointments.length,
      }) // For SELECT query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // For COMMIT

    const response = await request(app).get('/providers/1/appointments');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockAppointments);
    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(pool.query).toHaveBeenCalledWith(`BEGIN`);
    expect(pool.query).toHaveBeenCalledWith(
      `SELECT * FROM appointments WHERE provider_id = $1 AND status = 'available' AND appointment_time > NOW() + INTERVAL '24 hours'`,
      [1],
    );
    expect(pool.query).toHaveBeenCalledWith(`COMMIT`);
  });

  test('throws an error when failure to retrieve appointments', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // For BEGIN
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      }) // For SELECT query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // For ROLLBACK

    const response = await request(app).get('/providers/1/appointments');

    expect(pool.query).toHaveBeenCalledWith(`ROLLBACK`);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'No available appointments' });
  });
});
