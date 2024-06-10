import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { pgCron } from './helpers/pgCron';
import { addProviderAppointments } from './providers/addProviderAppointments';
import { reserveAppointment } from './clients/reserveAppointment';
import { confirmAppointment } from './clients/confirmAppointment';
import { retrieveAppointments } from './clients/retrieveAppointments';
import { viewAppointment } from './clients/viewAppointment';
import errorHandler from './helpers/errorHandler';

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

async function connectToDB() {
  try {
    await pool.connect();
    await pgCron(pool);
  } catch (err) {
    console.log(err);
  }
}
connectToDB();

const app = express();
dotenv.config();

app.use(bodyParser.json());

// Confirms client of their reservation
app.get(
  '/api/v1/appointments/:clientId',
  async (req: Request, res: Response, next: NextFunction) => {
    const { clientId } = req.params;
    try {
      const result = await confirmAppointment(pool, parseInt(clientId));
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  },
);

// Client retrieves available provider slots
app.get(
  '/api/v1/providers/:providerId/appointments',
  async (req: Request, res: Response, next: NextFunction) => {
    const { providerId } = req.params;
    try {
      const result = await retrieveAppointments(pool, parseInt(providerId));
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  },
);

// Submit provider appointments in 15-minute intervals
app.post(
  '/api/v1/providers/:providerId/appointments',
  async (req: Request, res: Response) => {
    const { providerId, date, startTime, endTime } = req.body;
    try {
      const result = await addProviderAppointments(
        pool,
        providerId,
        date,
        startTime,
        endTime,
      );
      res.status(201).send({
        message: 'Availability slots submitted successfully',
        appointments: result,
      });
    } catch (error) {
      res.status(500).send('Error submitting availability');
    }
  },
);

// Views a specific appointment which will lock appointment record in database (not technically idempotent)
app.get(
  '/api/v1/clients/:clientId/appointments/:appointmentId',
  async (req: Request, res: Response, next: NextFunction) => {
    const { clientId, appointmentId } = req.params;
    try {
      const result = await viewAppointment(
        pool,
        parseInt(clientId),
        parseInt(appointmentId),
      );
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  },
);

// Reserves appointment after viewing
app.patch(
  '/api/v1/clients/:clientId/appointments/:appointmentId',
  async (req: Request, res: Response, next: NextFunction) => {
    const { clientId, appointmentId } = req.params;
    try {
      const result = await reserveAppointment(
        pool,
        parseInt(clientId),
        parseInt(appointmentId),
      );
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  },
);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(8000, () => {
    console.log(`server running on port ${process.env.PORT}`);
  });
}

export { app, Request, Response };
