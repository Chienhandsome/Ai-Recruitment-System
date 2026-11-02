# Chuẩn viết Use Case — SmartRecruit AI

Quy ước mã và trạng thái theo [CONVENTIONS.md](CONVENTIONS.md); phạm vi theo [00-module.md](00-module.md).

## 1. Vị trí và tên file

Nguồn nằm tại `docs/usecase_spec/<module>/use-cases/<MODULE>-UC-<NNN>_<slug>.md`. Có thể thêm tầng feature khi cần. Mỗi mã chỉ có một Markdown, một Activity và một Sequence. Sơ đồ đặt trong `diagrams/` cùng module/feature, ví dụ `CV-UC-001_activity.act` và `CV-UC-001_sequence.seq`.

## 2. Cấu trúc bắt buộc

Giữ nguyên heading và sáu nhãn trường để tool đọc được. Thay actor trong bảng theo UC thực tế.

```markdown
### CV-UC-001_Tải CV để phân tích hồ sơ

### Mô tả use case CV-UC-001

| Trường | Nội dung |
|---|---|
| Use case: | CV-UC-001_Tải CV để phân tích hồ sơ |
| Mục đích: | ... |
| Mô tả: | ... |
| Actor: | Ứng viên |
| Tiền điều kiện: | ... |
| Hậu điều kiện: | ... |

### Luồng sự kiện chính

| Ứng viên | Hệ thống |
|---|---|
| 1. ... | 2. ... |

### Luồng sự kiện phụ

| Ứng viên | Hệ thống |
|---|---|
| | 2.1. Nếu ..., hệ thống ...; kết thúc UC |

### Biểu đồ

Activity: `../diagrams/CV-UC-001_activity.act`

Sequence: `../diagrams/CV-UC-001_sequence.seq`
```

## 3. Thông tin UC

- **Use case:** mã/tên khớp danh mục.
- **Mục đích:** kết quả actor muốn đạt.
- **Mô tả:** ranh giới tương tác và tham chiếu rule; không chép toàn bộ chính sách.
- **Actor:** actor chính, actor phụ/hệ thống ngoài nếu trực tiếp tham gia.
- **Tiền điều kiện:** điều kiện phải đúng khi bắt đầu, ví dụ phiên đăng nhập và hồ sơ ứng viên tồn tại. Kiểm tra trong luồng không mặc nhiên là tiền điều kiện.
- **Hậu điều kiện:** kết quả thành công của đúng phạm vi UC. Upload được lưu/chờ xử lý không đồng nghĩa AI đã phân tích xong; điểm AI không đồng nghĩa quyết định tuyển dụng.

Nhiều điều kiện trong một ô dùng `<br>`, không bullet. Không ghi OQ chưa quyết định thành hậu điều kiện chắc chắn.

## 4. Luồng chính, thay thế và lỗi

- Hai cột actor chính và `Hệ thống`; bước chính đánh số liên tục từ 1 khi đọc từng hàng từ trái sang phải. Ô không có hành động để trống.
- Mỗi bước nêu hành động/phản hồi hoặc thay đổi nghiệp vụ rõ ràng. Luồng chính phải đạt hậu điều kiện.
- Nhánh rẽ dùng `N.1`, `N.2`; bước con dùng `N.1.1`, `N.1.2`. N phải là bước chính có thật. Ghi điều kiện, phản hồi và nơi quay lại/kết thúc.
- Chọn lỗi theo code của UC: dữ liệu không hợp lệ, phiên hết hạn, sai phạm vi sở hữu, CV chưa sẵn sàng, tin hết hạn/hạn mức, ứng tuyển trùng, chuyển giai đoạn sai, dịch vụ ngoài không phản hồi.
- Với tác vụ nền, mô tả rõ trạng thái chờ, kết quả thành công/thất bại, retry và kết quả đến muộn khi có căn cứ. Nếu UC kết thúc khi yêu cầu được tiếp nhận, không kéo hậu điều kiện sang lúc worker hoàn thành.
- Không tự đặt chính sách hoàn tiền, hạn mức, số vòng, thời hạn hay công thức điểm. Ghi nguồn service/policy hiện tại; phần chưa rõ thành OQ.

## 5. Tham chiếu và truy vết

Dùng `{{ref: BR-CV-001}}`, `{{ref: BR-SRA-001}}`, `{{ref: APP-UC-001}}` ở cuối câu/ô. Rule phải được định nghĩa trong `00-module.md` hoặc `rules.md`; UC có trong danh mục hoặc có file nguồn. Không dùng tham chiếu thay cho nội dung bước. Nguồn code và test ghi trong README/rules module để không làm bảng UC khó đọc.

## 6. Activity và Sequence

### Activity

Dùng hai lane mặc định: actor chính (`Ứng viên`, `Nhà tuyển dụng` hoặc `Quản trị viên`) và `Hệ thống`. Backend, database, RabbitMQ, AI worker và subsystem nội bộ gộp vào hệ thống. Mọi quyết định/điểm kết thúc phải khớp nhánh UC. Nếu xử lý nền xảy ra sau khi UC kết thúc, thể hiện trong UC theo dõi kết quả hoặc tài liệu pipeline liên quan.

### Sequence

- `actor`: người dùng hoặc hệ thống ngoài; `boundary`: Next.js/Interview Web; `control`: service nghiệp vụ/subsystem/adapter; `entity`: Prisma/repository/adapter lưu trữ.
- Chỉ đưa participant thực sự tham gia. Dùng tên thành phần hiện có; không tự thêm DAO/lớp Java hoặc MySQL vào kiến trúc NestJS/Prisma/PostgreSQL.
- Supabase Auth là dịch vụ xác thực bên ngoài; AI worker và RabbitMQ là xử lý nội bộ. Interview Service có API/callback riêng. Endpoint hoặc event chỉ ghi khi đối chiếu code.
- Phân biệt gửi yêu cầu, phản hồi tiếp nhận và kết quả bất đồng bộ. Với PayOS, không lấy redirect trình duyệt làm bằng chứng đã thanh toán; mô tả xác minh webhook/đồng bộ trạng thái theo code. Với callback phỏng vấn AI, đối chiếu xác minh chữ ký và xử lý lặp trong service.
- DSL chỉ hỗ trợ `alt/else/end`, `loop/end` cùng message gọi/trả về, không có `par/async/opt` hay self-message; dùng nhãn để diễn đạt giới hạn này. Xem [SYNTAX.md](../tools/usecase_flow/diagram_gen/SYNTAX.md).

## 7. Checklist

- [ ] Mục tiêu, actor, mã và module có trong danh mục; nguồn code truy vết được.
- [ ] Tiền/hậu điều kiện khớp phạm vi đồng bộ hoặc bất đồng bộ.
- [ ] Luồng chính có kết quả thành công; nhánh lỗi có điểm tiếp tục/kết thúc.
- [ ] Quyền truy cập, phạm vi sở hữu và trạng thái được đối chiếu service/guard.
- [ ] Rule/UC tham chiếu có nguồn; không biến OQ hoặc scaffold thành chức năng đã có.
- [ ] Activity và Sequence cùng nhánh với UC và đúng kiến trúc hiện tại.
- [ ] `build.py check` thành công; đã rà nghiệp vụ riêng vì tool chỉ kiểm tra cấu trúc/cú pháp.
