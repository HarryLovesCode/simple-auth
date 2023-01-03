import pino from "pino";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import uWS, { App, HttpRequest, HttpResponse } from "uWebSockets.js";

import { sign, verify } from "jsonwebtoken";
import { config } from "dotenv";
import { SimpleUserDB } from "./database";
import { loginSchema, signupSchema } from "./schema";
import { z } from "zod";

config();

const app = App();
const logger = pino();
const db = new SimpleUserDB();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message:
    "Too many authentication requests from this IP, please try again after 15 minutes.",
  legacyHeaders: true,
});

const secret = process.env.SECRET || "secret";

async function verifyToken(req: HttpRequest, res: HttpResponse) {
  let _tokenInp = await readJson(res);
  let _token = _tokenInp.token;
  logger.debug(_token);

  if (_token) {
    _token = _token;
    if (!_token) throw new Error("Unauthorized.");
  }

  const token = _token;

  if (token) {
    const decoded = verify(token, secret);

    if (!decoded) throw new Error("Unauthorized.");

    return decoded;
  } else {
    throw new Error("Unauthorized.");
  }
}

function validateSchema(body: any, schema: z.ZodObject<any>) {
  try {
    schema.parse(body);
    return true;
  } catch (err: any) {
    return false;
  }
}

async function attemptUserStore(body: any) {
  try {
    await db.storeUser(body);
    return true;
  } catch (err: any) {
    return false;
  }
}

async function attemptUserGet(body: any) {
  try {
    await db.validateUser(body);
    return true;
  } catch (err) {
    return false;
  }
}

async function signup(req: HttpRequest, res: HttpResponse) {
  res.writeHeader("Content-Type", "application/json");
  const userInfo = await readJson(res);

  if (!validateSchema(userInfo, loginSchema)) {
    logger.error("Failed to validate schema.");
    res.writeStatus("400");
    res.write(JSON.stringify({ message: "Invalid schema." }));
    return res.end();
  }

  if (!(await attemptUserStore(userInfo))) {
    logger.error("Failed to get user.");
    res.writeStatus("400");
    res.write(JSON.stringify({ message: "Failed to store user." }));
    return res.end();
  }

  const { email } = userInfo;

  logger.debug(`Signup attempt for ${email}`);

  const signature = { user: email };

  sign(signature, secret, (err: Error | null, token?: string) => {
    if (err) {
      logger.error(err);
      res.writeStatus("500").send("Internal server error");
    }

    res.writeHeader(
      "Set-Cookie",
      "token=" + token + "; HttpOnly; Secure; SameSite=None"
    );

    res.write(JSON.stringify({ token }));
    return res.end();
  });
}

async function readJson(res: HttpResponse): Promise<any> {
  return new Promise((resolve, reject) => {
    let buffer: Buffer = Buffer.from("");

    res.onData((ab, isLast) => {
      let chunk = Buffer.from(ab).toString();

      if (isLast) {
        if (buffer) {
          try {
            let _tmpBuf = Buffer.from(buffer);
            let _tmpChunk = Buffer.from(chunk);

            resolve(JSON.parse(Buffer.concat([_tmpBuf, _tmpChunk]).toString()));
          } catch (_err: any) {
            res.close();
            reject();
          }
        } else {
          try {
            resolve(JSON.parse(chunk));
          } catch (_err: any) {
            res.close();
            reject();
          }
        }
      } else {
        if (buffer) {
          let _tmpChunk = Buffer.from(chunk);
          buffer = Buffer.concat([buffer, _tmpChunk]);
        } else {
          buffer = Buffer.from(chunk);
        }
      }
    });

    res.onAborted(reject);
  });
}

async function signin(req: HttpRequest, res: HttpResponse) {
  res.writeHeader("Content-Type", "application/json");
  const start = Date.now();
  const userInfo = await readJson(res);

  logger.debug(`Read json in ${Date.now() - start}ms`);

  console.log(userInfo);

  if (!validateSchema(userInfo, loginSchema)) {
    logger.error("Failed to validate schema.");
    res.writeStatus("400");
    res.write(JSON.stringify({ message: "Invalid schema." }));
    return res.end();
  }

  if (!(await attemptUserGet(userInfo))) {
    logger.error("Failed to get user.");
    res.writeStatus("400");
    res.write(JSON.stringify({ message: "Failed to get user." }));
    return res.end();
  }

  const { email } = userInfo;

  logger.debug(`Signin attempt for ${email}`);

  const signature = { user: email };

  sign(signature, secret, (err: Error | null, token?: string) => {
    if (err) {
      logger.error(err);
      res.writeStatus("500").send("Internal server error");
    }

    res.writeHeader(
      "Set-Cookie",
      "token=" + token + "; HttpOnly; Secure; SameSite=None"
    );

    res.write(JSON.stringify({ token }));
    return res.end();
  });
}

app.post("/unprotected", (res, req) => {
  res.json({ message: "Hello from unprotected endpoint." });
});

app.post("/protected", async (res, req) => {
  await verifyToken(req, res)
    .then((decoded) => {
      res.write(JSON.stringify({ message: "Hello from protected endpoint." }));
      res.end();
    })
    .catch((err) => {
      logger.error(err)
      res.write(JSON.stringify({ message: err }));
      res.end();
    });
});

app.post("/api/login", async (res, req) => {
  await signin(req, res);
});

app.post("/api/signup", async (res, req) => {
  await signup(req, res);
});

app.listen(3000, (token) => {
  if (token) {
    logger.info("Listening to port 3000");
  } else {
    logger.error("Failed to listen to port 3000.");
  }
});
