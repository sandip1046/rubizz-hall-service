import { EventEmitter } from 'events';
export type RealtimeEvent = {
    type: string;
    payload: any;
};
declare class RealtimeBus extends EventEmitter {
}
export declare const realtimeBus: RealtimeBus;
export {};
//# sourceMappingURL=eventBus.d.ts.map