"use client";
import { useState, useEffect } from "react";
import React from "react";
import Shell from "@/components/Shell";
import { BookOpen, Brain, Target, Upload, Calendar, CheckCircle, Clock, ChevronRight, Sparkles, FileText, Search, File, Edit3, Save, X, ArrowLeft, Hash } from "lucide-react";
import { chat, vault } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";

interface Course {
  code: string;
  name: string;
  topics: string[];
  progress: number;
}

interface Assignment {
  id: string;
  course: string;
  title: string;
  due: string;
  status: "pending" | "in-progress" | "completed";
}

interface VaultFile {
  name: string;
  path: string;
  stem: string;
  size: number;
  modified: number;
}

// Custom components for Obsidian-style markdown
const ObsidianComponents = (
  onWikiLinkClick: (link: string) => void
) => ({
  // Handle wiki links [[link]] and [[link|text]]
  a: ({ href, children, ...props }: any) => {
    // Check if it's a wiki link (starts with [[ or has no href)
    if (!href && typeof children === 'string' && children.startsWith('[[')) {
      const match = children.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
      if (match) {
        const link = match[1];
        const text = match[2] || link;
        return (
          <button
            onClick={() => onWikiLinkClick(link)}
            className="text-violet-400 hover:text-violet-300 hover:underline cursor-pointer"
            {...props}
          >
            {text}
          </button>
        );
      }
    }
    return (
      <a
        href={href}
        className="text-violet-400 hover:text-violet-300 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },
  // Handle tags #tag - render as proper tags anywhere in text
  text: ({ children, ...props }: any) => {
    if (typeof children === 'string') {
      // Replace #tag with styled tag components
      const parts = children.split(/(#[\w-]+)/g);
      return (
        <span {...props}>
          {parts.map((part, i) => {
            if (part.startsWith('#')) {
              return (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-900/30 text-violet-400 rounded-full text-xs font-medium hover:bg-violet-900/50 transition-colors cursor-pointer">
                  <Hash size={10} />
                  {part.slice(1)}
                </span>
              );
            }
            return part;
          })}
        </span>
      );
    }
    return <span {...props}>{children}</span>;
  },
  // Style blockquotes more prominently (for "Related:" sections)
  blockquote: ({ children, ...props }: any) => {
    return (
      <blockquote
        className="border-l-2 border-violet-500 bg-violet-900/10 p-4 my-4 rounded-r-lg"
        {...props}
      >
        {children}
      </blockquote>
    );
  },
  // Style horizontal rules
  hr: ({ ...props }: any) => (
    <hr className="border-zinc-800 my-8" {...props} />
  ),
  // Handle code blocks for mermaid
  pre: ({ children, ...props }: any) => {
    const child = React.Children.only(children);
    if (React.isValidElement(child) && child.props.className?.includes('language-mermaid')) {
      const MermaidDiagram = () => {
        const [svg, setSvg] = useState<string>('');
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        useEffect(() => {
          mermaid.initialize({ startOnLoad: true, theme: 'dark' });
          mermaid.render(id, child.props.children.toString())
            .then(result => setSvg(result.svg))
            .catch(console.error);
        }, [child.props.children]);
        
        return <div dangerouslySetInnerHTML={{ __html: svg }} className="flex justify-center my-4" />;
      };
      
      return <MermaidDiagram />;
    }
    
    return <pre {...props}>{children}</pre>;
  },
});

export default function StudyPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [mode, setMode] = useState<"browse" | "quiz" | "explain" | "summarize" | "assignments" | "files">("browse");
  const [input, setInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);

  // File viewer state
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Mock data - would come from vault/brain in production
  const courses: Course[] = [
    { code: "EGE353", name: "Autonomous Robotics", topics: ["ROS Basics", "Navigation", "Mapping", "Localization"], progress: 65 },
    { code: "EGE321", name: "Wireless Communication & Networking", topics: ["Fourier Series", "Time Domain", "Frequency Domain", "Filters"], progress: 40 },
    { code: "EGE351", name: "Automatino Systems & Control", topics: ["Microcontrollers", "Sensors", "Actuators", "Communication"], progress: 80 },
    { code: "EGE301", name: "Communication & Workplace Success", topics: ["Professional Communication", "Teamwork", "Leadership"], progress: 30 },
    { code: "EGE322", name: "IOT System Project", topics: ["IoT Architecture", "Sensors", "Cloud Integration"], progress: 20 },
    { code: "EGE320", name: "Embedded System Design & Technology", topics: ["Embedded Design", "Hardware", "Software"], progress: 50 },
  ];

  const assignments: Assignment[] = [
    { id: "1", course: "EGE353", title: "Lab 5: Path Planning", due: "2026-05-20", status: "in-progress" },
    { id: "2", course: "EGE321", title: "Assignment 3: Filter Design", due: "2026-05-22", status: "pending" },
    { id: "3", course: "EGE351", title: "Project: Sensor Integration", due: "2026-05-25", status: "pending" },
  ];

  async function loadFiles(course: string) {
    setLoading(true);
    try {
      const data = await vault.files({ course });
      setFiles(data.files);
    } catch (err: unknown) {
      console.error("Failed to load files:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadFileContent(file: VaultFile) {
    setLoading(true);
    try {
      const data = await vault.getFile(file.path);
      // Remove YAML frontmatter (between --- markers)
      let content = data.content;
      if (content.startsWith('---')) {
        const endMarker = content.indexOf('---', 3);
        if (endMarker !== -1) {
          content = content.substring(endMarker + 3).trimStart();
        }
      }
      setFileContent(content);
      setEditedContent(content);
      setSelectedFile(file);
    } catch (err: unknown) {
      console.error("Failed to load file:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveFile() {
    if (!selectedFile) return;
    setSaving(true);
    try {
      await vault.updateFile(selectedFile.path, editedContent);
      setFileContent(editedContent);
      setIsEditing(false);
    } catch (err: unknown) {
      console.error("Failed to save file:", err);
      alert("Failed to save file");
    } finally {
      setSaving(false);
    }
  }

  async function handleWikiLinkClick(link: string) {
    // Try to find the file in the current file list
    const matchedFile = files.find(f => f.stem === link || f.stem.includes(link));
    if (matchedFile) {
      await loadFileContent(matchedFile);
    } else {
      // If not found in current list, try to load all files and search
      try {
        const allFiles = await vault.files();
        const allMatchedFile = allFiles.files.find(f => f.stem === link || f.stem.includes(link));
        if (allMatchedFile) {
          await loadFileContent(allMatchedFile);
        } else {
          alert(`File "${link}" not found`);
        }
      } catch (err) {
        console.error("Failed to search for file:", err);
        alert(`Failed to find file "${link}"`);
      }
    }
  }

  async function handleAIAction() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      let prompt = "";
      if (mode === "quiz") {
        prompt = `Quiz me on ${selectedCourse?.name || "study materials"} focusing on: ${input}. Ask me questions and wait for my answers before providing feedback.`;
      } else if (mode === "explain") {
        prompt = `Explain "${input}" in the context of ${selectedCourse?.name || "my studies"}. Use simple language and provide examples.`;
      } else if (mode === "summarize") {
        prompt = `Summarize the key concepts about "${input}" from ${selectedCourse?.name || "my study materials"}. Give me 5-7 bullet points.`;
      }
      
      const res = await chat.send(prompt, []);
      setAiResponse(res.reply);
    } catch (err: unknown) {
      setAiResponse("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  // Load files when course is selected and mode is files
  useEffect(() => {
    if (mode === "files" && selectedCourse) {
      loadFiles(selectedCourse.code);
    }
  }, [mode, selectedCourse]);

  return (
    <Shell>
      <div className="px-4 pt-6 pb-6 space-y-6">
        {/* Header */}
        {!selectedFile ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600/20 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Study Mode</h1>
              <p className="text-xs text-zinc-500">AI-powered learning assistant</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedFile(null); setIsEditing(false); }} className="text-zinc-500 hover:text-zinc-300">
              <ArrowLeft size={18} />
            </button>
            <div className="w-9 h-9 bg-violet-600/20 rounded-xl flex items-center justify-center">
              <File size={18} className="text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-zinc-100 truncate">{selectedFile.stem}</h1>
              <p className="text-xs text-zinc-500">{selectedFile.path}</p>
            </div>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-zinc-500 hover:text-violet-400">
                <Edit3 size={16} />
              </button>
            )}
          </div>
        )}

        {/* File Viewer */}
        {selectedFile && (
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 min-h-[400px]">
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-[500px] bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-200 font-mono focus:outline-none focus:border-violet-500 resize-none"
                />
              ) : (
                <div className="prose prose-invert prose-base max-w-none prose-headings:text-zinc-100 prose-headings:font-bold prose-headings:mb-3 prose-headings:mt-6 prose-h1:text-3xl prose-h1:font-bold prose-h1:tracking-tight prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-medium prose-h3:mt-6 prose-h3:mb-3 prose-h4:text-lg prose-h4:font-medium prose-h4:mt-4 prose-h4:mb-2 prose-p:text-zinc-300 prose-p:leading-7 prose-p:mb-4 prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-zinc-100 prose-strong:font-semibold prose-code:text-violet-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:text-xs prose-blockquote:border-l-violet-500 prose-blockquote:text-zinc-400 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4 prose-hr:border-zinc-800 prose-hr:my-6 prose-table:text-zinc-300 prose-th:text-zinc-100 prose-th:border-zinc-700 prose-th:border-b prose-td:border-zinc-800 prose-td:border-b prose-ul:list-disc prose-ol:list-decimal prose-li:text-zinc-300 prose-li:mb-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={ObsidianComponents(handleWikiLinkClick)}>{fileContent}</ReactMarkdown>
                </div>
              )}
            </div>
            
            {isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={saveFile}
                  disabled={saving}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
                  Save
                </button>
                <button
                  onClick={() => { setIsEditing(false); setEditedContent(fileContent); }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main content when not viewing a file */}
        {!selectedFile && (
          <>
            {/* Mode Selection */}
            <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
              {[
                { id: "browse", label: "Browse", icon: FileText },
                { id: "files", label: "Files", icon: File },
                { id: "quiz", label: "Quiz", icon: Brain },
                { id: "explain", label: "Explain", icon: Sparkles },
                { id: "summarize", label: "Summarize", icon: FileText },
                { id: "assignments", label: "Assignments", icon: Target },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-lg font-medium transition-colors ${
                    mode === m.id ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <m.icon size={16} />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Content based on mode */}
            {mode === "browse" && (
              <div className="space-y-4">
                {/* Course Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-3">Select Course</h3>
                  <div className="space-y-2">
                    {courses.map((course) => (
                      <button
                        key={course.code}
                        onClick={() => setSelectedCourse(course)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                          selectedCourse?.code === course.code
                            ? "bg-violet-600/20 border-violet-600"
                            : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <div className="text-left">
                          <p className="font-semibold text-zinc-100">{course.code}</p>
                          <p className="text-xs text-zinc-400">{course.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full transition-all"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-400">{course.progress}%</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topics */}
                {selectedCourse && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200 mb-3">Topics</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedCourse.topics.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => { setInput(topic); setMode("explain"); }}
                          className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 hover:border-violet-500 hover:text-violet-400 transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span>{topic}</span>
                            <ChevronRight size={14} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === "files" && (
              <div className="space-y-4">
                {/* Course Selection for Files */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-3">Select Course</h3>
                  <div className="space-y-2">
                    {courses.map((course) => (
                      <button
                        key={course.code}
                        onClick={() => { setSelectedCourse(course); loadFiles(course.code); }}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                          selectedCourse?.code === course.code
                            ? "bg-violet-600/20 border-violet-600"
                            : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <div className="text-left">
                          <p className="font-semibold text-zinc-100">{course.code}</p>
                          <p className="text-xs text-zinc-400">{course.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* File List */}
                {selectedCourse && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200 mb-3">Files</h3>
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Clock size={24} className="animate-spin text-zinc-600" />
                      </div>
                    ) : files.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500">
                        <File size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No files found</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {files.map((file) => (
                          <button
                            key={file.path}
                            onClick={() => loadFileContent(file)}
                            className="w-full flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-left hover:border-violet-500 transition-colors"
                          >
                            <File size={16} className="text-zinc-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-zinc-300 truncate">{file.stem}</p>
                              <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <ChevronRight size={14} className="text-zinc-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {(mode === "quiz" || mode === "explain" || mode === "summarize") && (
              <div className="space-y-4">
                {/* Course Context */}
                {selectedCourse && (
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-500">Course Context</p>
                    <p className="text-sm text-zinc-300">{selectedCourse.code} - {selectedCourse.name}</p>
                  </div>
                )}

                {/* Input */}
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 block">
                    {mode === "quiz" ? "Topic to quiz on" : mode === "explain" ? "Concept to explain" : "Topic to summarize"}
                  </label>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAIAction()}
                    placeholder={mode === "quiz" ? "e.g., ROS Services" : mode === "explain" ? "e.g., Fourier Transform" : "e.g., Navigation algorithms"}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Action Button */}
                <button
                  onClick={handleAIAction}
                  disabled={loading || !input.trim()}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Clock size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {mode === "quiz" ? "Start Quiz" : mode === "explain" ? "Explain" : "Summarize"}
                </button>

                {/* AI Response */}
                {aiResponse && (
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-violet-400" />
                      <p className="text-xs font-medium text-zinc-400">AI Response</p>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
                  </div>
                )}
              </div>
            )}

            {mode === "assignments" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-200">Upcoming Assignments</h3>
                <div className="space-y-2">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-zinc-100">{assignment.title}</p>
                          <p className="text-xs text-zinc-400">{assignment.course}</p>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            assignment.status === "completed"
                              ? "bg-emerald-900/20 text-emerald-400"
                              : assignment.status === "in-progress"
                              ? "bg-amber-900/20 text-amber-400"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {assignment.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Calendar size={12} />
                        <span>Due: {new Date(assignment.due).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Search size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Study mode helps you learn course materials with AI assistance. Browse topics, get quizzes, explanations, and summaries.
                  Track assignments and monitor your progress across all courses.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
