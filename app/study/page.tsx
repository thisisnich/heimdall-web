"use client";
import { useState } from "react";
import Shell from "@/components/Shell";
import { BookOpen, Brain, Target, CheckCircle, Clock, ChevronRight, FileText } from "lucide-react";
import { chat } from "@/lib/api";

interface Course {
  code: string;
  name: string;
  topics: string[];
  progress: number;
}

export default function StudyPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [mode, setMode] = useState<"browse" | "quiz" | "flashcards">("browse");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock data - would come from vault/brain in production
  const courses: Course[] = [
    { code: "EGE353", name: "Autonomous Robotics", topics: ["ROS Basics", "Navigation", "Mapping", "Localization"], progress: 65 },
    { code: "EGE321", name: "Wireless Communication & Networking", topics: ["Fourier Series", "Time Domain", "Frequency Domain", "Filters"], progress: 40 },
    { code: "EGE351", name: "Automatino Systems & Control", topics: ["Microcontrollers", "Sensors", "Actuators", "Communication"], progress: 80 },
    { code: "EGE301", name: "Communication & Workplace Success", topics: ["Professional Communication", "Teamwork", "Leadership"], progress: 30 },
    { code: "EGE322", name: "IOT System Project", topics: ["IoT Architecture", "Sensors", "Cloud Integration"], progress: 20 },
    { code: "EGE320", name: "Embedded System Design & Technology", topics: ["Embedded Design", "Hardware", "Software"], progress: 50 },
  ];

  function toggleTopic(topic: string) {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  }

  async function handleAIAction() {
    if (!input.trim() || !selectedCourse) return;
    setLoading(true);
    try {
      let prompt = "";
      if (mode === "quiz") {
        const topicContext = selectedTopics.length > 0 
          ? `focusing on ${selectedTopics.join(", ")}` 
          : "covering the course";
        prompt = `Quiz me on ${selectedCourse.name} (${selectedCourse.code}) ${topicContext}. Ask me questions and wait for my answers before providing feedback. Make it interactive and challenging.`;
      } else if (mode === "flashcards") {
        const topicContext = selectedTopics.length > 0 
          ? `focusing on ${selectedTopics.join(", ")}` 
          : "covering the course";
        prompt = `Generate flashcards for ${selectedCourse.name} (${selectedCourse.code}) ${topicContext}. Format each flashcard as "Q: [question]\\nA: [answer]". Provide 10-15 flashcards covering key concepts.`;
      }
      
      const response = await chat.stream(prompt, "gpt-4o-mini");
      setAiResponse(response);
    } catch (err: unknown) {
      console.error("Failed to get AI response:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2 flex items-center gap-3">
            <BookOpen className="text-violet-400" />
            Study Mode
          </h1>
          <p className="text-zinc-400">AI-powered quizzes and flashcards</p>
        </div>

        {!selectedCourse ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course.code}
                onClick={() => setSelectedCourse(course)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-violet-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-violet-400 transition-colors">{course.code}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{course.name}</p>
                  </div>
                  <ChevronRight className="text-zinc-600 group-hover:text-violet-400 transition-colors" />
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-zinc-400 mb-2">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-violet-600 h-2 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {course.topics.slice(0, 3).map((topic) => (
                    <span key={topic} className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded-full">
                      {topic}
                    </span>
                  ))}
                  {course.topics.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded-full">
                      +{course.topics.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Course Header */}
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => {
                    setSelectedCourse(null);
                    setSelectedTopics([]);
                    setMode("browse");
                    setAiResponse("");
                  }}
                  className="text-sm text-zinc-400 hover:text-zinc-200 mb-2 flex items-center gap-1"
                >
                  ← Back to courses
                </button>
                <h2 className="text-2xl font-bold text-zinc-100">
                  {selectedCourse.code}: {selectedCourse.name}
                </h2>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setMode("browse")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "browse"
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                <Target className="inline w-4 h-4 mr-2" />
                Browse
              </button>
              <button
                onClick={() => setMode("quiz")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "quiz"
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                <Brain className="inline w-4 h-4 mr-2" />
                Quiz
              </button>
              <button
                onClick={() => setMode("flashcards")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "flashcards"
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                <FileText className="inline w-4 h-4 mr-2" />
                Flashcards
              </button>
            </div>

            {/* Browse Topics */}
            {mode === "browse" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-100">Select Topics (Multi-select)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCourse.topics.map((topic) => (
                    <div
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer transition-all ${
                        selectedTopics.includes(topic)
                          ? "border-violet-500 bg-violet-900/20"
                          : "border-zinc-800 hover:border-violet-500/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-zinc-100 font-medium">{topic}</h4>
                        {selectedTopics.includes(topic) && (
                          <CheckCircle className="text-violet-400" size={18} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quiz Mode */}
            {mode === "quiz" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-100">Quiz Mode</h3>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="mb-4">
                    <p className="text-sm text-zinc-400 mb-2">Selected topics:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTopics.length > 0 ? (
                        selectedTopics.map((topic) => (
                          <span key={topic} className="text-xs px-2 py-1 bg-violet-900/30 text-violet-400 rounded-full">
                            {topic}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-500">All topics</span>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter additional context or specific areas to focus on..."
                    className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 resize-none"
                  />
                  <button
                    onClick={handleAIAction}
                    disabled={loading}
                    className="mt-4 w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <Clock className="animate-spin" size={16} /> : <Brain size={16} />}
                    Start Quiz
                  </button>
                  {aiResponse && (
                    <div className="mt-4 p-4 bg-zinc-950 rounded-lg">
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{aiResponse}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Flashcards Mode */}
            {mode === "flashcards" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-100">Flashcards</h3>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="mb-4">
                    <p className="text-sm text-zinc-400 mb-2">Selected topics:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTopics.length > 0 ? (
                        selectedTopics.map((topic) => (
                          <span key={topic} className="text-xs px-2 py-1 bg-violet-900/30 text-violet-400 rounded-full">
                            {topic}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-500">All topics</span>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter additional context or specific areas to focus on..."
                    className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 resize-none"
                  />
                  <button
                    onClick={handleAIAction}
                    disabled={loading}
                    className="mt-4 w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <Clock className="animate-spin" size={16} /> : <FileText size={16} />}
                    Generate Flashcards
                  </button>
                  {aiResponse && (
                    <div className="mt-4 p-4 bg-zinc-950 rounded-lg">
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{aiResponse}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
