"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startKafka = startKafka;
exports.publishEvent = publishEvent;
exports.publishBookingEvent = publishBookingEvent;
exports.publishQuotationEvent = publishQuotationEvent;
const kafkajs_1 = require("kafkajs");
const logger_1 = require("@/utils/logger");
const config_1 = require("@/config/config");
const brokers = config_1.config.kafka.brokers;
const clientId = config_1.config.kafka.clientId;
const groupId = config_1.config.kafka.groupId;
const kafka = new kafkajs_1.Kafka({
    clientId,
    brokers,
    logLevel: kafkajs_1.logLevel.NOTHING,
    retry: {
        retries: config_1.config.kafka.retryAttempts,
        initialRetryTime: config_1.config.kafka.retryDelay,
    },
});
const producer = kafka.producer({
    retry: {
        retries: config_1.config.kafka.retryAttempts,
        initialRetryTime: config_1.config.kafka.retryDelay,
    },
});
const consumer = kafka.consumer({
    groupId,
    sessionTimeout: config_1.config.kafka.sessionTimeout,
    heartbeatInterval: config_1.config.kafka.heartbeatInterval,
});
async function startKafka() {
    if (!config_1.config.kafka.enabled) {
        logger_1.logger.info('Kafka is disabled, skipping initialization');
        return;
    }
    try {
        await producer.connect();
        await consumer.connect();
        const topics = config_1.config.kafka.topics.events;
        for (const topic of topics) {
            await consumer.subscribe({ topic, fromBeginning: false });
            logger_1.logger.info(`Subscribed to Kafka topic: ${topic}`);
        }
        await consumer.run({
            eachMessage: async (payload) => {
                try {
                    const { topic, partition, message } = payload || {};
                    const value = message?.value ? message.value.toString() : '';
                    const key = message?.key ? message.key.toString() : '';
                    logger_1.logger.info('Kafka event received', {
                        topic,
                        partition,
                        offset: message?.offset,
                        key,
                        value: value.substring(0, 200)
                    });
                    try {
                        const eventData = JSON.parse(value);
                        await handleKafkaEvent(topic, eventData);
                    }
                    catch (parseError) {
                        logger_1.logger.warn('Failed to parse Kafka message as JSON', { topic, value: value.substring(0, 100) });
                    }
                }
                catch (e) {
                    logger_1.logger.error('Kafka consumer error', { error: e?.message, stack: e?.stack });
                }
            },
        });
        logger_1.logger.info('Kafka producer and consumer started', { brokers, topics: config_1.config.kafka.topics.events });
    }
    catch (e) {
        logger_1.logger.error('Kafka start failed', { error: e?.message, stack: e?.stack });
    }
}
async function handleKafkaEvent(topic, eventData) {
    try {
        switch (topic) {
            case 'hall.booking':
                logger_1.logger.info('Processing hall booking event', { eventData });
                break;
            case 'hall.quotation':
                logger_1.logger.info('Processing hall quotation event', { eventData });
                break;
            default:
                logger_1.logger.debug('Unhandled Kafka topic', { topic, eventData });
        }
    }
    catch (error) {
        logger_1.logger.error('Error handling Kafka event', { topic, error: error?.message });
    }
}
async function publishEvent(topic, payload, key) {
    if (!config_1.config.kafka.enabled) {
        logger_1.logger.debug('Kafka is disabled, skipping event publish', { topic });
        return;
    }
    try {
        const message = {
            value: JSON.stringify({
                ...payload,
                timestamp: new Date().toISOString(),
                service: config_1.config.server.serviceName,
                version: config_1.config.server.serviceVersion,
            }),
        };
        if (key) {
            message.key = key;
        }
        await producer.send({ topic, messages: [message] });
        logger_1.logger.debug('Kafka event published', { topic, key });
    }
    catch (e) {
        logger_1.logger.error('Kafka publish failed', { topic, error: e?.message, stack: e?.stack });
    }
}
async function publishBookingEvent(eventType, bookingData) {
    await publishEvent('hall.booking', {
        type: eventType,
        data: bookingData,
    }, bookingData.id);
}
async function publishQuotationEvent(eventType, quotationData) {
    await publishEvent('hall.quotation', {
        type: eventType,
        data: quotationData,
    }, quotationData.id);
}
//# sourceMappingURL=kafka.js.map