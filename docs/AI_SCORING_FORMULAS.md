# TÀI LIỆU ĐẶC TẢ TOÁN HỌC & THUẬT TOÁN CHẤM ĐIỂM HỒ SƠ ỨNG VIÊN (AI CANDIDATE SCORING SPECIFICATION)

> **Dự án**: AI Recruitment System  
> **Phiên bản**: 1.0.0  
> **Tác giả**: AI Architecture Team  
> **Mục đích**: Mô tả chi tiết các công thức toán học, thuật toán NLP, quy trình chuẩn hóa dữ liệu và các quy tắc xử lý trường hợp đặc biệt (Edge Cases) phục vụ tính toán điểm tương đồng giữa Hồ sơ ứng viên (LinkedIn/CV) và Mô tả công việc (Job Description - JD).

---

## I. MÔ HÌNH TỔNG THỂ & QUY TẮC ĐIỀU PHỐI (OVERALL MODEL)

### 1. Công thức Tổng tổng hợp ($S_{total}$)
Điểm tổng hợp của ứng viên $S_{total} \in [0, 100]$ là tổng có trọng số của 4 trụ cột năng lực:

$$S_{total} = (W_{cap} \cdot S_{cap}) + (W_{exp} \cdot S_{exp}) + (W_{edu} \cdot S_{edu}) + (W_{lang\_cert} \cdot S_{lang\_cert})$$

**Ràng buộc trọng số do HR thiết lập:**
$$\sum_{p \in \{\text{cap}, \text{exp}, \text{edu}, \text{lang\_cert}\}} W_p = 1.0 \quad (100\%)$$
$$\forall p, \quad 0 \le W_p \le 1.0$$

---

### 2. Ma trận Điều kiện Tiên quyết (Mandatory Guardrails Matrix)
Nếu HR bật tính năng **"Điều kiện bắt buộc" (Hard Gate)** cho các tiêu chí tối thiểu (ví dụ: Bằng cấp tối thiểu, Kỹ năng bắt buộc phải có), điểm tổng kết cuối cùng $S_{final}$ sẽ qua bộ lọc ma trận nhị phân:

$$G_{mandatory} = \prod_{k=1}^{M} g_k, \quad g_k \in \{0, 1\}$$

$$S_{final} = G_{mandatory} \times S_{total}$$

*Trong đó:*
* $g_k = 1$: Ứng viên đạt điều kiện tiên quyết thứ $k$.
* $g_k = 0$: Ứng viên vi phạm điều kiện tiên quyết thứ $k \implies S_{final} = 0$ (Đánh dấu nhãn **Unqualified**).

---

## II. CHI TIẾT THUẬT TOÁN 4 TRỤ CỘT THÀNH PHẦN

---

### 1. Trụ cột 1: Điểm Năng lực & Kỹ năng Cốt lõi ($S_{cap}$)

#### A. Tiền xử lý & Chuẩn hóa Kỹ năng (Skill Canonicalization)
Trước khi tính điểm, danh sách kỹ năng từ JD và Hồ sơ ứng viên sẽ được đưa qua hàm chuẩn hóa $f_{canon}(s)$:

$$f_{canon}(s) \to \mathcal{C}_{id}$$

*   **Synonym Dictionary**: `ReactJS`, `React.js`, `React` $\to$ `CANON_SKILL_REACT`.
*   **Vector Cosine Similarity**: Nếu kỹ năng chưa có trong từ điển, sử dụng Embedding vector $v_s$:

$$\text{Sim}_{skill}(s_1, s_2) = \frac{v_{s_1} \cdot v_{s_2}}{\|v_{s_1}\| \|v_{s_2}\|} \ge \tau_{skill} \quad (\tau_{skill} = 0.85)$$

#### B. Công thức tính điểm $S_{cap}$
Gọi:
*   $\mathcal{S}_{req\_must}$: Tập hợp các kỹ năng bắt buộc (Must-have) trong JD.
*   $\mathcal{S}_{req\_nice}$: Tập hợp các kỹ năng ưu tiên (Nice-to-have) trong JD.
*   $\mathcal{S}_{cand}$: Tập hợp kỹ năng ứng viên đáp ứng (đã quét qua Skills, About, Experience, Projects).

Điểm $S_{cap}$ được tính theo công thức:

$$S_{cap} = \min\left(100, \; \frac{|\mathcal{S}_{cand} \cap \mathcal{S}_{req\_must}| + w_{nice} \cdot |\mathcal{S}_{cand} \cap \mathcal{S}_{req\_nice}|}{|\mathcal{S}_{req\_must}| + w_{nice} \cdot |\mathcal{S}_{req\_nice}|} \times 100\right)$$

*Trọng số mặc định*: $w_{nice} = 0.5$.

#### C. Xử lý Chống Nhồi Từ Khóa (Anti-Keyword Stuffing Penalty)
Nếu ứng viên lặp lại một từ khóa kỹ năng quá nhiều lần nhằm qua mặt AI, tính hệ số phạt Mật độ $P_{density}$:

$$P_{density} = \min\left(1.0, \; \frac{\text{Count}_{unique\_skills}}{\text{Count}_{total\_skill\_mentions}} \times \gamma\right) \quad (\gamma = 1.2)$$

$$S_{cap\_final} = S_{cap} \times P_{density}$$

---

### 2. Trụ cột 2: Điểm Thực chiến & Kinh nghiệm ($S_{exp}$)

AI tự động phân loại ứng viên thành 2 nhóm dựa trên tổng số năm kinh nghiệm ($YoE_{total}$) và số lượng công việc quá khứ:

$$\text{Category} = \begin{cases} \text{Experienced}, & \text{nếu } YoE_{total} \ge 1.0 \text{ năm} \\ \text{Fresher/Student}, & \text{nếu } YoE_{total} < 1.0 \text{ năm} \end{cases}$$

---

#### Trường hợp A: Experienced Candidates

Điểm kinh nghiệm là sự kết hợp giữa **Số năm kinh nghiệm ($S_{YoE}$)** và **Độ tương đồng bản chất công việc ($S_{sim}$)**:

$$S_{exp} = (\beta \cdot S_{YoE}) + ((1 - \beta) \cdot S_{sim\_NLP})$$

*(Trọng số mặc định $\beta = 0.4$)*

##### 1. Thuật toán tính $S_{YoE}$ (Xử lý an toàn $YoE_{req} = 0$):

$$S_{YoE} = \begin{cases} 
100, & \text{nếu } YoE_{req} = 0 \\
\min\left(100, \; \frac{YoE_{cand}}{YoE_{req}} \times 100\right), & \text{nếu } YoE_{req} > 0 
\end{cases}$$

##### 2. Thuật toán NLP Similarity lai ($S_{sim\_NLP}$):
So khớp ngữ nghĩa giữa Toàn bộ mô tả kinh nghiệm ($\text{Doc}_{cand}$) và Mô tả JD ($\text{Doc}_{JD}$) bằng mô hình Hybrid (Keyword + Dense Vector):

$$\text{Sim}_{Hybrid} = \alpha \cdot \text{BM25}(\text{Doc}_{cand}, \text{Doc}_{JD}) + (1 - \alpha) \cdot \frac{E(\text{Doc}_{cand}) \cdot E(\text{Doc}_{JD})}{\|E(\text{Doc}_{cand})\| \|E(\text{Doc}_{JD})\|}$$

*(Mặc định $\alpha = 0.3$, $E(\cdot)$ là mô hình Transformer Embedding như `text-embedding-3-small` hoặc `multilingual-e5-large`)*

$$S_{sim\_NLP} = \text{Sim}_{Hybrid} \times 100$$

---

#### Trường hợp B: Student / Fresher Candidates

AI thực hiện quét linh hoạt theo từng nhóm ngành nghề:
*   **Khối IT / Technical / Design**: Quét tập trung mục `Projects`, `GitHub/Portfolio`, `Capstone Project`.
*   **Khối Business / Marketing / Sales**: Quét mục `Extracurricular`, `Club Activities`, `Competitions`.
*   **Khối Service / Admin**: Quét các dự án Part-time, Internship.

Công thức tính:

$$S_{exp\_fresher} = \min\left(100, \; S_{sim\_NLP}(\text{Project\_Content}, \text{JD}) + \Delta_{leadership}\right)$$

*   $\Delta_{leadership} = +10$ điểm nếu ứng viên có các từ khóa thể hiện vai trò quản lý/dẫn dắt (ví dụ: *President, Team Leader, Founder, Project Manager*).

---

### 3. Trụ cột 3: Điểm Học vấn & Nền tảng ($S_{edu}$)

Điểm học vấn $S_{edu} \in [0, 100]$ là tổng của 3 chỉ số thành phần:

$$S_{edu} = \min\left(100, \; \text{Score}_{degree} + \text{Score}_{major} + \text{Score}_{performance}\right)$$

---

#### A. Thang điểm Bằng cấp ($\text{Score}_{degree}$) - Tối đa 50đ

Bảng quy chiếu cấp bậc bằng cấp: $\text{Rank}(Degree) \in \{\text{HighSchool: 1}, \text{Diploma: 2}, \text{Bachelor: 3}, \text{Master: 4}, \text{PhD: 5}\}$.

$$\text{Score}_{degree} = \begin{cases} 
50, & \text{nếu } \text{Rank}(D_{cand}) > \text{Rank}(D_{req}) \quad (\text{Vượt tiêu chuẩn}) \\
40, & \text{nếu } \text{Rank}(D_{cand}) = \text{Rank}(D_{req}) \quad (\text{Đạt tiêu chuẩn}) \\
20, & \text{nếu } \text{Rank}(D_{cand}) < \text{Rank}(D_{req}) \quad (\text{Dưới tiêu chuẩn})
\end{cases}$$

---

#### B. Thang điểm Chuyên ngành ($\text{Score}_{major}$) - Tối đa 40đ

Sử dụng thuật toán Phân nhóm Ngành học (Major Taxonomy Tree):

$$\text{Score}_{major} = \begin{cases} 
40, & \text{nếu } Major_{cand} \equiv Major_{req} \quad (\text{Đúng ngành tuyệt đối}) \\
20, & \text{nếu } Major_{cand} \in \text{RelatedGroup}(Major_{req}) \quad (\text{Ngành gần}) \\
0, & \text{nếu trái ngành}
\end{cases}$$

*Ví dụ ngành gần*: Computer Science $\leftrightarrow$ Information Technology $\leftrightarrow$ Software Engineering.

---

#### C. Thang điểm Thành tích ($\text{Score}_{performance}$) - Tối đa 10đ

Chuẩn hóa GPA từ các hệ thống điểm về thang phần trăm:

$$GPA_{norm} = \begin{cases} 
\frac{GPA_4}{4.0} \times 100, & \text{nếu thang 4} \\
\frac{GPA_{10}}{10.0} \times 100, & \text{nếu thang 10} 
\end{cases}$$

$$\text{Score}_{performance} = \begin{cases} 
10, & \text{nếu } GPA_{norm} \ge 80\% \text{ hoặc có nhãn } \text{Honors/Scholarship} \\
0, & \text{ngược lại}
\end{cases}$$

---

### 4. Trụ cột 4: Điểm Ngoại ngữ & Chứng chỉ ($S_{lang\_cert}$)

Công thức tổng quát cân bằng 50-50 giữa Ngoại ngữ và Chứng chỉ chuyên môn:

$$S_{lang\_cert} = (0.5 \times \text{Score}_{language}) + (0.5 \times \text{Score}_{cert})$$

---

#### A. Thuật toán Quy đổi Ngoại ngữ chuẩn hóa ($\text{Score}_{language}$)

Mọi chứng chỉ ngoại ngữ được quy đổi về Thang chuẩn Châu Âu **CEFR Scale**: $A1(1) < A2(2) < B1(3) < B2(4) < C1(5) < C2(6)$.

##### Bảng Quy đổi Tương đương:
| Khung CEFR | Level Index | IELTS | TOEIC (Listening+Reading) | JLPT | HSK |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **C2** | 6 | 8.5 - 9.0 | 990 | N1 (High) | HSK 6 |
| **C1** | 5 | 7.0 - 8.0 | 850 - 945 | N1 | HSK 5 |
| **B2** | 4 | 5.5 - 6.5 | 785 - 845 | N2 | HSK 4 |
| **B1** | 3 | 4.0 - 5.0 | 550 - 780 | N3 | HSK 3 |
| **A2** | 2 | 3.0 - 3.5 | 225 - 545 | N4 | HSK 2 |
| **A1** | 1 | < 3.0 | < 225 | N5 | HSK 1 |

##### Công thức tính $\text{Score}_{language}$:

$$\Delta_{level} = \text{Level}(Lang_{cand}) - \text{Level}(Lang_{req})$$

$$\text{Score}_{language} = \begin{cases} 
100, & \text{nếu } \Delta_{level} \ge 0 \quad (\text{Đạt hoặc vượt yêu cầu}) \\
50, & \text{nếu } \Delta_{level} = -1 \quad (\text{Thấp hơn 1 bậc}) \\
0, & \text{nếu } \Delta_{level} \le -2 \text{ hoặc không có chứng chỉ}
\end{cases}$$

---

#### B. Thuật toán Điểm Chứng chỉ Chuyên môn ($\text{Score}_{cert}$)

Mỗi chứng chỉ chuyên môn hợp lệ (AWS, PMP, ACCA, Google/HubSpot Certs...) nằm trong danh mục chứng chỉ JD yêu cầu hoặc liên quan trực tiếp đến ngành nghề sẽ tích lũy điểm:

$$\text{Score}_{cert} = \min\left(100, \; \sum_{c \in \mathcal{C}_{cand}} \text{Weight}(c)\right)$$

*Trọng số chuẩn*: Mỗi chứng chỉ liên quan hợp lệ $+50$ điểm. (2 chứng chỉ liên quan đạt điểm tối đa $100$).

---

## III. TRIỂN KHAI MÃ GIẢ (PYTHON PSEUDOCODE)

```python
import math
from typing import Dict, List, Any

class AICandidateScorer:
    def __init__(self, canonical_skills_db: Dict[str, str], cefr_table: Dict[str, int]):
        self.canonical_skills_db = canonical_skills_db
        self.cefr_table = cefr_table

    def calculate_total_score(
        self, 
        candidate_data: Dict[str, Any], 
        jd_data: Dict[str, Any], 
        weights: Dict[str, float]
    ) -> Dict[str, Any]:
        
        # 0. Check Hard Gates (Mandatory Conditions)
        if not self._check_mandatory_conditions(candidate_data, jd_data):
            return {
                "S_total": 0.0,
                "status": "UNQUALIFIED_HARD_GATE",
                "breakdown": {"S_cap": 0, "S_exp": 0, "S_edu": 0, "S_lang_cert": 0}
            }

        # 1. Calculate 4 Pillars
        s_cap = self._calculate_s_cap(candidate_data, jd_data)
        s_exp = self._calculate_s_exp(candidate_data, jd_data)
        s_edu = self._calculate_s_edu(candidate_data, jd_data)
        s_lang_cert = self._calculate_s_lang_cert(candidate_data, jd_data)

        # 2. Weighted Total Score
        s_total = (
            weights["W_cap"] * s_cap +
            weights["W_exp"] * s_exp +
            weights["W_edu"] * s_edu +
            weights["W_lang_cert"] * s_lang_cert
        )

        s_total = min(100.0, max(0.0, round(s_total, 2)))

        return {
            "S_total": s_total,
            "status": "QUALIFIED",
            "breakdown": {
                "S_cap": round(s_cap, 2),
                "S_exp": round(s_exp, 2),
                "S_edu": round(s_edu, 2),
                "S_lang_cert": round(s_lang_cert, 2)
            }
        }

    def _calculate_s_cap(self, candidate: Dict[str, Any], jd: Dict[str, Any]) -> float:
        req_must = set(jd.get("skills_must", []))
        req_nice = set(jd.get("skills_nice", []))
        cand_skills = set(candidate.get("skills", []))

        matched_must = cand_skills.intersection(req_must)
        matched_nice = cand_skills.intersection(req_nice)

        numerator = len(matched_must) + 0.5 * len(matched_nice)
        denominator = len(req_must) + 0.5 * len(req_nice)

        if denominator == 0:
            return 100.0

        score = (numerator / denominator) * 100.0
        return min(100.0, score)

    def _calculate_s_exp(self, candidate: Dict[str, Any], jd: Dict[str, Any]) -> float:
        yoe_cand = candidate.get("yoe", 0.0)
        yoe_req = jd.get("yoe_required", 0.0)

        # 1. YoE Score with Zero Division Protection
        if yoe_req == 0:
            s_yoe = 100.0
        else:
            s_yoe = min(100.0, (yoe_cand / yoe_req) * 100.0)

        # 2. NLP Semantic Similarity Score (Mocked Embedding Cosine)
        sim_nlp = candidate.get("nlp_similarity_score", 0.75) # 0.0 to 1.0

        if yoe_cand >= 1.0:
            s_exp = 0.4 * s_yoe + 0.6 * (sim_nlp * 100.0)
        else:
            # Fresher/Student Path
            s_exp = sim_nlp * 100.0
            if candidate.get("has_leadership_role", False):
                s_exp += 10.0

        return min(100.0, max(0.0, s_exp))

    def _calculate_s_edu(self, candidate: Dict[str, Any], jd: Dict[str, Any]) -> float:
        degree_rank = {"HighSchool": 1, "Diploma": 2, "Bachelor": 3, "Master": 4, "PhD": 5}
        
        cand_degree = candidate.get("degree", "HighSchool")
        req_degree = jd.get("degree_required", "Bachelor")

        # Degree Score
        if degree_rank.get(cand_degree, 1) > degree_rank.get(req_degree, 3):
            s_degree = 50.0
        elif degree_rank.get(cand_degree, 1) == degree_rank.get(req_degree, 3):
            s_degree = 40.0
        else:
            s_degree = 20.0

        # Major Score
        cand_major = candidate.get("major", "")
        req_major = jd.get("major_required", "")
        
        if cand_major.lower() == req_major.lower():
            s_major = 40.0
        elif cand_major in jd.get("related_majors", []):
            s_major = 20.0
        else:
            s_major = 0.0

        # Performance Score
        s_perf = 10.0 if candidate.get("gpa_high_or_scholarship", False) else 0.0

        return min(100.0, s_degree + s_major + s_perf)

    def _calculate_s_lang_cert(self, candidate: Dict[str, Any], jd: Dict[str, Any]) -> float:
        # Language Score via CEFR Index
        cand_lang_lvl = candidate.get("lang_cefr_level", 0) # 1 to 6
        req_lang_lvl = jd.get("lang_cefr_level_required", 0)

        delta = cand_lang_lvl - req_lang_lvl
        if delta >= 0:
            s_lang = 100.0
        elif delta == -1:
            s_lang = 50.0
        else:
            s_lang = 0.0

        # Cert Score
        valid_certs_count = len(candidate.get("relevant_certs", []))
        s_cert = min(100.0, valid_certs_count * 50.0)

        return 0.5 * s_lang + 0.5 * s_cert

    def _check_mandatory_conditions(self, candidate: Dict[str, Any], jd: Dict[str, Any]) -> bool:
        if jd.get("mandatory_degree") and candidate.get("degree") != jd.get("mandatory_degree"):
            return False
        return True
```

---

## IV. NÂNG CẤP TRONG TƯƠNG LAI (ROADMAP)

1. **Self-Learning Weight Optimization (Machine Learning Tuning)**:
   * Thu thập feedback của HR sau mỗi đợt tuyển dụng (Ứng viên nào được nhận / qua vòng phỏng vấn).
   * Dùng thuật toán **Logistic Regression / RankNet** để tự động tinh chỉnh nhẹ trọng số $W_p$ phù hợp với văn hóa riêng của từng doanh nghiệp.
2. **Context-Aware LLM Verification**:
   * Dùng LLM (như Gemini Pro / GPT-4o) làm bước cuối kiểm tra xem CV có dấu hiệu khai khống / AI generated hay không để cảnh báo cho HR.
