import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';
import {
  RABBITMQ_DEAD_LETTER_EXCHANGE,
  RABBITMQ_EXCHANGE,
  RABBITMQ_QUEUES,
  RABBITMQ_ROUTING_KEYS,
} from './rabbitmq.constants';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: AmqpConnectionManager | null = null;
  private channelWrapper: ChannelWrapper | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private connect() {
    const rabbitMqUrl = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://guest:guest@localhost:5672',
    );

    try {
      this.connection = amqp.connect([rabbitMqUrl], {
        reconnectTimeInSeconds: 5,
        heartbeatIntervalInSeconds: 10,
      });

      this.connection.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Successfully connected to RabbitMQ broker.');
      });

      this.connection.on('disconnect', (params: { err?: Error }) => {
        this.isConnected = false;
        this.logger.warn(
          `RabbitMQ connection disconnected: ${params?.err?.message || 'Broker unavailable'}`,
        );
      });

      this.channelWrapper = this.connection.createChannel({
        json: true,
        setup: async (channel: ConfirmChannel) => {
          await channel.assertExchange(RABBITMQ_EXCHANGE, 'topic', {
            durable: true,
          });
          await channel.assertExchange(RABBITMQ_DEAD_LETTER_EXCHANGE, 'topic', {
            durable: true,
          });
          await channel.assertQueue(
            RABBITMQ_QUEUES.RESUME_ANALYSIS_DEAD_QUEUE,
            { durable: true },
          );
          await channel.bindQueue(
            RABBITMQ_QUEUES.RESUME_ANALYSIS_DEAD_QUEUE,
            RABBITMQ_DEAD_LETTER_EXCHANGE,
            RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_DEAD,
          );
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Error initializing RabbitMQ connection: ${this.getErrorMessage(error)}`,
      );
      this.isConnected = false;
    }
  }

  private async disconnect() {
    if (this.channelWrapper) {
      await this.channelWrapper.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.isConnected = false;
    this.logger.log('RabbitMQ connection closed.');
  }

  async publishTestMessage(routingKey: string, payload: any): Promise<boolean> {
    if (!this.isConnected || !this.channelWrapper) {
      this.logger.warn(
        'Cannot publish message: RabbitMQ connection is not established.',
      );
      return false;
    }

    try {
      await this.channelWrapper.publish(RABBITMQ_EXCHANGE, routingKey, payload);
      this.logger.log(`Published test message to key '${routingKey}'`);
      return true;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to publish message: ${this.getErrorMessage(error)}`,
      );
      return false;
    }
  }

  /**
   * Publish a message to the exchange with the given routing key.
   * Returns true if published successfully, false otherwise.
   */
  async publish(routingKey: string, payload: unknown): Promise<boolean> {
    if (!this.isConnected || !this.channelWrapper) {
      this.logger.warn(
        `Cannot publish to '${routingKey}': RabbitMQ connection is not established.`,
      );
      return false;
    }

    try {
      await this.channelWrapper.publish(RABBITMQ_EXCHANGE, routingKey, payload);
      this.logger.log(`Published message to '${routingKey}'`);
      return true;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to publish to '${routingKey}': ${this.getErrorMessage(error)}`,
      );
      return false;
    }
  }

  /**
   * Subscribe to a queue bound to the exchange with the given routing keys.
   * Calls the handler for each message received.
   */
  async subscribe(
    queueName: string,
    routingKeys: string[],
    handler: (message: unknown) => Promise<void>,
  ): Promise<void> {
    if (!this.channelWrapper) {
      this.logger.warn(
        `Cannot subscribe to '${queueName}': channel not initialized.`,
      );
      return;
    }

    await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
      // Keep the existing queue declaration compatible with already-provisioned
      // environments. Failed deliveries are explicitly routed to the DLX below.
      await channel.assertQueue(queueName, { durable: true });

      for (const key of routingKeys) {
        await channel.bindQueue(queueName, RABBITMQ_EXCHANGE, key);
      }

      await channel.prefetch(1);

      await channel.consume(queueName, async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          channel.ack(msg);
        } catch (error: unknown) {
          this.logger.error(
            `Error processing message from '${queueName}': ${this.getErrorMessage(error)}`,
          );
          try {
            const accepted = channel.publish(
              RABBITMQ_DEAD_LETTER_EXCHANGE,
              RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_DEAD,
              msg.content,
              {
                persistent: true,
                contentType: msg.properties.contentType,
                headers: {
                  ...msg.properties.headers,
                  'x-original-queue': queueName,
                },
              },
            );
            if (!accepted) {
              throw new Error('Dead-letter channel write buffer is full');
            }
            await channel.waitForConfirms();
            channel.ack(msg);
          } catch (deadLetterError: unknown) {
            this.logger.error(
              `Failed to dead-letter message from '${queueName}': ${this.getErrorMessage(deadLetterError)}`,
            );
            channel.nack(msg, false, true);
          }
        }
      });

      this.logger.log(
        `Subscribed to queue '${queueName}' with keys: [${routingKeys.join(', ')}]`,
      );
    });
  }

  checkHealth(): {
    service: string;
    status: string;
    message?: string;
  } {
    if (this.isConnected && this.connection?.isConnected()) {
      return {
        service: 'rabbitmq',
        status: 'UP',
      };
    }

    return {
      service: 'rabbitmq',
      status: 'DOWN',
      message:
        'RabbitMQ connection is inactive or broker unreachable at localhost:5672',
    };
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown RabbitMQ error';
  }
}
