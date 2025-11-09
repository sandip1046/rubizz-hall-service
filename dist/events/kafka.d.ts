export declare function startKafka(): Promise<void>;
export declare function publishEvent(topic: string, payload: any, key?: string): Promise<void>;
export declare function publishBookingEvent(eventType: string, bookingData: any): Promise<void>;
export declare function publishQuotationEvent(eventType: string, quotationData: any): Promise<void>;
//# sourceMappingURL=kafka.d.ts.map