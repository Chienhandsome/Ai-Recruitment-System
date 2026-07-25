"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    isConnected = false;
    constructor() {
        super({
            log: process.env.NODE_ENV === 'development'
                ? [
                    { emit: 'event', level: 'query' },
                    { emit: 'stdout', level: 'error' },
                    { emit: 'stdout', level: 'warn' },
                ]
                : ['error', 'warn'],
        });
        if (process.env.NODE_ENV === 'development') {
            this.$on('query', (e) => {
                if (e.duration > 200) {
                    this.logger.warn(`Slow query (${e.duration}ms): ${e.query.substring(0, 200)}`);
                }
            });
        }
    }
    async onModuleInit() {
        await this.connectWithRetry();
    }
    async onModuleDestroy() {
        if (this.isConnected) {
            await this.$disconnect();
            this.logger.log('Prisma disconnected from Supabase PostgreSQL database.');
            this.isConnected = false;
        }
    }
    async connectWithRetry() {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl ||
            dbUrl.includes('your-password') ||
            dbUrl.includes('your-project-ref')) {
            this.logger.warn('Prisma: DATABASE_URL contains placeholder credentials. Connection deferred.');
            this.isConnected = false;
            return;
        }
        const sanitizedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
        this.logger.log(`Prisma: Connecting to ${sanitizedUrl}`);
        const startTime = Date.now();
        try {
            await this.$connect();
            this.isConnected = true;
            this.logger.log(`Prisma successfully connected to Supabase PostgreSQL database (${Date.now() - startTime}ms).`);
        }
        catch (error) {
            this.isConnected = false;
            this.logger.error(`Prisma connection error after ${Date.now() - startTime}ms: ${error instanceof Error ? error.message : 'Database connection failed'}`);
            this.logger.error(`Connection target: ${sanitizedUrl}`);
        }
    }
    async checkHealth() {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl ||
            dbUrl.includes('your-password') ||
            dbUrl.includes('your-project-ref')) {
            return {
                service: 'supabase-postgres',
                status: 'DOWN',
                message: 'DATABASE_URL is unconfigured or contains placeholder values',
            };
        }
        try {
            await this.$queryRaw `SELECT 1`;
            this.isConnected = true;
            return {
                service: 'supabase-postgres',
                status: 'UP',
            };
        }
        catch {
            this.isConnected = false;
            return {
                service: 'supabase-postgres',
                status: 'DOWN',
                message: 'Database connection check failed',
            };
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map