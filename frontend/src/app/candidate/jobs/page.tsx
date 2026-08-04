import { redirect } from 'next/navigation';

type JobsSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LegacyCandidateJobsPage({
  searchParams,
}: {
  searchParams: JobsSearchParams;
}) {
  const values = await searchParams;
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== undefined) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  redirect(query ? `/candidate?${query}` : '/candidate');
}
