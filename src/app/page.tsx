"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Task = {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "focus" | "class" | "break" | "personal";
  priority?: "high" | "medium" | "low";
};

type TimePreference = "morning" | "afternoon" | "evening";

// Generate realistic schedule
function generateSchedule(
  preference: TimePreference,
  intensity: number,
  focusHours: number
): Task[] {
  const tasks: Task[] = [];
  const startHour = preference === "morning" ? 8 : preference === "afternoon" ? 13 : 18;

  const scheduleTemplates = {
    morning: [
      { title: "Deep Work: Algorithm Design", type: "focus" as const, duration: 90, priority: "high" as const },
      { title: "Break", type: "break" as const, duration: 15 },
      { title: "Data Structures Lecture", type: "class" as const, duration: 90 },
      { title: "Lunch Break", type: "break" as const, duration: 45 },
      { title: "Project: Aurora Development", type: "focus" as const, duration: 120, priority: "high" as const },
      { title: "Coffee Break", type: "break" as const, duration: 15 },
      { title: "Code Review & Testing", type: "focus" as const, duration: 60, priority: "medium" as const },
    ],
    afternoon: [
      { title: "Machine Learning Workshop", type: "class" as const, duration: 120 },
      { title: "Break", type: "break" as const, duration: 15 },
      { title: "Research: Paper Analysis", type: "focus" as const, duration: 90, priority: "high" as const },
      { title: "Team Meeting", type: "class" as const, duration: 60 },
      { title: "Evening Study Session", type: "focus" as const, duration: 90, priority: "medium" as const },
    ],
    evening: [
      { title: "Side Project: Portfolio", type: "focus" as const, duration: 120, priority: "medium" as const },
      { title: "Break", type: "break" as const, duration: 15 },
      { title: "Learning: New Framework", type: "focus" as const, duration: 90, priority: "low" as const },
      { title: "Personal Reading", type: "personal" as const, duration: 60 },
    ],
  };

  let currentTime = startHour * 60;
  const template = scheduleTemplates[preference];
  const maxTasks = Math.ceil(focusHours / 1.5) + 2;

  template.slice(0, maxTasks).forEach((item, idx) => {
    const duration = intensity > 70 ? Math.round(item.duration * 1.2) : item.duration;
    const start = currentTime;
    const end = currentTime + duration;

    tasks.push({
      id: `task-${idx}`,
      title: item.title,
      start: formatTime(start),
      end: formatTime(end),
      type: item.type,
      priority: item.priority,
    });

    currentTime = end;
  });

  return tasks;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function TimelineView({ tasks }: { tasks: Task[] }) {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const typeStyles = {
    focus: "bg-gradient-to-br from-blue-500/90 to-indigo-600/90 border-blue-400/30",
    class: "bg-gradient-to-br from-purple-500/90 to-pink-600/90 border-purple-400/30",
    break: "bg-gradient-to-br from-emerald-500/90 to-teal-600/90 border-emerald-400/30",
    personal: "bg-gradient-to-br from-amber-500/90 to-orange-600/90 border-amber-400/30",
  };

  const parseTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const minTime = Math.min(...tasks.map((t) => parseTime(t.start)));
  const maxTime = Math.max(...tasks.map((t) => parseTime(t.end)));
  const totalMinutes = Math.max(1, maxTime - minTime);

  return (
    <div className="relative h-[500px] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full border-t border-white/10"
            style={{ top: `${(i / 12) * 100}%` }}
          />
        ))}
      </div>

      {/* Time labels */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-900/90 to-transparent border-r border-white/5 flex flex-col justify-between py-4 px-2">
        {Array.from({ length: 8 }).map((_, i) => {
          const time = minTime + (i * totalMinutes) / 7;
          const h = Math.floor(time / 60);
          return (
            <div key={i} className="text-[10px] text-white/40 font-mono text-right">
              {h > 12 ? h - 12 : h}
              {h >= 12 ? "pm" : "am"}
            </div>
          );
        })}
      </div>

      {/* Tasks */}
      <div className="absolute left-16 right-4 top-0 bottom-0 py-4">
        {tasks.map((task) => {
          const start = parseTime(task.start);
          const end = parseTime(task.end);
          const top = ((start - minTime) / totalMinutes) * 100;
          const height = ((end - start) / totalMinutes) * 100;
          const isHovered = hoveredTask === task.id;

          return (
            <div
              key={task.id}
              className={`absolute left-0 right-0 transition-all duration-300 cursor-pointer ${
                typeStyles[task.type]
              } ${isHovered ? "scale-[1.02] shadow-2xl z-10" : "scale-100"} backdrop-blur-sm border rounded-xl p-3`}
              style={{ top: `${top}%`, height: `${Math.max(height, 6)}%` }}
              onMouseEnter={() => setHoveredTask(task.id)}
              onMouseLeave={() => setHoveredTask(null)}
            >
              <div className="flex items-start justify-between gap-2 h-full">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{task.title}</div>
                  {height > 8 && (
                    <div className="text-xs text-white/70 mt-1 flex items-center gap-2">
                      <span>
                        {task.start} - {task.end}
                      </span>
                      {task.priority && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            task.priority === "high"
                              ? "bg-red-500/30"
                              : task.priority === "medium"
                              ? "bg-yellow-500/30"
                              : "bg-green-500/30"
                          }`}
                        >
                          {task.priority}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isHovered && (
                  <button className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ value, label, trend }: { value: string; label: string; trend?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-5 group hover:border-white/20 transition-all">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
      <div className="relative">
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm text-white/60">{label}</div>
        {trend && (
          <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                clipRule="evenodd"
              />
            </svg>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  const [preference, setPreference] = useState<TimePreference>("morning");
  const [intensity, setIntensity] = useState(75);
  const [focusHours, setFocusHours] = useState(5);
  const [mounted, setMounted] = useState(false);

  const schedule = useMemo(
    () => generateSchedule(preference, intensity, focusHours),
    [preference, intensity, focusHours]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ✅ NO HEADER HERE (navbar should be in layout.tsx) */}

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6">
        <section className="py-20 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className={`space-y-8 ${mounted ? "animate-fade-in" : "opacity-0"}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-300 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Trusted by 10,000+ students and professionals
            </div>

            <h1 className="text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight">
              Schedule smarter,
              <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                achieve more
              </span>
            </h1>

            <p className="text-xl text-white/60 leading-relaxed max-w-xl">
              AI-powered scheduling that adapts to your life. Transform overwhelming to-do lists into achievable daily plans with intelligent time blocking.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push("/get-started")}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                <span className="relative z-10">Start free trial</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </button>

              <button
                onClick={() => router.push("/demo")}
                className="border border-white/20 hover:border-white/40 hover:bg-white/5 text-white font-semibold px-8 py-4 rounded-xl transition-all backdrop-blur-sm"
              >
                Watch demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <StatCard value="98%" label="Task completion" trend="+12% this month" />
              <StatCard value="4.5h" label="Time saved/week" trend="+23% avg" />
              <StatCard value="10k+" label="Active users" />
            </div>
          </div>

          {/* Right - Interactive Preview */}
          <div className={`${mounted ? "animate-slide-in-right" : "opacity-0"}`}>
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-8 shadow-2xl backdrop-blur-xl">
              {/* Controls */}
              <div className="space-y-6 mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Live Schedule Preview</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-white/60">Real-time</span>
                  </div>
                </div>

                {/* Time preference */}
                <div className="grid grid-cols-3 gap-2">
                  {(["morning", "afternoon", "evening"] as const).map((time) => (
                    <button
                      key={time}
                      onClick={() => setPreference(time)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        preference === time
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {time === "morning" ? "🌅" : time === "afternoon" ? "☀️" : "🌙"}{" "}
                      {time.charAt(0).toUpperCase() + time.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Sliders */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white/80">Intensity</label>
                      <span className="text-sm font-bold text-blue-400">{intensity}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={intensity}
                      onChange={(e) => setIntensity(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(79 70 229) ${intensity}%, rgba(255,255,255,0.1) ${intensity}%, rgba(255,255,255,0.1) 100%)`,
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white/80">Focus hours/day</label>
                      <span className="text-sm font-bold text-blue-400">{focusHours}h</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={8}
                      value={focusHours}
                      onChange={(e) => setFocusHours(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(79 70 229) ${
                          ((focusHours - 2) / 6) * 100
                        }%, rgba(255,255,255,0.1) ${((focusHours - 2) / 6) * 100}%, rgba(255,255,255,0.1) 100%)`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Preview */}
              <TimelineView tasks={schedule} />

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => router.push("/get-started")}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25"
                >
                  Create my schedule
                </button>
                <button className="px-4 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 transition-all">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-32">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-5xl font-bold">Built for productivity</h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Everything you need to manage time effectively and achieve your goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
                title: "AI-Powered Scheduling",
                description: "Intelligent algorithms optimize your day based on priorities, energy levels, and deadlines",
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
                title: "Calendar Integration",
                description: "Sync with Google Calendar, Outlook, and Apple Calendar in real-time",
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
                title: "Analytics & Insights",
                description: "Track productivity patterns and get personalized recommendations for improvement",
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
                title: "Smart Time Blocking",
                description: "Automatic break scheduling and focus session optimization based on science",
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
                title: "Team Collaboration",
                description: "Share schedules, coordinate meetings, and stay aligned with your team",
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
                title: "Smart Notifications",
                description: "Context-aware reminders that help you stay on track without overwhelming you",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-8 hover:border-white/20 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {feature.icon}
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-32">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-5xl font-bold">Get started in minutes</h2>
            <p className="text-xl text-white/60">Three simple steps to transform your productivity</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

            {[
              { step: "01", title: "Connect your calendar", desc: "Link your existing calendar or start fresh. Aurora syncs with all major platforms.", icon: "📅" },
              { step: "02", title: "Add your tasks", desc: "Import to-dos or create new ones. Set priorities, deadlines, and time estimates.", icon: "✍️" },
              { step: "03", title: "Let AI optimize", desc: "Aurora analyzes your schedule and creates an optimized plan that actually works.", icon: "⚡" },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="relative rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-8 hover:border-white/20 transition-all">
                  <div className="absolute -top-6 left-8 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 border-4 border-black flex items-center justify-center text-sm font-bold shadow-lg">
                    {item.step}
                  </div>
                  <div className="text-5xl mb-6 pt-4">{item.icon}</div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-white/60 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-32">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-5xl font-bold">Choose your plan</h2>
            <p className="text-xl text-white/60">Start free, upgrade as you grow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                features: ["Up to 20 tasks", "Basic scheduling", "Calendar export", "Mobile app"],
                cta: "Get started",
                popular: false,
              },
              {
                name: "Pro",
                price: "$12",
                period: "/month",
                features: ["Unlimited tasks", "AI scheduling", "All integrations", "Analytics", "Priority support", "Team features"],
                cta: "Start free trial",
                popular: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                features: ["Everything in Pro", "Custom integrations", "Dedicated support", "SSO & security", "Team training"],
                cta: "Contact sales",
                popular: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? "bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border-2 border-blue-500/50 shadow-xl shadow-blue-500/20"
                    : "bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold shadow-lg">
                    MOST POPULAR
                  </div>
                )}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      <span className="text-white/60">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-white/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                 <button
  onClick={() => {
    if (plan.name === "Pro") {
      router.push("/pricing?plan=pro");
    } else {
      router.push("/pricing?plan=free");
    }
  }}
  className={`w-full py-3 rounded-xl font-semibold transition-all ${
    plan.popular
      ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
      : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
  }`}
>
  {plan.cta}
</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-32">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-16 text-center">
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-5xl font-bold text-white">Ready to transform your productivity?</h2>
              <p className="text-xl text-white/90">Join thousands who've taken control of their time with Aurora</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push("/get-started")}
                  className="bg-white text-blue-600 font-bold px-10 py-4 rounded-xl hover:bg-white/90 transition-all shadow-xl"
                >
                  Start free trial
                </button>
                <button className="bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white font-bold px-10 py-4 rounded-xl transition-all">
                  Schedule demo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 border-t border-white/10">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-bold">Aurora</span>
              </div>
              <p className="text-sm text-white/60">AI-powered scheduling for ambitious people</p>
            </div>

            {[
              { title: "Product", links: ["Features", "Pricing", "Integrations", "Changelog"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Resources", links: ["Documentation", "Help Center", "Community", "API"] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
            <div>© {new Date().getFullYear()} Aurora. All rights reserved.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </footer>
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out;
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(to right, rgb(59 130 246), rgb(79 70 229));
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
}