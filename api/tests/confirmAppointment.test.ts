import request from 'supertest';
import { app } from '../src/app';
import { Pool } from 'pg';
import { Appointments } from '../src/types/appointments';

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
    const mockAppointments: Appointments[] = [
      {
        appointment_time: '2024-06-07T15:00:00Z',
        client_id: 1,
        id: 1,
        provider_id: 1,
        status: 'reserved',
        last_updated: '2024-06-09T04:31:56.604Z',
      },
    ];

    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // For BEGIN
      .mockResolvedValueOnce({
        rows: mockAppointments,
        rowCount: mockAppointments.length,
      }) // For SELECT query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // For COMMIT

    const response = await request(app).get('/appointments/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockAppointments);
    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(pool.query).toHaveBeenCalledWith(`BEGIN`);
    expect(pool.query).toHaveBeenCalledWith(
      `SELECT * FROM appointments AND client_id = $1 AND status = 'reserved' FOR UPDATE`,
      [1],
    );
    expect(pool.query).toHaveBeenCalledWith(`COMMIT`);
  });

  test('throws an error when failure to server', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(
      new Error('No confirmed appointments'),
    );

    const response = await request(app).get('/appointments/1');

    expect(pool.query).toHaveBeenCalledWith(`ROLLBACK`);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'No confirmed appointments' });
  });
});
