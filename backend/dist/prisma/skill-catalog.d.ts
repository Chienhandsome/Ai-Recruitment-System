export type CatalogSkillType = 'HARD' | 'SOFT';
export interface SkillCatalogEntry {
    name: string;
    normalizedName: string;
    category: string;
    type: CatalogSkillType;
    aliases: readonly string[];
}
export declare const SKILL_CATEGORIES: {
    readonly software: "Công nghệ thông tin (IT & Software)";
    readonly data: "Dữ liệu, AI & Phân tích (Data & AI)";
    readonly cloud: "Cloud, DevOps & Hạ tầng";
    readonly qaSecurity: "Kiểm thử, Bảo mật & Chất lượng";
    readonly product: "Sản phẩm, Dự án & Phân tích nghiệp vụ";
    readonly office: "Văn phòng, Hành chính & Năng suất";
    readonly finance: "Kế toán, Tài chính & Ngân hàng";
    readonly sales: "Kinh doanh, Bán hàng & CSKH (Sales)";
    readonly marketing: "Marketing, SEO & Thương mại điện tử";
    readonly hrLegal: "Nhân sự, Pháp lý & Tuân thủ";
    readonly logistics: "Chuỗi cung ứng, Mua hàng & Logistics";
    readonly design: "Thiết kế, Nội dung & Truyền thông";
    readonly engineering: "Xây dựng, Sản xuất & Kỹ thuật";
    readonly educationHealth: "Giáo dục, Y tế & Dịch vụ chuyên môn";
    readonly languages: "Ngoại ngữ";
    readonly soft: "Kỹ năng mềm & Quản trị (Soft Skills)";
};
export declare const SKILL_CATALOG: readonly SkillCatalogEntry[];
export declare function validateSkillCatalog(catalog?: readonly SkillCatalogEntry[]): void;
