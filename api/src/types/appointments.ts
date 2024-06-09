export type Appointments = {
  id: number;
  status: 'locked' | 'reserved' | 'available';
  client_id: number | null;
  provider_id: number;
  appointment_time: Date | string;
  last_updated: Date | string;
};
