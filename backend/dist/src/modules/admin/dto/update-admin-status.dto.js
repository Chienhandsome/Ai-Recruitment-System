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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAdminAccountStatusDto = exports.UpdateAdminJobStatusDto = void 0;
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateAdminJobStatusDto {
    status;
}
exports.UpdateAdminJobStatusDto = UpdateAdminJobStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.JobStatus }),
    (0, class_validator_1.IsEnum)(client_1.JobStatus),
    __metadata("design:type", String)
], UpdateAdminJobStatusDto.prototype, "status", void 0);
class UpdateAdminAccountStatusDto {
    status;
}
exports.UpdateAdminAccountStatusDto = UpdateAdminAccountStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.AccountStatus }),
    (0, class_validator_1.IsEnum)(client_1.AccountStatus),
    __metadata("design:type", String)
], UpdateAdminAccountStatusDto.prototype, "status", void 0);
//# sourceMappingURL=update-admin-status.dto.js.map