import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_POLICIES = [
  {
    code: 'TERMS_OF_SERVICE',
    title: 'Điều Khoản Dịch Vụ Nền Tảng (Terms of Service)',
    description: 'Quy định quyền, nghĩa vụ và trách nhiệm của các bên khi tham gia nền tảng tuyển dụng.',
    content: `## 1. GIỚI THIỆU VÀ PHẠM VI ÁP DỤNG
Chào mừng bạn đến với Hệ thống Tuyển dụng AI (AI Recruitment System). Nền tảng đóng vai trò làm trung gian công nghệ kết nối Nhà tuyển dụng (Doanh nghiệp) và Ứng viên (Người tìm việc), đồng thời cung cấp các công cụ hỗ trợ phỏng vấn AI, quản lý thư mời nhận việc (Offer) và số hóa vòng đời Hợp đồng lao động.

Bằng việc đăng ký tài khoản hoặc sử dụng dịch vụ, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ toàn bộ các điều khoản này.

---

## 2. QUYỀN VÀ TRÁCH NHIỆM CỦA CÁC BÊN
### 2.1. Đối với Nhà tuyển dụng:
- **Cam kết thông tin trung thực:** Mọi thông tin tuyển dụng (chức danh, mức lương, yêu cầu công việc, địa điểm làm việc) phải được cung cấp chính xác, không gây hiểu nhầm.
- **Nghiêm cấm thu phí:** Tuyệt đối không thu bất kỳ khoản tiền nào từ ứng viên dưới bất kỳ hình thức nào (phí nộp đơn, tiền đặt cọc, đồng phục, phí phỏng vấn).
- **Tính ràng buộc của Thư mời nhận việc (Offer):** Sau khi phát hành Offer trên hệ thống và ứng viên chấp nhận, Doanh nghiệp có trách nhiệm ký kết hợp đồng theo đúng các điều khoản đã cam kết.

### 2.2. Đối với Ứng viên:
- **Tính xác thực của hồ sơ:** Cung cấp thông tin bằng cấp, kinh nghiệm và kỹ năng trung thực trên CV và hồ sơ cá nhân.
- **Tôn trọng cam kết:** Khi đã xác nhận Thư mời nhận việc (Accept Offer), ứng viên có trách nhiệm thực hiện bàn giao việc cũ và nhận việc đúng ngày thỏa thuận, hoặc thông báo kịp thời cho nhà tuyển dụng nếu có lý do bất khả kháng.

### 2.3. Đối với Nền tảng (Admin):
- **Vai trò trung gian công nghệ:** Nền tảng cung cấp hạ tầng kết nối, thuật toán gợi ý AI và lưu trữ thông điệp dữ liệu điện tử. Nền tảng không phải là bên trực tiếp ký kết hợp đồng lao động và không chịu trách nhiệm thay cho nghĩa vụ tài chính/tiền lương giữa hai bên ngoài đời thực.
- **Lưu trữ bằng chứng đối soát (Audit Trail):** Nền tảng lưu trữ toàn vẹn lịch sử giao dịch (Offer, Hợp đồng, nhật ký ký số) để cung cấp cho các bên hoặc cơ quan nhà nước có thẩm quyền khi có yêu cầu giải quyết tranh chấp.

---

## 3. CHẾ TÀI XỬ LÝ VI PHẠM
Quản trị viên (Admin) có toàn quyền áp dụng các biện pháp chế tài sau đối với các tài khoản vi phạm quy chế:
1. **Cảnh cáo và hạ điểm uy tín:** Đối với các hành vi chậm trễ phản hồi hoặc hủy offer không lý do chính đáng.
2. **Tạm dừng tin tuyển dụng (PAUSED):** Đóng băng tin tuyển dụng đang có tranh chấp để xác minh.
3. **Khóa tài khoản vĩnh viễn (LOCKED):** Áp dụng ngay lập tức đối với các hành vi lừa đảo, thu phí người tìm việc trái phép, hoặc giả mạo pháp nhân doanh nghiệp.
4. **Bàn giao cơ quan điều tra:** Trong các trường hợp có dấu hiệu cấu thành tội phạm lừa đảo chiếm đoạt tài sản theo pháp luật Việt Nam.`,
  },
  {
    code: 'PRIVACY_POLICY',
    title: 'Chính Sách Bảo Mật & Quyền Riêng Tư Dữ Liệu (Privacy Policy)',
    description: 'Quy chuẩn thu thập, mã hóa và xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP và Đạo đức AI.',
    content: `## 1. NGUYÊN TẮC BẢO VỆ DỮ LIỆU CÁ NHÂN
Hệ thống cam kết tuân thủ nghiêm ngặt **Nghị định 13/2023/NĐ-CP của Chính phủ về Bảo vệ dữ liệu cá nhân**. Mọi dữ liệu do Người dùng cung cấp đều được thu thập dựa trên sự đồng thuận và chỉ phục vụ mục đích tuyển dụng - tìm việc làm hợp pháp.

---

## 2. PHẠM VI DỮ LIỆU THU THẬP
1. **Thông tin định danh:** Họ và tên, ngày sinh, số điện thoại, email, địa chỉ liên hệ, số Căn cước công dân (chỉ thu thập khi hai bên bước vào giai đoạn tạo Hợp đồng lao động).
2. **Dữ liệu nghề nghiệp:** CV, lịch sử làm việc, bằng cấp, dự án, chứng chỉ nghề nghiệp.
3. **Dữ liệu phỏng vấn trực tuyến với AI:** Video ghi hình câu trả lời, bản ghi âm giọng nói, bản gỡ băng văn bản (transcript) và điểm phân tích năng lực.
4. **Dữ liệu giao dịch & nhật ký ký số:** Địa chỉ IP, dấu thời gian ký số (timestamp), ảnh chữ ký điện tử.

---

## 3. MỤC ĐÍCH SỬ DỤNG DỮ LIỆU VÀ CAM KẾT MINH BẠCH AI
- **Phân tích khớp lệnh AI:** Thuật toán chỉ phân tích độ tương đồng kỹ năng và kinh nghiệm giữa CV với Mô tả công việc (JD). Tuyệt đối không phân biệt đối xử dựa trên giới tính, vùng miền, tôn giáo hoặc ngoại hình.
- **Dữ liệu Video phỏng vấn AI:** Chỉ Nhà tuyển dụng phụ trách vị trí đó mới có quyền xem video phỏng vấn của ứng viên. Dữ liệu này không bao giờ được chia sẻ cho bên thứ ba hoặc sử dụng để huấn luyện mô hình công cộng khi chưa có sự cho phép.

---

## 4. QUYỀN CỦA CHỦ THỂ DỮ LIỆU
Người dùng có các quyền theo quy định pháp luật:
- **Quyền được biết và đồng thuận:** Được thông báo rõ ràng trước khi hệ thống thu thập thông tin.
- **Quyền chỉnh sửa và cập nhật:** Thay đổi thông tin cá nhân trên trang cá nhân bất kỳ lúc nào.
- **Quyền yêu cầu xóa dữ liệu (Right to be forgotten):** Ứng viên có quyền yêu cầu xóa CV và tài khoản khỏi hệ thống khi không còn nhu cầu tìm việc.`,
  },
  {
    code: 'RECRUITER_CODE_OF_CONDUCT',
    title: 'Quy Chuẩn Tuyển Dụng Dành Cho Nhà Tuyển Dụng (Recruiter Code of Conduct)',
    description: 'Quy tắc ứng xử và tiêu chuẩn đạo đức nghề nghiệp bắt buộc đối với tất cả doanh nghiệp trên nền tảng.',
    content: `## 1. MỤC ĐÍCH
Quy chuẩn này nhằm kiến tạo một môi trường tuyển dụng văn minh, bình đẳng, minh bạch và tôn trọng giá trị của người lao động.

---

## 2. NĂM NGUYÊN TẮC BẮT BUỘC
1. **Nói không với tin tuyển dụng "ảo":** Chỉ đăng tuyển các vị trí có nhu cầu tuyển dụng thực tế và ngân sách được phê duyệt.
2. **Minh bạch mức đãi ngộ:** Mức lương công bố trên tin tuyển dụng và trong Thư mời nhận việc (Offer) phải thể hiện đúng thực tế chi trả, bao gồm rõ ràng lương Gross/Net và các khoản bảo hiểm bắt buộc.
3. **Tôn trọng thời gian của ứng viên:** Phản hồi kết quả phỏng vấn rõ ràng và lịch sự. Không "ghost" (bặt vô âm tín) ứng viên sau khi đã hẹn ngày trả kết quả.
4. **Bảo mật hồ sơ ứng viên:** Không tiết lộ mức lương hiện tại hoặc thông tin cá nhân của ứng viên cho các phòng ban không liên quan hoặc đối thủ cạnh tranh.
5. **Thượng tôn pháp luật lao động:** Tuân thủ đúng các quy định về thời gian thử việc, tỷ lệ hưởng lương thử việc (tối thiểu 85%) và ký kết hợp đồng lao động theo Bộ luật Lao động 2019.

---

## 3. CƠ CHẾ GIÁM SÁT VÀ CHẾ TÀI
Hệ thống tích hợp công cụ đánh giá uy tín Nhà tuyển dụng (Trust Score) và kênh tố cáo tự động dành cho ứng viên. Mọi khiếu nại về hành vi sai phạm sẽ được Quản trị viên xử lý theo quy trình giải quyết tranh chấp trong vòng 24 - 48 giờ làm việc.`,
  },
  {
    code: 'CONTRACT_TERMS_TEMPLATE',
    title: 'Khung Điều Khoản Hợp Đồng Lao Động Chuẩn (Standard Labor Contract Baseline)',
    description: 'Các điều khoản luật định tối thiểu bắt buộc phải có trong mọi Hợp đồng lao động phát hành qua hệ thống.',
    content: `## 1. CĂN CỨ PHÁP LÝ BẮT BUỘC
Mọi bản Hợp đồng lao động phát hành thông qua hệ thống đều phải căn cứ theo:
- Bộ luật Lao động số 45/2019/QH14.
- Luật Bảo hiểm xã hội số 58/2014/QH13.
- Luật Giao dịch điện tử số 20/2023/QH15.

---

## 2. CÁC ĐIỀU KHOẢN LUẬT ĐỊNH KHÔNG THỂ BỊ CẮT GIẢM
1. **Thời gian làm việc:** Không quá 08 giờ trong 01 ngày và không quá 48 giờ trong 01 tuần đối với điều kiện làm việc bình thường.
2. **Chế độ thử việc:** Lương trong thời gian thử việc do hai bên thỏa thuận nhưng ít nhất phải bằng **85%** mức lương của công việc đó (Điều 26 BLLĐ 2019).
3. **Bảo hiểm bắt buộc:** Người sử dụng lao động và Người lao động phải tham gia Bảo hiểm xã hội, Bảo hiểm y tế, Bảo hiểm thất nghiệp theo đúng quy định pháp luật.
4. **Bảo hộ lao động & An toàn:** Doanh nghiệp có trách nhiệm trang bị đầy đủ phương tiện bảo vệ cá nhân và bảo đảm môi trường làm việc an toàn, vệ sinh lao động.
5. **Hiệu lực chữ ký điện tử:** Bản hợp đồng được ký điện tử có giá trị pháp lý như hợp đồng lao động bằng văn bản giấy căn cứ Điều 14 Bộ luật Lao động 2019.`,
  },
  {
    code: 'DISPUTE_POLICY',
    title: 'Quy Trình Tiếp Nhận & Giải Quyết Khiếu Nại (Dispute Resolution Policy)',
    description: 'Cơ chế trọng tài dữ liệu và các bước xử lý tranh chấp giữa Ứng viên và Doanh nghiệp.',
    content: `## 1. NGUYÊN TẮC GIẢI QUYẾT
Nền tảng đóng vai trò làm trung gian đối soát khách quan, căn cứ trên lịch sử hệ thống (Audit Trail, bản ghi Offer gốc, lịch sử chỉnh sửa Hợp đồng và nhật ký ký kết có dấu thời gian).

---

## 2. QUY TRÌNH BỐN BƯỚC
1. **Bước 1 - Gửi khiếu nại (Filing):** Người dùng bấm nút "Báo cáo vi phạm" trên thẻ Offer/Hợp đồng, chọn phân loại vi phạm và cung cấp mô tả/ảnh chụp bằng chứng.
2. **Bước 2 - Đóng băng & Xác minh (Investigation):** Quản trị viên (Admin) tiếp nhận hồ sơ trong 24 giờ. Hệ thống tự động trích xuất bảng đối chiếu dữ liệu (Offer vs Contract).
3. **Bước 3 - Yêu cầu giải trình (Clarification):** Admin gửi thông báo yêu cầu bên bị tố cáo phản hồi giải trình trong vòng 48 giờ.
4. **Bước 4 - Phán quyết & Chế tài (Resolution):**
   - Nếu vi phạm rõ ràng: Admin khóa tài khoản bên vi phạm, hỗ trợ người bị hại xuất Biên bản chứng nhận điện tử để nộp cho cơ quan chức năng.
   - Nếu không đủ căn cứ: Admin giải thích rõ ràng và đóng hồ sơ khiếu nại.`,
  },
];

async function main() {
  console.log('--- SEEDING SYSTEM POLICIES ---');
  for (const policy of DEFAULT_POLICIES) {
    const upserted = await prisma.systemPolicy.upsert({
      where: { code: policy.code },
      create: {
        code: policy.code,
        title: policy.title,
        description: policy.description,
        content: policy.content,
        version: 1,
        isPublished: true,
      },
      update: {
        title: policy.title,
        description: policy.description,
        content: policy.content,
      },
    });
    console.log(`✓ Seeded policy: ${upserted.code} (${upserted.title})`);
  }
  console.log('--- FINISHED SEEDING POLICIES ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
