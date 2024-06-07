import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { pgCron } from './helpers/pgCron';

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
app.get(
  '/appointments/:clientId',
  (req: Request, res: Response, next: NextFunction) => {},
);

// Client retrieves available provider slots
app.get(
  '/providers/:providerId/appointments',
  (req: Request, res: Response, next: NextFunction) => {},
);

// Submit provider appointments in 15-minute intervals
app.post(
  '/providers/:providerId/appointments',
  (req: Request, res: Response, next: NextFunction) => {},
);

// Viewing a specific appointment which will lock it in database (technically not idempotent)
app.get(
  '/clients/:clientId/appointments/:appointmentId',
  (req: Request, res: Response, next: NextFunction) => {},
);

// Reserve appointment after viewing
app.patch(
  '/clients/:clientId/appointments/:appointmentId',
  (req: Request, res: Response, next: NextFunction) => {},
);

app.listen(8000, () => {
  console.log(`server running on port ${process.env.PORT}`);
});
