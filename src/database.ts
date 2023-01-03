import fsPromise from "fs/promises";
import fs from "fs";
import { compare, compareSync, hash, hashSync } from "bcrypt";

export interface IUser {
  id: Symbol;
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: Symbol;
  name: string;
  email: string;
  hashedPassword: string;
}

export class SimpleUserDB {
  private _db: User[] = [];
  private _saltRounds: number = 10;

  constructor() {}

  public set saltRounds(saltRounds: number) {
    this._saltRounds = saltRounds;
  }

  public get saltRounds(): number {
    return this._saltRounds;
  }

  public async loadDB(): Promise<User[]> {
    const data = await fsPromise.readFile("./db.json", "utf-8");
    this._db = JSON.parse(data);
    return this._db;
  }

  public async saveDB() {
    await fsPromise.writeFile("./db.json", JSON.stringify(this._db));
  }

  public loadDBSync(): User[] {
    const data = fs.readFileSync("./db.json", "utf-8");
    this._db = JSON.parse(data);
    return this._db;
  }

  public saveDBSync() {
    fs.writeFileSync("./db.json", JSON.stringify(this._db));
  }

  public async storeUser(user: IUser) {
    const found = this._db.find((u) => u.email === user.email);

    if (found) {
      throw new Error("User already exists.");
    }

    const hashed = await hash(user.password, this._saltRounds);

    this._db.push({
      id: Symbol(),
      name: user.name,
      email: user.email,
      hashedPassword: hashed,
    });
  }

  public storeUserSync(user: IUser) {
    const found = this._db.find((u) => u.email === user.email);

    if (found) {
      throw new Error("User already exists.");
    }

    const hashed = hashSync(user.password, this._saltRounds);

    this._db.push({
      id: Symbol(),
      name: user.name,
      email: user.email,
      hashedPassword: hashed,
    });
  }

  public async validateUser(user: IUser) {
    const found = this._db.find((u) => u.email === user.email);

    if (!found) {
      throw new Error("User not found.");
    }

    const valid = await compare(user.password, found.hashedPassword);

    if (!valid) {
      throw new Error("Invalid credentials.");
    }

    return found;
  }

  public validateUserSync(user: IUser) {
    const found = this._db.find((u) => u.email === user.email);

    if (!found) {
      throw new Error("User not found.");
    }

    const valid = compareSync(user.password, found.hashedPassword);

    if (!valid) {
      throw new Error("Invalid credentials.");
    }

    return found;
  }

  public getUser(opts: { id?: Symbol; name?: string; email?: string }) {
    if (opts.id) {
      return this._db.find((u) => u.id === opts.id);
    }

    if (opts.name) {
      return this._db.find((u) => u.name === opts.name);
    }

    if (opts.email) {
      return this._db.find((u) => u.email === opts.email);
    }

    throw new Error("Invalid options.");
  }

  public deleteUser(opts: { id?: Symbol; name?: string; email?: string }) {
    if (opts.id) {
      const index = this._db.findIndex((u) => u.id === opts.id);

      if (index === -1) {
        throw new Error("User not found.");
      }

      this._db.splice(index, 1);

      return;
    }

    if (opts.name) {
      const index = this._db.findIndex((u) => u.name === opts.name);

      if (index === -1) {
        throw new Error("User not found.");
      }

      this._db.splice(index, 1);

      return;
    }

    if (opts.email) {
      const index = this._db.findIndex((u) => u.email === opts.email);

      if (index === -1) {
        throw new Error("User not found.");
      }

      this._db.splice(index, 1);

      return;
    }

    throw new Error("Invalid options.");
  }
}
