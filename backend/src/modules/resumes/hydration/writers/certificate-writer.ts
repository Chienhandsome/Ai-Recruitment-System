import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ParsedResumeData } from '../../resume.types';

@Injectable()
export class CertificateWriter {
  async write(
    tx: Prisma.TransactionClient,
    candidateProfileId: string,
    resumeId: string,
    certificates: ParsedResumeData['certificates'],
  ): Promise<void> {
    await tx.certificate.deleteMany({
      where: { candidateProfileId, source: 'EXTRACTED', resumeId },
    });

    if (certificates.length === 0) return;

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
      })),
    });
  }
}
