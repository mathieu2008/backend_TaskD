import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';

export abstract class PasswordHasher {
  abstract hash(plain: string): Promise<string>;
  abstract verify(plain: string, hash: string): Promise<boolean>;
  /** Spends the same time as a real check, so an unknown email is not detectable by timing. */
  abstract burn(plain: string): Promise<void>;
}

const COST = 12;

@Injectable()
export class BcryptPasswordHasher extends PasswordHasher {
  private readonly dummyHash = bcrypt.hashSync(randomBytes(16).toString('hex'), COST);

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, COST);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  async burn(plain: string): Promise<void> {
    await bcrypt.compare(plain, this.dummyHash);
  }
}