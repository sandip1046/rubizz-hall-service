import { EventEmitter } from 'events';

export type RealtimeEvent = {
  type: string;
  payload: any;
};

class RealtimeBus extends EventEmitter {}

export const realtimeBus = new RealtimeBus();


