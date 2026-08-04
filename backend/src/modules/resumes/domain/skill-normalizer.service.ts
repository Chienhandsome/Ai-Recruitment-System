import { Injectable } from '@nestjs/common';
import { normalizeSkillName } from '../../../common/skill-name.util';

@Injectable()
export class SkillNormalizerService {
  normalize(name: string): string {
    return normalizeSkillName(name);
  }
}
