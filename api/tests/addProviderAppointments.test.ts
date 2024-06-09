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

describe('POST /providers/:providerId/appointments', () => {
  beforeEach(() => {
    (pool.query as jest.Mock).mockClear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-08-13T06:30:00Z')); // Set a fixed date
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should add provider availability', async () => {
    const mockAppointments: Appointments[] = [
      {
        id: 1,
        status: 'available',
        client_id: null,
        provider_id: 1,
        appointment_time: '2024-08-13T08:00:00Z',
        last_updated: '2024-08-13T06:30:00Z',
      },
      {
        id: 2,
        status: 'available',
        client_id: null,
        provider_id: 1,
        appointment_time: '2024-08-13T08:15:00Z',
        last_updated: '2024-08-13T06:30:00Z',
      },
    ];

    const statuses = ['available', 'available'];
    const providerIds = [1, 1];
    const appointmentTimes = [
      new Date('2024-08-13T08:00:00Z'),
      new Date('2024-08-13T08:15:00Z'),
    ];
    const lastUpdated = [
      new Date('2024-08-13T06:30:00Z'),
      new Date('2024-08-13T06:30:00Z'),
    ];

    (pool.query as jest.Mock)
      .mockResolvedValueOnce({}) // For BEGIN query
      .mockResolvedValueOnce({ rowCount: 2, rows: mockAppointments }) // For INSERT query
      .mockResolvedValueOnce({}); // For COMMIT query

    const response = await request(app).post('/providers/1/appointments').send({
      providerId: 1,
      date: '2024-08-13',
      startTime: '08:00:00',
      endTime: '08:30:00',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Availability slots submitted successfully',
        appointments: mockAppointments,
      }),
    );

    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(pool.query).toHaveBeenCalledWith('BEGIN');
    expect(pool.query).toHaveBeenCalledWith(
      `INSERT INTO appointments (status, provider_id, appointment_time, last_updated) SELECT unnest($1::text[]), unnest($2::int[]), unnest($3::timestamp[]), unnest($4::timestamp[]) RETURNING *`,
      [statuses, providerIds, appointmentTimes, lastUpdated],
    );
    expect(pool.query).toHaveBeenCalledWith('COMMIT');
  });

  it('should return 500 if an error occurs', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(
      new Error('Error submitting availability'),
    );

    const response = await request(app).post('/providers/1/appointments').send({
      providerId: 1,
      date: '2024-08-13',
      startTime: '08:00:00',
      endTime: '15:00:00',
    });

    expect(response.status).toBe(500);
    expect(pool.query).toHaveBeenCalledWith('ROLLBACK');
    expect(response.text).toBe('Error submitting availability');
  });
});
