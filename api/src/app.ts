import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { pgCron } from './helpers/pgCron';
import { addProviderAppointments } from './providers/addProviderAppointments';
import { reserveAppointment } from './clients/reserveAppointment';
import { confirmAppointment } from './clients/confirmAppointment';
import { retrieveAppointments } from './clients/retrieveAppointments';
import { viewAppointment } from './clients/viewAppointment';

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

const connectToDB = async () => {
  try {
    await pool.connect();
    await pgCron(pool);
  } catch (err) {
    console.log(err);
  }
};
connectToDB();

const app = express();
dotenv.config();

app.use(bodyParser.json());

// Confirms client of their reservation
app.get('/appointments/:clientId', async (req: Request, res: Response) => {
  const { clientId } = req.params;
  try {
    await confirmAppointment(pool, parseInt(clientId));
    res.status(200).send('Client has .... appointments');
  } catch (error) {
    res.status(500).send('Error finding appointments');
  }
});

// Client retrieves available provider slots
app.get(
  '/providers/:providerId/appointments',
  async (req: Request, res: Response) => {
    const { providerId } = req.params;
    try {
      await retrieveAppointments(pool, parseInt(providerId));
      res.status(200).send('Successfully retrieved');
    } catch (error) {
      res.status(500).send('Error finding appointments');
    }
  },
);

// Submit provider appointments in 15-minute intervals
app.post(
  '/providers/:providerId/appointments',
  async (req: Request, res: Response) => {
    const { providerId, date, startTime, endTime } = req.body;
    try {
      await addProviderAppointments(pool, providerId, date, startTime, endTime);
      res.status(201).send('Availability submitted successfully');
    } catch (error) {
      res.status(500).send('Error submitting availability');
    }
  },
);

// Viewing a specific appointment which will lock it in database (technically not idempotent)
app.get(
  '/clients/:clientId/appointments/:appointmentId',
  async (req: Request, res: Response) => {
    const { clientId, appointmentId } = req.params;
    try {
      await viewAppointment(pool, parseInt(clientId), parseInt(appointmentId));
      res.status(200).send('Successfully viewed');
    } catch (error) {
      res.status(500).send('Error viewing appointment');
    }
  },
);

// Reserve appointment after viewing
app.patch(
  '/clients/:clientId/appointments/:appointmentId',
  async (req: Request, res: Response) => {
    const { clientId, appointmentId } = req.params;
    try {
      await reserveAppointment(
        pool,
        parseInt(clientId),
        parseInt(appointmentId),
      );
      res.status(200).send('Reservation booked');
    } catch (error) {
      res.status(500).send('Error submitting reservation');
    }
  },
);
if (process.env.NODE_ENV !== 'test') {
  app.listen(8000, () => {
    console.log(`server running on port ${process.env.PORT}`);
  });
}

export { app, Request, Response };
