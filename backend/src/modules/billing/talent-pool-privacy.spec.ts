import { talentPoolRedactor } from './talent-pool-privacy';

const identity = {
  fullName: 'Nguyễn Minh An',
  email: 'an@example.invalid',
  phone: '0901234567',
  linkedinUrl: 'https://linkedin.com/in/minh-an',
  githubUrl: 'https://github.com/minh-an',
  portfolioUrl: 'https://minhan.dev',
};

describe('Talent Pool public text redaction', () => {
  const redact = talentPoolRedactor(identity);

  it.each([
    'Email an@example.invalid để trao đổi',
    'Email OTHER.PERSON+cv@Example.com',
    'Liên hệ 090 123 4567',
    'Liên hệ +84 90 123 4567',
    'Liên hệ (090) 123-4567',
    'Liên hệ 090.123.4567',
    'Điện thoại +1 (202) 555-0198',
    'https://linkedin.com/in/minh-an',
    'linkedin.com/in/minh-an',
    'github.com/minh-an',
    'www.minhan.dev/cv',
    'minhan.dev',
    'mailto:an@example.invalid',
    'tel:+84901234567',
    'Email an\u200b@example.invalid',
    'Email an＠example.invalid',
    'Tôi là Nguyễn Minh An, một kỹ sư backend.',
  ])('removes contact/identity from candidate prose: %s', (text) => {
    const output = redact(text);
    expect(output).not.toBe(text);
    expect(output).not.toMatch(
      /an@example\.invalid|090|\+84|555-0198|linkedin\.com|github\.com|minhan\.dev|Nguyễn Minh An/i,
    );
  });

  it('preserves professional text, dates, salaries and structural IDs', () => {
    const profile = {
      id: '0901234567',
      role: 'Node.js / Next.js, Java 17, .NET 8, 5 năm kinh nghiệm',
      summary: 'Lương 20.000.000 - 30.000.000 VND. Làm việc từ 2020 - 2024.',
      startDate: '2020-01-01',
      endDate: null,
      skills: [
        { skill: { id: '0901234567', name: 'Node.js' }, isPrimary: true },
      ],
    };
    expect(redact(profile)).toEqual(profile);
  });

  it('redacts nested descriptions and education without mutating stored objects or dates', () => {
    const startDate = new Date('2020-01-01');
    const original = {
      workExperiences: [
        {
          companyName: 'Example',
          description: 'Liên hệ an@example.invalid\n0901234567',
          startDate,
        },
      ],
      educations: [
        {
          schoolName: 'Nguyễn Minh An - an@example.invalid',
          major: 'Công nghệ thông tin',
        },
      ],
    };
    const result = redact(original);
    expect(JSON.stringify(result)).not.toContain('an@example.invalid');
    expect(JSON.stringify(result)).not.toContain('0901234567');
    expect(original.workExperiences[0].description).toContain(
      'an@example.invalid',
    );
    expect(result.workExperiences[0].startDate).toBe(startDate);
    expect(result.educations[0].major).toBe(original.educations[0].major);
  });
});
