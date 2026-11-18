const SKILL_DICTIONARY = [
  "python", "django", "django rest framework", "fastapi", "javascript", "typescript",
  "react", "react.js", "html", "html5", "css", "css3", "tailwind css", "bootstrap",
  "sql", "mysql", "postgresql", "mongodb", "rest api", "api development", "git",
  "github", "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd", "linux",
  "java", "c#", ".net", "node.js", "express", "next.js", "redux", "figma",
  "machine learning", "data analysis", "pandas", "numpy", "power bi", "excel",
  "communication", "problem solving", "agile", "scrum", "testing", "unit testing"
];

const normalize = (value) => value.toLowerCase().replace(/[^\w.+#/-]/g, " ");

export function extractSkills(text) {
  const normalized = normalize(text);
  return [...new Set(SKILL_DICTIONARY.filter(skill =>
    new RegExp(`(^|[^a-z0-9])${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(normalized)
  ))];
}

export function analyzeResume(resumeText, jdText) {
  const resumeSkills = extractSkills(resumeText);
  const jdSkills = extractSkills(jdText);
  const matched = jdSkills.filter(skill => resumeSkills.includes(skill));
  const missing = jdSkills.filter(skill => !resumeSkills.includes(skill));
  const skillScore = jdSkills.length ? Math.round((matched.length / jdSkills.length) * 100) : 0;

  const jdWords = [...new Set(normalize(jdText).split(/\s+/).filter(w => w.length > 4))];
  const resumeNormalized = normalize(resumeText);
  const keywordMatches = jdWords.filter(word => resumeNormalized.includes(word));
  const keywordScore = jdWords.length ? Math.round((keywordMatches.length / jdWords.length) * 100) : 0;

  const sections = [
    ["Professional summary", /summary|profile|objective/i.test(resumeText)],
    ["Education", /education|bachelor|master|degree|university|college/i.test(resumeText)],
    ["Projects", /projects|project/i.test(resumeText)],
    ["Experience / Internship", /experience|internship|employment/i.test(resumeText)],
    ["Certifications", /certification|certified|certificate/i.test(resumeText)]
  ];
  const sectionScore = Math.round((sections.filter(([, present]) => present).length / sections.length) * 100);
  const overall = Math.round(skillScore * 0.55 + keywordScore * 0.25 + sectionScore * 0.20);

  const strengths = [];
  if (matched.length) strengths.push(`Your resume contains ${matched.length} skill(s) also requested in the job description.`);
  if (sections.find(([name, present]) => name === "Projects" && present)) strengths.push("A projects section was detected. Make sure each project explains your contribution and impact.");
  if (sections.find(([name, present]) => name === "Education" && present)) strengths.push("An education section was detected.");
  if (keywordScore >= 60) strengths.push("A good portion of the job description's vocabulary appears in your resume.");

  const weaknesses = [];
  if (missing.length) weaknesses.push(`The following requested skills were not detected: ${missing.join(", ")}.`);
  if (!sections.find(([name, present]) => name === "Experience / Internship" && present)?.[1]) weaknesses.push("No clear experience or internship section was detected.");
  if (!sections.find(([name, present]) => name === "Certifications" && present)?.[1]) weaknesses.push("No certifications section was detected (only add relevant certifications you have earned).");
  if (keywordScore < 50) weaknesses.push("Several job-description terms were not found. Add relevant wording only where it accurately describes your experience.");

  return {
    overall, skillScore, keywordScore, sectionScore, matched, missing,
    resumeSkills, jdSkills, sections, strengths, weaknesses,
    keywordMatches: keywordMatches.slice(0, 30),
    recommendations: [
      ...missing.slice(0, 5).map(skill => `If you genuinely have experience with ${skill}, include it in the relevant skills or project section.`),
      "Rewrite project bullets to show the action you took, the technology used, and the result.",
      "Use clear section headings and simple formatting so applicant-tracking systems can parse the document."
    ]
  };
}
