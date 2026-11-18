
import re


# 1. Skill Database
SKILL_KEYWORDS = {
    "Python": ["python"],
    "Django": ["django"],
    "Django REST Framework": ["django rest framework", "drf"],
    "FastAPI": ["fastapi"],
    "JavaScript": ["javascript"],
    "React.js": ["react.js", "react"],
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "SQL": ["sql"],
    "MySQL": ["mysql"],
    "PostgreSQL": ["postgresql", "postgres"],
    "MongoDB": ["mongodb"],
    "REST API": ["rest api", "restful api"],
    "Git": ["git"],
    "GitHub": ["github"],
    "AWS": ["aws", "amazon web services"],
    "Docker": ["docker"],
    "Java": ["java"],
    "C++": ["c++"],
    "C#": ["c#"],
    ".NET": [".net", "dotnet"],
    "Machine Learning": ["machine learning"],
    "Data Structures": ["data structures"],
    "OOP": ["oop", "object oriented programming"],
    "Communication": ["communication"],
    "Problem Solving": ["problem solving"],
    "Teamwork": ["teamwork", "team collaboration"],
}


# 2. Find Skills
def find_skills(text):

    found_skills = []

    text = text.lower()

    for skill, keywords in SKILL_KEYWORDS.items():

        for keyword in keywords:

            pattern = r'(?<!\w)' + re.escape(keyword) + r'(?!\w)'

            if re.search(pattern, text):

                found_skills.append(skill)
                break

    return found_skills


# 3. ATS Keyword Checks
def check_resume_sections(text):

    text = text.lower()

    sections = {
        "Professional Summary": [
            "professional summary",
            "career summary",
            "profile summary"
        ],
        "Work Experience": [
            "experience",
            "work experience",
            "employment history"
        ],
        "Education": [
            "education",
            "academic qualification"
        ],
        "Projects": [
            "projects",
            "personal projects",
            "academic projects"
        ],
        "Certifications": [
            "certifications",
            "certificates"
        ],
        "Technical Skills": [
            "technical skills",
            "skills",
            "core skills"
        ]
    }

    found_sections = []
    missing_sections = []

    for section, keywords in sections.items():

        if any(keyword in text for keyword in keywords):
            found_sections.append(section)
        else:
            missing_sections.append(section)

    return found_sections, missing_sections


# 4. Resume Analysis Engine
def analyze_resume(resume_text, job_description_text):

    resume_text = resume_text or ""
    job_description_text = job_description_text or ""

    # Extract skills
    resume_skills = find_skills(resume_text)

    required_skills = find_skills(job_description_text)

    # Compare skills
    matched_skills = [
        skill for skill in required_skills
        if skill in resume_skills
    ]

    missing_skills = [
        skill for skill in required_skills
        if skill not in resume_skills
    ]

    # Skill Match Score
    total_required = len(required_skills)

    if total_required > 0:

        skill_score = round(
            len(matched_skills) / total_required * 100,
            2
        )

    else:
        skill_score = 0.0

    # Resume Sections
    found_sections, missing_sections = check_resume_sections(
        resume_text
    )

    section_score = round(
        len(found_sections) / 6 * 100,
        2
    )

    # ATS Score
    ats_score = round(
        (skill_score * 0.8) + (section_score * 0.2),
        2
    )

    # Strengths
    strengths = []

    if matched_skills:
        strengths.append(
            "Your resume matches "
            + str(len(matched_skills))
            + " required job skills."
        )

    if "Projects" in found_sections:
        strengths.append(
            "Your resume includes project details."
        )

    if "Education" in found_sections:
        strengths.append(
            "Your education details are included."
        )

    if "Work Experience" in found_sections:
        strengths.append(
            "Your resume includes work experience."
        )

    # Weaknesses
    weaknesses = []

    if missing_skills:
        weaknesses.append(
            "Some required job skills are missing."
        )

    if missing_sections:
        weaknesses.append(
            "Some important resume sections are missing."
        )

    # Improvement Suggestions
    suggestions = []

    for skill in missing_skills:
        suggestions.append(
            "If you have this skill, add relevant evidence: "
            + skill
        )

    for section in missing_sections:
        suggestions.append(
            "Consider adding a "
            + section
            + " section if relevant."
        )

    if not suggestions:
        suggestions.append(
            "Keep your resume updated with relevant achievements."
        )

    # Final Result
    return {

        "resume_skills": resume_skills,

        "required_skills": required_skills,

        "matched_skills": matched_skills,

        "missing_skills": missing_skills,

        "match_score": skill_score,

        "ats_score": ats_score,

        "section_score": section_score,

        "found_sections": found_sections,

        "missing_sections": missing_sections,

        "strengths": strengths,

        "weaknesses": weaknesses,

        "suggestions": suggestions
    }
