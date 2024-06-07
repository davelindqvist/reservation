# Reservations API 

Submitted by: Dave Lindqvist

## Database Schema

![Reservation database schema](assets/schema.png)

## Requirements
To run this repository, you will need [Docker Desktop](https://docs.docker.com/compose/install/):

Docker and Docker Compose: Ensure Docker is installed on your system. The repository has been tested with Docker version 26.1.1 and above, and Docker Compose version 2.27.0-desktop.2 and above. 

Operating System: The setup creating this repo was with a  macOS (Sonoma 14.5)

## Objective

- Allow providers to submit times of availability
- Allow clients to retrieve list of available 15-min appointment slots
- Allow clients to reserve an available appointment slot
- Allow clients to confirm reservation
- Reservations expire after 30 minutes if not confirmed
- Reservations must be made at least 24 hours in advance

## Instructions for setup
WIP -- There's a bug I still need to fix between Jest and Express's listening port. Will come back to this ASAP.

API Port = 8000

## Notes

My largest focus (yet unintentional) on this submission was creating an environment where the reviewer could easily run this on their machine. It wasn't until the latter half of this project where I was able to get the backend logic working. 

While there are some tests within the `api` folder, you will also see a sub-directory of an integration folder. There are currently only unit tests around the endpoints. I hoped to have done integration tests too to view the affects of the backend functions to the database. Additionally, there was a problem in asserting one of the `pool.query` calls between lines 38-42 in `./api/tests/addProviderAppointments.test.ts`, and left it commented for now.

I used postgres for a few reasons. The first being that this is a database the reviewer is already familiar with. The second being that postgres can do [_a lot_](https://www.amazingcto.com/postgres-for-everything/) of things, and noticed I could have a CRON job within postgres, which I was able to successfully implement. Of course, it didn't come without some headaches on how to get it all working. You will notice how I have a helper function called `pgCron`in `./api/src/helpers/pgCron.ts` to help continue initializing the database.

The one limitiation I found with PG_Cron is its granularity. The lowest unit of time is scheduled at the minute level. As a consequence, the requirement around reservations expiring may exceed past 59 seconds. In the grand scheme of things, the difference of 30 minutes to 30 minutes and 59 seconds isn't a big deal consider. (You will notice in init.sql that the interval is `1 minutes` instead of `30 minutes`. This is for the sake of manually testing instead of waiting `30 minutes`.)

Below is a screenshot of what you may see while testing this app

![](assets/cronjob.png)

The `.env` are purposefully exposed to help set everything up, when in reality, it should be hidden or uplodaded somewhere safer. The duplication of the `.env` in the root directory and within the `/api` is also on purpose, since the Dockerfile/Docker-Compose file had issues finding it. I'm sure there's a way to only have one `.env` but I didn't want to lose time on solving this.

I decided to go in the route of database seeding as I found it easier to have it within this Docker setup, under `./database/init.sql`. 

I have PG Admin for the reviewers convenience. I thought this was going to help me along the way, but, in hindsight, I barely used it and felt more inclined to use the command line terminal to access postgres instead.

I considered working with a dependency that would help convert timezones in the case that a provider and client are in different timezones. Once I started working with the backend, I felt it wasn't a big priority for this assessment. However, it would be if this was for production.

## Stretch Goals
- `Redis` &rarr; Distributed lock with TTL (Time To Live) without using postgres/pg_cron
  - Scenario where appointment slot is being looked at. Locks unique identifier of appointment slot with a predefined TTL. If client completes the booking, then database is updated to "booked" and lock is released upon TTL. If TTL expires without booking, Redis releases lock and the appointment slot becomes available once again.
- Authentication / Authorization
  - I _really_ wanted to implement this where it incorporates some `hasura` headers, but couldn't squeeze it in within the time limit.

### PG Admin Instructions
1. Once you see `pgadmin4_container` running successfully, head to [localhost:5050](http://localhost:5050)
2. Login with
    - EMAIL: admin@admin.com
    - PGADMIN_DEFAULT_PASSWORD: admin
3. Click `Add New Server`
4. Enter 
    - Any `name`
    - Host name/address = `db`
    - Username = `postgres`
    - Password = `password`
5. You'll then find the tables through `Database > reservations > Tables` as seen below

![PG Admin](assets/pgadmin.png)


References:
1. [Docker, Postgres, Node, Typescript Setup](https://dev.to/chandrapantachhetri/docker-postgres-node-typescript-setup-47db)
2. [PG_Cron in Docker](https://eduanbekker.com/post/pg-partman/)