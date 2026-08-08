"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileWriter = void 0;
const common_1 = require("@nestjs/common");
let ProfileWriter = class ProfileWriter {
    async write(tx, candidateProfileId, resumeId, parsedData) {
        const result = await tx.candidateProfile.updateMany({
            where: { id: candidateProfileId, primaryResumeId: resumeId },
            data: {
                status: (parsedData.overall_confidence ?? 1) < 0.6 ? 'NEEDS_REVIEW' : 'READY',
                professionalSummary: parsedData.summary !== undefined ? parsedData.summary : undefined,
                desiredTitle: parsedData.desired_title !== undefined
                    ? parsedData.desired_title
                    : undefined,
            },
        });
        return result.count === 1;
    }
};
exports.ProfileWriter = ProfileWriter;
exports.ProfileWriter = ProfileWriter = __decorate([
    (0, common_1.Injectable)()
], ProfileWriter);
//# sourceMappingURL=profile-writer.js.map