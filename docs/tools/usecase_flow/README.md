# Công cụ sơ đồ và kiểm tra Use Case SmartRecruit AI

Bộ công cụ này hỗ trợ nguồn Use Case SmartRecruit AI trong `docs/usecase_spec/`. Mã UC có tiền tố module, ví dụ `AUTH-UC-001`, `CV-UC-001`, `APP-UC-001` và `BILL-UC-001`.

## Dùng nhanh

Chạy từ thư mục gốc repository:

```powershell
python docs/tools/usecase_flow/build.py list
python docs/tools/usecase_flow/build.py check
python docs/tools/usecase_flow/build.py build CV-UC-001
python docs/tools/usecase_flow/build.py build resumes
python docs/tools/usecase_flow/build.py build
```

- `list`: liệt kê Use Case và trạng thái file Markdown/Activity/Sequence đã có.
- `check`: kiểm tra format Use Case, mã tham chiếu và cú pháp các file sơ đồ; không ghi vào thư mục đầu ra.
- `build`: sinh sơ đồ và DOCX cho một/một số UC, một module, hoặc toàn bộ nguồn.
- `--no-png`: chỉ sinh draw.io và SVG, không cần Playwright/Chromium.
- `--only diagrams`: chỉ sinh sơ đồ; `--only docx`: chỉ xuất DOCX từ Markdown và ảnh đã sinh trước đó.

Đầu ra được đặt tại `docs/build/usecase-flow/<module>/<UC-ID>/`: sơ đồ draw.io/SVG/PNG và DOCX cùng mã UC. Không sửa tay các file sinh ra; chỉnh nguồn Markdown, `.act` hoặc `.seq` rồi build lại.

## Cấu trúc nguồn được hỗ trợ

```text
docs/usecase_spec/
  <module>/
    <feature>/README.md
    <feature>/rules.md
    <feature>/use-cases/<MODULE>-UC-<NNN>_<slug>.md
    <feature>/diagrams/<MODULE>-UC-<NNN>_activity.act
    <feature>/diagrams/<MODULE>-UC-<NNN>_sequence.seq
```

Tìm file theo tên và mã Use Case, không cố định độ sâu thư mục. Mỗi UC chỉ có tối đa một nguồn `.md`, `.act` và `.seq` trong một module. Prefix module và thư mục sở hữu phải khớp quy ước trong `docs/usecase_spec/CONVENTIONS.md`.

Tầng `<feature>/` là tùy chọn. Mẫu hiện có nằm trực tiếp ở `resumes/use-cases/` và `resumes/diagrams/`. Danh mục prefix/thư mục nằm trong [00-module.md](../../usecase_spec/00-module.md), đồng bộ với `PREFIX_TO_MODULE` trong `build.py`. Prefix chưa đăng ký hoặc đặt sai module sẽ bị báo lỗi. `list` chỉ liệt kê file thực tế, không liệt kê UC mới đăng ký trong danh mục.

## Kiểm tra nội dung

`check` kiểm tra cấu trúc Markdown, thứ tự bước chính, nhãn các mục bắt buộc, mã tham chiếu BR/UC, mã trùng và cú pháp sơ đồ. Nó không xác nhận rằng sơ đồ diễn đạt đúng nghiệp vụ trong UC; phần đó cần người rà soát.

`build` kiểm tra các UC được chọn trước khi tạo đầu ra; nguồn không hợp lệ sẽ dừng build. UC đang viết dở có thể thiếu loại nguồn; xem cột `md/act/seq` ở `list` để biết thành phần còn thiếu.

Nguồn sơ đồ dùng cú pháp tại [diagram_gen/SYNTAX.md](diagram_gen/SYNTAX.md). Có thể chạy riêng `actgen.py` hoặc `seqgen.py`; xem hướng dẫn đầu file và cú pháp tương ứng.

## Cài đặt

- Python 3.10 trở lên; công cụ kiểm tra và sinh draw.io/SVG dùng thư viện chuẩn.
- Xuất DOCX cần `python-docx`: `pip install python-docx`.
- Xuất PNG cần `playwright` và Chromium. Nếu thiếu, lệnh build vẫn sinh draw.io/SVG và thông báo bỏ qua PNG.

```powershell
python -m pip install python-docx playwright
python -m playwright install chromium
```

Nếu Windows chỉ có alias `python` của Microsoft Store, dùng đường dẫn Python thật hoặc `py -3` khi đã cài interpreter. Không cần cài dependency của backend/AI service để kiểm tra sơ đồ.

Kiểm tra hồi quy công cụ: `python -m unittest discover -s docs/tools/usecase_flow -p "test_*.py"`.

## Giới hạn

- Không sinh sơ đồ tự động từ business rule hoặc nội dung Use Case; người viết tạo nguồn `.act`/`.seq`.
- Không kiểm tra ngữ nghĩa hoặc tính nhất quán nghiệp vụ giữa rule, UC và sơ đồ.
- DOCX theo template hiện tại là đầu ra từng UC riêng lẻ; chưa gộp nhiều UC vào một tài liệu.
