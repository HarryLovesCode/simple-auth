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

Stable up to ~88,900+ users per minute (when not using rate-limiting).

```text
http.codes.200: ................................................................ 12249
http.request_rate: ............................................................. 1475/sec
http.requests: ................................................................. 14692
http.response_time:
  min: ......................................................................... 280
  max: ......................................................................... 1201
  median: ...................................................................... 671.9
  p95: ......................................................................... 982.6
  p99: ......................................................................... 1130.2
http.responses: ................................................................ 12249
vusers.completed: .............................................................. 12249
vusers.created: ................................................................ 14694
vusers.created_by_name.Protected endpoint: ..................................... 14694
vusers.failed: ................................................................. 0
vusers.session_length:
  min: ......................................................................... 281.2
  max: ......................................................................... 4342.1
  median: ...................................................................... 727.9
  p95: ......................................................................... 1939.5
  p99: ......................................................................... 4147.4
```