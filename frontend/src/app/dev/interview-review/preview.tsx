'use client';

import { useState } from 'react';
import { AiInterviewReviewModal } from '@/components/recruiter/interviews/AiInterviewReviewModal';
import type { AiInterviewSession } from '@/lib/interview-api';

const timestamp = '2026-10-29T03:00:00.000Z';
const questions = [
  ['Bạn hãy giới thiệu bản thân và kinh nghiệm phát triển frontend của mình.', 'Giao tiếp', 'Em có ba năm kinh nghiệm phát triển ứng dụng web với React và TypeScript. Trong dự án gần nhất, em phụ trách xây dựng giao diện tuyển dụng, tối ưu hiệu năng và phối hợp với đội thiết kế để cải thiện trải nghiệm người dùng.'],
  ['Bạn sẽ xử lý thế nào khi một trang React tải chậm?', 'Kỹ thuật React', 'Em sẽ dùng React Profiler và công cụ Performance để xác định nguyên nhân. Sau đó em kiểm tra các lần render không cần thiết, chia nhỏ bundle và tối ưu việc tải dữ liệu, hình ảnh.'],
  ['Hãy kể về một lần bạn giải quyết bất đồng trong nhóm.', 'Làm việc nhóm', 'Em cùng đồng nghiệp thống nhất mục tiêu, so sánh các phương án bằng một bản thử nghiệm nhỏ và trao đổi dựa trên kết quả đo được.'],
  ['Bạn tổ chức kiểm thử giao diện như thế nào?', 'Chất lượng phần mềm', 'Em ưu tiên kiểm thử các luồng quan trọng của người dùng, kiểm tra khả năng truy cập và xác nhận giao diện hoạt động trên các kích thước màn hình khác nhau.'],
  ['Bạn mong muốn phát triển như thế nào trong hai năm tới?', 'Định hướng nghề nghiệp', 'Em muốn nâng cao kiến thức kiến trúc frontend và có thể hướng dẫn các thành viên mới trong nhóm.'],
];
const session: AiInterviewSession = {
  id: 'ui-preview-only', applicationId: 'ui-preview-only', interviewServiceId: 'ui-preview-only',
  status: 'COMPLETED', launchUrl: '', expiresAt: timestamp,
  startedAt: timestamp, completedAt: timestamp, createdAt: timestamp, updatedAt: timestamp,
  videos: [], securityEvents: [],
  transcript: questions.map(([text, competency, transcript], index) => ({
    question: { number: index + 1, text, competency, source: 'opening' },
    transcript, answered_at: timestamp,
  })),
};

export default function InterviewReviewPreview() {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState('review');
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <p className="mb-4 text-sm text-slate-600">Xem thử UI hiện tại · Dữ liệu mẫu · Chưa có video thật</p>
      <label htmlFor="preview-mode" className="mr-3 text-sm">Trạng thái xem thử</label>
      <select id="preview-mode" className="mr-3 rounded-lg border border-slate-300 bg-white p-2" value={mode} onChange={event => setMode(event.target.value)}>
        <option value="review">Đang đánh giá</option>
        <option value="readonly">Chỉ xem lại</option>
        <option value="empty">Chưa có câu trả lời</option>
      </select>
      <button className="rounded-lg bg-blue-600 px-4 py-2 text-white" onClick={() => setOpen(true)}>Mở lại màn hình đánh giá phỏng vấn</button>
      <AiInterviewReviewModal isOpen={open} onClose={() => setOpen(false)} token="" session={mode === 'empty' ? { ...session, id: 'ui-preview-empty', transcript: [] } : session}
        candidateName="Nguyễn Minh Anh (dữ liệu mẫu)" jobTitle="Frontend Developer"
        roundTitle="Vòng 1 · Phỏng vấn online AI" canDecide={mode !== 'readonly'} />
    </main>
  );
}
