// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - types may not be available in environment
import { Kafka, logLevel } from 'kafkajs';
import { logger } from '@/utils/logger';

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',').map(s => s.trim());
const clientId = process.env.KAFKA_CLIENT_ID || 'rubizz-hall-service';
const groupId = process.env.KAFKA_GROUP_ID || 'rubizz-hall-service-group';

const kafka = new Kafka({ clientId, brokers, logLevel: logLevel.NOTHING });

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId });

export async function startKafka(): Promise<void> {
  try {
    await producer.connect();
    await consumer.connect();

    // Subscribe to internal hall topics (for demo; customize as needed)
    await consumer.subscribe({ topic: 'hall.booking', fromBeginning: false });
    await consumer.subscribe({ topic: 'hall.quotation', fromBeginning: false });

    await consumer.run({
      // Use broad types to avoid environment type mismatches
      eachMessage: async (payload: any) => {
        try {
          const { topic, partition, message } = payload || {};
          const value = message?.value ? message.value.toString() : '';
          logger.info('Kafka event received', { topic, partition, value });
        } catch (e: any) {
          logger.error('Kafka consumer error', { error: e?.message });
        }
      },
    });

    logger.info('Kafka producer and consumer started', { brokers });
  } catch (e: any) {
    logger.error('Kafka start failed', { error: e?.message });
  }
}

export async function publishEvent(topic: string, payload: any): Promise<void> {
  try {
    await producer.send({ topic, messages: [{ value: JSON.stringify(payload) }] });
  } catch (e: any) {
    logger.error('Kafka publish failed', { topic, error: e?.message });
  }
}


