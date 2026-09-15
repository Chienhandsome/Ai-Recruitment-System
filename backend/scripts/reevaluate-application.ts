import 'dotenv/config';

import { ApplicationsConsumer } from '../src/modules/applications/applications.consumer';
import { createEvaluationMessage } from '../src/modules/applications/application-evaluation.snapshot';
import { PrismaService } from '../src/database/prisma.service';

async function main(): Promise<void> {
  const applicationId = process.argv[2];
  if (!applicationId) {
    throw new Error(
      'Usage: npm run applications:reevaluate -- <application-id>',
    );
  }

  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { profileSnapshot: true },
    });
    if (!application) {
      throw new Error(`Application ${applicationId} was not found.`);
    }

    const evaluationRequest = createEvaluationMessage(
      applicationId,
      application.profileSnapshot,
    );
    if (!evaluationRequest) {
      throw new Error('Application evaluation snapshot is missing or invalid.');
    }

    const aiServiceUrl = (
      process.env.REEVALUATION_AI_SERVICE_URL ||
      process.env.AI_SERVICE_URL ||
      'http://127.0.0.1:8000'
    ).replace(/\/$/, '');
    const response = await fetch(`${aiServiceUrl}/api/v1/matching/evaluate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(evaluationRequest),
    });
    if (!response.ok) {
      throw new Error(
        `AI service returned ${response.status}: ${await response.text()}`,
      );
    }

    const result: unknown = await response.json();
    const consumer = new ApplicationsConsumer(
      prisma,
      { subscribe: () => Promise.resolve() } as never,
      { markForRetry: () => Promise.resolve() } as never,
    );
    await consumer.handleMessage({
      applicationId,
      status: 'COMPLETED',
      result,
    });

    const persisted = await prisma.aiMatchingResult.findFirstOrThrow({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
      select: {
        overallScore: true,
        matchLevel: true,
        inputSnapshot: true,
        createdAt: true,
      },
    });
    console.log(
      JSON.stringify(
        {
          applicationId,
          overallScore: persisted.overallScore.toNumber(),
          matchLevel: persisted.matchLevel,
          scoringDetails: persisted.inputSnapshot,
          createdAt: persisted.createdAt,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
