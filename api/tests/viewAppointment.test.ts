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

describe('viewAppointment', () => {
  beforeEach(() => {
    (pool.query as jest.Mock).mockClear();
  });

  afterAll(async () => {
    await pool.end();
  });

  test('retrieves available appointments', async () => {
    const mockAppointments = [
      {
        appointment_time: '2024-06-07T15:00:00Z',
        client_id: 1,
        id: 1,
        provider_id: 1,
        status: 'locked',
      },
    ];

    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // For BEGIN
      .mockResolvedValueOnce({
        rows: mockAppointments,
        rowCount: mockAppointments.length,
      }) // For SELECT query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // For COMMIT

    const response = await request(app).get('/api/v1/clients/1/appointments/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockAppointments);
    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(pool.query).toHaveBeenCalledWith(`BEGIN`);
    expect(pool.query).toHaveBeenCalledWith(
      `UPDATE appointments SET status = 'locked', client_id = $1 WHERE id = $2`,
      [1, 1],
    );
    expect(pool.query).toHaveBeenCalledWith(`COMMIT`);
  });

  test('throws an error when failure to server', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // For BEGIN
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      }) // For UPDATE query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // For ROLLBACK

    const response = await request(app).get('/api/v1/clients/1/appointments/1');

    expect(pool.query).toHaveBeenCalledWith(`ROLLBACK`);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Appointment unavailable' });
  });
});
