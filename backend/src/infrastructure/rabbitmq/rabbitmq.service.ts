import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { Channel } from 'amqplib';
import { RABBITMQ_EXCHANGE } from './rabbitmq.constants';

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
        setup: async (channel: Channel) => {
          await channel.assertExchange(RABBITMQ_EXCHANGE, 'topic', {
            durable: true,
          });
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
