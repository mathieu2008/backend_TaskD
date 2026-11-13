import { Injectable } from '@nestjs/common';

/** Time is injected so that tests can control it. */
export abstract class Clock {
  abstract now(): Date;
}

@Injectable()
export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}