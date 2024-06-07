import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { bookAppointment } from './clients/bookAppointment';
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

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.send('Hello World');
});

app.post('/appointment', (req: Request, res: Response, next: NextFunction) => {
  res.send('Hello World');
  bookAppointment(pool, 1, 1);
});

app.listen(8000, () => {
  console.log(`server running on port ${process.env.PORT}`);
});
