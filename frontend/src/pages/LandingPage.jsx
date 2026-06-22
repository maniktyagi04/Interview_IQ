import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Code2, BarChart3, FileText, BookOpen, Star, ArrowRight, CheckCircle, Zap, Shield } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI-Powered Evaluation', desc: 'Get instant, intelligent scoring on technical accuracy, communication, and completeness.', color: 'from-violet-500 to-purple-600' },
  { icon: Code2, title: '5 Tech Domains', desc: 'Practice Frontend, Backend, Full Stack, AI/ML, and Data Science questions curated by experts.', color: 'from-blue-500 to-cyan-600' },
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Visualize your progress, identify weak areas, and track monthly performance trends.', color: 'from-emerald-500 to-teal-600' },
  { icon: FileText, title: 'Resume Analyzer', desc: 'Upload your resume and get AI-powered alignment scores against target roles instantly.', color: 'from-orange-500 to-amber-600' },
  { icon: BookOpen, title: 'Smart Notes', desc: 'Capture interview insights with a searchable notes workspace designed for quick recall.', color: 'from-pink-500 to-rose-600' },
  { icon: Shield, title: 'Admin Review Flow', desc: 'Every AI-generated report is validated by a human admin before reaching you for quality assurance.', color: 'from-indigo-500 to-violet-600' },
];

const stats = [
  { value: '45+', label: 'Expert Questions' },
  { value: '5', label: 'Tech Domains' },
  { value: '3', label: 'Difficulty Levels' },
  { value: '100%', label: 'AI Evaluated' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white overflow-x-hidden">
      {/* Gradient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-cyan-600/10 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold font-display tracking-tight">InterviewIQ</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 text-center pt-24 pb-20 px-6 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-8">
          <Zap className="w-3.5 h-3.5" />
          <span>Powered by OpenAI GPT-4o</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          Ace Every Tech<br />Interview with AI
        </h1>

        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Practice mock interviews, get AI-evaluated feedback, analyze your resume, and track your growth — all in one platform built for aspiring developers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            id="hero-cta-register"
            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl font-semibold text-white hover:opacity-90 transition-all shadow-lg shadow-violet-500/25"
          >
            Start Practicing Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            id="hero-cta-login"
            className="flex items-center gap-2 px-8 py-3.5 bg-white/5 border border-white/10 rounded-xl font-semibold text-white hover:bg-white/10 transition-all"
          >
            Sign In
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-2xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-blue-400">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Everything you need to prepare</h2>
          <p className="text-slate-400 max-w-xl mx-auto">A complete preparation ecosystem — from practicing subjective questions to getting AI feedback on your resume.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl bg-white/3 border border-white/6 hover:border-white/12 hover:bg-white/5 transition-all group"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">How InterviewIQ Works</h2>
        </div>
        <div className="space-y-6">
          {[
            { step: '01', title: 'Choose Domain & Difficulty', desc: 'Select from 5 technology domains and 3 difficulty levels to generate your custom mock interview.' },
            { step: '02', title: 'Answer Subjective Questions', desc: 'Write detailed answers to 5 expert questions. Think through your responses — quality matters.' },
            { step: '03', title: 'AI Evaluates Your Answers', desc: 'OpenAI GPT-4o scores each answer on technical accuracy, communication quality, and completeness.' },
            { step: '04', title: 'Admin Validates Report', desc: 'A human admin reviews the AI-generated report for quality, adds feedback, and approves it.' },
            { step: '05', title: 'Access Detailed Report', desc: 'View your approved report with scores, strengths, weaknesses, and actionable improvement suggestions.' },
          ].map((item) => (
            <div key={item.step} className="flex gap-6 items-start p-5 rounded-2xl bg-white/3 border border-white/6 hover:border-white/10 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-sm font-bold shrink-0">{item.step}</div>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20">
          <Star className="w-10 h-10 text-violet-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold font-display mb-4">Ready to level up your interview game?</h2>
          <p className="text-slate-400 mb-8">Join and start practicing today. No credit card required.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/25"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-slate-600 text-sm border-t border-white/5">
        <p>© 2025 InterviewIQ — Built as a portfolio-grade full-stack project</p>
      </footer>
    </div>
  );
}
