"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RabbitMQService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqp = __importStar(require("amqp-connection-manager"));
const rabbitmq_constants_1 = require("./rabbitmq.constants");
let RabbitMQService = RabbitMQService_1 = class RabbitMQService {
    configService;
    logger = new common_1.Logger(RabbitMQService_1.name);
    connection = null;
    channelWrapper = null;
    isConnected = false;
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        this.connect();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    connect() {
        const rabbitMqUrl = this.configService.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
        try {
            this.connection = amqp.connect([rabbitMqUrl], {
                reconnectTimeInSeconds: 5,
                heartbeatIntervalInSeconds: 10,
            });
            this.connection.on('connect', () => {
                this.isConnected = true;
                this.logger.log('Successfully connected to RabbitMQ broker.');
            });
            this.connection.on('disconnect', (params) => {
                this.isConnected = false;
                this.logger.warn(`RabbitMQ connection disconnected: ${params?.err?.message || 'Broker unavailable'}`);
            });
            this.channelWrapper = this.connection.createChannel({
                json: true,
                setup: async (channel) => {
                    await channel.assertExchange(rabbitmq_constants_1.RABBITMQ_EXCHANGE, 'topic', {
                        durable: true,
                    });
                },
            });
        }
        catch (error) {
            this.logger.error(`Error initializing RabbitMQ connection: ${this.getErrorMessage(error)}`);
            this.isConnected = false;
        }
    }
    async disconnect() {
        if (this.channelWrapper) {
            await this.channelWrapper.close();
        }
        if (this.connection) {
            await this.connection.close();
        }
        this.isConnected = false;
        this.logger.log('RabbitMQ connection closed.');
    }
    async publishTestMessage(routingKey, payload) {
        if (!this.isConnected || !this.channelWrapper) {
            this.logger.warn('Cannot publish message: RabbitMQ connection is not established.');
            return false;
        }
        try {
            await this.channelWrapper.publish(rabbitmq_constants_1.RABBITMQ_EXCHANGE, routingKey, payload);
            this.logger.log(`Published test message to key '${routingKey}'`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to publish message: ${this.getErrorMessage(error)}`);
            return false;
        }
    }
    async publish(routingKey, payload) {
        if (!this.isConnected || !this.channelWrapper) {
            this.logger.warn(`Cannot publish to '${routingKey}': RabbitMQ connection is not established.`);
            return false;
        }
        try {
            await this.channelWrapper.publish(rabbitmq_constants_1.RABBITMQ_EXCHANGE, routingKey, payload);
            this.logger.log(`Published message to '${routingKey}'`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to publish to '${routingKey}': ${this.getErrorMessage(error)}`);
            return false;
        }
    }
    async subscribe(queueName, routingKeys, handler) {
        if (!this.channelWrapper) {
            this.logger.warn(`Cannot subscribe to '${queueName}': channel not initialized.`);
            return;
        }
        await this.channelWrapper.addSetup(async (channel) => {
            await channel.assertQueue(queueName, { durable: true });
            for (const key of routingKeys) {
                await channel.bindQueue(queueName, rabbitmq_constants_1.RABBITMQ_EXCHANGE, key);
            }
            await channel.prefetch(1);
            await channel.consume(queueName, async (msg) => {
                if (!msg)
                    return;
                try {
                    const content = JSON.parse(msg.content.toString());
                    await handler(content);
                    channel.ack(msg);
                }
                catch (error) {
                    this.logger.error(`Error processing message from '${queueName}': ${this.getErrorMessage(error)}`);
                    channel.nack(msg, false, false);
                }
            });
            this.logger.log(`Subscribed to queue '${queueName}' with keys: [${routingKeys.join(', ')}]`);
        });
    }
    checkHealth() {
        if (this.isConnected && this.connection?.isConnected()) {
            return {
                service: 'rabbitmq',
                status: 'UP',
            };
        }
        return {
            service: 'rabbitmq',
            status: 'DOWN',
            message: 'RabbitMQ connection is inactive or broker unreachable at localhost:5672',
        };
    }
    getErrorMessage(error) {
        return error instanceof Error ? error.message : 'Unknown RabbitMQ error';
    }
};
exports.RabbitMQService = RabbitMQService;
exports.RabbitMQService = RabbitMQService = RabbitMQService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RabbitMQService);
//# sourceMappingURL=rabbitmq.service.js.map