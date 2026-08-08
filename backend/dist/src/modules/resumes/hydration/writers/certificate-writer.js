"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateWriter = void 0;
const common_1 = require("@nestjs/common");
let CertificateWriter = class CertificateWriter {
    async write(tx, candidateProfileId, resumeId, certificates) {
        await tx.certificate.deleteMany({
            where: { candidateProfileId, source: 'EXTRACTED' },
        });
        if (certificates.length === 0)
            return;
        await tx.certificate.createMany({
            data: certificates.map((certificate) => ({
                candidateProfileId,
                resumeId,
                source: 'EXTRACTED',
                certificateName: certificate.certificate_name,
                issuingOrganization: certificate.issuing_organization || 'Unknown',
                issueDate: certificate.issue_date
                    ? new Date(certificate.issue_date)
                    : null,
                expiryDate: certificate.expiry_date
                    ? new Date(certificate.expiry_date)
                    : null,
                credentialUrl: certificate.credential_url ?? null,
                isInferred: certificate.is_inferred ?? false,
                sourceText: certificate.source_text ?? null,
            })),
        });
    }
};
exports.CertificateWriter = CertificateWriter;
exports.CertificateWriter = CertificateWriter = __decorate([
    (0, common_1.Injectable)()
], CertificateWriter);
//# sourceMappingURL=certificate-writer.js.map