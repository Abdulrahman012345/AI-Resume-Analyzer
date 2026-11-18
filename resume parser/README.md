# ResumeAI — Resume Parser & JD Analyzer

A React + Vite + Tailwind CSS application that reads PDF/DOCX resumes in the browser and compares detected skills and keywords against a pasted job description.

## Requirements
- Node.js 20.19+ or 22.12+
- npm
- VS Code (recommended)

## Setup
Open this folder in VS Code, then run:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

## Production build
```bash
npm run build
npm run preview
```

## Features
- PDF text extraction with PDF.js
- DOCX text extraction with Mammoth.js
- Drag-and-drop / browse upload
- 5 MB file validation
- Skill and keyword matching
- Indicative scorecard, strengths, gaps, and recommendations
- Browser-local analysis history
- Downloadable text report

## Important limitations
- This is a client-side prototype with a transparent rule-based scoring model, not a real employer ATS and not an AI model.
- Scanned/image-only PDFs need OCR; PDF.js cannot extract text from an image-only page.
- The skill dictionary is intentionally finite. Add role-specific skills in `src/analyzer.js` to improve coverage.
- History is stored in LocalStorage on the current browser/device. Do not treat it as secure long-term storage.
- Resume content is processed in the browser and is not uploaded to a server by this starter application.
- DOCX is supported; legacy `.doc` files are not.
