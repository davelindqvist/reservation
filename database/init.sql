CREATE TABLE "clients" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar NOT NULL
);

CREATE TABLE "providers" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar NOT NULL,
  "role" varchar NOT NULL
);

CREATE TABLE "appointments" (
  "id" SERIAL PRIMARY KEY,
  "status" varchar,
  "client_id" integer,
  "provider_id" integer NOT NULL,
  "appointment_time" timestamp NOT NULL,
  "last_updated" timestamp NOT NULL,
  CONSTRAINT status_check CHECK (status IN ('available', 'locked', 'reserved'))
);

CREATE TABLE "locks_history" (
  "appointment_id" integer NOT NULL,
  "client_id" integer NOT NULL,
  "created_at" timestamp NOT NULL,
  FOREIGN KEY ("client_id") REFERENCES "clients" ("id"),
  FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id")
);

ALTER TABLE "appointments" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id");
ALTER TABLE "appointments" ADD FOREIGN KEY ("provider_id") REFERENCES "providers" ("id");

-- Function to handle lock creation
CREATE OR REPLACE FUNCTION handle_lock_creation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'locked' AND OLD.status = 'available' THEN
        INSERT INTO locks_history (appointment_id, client_id, created_at)
        VALUES (NEW.id, NEW.client_id, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for handling lock creation
CREATE TRIGGER create_lock_record
AFTER UPDATE OF status ON appointments
FOR EACH ROW
EXECUTE FUNCTION handle_lock_creation();

-- Function to release locks after 1 minutes 
-- (FOR TESTING - should be 30 minutes in production)
CREATE OR REPLACE FUNCTION release_locks()
RETURNS void AS $$
BEGIN
    UPDATE appointments
    SET status = 'available', client_id = NULL
    WHERE status = 'locked' and last_updated <= NOW() - INTERVAL '1 minutes';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_last_updated_appointments()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = now();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_appointments_last_updated
    BEFORE UPDATE
    ON
        appointments
    FOR EACH ROW
EXECUTE PROCEDURE update_last_updated_appointments();

INSERT INTO clients (id, name) VALUES
(1, 'Alice Smith'),
(2, 'Bob Johnson'),
(3, 'Charlie Brown'),
(4, 'Kinsley Arthfael'),
(5, 'Radha Nilas'),
(6, 'Mandawuy Kristen'),
(7, 'James Reagan');

INSERT INTO providers (id, name, role) VALUES
(1, 'Dr. Emily Davis', 'Therapist'),
(2, 'Dr. Frank Miller', 'Psychiatrist'),
(3, 'Dr. Grace Lee', 'Counselor');

INSERT INTO appointments (id, status, appointment_time, last_updated, provider_id) VALUES
(1, 'available', '2024-06-06 09:00:00', '2024-06-06 08:00:00', 1),
(2, 'available', '2024-06-06 10:00:00', '2024-06-06 08:00:00', 2),
(3, 'available', '2024-06-06 11:00:00', '2024-06-06 08:00:00', 3),
(4, 'available', '2024-06-06 11:00:00', '2024-06-06 08:00:00', 1),
(5, 'available', '2024-06-06 11:00:00', '2024-06-06 08:00:00', 2),
(6, 'available', '2024-06-06 11:00:00', '2024-06-06 08:00:00', 3),
(7, 'available', '2024-06-06 11:00:00', '2024-06-06 08:00:00', 1);