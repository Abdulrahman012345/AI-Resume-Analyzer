
import { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Target,
  BriefcaseBusiness,
  Award,
  ArrowRight,
  RotateCcw,
  Download,
  ShieldCheck,
  Zap,
  History,
  LogOut,
  Eye,
  Trash2,
} from "lucide-react";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";

const API_URL = "https://ai-resume-analyzer-4jf7.onrender.com/api";

const sampleJD = `We are looking for a Junior Full Stack Python Developer.
Required skills: Python, Django, React, JavaScript, HTML, CSS, MySQL, REST API, Git.
Responsibilities include building responsive web applications, developing REST APIs, working with relational databases, debugging issues, and collaborating with a development team.
A degree in Computer Science or a related field and strong problem-solving skills are preferred.`;

function ScoreRing({ score }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));

  const data = [
    { name: "Score", value: safeScore },
    { name: "Remaining", value: 100 - safeScore },
  ];

  return (
    <div className="relative h-44 w-44">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={62}
            outerRadius={78}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill="#6d5dfc" />
            <Cell fill="#e9eaf2" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold tracking-tight text-slate-900">
          {safeScore}%
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          ATS score
        </span>
      </div>
    </div>
  );
}

function App() {
  // AUTHENTICATION
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const inputRef = useRef(null);

  // RESUME
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeId, setResumeId] = useState(null);

  // JOB DESCRIPTION
  const [jd, setJd] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");

  // UI STATES
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // RESULTS AND HISTORY
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  // AUTH HEADERS
  const getAuthHeaders = (json = false) => {
    const headers = {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    };

    if (json) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  };

  // LOGIN
  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/history/`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        },
      });

      if (!response.ok) {
        throw new Error("Invalid username or password.");
      }

      const data = await response.json();

      setHistory(data.history || []);
      setIsLoggedIn(true);
      setError("");
      setMessage("Login successful!");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    setUsername("");
    setPassword("");
    setIsLoggedIn(false);

    setFile(null);
    setResumeText("");
    setResumeId(null);

    setJd("");
    setJobTitle("");
    setCompany("");

    setResult(null);
    setHistory([]);
    setSelectedAnalysis(null);

    setError("");
    setMessage("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // LOAD BACKEND HISTORY
  const loadHistory = async () => {
    const response = await fetch(`${API_URL}/history/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Unable to load analysis history.");
    }

    const data = await response.json();
    setHistory(data.history || []);
  };

  // STEP 1: UPLOAD RESUME
  const saveFile = async (selected) => {
    setError("");
    setMessage("");
    setResult(null);
    setResumeId(null);

    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file only.");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError("File is larger than 5 MB.");
      return;
    }

    if (selected.size === 0) {
      setError("This file is empty.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selected);

      const response = await fetch(`${API_URL}/resumes/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.detail || "Resume upload failed."
        );
      }

      setFile(selected);
      setResumeId(data.id);
      setResumeText(data.extracted_text || "");

      setMessage("Resume uploaded successfully!");
    } catch (err) {
      setFile(null);
      setResumeId(null);
      setResumeText("");
      setError(err.message || "Unable to upload resume.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: RUN ANALYSIS
  const runAnalysis = async () => {
    setError("");
    setMessage("");
    setResult(null);

    if (!file || !resumeId) {
      setError("Please upload your resume first.");
      return;
    }

    if (jd.trim().length < 40) {
      setError(
        "Please enter a complete job description (at least 40 characters)."
      );
      return;
    }

    setLoading(true);

    try {
      // SAVE JOB DESCRIPTION
      const jobResponse = await fetch(
        `${API_URL}/job-description/`,
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            job_title: jobTitle.trim() || "Untitled role",
            company_name: company.trim(),
            description: jd.trim(),
          }),
        }
      );

      const jobData = await jobResponse.json();

      if (!jobResponse.ok) {
        throw new Error(
          jobData.error ||
          jobData.detail ||
          "Unable to save Job Description."
        );
      }

      // ANALYZE RESUME
      const analysisResponse = await fetch(
        `${API_URL}/analyze/`,
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            resume_id: resumeId,
            job_description_id: jobData.id,
          }),
        }
      );

      const analysisData = await analysisResponse.json();

      if (!analysisResponse.ok) {
        throw new Error(
          analysisData.error ||
          analysisData.detail ||
          "Resume analysis failed."
        );
      }

      // DETERMINE GEMINI STATUS
      const aiStatus =
        analysisData.ai_status === "success"
          ? "success"
          : "unavailable";

      const aiMessage =
        analysisData.message ||
        (aiStatus === "success"
          ? "Gemini AI generated the resume insights. ATS scores are calculated separately."
          : "Gemini AI is temporarily unavailable. ATS fallback analysis was used.");

      // CONVERT BACKEND RESPONSE
      const analysis = {
        analysisId: analysisData.analysis_id,

        // NEW: AI STATUS
        aiStatus,
        aiMessage,

        // ATS SCORES
        overall: Number(analysisData.ats_score || 0),
        skillScore: Number(analysisData.match_score || 0),
        sectionScore: Number(analysisData.section_score || 0),

        // SKILLS
        matched: analysisData.matched_skills || [],
        missing: analysisData.missing_skills || [],

        // AI INSIGHTS OR FALLBACK INSIGHTS
        strengths: analysisData.strengths || [],
        weaknesses: analysisData.weaknesses || [],
        recommendations: analysisData.suggestions || [],

        // RESUME SECTIONS
        sections: [
          ...(analysisData.found_sections || []).map(
            (section) => [section, true]
          ),
          ...(analysisData.missing_sections || []).map(
            (section) => [section, false]
          ),
        ],
      };

      setResult(analysis);

      // RELOAD HISTORY FROM DATABASE
      await loadHistory();

      setMessage(
        aiStatus === "success"
          ? "Gemini AI insights generated successfully!"
          : "ATS analysis completed. Gemini AI is temporarily unavailable."
      );

      setTimeout(() => {
        document
          .getElementById("results")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // VIEW PREVIOUS ANALYSIS
  const handleView = async (id) => {
    setLoading(true);
    setError("");
    setSelectedAnalysis(null);

    try {
      const response = await fetch(
        `${API_URL}/history/${id}/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.detail || "Unable to view analysis."
        );
      }

      setSelectedAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE ANALYSIS
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this analysis?"
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/history/${id}/delete/`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.detail || "Unable to delete analysis."
        );
      }

      setHistory((previous) =>
        previous.filter((item) => item.analysis_id !== id)
      );

      if (selectedAnalysis?.analysis_id === id) {
        setSelectedAnalysis(null);
      }

      setMessage("Analysis deleted successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // RESET
  const reset = () => {
    setFile(null);
    setResumeText("");
    setResumeId(null);

    setJd("");
    setJobTitle("");
    setCompany("");

    setResult(null);
    setSelectedAnalysis(null);

    setError("");
    setMessage("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // REMOVE UPLOADED RESUME
  const removeFile = () => {
    setFile(null);
    setResumeText("");
    setResumeId(null);
    setResult(null);
    setError("");
    setMessage("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // DOWNLOAD REPORT
  const downloadReport = () => {
    if (!result) return;

    const analysisType =
      result.aiStatus === "success"
        ? "Gemini AI Insights + ATS Scores"
        : "ATS Rule-Based Fallback";

    const lines = [
      "RESUMEAI - RESUME MATCH REPORT",
      `Role: ${jobTitle || "Not specified"}`,
      `Company: ${company || "Not specified"}`,
      `Resume: ${file?.name || "Not specified"}`,
      "",
      `Analysis Type: ${analysisType}`,
      `Analysis Status: ${result.aiMessage}`,
      "",
      `ATS Score: ${result.overall}%`,
      `Skills Match: ${result.skillScore}%`,
      `Resume Sections: ${result.sectionScore}%`,
      "",
      `MATCHED SKILLS: ${result.matched.join(", ") || "None detected"}`,
      `MISSING SKILLS: ${result.missing.join(", ") || "None detected"}`,
      "",
      "STRENGTHS",
      ...result.strengths.map((item) => `- ${item}`),
      "",
      "AREAS TO IMPROVE",
      ...result.weaknesses.map((item) => `- ${item}`),
      "",
      "RECOMMENDATIONS",
      ...result.recommendations.map((item) => `- ${item}`),
      "",
      "Note: ATS scores are indicative matching scores, not official ATS scores.",
      result.aiStatus === "success"
        ? "Insights: Strengths, weaknesses, and recommendations were generated using Gemini AI."
        : "Insights: Gemini AI was unavailable. Strengths, weaknesses, and recommendations came from the ATS fallback.",
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "resume-analysis-report.txt";
    a.click();

    URL.revokeObjectURL(url);
  };

  const rating =
    result?.overall >= 80
      ? "Strong match"
      : result?.overall >= 60
      ? "Moderate match"
      : "Needs improvement";

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f9fc] px-5">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-violet-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />

        <div className="relative w-full max-w-md rounded-3xl border border-white bg-white p-8 shadow-2xl shadow-violet-100 sm:p-10">
          <div className="mb-6 flex justify-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
              <FileText size={28} />
            </span>
          </div>

          <h1 className="text-center text-3xl font-black tracking-tight text-slate-900">
            Resume<span className="text-violet-600">AI</span>
          </h1>

          <p className="mt-2 text-center text-sm text-slate-500">
            Login to your smart resume analyzer
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form
            className="mt-8"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Username
            </label>

            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />

            <label className="mb-2 mt-5 block text-sm font-bold text-slate-700">
              Password
            </label>

            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-7 w-full rounded-xl bg-violet-600 px-5 py-4 font-extrabold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login to ResumeAI"}
              {!loading && (
                <ArrowRight className="ml-2 inline" size={17} />
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Secure account authentication powered by Django.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-800">

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a
            href="#"
            className="flex items-center gap-2.5 font-extrabold tracking-tight text-slate-900"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white">
              <FileText size={19} />
            </span>
            Resume<span className="text-violet-600">AI</span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-500 md:flex">
            <a href="#analyzer" className="hover:text-violet-700">
              Analyzer
            </a>
            <a href="#how-it-works" className="hover:text-violet-700">
              How it works
            </a>
            <a href="#history" className="hover:text-violet-700">
              History
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-semibold text-slate-600 sm:block">
              {username}
            </span>

            <a
              href="#analyzer"
              className="hidden rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 sm:inline-block"
            >
              Analyze resume <ArrowRight className="ml-1 inline" size={15} />
            </a>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-600"
            >
              <LogOut className="inline" size={16} />
              <span className="ml-1 hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main>

        {/* HERO SECTION */}
        <section className="relative overflow-hidden px-5 pb-14 pt-16 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-violet-200/50 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 top-48 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm">
                <Sparkles size={14} /> SMART RESUME MATCHING
              </div>

              <h1 className="max-w-2xl text-5xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-6xl">
                Make your resume{" "}
                <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                  job-ready.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">
                See how your resume compares with a job description. Find skill gaps,
                highlight strengths, and get practical ways to improve.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#analyzer"
                  className="rounded-xl bg-violet-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700"
                >
                  Analyze my resume <ArrowRight className="ml-2 inline" size={17} />
                </a>

                <a
                  href="#how-it-works"
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 hover:border-violet-200"
                >
                  How it works
                </a>
              </div>

              <div className="mt-9 flex flex-wrap gap-5 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  Secure backend processing
                </span>
                <span className="flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" />
                  AI insights + ATS matching
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg rounded-3xl border border-white bg-white p-5 shadow-2xl shadow-violet-100/70 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Your match overview</p>
                  <p className="mt-1 text-xs text-slate-400">Illustrative dashboard preview</p>
                </div>
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  Preview
                </span>
              </div>

              <div className="mt-5 flex items-center gap-5 rounded-2xl bg-slate-50 p-4">
                <div className="grid h-24 w-24 place-items-center rounded-full border-[9px] border-violet-500 bg-white text-2xl font-black text-slate-900">
                  82%
                </div>
                <div>
                  <p className="font-bold text-slate-900">Great potential match</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Understand your fit before you apply.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {[["Skills match", 88], ["Resume sections", 82]].map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-2 flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">{label}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-400"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-2">
                <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">✓ Python</span>
                <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">✓ React</span>
                <span className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">+ AWS gap</span>
              </div>
            </div>
          </div>
        </section>

        {/* ANALYZER SECTION */}
        <section id="analyzer" className="scroll-mt-24 px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">

            <div className="mb-9 text-center">
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-violet-600">
                Resume analyzer
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Compare your resume with a job
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-500">
                Upload a resume and paste the job description to get your personalized match report.
              </p>
            </div>

            {message && (
              <div className="mx-auto mb-5 flex max-w-3xl items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                <CheckCircle2 size={18} />
                {message}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">

              {/* RESUME UPLOAD */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700">
                    <UploadCloud />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900">1. Upload your resume</h3>
                    <p className="text-sm text-slate-500">PDF document only, up to 5 MB</p>
                  </div>
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => saveFile(e.target.files?.[0])}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    saveFile(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => !loading && inputRef.current?.click()}
                  className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
                    dragging
                      ? "border-violet-500 bg-violet-50"
                      : "border-slate-200 bg-slate-50/70 hover:border-violet-300 hover:bg-violet-50/40"
                  }`}
                >
                  {loading ? (
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                  ) : (
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-violet-600 shadow-sm">
                      <UploadCloud size={27} />
                    </span>
                  )}

                  <p className="mt-4 font-bold text-slate-800">
                    {loading ? "Processing..." : "Drag & drop your resume here"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    or <span className="font-bold text-violet-700">browse files</span> from your device
                  </p>

                  <p className="mt-4 text-xs text-slate-400">PDF · MAX 5 MB</p>
                </div>

                {file && (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="shrink-0 text-emerald-700" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{file.name}</p>
                        <p className="text-xs text-slate-500">
                          {(file.size / 1024).toFixed(0)} KB · Uploaded successfully
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600"
                      aria-label="Remove file"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}

                {resumeId && (
                  <p className="mt-3 text-xs font-semibold text-emerald-700">
                    Resume uploaded to backend successfully. Resume ID: {resumeId}
                  </p>
                )}
              </div>

              {/* JOB DESCRIPTION */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                    <BriefcaseBusiness />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900">2. Add the job description</h3>
                    <p className="text-sm text-slate-500">
                      Paste the job requirements you want to match
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Job title (optional)"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  />

                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company (optional)"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  rows={9}
                  placeholder="Paste the complete job description here..."
                  className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{jd.length} characters</span>
                  <button
                    onClick={() => setJd(sampleJD)}
                    className="text-xs font-bold text-violet-700 hover:text-violet-900"
                  >
                    Use sample JD
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mx-auto mt-5 flex max-w-3xl items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                onClick={runAnalysis}
                disabled={loading}
                className="rounded-xl bg-violet-600 px-8 py-4 font-extrabold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="mr-2 inline" size={18} />
                {loading ? "Analyzing..." : "Analyze my resume"}
              </button>

              <button
                onClick={reset}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw className="mr-2 inline" size={16} /> Reset
              </button>
            </div>
          </div>
        </section>

        {/* RESULTS SECTION */}
        {result && (
          <section id="results" className="scroll-mt-24 border-y border-slate-200 bg-white px-5 py-16 lg:px-8">
            <div className="mx-auto max-w-7xl">

              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.2em] text-violet-600">
                    Your report
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    Resume match results
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {jobTitle || "Job description"} {company ? `· ${company}` : ""}
                  </p>
                </div>

                <button
                  onClick={downloadReport}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold hover:bg-slate-50"
                >
                  <Download className="mr-2 inline" size={16} /> Download report
                </button>
              </div>

              {/* NEW: GEMINI AI STATUS */}
              <div
                className={`mb-6 rounded-2xl border p-5 ${
                  result.aiStatus === "success"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl ${
                      result.aiStatus === "success"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {result.aiStatus === "success" ? (
                      <Sparkles size={21} />
                    ) : (
                      <AlertCircle size={21} />
                    )}
                  </span>

                  <div>
                    <p
                      className={`font-extrabold ${
                        result.aiStatus === "success"
                          ? "text-emerald-800"
                          : "text-amber-800"
                      }`}
                    >
                      {result.aiStatus === "success"
                        ? "Gemini AI Insights + ATS Scores"
                        : "ATS Rule-Based Fallback"}
                    </p>

                    <p
                      className={`mt-1 text-sm ${
                        result.aiStatus === "success"
                          ? "text-emerald-700"
                          : "text-amber-800"
                      }`}
                    >
                      {result.aiMessage}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <strong>How to read this report:</strong> ATS scores are calculated by the resume matching logic. Gemini AI, when available, generates the strengths, weaknesses, and recommendations.
              </div>

              <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
                <div className="flex flex-col items-center justify-center rounded-3xl bg-slate-50 p-7 text-center">
                  <ScoreRing score={result.overall} />
                  <h3 className="mt-2 text-xl font-extrabold text-slate-900">{rating}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                    Indicative score based on detected skills and resume sections.
                    This is not an official ATS score.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Skills match", result.skillScore, Target],
                    ["Resume sections", result.sectionScore, Award],
                  ].map(([name, value, Icon]) => (
                    <div key={name} className="rounded-2xl border border-slate-200 p-5">
                      <Icon className="text-violet-600" />
                      <p className="mt-4 text-sm font-semibold text-slate-500">{name}</p>
                      <p className="mt-1 text-3xl font-black text-slate-900">{value}%</p>
                      <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-violet-500"
                          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MATCHED AND MISSING SKILLS */}
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
                  <h3 className="flex items-center gap-2 font-extrabold text-emerald-800">
                    <CheckCircle2 /> Matched skills ({result.matched.length})
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.matched.length ? (
                      result.matched.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm font-semibold text-emerald-800"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No matching skills detected yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6">
                  <h3 className="flex items-center gap-2 font-extrabold text-rose-800">
                    <AlertCircle /> Missing skills ({result.missing.length})
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.missing.length ? (
                      result.missing.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg border border-rose-100 bg-white px-3 py-2 text-sm font-semibold text-rose-800"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No missing skills from the detected skill list.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* STRENGTHS AND WEAKNESSES */}
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-6">
                  <h3 className="font-extrabold text-slate-900">Strengths</h3>
                  <ul className="mt-4 space-y-3">
                    {result.strengths.length ? (
                      result.strengths.map((item, index) => (
                        <li key={index} className="flex gap-2 text-sm leading-6 text-slate-600">
                          <CheckCircle2 size={17} className="mt-1 shrink-0 text-emerald-600" />
                          {item}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-slate-500">No strengths identified.</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6">
                  <h3 className="font-extrabold text-slate-900">Weaknesses & gaps</h3>
                  <ul className="mt-4 space-y-3">
                    {result.weaknesses.length ? (
                      result.weaknesses.map((item, index) => (
                        <li key={index} className="flex gap-2 text-sm leading-6 text-slate-600">
                          <AlertCircle size={17} className="mt-1 shrink-0 text-amber-600" />
                          {item}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-slate-500">No obvious gaps detected.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* RECOMMENDATIONS */}
              <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/50 p-6">
                <h3 className="font-extrabold text-violet-950">Recommended improvements</h3>
                <ul className="mt-4 grid gap-3 md:grid-cols-2">
                  {result.recommendations.length ? (
                    result.recommendations.map((item, index) => (
                      <li key={index} className="flex gap-2 text-sm leading-6 text-slate-700">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-extrabold text-violet-700">
                          {index + 1}
                        </span>
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">
                      No recommendations available.
                    </li>
                  )}
                </ul>
              </div>

              {/* RESUME SECTIONS */}
              <div className="mt-5 rounded-2xl border border-slate-200 p-6">
                <h3 className="font-extrabold text-slate-900">Resume section check</h3>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {result.sections.map(([name, present]) => (
                    <div key={name} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-700">{name}</p>
                      <p
                        className={`mt-2 text-xs font-bold ${
                          present ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {present ? "Detected" : "Not detected"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>
        )}

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-violet-600">
                Simple workflow
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                How ResumeAI works
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  n: "01",
                  title: "Upload your resume",
                  desc: "Upload a PDF resume. Django extracts the text and stores the resume.",
                  icon: UploadCloud,
                },
                {
                  n: "02",
                  title: "Paste the job description",
                  desc: "Provide the job requirements and skills from the opportunity.",
                  icon: BriefcaseBusiness,
                },
                {
                  n: "03",
                  title: "Review your match report",
                  desc: "Explore detected skills, gaps, strengths, and practical suggestions.",
                  icon: Target,
                },
              ].map(({ n, title, desc, icon: Icon }) => (
                <div key={n} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-violet-600">{n}</span>
                    <Icon className="text-violet-600" />
                  </div>
                  <h3 className="mt-6 text-lg font-extrabold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HISTORY */}
        <section id="history" className="scroll-mt-24 px-5 pb-16 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <History className="text-violet-600" />
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Recent analysis history
                  </h2>
                  <p className="text-sm text-slate-500">
                    Synced with your account
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    setError("");
                    await loadHistory();
                    setMessage("History refreshed successfully.");
                  } catch (err) {
                    setError(err.message);
                  }
                }}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Refresh history
              </button>
            </div>

            {history.length ? (
              <div className="mt-5 divide-y divide-slate-100">
                {history.map((item) => (
                  <div
                    key={item.analysis_id}
                    className="flex flex-wrap items-center justify-between gap-4 py-5"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800">
                        {item.job_title}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {item.company_name || "Company not specified"}
                      </p>

                      <p className="mt-1 break-all text-xs text-slate-400">
                        {item.resume_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(item.created_at).toLocaleString()}
                      </p>

                      <p className="mt-2 font-bold text-violet-700">
                        Match Score: {item.match_score}%
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(item.analysis_id)}
                        disabled={loading}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
                      >
                        <Eye className="mr-1 inline" size={15} />
                        View
                      </button>

                      <button
                        onClick={() => handleDelete(item.analysis_id)}
                        disabled={loading}
                        className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-50"
                      >
                        <Trash2 className="mr-1 inline" size={15} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                Your completed analyses will appear here.
              </p>
            )}

            {/* PREVIOUS ANALYSIS DETAILS */}
            {selectedAnalysis && (
              <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/50 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">
                    Previous Analysis Details
                  </h3>

                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-rose-600"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Job title</p>
                    <p className="mt-1 font-bold text-slate-800">
                      {selectedAnalysis.job_title}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Company</p>
                    <p className="mt-1 font-bold text-slate-800">
                      {selectedAnalysis.company_name || "Not specified"}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs font-bold uppercase text-slate-400">Resume</p>
                    <p className="mt-1 break-all font-semibold text-slate-800">
                      {selectedAnalysis.resume_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Match score</p>
                    <p className="mt-1 text-2xl font-black text-violet-700">
                      {selectedAnalysis.match_score}%
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Analysis date</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {new Date(selectedAnalysis.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div className="rounded-xl border border-emerald-100 bg-white p-4">
                    <h4 className="font-extrabold text-emerald-700">
                      Matched Skills
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selectedAnalysis.matched_skills || []).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                        >
                          {skill}
                        </span>
                      ))}
                      {!selectedAnalysis.matched_skills?.length && (
                        <p className="text-sm text-slate-500">None</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-rose-100 bg-white p-4">
                    <h4 className="font-extrabold text-rose-700">
                      Missing Skills
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selectedAnalysis.missing_skills || []).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"
                        >
                          {skill}
                        </span>
                      ))}
                      {!selectedAnalysis.missing_skills?.length && (
                        <p className="text-sm text-slate-500">None</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white px-5 py-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} ResumeAI. Built to help you prepare smarter applications.
      </footer>
    </div>
  );
}

export default App;
