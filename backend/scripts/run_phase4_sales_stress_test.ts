import 'dotenv/config';
import {
  PrismaClient,
  JobStatus,
  EmploymentType,
  ExperienceLevel,
  SkillRequirementType,
  ProficiencyLevel,
  MatchLevel,
  ApplicationStage,
  ApplicationProcessingStatus,
  DataSource,
  SkillSource,
} from '@prisma/client';
import { createSupabaseAdminClient } from '../src/infrastructure/supabase/supabase-admin-client';

const prisma = new PrismaClient();

interface CandidateDefinition {
  code: string;
  archetype: string;
  name: string;
  email: string;
  phone: string;
  desiredTitle: string;
  summary: string;
  expectedLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  expectedOrderTier: string;
  profile: {
    desired_title: string;
    professional_summary: string;
  };
  educations: Array<{
    school_name: string;
    major: string;
    degree: string;
    start_date?: string;
    end_date?: string;
  }>;
  work_experiences: Array<{
    company_name: string;
    position_title: string;
    start_date: string;
    end_date: string;
    description: string;
    achievements: string;
  }>;
  skills: Array<{
    skill_name: string;
    proficiency_level: string;
    normalized_name?: string;
  }>;
  certificates: Array<{
    certificate_name: string;
  }>;
}

export const CANDIDATES_PHASE_4_6: CandidateDefinition[] = [
  // -----------------------------------------------------------------------------------------------
  // CANDIDATE 01 — TRUE EXCELLENT MATCH
  // -----------------------------------------------------------------------------------------------
  {
    code: 'CANDIDATE-01',
    archetype: 'True Excellent Match',
    name: 'Vũ Minh Đức',
    email: 'vu.minh.duc.asm@fmcg-talent.vn',
    phone: '0903123891',
    desiredTitle: 'Area Sales Manager (FMCG / Food & Beverage)',
    summary:
      '11.5 năm kinh nghiệm phát triển thị trường và quản lý bán hàng trong ngành FMCG / Thực phẩm & Đồ uống. Hơn 7.0 năm giữ vị trí Quản lý Kinh doanh Khu vực (ASM) tại Masan Consumer và Suntory PepsiCo. Quản lý trực tiếp đội ngũ 24 nhân viên (3 Giám sát bán hàng, 21 Sales Reps), phụ trách địa bàn TP.HCM & Đông Nam Bộ. Doanh số quản lý 130 tỷ VND/năm, duy trì mức tăng trưởng bình quân 18%/năm. Chuyên sâu quản trị hệ thống 8 Nhà phân phối cấp 1 và thâm nhập mạng lưới 450 điểm bán Horeca cao cấp.',
    expectedLevel: 'HIGH',
    expectedOrderTier: 'Tier 1 (Top Match)',
    profile: {
      desired_title: 'Area Sales Manager (FMCG / Food & Beverage)',
      professional_summary:
        '11.5 năm kinh nghiệm phát triển thị trường và quản lý bán hàng trong ngành FMCG / Thực phẩm & Đồ uống. Hơn 7.0 năm giữ vị trí Quản lý Kinh doanh Khu vực (ASM) tại Masan Consumer và Suntory PepsiCo. Quản lý trực tiếp đội ngũ 24 nhân viên (3 Giám sát bán hàng, 21 Sales Reps), phụ trách địa bàn TP.HCM & Đông Nam Bộ. Doanh số quản lý 130 tỷ VND/năm, duy trì mức tăng trưởng bình quân 18%/năm. Chuyên sâu quản trị hệ thống 8 Nhà phân phối cấp 1 và thâm nhập mạng lưới 450 điểm bán Horeca cao cấp.',
    },
    educations: [
      {
        school_name: 'Đại học Kinh tế TP. Hồ Chí Minh (UEH)',
        major: 'Quản trị Kinh doanh Thương mại (Business Administration)',
        degree: 'Cử nhân Đại học Chính quy (Bachelor of Business)',
        start_date: '2009-09-01',
        end_date: '2013-06-30',
      },
    ],
    work_experiences: [
      {
        company_name: 'Công ty Cổ phần Hàng tiêu dùng Masan (Masan Consumer)',
        position_title: 'Area Sales Manager (Quản lý Kinh doanh Khu vực Đông Nam Bộ)',
        start_date: '2020-03-01',
        end_date: '2025-08-30',
        description:
          '• Hoạch định và thực thi chiến lược phân phối cho ngành hàng thực phẩm tiện lợi & đồ uống tại TP.HCM, Bình Dương và Đồng Nai.\n• Trực tiếp quản lý, đánh giá KPI và coaching đội ngũ 24 nhân sự gồm 3 Sales Supervisors và 21 Sales Representatives.\n• Quản trị hiệu quả hoạt động kinh doanh của 8 Nhà Phân Phối độc quyền: định mức tồn kho, chỉ tiêu sell-in, hỗ trợ giải phóng hàng sell-out và kiểm soát dòng tiền công nợ.\n• Đàm phán các thỏa thuận thương mại, chính sách chiết khấu lũy tiến và ký kết hợp đồng cung ứng định kỳ với hơn 200 chuỗi nhà hàng, khách sạn và cụm dịch vụ ăn uống Horeca.\n• Xây dựng mô hình dự báo sản lượng bán hàng (Sales Forecasting) theo tuần/tháng với độ chính xác trên 92%.\n• Tổ chức chương trình ride-along định kỳ 2 lần/tuần để đào tạo kỹ năng đàm phán chốt đơn và xử lý từ chối tại điểm bán cho nhân viên.',
        achievements:
          '• Vượt 114% chỉ tiêu doanh số năm 2023, đạt doanh thu 138 tỷ VND (tăng trưởng 21% YoY).\n• Mở rộng thành công 160 điểm bán mới thuộc phân khúc Foodservice & Horeca trong 18 tháng.\n• Giảm tỷ lệ nhân sự Sales nghỉ việc từ 26% xuống 9% nhờ xây dựng lộ trình thăng tiến và thưởng KPI minh bạch.',
      },
      {
        company_name: 'Suntory PepsiCo Vietnam Beverage',
        position_title: 'Territory Sales Supervisor (Giám sát Bán hàng Địa bàn TP.HCM)',
        start_date: '2016-06-01',
        end_date: '2020-02-28',
        description:
          '• Phụ trách quản trị doanh số và độ phủ sản phẩm nước giải khát tại khu vực TP. Thủ Đức và Quận 1, 3, Bình Thạnh.\n• Quản lý trực tiếp 12 Sales Reps kênh GT (General Trade) và Horeca.\n• Đảm bảo độ phủ sản phẩm trên 85% tại các quán ăn, canteen trường học và đại lý bán lẻ trong khu vực.\n• Theo dõi sát sao biến động giá cả và chương trình khuyến mãi của đối thủ cạnh tranh trên thị trường để đề xuất chính sách linh hoạt.',
        achievements:
          '• Đạt danh hiệu Best Territory Supervisor toàn quốc năm 2018 với tỷ lệ tăng trưởng doanh số 19%.\n• Phát triển 95 đại lý bán lẻ cấp 2 và 60 quán ăn phục vụ ăn uống tại chỗ.',
      },
      {
        company_name: 'Công ty TNHH Nestlé Việt Nam',
        position_title: 'Sales Representative (Đại diện Thương mại Kênh Horeca)',
        start_date: '2013-08-01',
        end_date: '2016-05-30',
        description:
          '• Trực tiếp tiếp cận, chào hàng dòng sản phẩm giải pháp ẩm thực (Food Solutions) cho các nhà hàng, quán cà phê và bếp ăn thương mại.\n• Duy trì quan hệ và chăm sóc danh mục 80 khách hàng trọng điểm.\n• Đàm phán đơn hàng và theo dõi giao nhận đúng tiến độ.',
        achievements:
          '• Luôn hoàn thành 105% - 110% chỉ tiêu doanh thu cá nhân hàng quý.',
      },
    ],
    skills: [
      { skill_name: 'Quản lý Đội ngũ Sales & Giám sát Địa bàn', proficiency_level: 'EXPERT', normalized_name: 'sales team management territory leadership' },
      { skill_name: 'Phát triển Mạng lưới Nhà phân phối & Đại lý', proficiency_level: 'EXPERT', normalized_name: 'distributor channel management' },
      { skill_name: 'Quản trị Doanh số & Hoạch định Dự báo', proficiency_level: 'EXPERT', normalized_name: 'sales target revenue forecasting' },
      { skill_name: 'Khai thác Thị trường Horeca & Foodservice', proficiency_level: 'EXPERT', normalized_name: 'horeca foodservice market penetration' },
      { skill_name: 'Đàm phán Điều khoản Thương mại & Key Account', proficiency_level: 'EXPERT', normalized_name: 'commercial negotiation key accounts' },
      { skill_name: 'Huấn luyện & Phát triển Năng lực Bán hàng', proficiency_level: 'ADVANCED', normalized_name: 'sales coaching field training' },
      { skill_name: 'Phân tích Thị trường & Nghiên cứu Đối thủ', proficiency_level: 'ADVANCED', normalized_name: 'market analysis competitor intelligence' },
      { skill_name: 'Hoạch định Chiến lược Kinh doanh Khu vực', proficiency_level: 'EXPERT', normalized_name: 'area business planning execution' },
      { skill_name: 'Quản trị Chỉ số KPI & Hiệu suất Bán hàng', proficiency_level: 'EXPERT', normalized_name: 'kpi management sales performance' },
      { skill_name: 'FMCG Food & Beverage Industry', proficiency_level: 'EXPERT', normalized_name: 'fmcg food beverage industry' },
    ],
    certificates: [
      { certificate_name: 'Executive Leadership & Strategic Sales Management (PACE Institute)' },
    ],
  },

  // -----------------------------------------------------------------------------------------------
  // CANDIDATE 02 — STRONG SEMANTIC MATCH (No exact keywords, pure business paraphrase)
  // -----------------------------------------------------------------------------------------------
  {
    code: 'CANDIDATE-02',
    archetype: 'Strong Semantic Match',
    name: 'Lê Hoàng Long',
    email: 'le.hoang.long.commercial@asia-foods.vn',
    phone: '0918742910',
    desiredTitle: 'Trưởng Đại Diện Thương Mại & Điều Hành Thị Trường Tiêu Dùng',
    summary:
      'Hơn 10 năm chỉ đạo và điều tiết mạng lưới lưu thông sản phẩm tiêu dùng thực phẩm đóng gói. Từng dẫn dắt tổ hợp hơn 20 chuyên viên thương mại thực địa tại miền Nam. Chuyên sâu về cơ chế quản trị đối tác bán buôn cấp tỉnh, cân đối dòng hàng xuất - nhập điểm bán, giải phóng tồn đọng kho bãi và thiết lập hợp đồng cung ứng dài hạn cho hệ thống dịch vụ ẩm thực lưu trú.',
    expectedLevel: 'HIGH',
    expectedOrderTier: 'Tier 1 / Tier 2 (Semantic High)',
    profile: {
      desired_title: 'Trưởng Đại Diện Thương Mại & Điều Hành Thị Trường Tiêu Dùng',
      professional_summary:
        'Hơn 10 năm chỉ đạo và điều tiết mạng lưới lưu thông sản phẩm tiêu dùng thực phẩm đóng gói. Từng dẫn dắt tổ hợp hơn 20 chuyên viên thương mại thực địa tại miền Nam. Chuyên sâu về cơ chế quản trị đối tác bán buôn cấp tỉnh, cân đối dòng hàng xuất - nhập điểm bán, giải phóng tồn đọng kho bãi và thiết lập hợp đồng cung ứng dài hạn cho hệ thống dịch vụ ẩm thực lưu trú.',
    },
    educations: [
      {
        school_name: 'Trường Đại học Ngoại thương Cơ sở II TP.HCM',
        major: 'Kinh tế Quốc tế & Quản trị Kinh doanh Thương mại',
        degree: 'Cử nhân Kinh tế (Bachelor of International Economics)',
        start_date: '2010-09-01',
        end_date: '2014-06-30',
      },
    ],
    work_experiences: [
      {
        company_name: 'Tập đoàn Thực phẩm & Gia vị Nam Dương (ND Food Group)',
        position_title: 'Trưởng Đại diện Kinh doanh Khu vực Trọng điểm (Area Commercial Lead)',
        start_date: '2019-07-01',
        end_date: '2025-08-30',
        description:
          '• Điều hành mạng lưới đại lý cấp 1 và đối tác phân phối độc quyền tại 5 tỉnh miền Đông, bảo đảm tính thông suốt của dòng luân chuyển hàng hóa thực phẩm.\n• Giám sát trực tiếp 18 chuyên viên phát triển thị trường, thực hiện phân bổ chỉ tiêu doanh thu theo chu kỳ quý/năm và tổ chức đánh giá hiệu suất định kỳ.\n• Xây dựng hạn mức nhập hàng (sell-in) và hỗ trợ giải phóng tồn kho điểm bán (sell-out) cho từng đơn vị trung gian nhằm triệt tiêu hàng cận date.\n• Trực tiếp tháp tùng nhân viên bán hàng tiếp cận các chuỗi nhà hàng, khu ẩm thực và đơn vị cung cấp suất ăn tập thể để thỏa thuận cung ứng sản phẩm.\n• Lập kế hoạch sản lượng tiêu thụ theo mùa vụ và dự báo nhu cầu theo từng khu vực dựa trên phân tích lượng tiêu thụ thực tế tại các điểm bán lẻ.\n• Đích thân đi thị trường cùng nhân viên (field coaching), quan sát cuộc gặp khách hàng và rút kinh nghiệm chuyên môn sau mỗi tuần.',
        achievements:
          '• Tăng trưởng chỉ số tiêu thụ toàn vùng đạt 118% so với kế hoạch năm 2023, doanh thu thực thu 115 tỷ VND.\n• Giảm tỷ lệ tồn kho ứ đọng tại kho tổng của các đại lý trung gian từ 21 ngày xuống còn 11 ngày.\n• Phát triển thành công 135 cơ sở dịch vụ ăn uống và chuỗi nhà hàng sử dụng nguồn nguyên liệu độc quyền của công ty.',
      },
      {
        company_name: 'Công ty Cổ phần Thực phẩm Cholimex',
        position_title: 'Giám sát Mạng lưới Thương mại Thực địa (Field Commercial Supervisor)',
        start_date: '2015-01-01',
        end_date: '2019-06-30',
        description:
          '• Điều phối hoạt động thương mại của 10 nhân viên bán buôn tại địa bàn các quận nội thành TP.HCM.\n• Đàm phán cơ chế chiết khấu và hợp đồng thương mại với các đại lý bán buôn, cửa hàng thực phẩm tươi sống và quán ăn gia đình.\n• Khảo sát tình hình giá cả, chương trình ưu đãi của các hãng gia vị cạnh tranh và báo cáo giải pháp ứng phó cho Ban Giám đốc.',
        achievements:
          '• Mở rộng 80 điểm bán lẻ và ký mới 45 hợp đồng cung ứng số lượng lớn cho các cơ sở nấu tiệc cưới và nhà hàng ẩm thực.',
      },
    ],
    skills: [
      { skill_name: 'Quản trị mạng lưới cung ứng thương mại cấp tỉnh', proficiency_level: 'EXPERT', normalized_name: 'provincial commercial supply network management' },
      { skill_name: 'Tối ưu hóa chuỗi điểm bán lẻ & giải phóng tồn kho', proficiency_level: 'EXPERT', normalized_name: 'retail outlet chain sell-out inventory optimization' },
      { skill_name: 'Lập dự toán nhu cầu sản lượng & kế hoạch tiêu thụ mùa vụ', proficiency_level: 'EXPERT', normalized_name: 'demand forecasting seasonal consumption planning' },
      { skill_name: 'Đàm phán hợp đồng cung ứng khối dịch vụ ẩm thực lưu trú', proficiency_level: 'ADVANCED', normalized_name: 'horeca lodging food service contract negotiation' },
      { skill_name: 'Giám sát thực địa & đào tạo nhân viên thị trường', proficiency_level: 'EXPERT', normalized_name: 'field supervision on-job market staff training' },
      { skill_name: 'Phân bổ chỉ tiêu & đánh giá hiệu quả kinh doanh', proficiency_level: 'EXPERT', normalized_name: 'target allocation commercial efficiency evaluation' },
      { skill_name: 'Khảo sát động thái cạnh tranh & biến động thị phần', proficiency_level: 'ADVANCED', normalized_name: 'competitor intelligence market share survey' },
      { skill_name: 'Ngành hàng Tiêu dùng Nhanh Thực phẩm Đóng gói', proficiency_level: 'EXPERT', normalized_name: 'packaged food fast moving consumer goods' },
    ],
    certificates: [
      { certificate_name: 'Chứng chỉ Nghiệp vụ Quản trị Kênh Phân phối Thương mại (VCCI)' },
    ],
  },

  // -----------------------------------------------------------------------------------------------
  // CANDIDATE 03 — KEYWORD STUFFING (All keywords, but reality is Sales Admin/Telesales)
  // -----------------------------------------------------------------------------------------------
  {
    code: 'CANDIDATE-03',
    archetype: 'Keyword Stuffing Trap',
    name: 'Nguyễn Thùy Linh',
    email: 'nguyen.thuy.linh.salesadmin@gmail.com',
    phone: '0938112345',
    desiredTitle: 'Area Sales Manager / Sales Management Specialist',
    summary:
      'Chuyên gia Sales Management, Business Development, FMCG, Horeca, Foodservice, Distributor Management, Sales Forecasting, Leadership, Commercial Negotiation, Market Analysis, Target-driven với hơn 6 năm kinh nghiệm trong ngành hàng tiêu dùng nhanh thực phẩm và đồ uống.',
    expectedLevel: 'LOW',
    expectedOrderTier: 'Tier 4 (Low / False Match Trap)',
    profile: {
      desired_title: 'Area Sales Manager / Sales Management Specialist',
      professional_summary:
        'Chuyên gia Sales Management, Business Development, FMCG, Horeca, Foodservice, Distributor Management, Sales Forecasting, Leadership, Commercial Negotiation, Market Analysis, Target-driven với hơn 6 năm kinh nghiệm trong ngành hàng tiêu dùng nhanh thực phẩm và đồ uống.',
    },
    educations: [
      {
        school_name: 'Trường Đại học Văn Hiến',
        major: 'Quản trị Kinh doanh Tổng hợp',
        degree: 'Cử nhân Đại học (Bachelor)',
        start_date: '2014-09-01',
        end_date: '2018-06-30',
      },
    ],
    work_experiences: [
      {
        company_name: 'Công ty Cổ phần Thực phẩm Bánh kẹo Á Châu',
        position_title: 'Chuyên viên Hỗ trợ Kinh doanh & Điều phối Đơn hàng (Sales Admin & Coordinator)',
        start_date: '2021-04-01',
        end_date: '2025-08-30',
        description:
          '• Tiếp nhận đơn đặt hàng từ các đại lý và nhà phân phối qua email, điện thoại và Zalo, nhập liệu chính xác vào hệ thống ERP SAP.\n• Theo dõi biên bản đối soát công nợ, xuất hóa đơn điện tử và phối hợp với bộ phận kho vận để điều phối lịch giao hàng đúng hạn.\n• Ghi nhận các khiếu nại của khách hàng qua tổng đài hotline và chuyển tiếp thông tin cho đội ngũ bán hàng thị trường xử lý.\n• Tổng hợp số liệu doanh số hàng tuần từ báo cáo của các Sales Representative gửi về để làm file Excel báo cáo cho Giám đốc Bán hàng.\n• Chuẩn bị tài liệu hợp đồng mẫu, báo giá và biểu mẫu chiết khấu theo chỉ đạo của cấp quản lý.',
        achievements:
          '• Hoàn thành việc nhập liệu hơn 1,200 chứng từ đơn hàng mỗi tháng mà không phát sinh sai sót số liệu kế toán.\n• Hỗ trợ đội ngũ kinh doanh tổ chức thành công 4 hội nghị tri ân đại lý phân phối cuối năm.',
      },
      {
        company_name: 'Công ty TNHH Nước giải khát Horeca Star',
        position_title: 'Nhân viên Telesales & Chăm sóc Khách hàng (Telesales Executive)',
        start_date: '2018-08-01',
        end_date: '2021-03-31',
        description:
          '• Thực hiện cuộc gọi theo danh sách dữ liệu có sẵn (data call) để giới thiệu danh mục siro, trà và nguyên liệu pha chế cho các quán cà phê nhỏ.\n• Tư vấn chương trình khuyến mại tháng và chốt đơn đặt hàng trực tiếp qua điện thoại.\n• Lưu trữ thông tin phản hồi của khách hàng lên hệ thống phần mềm CRM.',
        achievements:
          '• Đạt chỉ tiêu gọi 65 cuộc gọi/ngày và duy trì tỷ lệ chốt đơn thành công 12% trên danh sách khách hàng tiềm năng.',
      },
    ],
    skills: [
      { skill_name: 'Sales Management', proficiency_level: 'EXPERT', normalized_name: 'sales management' },
      { skill_name: 'Business Development', proficiency_level: 'EXPERT', normalized_name: 'business development' },
      { skill_name: 'Distributor Management', proficiency_level: 'EXPERT', normalized_name: 'distributor management' },
      { skill_name: 'Horeca', proficiency_level: 'EXPERT', normalized_name: 'horeca' },
      { skill_name: 'Foodservice Market Knowledge', proficiency_level: 'EXPERT', normalized_name: 'foodservice market knowledge' },
      { skill_name: 'Sales Forecasting', proficiency_level: 'EXPERT', normalized_name: 'sales forecasting' },
      { skill_name: 'Commercial Negotiation', proficiency_level: 'EXPERT', normalized_name: 'commercial negotiation' },
      { skill_name: 'Leadership & Team Management', proficiency_level: 'EXPERT', normalized_name: 'leadership team management' },
      { skill_name: 'Market Analysis', proficiency_level: 'EXPERT', normalized_name: 'market analysis' },
      { skill_name: 'Target-driven', proficiency_level: 'EXPERT', normalized_name: 'target driven' },
      { skill_name: 'FMCG', proficiency_level: 'EXPERT', normalized_name: 'fmcg' },
    ],
    certificates: [
      { certificate_name: 'Sales Management Masterclass Online Certificate' },
    ],
  },

  // -----------------------------------------------------------------------------------------------
  // CANDIDATE 04 — PARTIAL MATCH (Strong Sales FMCG, but only 2 years management < 5 yrs req)
  // -----------------------------------------------------------------------------------------------
  {
    code: 'CANDIDATE-04',
    archetype: 'Partial Match (Missing Management Years)',
    name: 'Phạm Quốc Anh',
    email: 'pham.quoc.anh.sales@vinamilk-careers.vn',
    phone: '0908334455',
    desiredTitle: 'Area Sales Manager / Territory Sales Supervisor',
    summary:
      '7.5 năm kinh nghiệm làm việc trong ngành FMCG Sữa & Thực phẩm dinh dưỡng. Có 5.5 năm làm Sales Executive xuất sắc và 2.0 năm giữ vị trí Giám sát Bán hàng Khu vực (Territory Sales Supervisor) quản lý đội ngũ 7 nhân viên tại Vinamilk. Đàm phán tốt kênh Horeca và đại lý bán lẻ, đạt 108% target doanh thu liên tục. Mong muốn phát triển lên vị trí Quản lý Kinh doanh Khu vực (ASM).',
    expectedLevel: 'MEDIUM',
    expectedOrderTier: 'Tier 3 (Partial Match / Missing Mandatory Years)',
    profile: {
      desired_title: 'Area Sales Manager / Territory Sales Supervisor',
      professional_summary:
        '7.5 năm kinh nghiệm làm việc trong ngành FMCG Sữa & Thực phẩm dinh dưỡng. Có 5.5 năm làm Sales Executive xuất sắc và 2.0 năm giữ vị trí Giám sát Bán hàng Khu vực (Territory Sales Supervisor) quản lý đội ngũ 7 nhân viên tại Vinamilk. Đàm phán tốt kênh Horeca và đại lý bán lẻ, đạt 108% target doanh thu liên tục. Mong muốn phát triển lên vị trí Quản lý Kinh doanh Khu vực (ASM).',
    },
    educations: [
      {
        school_name: 'Đại học Tài chính - Marketing (UFM)',
        major: 'Thương mại & Quản trị Bán hàng',
        degree: 'Cử nhân Kinh tế',
        start_date: '2013-09-01',
        end_date: '2017-06-30',
      },
    ],
    work_experiences: [
      {
        company_name: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
        position_title: 'Territory Sales Supervisor (Giám sát Bán hàng Địa bàn TP. Thủ Đức)',
        start_date: '2023-08-01',
        end_date: '2025-08-30',
        description:
          '• Trực tiếp quản lý và hỗ trợ công tác bán hàng thực địa của 7 nhân viên Sales Reps trên địa bàn TP. Thủ Đức.\n• Chịu trách nhiệm chỉ tiêu doanh thu 28 tỷ VND/năm cho nhóm sản phẩm sữa nước, sữa chua và nước ép.\n• Theo dõi tiến độ sell-in, sell-out tại 2 Nhà phân phối ủy quyền và 120 điểm tạp hóa, đại lý sữa lớn.\n• Đàm phán cung ứng gói sản phẩm dinh dưỡng cho các chuỗi trường mầm non và quán cà phê đối tác trên địa bàn.\n• Đào tạo kỹ năng tư vấn sản phẩm và trưng bày điểm bán cho nhân viên mới gia nhập đội.',
        achievements:
          '• Đạt 108% chỉ tiêu doanh số năm 2024, mang lại mức tăng trưởng 14% so với năm trước.\n• Mở rộng thành công 35 điểm bán mới kênh quán ăn và chuỗi giải khát.',
      },
      {
        company_name: 'Công ty TNHH FrieslandCampina Việt Nam (Cô Gái Hà Lan)',
        position_title: 'Senior Sales Executive (Chuyên viên Bán hàng Cao cấp)',
        start_date: '2019-01-01',
        end_date: '2023-07-31',
        description:
          '• Trực tiếp đi tuyến bán hàng, chăm sóc 110 đại lý bán lẻ và cửa hàng tạp hóa khu vực Quận 9 và Quận 2 cũ.\n• Giới thiệu sản phẩm mới, kiểm tra bảng giá, hạn sử dụng và sắp xếp kệ trưng bày tại điểm bán.\n• Thu hồi công nợ đúng hạn và hỗ trợ đại lý xử lý các vướng mắc về chính sách khuyến mại.',
        achievements:
          '• Đạt danh hiệu Best Seller miền Đông năm 2021.\n• Tăng doanh thu tuyến bán hàng được giao thêm 22% sau 2 năm phụ trách.',
      },
      {
        company_name: 'Công ty Cổ phần Thực phẩm Dinh dưỡng NutiFood',
        position_title: 'Sales Representative (Nhân viên Kinh doanh)',
        start_date: '2017-08-01',
        end_date: '2018-12-31',
        description:
          '• Đi tuyến thị trường hàng ngày, chào bán các dòng sữa bột và ngũ cốc dinh dưỡng cho cửa hàng mẹ và bé.\n• Đạt chỉ tiêu viếng thăm 25 điểm bán/ngày.',
        achievements:
          '• Luôn hoàn thành 100% KPI điểm bán viếng thăm và đơn hàng thành công.',
      },
    ],
    skills: [
      { skill_name: 'Quản lý Đội ngũ Sales & Giám sát Địa bàn', proficiency_level: 'INTERMEDIATE', normalized_name: 'sales team management territory leadership' },
      { skill_name: 'Phát triển Mạng lưới Nhà phân phối & Đại lý', proficiency_level: 'ADVANCED', normalized_name: 'distributor channel management' },
      { skill_name: 'Quản trị Doanh số & Hoạch định Dự báo', proficiency_level: 'INTERMEDIATE', normalized_name: 'sales target revenue forecasting' },
      { skill_name: 'Khai thác Thị trường Horeca & Foodservice', proficiency_level: 'ADVANCED', normalized_name: 'horeca foodservice market penetration' },
      { skill_name: 'Đàm phán Điều khoản Thương mại & Key Account', proficiency_level: 'ADVANCED', normalized_name: 'commercial negotiation key accounts' },
      { skill_name: 'Huấn luyện & Phát triển Năng lực Bán hàng', proficiency_level: 'INTERMEDIATE', normalized_name: 'sales coaching field training' },
      { skill_name: 'FMCG Food & Beverage Industry', proficiency_level: 'ADVANCED', normalized_name: 'fmcg food beverage industry' },
      { skill_name: 'Quản trị Chỉ số KPI Bán lẻ', proficiency_level: 'ADVANCED', normalized_name: 'retail kpi management' },
    ],
    certificates: [
      { certificate_name: 'Professional Field Sales Coaching (VMS Academy)' },
    ],
  },

  // -----------------------------------------------------------------------------------------------
  // CANDIDATE 05 — WRONG DOMAIN (Real Estate / Property Sales Manager - 0% FMCG/F&B)
  // -----------------------------------------------------------------------------------------------
  {
    code: 'CANDIDATE-05',
    archetype: 'Wrong Domain (Real Estate Brokerage)',
    name: 'Trịnh Công Danh',
    email: 'trinh.cong.danh.property@landgroup.vn',
    phone: '0909887766',
    desiredTitle: 'Giám Đốc Sàn Giao Dịch / Trưởng Phòng Kinh Doanh Bất Động Sản',
    summary:
      '8.5 năm kinh nghiệm phân phối và kinh doanh bất động sản thương mại, đất nền và căn hộ cao cấp tại TP.HCM & Bình Dương. Hơn 6.0 năm làm Trưởng phòng Kinh doanh BĐS tại Đất Xanh Group và Novaland. Quản lý trực tiếp sàn giao dịch gồm 22 chuyên viên môi giới bất động sản B2C. Kỹ năng đàm phán hợp đồng cọc hàng chục tỷ đồng, tổ chức sự kiện mở bán tập trung, phân bổ chỉ tiêu doanh số môi giới.',
    expectedLevel: 'LOW',
    expectedOrderTier: 'Tier 4 (Wrong Domain / Low Fit)',
    profile: {
      desired_title: 'Giám Đốc Sàn Giao Dịch / Trưởng Phòng Kinh Doanh Bất Động Sản',
      professional_summary:
        '8.5 năm kinh nghiệm phân phối và kinh doanh bất động sản thương mại, đất nền và căn hộ cao cấp tại TP.HCM & Bình Dương. Hơn 6.0 năm làm Trưởng phòng Kinh doanh BĐS tại Đất Xanh Group và Novaland. Quản lý trực tiếp sàn giao dịch gồm 22 chuyên viên môi giới bất động sản B2C. Kỹ năng đàm phán hợp đồng cọc hàng chục tỷ đồng, tổ chức sự kiện mở bán tập trung, phân bổ chỉ tiêu doanh số môi giới.',
    },
    educations: [
      {
        school_name: 'Trường Đại học Tôn Đức Thắng',
        major: 'Quản trị Kinh doanh Bất động sản & Luật Kinh tế',
        degree: 'Cử nhân Kinh tế',
        start_date: '2012-09-01',
        end_date: '2016-06-30',
      },
    ],
    work_experiences: [
      {
        company_name: 'Tập đoàn Đất Xanh (Dat Xanh Group)',
        position_title: 'Trưởng phòng Kinh doanh Sàn Giao dịch Bất động sản (Real Estate Sales Manager)',
        start_date: '2019-09-01',
        end_date: '2025-08-30',
        description:
          '• Quản lý và điều hành trực tiếp sàn giao dịch BĐS gồm 22 chuyên viên kinh doanh và 2 trưởng nhóm môi giới.\n• Phân bổ chỉ tiêu doanh thu phí môi giới và giá trị giao dịch căn hộ, biệt thự theo từng chiến dịch dự án mở bán.\n• Trực tiếp đào tạo kỹ năng telesales, telesales B2C, chạy quảng cáo tìm kiếm khách hàng mua nhà và kỹ năng chốt cọc tại sự kiện.\n• Đàm phán các hợp đồng môi giới độc quyền với chủ đầu tư và trực tiếp tư vấn chốt giao dịch cho các nhà đầu tư lớn (VIP Clients).\n• Không làm việc với chuỗi cung ứng, nhà phân phối tiêu dùng hay hàng hóa thực phẩm F&B.',
        achievements:
          '• Đạt giải Sàn Kinh doanh Xuất sắc nhất khu vực Đông TP.HCM năm 2021 với tổng giá trị giao dịch phân phối đạt 650 tỷ VND.\n• Đào tạo hơn 40 chuyên viên môi giới BĐS từ chưa có kinh nghiệm đến khi phát sinh giao dịch thành công.',
      },
      {
        company_name: 'Tập đoàn Đầu tư Địa ốc No Va (Novaland Group)',
        position_title: 'Chuyên viên Tư vấn Đầu tư Bất động sản Cao cấp (Senior Property Consultant)',
        start_date: '2016-08-01',
        end_date: '2019-08-31',
        description:
          '• Tìm kiếm, mở rộng tệp khách hàng cá nhân có dòng tiền nhàn rỗi đầu tư dự án căn hộ hạng sang và shophouse.\n• Tổ chức tiếp khách tại nhà mẫu và hỗ trợ hoàn tất thủ tục vay vốn ngân hàng bảo lãnh dự án.',
        achievements:
          '• Chốt thành công 28 giao dịch căn hộ cao cấp và shophouse, đạt doanh thu phí cá nhân thuộc Top 5 của sàn.',
      },
    ],
    skills: [
      { skill_name: 'Quản lý Đội ngũ Sales & Giám sát Địa bàn', proficiency_level: 'ADVANCED', normalized_name: 'sales team management territory leadership' },
      { skill_name: 'Bất động sản & Môi giới Dự án Cao cấp', proficiency_level: 'EXPERT', normalized_name: 'real estate property brokerage high end' },
      { skill_name: 'Đàm phán Hợp đồng Giao dịch Giá trị Lớn', proficiency_level: 'EXPERT', normalized_name: 'high value transaction contract negotiation' },
      { skill_name: 'Tổ chức Sự kiện Mở bán & Chốt cọc B2C', proficiency_level: 'EXPERT', normalized_name: 'sales event launch b2c deal closing' },
      { skill_name: 'Huấn luyện & Phát triển Năng lực Bán hàng', proficiency_level: 'ADVANCED', normalized_name: 'sales coaching field training' },
      { skill_name: 'Quản trị Chỉ số KPI & Doanh số Sàn', proficiency_level: 'ADVANCED', normalized_name: 'kpi management sales performance' },
      { skill_name: 'Telesales & Digital Lead Conversion', proficiency_level: 'EXPERT', normalized_name: 'telesales digital lead conversion' },
    ],
    certificates: [
      { certificate_name: 'Chứng chỉ Hành nghề Môi giới Bất động sản (Sở Xây Dựng TP.HCM)' },
    ],
  },

  // -----------------------------------------------------------------------------------------------
  // CANDIDATE 06 — TRANSFERABLE DOMAIN (Pharma / Medical Sales Manager)
  // -----------------------------------------------------------------------------------------------
  {
    code: 'CANDIDATE-06',
    archetype: 'Transferable Domain (Pharma Territory Manager)',
    name: 'Đặng Tiến Dũng',
    email: 'dang.tien.dung.pharma@healthcare-talent.vn',
    phone: '0912445566',
    desiredTitle: 'Area Sales Manager / Territory Commercial Manager',
    summary:
      '8.5 năm kinh nghiệm quản lý kinh doanh địa bàn trong ngành Dược phẩm & Thiết bị Y tế (Sanofi, Zuellig Pharma). Hơn 5.5 năm làm Quản lý Kinh doanh Khu vực (Area Sales Manager) phụ trách kênh ETC (Bệnh viện lớn) và OTC (Nhà thuốc & Chuỗi bán lẻ Dược). Quản lý đội ngũ 14 Trình dược viên và Giám sát viên, phụ trách doanh thu 85 tỷ VND/năm tại TP.HCM và các tỉnh lân cận. Am hiểu sâu sắc về quản trị đại lý phân phối thuốc, dự báo nhu cầu sản lượng theo mùa và đàm phán hợp đồng thầu thương mại.',
    expectedLevel: 'MEDIUM',
    expectedOrderTier: 'Tier 2 / Tier 3 (Transferable Moderate Match)',
    profile: {
      desired_title: 'Area Sales Manager / Territory Commercial Manager',
      professional_summary:
        '8.5 năm kinh nghiệm quản lý kinh doanh địa bàn trong ngành Dược phẩm & Thiết bị Y tế (Sanofi, Zuellig Pharma). Hơn 5.5 năm làm Quản lý Kinh doanh Khu vực (Area Sales Manager) phụ trách kênh ETC (Bệnh viện lớn) và OTC (Nhà thuốc & Chuỗi bán lẻ Dược). Quản lý đội ngũ 14 Trình dược viên và Giám sát viên, phụ trách doanh thu 85 tỷ VND/năm tại TP.HCM và các tỉnh lân cận. Am hiểu sâu sắc về quản trị đại lý phân phối thuốc, dự báo nhu cầu sản lượng theo mùa và đàm phán hợp đồng thầu thương mại.',
    },
    educations: [
      {
        school_name: 'Đại học Y Dược TP. Hồ Chí Minh',
        major: 'Dược học & Quản trị Kinh doanh Dược (Pharmacy)',
        degree: 'Dược sĩ Đại học (Bachelor of Pharmacy)',
        start_date: '2011-09-01',
        end_date: '2016-06-30',
      },
    ],
    work_experiences: [
      {
        company_name: 'Công ty Cổ phần Dược phẩm Zuellig Pharma Việt Nam',
        position_title: 'Area Sales Manager - Southern Region (Quản lý Bán hàng Khu vực Miền Nam)',
        start_date: '2020-01-01',
        end_date: '2025-08-30',
        description:
          '• Hoạch định và triển khai chiến lược kinh doanh cho nhóm sản phẩm chăm sóc sức khỏe và thuốc điều trị tại khu vực TP.HCM & Miền Tây.\n• Quản lý trực tiếp 14 Trình dược viên (Medical Reps) và 2 Giám sát bán hàng kênh nhà thuốc OTC.\n• Quản trị hệ thống 6 đại lý phân phối dược phẩm cấp tỉnh, giám sát chỉ tiêu sell-in/sell-out, vòng quay tồn kho và chuẩn hóa quy trình bảo quản GSP.\n• Đàm phán trực tiếp hợp đồng cung ứng và chính sách giá cho các chuỗi nhà thuốc hiện đại (Long Châu, An Khang, Pharmacity) và các bệnh viện tư nhân lớn.\n• Xây dựng dự báo nhu cầu sản lượng (Forecasting) theo quý kết hợp với dữ liệu dịch bệnh và mùa vụ.\n• Định kỳ tổ chức huấn luyện kỹ năng tư vấn chuyên môn, quy chuẩn chào hàng và xử lý thắc mắc cho đội ngũ bán hàng.',
        achievements:
          '• Đạt 112% chỉ tiêu doanh số năm 2023, doanh thu toàn vùng đạt 92 tỷ VND.\n• Tăng độ phủ sản phẩm trên kênh chuỗi nhà thuốc hiện đại từ 62% lên 88% sau 2 năm triển khai.',
      },
      {
        company_name: 'Sanofi-Aventis Vietnam',
        position_title: 'Territory Medical Representative (Đại diện Thương mại Địa bàn)',
        start_date: '2016-08-01',
        end_date: '2019-12-31',
        description:
          '• Phụ trách giới thiệu sản phẩm và phát triển doanh số tại các bệnh viện tuyến quận và trung tâm y tế tại TP.HCM.\n• Xây dựng mối quan hệ chuyên môn với các bác sĩ trưởng khoa và dược sĩ nhà thuốc bệnh viện.\n• Thu thập phản hồi thị trường và thông tin đấu thầu thuốc của các đối thủ cạnh tranh.',
        achievements:
          '• Đạt danh hiệu Best Medical Representative miền Nam năm 2018.',
      },
    ],
    skills: [
      { skill_name: 'Quản lý Đội ngũ Sales & Giám sát Địa bàn', proficiency_level: 'ADVANCED', normalized_name: 'sales team management territory leadership' },
      { skill_name: 'Phát triển Mạng lưới Nhà phân phối & Đại lý', proficiency_level: 'ADVANCED', normalized_name: 'distributor channel management' },
      { skill_name: 'Quản trị Doanh số & Hoạch định Dự báo', proficiency_level: 'ADVANCED', normalized_name: 'sales target revenue forecasting' },
      { skill_name: 'Đàm phán Điều khoản Thương mại & Key Account', proficiency_level: 'ADVANCED', normalized_name: 'commercial negotiation key accounts' },
      { skill_name: 'Huấn luyện & Phát triển Năng lực Bán hàng', proficiency_level: 'ADVANCED', normalized_name: 'sales coaching field training' },
      { skill_name: 'Phân tích Thị trường & Nghiên cứu Đối thủ', proficiency_level: 'ADVANCED', normalized_name: 'market analysis competitor intelligence' },
      { skill_name: 'Hoạch định Chiến lược Kinh doanh Khu vực', proficiency_level: 'ADVANCED', normalized_name: 'area business planning execution' },
      { skill_name: 'Quản trị Kênh Phân phối Dược phẩm OTC & Bệnh viện ETC', proficiency_level: 'EXPERT', normalized_name: 'pharmaceutical otc etc distribution channel' },
    ],
    certificates: [
      { certificate_name: 'Healthcare Commercial Management & Compliance Certification' },
    ],
  },

  // -----------------------------------------------------------------------------------------------
  // CANDIDATE 07 — STRONG INDIVIDUAL CONTRIBUTOR (10 yrs FMCG Sales Star, but NO People Management)
  // -----------------------------------------------------------------------------------------------
  {
    code: 'CANDIDATE-07',
    archetype: 'Senior Individual Contributor (Zero Mgmt)',
    name: 'Phan Trọng Hiếu',
    email: 'phan.trong.hieu.kam@fmcg-sales.vn',
    phone: '0903998877',
    desiredTitle: 'Senior Key Account Manager (FMCG Modern Trade & Foodservice)',
    summary:
      '10.5 năm kinh nghiệm chuyên sâu trong vai trò Chuyên gia Bán hàng Cá nhân Cao cấp (Senior Key Account Executive / Key Account Manager) tại Unilever và Mondelez Kinh Đô. Chuyên trách trực tiếp đàm phán hợp đồng thương mại lớn với các chuỗi đại siêu thị Co.opmart, WinMart, Big C / Go! và Lotte Mart. Doanh số cá nhân quản lý đạt trên 80 tỷ VND/năm, liên tục vượt chỉ tiêu doanh số 7 năm liền. Năng lực đàm phán chiết khấu, khuyến mại và giải quyết tranh chấp thương mại xuất sắc. Không có kinh nghiệm quản lý đội ngũ nhân viên cấp dưới trực tiếp (Individual Contributor).',
    expectedLevel: 'MEDIUM',
    expectedOrderTier: 'Tier 3 (Senior IC / Missing People Leadership)',
    profile: {
      desired_title: 'Senior Key Account Manager (FMCG Modern Trade & Foodservice)',
      professional_summary:
        '10.5 năm kinh nghiệm chuyên sâu trong vai trò Chuyên gia Bán hàng Cá nhân Cao cấp (Senior Key Account Executive / Key Account Manager) tại Unilever và Mondelez Kinh Đô. Chuyên trách trực tiếp đàm phán hợp đồng thương mại lớn với các chuỗi đại siêu thị Co.opmart, WinMart, Big C / Go! và Lotte Mart. Doanh số cá nhân quản lý đạt trên 80 tỷ VND/năm, liên tục vượt chỉ tiêu doanh số 7 năm liền. Năng lực đàm phán chiết khấu, khuyến mại và giải quyết tranh chấp thương mại xuất sắc. Không có kinh nghiệm quản lý đội ngũ nhân viên cấp dưới trực tiếp (Individual Contributor).',
    },
    educations: [
      {
        school_name: 'Đại học Kinh tế - Luật (UEL) - ĐHQG TP.HCM',
        major: 'Kinh tế Đối ngoại & Ngoại thương',
        degree: 'Cử nhân Kinh tế',
        start_date: '2010-09-01',
        end_date: '2014-06-30',
      },
    ],
    work_experiences: [
      {
        company_name: 'Công ty TNHH Quốc tế Unilever Việt Nam',
        position_title: 'Senior Key Account Manager (Quản lý Khách hàng Trọng điểm Quốc gia)',
        start_date: '2019-03-01',
        end_date: '2025-08-30',
        description:
          '• Trực tiếp phụ trách tài khoản khách hàng chiến lược: Saigon Co.op (hơn 130 siêu thị Co.opmart toàn quốc) và WinCommerce (hơn 3,000 cửa hàng WinMart/WinMart+).\n• Trực tiếp xây dựng bản kế hoạch kinh doanh hàng năm (Joint Business Plan - JBP) với Giám đốc Thu mua của đối tác.\n• Đàm phán các điều khoản thương mại phức tạp: mức chiết khấu thương mại, phí mở mã hàng mới, chi phí vị trí trưng bày đầu kệ (gondola end) và lịch khuyến mại trọng điểm.\n• Theo dõi sát sao chỉ số doanh thu sell-out, tỷ lệ giao hàng đúng hạn (OTIF) và công nợ định kỳ.\n• Làm việc độc lập theo mô hình Individual Contributor, không có nhân viên cấp dưới trực tiếp báo cáo (không quản lý team).',
        achievements:
          '• Đạt 116% chỉ tiêu doanh thu năm 2023, doanh số trực tiếp đàm phán đạt 95 tỷ VND.\n• Đàm phán thành công việc gia tăng 15% diện tích trưng bày sản phẩm mới trong toàn hệ thống siêu thị với mức chi phí tối ưu.',
      },
      {
        company_name: 'Công ty Cổ phần Mondelez Kinh Đô Việt Nam',
        position_title: 'Key Account Executive (Chuyên viên Khách hàng Trọng điểm)',
        start_date: '2014-08-01',
        end_date: '2019-02-28',
        description:
          '• Phụ trách nhóm khách hàng chuỗi siêu thị Lotte Mart, Big C và Aeon Mall khu vực phía Nam.\n• Lập đơn hàng định kỳ, đối chiếu tồn kho tại các trung tâm phân phối và giải quyết các khiếu nại về hàng hư hỏng/đổi trả.\n• Tham gia đàm phán các chương trình khuyến mại mùa vụ Bánh Trung Thu và Tết Nguyên Đán.',
        achievements:
          '• Đạt danh hiệu Best Key Account Performer năm 2017 với mức tăng trưởng doanh số 24%.',
      },
    ],
    skills: [
      { skill_name: 'Đàm phán Điều khoản Thương mại & Key Account', proficiency_level: 'EXPERT', normalized_name: 'commercial negotiation key accounts' },
      { skill_name: 'Khai thác Thị trường Horeca & Foodservice', proficiency_level: 'ADVANCED', normalized_name: 'horeca foodservice market penetration' },
      { skill_name: 'Quản trị Doanh số & Hoạch định Dự báo', proficiency_level: 'ADVANCED', normalized_name: 'sales target revenue forecasting' },
      { skill_name: 'Phân tích Thị trường & Nghiên cứu Đối thủ', proficiency_level: 'ADVANCED', normalized_name: 'market analysis competitor intelligence' },
      { skill_name: 'FMCG Food & Beverage Industry', proficiency_level: 'EXPERT', normalized_name: 'fmcg food beverage industry' },
      { skill_name: 'Joint Business Planning (JBP)', proficiency_level: 'EXPERT', normalized_name: 'joint business planning jbp' },
      { skill_name: 'Modern Trade Management', proficiency_level: 'EXPERT', normalized_name: 'modern trade management' },
    ],
    certificates: [
      { certificate_name: 'Advanced Key Account Strategic Negotiation (Karrass)' },
    ],
  },

  // -----------------------------------------------------------------------------------------------
  // CANDIDATE 08 — TITLE / SENIORITY TRAP (Title "Regional Sales Director" at tiny shop, 2 staff)
  // -----------------------------------------------------------------------------------------------
  {
    code: 'CANDIDATE-08',
    archetype: 'Title Inflation Trap',
    name: 'Đỗ Minh Khang',
    email: 'do.minh.khang.director@saigon-freshfood.vn',
    phone: '0977223344',
    desiredTitle: 'Regional Sales Director / Area Sales Manager',
    summary:
      'Giám Đốc Kinh Doanh Vùng (Regional Sales Director) với hơn 6.0 năm lãnh đạo bộ phận kinh doanh tại Công ty TNHH Dịch vụ Thực phẩm Sài Gòn Xanh. Am hiểu sâu sắc về điều hành chiến lược, bao quát toàn bộ thị trường miền Nam, phụ trách mở rộng khách hàng và quản lý doanh thu.',
    expectedLevel: 'LOW',
    expectedOrderTier: 'Tier 4 (Title Inflation / Tiny Scope)',
    profile: {
      desired_title: 'Regional Sales Director / Area Sales Manager',
      professional_summary:
        'Giám Đốc Kinh Doanh Vùng (Regional Sales Director) với hơn 6.0 năm lãnh đạo bộ phận kinh doanh tại Công ty TNHH Dịch vụ Thực phẩm Sài Gòn Xanh. Am hiểu sâu sắc về điều hành chiến lược, bao quát toàn bộ thị trường miền Nam, phụ trách mở rộng khách hàng và quản lý doanh thu.',
    },
    educations: [
      {
        school_name: 'Trường Đại học Công nghiệp TP.HCM (IUH)',
        major: 'Quản trị Kinh doanh',
        degree: 'Cử nhân Đại học',
        start_date: '2014-09-01',
        end_date: '2018-06-30',
      },
    ],
    work_experiences: [
      {
        company_name: 'Công ty TNHH Dịch vụ Nông sản Thực phẩm Sài Gòn Xanh (Quy mô 5 nhân viên)',
        position_title: 'Regional Sales Director (Giám đốc Kinh doanh Vùng)',
        start_date: '2020-03-01',
        end_date: '2025-08-30',
        description:
          '• Giữ chức danh Giám đốc Kinh doanh tại công ty gia đình phân phối rau củ và trứng gà sạch quy mô nhỏ.\n• Quản lý trực tiếp 2 nhân viên bán hàng kiêm giao hàng bằng xe máy.\n• Đích thân đi xe máy tiếp cận các quán cơm bình dân, tiệm tạp hóa nhỏ và bếp ăn gia đình quanh khu vực Quận Tân Bình và Gò Vấp để giao hàng và thu tiền mặt trực tiếp.\n• Doanh số trung bình toàn công ty đạt khoảng 350 - 450 triệu VND/tháng (khoảng 5 tỷ VND/năm).\n• Tự tay ghi chép sổ sách thu chi, nhập đơn hàng vào file Excel đơn giản và giải quyết các khiếu nại về rau héo, trứng vỡ.',
        achievements:
          '• Duy trì nguồn thu ổn định cho cửa hàng gia đình trong giai đoạn khó khăn sau dịch.\n• Ký được thỏa thuận cung cấp rau củ cho 3 quán cơm văn phòng tại Quận Tân Bình.',
      },
      {
        company_name: 'Hộ Kinh doanh Thực phẩm Sạch Minh Phát',
        position_title: 'Trưởng nhóm Bán hàng (Sales Team Leader)',
        start_date: '2018-08-01',
        end_date: '2020-02-28',
        description:
          '• Trực tiếp đứng bán hàng tại quầy thực phẩm sạch và quản lý 1 nhân viên thu ngân.\n• Kiểm đếm số lượng hàng tồn cuối ngày và gọi điện đặt thêm hàng từ các vựa đầu mối.',
        achievements:
          '• Tăng lượng khách hàng quen ghé mua lẻ tại cửa hàng thêm 15%.',
      },
    ],
    skills: [
      { skill_name: 'Regional Sales Director Leadership', proficiency_level: 'EXPERT', normalized_name: 'regional sales director leadership' },
      { skill_name: 'Quản lý Đội ngũ Sales & Giám sát Địa bàn', proficiency_level: 'ADVANCED', normalized_name: 'sales team management territory leadership' },
      { skill_name: 'Khai thác Thị trường Horeca & Foodservice', proficiency_level: 'INTERMEDIATE', normalized_name: 'horeca foodservice market penetration' },
      { skill_name: 'Bán lẻ Thực phẩm & Phân phối Tạp hóa', proficiency_level: 'INTERMEDIATE', normalized_name: 'food retail grocery distribution' },
      { skill_name: 'Đàm phán Điều khoản Thương mại & Key Account', proficiency_level: 'BEGINNER', normalized_name: 'commercial negotiation key accounts' },
      { skill_name: 'Quản trị Doanh số & Hoạch định Dự báo', proficiency_level: 'BEGINNER', normalized_name: 'sales target revenue forecasting' },
    ],
    certificates: [
      { certificate_name: 'Giấy chứng nhận An toàn Vệ sinh Thực phẩm cơ sở kinh doanh' },
    ],
  },

  // -----------------------------------------------------------------------------------------------
  // CANDIDATE 09 — REALISTIC COMPLEX PROFILE (Career break, transition, consulting overlap)
  // -----------------------------------------------------------------------------------------------
  {
    code: 'CANDIDATE-09',
    archetype: 'Realistic Complex Career Path',
    name: 'Trần Mai Phương',
    email: 'tran.mai.phuong.fmcg@consulting-fnb.vn',
    phone: '0908556677',
    desiredTitle: 'Area Sales Manager / Commercial Distribution Specialist',
    summary:
      'Hơn 11 năm kinh nghiệm trong ngành thương mại đồ uống và thực phẩm đóng gói. Từng có 5 năm làm Giám sát Bán hàng và Trợ lý Quản lý Vùng (Assistant ASM) tại Nestlé Waters. Có 1 năm nghỉ học nâng cao Thạc sĩ Marketing (ĐH Kinh tế) và 2.5 năm làm Chuyên gia Tư vấn Kênh Phân phối Thương mại (Distribution Advisor) song song với vai trò Điều hành Kinh doanh bán thời gian cho thương hiệu đồ uống thủ công. Năng lực thực chiến về quản trị nhà phân phối, xây dựng quy chuẩn bán hàng và tái cơ cấu địa bàn rất tốt.',
    expectedLevel: 'MEDIUM',
    expectedOrderTier: 'Tier 2 / Tier 3 (Realistic Complex Fit)',
    profile: {
      desired_title: 'Area Sales Manager / Commercial Distribution Specialist',
      professional_summary:
        'Hơn 11 năm kinh nghiệm trong ngành thương mại đồ uống và thực phẩm đóng gói. Từng có 5 năm làm Giám sát Bán hàng và Trợ lý Quản lý Vùng (Assistant ASM) tại Nestlé Waters. Có 1 năm nghỉ học nâng cao Thạc sĩ Marketing (ĐH Kinh tế) và 2.5 năm làm Chuyên gia Tư vấn Kênh Phân phối Thương mại (Distribution Advisor) song song với vai trò Điều hành Kinh doanh bán thời gian cho thương hiệu đồ uống thủ công. Năng lực thực chiến về quản trị nhà phân phối, xây dựng quy chuẩn bán hàng và tái cơ cấu địa bàn rất tốt.',
    },
    educations: [
      {
        school_name: 'Trường Đại học Kinh tế TP. Hồ Chí Minh (UEH)',
        major: 'Thạc sĩ Quản trị Marketing & Thương mại Quốc tế',
        degree: 'Thạc sĩ Kinh tế (Master of Commerce)',
        start_date: '2021-09-01',
        end_date: '2022-12-30',
      },
      {
        school_name: 'Trường Đại học Cần Thơ',
        major: 'Công nghệ Thực phẩm & Quản trị Kinh doanh',
        degree: 'Kỹ sư & Cử nhân (Bachelor of Food Technology)',
        start_date: '2009-09-01',
        end_date: '2013-06-30',
      },
    ],
    work_experiences: [
      {
        company_name: 'Dự án Tư vấn Tái cấu trúc Kênh Phân phối Thực phẩm AgriFood (Consultant)',
        position_title: 'Chuyên gia Cố vấn Kênh Bán hàng & Phân phối (Commercial Channel Advisor)',
        start_date: '2023-01-01',
        end_date: '2025-08-30',
        description:
          '• Cố vấn độc lập xây dựng quy chế quản lý nhà phân phối, cơ chế chiết khấu và tiêu chuẩn đo lường KPI cho 3 doanh nghiệp thực phẩm chế biến tại miền Nam.\n• Thiết lập lại quy trình đi tuyến, hệ thống báo cáo bán hàng tự động qua app DMS cho 30 nhân viên bán hàng của đối tác.\n• Hoạt động song song với vai trò Quản lý Bán hàng Dự án bán thời gian.',
        achievements:
          '• Giúp đối tác nâng tỷ lệ độ phủ điểm bán thêm 28% và chuẩn hóa hệ thống 5 nhà phân phối cấp tỉnh.',
      },
      {
        company_name: 'Công ty Cổ phần Nước khoáng La Vie (Nestlé Waters Vietnam)',
        position_title: 'Territory Sales Supervisor & Acting Area Manager (Giám sát Bán hàng Khu vực)',
        start_date: '2016-01-01',
        end_date: '2021-08-31',
        description:
          '• Phụ trách quản trị mạng lưới bán lẻ và kênh Horeca sản phẩm nước khoáng cao cấp tại khu vực Quận 1, Quận 3 và Quận 7.\n• Quản lý trực tiếp đội ngũ 11 nhân viên bán hàng và hỗ trợ điều phối 4 đại lý phân phối lớn.\n• Đàm phán ký kết hợp đồng cung cấp nước khoáng độc quyền cho 65 khách sạn 4-5 sao và nhà hàng ẩm thực cao cấp.\n• Tạm nghỉ từ tháng 9/2021 đến cuối năm 2022 để hoàn thành chương trình Thạc sĩ tập trung.',
        achievements:
          '• Đạt mức tăng trưởng doanh số bình quân 16%/năm trong suốt 5 năm phụ trách địa bàn.',
      },
      {
        company_name: 'Công ty Cổ phần Thực phẩm Cần Thơ',
        position_title: 'Sales Executive (Nhân viên Bán hàng)',
        start_date: '2013-08-01',
        end_date: '2015-12-31',
        description:
          '• Phát triển mạng lưới đại lý bánh kẹo và thực phẩm đóng hộp tại các tỉnh Tây Nam Bộ.',
        achievements:
          '• Hoàn thành chỉ tiêu doanh thu được giao.',
      },
    ],
    skills: [
      { skill_name: 'Quản lý Đội ngũ Sales & Giám sát Địa bàn', proficiency_level: 'ADVANCED', normalized_name: 'sales team management territory leadership' },
      { skill_name: 'Phát triển Mạng lưới Nhà phân phối & Đại lý', proficiency_level: 'EXPERT', normalized_name: 'distributor channel management' },
      { skill_name: 'Quản trị Doanh số & Hoạch định Dự báo', proficiency_level: 'ADVANCED', normalized_name: 'sales target revenue forecasting' },
      { skill_name: 'Khai thác Thị trường Horeca & Foodservice', proficiency_level: 'ADVANCED', normalized_name: 'horeca foodservice market penetration' },
      { skill_name: 'Đàm phán Điều khoản Thương mại & Key Account', proficiency_level: 'ADVANCED', normalized_name: 'commercial negotiation key accounts' },
      { skill_name: 'Huấn luyện & Phát triển Năng lực Bán hàng', proficiency_level: 'ADVANCED', normalized_name: 'sales coaching field training' },
      { skill_name: 'Hoạch định Chiến lược Kinh doanh Khu vực', proficiency_level: 'ADVANCED', normalized_name: 'area business planning execution' },
      { skill_name: 'FMCG Food & Beverage Industry', proficiency_level: 'ADVANCED', normalized_name: 'fmcg food beverage industry' },
    ],
    certificates: [
      { certificate_name: 'Certified Distribution Management Professional' },
    ],
  },

  // -----------------------------------------------------------------------------------------------
  // CANDIDATE 10 — HIGHLY QUALIFIED BUT LOW-KEYWORD CV (Super fit, writes purely in operational metrics)
  // -----------------------------------------------------------------------------------------------
  {
    code: 'CANDIDATE-10',
    archetype: 'Highly Qualified Low-Keyword Hero',
    name: 'Nguyễn Văn Thành',
    email: 'nguyen.van.thanh.asm@vietnam-foods.vn',
    phone: '0907119922',
    desiredTitle: 'Trưởng Vùng Bán Hàng (Khu Vực Đông Nam Bộ)',
    summary:
      'Hơn 11 năm trực tiếp điều hành và thúc đẩy sản lượng tiêu thụ hàng thực phẩm tiện lợi, nước sốt và gia vị bếp tại thị trường trọng điểm phía Nam. Gần 7 năm giữ trọng trách chỉ huy mạng lưới kinh doanh tại Công ty Cổ phần Acecook Việt Nam và Thực phẩm Cholimex. Phụ trách 18 nhân viên kinh doanh tại 4 tỉnh, tổ chức weekly review, ride-along và coaching theo từng territory. Xây dựng kế hoạch sản lượng theo mùa vụ dựa trên lịch sử sell-out, tồn kho distributor và tốc độ tiêu thụ từng tỉnh. Đã mở rộng thành công hơn 120 điểm tiêu thụ tại các nhà hàng, bếp ăn công nghiệp và chuỗi ẩm thực.',
    expectedLevel: 'HIGH',
    expectedOrderTier: 'Tier 1 (Top Match / Semantic Master)',
    profile: {
      desired_title: 'Trưởng Vùng Bán Hàng (Khu Vực Đông Nam Bộ)',
      professional_summary:
        'Hơn 11 năm trực tiếp điều hành và thúc đẩy sản lượng tiêu thụ hàng thực phẩm tiện lợi, nước sốt và gia vị bếp tại thị trường trọng điểm phía Nam. Gần 7 năm giữ trọng trách chỉ huy mạng lưới kinh doanh tại Công ty Cổ phần Acecook Việt Nam và Thực phẩm Cholimex. Phụ trách 18 nhân viên kinh doanh tại 4 tỉnh, tổ chức weekly review, ride-along và coaching theo từng territory. Xây dựng kế hoạch sản lượng theo mùa vụ dựa trên lịch sử sell-out, tồn kho distributor và tốc độ tiêu thụ từng tỉnh. Đã mở rộng thành công hơn 120 điểm tiêu thụ tại các nhà hàng, bếp ăn công nghiệp và chuỗi ẩm thực.',
    },
    educations: [
      {
        school_name: 'Trường Đại học Bách Khoa - ĐHQG TP.HCM',
        major: 'Quản trị Công nghiệp & Thương mại Dịch vụ',
        degree: 'Kỹ sư Quản trị Công nghiệp (Bachelor of Industrial Management)',
        start_date: '2009-09-01',
        end_date: '2014-01-30',
      },
    ],
    work_experiences: [
      {
        company_name: 'Công ty Cổ phần Acecook Việt Nam',
        position_title: 'Trưởng Vùng Kinh Doanh Địa Bàn (Senior Area Commercial In-Charge)',
        start_date: '2019-06-01',
        end_date: '2025-08-30',
        description:
          '• Phụ trách 18 nhân viên kinh doanh tại 4 tỉnh (TP.HCM, Bình Dương, Tây Ninh, Bà Rịa - Vũng Tàu), tổ chức weekly review, ride-along và coaching theo từng territory.\n• Xây dựng kế hoạch sản lượng theo mùa vụ dựa trên lịch sử sell-out, tồn kho distributor và tốc độ tiêu thụ từng tỉnh để đảm bảo không đứt hàng hoặc thừa kho.\n• Theo dõi biến động giá, hoạt động khuyến mại và độ phủ của đối thủ để điều chỉnh chính sách bán hàng theo từng địa bàn.\n• Mở rộng 120 điểm tiêu thụ tại các nhà hàng, bếp ăn công nghiệp và chuỗi ẩm thực dịch vụ ăn uống quy mô lớn.\n• Trực tiếp thương lượng mức hạn mức tín dụng và chính sách thưởng cuối năm cho 7 tổng đại lý phân phối độc quyền.\n• Đánh giá định kỳ năng lực của nhân viên kinh doanh thực địa theo thang điểm chuẩn tắc nghiệp vụ.',
        achievements:
          '• Đưa doanh thu toàn vùng từ 94 tỷ lên 132 tỷ VND sau 4 năm (đạt 115% kế hoạch hàng năm).\n• Nâng tỷ lệ bao phủ các bếp ăn và nhà hàng ẩm thực từ 42% lên 78% địa bàn phụ trách.\n• Được vinh danh là Cán bộ Điều hành Thị trường Xuất sắc nhất toàn quốc năm 2022.',
      },
      {
        company_name: 'Công ty Cổ phần Thực phẩm Cholimex',
        position_title: 'Giám Sát Bán Hàng Kênh Tiêu Dùng (Field Sales Supervisor)',
        start_date: '2014-03-01',
        end_date: '2019-05-31',
        description:
          '• Phụ trách tổ công tác 10 đại diện bán hàng tuyến tạp hóa và quán ăn tại TP.HCM.\n• Đôn đốc chỉ tiêu ngày, kiểm tra chất lượng phục vụ và trực tiếp giải quyết vướng mắc về thanh toán của khách hàng lớn.',
        achievements:
          '• Luôn hoàn thành 108% chỉ tiêu sản lượng hàng tháng.',
      },
    ],
    skills: [
      { skill_name: 'Điều hành đội ngũ kinh doanh & giám sát địa bàn thực tế', proficiency_level: 'EXPERT', normalized_name: 'field sales force leadership territory execution' },
      { skill_name: 'Quản trị mạng lưới tổng đại lý & cân đối tồn kho sell-in sell-out', proficiency_level: 'EXPERT', normalized_name: 'distributor inventory balance sell-in sell-out' },
      { skill_name: 'Lập kế hoạch sản lượng mùa vụ & dự toán tiêu thụ', proficiency_level: 'EXPERT', normalized_name: 'seasonal volume planning consumption estimation' },
      { skill_name: 'Mở rộng thị phần kênh dịch vụ ẩm thực & bếp ăn công nghiệp', proficiency_level: 'EXPERT', normalized_name: 'foodservice commercial kitchen market expansion' },
      { skill_name: 'Thương lượng hạn mức thương mại & chính sách thưởng nhà phân phối', proficiency_level: 'EXPERT', normalized_name: 'commercial credit terms distributor incentive negotiation' },
      { skill_name: 'Huấn luyện thực địa & kèm cặp nhân viên theo tuyến bán', proficiency_level: 'EXPERT', normalized_name: 'field coaching route ride-along training' },
      { skill_name: 'Theo dõi động thái cạnh tranh & phản ứng chính sách thị trường', proficiency_level: 'ADVANCED', normalized_name: 'competitor surveillance market policy reaction' },
      { skill_name: 'Ngành hàng Thực phẩm Tiện lợi & Gia vị Đóng gói FMCG', proficiency_level: 'EXPERT', normalized_name: 'convenience food packaged seasoning fmcg' },
    ],
    certificates: [
      { certificate_name: 'Kỹ Năng Quản Lý Kinh Doanh Thực Chiến Đỉnh Cao (SME Academy)' },
    ],
  },
];

async function main() {
  console.log('================================================================================');
  console.log('  🔥 PHASE 4.6: REALISTIC MULTI-INDUSTRY SALES MATCHING STRESS TEST');
  console.log('  🎯 Vị trí: Quản Lý Kinh Doanh Khu Vực (Area Sales Manager - ASM) - FMCG/F&B');
  console.log('================================================================================\n');

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required.');
  }

  const supabase = createSupabaseAdminClient(supabaseUrl, supabaseSecretKey);

  // --------------------------------------------------------------------------------
  // 1. TẠO / LẤY TÀI KHOẢN HR RECRUITER & CÔNG TY FMCG
  // --------------------------------------------------------------------------------
  console.log('🏢 1. Khởi tạo Tổ chức Tuyển dụng FMCG Corporation...');
  const hrEmail = 'talent.acquisition@fmcg-holding.vn';
  const hrPassword = 'Password123@';

  const { data: userList } = await supabase.auth.admin.listUsers();
  let hrAuthId = userList?.users?.find((u) => u.email === hrEmail)?.id;

  if (!hrAuthId) {
    const { data: newHr } = await supabase.auth.admin.createUser({
      email: hrEmail,
      password: hrPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Hội đồng Tuyển dụng Tập đoàn Thực phẩm Á Châu' },
    });
    hrAuthId = newHr.user!.id;
  }

  const recruiterRole = await prisma.role.upsert({
    where: { code: 'RECRUITER' },
    update: {},
    create: { code: 'RECRUITER', name: 'Recruiter', description: 'Nhà tuyển dụng' },
  });

  const candidateRole = await prisma.role.upsert({
    where: { code: 'CANDIDATE' },
    update: {},
    create: { code: 'CANDIDATE', name: 'Candidate', description: 'Ứng viên' },
  });

  const hrUser = await prisma.user.upsert({
    where: { id: hrAuthId },
    update: { fullName: 'Hội đồng Tuyển dụng Tập đoàn Thực phẩm Á Châu' },
    create: {
      id: hrAuthId,
      email: hrEmail,
      fullName: 'Hội đồng Tuyển dụng Tập đoàn Thực phẩm Á Châu',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: hrUser.id, roleId: recruiterRole.id } },
    update: {},
    create: { userId: hrUser.id, roleId: recruiterRole.id },
  });

  const company = await prisma.company.upsert({
    where: { code: 'ASIA-FMCG-GROUP' },
    update: {},
    create: {
      name: 'Tập đoàn Thực phẩm & Đồ uống Á Châu (Asia FMCG Group)',
      code: 'ASIA-FMCG-GROUP',
      website: 'https://asiafmcggroup.vn',
      description: 'Tập đoàn sản xuất & phân phối hàng tiêu dùng nhanh (FMCG), Thực phẩm & Đồ uống hàng đầu Đông Nam Á',
    },
  });

  const dept = await prisma.department.upsert({
    where: { code: 'SALES-COMMERCIAL' },
    update: {},
    create: {
      name: 'Khối Kinh doanh & Phát triển Thương mại (Sales & Commercial Division)',
      code: 'SALES-COMMERCIAL',
      companyId: company.id,
    },
  });

  const recruiterProfile = await prisma.recruiterProfile.upsert({
    where: { userId: hrUser.id },
    update: { companyId: company.id, departmentId: dept.id },
    create: {
      userId: hrUser.id,
      companyId: company.id,
      departmentId: dept.id,
      title: 'Talent Acquisition Director',
    },
  });

  // --------------------------------------------------------------------------------
  // 2. KHỞI TẠO BÀI TUYỂN DỤNG CHUẨN: AREA SALES MANAGER (ASM)
  // --------------------------------------------------------------------------------
  console.log('\n📄 2. Đang khởi tạo JD: Quản Lý Kinh Doanh Khu Vực (Area Sales Manager - ASM)...');

  const fmcgCategory = await prisma.skillCategory.upsert({
    where: { name: 'Kinh doanh & Quản lý Phân phối (Sales & Commercial)' },
    update: {},
    create: { name: 'Kinh doanh & Quản lý Phân phối (Sales & Commercial)' },
  });

  const jdSkillsData = [
    { name: 'Quản lý Đội ngũ Sales & Giám sát Địa bàn (Sales Team Management & Territory Leadership)', norm: 'sales team management territory leadership', isMandatory: true, minLevel: ProficiencyLevel.EXPERT, minYears: 5 },
    { name: 'Phát triển Mạng lưới Nhà phân phối & Đại lý (Distributor & Channel Management)', norm: 'distributor channel management', isMandatory: true, minLevel: ProficiencyLevel.ADVANCED, minYears: 4 },
    { name: 'Quản trị Doanh số & Hoạch định Dự báo (Sales Target & Revenue Forecasting)', norm: 'sales target revenue forecasting', isMandatory: true, minLevel: ProficiencyLevel.ADVANCED, minYears: 4 },
    { name: 'Khai thác Thị trường Horeca & Foodservice (Horeca & Foodservice Market Penetration)', norm: 'horeca foodservice market penetration', isMandatory: true, minLevel: ProficiencyLevel.ADVANCED, minYears: 3 },
    { name: 'Đàm phán Điều khoản Thương mại & Key Account (Commercial Negotiation & Key Accounts)', norm: 'commercial negotiation key accounts', isMandatory: true, minLevel: ProficiencyLevel.ADVANCED, minYears: 4 },
    { name: 'Huấn luyện & Phát triển Năng lực Bán hàng (Sales Coaching & Field Training)', norm: 'sales coaching field training', isMandatory: false, minLevel: ProficiencyLevel.ADVANCED, minYears: 3 },
    { name: 'Phân tích Thị trường & Nghiên cứu Đối thủ (Market Analysis & Competitor Intelligence)', norm: 'market analysis competitor intelligence', isMandatory: false, minLevel: ProficiencyLevel.INTERMEDIATE, minYears: 2 },
    { name: 'Hoạch định Chiến lược Kinh doanh Khu vực (Area Business Planning & Execution)', norm: 'area business planning execution', isMandatory: false, minLevel: ProficiencyLevel.ADVANCED, minYears: 3 },
  ];

  const createdJdSkills = [];
  for (const s of jdSkillsData) {
    const sk = await prisma.skill.upsert({
      where: { normalizedName: s.norm },
      update: { name: s.name },
      create: { name: s.name, normalizedName: s.norm, categoryId: fmcgCategory.id },
    });
    createdJdSkills.push({ skill: sk, isMandatory: s.isMandatory, minLevel: s.minLevel, minYears: s.minYears });
  }

  const jobPosting = await prisma.jobPosting.upsert({
    where: { jobCode: 'JOB-ASM-FMCG-2026' },
    update: {
      status: JobStatus.PUBLISHED,
      title: 'Quản Lý Kinh Doanh Khu Vực (Area Sales Manager - ASM)',
      requiredExperienceYears: 5,
      experienceLevel: ExperienceLevel.MANAGER,
      description: `VỊ TRÍ: QUẢN LÝ KINH DOANH KHU VỰC (AREA SALES MANAGER / ASM)
Ngành hàng: FMCG / Food & Beverage / Foodservice / Horeca
Địa điểm: TP. Hồ Chí Minh và khu vực lân cận
Yêu cầu kinh nghiệm: Trên 5 năm kinh nghiệm chuyên môn Sales, Trên 5 năm kinh nghiệm quản lý Sales.
Trình độ học vấn: Đại học trở lên (Ưu tiên MBA hoặc bằng cấp chuyên môn).

MÔ TẢ CÔNG VIỆC:
1. Xây dựng và triển khai chiến lược kinh doanh:
- Xây dựng chiến lược kinh doanh theo khu vực nhằm đạt mục tiêu doanh thu và mở rộng thị trường.
- Xây dựng kế hoạch bán hàng theo tháng/quý/năm.
- Phân tích xu hướng thị trường và nhu cầu khách hàng để xác định cơ hội tăng trưởng.
- Phát triển doanh số từ khách hàng hiện hữu và mở rộng hệ thống khách hàng, đối tác mới.
- Theo dõi hiệu quả từng khu vực, kênh bán hàng và nhóm khách hàng.

2. Quản lý quan hệ khách hàng & Nhà phân phối:
- Xây dựng và duy trì quan hệ với khách hàng trọng điểm và đối tác chiến lược.
- Quản trị hoạt động và chính sách của hệ thống Nhà phân phối, đại lý cấp 1 và mạng lưới trung gian.
- Duy trì và mở rộng quan hệ với khối khách hàng Horeca / Foodservice (nhà hàng, khách sạn, chuỗi ẩm thực).
- Đàm phán các điều khoản thương mại, chính sách chiết khấu, hạn mức tín dụng và hợp đồng cung ứng.

3. Phân tích thị trường và báo cáo:
- Theo dõi sát sao diễn biến thị trường, hoạt động và chiến dịch cạnh tranh của đối thủ.
- Theo dõi doanh số, chỉ số sell-in, sell-out, độ phủ điểm bán và vòng quay tồn kho.
- Xây dựng mô hình dự báo sản lượng bán hàng (Sales Forecasting) định kỳ.
- Phân tích nguyên nhân đạt/không đạt target và đề xuất giải pháp ứng phó kịp thời.

4. Quản lý và phát triển đội ngũ Sales:
- Quản trị, phân bổ chỉ tiêu target và giám sát KPI hàng tháng cho đội ngũ Giám sát và Nhân viên bán hàng.
- Tổ chức coaching, huấn luyện kỹ năng bán hàng thực địa (ride-along) và nâng cao năng lực nhân sự.
- Xây dựng môi trường làm việc hiệu suất cao và đánh giá hiệu quả định kỳ.`,
      requirements: `YÊU CẦU BẮT BUỘC (MUST-HAVE):
• M1: Có kinh nghiệm quản lý đội ngũ Sales thực tế (Team Leadership).
• M2: Trên 5 năm kinh nghiệm Sales / Business Development liên quan.
• M3: Trên 5 năm kinh nghiệm quản lý Sales thực tế (Management Experience >5 years).
• M4: Có thành tích thực tế về tăng trưởng doanh thu, đạt target và mở rộng thị trường.
• M5: Có hiểu biết thực tế sâu sắc về ngành FMCG, Food & Beverage, Foodservice hoặc Horeca.
• M6: Năng lực lãnh đạo, phân bổ target, quản lý KPI và huấn luyện nhân viên (Coaching).
• M7: Năng lực đàm phán thương mại, quản lý nhà phân phối (Distributor Management) và Key Account.
• M8: Tốt nghiệp Đại học trở lên.`,
      minSalary: 45000000,
      maxSalary: 75000000,
      currency: 'VND',
      location: 'TP. Hồ Chí Minh & Khu vực lân cận',
    },
    create: {
      jobCode: 'JOB-ASM-FMCG-2026',
      title: 'Quản Lý Kinh Doanh Khu Vực (Area Sales Manager - ASM)',
      recruiterId: recruiterProfile.id,
      departmentId: dept.id,
      status: JobStatus.PUBLISHED,
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.MANAGER,
      requiredExperienceYears: 5,
      minSalary: 45000000,
      maxSalary: 75000000,
      currency: 'VND',
      location: 'TP. Hồ Chí Minh & Khu vực lân cận',
      description: `VỊ TRÍ: QUẢN LÝ KINH DOANH KHU VỰC (AREA SALES MANAGER / ASM)
Ngành hàng: FMCG / Food & Beverage / Foodservice / Horeca
Địa điểm: TP. Hồ Chí Minh và khu vực lân cận
Yêu cầu kinh nghiệm: Trên 5 năm kinh nghiệm chuyên môn Sales, Trên 5 năm kinh nghiệm quản lý Sales.
Trình độ học vấn: Đại học trở lên (Ưu tiên MBA hoặc bằng cấp chuyên môn).`,
      requirements: `YÊU CẦU BẮT BUỘC (MUST-HAVE):
• M1: Có kinh nghiệm quản lý đội ngũ Sales thực tế (Team Leadership).
• M2: Trên 5 năm kinh nghiệm Sales / Business Development liên quan.
• M3: Trên 5 năm kinh nghiệm quản lý Sales thực tế (Management Experience >5 years).
• M4: Có thành tích thực tế về tăng trưởng doanh thu, đạt target và mở rộng thị trường.
• M5: Có hiểu biết thực tế sâu sắc về ngành FMCG, Food & Beverage, Foodservice hoặc Horeca.
• M6: Năng lực lãnh đạo, phân bổ target, quản lý KPI và huấn luyện nhân viên (Coaching).
• M7: Năng lực đàm phán thương mại, quản lý nhà phân phối (Distributor Management) và Key Account.
• M8: Tốt nghiệp Đại học trở lên.`,
    },
  });

  // Gán Job Skills
  await prisma.jobSkill.deleteMany({ where: { jobId: jobPosting.id } });
  for (const js of createdJdSkills) {
    await prisma.jobSkill.create({
      data: {
        jobId: jobPosting.id,
        skillId: js.skill.id,
        requirementType: js.isMandatory ? SkillRequirementType.MANDATORY : SkillRequirementType.PREFERRED,
        minimumProficiency: js.minLevel,
        minYearsExperience: js.minYears,
      },
    });
  }

  console.log(`  + Đã tạo JD ASM thành công: '${jobPosting.title}' (ID: ${jobPosting.id})`);

  // --------------------------------------------------------------------------------
  // 3. TẠO 10 CANDIDATE ACCOUNTS VÀ NỘP HỒ SƠ ĐÁNH GIÁ
  // --------------------------------------------------------------------------------
  console.log('\n👥 3. Bắt đầu tạo 10 ứng viên thực tế theo 10 Archetypes & Chấm điểm Black-box...');

  const resultsMatrix: any[] = [];

  for (const c of CANDIDATES_PHASE_4_6) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`👤 Đang khởi tạo [${c.code}] ${c.name} — Archetype: ${c.archetype}`);

    let candAuthId = userList?.users?.find((u) => u.email === c.email)?.id;
    if (!candAuthId) {
      const { data: newCand } = await supabase.auth.admin.createUser({
        email: c.email,
        password: 'Password123@',
        email_confirm: true,
        user_metadata: { full_name: c.name },
      });
      candAuthId = newCand.user!.id;
    }

    const candUser = await prisma.user.upsert({
      where: { id: candAuthId },
      update: { fullName: c.name, phone: c.phone },
      create: { id: candAuthId, email: c.email, fullName: c.name, phone: c.phone },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: candUser.id, roleId: candidateRole.id } },
      update: {},
      create: { userId: candUser.id, roleId: candidateRole.id },
    });

    const candProfile = await prisma.candidateProfile.upsert({
      where: { userId: candUser.id },
      update: {
        fullName: c.name,
        desiredTitle: c.desiredTitle,
        phone: c.phone,
        email: c.email,
        professionalSummary: c.summary,
        status: 'READY',
      },
      create: {
        userId: candUser.id,
        fullName: c.name,
        desiredTitle: c.desiredTitle,
        phone: c.phone,
        email: c.email,
        professionalSummary: c.summary,
        status: 'READY',
      },
    });

    // Tạo Kỹ Năng
    await prisma.candidateSkill.deleteMany({ where: { candidateId: candProfile.id } });
    for (const skData of c.skills) {
      const norm = skData.normalized_name ?? skData.skill_name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
      const skillRec = await prisma.skill.upsert({
        where: { normalizedName: norm },
        update: { name: skData.skill_name },
        create: {
          name: skData.skill_name,
          normalizedName: norm,
          categoryId: fmcgCategory.id,
        },
      });

      await prisma.candidateSkill.create({
        data: {
          candidateId: candProfile.id,
          skillId: skillRec.id,
          proficiencyLevel: (skData.proficiency_level as ProficiencyLevel) || ProficiencyLevel.ADVANCED,
          source: SkillSource.EXTRACTED,
        },
      });
    }

    // Tạo Học Vấn
    await prisma.education.deleteMany({ where: { candidateProfileId: candProfile.id } });
    for (const edu of c.educations) {
      await prisma.education.create({
        data: {
          candidateProfileId: candProfile.id,
          schoolName: edu.school_name,
          major: edu.major,
          degree: edu.degree,
          startDate: edu.start_date ? new Date(edu.start_date) : null,
          endDate: edu.end_date ? new Date(edu.end_date) : null,
          source: DataSource.EXTRACTED,
        },
      });
    }

    // Tạo Kinh Nghiệm Làm Việc
    await prisma.workExperience.deleteMany({ where: { candidateProfileId: candProfile.id } });
    for (const exp of c.work_experiences) {
      await prisma.workExperience.create({
        data: {
          candidateProfileId: candProfile.id,
          companyName: exp.company_name,
          positionTitle: exp.position_title,
          startDate: new Date(exp.start_date),
          endDate: exp.end_date ? new Date(exp.end_date) : null,
          description: exp.description,
          achievements: exp.achievements,
          source: DataSource.EXTRACTED,
        },
      });
    }

    // Tạo Resume
    const resume = await prisma.resume.create({
      data: {
        candidateId: candProfile.id,
        originalFileName: `${c.name.replace(/\s+/g, '_')}_ASM_CV.pdf`,
        objectPath: `resumes/${candAuthId}/asm_cv.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 1024 * 450,
        parsingStatus: 'PARSED',
      },
    });

    // Tạo Application
    const application = await prisma.application.upsert({
      where: { jobId_candidateId: { jobId: jobPosting.id, candidateId: candProfile.id } },
      update: {
        resumeId: resume.id,
        processingStatus: ApplicationProcessingStatus.COMPLETED,
        currentStage: ApplicationStage.SCREENING,
      },
      create: {
        jobId: jobPosting.id,
        candidateId: candProfile.id,
        resumeId: resume.id,
        processingStatus: ApplicationProcessingStatus.COMPLETED,
        currentStage: ApplicationStage.SCREENING,
      },
    });

    // --------------------------------------------------------------------------------
    // 4. GỬI SANG AI SERVICE (BLACK BOX MATCHING EVALUATION)
    // --------------------------------------------------------------------------------
    console.log(`  🤖 Gửi sang AI Matching Service (FastAPI) để chấm điểm...`);

    const evalPayload = {
      application_id: application.id,
      candidate_profile: {
        profile: {
          desired_title: c.desiredTitle,
          professional_summary: c.summary,
        },
        educations: c.educations,
        work_experiences: c.work_experiences,
        projects: [],
        skills: c.skills,
        certificates: c.certificates,
      },
      job: {
        title: jobPosting.title,
        experience_level: 'MANAGER',
        employment_type: 'FULL_TIME',
        description: jobPosting.description,
        requirements: jobPosting.requirements,
        required_experience_years: 5.0,
        required_skills: jdSkillsData.map((s) => ({
          skill_name: s.name,
          is_mandatory: s.isMandatory,
          minimum_level: s.minLevel,
          minimum_years: s.minYears,
        })),
        required_certificates: [],
      },
    };

    const aiRes = await fetch('http://127.0.0.1:8000/api/v1/matching/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evalPayload),
    });

    if (!aiRes.ok) {
      console.error(`  ❌ Lỗi khi chấm điểm ${c.name}:`, await aiRes.text());
      continue;
    }

    const res: any = await aiRes.json();

    // Lưu vào DB bảng ai_matching_results
    await prisma.aiMatchingResult.upsert({
      where: { applicationId_version: { applicationId: application.id, version: 1 } },
      update: {
        overallScore: res.overall_score,
        matchLevel: res.match_level as MatchLevel,
        skillScore: res.skills_score,
        experienceScore: res.experience_score,
        educationScore: res.education_score,
        projectScore: res.other_score,
        matchedSkills: res.matched_skills,
        missingSkills: res.missing_skills,
        missingRequiredSkills: res.missing_required_skills,
        strengths: res.strengths,
        gaps: res.gaps,
        reasoningSummary: res.summary,
        evidence: res.evidence,
        confidenceScore: res.confidence_score,
        candidateExperienceLevel: res.experience_assessment?.candidate_level ?? null,
        requiredExperienceLevel: res.experience_assessment?.required_level ?? null,
        totalExperienceYears: res.experience_assessment?.total_experience_years ?? null,
        levelFitScore: res.experience_assessment?.level_fit_score ?? null,
        levelGap: res.experience_assessment?.level_gap ?? null,
        levelEligible: res.experience_assessment?.level_eligible ?? null,
        levelConfidence: res.experience_assessment?.level_confidence ?? null,
      },
      create: {
        applicationId: application.id,
        version: 1,
        overallScore: res.overall_score,
        matchLevel: res.match_level as MatchLevel,
        skillScore: res.skills_score,
        experienceScore: res.experience_score,
        educationScore: res.education_score,
        projectScore: res.other_score,
        matchedSkills: res.matched_skills,
        missingSkills: res.missing_skills,
        missingRequiredSkills: res.missing_required_skills,
        strengths: res.strengths,
        gaps: res.gaps,
        reasoningSummary: res.summary,
        evidence: res.evidence,
        confidenceScore: res.confidence_score,
        candidateExperienceLevel: res.experience_assessment?.candidate_level ?? null,
        requiredExperienceLevel: res.experience_assessment?.required_level ?? null,
        totalExperienceYears: res.experience_assessment?.total_experience_years ?? null,
        levelFitScore: res.experience_assessment?.level_fit_score ?? null,
        levelGap: res.experience_assessment?.level_gap ?? null,
        levelEligible: res.experience_assessment?.level_eligible ?? null,
        levelConfidence: res.experience_assessment?.level_confidence ?? null,
      },
    });

    resultsMatrix.push({
      code: c.code,
      name: c.name,
      archetype: c.archetype,
      expectedLevel: c.expectedLevel,
      expectedOrderTier: c.expectedOrderTier,
      overallScore: res.overall_score,
      matchLevel: res.match_level,
      skillsScore: res.skills_score,
      experienceScore: res.experience_score,
      educationScore: res.education_score,
      otherScore: res.other_score,
      matchedSkillsCount: (res.matched_skills || []).length,
      missingSkillsCount: (res.missing_skills || []).length,
      missingRequiredSkills: res.missing_required_skills || [],
      strengths: res.strengths || [],
      gaps: res.gaps || [],
      evidenceConfidence: res.evidence_confidence ?? res.confidence_score ?? 1.0,
      experienceAssessment: res.experience_assessment,
      summary: res.summary,
      rawResult: res,
    });

    console.log(`  📊 KẾT QUẢ AI SCORING:`);
    console.log(`     • Overall Score: ${res.overall_score.toFixed(2)}/100 (${res.match_level}) [Kỳ vọng: ${c.expectedLevel}]`);
    console.log(`     • Skills: ${res.skills_score.toFixed(2)} | Exp: ${res.experience_score.toFixed(2)} | Edu: ${res.education_score.toFixed(2)} | Other: ${res.other_score.toFixed(2)}`);
    console.log(`     • Level Assessment: ${res.experience_assessment?.candidate_level ?? 'N/A'} vs Required: ${res.experience_assessment?.required_level ?? 'MANAGER'} (Eligible: ${res.experience_assessment?.level_eligible})`);
    console.log(`     • Matched Skills: ${(res.matched_skills || []).map((m: any) => m.name).join(', ') || 'None'}`);
    console.log(`     • Missing Required Skills: ${(res.missing_required_skills || []).join(', ') || 'None'}`);
    console.log(`     • Summary: ${res.summary.substring(0, 150)}...`);
  }

  // --------------------------------------------------------------------------------
  // 5. IN BẢNG MA TRẬN TỔNG HỢP VÀ THỰC HIỆN AUDIT
  // --------------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log('              🏆 BẢNG MA TRẬN KẾT QUẢ STRESS TEST (10 CANDIDATES)');
  console.log('================================================================================');
  console.log('| Mã UV | Họ và Tên | Archetype | Điểm AI | Xếp loại | Kỳ vọng | Skills | Exp | Edu | Missing Mandatories | Level Fit |');
  console.log('| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: |');
  for (const r of resultsMatrix) {
    console.log(`| **${r.code}** | ${r.name} | ${r.archetype} | **\`${r.overallScore.toFixed(2)}\`** | **${r.matchLevel}** | ${r.expectedLevel} | ${r.skillsScore.toFixed(1)} | ${r.experienceScore.toFixed(1)} | ${r.educationScore.toFixed(1)} | ${r.missingRequiredSkills.length > 0 ? r.missingRequiredSkills.join('; ') : 'None'} | ${r.experienceAssessment?.candidate_level ?? 'N/A'} |`);
  }
  console.log('================================================================================\n');

  return resultsMatrix;
}

main()
  .catch((e) => {
    console.error('Error running Phase 4.6 Stress Test:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
