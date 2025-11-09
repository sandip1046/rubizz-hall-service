// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - types may not be available in environment
import { Kafka, logLevel } from 'kafkajs';
import { logger } from '@/utils/logger';
import { config } from '@/config/config';

const brokers = config.kafka.brokers;
const clientId = config.kafka.clientId;
const groupId = config.kafka.groupId;

const kafka = new Kafka({ 
  clientId, 
  brokers, 
  logLevel: logLevel.NOTHING,
  retry: {
    retries: config.kafka.retryAttempts,
    initialRetryTime: config.kafka.retryDelay,
  },
});

const producer = kafka.producer({
  retry: {
    retries: config.kafka.retryAttempts,
    initialRetryTime: config.kafka.retryDelay,
  },
});

const consumer = kafka.consumer({ 
  groupId,
  sessionTimeout: config.kafka.sessionTimeout,
  heartbeatInterval: config.kafka.heartbeatInterval,
});

export async function startKafka(): Promise<void> {
  if (!config.kafka.enabled) {
    logger.info('Kafka is disabled, skipping initialization');
    return;
  }

  try {
    await producer.connect();
    await consumer.connect();

    // Subscribe to configured event topics
    const topics = config.kafka.topics.events;
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
      logger.info(`Subscribed to Kafka topic: ${topic}`);
    }

    await consumer.run({
      // Use broad types to avoid environment type mismatches
      eachMessage: async (payload: any) => {
        try {
          const { topic, partition, message } = payload || {};
          const value = message?.value ? message.value.toString() : '';
          const key = message?.key ? message.key.toString() : '';
          
          logger.info('Kafka event received', { 
            topic, 
            partition, 
            offset: message?.offset,
            key,
            value: value.substring(0, 200) // Log first 200 chars
          });

          // Parse and handle event based on topic
          try {
            const eventData = JSON.parse(value);
            await handleKafkaEvent(topic, eventData);
          } catch (parseError) {
            logger.warn('Failed to parse Kafka message as JSON', { topic, value: value.substring(0, 100) });
          }
        } catch (e: any) {
          logger.error('Kafka consumer error', { error: e?.message, stack: e?.stack });
        }
      },
    });

    logger.info('Kafka producer and consumer started', { brokers, topics: config.kafka.topics.events });
  } catch (e: any) {
    logger.error('Kafka start failed', { error: e?.message, stack: e?.stack });
    // Don't throw - allow service to continue without Kafka
  }
}

async function handleKafkaEvent(topic: string, eventData: any): Promise<void> {
  try {
    switch (topic) {
      case 'hall.booking':
        logger.info('Processing hall booking event', { eventData });
        // Add business logic here
        break;
      case 'hall.quotation':
        logger.info('Processing hall quotation event', { eventData });
        // Add business logic here
        break;
      default:
        logger.debug('Unhandled Kafka topic', { topic, eventData });
    }
  } catch (error: any) {
    logger.error('Error handling Kafka event', { topic, error: error?.message });
  }
}

export async function publishEvent(topic: string, payload: any, key?: string): Promise<void> {
  if (!config.kafka.enabled) {
    logger.debug('Kafka is disabled, skipping event publish', { topic });
    return;
  }

  try {
    const message: any = {
      value: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
        service: config.server.serviceName,
        version: config.server.serviceVersion,
      }),
    };

    // Only include key if provided (Kafka expects string | Buffer | null, not undefined)
    if (key) {
      message.key = key;
    }

    await producer.send({ topic, messages: [message] });
    logger.debug('Kafka event published', { topic, key });
  } catch (e: any) {
    logger.error('Kafka publish failed', { topic, error: e?.message, stack: e?.stack });
    // Don't throw - allow service to continue if Kafka is unavailable
  }
}

export async function publishBookingEvent(eventType: string, bookingData: any): Promise<void> {
  await publishEvent('hall.booking', {
    type: eventType,
    data: bookingData,
  }, bookingData.id);
}

export async function publishQuotationEvent(eventType: string, quotationData: any): Promise<void> {
  await publishEvent('hall.quotation', {
    type: eventType,
    data: quotationData,
  }, quotationData.id);
}


