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

describe('POST /providers/:providerId/appointments', () => {
  beforeEach(() => {
    (pool.query as jest.Mock).mockClear();
  });

  it('should add provider availability', async () => {
    const response = await request(app)
      .post('/providers/:providerId/appointments')
      .send({
        providerId: 1,
        date: '2024-08-13',
        startTime: '08:00:00',
        endTime: '15:00:00',
      });

    expect(response.status).toBe(201);
    expect(response.text).toBe('Availability submitted successfully');
    expect(pool.query).toHaveBeenCalledTimes(30);
    expect(pool.query).toHaveBeenCalledWith(`BEGIN`);
    // expect(pool.query).toHaveBeenCalledWith(
    //   `INSERT INTO appointments (status, provider_id, appointment_time, last_updated)
    //          VALUES ($1, $2, $3, NOW())`,
    //   ['available', 1, expect.any(Date)],
    // );
    expect(pool.query).toHaveBeenCalledWith(`COMMIT`);
  });

  it('should return 500 if an error occurs', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Test Error'));

    const response = await request(app)
      .post('/providers/:providerId/appointments')
      .send({
        providerId: 1,
        date: '2024-08-13',
        startTime: '08:00:00',
        endTime: '15:00:00',
      });

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error submitting availability');
  });
});
