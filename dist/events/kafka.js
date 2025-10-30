"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startKafka = startKafka;
exports.publishEvent = publishEvent;
const kafkajs_1 = require("kafkajs");
const logger_1 = require("@/utils/logger");
const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',').map(s => s.trim());
const clientId = process.env.KAFKA_CLIENT_ID || 'rubizz-hall-service';
const groupId = process.env.KAFKA_GROUP_ID || 'rubizz-hall-service-group';
const kafka = new kafkajs_1.Kafka({ clientId, brokers, logLevel: kafkajs_1.logLevel.NOTHING });
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId });
async function startKafka() {
    try {
        await producer.connect();
        await consumer.connect();
        await consumer.subscribe({ topic: 'hall.booking', fromBeginning: false });
        await consumer.subscribe({ topic: 'hall.quotation', fromBeginning: false });
        await consumer.run({
            eachMessage: async (payload) => {
                try {
                    const { topic, partition, message } = payload || {};
                    const value = message?.value ? message.value.toString() : '';
                    logger_1.logger.info('Kafka event received', { topic, partition, value });
                }
                catch (e) {
                    logger_1.logger.error('Kafka consumer error', { error: e?.message });
                }
            },
        });
        logger_1.logger.info('Kafka producer and consumer started', { brokers });
    }
    catch (e) {
        logger_1.logger.error('Kafka start failed', { error: e?.message });
    }
}
async function publishEvent(topic, payload) {
    try {
        await producer.send({ topic, messages: [{ value: JSON.stringify(payload) }] });
    }
    catch (e) {
        logger_1.logger.error('Kafka publish failed', { topic, error: e?.message });
    }
}
//# sourceMappingURL=kafka.js.map