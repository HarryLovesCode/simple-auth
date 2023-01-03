# Simple-Auth

A reference application for how to implement authentication server-side. The plan is to integrate this into several applications by the end of 2023.

Theoretically, there should be no difference in the performance of `async` and `sync` endpoints, but under load, `async` performs significantly better.

## Features

- Extensive error handling across the board.
- Both synchronous and asynchronous calls depending on the use-case.
- Tiny DB to store users and their password hashes.
- JWT issuing and verification.
- `dotenv` for loading `SECRET` from file.
- Pino for multi-level logging.
- TypeScript for language support.
- `zod` for robust JSON validation.
- `bcrypt` for both async and sync hash validation.
- Configurable rate-limiting for the following endpoints:
  - `/signup`
  - `/signupSync`
  - `/login`
  - `/loginSync`
  - `/protected`
- Support for the following token formats:
  - Included in cookie
  - Included in JSON body
  - Bearer / no bearer string
  - Authorization header

## Todo

- Add user lookup, not just protected endpoint token verification.
- Configurable `saltRounds` parameter.
- Graceful auth server exit on `SIGINT` or `exit`.
- Configurable rate limiting parameterse in `.env`.
- Token expiration, again, configurable on `.env`.
- Token re-issuing upon expiration.

## Load Test Results 

Stable up to ~131,280+ requests per minute, 3823 concurrent users (when not using rate-limiting) and still maintain semi-reasonable response times below 76ms on *a single thread*. Median response time with that many users is 4ms.

```text
--------------------------------------
Metrics for period to: 15:36:20(-0500) (width: 9.999s)
--------------------------------------

http.codes.200: ................................................................ 18264
http.request_rate: ............................................................. 2188/sec
http.requests: ................................................................. 21838
http.response_time:
  min: ......................................................................... 0
  max: ......................................................................... 76
  median: ...................................................................... 4
  p95: ......................................................................... 55.2
  p99: ......................................................................... 68.7
http.responses: ................................................................ 18264
vusers.completed: .............................................................. 18264
vusers.created: ................................................................ 21837
vusers.created_by_name.Protected endpoint: ..................................... 21837
vusers.failed: ................................................................. 0
vusers.session_length:
  min: ......................................................................... 67.6
  max: ......................................................................... 3823
  median: ...................................................................... 487.9
  p95: ......................................................................... 1652.8
  p99: ......................................................................... 1790.4
```