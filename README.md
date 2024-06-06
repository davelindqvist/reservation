Tables:
- Providers
  - id
  - name
- Clients
  - id
  - name
- Schedule
  - status: ['booked', 'available']
  - time

MVP:
- Allow providers to submit times of availability
- Allow clients to retrieve list of available 15-min appointment slots
- Allow clients to reserve an available appointment slot
- Allow clients to confirm reservation
- Reservations expire after 30 minutes if not confirmed
- Reservations must be made at least 24 hours in advance

Consideration:
- Time
  - https://www.npmjs.com/package/date-and-time
  - https://github.com/SpiritIT/timezonecomplete

Stretch goals:
- `Redis` &rarr; Distributed lock with TTL (Time To Live)
  - To avoid double booking
  - Scenario where appointment slot is being looked at. Locks unique identifier of appointment slot with a predefined TTL. If client completes the booking, then database is updated to "booked" and lock is released upon TTL. If TTL expires without booking, Redis releases lock and the appointment slot becomes available once again.
- Availability doesn't show up or is removed from the schedule after past the time and date.
- Authentication / Authorization

References:
1. [Setting up Docker + TS + Node (Hot Reloading)](https://dev.to/dariansampare/setting-up-docker-typescript-node-hot-reloading-code-changes-in-a-running-container-2b2f)