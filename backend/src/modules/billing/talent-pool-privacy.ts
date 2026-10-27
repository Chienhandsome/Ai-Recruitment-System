const HIDDEN_CONTACT = '[Đã ẩn thông tin liên hệ]';
const HIDDEN_NAME = '[Ứng viên]';

type TalentIdentity = {
  fullName: string;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Redact only response copies; the candidate's stored content remains intact. */
export function talentPoolRedactor(identity: TalentIdentity) {
  const knownLinks = [
    identity.linkedinUrl,
    identity.githubUrl,
    identity.portfolioUrl,
  ]
    .filter((value): value is string => !!value?.trim())
    .map((value) =>
      value
        .trim()
        .normalize('NFKC')
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/+$/, ''),
    )
    .filter(Boolean)
    .map(
      (value) =>
        new RegExp(`(?:https?:\\/\\/)?(?:www\\.)?${escapeRegex(value)}`, 'giu'),
    );
  const digits = identity.phone?.replace(/\D/g, '');
  const knownPhone =
    digits && digits.length >= 7
      ? new RegExp(
          `(?<!\\d)${digits.split('').join('[\\s.()\\-]*')}(?!\\d)`,
          'g',
        )
      : null;
  const name = identity.fullName.trim().normalize('NFKC');
  const knownName =
    name.length >= 2
      ? new RegExp(
          `(?<![\\p{L}\\p{N}])${name.split(/\s+/).map(escapeRegex).join('\\s+')}(?![\\p{L}\\p{N}])`,
          'giu',
        )
      : null;

  function redact(text: string): string {
    let value = text.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');
    // Schemes and profile links may reveal identity even without an email.
    value = value.replace(/(?:mailto|tel):[^\s<>"']+/giu, HIDDEN_CONTACT);
    value = value.replace(/(?:https?:\/\/|www\.)[^\s<>"']+/giu, HIDDEN_CONTACT);
    for (const link of knownLinks) value = value.replace(link, HIDDEN_CONTACT);
    value = value.replace(
      /(?<![\p{L}\p{N}])(?:linkedin\.com|github\.com|facebook\.com|fb\.com|zalo\.me|t\.me|behance\.net|dribbble\.com)(?:\/[^\s<>"']*)?/giu,
      HIDDEN_CONTACT,
    );
    value = value.replace(
      /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/giu,
      HIDDEN_CONTACT,
    );
    if (knownPhone) value = value.replace(knownPhone, HIDDEN_CONTACT);
    // Vietnamese mobile/landline formats, with common display separators.
    value = value.replace(
      /(?<![\p{L}\p{N}])(?:\+?84[\s.()-]*|0[\s.()-]*)[235789](?:[\s.()-]*\d){8,9}(?!\d)/gu,
      HIDDEN_CONTACT,
    );
    value = value.replace(
      /(?<![\p{L}\p{N}])\+\d(?:[\s.()-]*\d){7,14}(?!\d)/gu,
      HIDDEN_CONTACT,
    );
    if (knownName) value = value.replace(knownName, HIDDEN_NAME);
    return value;
  }

  function publicValue<T>(value: T): T {
    if (typeof value === 'string') return redact(value) as T;
    if (Array.isArray(value))
      return value.map((item: unknown) => publicValue(item)) as T;
    if (
      value &&
      typeof value === 'object' &&
      Object.getPrototypeOf(value) === Object.prototype
    ) {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]: [string, unknown]) => [
          key,
          // Identifiers and dates are structural data, not candidate prose.
          /^(?:id|.*Id|startDate|endDate|createdAt|updatedAt)$/.test(key)
            ? item
            : publicValue(item),
        ]),
      ) as T;
    }
    return value;
  }
  return publicValue;
}
