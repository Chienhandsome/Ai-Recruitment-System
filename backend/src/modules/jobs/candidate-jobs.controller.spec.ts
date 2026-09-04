import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PUBLIC_ROUTE_KEY, REQUIRED_ROLES_KEY } from '../auth/auth.constants';
import { CandidateJobsController } from './candidate-jobs.controller';
import { QueryCandidateJobDto } from './dto/query-candidate-job.dto';

describe('CandidateJobsController contract', () => {
  it('requires the CANDIDATE role on recommended endpoint and is not public', () => {
    expect(
      Reflect.getMetadata(
        REQUIRED_ROLES_KEY,
        CandidateJobsController.prototype.findRecommended,
      ),
    ).toEqual(['CANDIDATE']);
    expect(
      Reflect.getMetadata(
        PUBLIC_ROUTE_KEY,
        CandidateJobsController.prototype.findRecommended,
      ),
    ).toBeUndefined();
  });

  it('exposes findAll as public', () => {
    expect(
      Reflect.getMetadata(
        PUBLIC_ROUTE_KEY,
        CandidateJobsController.prototype.findAll,
      ),
    ).toBe(true);
  });

  it('rejects page sizes over the public API limit', async () => {
    const query = plainToInstance(QueryCandidateJobDto, { limit: '51' });
    const errors = await validate(query);

    expect(errors).toEqual([expect.objectContaining({ property: 'limit' })]);
  });
});
