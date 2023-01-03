import pino from "pino";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import express, { NextFunction, Request, Response } from "express";
import { sign, verify } from "jsonwebtoken";
import { config } from "dotenv";
import { SimpleUserDB } from "./database";
import { loginSchema, signupSchema } from "./schema";
import { z } from "zod";

config();

const app = express();
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

app.use(express.json());
app.use(cookieParser());

function verifyToken(req: Request, res: Response, next: NextFunction) {
  try {
    let _token = req.body.token || req.headers.authorization;
    logger.debug(_token);

    if (_token) {
      _token = _token?.split(" ")[1];
      if (!_token) throw new Error("Unauthorized.");
    } else {
      _token = req.cookies.token;
    }

    const token = _token;

    if (token) {
      const decoded = verify(token, secret);

      if (!decoded) throw new Error("Unauthorized.");

      return next();
    } else {
      throw new Error("Unauthorized.");
    }
  } catch (err: any) {
    logger.error(err.message);
    return res.status(401).json({ message: err.message });
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

async function signup(req: Request, res: Response) {
  const userInfo = req.body;

  if (!validateSchema(userInfo, signupSchema)) {
    logger.error("Failed to validate schema.");
    return res.status(400).json({ message: "Invalid schema." });
  }

  if (!(await attemptUserStore(userInfo))) {
    logger.error("Failed to store user.");
    return res.status(400).json({ message: "Failed to store user." });
  }

  const { email } = userInfo;

  logger.info(`Signup attempt for ${email}`);

  const signature = { user: email };

  sign(signature, secret, (err: Error | null, token?: string) => {
    if (err) {
      logger.error(err);
      return res.status(500).send("Internal server error");
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.json({
      token,
    });
  });
}

async function signin(req: Request, res: Response) {
  const userInfo = req.body;

  if (!validateSchema(userInfo, loginSchema)) {
    logger.error("Failed to validate schema.");
    return res.status(400).json({ message: "Invalid schema." });
  }

  if (!(await attemptUserGet(userInfo))) {
    logger.error("Failed to get user.");
    return res.status(400).json({ message: "Failed to get user." });
  }

  const { email } = userInfo;

  logger.info(`Signup attempt for ${email}`);

  const signature = { user: email };

  sign(signature, secret, (err: Error | null, token?: string) => {
    if (err) {
      logger.error(err);
      return res.status(500).send("Internal server error");
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.json({
      token,
    });
  });
}

app.all("/unprotected", (req, res) => {
  res.json({ message: "Hello from unprotected endpoint." });
});

app.all("/protected", verifyToken, (req, res) => {
  res.json({ message: "Hello from protected endpoint." });
});

app.post("/api/login", authLimiter, async (req, res) => {
  await signin(req, res);
});

app.post("/api/signup", authLimiter, async (req, res) => {
  await signup(req, res);
});

app.listen(3000, () => {
  logger.info("Server started on port 3000...");
});
