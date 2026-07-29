# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from app.utils.normalizer import clean_text, normalize_skill_name


@pytest.mark.unit
@pytest.mark.parametrize(
    ("raw_input", "expected_canonical"),
    [
        ("ReactJS", "React"),
        ("React.js", "React"),
        ("react js", "React"),
        ("react", "React"),
        ("NODEJS", "Node.js"),
        ("Node JS", "Node.js"),
        ("node.js", "Node.js"),
        ("Postgres", "PostgreSQL"),
        ("postgresql", "PostgreSQL"),
        ("Postgre SQL", "PostgreSQL"),
        ("Springboot", "Spring Boot"),
        ("spring-boot", "Spring Boot"),
        ("nest js", "NestJS"),
        ("nestjs", "NestJS"),
        ("Type Script", "TypeScript"),
        ("ts", "TypeScript"),
        ("javascript", "JavaScript"),
        ("js", "JavaScript"),
        ("tailwindcss", "Tailwind CSS"),
        ("powerbi", "Power BI"),
        ("github actions", "GitHub Actions"),
    ],
)
def test_skill_alias_normalization(raw_input: str, expected_canonical: str):
    normalized = normalize_skill_name(raw_input)
    assert normalized == expected_canonical, f"Expected '{raw_input}' to normalize to '{expected_canonical}', got '{normalized}'"


@pytest.mark.unit
def test_clean_text_utility():
    assert clean_text("  ReactJS  ") == "reactjs"
    assert clean_text("Node.js \t Developer") == "node.js developer"
    assert clean_text("") == ""
    assert clean_text(None) == ""


@pytest.mark.unit
def test_unknown_skill_preserved():
    unknown_skill = "CustomInternalProprietaryTool"
    normalized = normalize_skill_name(unknown_skill)
    assert normalized == unknown_skill
