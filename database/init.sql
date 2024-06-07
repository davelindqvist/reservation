CREATE TABLE "clients" (
  "id" integer PRIMARY KEY,
  "name" varchar NOT NULL
);

CREATE TABLE "providers" (
  "id" integer PRIMARY KEY,
  "name" varchar NOT NULL,
  "role" varchar NOT NULL
);

CREATE TABLE "appointments" (
  "id" integer PRIMARY KEY,
  "status" varchar,
  "created_at" timestamp NOT NULL,
  "provider_id" integer NOT NULL,
  "client_id" integer NOT NULL,
  CONSTRAINT status_check CHECK (status IN ('available', 'locked', 'reserved'))
);

CREATE TABLE "locks" (
  "appointment_id" integer NOT NULL,
  "created_at" timestamp NOT NULL,
  FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id")
);

ALTER TABLE "appointments" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id");
ALTER TABLE "appointments" ADD FOREIGN KEY ("provider_id") REFERENCES "providers" ("id");

-- Function to handle lock creation
CREATE OR REPLACE FUNCTION handle_lock_creation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'locked' AND OLD.status = 'available' THEN
        INSERT INTO locks (appointment_id, created_at)
        VALUES (NEW.id, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for handling lock creation
CREATE TRIGGER create_lock_record
AFTER UPDATE OF status ON appointments
FOR EACH ROW
EXECUTE FUNCTION handle_lock_creation();

-- Function to release locks after 30 minutes
CREATE OR REPLACE FUNCTION release_locks()
RETURNS void AS $$
BEGIN
    UPDATE appointments
    SET status = 'available'
    WHERE status = 'locked'
      AND id IN (
          SELECT appointment_id
          FROM locks
          WHERE created_at <= NOW() - INTERVAL '30 minutes'
      );
END;
$$ LANGUAGE plpgsql;


INSERT INTO clients (id, name) VALUES
(1, 'Alice Smith'),
(2, 'Bob Johnson'),
(3, 'Charlie Brown');

INSERT INTO providers (id, name, role) VALUES
(1, 'Dr. Emily Davis', 'Therapist'),
(2, 'Dr. Frank Miller', 'Psychiatrist'),
(3, 'Dr. Grace Lee', 'Counselor');

INSERT INTO appointments (id, status, created_at, provider_id, client_id) VALUES
(1, 'available', '2024-06-06 09:00:00', 1, 1),
(2, 'available', '2024-06-06 10:00:00', 2, 2),
(3, 'available', '2024-06-06 11:00:00', 3, 3);