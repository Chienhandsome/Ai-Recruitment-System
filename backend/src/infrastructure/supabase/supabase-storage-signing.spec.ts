import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { SupabaseStorageService } from './supabase-storage.service';

jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));

describe('CV storage signed links', () => {
  function setup() {
    const createSignedUrl = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.example/signed' },
      error: null,
    });
    const from = jest.fn().mockReturnValue({ createSignedUrl });
    jest.mocked(createClient).mockReturnValue({ storage: { from } } as never);
    const service = new SupabaseStorageService(
      new ConfigService({
        SUPABASE_URL: 'https://storage.example',
        SUPABASE_SERVICE_ROLE_KEY: 'synthetic-test-key',
        SUPABASE_STORAGE_BUCKET: 'configured-resumes',
      }),
    );
    return { service, from, createSignedUrl };
  }
  it('keeps existing worker signing on the configured bucket', async () => {
    const { service, from, createSignedUrl } = setup();
    await service.createSignedDownloadUrl('candidates/a/cv.pdf', 300);
    expect(from).toHaveBeenCalledWith('configured-resumes');
    expect(createSignedUrl).toHaveBeenCalledWith(
      'candidates/a/cv.pdf',
      300,
      undefined,
    );
  });
  it('uses the stored bucket and attachment filename for an HR download', async () => {
    const { service, from, createSignedUrl } = setup();
    await service.createSignedDownloadUrl('candidates/a/cv.pdf', 60, {
      bucket: 'legacy-resumes',
      download: 'CV gốc.pdf',
    });
    expect(from).toHaveBeenCalledWith('legacy-resumes');
    expect(createSignedUrl).toHaveBeenCalledWith('candidates/a/cv.pdf', 60, {
      download: 'CV gốc.pdf',
    });
  });
  it('does not issue links for invalid object paths', async () => {
    const { service, from } = setup();
    await expect(
      service.createSignedDownloadUrl('../another/cv.pdf', 60),
    ).rejects.toThrow();
    expect(from).not.toHaveBeenCalled();
  });
});
