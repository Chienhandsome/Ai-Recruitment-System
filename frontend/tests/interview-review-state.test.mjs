import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/recruiter/interviews/interview-review-state.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const stateModule = { exports: {} };
runInNewContext(compiled, { module: stateModule, exports: stateModule.exports, atob });
const { emptyReviewDraft, getReviewAverage, parseReviewDraft, reviewDraftKey, formatQuestionReviews } = stateModule.exports;
const plain = value => JSON.parse(JSON.stringify(value));
const now = 1_800_000_000_000;
const serialize = value => JSON.stringify({ savedAt: now, ...value });

test('ungraded answers and comments never manufacture an overall score', () => {
  assert.equal(getReviewAverage({}), null);
  assert.equal(getReviewAverage({ 1: { score: null, comment: 'Có dẫn chứng' } }), null);
  assert.equal(getReviewAverage({ 1: { score: 8, comment: '' }, 2: { score: null, comment: 'Chưa chấm' }, 3: { score: 5, comment: '' } }), 65);
});

test('restore preserves zero overall score and comment-only answers', () => {
  const result = parseReviewDraft(serialize({ ratings: { 1: { score: null, comment: 'Cần xem lại' }, 2: { score: 9, comment: '' } }, overallScore: 0, overallNote: 'Ghi chú tổng kết', viewed: [1, 2] }), [1, 2], now);
  assert.equal(result.overallScore, 0);
  assert.equal(result.ratings[1].score, null);
  assert.equal(result.ratings[2].score, 9);
  assert.equal(result.overallNote, 'Ghi chú tổng kết');
});

test('restore ignores removed questions and invalid numeric values', () => {
  const result = parseReviewDraft(serialize({ ratings: { 1: { score: 11, comment: '' }, 2: { score: '8', comment: '' }, 3: { score: 7.5, comment: '' }, 9: { score: 10, comment: '' } }, overallScore: 101, viewed: [1, 9, 1, '2'] }), [1, 2, 3], now);
  assert.deepEqual(plain(result.viewed), [1]);
  assert.equal(result.ratings[9], undefined);
  assert.equal(getReviewAverage(result.ratings), null);
  assert.equal(result.overallScore, null);
});

test('malformed, expired and future drafts safely start empty', () => {
  for (const raw of [null, 'broken', '{}', 'null', serialize({ savedAt: now - 8 * 86400000 }), serialize({ savedAt: now + 1 })]) {
    assert.deepEqual(plain(parseReviewDraft(raw, [1], now)), plain(emptyReviewDraft()));
  }
});

test('draft keys isolate reviewers and interviews without storing tokens', () => {
  const token = subject => `header.${Buffer.from(JSON.stringify({ sub: subject })).toString('base64url')}.signature`;
  const first = reviewDraftKey(token('hr-a'), 'session-a');
  assert.notEqual(first, reviewDraftKey(token('hr-b'), 'session-a'));
  assert.notEqual(first, reviewDraftKey(token('hr-a'), 'session-b'));
  assert.ok(!first.includes('signature'));
  assert.equal(reviewDraftKey('invalid', 'session-a'), null);
  assert.equal(reviewDraftKey('', 'ui-preview-only'), 'interview-review:v1:preview');
});

test('decision notes keep ungraded comments distinct from graded answers', () => {
  assert.equal(formatQuestionReviews({ 1: { score: null, comment: 'Chưa chấm điểm' }, 2: { score: 7, comment: 'Đúng trọng tâm' } }), '• Câu 1: Chưa chấm - Chưa chấm điểm\n• Câu 2: 7/10 đ - Đúng trọng tâm');
});
