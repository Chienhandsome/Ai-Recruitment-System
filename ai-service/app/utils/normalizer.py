import re
from typing import Dict, List, Optional
try:
    # pyrefly: ignore [missing-import]
    from rapidfuzz import fuzz, process
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False

# Known skill canonical mappings
SKILL_ALIASES: Dict[str, str] = {
    # React
    "reactjs": "React",
    "react.js": "React",
    "react js": "React",
    "react": "React",
    # Node
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "node js": "Node.js",
    "node": "Node.js",
    # Postgres
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "postgre": "PostgreSQL",
    "postgres sql": "PostgreSQL",
    "postgre sql": "PostgreSQL",
    # Spring Boot
    "springboot": "Spring Boot",
    "spring boot": "Spring Boot",
    "spring-boot": "Spring Boot",
    "spring": "Spring Boot",
    # Go / C-family / .NET
    "golang": "Go",
    "go language": "Go",
    "go": "Go",
    "c#": "C#",
    "c sharp": "C#",
    "csharp": "C#",
    "c++": "C++",
    "cpp": "C++",
    ".net": ".NET",
    "dotnet": ".NET",
    ".net core": ".NET",
    # Vue
    "vuejs": "Vue.js",
    "vue.js": "Vue.js",
    "vue js": "Vue.js",
    "vue": "Vue.js",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "next js": "Next.js",
    "angularjs": "Angular",
    # JS / TS
    "javascript": "JavaScript",
    "js": "JavaScript",
    "typescript": "TypeScript",
    "type script": "TypeScript",
    "ts": "TypeScript",
    # Tailwind
    "tailwindcss": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "tailwind": "Tailwind CSS",
    # Power BI
    "powerbi": "Power BI",
    "power bi": "Power BI",
    # GitHub Actions
    "github actions": "GitHub Actions",
    "github action": "GitHub Actions",
    "gh actions": "GitHub Actions",
    # Microservices
    "microservices": "Microservices",
    "microservice": "Microservices",
    # Manual Testing
    "manual testing": "Manual Testing",
    "manual test": "Manual Testing",
    # NestJS
    "nestjs": "NestJS",
    "nest js": "NestJS",
    "nest.js": "NestJS",
    # Other canonical items
    "docker": "Docker",
    "rabbitmq": "RabbitMQ",
    "linux": "Linux",
    "nginx": "Nginx",
    "aws": "AWS",
    "python": "Python",
    "pandas": "Pandas",
    "sql": "SQL",
    "java": "Java",
    # Office productivity
    "excel": "Microsoft Excel",
    "ms excel": "Microsoft Excel",
    "microsoft excel": "Microsoft Excel",
    "excel nâng cao": "Advanced Excel",
    "advanced excel": "Advanced Excel",
    "pivot table": "PivotTable",
    "pivottable": "PivotTable",
    "power query": "Power Query",
    "word": "Microsoft Word",
    "ms word": "Microsoft Word",
    "microsoft word": "Microsoft Word",
    "powerpoint": "Microsoft PowerPoint",
    "ppt": "Microsoft PowerPoint",
    "microsoft powerpoint": "Microsoft PowerPoint",
    "outlook": "Microsoft Outlook",
    "google sheet": "Google Sheets",
    "google sheets": "Google Sheets",
    "g suite": "Google Workspace",
    # Common office job families
    "b2b sales": "B2B Sales",
    "bán hàng b2b": "B2B Sales",
    "customer service": "Customer Service",
    "cskh": "Customer Service",
    "chăm sóc khách hàng": "Customer Service",
    "talent acquisition": "Talent Acquisition",
    "recruitment": "Recruitment",
    "tuyển dụng": "Recruitment",
    "digital marketing": "Digital Marketing",
    "seo": "Search Engine Optimization",
    "facebook ads": "Facebook Ads",
    "meta ads": "Facebook Ads",
    "google ads": "Google Ads",
    "misa": "MISA Accounting",
    "sap": "SAP ERP",
    "autocad": "AutoCAD",
    "auto cad": "AutoCAD",
    "figma": "Figma",
    "selenium": "Selenium",
    "git": "Git",
}

CANONICAL_SKILLS: List[str] = [
    "NestJS", "Node.js", "PostgreSQL", "Docker", "RabbitMQ",
    "React", "TypeScript", "Tailwind CSS", "Linux", "GitHub Actions",
    "Nginx", "AWS", "Python", "Pandas", "SQL", "Power BI",
    "Java", "Spring Boot", "Microservices", "Vue.js", "JavaScript",
    "Microsoft Excel", "Advanced Excel", "PivotTable", "Power Query",
    "Microsoft Word", "Microsoft PowerPoint", "Microsoft Outlook",
    "Google Sheets", "Google Workspace", "Go", "C#", "C++", ".NET",
    "Next.js", "Angular", "B2B Sales", "Customer Service",
    "Talent Acquisition", "Recruitment", "Digital Marketing",
    "Search Engine Optimization", "Facebook Ads", "Google Ads",
    "MISA Accounting", "SAP ERP", "AutoCAD", "Figma", "Manual Testing",
    "Selenium", "Git"
]


def clean_text(text: Optional[str]) -> str:
    """Basic text cleanup."""
    if not text:
        return ""
    # Lowercase & strip extra whitespace
    cleaned = re.sub(r"\s+", " ", text.strip().lower())
    return cleaned


def normalize_skill_name(raw_name: str) -> str:
    """
    Normalize skill name using explicit alias mapping first,
    then RapidFuzz fuzzy matching against canonical skill list.
    """
    if not raw_name or not raw_name.strip():
        return ""

    cleaned = clean_text(raw_name)

    # 1. Exact alias lookup
    if cleaned in SKILL_ALIASES:
        return SKILL_ALIASES[cleaned]

    # 2. Fuzzy matching via RapidFuzz
    if HAS_RAPIDFUZZ:
        best_match = process.extractOne(
            cleaned,
            CANONICAL_SKILLS,
            scorer=fuzz.WRatio,
            score_cutoff=85.0
        )
        if best_match:
            return best_match[0]

    # 3. Fallback to title casing/raw string
    return raw_name.strip()
