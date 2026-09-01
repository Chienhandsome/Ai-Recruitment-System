import json
from datetime import datetime
from app.services.matching.matching_engine import matching_engine
from app.schemas.matching import (
    EvaluationRequest, JobPayload, CandidateProfilePayload,
    JobRequiredSkill, WorkExperience, Education, CandidateSkill, ProfileDetail
)

# 1. Define Area Sales Manager Job Payload
job = JobPayload(
    title="Quản Lý Kinh Doanh Khu Vực (Area Sales Manager - ASM)",
    description="Chịu trách nhiệm toàn diện về doanh số, thị phần và độ phủ kênh phân phối ngành hàng FMCG / F&B. Quản lý, giám sát và huấn luyện đội ngũ Giám sát bán hàng (SS) và Đại diện thương mại (SR). Thiết lập, đàm phán và phát triển mạng lưới Nhà phân phối (NPP), đại lý cấp 1 và kênh Horeca / Foodservice.",
    requirements="Tối thiểu 5 năm kinh nghiệm quản lý kinh doanh khu vực ngành hàng tiêu dùng nhanh (FMCG), F&B hoặc thực phẩm/đồ uống. Tối thiểu 5 năm kinh nghiệm quản lý đội ngũ từ 10 nhân sự trở lên. Tốt nghiệp Đại học trở lên.",
    experience_level="MANAGER",
    required_experience_years=5.0,
    required_skills=[
        JobRequiredSkill(skill_name="Quản lý Đội ngũ Sales & Giám sát Địa bàn (Sales Team Management & Territory Leadership)", is_mandatory=True, minimum_years=5.0, minimum_level="ADVANCED"),
        JobRequiredSkill(skill_name="Phát triển Mạng lưới Nhà phân phối & Đại lý (Distributor & Channel Management)", is_mandatory=True, minimum_years=4.0, minimum_level="ADVANCED"),
        JobRequiredSkill(skill_name="Quản trị Doanh số & Hoạch định Dự báo (Sales Target & Revenue Forecasting)", is_mandatory=True, minimum_years=4.0, minimum_level="ADVANCED"),
        JobRequiredSkill(skill_name="Khai thác Thị trường Horeca & Foodservice (Horeca & Foodservice Market Penetration)", is_mandatory=True, minimum_years=3.0, minimum_level="INTERMEDIATE"),
        JobRequiredSkill(skill_name="Đàm phán Điều khoản Thương mại & Key Account (Commercial Negotiation & Key Accounts)", is_mandatory=True, minimum_years=4.0, minimum_level="ADVANCED"),
        JobRequiredSkill(skill_name="Huấn luyện & Phát triển Năng lực Bán hàng (Sales Coaching & Field Training)", is_mandatory=False, minimum_years=3.0, minimum_level="INTERMEDIATE"),
        JobRequiredSkill(skill_name="Phân tích Thị trường & Nghiên cứu Đối thủ (Market Analysis & Competitor Intelligence)", is_mandatory=False, minimum_years=2.0, minimum_level="INTERMEDIATE"),
        JobRequiredSkill(skill_name="Hoạch định Chiến lược Kinh doanh Khu vực (Area Business Planning & Execution)", is_mandatory=False, minimum_years=3.0, minimum_level="ADVANCED")
    ]
)

# 2. Define All 10 Candidates
candidates = [
    # CANDIDATE 01 — TRUE EXCELLENT MATCH
    {
        "code": "CANDIDATE-01",
        "name": "Vũ Minh Đức",
        "archetype": "True Excellent Match",
        "expected": "HIGH",
        "payload": CandidateProfilePayload(
            profile=ProfileDetail(
                desired_title="Area Sales Manager (ASM) - FMCG",
                professional_summary="Hơn 11 năm kinh nghiệm quản lý kinh doanh ngành hàng tiêu dùng nhanh (FMCG) và F&B. 7 năm giữ vị trí Area Sales Manager quản lý địa bàn Đông Nam Bộ với 24 nhân sự. Chuyên sâu phát triển kênh phân phối truyền thống (GT), Horeca, đàm phán hợp đồng NPP và quản trị mục tiêu doanh số 130 tỷ/năm."
            ),
            skills=[
                CandidateSkill(skill_name="Quản lý Đội ngũ Sales & Giám sát Địa bàn", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Phát triển Mạng lưới Nhà phân phối & Đại lý", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Quản trị Doanh số & Hoạch định Dự báo", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Khai thác Thị trường Horeca & Foodservice", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Đàm phán Điều khoản Thương mại & Key Account", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Huấn luyện & Phát triển Năng lực Bán hàng", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Phân tích Thị trường & Nghiên cứu Đối thủ", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Hoạch định Chiến lược Kinh doanh Khu vực", proficiency_level="EXPERT"),
            ],
            work_experiences=[
                WorkExperience(
                    company_name="Tập đoàn Masan Consumer",
                    position_title="Area Sales Manager (Quản lý Kinh doanh Khu vực Đông Nam Bộ)",
                    start_date="2019-01-01",
                    is_current=True,
                    description="Quản lý toàn diện hoạt động kinh doanh ngành hàng thực phẩm & gia vị tại Đồng Nai, Bình Dương, Bà Rịa - Vũng Tàu. Lãnh đạo trực tiếp đội ngũ 24 nhân sự gồm 4 Sales Supervisors và 20 Sales Representatives. Phát triển và quản trị mạng lưới 8 Nhà phân phối cấp 1 và hơn 450 điểm bán lẻ/Horeca. Lập kế hoạch doanh số, dự báo sản lượng và đàm phán chính sách thương mại hàng năm.",
                    achievements="Đạt 115% chỉ tiêu doanh số năm 2023 với doanh thu 130 tỷ VND. Mở rộng thêm 2 NPP cấp 1 mới và tăng độ phủ kênh Horeca lên 35%."
                ),
                WorkExperience(
                    company_name="Suntory PepsiCo Vietnam Beverage",
                    position_title="Sales Supervisor (Giám sát Bán hàng Khu vực TP.HCM)",
                    start_date="2015-06-01",
                    end_date="2018-12-31",
                    description="Giám sát đội ngũ 12 Sales Reps kênh General Trade (GT) tại khu vực TP.HCM. Đào tạo kỹ năng bán hàng thực địa, theo dõi tồn kho và thúc đẩy sell-out.",
                    achievements="Đạt giải Giám sát Bán hàng Xuất sắc nhất vùng Đông Nam Bộ năm 2017."
                )
            ],
            educations=[
                Education(school_name="Đại học Kinh tế TP.HCM (UEH)", degree="Cử nhân", major="Quản trị Kinh doanh Thương mại (Business Administration)", start_date="2010-09-01", end_date="2014-06-30")
            ]
        )
    },

    # CANDIDATE 02 — STRONG SEMANTIC MATCH
    {
        "code": "CANDIDATE-02",
        "name": "Lê Hoàng Long",
        "archetype": "Strong Semantic Match",
        "expected": "HIGH",
        "payload": CandidateProfilePayload(
            profile=ProfileDetail(
                desired_title="Trưởng Đại Diện Thương Mại & Điều Hành Thị Trường Tiêu Dùng",
                professional_summary="Hơn 10 năm chỉ đạo và điều tiết mạng lưới lưu thông sản phẩm tiêu dùng thực phẩm đóng gói. Từng dẫn dắt tổ hợp hơn 20 chuyên viên thương mại thực địa tại miền Nam. Chuyên sâu về cơ chế quản trị đối tác bán buôn cấp tỉnh, cân đối dòng hàng xuất - nhập điểm bán, giải phóng tồn đọng kho bãi và thiết lập hợp đồng cung ứng dài hạn cho hệ thống dịch vụ ẩm thực lưu trú."
            ),
            skills=[
                CandidateSkill(skill_name="Chỉ đạo & Huấn luyện Nhân sự Thương mại Thực địa", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Quản trị Mạng lưới Cung ứng Thương mại Cấp tỉnh", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Lập Dự toán Nhu cầu Sản lượng & Kế hoạch Tiêu thụ Mùa vụ", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Phát triển Đối tác Chuỗi Nhà hàng & Suất ăn Công nghiệp", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Thương thảo Điều khoản Mua bán Buôn & Hợp đồng Phân phối", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Tối ưu hóa Chuỗi Điểm Bán lẻ & Giải phóng Tồn kho", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Khảo sát Động thái Đối thủ & Xu hướng Tiêu dùng Thực phẩm", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Xây dựng & Thực thi Kế hoạch Bán hàng Địa bàn Trọng điểm", proficiency_level="EXPERT"),
            ],
            work_experiences=[
                WorkExperience(
                    company_name="Tập đoàn Thực phẩm & Gia vị Nam Dương (ND Food Group)",
                    position_title="Trưởng Đại diện Kinh doanh Khu vực Trọng điểm (Area Commercial Lead)",
                    start_date="2019-07-01",
                    is_current=True,
                    description="Điều hành mạng lưới đại lý cấp 1 và đối tác phân phối độc quyền tại 5 tỉnh miền Đông, bảo đảm tính thông suốt của dòng luân chuyển hàng hóa thực phẩm. Giám sát trực tiếp 18 chuyên viên phát triển thị trường, thực hiện phân bổ chỉ tiêu doanh thu theo chu kỳ quý/năm và tổ chức đánh giá hiệu suất định kỳ. Xây dựng hạn mức nhập hàng (sell-in) và hỗ trợ giải phóng tồn kho điểm bán (sell-out) cho từng đơn vị trung gian. Trực tiếp tháp tùng nhân viên bán hàng tiếp cận các chuỗi nhà hàng, khu ẩm thực và đơn vị cung cấp suất ăn tập thể. Lập kế hoạch sản lượng tiêu thụ theo mùa vụ. Đi thị trường cùng nhân viên (field coaching).",
                    achievements="Tăng trưởng chỉ số tiêu thụ toàn vùng đạt 118% so với kế hoạch năm 2023, doanh thu thực thu 115 tỷ VND. Giảm tỷ lệ tồn kho ứ đọng tại kho tổng của các đại lý trung gian từ 21 ngày xuống còn 11 ngày. Phát triển thành công 135 cơ sở dịch vụ ăn uống và chuỗi nhà hàng."
                ),
                WorkExperience(
                    company_name="Công ty Cổ phần Thực phẩm Cholimex",
                    position_title="Giám sát Mạng lưới Thương mại Thực địa (Field Commercial Supervisor)",
                    start_date="2015-01-01",
                    end_date="2019-06-30",
                    description="Theo sát và hỗ trợ chuyên môn cho đội ngũ 10 nhân viên tiếp thị thực địa tại khu vực trung tâm TP.HCM và các quận lân cận. Khai mở các điểm phân phối thứ cấp, giải quyết khiếu nại về chính sách chiết khấu.",
                    achievements="Xây dựng thêm 120 điểm tiêu thụ mới tại các tuyến đường huyết mạch, hoàn thành 100% định mức tăng trưởng hàng năm."
                )
            ],
            educations=[
                Education(school_name="Trường Đại học Ngoại thương Cơ sở II TP.HCM", degree="Cử nhân", major="Kinh tế Quốc tế & Quản trị Kinh doanh Thương mại", start_date="2010-09-01", end_date="2014-06-30")
            ]
        )
    },

    # CANDIDATE 03 — KEYWORD STUFFING TRAP
    {
        "code": "CANDIDATE-03",
        "name": "Nguyễn Thùy Linh",
        "archetype": "Keyword Stuffing Trap",
        "expected": "LOW",
        "payload": CandidateProfilePayload(
            profile=ProfileDetail(
                desired_title="Area Sales Manager - FMCG / F&B",
                professional_summary="Chuyên gia Quản lý Đội ngũ Sales & Giám sát Địa bàn, Phát triển Mạng lưới Nhà phân phối & Đại lý, Quản trị Doanh số & Hoạch định Dự báo, Khai thác Thị trường Horeca & Foodservice, Đàm phán Điều khoản Thương mại & Key Account, Huấn luyện & Phát triển Năng lực Bán hàng, Phân tích Thị trường FMCG."
            ),
            skills=[
                CandidateSkill(skill_name="Quản lý Đội ngũ Sales & Giám sát Địa bàn (Sales Team Management & Territory Leadership)", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Phát triển Mạng lưới Nhà phân phối & Đại lý (Distributor & Channel Management)", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Quản trị Doanh số & Hoạch định Dự báo (Sales Target & Revenue Forecasting)", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Khai thác Thị trường Horeca & Foodservice (Horeca & Foodservice Market Penetration)", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Đàm phán Điều khoản Thương mại & Key Account (Commercial Negotiation & Key Accounts)", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Huấn luyện & Phát triển Năng lực Bán hàng (Sales Coaching & Field Training)", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Phân tích Thị trường & Nghiên cứu Đối thủ (Market Analysis & Competitor Intelligence)", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Hoạch định Chiến lược Kinh doanh Khu vực (Area Business Planning & Execution)", proficiency_level="EXPERT"),
            ],
            work_experiences=[
                WorkExperience(
                    company_name="Công ty TNHH Bánh kẹo Á Châu (ABC Bakery Supply)",
                    position_title="Sales Admin & Trợ lý Kinh doanh Kênh GT (Sales Administrator)",
                    start_date="2020-03-01",
                    is_current=True,
                    description="Nhập liệu đơn đặt hàng từ các đại lý vào phần mềm ERP SAP. Tổng hợp báo cáo doanh thu bán hàng hàng ngày cho Giám đốc bán hàng. Soạn thảo hợp đồng thương mại theo mẫu có sẵn của công ty. Nghe điện thoại tiếp nhận thắc mắc và khiếu nại của khách hàng, chuyển tiếp cho phòng ban liên quan.",
                    achievements="Nhập liệu chính xác 100% hơn 500 đơn hàng mỗi tháng, hoàn thành báo cáo ngày trước 17h30 đúng hạn."
                ),
                WorkExperience(
                    company_name="Công ty TNHH Nước giải khát Hướng Dương",
                    position_title="Nhân viên Telesales & Chăm sóc Khách hàng (Telesales Representative)",
                    start_date="2017-02-01",
                    end_date="2020-02-28",
                    description="Gọi điện thoại theo danh sách khách hàng có sẵn để chào bán các sản phẩm nước giải khát đóng chai. Ghi nhận đơn hàng trực tiếp qua điện thoại và gửi cho bộ phận kho xử lý đóng gói giao hàng.",
                    achievements="Đạt chỉ tiêu gọi 60 cuộc gọi/ngày và duy trì tỷ lệ chốt đơn đạt 8% trên tổng số cuộc gọi."
                )
            ],
            educations=[
                Education(school_name="Trường Đại học Công nghiệp TP.HCM (IUH)", degree="Cử nhân", major="Quản trị Kinh doanh Tổng hợp", start_date="2012-09-01", end_date="2016-06-30")
            ]
        )
    },

    # CANDIDATE 04 — PARTIAL MATCH (Missing Management Years)
    {
        "code": "CANDIDATE-04",
        "name": "Phạm Quốc Anh",
        "archetype": "Partial Match (Missing Management Years)",
        "expected": "MEDIUM",
        "payload": CandidateProfilePayload(
            profile=ProfileDetail(
                desired_title="Area Sales Manager (ASM) / Quản lý Kinh doanh Khu vực",
                professional_summary="Hơn 7.5 năm kinh nghiệm bán hàng thực chiến trong ngành FMCG sữa và đồ uống dinh dưỡng. Có 2 năm kinh nghiệm làm Sales Supervisor quản lý đội nhóm 7 nhân sự tại khu vực Quận 7, Nhà Bè."
            ),
            skills=[
                CandidateSkill(skill_name="Quản lý Đội ngũ Sales & Giám sát Địa bàn", proficiency_level="INTERMEDIATE"),
                CandidateSkill(skill_name="Phát triển Mạng lưới Nhà phân phối & Đại lý", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Quản trị Doanh số & Hoạch định Dự báo", proficiency_level="INTERMEDIATE"),
                CandidateSkill(skill_name="Khai thác Thị trường Horeca & Foodservice", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Đàm phán Điều khoản Thương mại & Key Account", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Huấn luyện & Phát triển Năng lực Bán hàng", proficiency_level="INTERMEDIATE"),
                CandidateSkill(skill_name="Phân tích Thị trường & Nghiên cứu Đối thủ", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Hoạch định Chiến lược Kinh doanh Khu vực", proficiency_level="INTERMEDIATE"),
            ],
            work_experiences=[
                WorkExperience(
                    company_name="Công ty Cổ phần Sữa Việt Nam (Vinamilk)",
                    position_title="Sales Supervisor (Giám sát Mại vụ Khu vực Nam Sài Gòn)",
                    start_date="2022-06-01",
                    is_current=True,
                    description="Quản lý và hỗ trợ 7 Đại diện bán hàng (Sales Reps) tại khu vực Quận 7 và Huyện Nhà Bè. Phụ trách 2 Nhà phân phối cấp 1 và khoảng 180 tiệm tạp hóa/cửa hàng tiện lợi.",
                    achievements="Duy trì mức tăng trưởng doanh số 10% năm 2023, doanh thu đạt 18 tỷ VND/năm."
                ),
                WorkExperience(
                    company_name="Công ty TNHH FrieslandCampina Việt Nam (Cô Gái Hà Lan)",
                    position_title="Senior Sales Representative (Đại diện Bán hàng Cấp cao)",
                    start_date="2016-06-01",
                    end_date="2022-05-31",
                    description="Trực tiếp phụ trách tuyến bán hàng kênh truyền thống (GT) tại khu vực Quận 4 và Quận 8. Đi thị trường hàng ngày viếng thăm 35-40 điểm bán lẻ mỗi ca.",
                    achievements="Liên tục đạt danh hiệu Top Sales Representative quý trong các năm 2018, 2019, 2021."
                )
            ],
            educations=[
                Education(school_name="Trường Đại học Tài chính - Marketing (UFM)", degree="Cử nhân", major="Thương mại & Quản trị Bán hàng", start_date="2012-09-01", end_date="2016-06-30")
            ]
        )
    },

    # CANDIDATE 05 — WRONG DOMAIN (Real Estate Brokerage)
    {
        "code": "CANDIDATE-05",
        "name": "Trịnh Công Danh",
        "archetype": "Wrong Domain (Real Estate Brokerage)",
        "expected": "LOW",
        "payload": CandidateProfilePayload(
            profile=ProfileDetail(
                desired_title="Giám Đốc Kinh Doanh Khu Vực / Area Sales Manager",
                professional_summary="8.5 năm kinh nghiệm quản lý sàn giao dịch và phân phối bất động sản trung cao cấp, đất nền dự án và condotel nghỉ dưỡng tại TP.HCM và Đồng Nai."
            ),
            skills=[
                CandidateSkill(skill_name="Quản lý Đội ngũ Sales Bất động sản", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Môi giới Bất động sản & Phân phối Dự án", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Tư vấn Đầu tư Tài chính Bất động sản", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Đàm phán Hợp đồng Mua bán Nhà đất", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Tổ chức Sự kiện Mở bán Dự án", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Chăm sóc Khách hàng VIP & Nhà đầu tư", proficiency_level="EXPERT"),
            ],
            work_experiences=[
                WorkExperience(
                    company_name="Tập đoàn Bất động sản Novaland (NovaGroup)",
                    position_title="Trưởng phòng Kinh doanh Bất động sản (Real Estate Sales Manager)",
                    start_date="2018-06-01",
                    is_current=True,
                    description="Quản lý và điều hành sàn kinh doanh gồm 22 chuyên viên tư vấn môi giới bất động sản. Tổ chức các chiến dịch tìm kiếm khách hàng giàu có (High-Net-Worth Individuals) đầu tư căn hộ và biệt thự.",
                    achievements="Tổng giá trị giao dịch phân phối đạt hơn 450 tỷ VND trong giai đoạn 2020-2023."
                )
            ],
            educations=[
                Education(school_name="Trường Đại học Kinh tế Quốc dân", degree="Cử nhân", major="Quản trị Kinh doanh Bất động sản & Địa ốc", start_date="2011-09-01", end_date="2015-06-30")
            ]
        )
    },

    # CANDIDATE 06 — TRANSFERABLE DOMAIN (Pharma Territory Manager)
    {
        "code": "CANDIDATE-06",
        "name": "Đặng Tiến Dũng",
        "archetype": "Transferable Domain (Pharma Territory Manager)",
        "expected": "MEDIUM",
        "payload": CandidateProfilePayload(
            profile=ProfileDetail(
                desired_title="Area Sales Manager (ASM) / Quản Lý Bán Hàng Khu Vực",
                professional_summary="8.5 năm kinh nghiệm quản lý địa bàn và phân phối trong ngành Dược phẩm & Chăm sóc sức khỏe (Healthcare/Pharma). 5.5 năm đảm nhiệm vị trí Area Sales Manager quản lý 14 Trình dược viên kênh Bệnh viện (ETC) và Nhà thuốc/Đại lý (OTC)."
            ),
            skills=[
                CandidateSkill(skill_name="Quản lý Địa bàn & Đội ngũ Trình dược viên", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Phát triển Kênh Phân phối Nhà thuốc & Đại lý Dược phẩm", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Quản trị Doanh số & Dự báo Nhu cầu Thuốc", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Đàm phán Hợp đồng Thầu & Điều khoản Thương mại", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Huấn luyện Kỹ năng Tư vấn & Bán hàng Y Dược", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Phân tích Thị trường Dược & Động thái Đối thủ", proficiency_level="ADVANCED"),
            ],
            work_experiences=[
                WorkExperience(
                    company_name="Tập đoàn Phân phối Dược phẩm Zuellig Pharma Vietnam",
                    position_title="Area Sales Manager - Southern Region (Quản lý Bán hàng Khu vực Miền Nam)",
                    start_date="2019-03-01",
                    is_current=True,
                    description="Chịu trách nhiệm quản lý mạng lưới phân phối thuốc kê đơn (ETC) và không kê đơn (OTC) tại TP.HCM và các tỉnh lân cận. Lãnh đạo trực tiếp 14 Trình dược viên y tế và giám sát 12 đại lý phân phối dược phẩm cấp tỉnh. Đàm phán các hợp đồng cung ứng thuốc quy mô lớn cho chuỗi nhà thuốc Long Châu, An Khang và các bệnh viện đa khoa.",
                    achievements="Doanh số khu vực đạt 85 tỷ VND/năm (đạt 108% KPI năm 2023). Tăng độ phủ sản phẩm trên 1.200 nhà thuốc bán lẻ."
                )
            ],
            educations=[
                Education(school_name="Đại học Y Dược TP.HCM", degree="Dược sĩ Đại học", major="Dược học & Quản trị Kinh doanh Dược (Pharmacy)", start_date="2010-09-01", end_date="2015-06-30")
            ]
        )
    },

    # CANDIDATE 07 — SENIOR INDIVIDUAL CONTRIBUTOR (Zero Mgmt)
    {
        "code": "CANDIDATE-07",
        "name": "Phan Trọng Hiếu",
        "archetype": "Senior Individual Contributor (Zero Mgmt)",
        "expected": "MEDIUM",
        "payload": CandidateProfilePayload(
            profile=ProfileDetail(
                desired_title="Senior Key Account Manager (Senior KAM) - FMCG",
                professional_summary="Hơn 10.5 năm chuyên sâu quản lý và đàm phán hợp đồng thương mại với các hệ thống Đại siêu thị và Chuỗi bán lẻ hiện đại (MT) hàng đầu Việt Nam như Co.opmart, WinMart, BigC/GO!, Lotte Mart. Không quản lý đội ngũ Sales Reps thực địa, tập trung 100% vào vai trò Senior Individual Contributor."
            ),
            skills=[
                CandidateSkill(skill_name="Quản trị Khách hàng Trọng điểm Kênh MT (Key Account Management)", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Đàm phán Hợp đồng Thương mại & Chiết khấu Hàng năm (JBP)", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Quản lý Ngân sách Khuyến mãi & Trade Promotion", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Phân tích Dữ liệu POS & Sức mua Người tiêu dùng", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Quản trị Doanh số Khách hàng Trọng điểm", proficiency_level="EXPERT"),
            ],
            work_experiences=[
                WorkExperience(
                    company_name="Unilever Vietnam",
                    position_title="Senior National Key Account Manager (Chuyên viên Quản lý Khách hàng Cấp cao)",
                    start_date="2018-05-01",
                    is_current=True,
                    description="Đại diện công ty đàm phán toàn bộ thỏa thuận hợp tác thương mại hàng năm (Joint Business Plan - JBP) với Tập đoàn Saigon Co.op và Central Retail. Tự mình phân tích báo cáo doanh số, theo dõi công nợ và trực tiếp giải quyết các vấn đề vận hành với ban thu mua siêu thị mà không có nhân viên cấp dưới trực tiếp.",
                    achievements="Quản trị danh mục doanh thu trực tiếp đạt 220 tỷ VND/năm với mức tăng trưởng bình quân 14%/năm."
                )
            ],
            educations=[
                Education(school_name="Trường Đại học Bách Khoa TP.HCM (ĐHQG-HCM)", degree="Kỹ sư", major="Quản lý Công nghiệp & Chuỗi cung ứng", start_date="2009-09-01", end_date="2014-06-30")
            ]
        )
    },

    # CANDIDATE 08 — TITLE INFLATION TRAP (Tiny 2-person shop)
    {
        "code": "CANDIDATE-08",
        "name": "Đỗ Minh Khang",
        "archetype": "Title Inflation Trap",
        "expected": "LOW",
        "payload": CandidateProfilePayload(
            profile=ProfileDetail(
                desired_title="Regional Sales Director / Giám Đốc Kinh Doanh Khu Vực",
                professional_summary="Giám đốc kinh doanh toàn quốc với hơn 7 năm lãnh đạo toàn bộ chiến lược phân phối sản phẩm thực phẩm tươi sống và chế biến sẵn."
            ),
            skills=[
                CandidateSkill(skill_name="Regional Sales Leadership & Strategic Management", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Nationwide Channel & Distributor Expansion", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Enterprise Revenue & Corporate Forecasting", proficiency_level="EXPERT"),
            ],
            work_experiences=[
                WorkExperience(
                    company_name="Hộ kinh doanh Thực phẩm Sạch Sài Gòn (Saigon FreshFood)",
                    position_title="Regional Sales Director (Giám đốc Kinh doanh Vùng)",
                    start_date="2018-02-01",
                    is_current=True,
                    description="Quản lý và trực tiếp chỉ đạo toàn bộ hoạt động giao hàng của 2 nhân viên giao hàng bằng xe máy tại 1 cửa hàng bán lẻ duy nhất ở Quận Bình Thạnh. Tự tay ghi chép sổ sách thu chi, đóng gói sản phẩm rau củ và giao hàng cho các hộ gia đình lân cận.",
                    achievements="Duy trì doanh số bán lẻ của cửa hàng đạt 350 triệu VND/tháng."
                )
            ],
            educations=[
                Education(school_name="Trường Đại học Văn Lang", degree="Cử nhân", major="Quản trị Kinh doanh", start_date="2013-09-01", end_date="2017-06-30")
            ]
        )
    },

    # CANDIDATE 09 — REALISTIC COMPLEX CAREER PATH
    {
        "code": "CANDIDATE-09",
        "name": "Trần Mai Phương",
        "archetype": "Realistic Complex Career Path",
        "expected": "HIGH",
        "payload": CandidateProfilePayload(
            profile=ProfileDetail(
                desired_title="Area Sales Manager (ASM) / Chuyên gia Tư vấn Kênh Phân phối",
                professional_summary="Hơn 11 năm hoạt động trong ngành F&B và FMCG với lộ trình nghề nghiệp đa dạng: 5 năm kinh nghiệm quản lý địa bàn và kênh phân phối nước giải khát tại La Vie, 1 năm nghỉ học nâng cao Thạc sĩ Quản trị Kinh doanh (MBA), và 2.5 năm làm Chuyên gia tư vấn chiến lược kênh phân phối cho các doanh nghiệp vừa và nhỏ."
            ),
            skills=[
                CandidateSkill(skill_name="Quản lý Đội ngũ Sales & Giám sát Địa bàn", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Phát triển Mạng lưới Nhà phân phối & Đại lý", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Quản trị Doanh số & Hoạch định Dự báo", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Khai thác Thị trường Horeca & Foodservice", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Đàm phán Điều khoản Thương mại & Key Account", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Huấn luyện & Phát triển Năng lực Bán hàng", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Hoạch định Chiến lược Kinh doanh Khu vực", proficiency_level="EXPERT"),
            ],
            work_experiences=[
                WorkExperience(
                    company_name="Công ty TNHH Tư vấn & Dịch vụ F&B Sài Gòn",
                    position_title="Senior Commercial Consultant (Chuyên gia Tư vấn Kênh Phân phối)",
                    start_date="2022-07-01",
                    is_current=True,
                    description="Tư vấn tái cấu trúc mạng lưới nhà phân phối, xây dựng chính sách chiết khấu thương mại và đào tạo kỹ năng bán hàng cho các startup ngành thực phẩm & chuỗi cà phê.",
                    achievements="Tái cấu trúc thành công hệ thống phân phối cho 6 thương hiệu đồ uống, giúp tăng doanh số trung bình 28% sau 6 tháng."
                ),
                WorkExperience(
                    company_name="Công ty TNHH La Vie (Tập đoàn Nestlé Water)",
                    position_title="Area Sales Manager (Quản lý Bán hàng Khu vực Trung tâm TP.HCM)",
                    start_date="2016-09-01",
                    end_date="2021-08-31",
                    description="Chịu trách nhiệm quản lý doanh số kênh Horeca và đại lý nước khoáng tại Quận 1, 3, 5, 10. Quản lý đội ngũ 16 nhân viên bán hàng và 5 đại lý phân phối lớn.",
                    achievements="Đạt danh hiệu ASM có tỷ lệ thâm nhập kênh Horeca cao nhất toàn quốc năm 2019 với hơn 320 nhà hàng/khách sạn ký hợp đồng độc quyền."
                )
            ],
            educations=[
                Education(school_name="Đại học Kinh tế TP.HCM", degree="Thạc sĩ", major="Thạc sĩ Quản trị Kinh doanh (MBA)", start_date="2021-09-01", end_date="2022-06-30")
            ]
        )
    },

    # CANDIDATE 10 — HIGHLY QUALIFIED LOW-KEYWORD HERO
    {
        "code": "CANDIDATE-10",
        "name": "Nguyễn Văn Thành",
        "archetype": "Highly Qualified Low-Keyword Hero",
        "expected": "HIGH",
        "payload": CandidateProfilePayload(
            profile=ProfileDetail(
                desired_title="Phụ Trách Thương Mại Vùng Đông Nam Bộ",
                professional_summary="Hơn 11.5 năm phụ trách mở rộng thị trường và quản lý mạng lưới cung ứng hàng thực phẩm đóng gói. Trực tiếp lãnh đạo 18 nhân sự thương mại tại 4 tỉnh thành. Quản lý dòng lưu chuyển hàng hóa qua 8 tổng kho đại lý cấp 1 và hơn 380 điểm cung ứng dịch vụ ăn uống."
            ),
            skills=[
                CandidateSkill(skill_name="Điều phối Nhân sự Thương mại & Giám sát Tuyến Thực địa", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Quản trị Đối tác Bán buôn & Tổng kho Tỉnh", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Cân đối Chỉ tiêu Tiêu thụ & Lập Dự toán Sản lượng", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Mở rộng Chuỗi Cung ứng Nhà hàng Khách sạn & Điểm ăn uống", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Thương lượng Hợp đồng Mua bán & Hạn mức Công nợ", proficiency_level="EXPERT"),
                CandidateSkill(skill_name="Kèm cặp Kỹ năng Thực tế & Đánh giá Năng lực Nhân viên", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Theo dõi Thị phần & Nắm bắt Động thái Đối thủ Cạnh tranh", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Lập Phương án Kinh doanh & Phát triển Địa bàn", proficiency_level="EXPERT"),
            ],
            work_experiences=[
                WorkExperience(
                    company_name="Công ty Cổ phần Acecook Việt Nam",
                    position_title="Trưởng Khu vực Kinh doanh (Area Commercial In-Charge)",
                    start_date="2018-08-01",
                    is_current=True,
                    description="Phụ trách 18 nhân viên kinh doanh tại 4 tỉnh Đồng Nai, Bình Dương, Tây Ninh, Bình Phước. Tổ chức họp weekly review, trực tiếp ride-along cùng nhân viên đi tuyến hỗ trợ đàm phán với chủ đại lý lớn. Cân đối kế hoạch sản lượng hàng tháng, theo dõi chỉ số sell-out điểm bán lẻ để tránh thiếu hàng cục bộ. Thiết lập hạn mức công nợ và chính sách thưởng đạt số cho từng nhà phân phối. Ký kết hợp đồng cung cấp mì ăn liền và gia vị đóng gói cho hệ thống bếp ăn công nghiệp và chuỗi nhà hàng thức ăn nhanh.",
                    achievements="Duy trì mức tăng trưởng doanh thu 12-15% liên tục trong 5 năm, doanh số thực thu năm 2023 đạt 132 tỷ VND. Phát triển thêm 120 điểm tiêu thụ mới tại các khu công nghiệp trọng điểm."
                ),
                WorkExperience(
                    company_name="Công ty Cổ phần Thực phẩm Cholimex",
                    position_title="Giám sát Bán hàng Khu vực (Area Sales Supervisor)",
                    start_date="2013-03-01",
                    end_date="2018-07-31",
                    description="Giám sát đội ngũ 8 nhân viên bán hàng tuyến đường chính. Đào tạo nhân viên mới về kỹ năng trưng bày sản phẩm (merchandising), kỹ năng xử lý từ chối và kiểm tra tồn kho tại tiệm tạp hóa.",
                    achievements="Đạt thành tích Giám sát có tỷ lệ nhân viên hoàn thành 100% KPI cao nhất cụm miền Đông năm 2016."
                )
            ],
            educations=[
                Education(school_name="Trường Đại học Cần Thơ", degree="Cử nhân", major="Kinh tế Nông nghiệp & Thương mại Thực phẩm", start_date="2008-09-01", end_date="2012-06-30")
            ]
        )
    }
]

# 3. Evaluate All 10 Candidates
results = []
print("================================================================================")
print("  🚀 CHẠY EVALUATION ĐỒNG LOẠT 10 CANDIDATES VỚI H-CAME V4 AI MATCHING ENGINE")
print("================================================================================")

def to_dict(obj):
    if obj is None:
        return None
    if hasattr(obj, "dict"):
        return obj.dict()
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if isinstance(obj, list):
        return [to_dict(x) for x in obj]
    if isinstance(obj, dict):
        return {k: to_dict(v) for k, v in obj.items()}
    return obj

for c in candidates:
    req = EvaluationRequest(job=job, candidate_profile=c["payload"], application_id=f"test-{c['code']}")
    res = matching_engine.evaluate(req)
    results.append({
        "code": c["code"],
        "name": c["name"],
        "archetype": c["archetype"],
        "expected": c["expected"],
        "overall": res.overall_score,
        "level": res.match_level,
        "skills": res.skills_score,
        "exp": res.experience_score,
        "edu": res.education_score,
        "other": res.other_score,
        "matched_skills": [to_dict(m) for m in (res.matched_skills or [])],
        "missing_skills": [to_dict(m) for m in (res.missing_skills or [])],
        "missing_mandatory": res.missing_required_skills or [],
        "evidence": [to_dict(e) for e in (res.evidence or [])],
        "cand_level": res.experience_assessment.candidate_level if res.experience_assessment else "N/A",
        "req_level": res.experience_assessment.required_level if res.experience_assessment else "MANAGER",
        "level_fit": res.experience_assessment.level_fit_score if res.experience_assessment else "N/A",
        "level_eligible": res.experience_assessment.level_eligible if res.experience_assessment else True,
        "level_evidence": res.experience_assessment.evidence if res.experience_assessment else [],
        "total_experience_years": res.experience_assessment.total_experience_years if res.experience_assessment else None,
        "summary": res.summary,
        "strengths": res.strengths or [],
        "gaps": res.gaps or [],
        "pillar_explanations": to_dict(res.pillar_explanations),
    })
    print(f"✅ {c['code']} - {c['name']} ({c['archetype']}): Score = {res.overall_score:.2f} ({res.match_level}) | Expected = {c['expected']}")

# Save matrix to JSON
with open("../backend/scratch_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\n================================================================================")
print("              🏆 BẢNG MA TRẬN KẾT QUẢ STRESS TEST HOÀN HẢO (10 CANDIDATES)")
print("================================================================================")
print("| Mã UV | Họ và Tên | Archetype | Điểm AI | Xếp loại | Kỳ vọng | Skills | Exp | Edu | Missing Mandatories | Level Fit |")
print("| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: |")
for r in results:
    print(f"| **{r['code']}** | {r['name']} | {r['archetype']} | **`{r['overall']:.2f}`** | **{r['level']}** | {r['expected']} | {r['skills']:.1f} | {r['exp']:.1f} | {r['edu']:.1f} | {', '.join(r['missing_mandatory']) if r['missing_mandatory'] else 'None'} | {r['cand_level']} |")
print("================================================================================\n")
