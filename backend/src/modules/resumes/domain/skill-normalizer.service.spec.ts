import { SkillNormalizerService } from './skill-normalizer.service';

describe('SkillNormalizerService', () => {
  const normalizer = new SkillNormalizerService();

  it.each([
    ['C++', 'c-plus-plus'],
    ['C#', 'c-sharp'],
    ['Node.js', 'node-dot-js'],
    ['Quản lý dự án', 'quan-ly-du-an'],
  ])('normalizes %s without technical-name collisions', (input, expected) => {
    expect(normalizer.normalize(input)).toBe(expected);
  });

  it('keeps C++ and C# distinct', () => {
    expect(normalizer.normalize('C++')).not.toBe(normalizer.normalize('C#'));
  });
});
