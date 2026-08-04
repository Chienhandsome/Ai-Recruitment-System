import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ParsedResumeData } from '../../resume.types';

@Injectable()
export class ProjectWriter {
  async write(
    tx: Prisma.TransactionClient,
    candidateProfileId: string,
    resumeId: string,
    projects: ParsedResumeData['projects'],
  ): Promise<void> {
    await tx.project.deleteMany({
      where: { candidateProfileId, source: 'EXTRACTED' },
    });

    if (projects.length === 0) return;

    await tx.project.createMany({
      data: projects.map((project) => ({
        candidateProfileId,
        resumeId,
        source: 'EXTRACTED',
        projectName: project.project_name,
        projectRole: project.project_role ?? null,
        description: project.description ?? null,
        technologies: (project.technologies ??
          undefined) as Prisma.InputJsonValue,
        projectUrl: project.project_url ?? null,
        startDate: project.start_date ? new Date(project.start_date) : null,
        endDate: project.end_date ? new Date(project.end_date) : null,
        isInferred: project.is_inferred ?? false,
        sourceText: project.source_text ?? null,
      })),
    });
  }
}
