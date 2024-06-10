import { Pool } from 'pg';
import { reserveAppointment } from '../src/clients/reserveAppointment';
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const pool = new Pool();

describe('reserveAppointment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await pool.end();
  });

  test('throws error when appointment slot is not available', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({}) // For BEGIN query
      .mockResolvedValueOnce({ rowCount: 0 }) // For SELECT query
      .mockResolvedValueOnce({}); // For ROLLBACK

    await expect(reserveAppointment(pool, 1, 1)).rejects.toThrow(
      'Failed to reserve appointment',
    );
    expect(pool.query).toHaveBeenCalledWith('BEGIN');
    expect(pool.query).toHaveBeenCalledWith(
      `SELECT * FROM appointments WHERE id = $1 AND status = 'locked' AND client_id = $2 AND appointment_time > NOW() + INTERVAL '24 hours' FOR UPDATE`,
      [1, 1],
    );
    expect(pool.query).toHaveBeenCalledWith('ROLLBACK');
  });

  test('throws error when failing to update appointment status', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({}) // For BEGIN query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] }) // For SELECT query
      .mockResolvedValueOnce({ rowCount: 0 }) // For UPDATE query
      .mockResolvedValueOnce({}); // For ROLLBACK

    await expect(reserveAppointment(pool, 1, 1)).rejects.toThrow(
      'Failed to reserve appointment',
    );
    expect(pool.query).toHaveBeenCalledWith('BEGIN');
    expect(pool.query).toHaveBeenCalledWith(
      `SELECT * FROM appointments WHERE id = $1 AND status = 'locked' AND client_id = $2 AND appointment_time > NOW() + INTERVAL '24 hours' FOR UPDATE`,
      [1, 1],
    );
    expect(pool.query).toHaveBeenCalledWith(
      `UPDATE appointments SET status = 'reserved' WHERE id = $1 AND status = 'locked' AND appointment_time > NOW() + INTERVAL '24 hours' RETURNING *`,
      [1],
    );
    expect(pool.query).toHaveBeenCalledWith('ROLLBACK');
  });

  test('commits transaction on success', async () => {
    const mockAppointment = [{ id: 1, status: 'reserved' }];

    (pool.query as jest.Mock)
      .mockResolvedValueOnce({}) // For BEGIN query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] }) // For SELECT query
      .mockResolvedValueOnce({ rowCount: 1, rows: mockAppointment }) // For UPDATE query
      .mockResolvedValueOnce({}); // For COMMIT

    const result = await reserveAppointment(pool, 1, 1);

    expect(result).toEqual(mockAppointment);
    expect(pool.query).toHaveBeenCalledWith('BEGIN');
    expect(pool.query).toHaveBeenCalledWith(
      `SELECT * FROM appointments WHERE id = $1 AND status = 'locked' AND client_id = $2 AND appointment_time > NOW() + INTERVAL '24 hours' FOR UPDATE`,
      [1, 1],
    );
    expect(pool.query).toHaveBeenCalledWith(
      `UPDATE appointments SET status = 'reserved' WHERE id = $1 AND status = 'locked' AND appointment_time > NOW() + INTERVAL '24 hours' RETURNING *`,
      [1],
    );
    expect(pool.query).toHaveBeenCalledWith('COMMIT');
  });
});
