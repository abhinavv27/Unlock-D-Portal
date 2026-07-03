'use client'

import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import SponsorMarquee from '@/components/SponsorMarquee'
import SplineRobot from '@/components/SplineRobot'
import { api } from '@/trpc/react'
import { 
  BookOpen, 
  Video, 
  ExternalLink, 
  Copy, 
  Check, 
  GitFork, 
  ArrowRight, 
  ShieldAlert, 
  Info
} from 'lucide-react'

export default function ResourcesPage() {
  const { data: session } = api.auth.getSession.useQuery()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'setup' | 'docker' | 'tech' | 'setup-video' | 'submission' | 'video'>('overview')
  const [copiedText, setCopiedText] = useState<string | null>(null)
  
  const { scrollYProgress } = useScroll()
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(id)
    setTimeout(() => setCopiedText(null), 2000)
  }

  if (!mounted) return null

  const CopyButton = ({ text, id }: { text: string; id: string }) => {
    const isCopied = copiedText === id
    return (
      <button
        onClick={() => handleCopy(text, id)}
        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono border border-white/10 cursor-pointer"
        title="Copy to clipboard"
      >
        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
      </button>
    )
  }

  const tabs = [
    { id: 'overview', label: '🎯 Overview', desc: 'Challenge and event info' },
    { id: 'setup', label: '🛠️ Fork & Clone', desc: 'Set up local repo' },
    { id: 'docker', label: '🐳 Docker Setup', desc: 'Container configuration' },
    { id: 'tech', label: '💻 Tech Stack', desc: 'Frontend, backend, databases' },
    { id: 'setup-video', label: '📹 First-time Setup', desc: 'Watch environment setup walkthrough' },
    { id: 'submission', label: '📤 Submissions', desc: 'PR process & local judging' },
    { id: 'video', label: '📹 Submission Video', desc: 'Watch step-by-step walkthrough' }
  ] as const

  return (
    <main className="min-h-screen bg-[oklch(var(--background))] selection:bg-primary selection:text-white overflow-x-hidden relative font-sans text-white">
      <motion.div
        style={{ y: backgroundY }}
        className="fixed inset-0 pointer-events-none z-0"
      >
        <div className="mesh-gradient !opacity-25">
          <div className="mesh-blob w-[1200px] h-[1200px] bg-primary top-[-10%] left-[-10%]" />
          <div className="mesh-blob w-[1000px] h-[1000px] bg-primary/40 bottom-[-10%] right-[-10%]" />
        </div>
        <div className="absolute inset-0 neural-grid opacity-[0.03]" />
        <SplineRobot />
      </motion.div>

      <Navbar session={session as any} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-24 relative z-10 space-y-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full glass-premium rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[60px] pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-mono tracking-widest border border-primary/20 uppercase">
                ⚡ Starter Manual
              </span>
              <h1 className="text-3xl md:text-5xl font-display font-black leading-tight text-white uppercase tracking-tight">
                Starter <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">Manual & Resources</span>
              </h1>
              <p className="text-sm md:text-base text-white/60 max-w-2xl leading-relaxed">
                Official documentation and walkthrough guides for environment setup, container configuration, local debugging, and task submission.
              </p>
            </div>
            {session?.user && (
              <div className="flex flex-wrap gap-3 self-start md:self-center">
                <Link
                  href="/dashboard"
                  className="btn-vibrant !py-3 !px-6 text-xs font-semibold rounded-xl flex items-center gap-2 group cursor-pointer"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-300" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Setup Manual Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-4 space-y-4"
          >
            <div className="glass-premium rounded-3xl p-4 border border-white/5 space-y-2 text-left">
              <h3 className="px-3 pt-2 pb-4 text-xs font-semibold uppercase tracking-wider text-white/40 border-b border-white/5 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Starter Manual Chapters
              </h3>
              <div className="space-y-1">
                {tabs.map((tab) => {
                  const isSelected = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full text-left px-3 py-3 rounded-2xl transition-all duration-300 flex items-center justify-between border cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 border-primary/20 text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]'
                          : 'border-transparent text-white/60 hover:text-white hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="font-semibold text-sm leading-none">{tab.label}</span>
                        <p className="text-[10px] text-white/40 leading-none mt-1">{tab.desc}</p>
                      </div>
                      <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${
                        isSelected ? 'transform translate-x-1 text-primary' : 'opacity-0'
                      }`} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick Links / Resources */}
            <div className="glass-premium rounded-3xl p-6 border border-white/5 space-y-4 text-left">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40">Quick Links</h4>
              <div className="space-y-3">
                <a
                  href="https://github.com/ad1tyq/UnlockD-Master-Repo"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all text-xs group"
                >
                  <span className="flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-primary" /> Master Repository
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
                </a>
                <a
                  href="https://drive.google.com/file/d/1TJRhg2qGZNQ7cKA05FJx5TqEsyIQC3_o/view?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all text-xs group"
                >
                  <span className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-violet-400" /> First-time setup
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
                </a>
                <a
                  href="https://drive.google.com/file/d/1LftP8NmepTI_3p2EvS88-ivtz7dNEAbh/view?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all text-xs group"
                >
                  <span className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-violet-400" /> Submission Guide Video
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Active Content Detail Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-8 text-left"
          >
            <div className="glass-premium rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl min-h-[500px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] pointer-events-none" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* TAB: OVERVIEW */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="space-y-2 border-b border-white/5 pb-4">
                        <h2 className="text-2xl md:text-3xl font-display font-bold">🎯 Challenge & Event Flow</h2>
                        <p className="text-white/60 text-sm">Unlock'D Build-a-thon: Official Master Repository</p>
                      </div>

                      <div className="space-y-4 text-sm leading-relaxed text-white/80">
                        <p>
                          Welcome to Unlock'D, the 24-hour progressive build-a-thon! This repository contains your initial starter code. This guide will walk you through the entire event flow, how to set up your environment, and how to submit your work for judging.
                        </p>

                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                          <h4 className="font-semibold text-white flex items-center gap-2 text-base">
                            🎯 The Challenge: A Personal Finance Application
                          </h4>
                          <p className="text-xs text-white/60 leading-relaxed">
                            You will be building a comprehensive personal finance and expense management application.
                          </p>
                          <ul className="text-xs text-white/50 space-y-2 list-disc pl-4 mt-2">
                            <li>
                              <strong>Creative Freedom:</strong> You have full control over the branding, the name of your product, and the UI/UX design. Get creative!
                            </li>
                            <li>
                              <strong>Secret Features:</strong> The features and their functionality will be revealed in Round 1, and you will unlock the next feature as soon as you submit one. The roadmap is progressive, with new features being revealed as you successfully pass each judging gate.
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-3 pt-2">
                          <h4 className="text-base font-semibold text-white flex items-center gap-2">
                            🏆 1. The Event Workflow
                          </h4>
                          <p className="text-xs text-white/60">
                            Unlock'D is a unique 24-hour progressive build-a-thon. You will work in teams, receiving a secret product roadmap and starter code.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                              <strong className="text-xs text-white">Progressive Gates</strong>
                              <p className="text-[11px] text-white/40">You must complete timed development sprints.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                              <strong className="text-xs text-white">Deployment & Validation</strong>
                              <p className="text-[11px] text-white/40">Package code and clear a "live judging gate" to unlock the next round.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                              <strong className="text-xs text-white">Discord Only</strong>
                              <p className="text-[11px] text-white/40">All updates, guidelines, and announcements happen on Discord.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: SETUP */}
                  {activeTab === 'setup' && (
                    <div className="space-y-6">
                      <div className="space-y-2 border-b border-white/5 pb-4">
                        <h2 className="text-2xl md:text-3xl font-display font-bold">🛠️ Installation & Setup (Fork & Clone)</h2>
                        <p className="text-white/60 text-sm">Follow these steps to establish your team's code repository.</p>
                      </div>

                      <div className="space-y-6 text-sm">
                        <p className="text-white/70 leading-relaxed">
                          To keep the main repository pristine and track your team's progress securely, we are using a Fork-and-Pull Request workflow.
                        </p>

                        <div className="space-y-4">
                          {/* Step 1 */}
                          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-mono text-xs font-bold">1</span>
                              <h4 className="font-semibold text-white">Fork the Repository</h4>
                            </div>
                            <p className="text-xs text-white/50 pl-8 leading-relaxed">
                              Navigate to the main UnlockD Master Repository on GitHub and click the <strong>Fork</strong> button in the top right corner. This creates a copy under your account.
                            </p>
                            <div className="pl-8">
                              <a
                                href="https://github.com/ad1tyq/UnlockD-Master-Repo"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-primary/20 hover:bg-primary/5 transition-all text-xs font-semibold text-white group"
                              >
                                <GitFork className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                Fork from ad1tyq/UnlockD-Master-Repo
                                <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                              </a>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-mono text-xs font-bold">2</span>
                              <h4 className="font-semibold text-white">Clone Your Fork</h4>
                            </div>
                            <p className="text-xs text-white/50 pl-8 leading-relaxed">
                              Open your terminal and clone your newly created fork onto your local machine:
                            </p>
                            <div className="pl-8 space-y-2">
                              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-white/95">
                                <span className="overflow-x-auto whitespace-pre pr-4">
                                  git clone https://github.com/YOUR_GITHUB_USERNAME/UnlockD-Master-Repo.git{"\n"}
                                  cd UnlockD-Master-Repo
                                </span>
                                <CopyButton text="git clone https://github.com/YOUR_GITHUB_USERNAME/UnlockD-Master-Repo.git&#10;cd UnlockD-Master-Repo" id="setup-clone" />
                              </div>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-mono text-xs font-bold">3</span>
                              <h4 className="font-semibold text-white">Configure Upstream</h4>
                            </div>
                            <p className="text-xs text-white/50 pl-8 leading-relaxed">
                              Configure the upstream remote to sync any framework hotfixes pushed by organizers:
                            </p>
                            <div className="pl-8">
                              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-white/95">
                                <span className="overflow-x-auto whitespace-pre pr-4">
                                  git remote add upstream https://github.com/ad1tyq/UnlockD-Master-Repo.git
                                </span>
                                <CopyButton text="git remote add upstream https://github.com/ad1tyq/UnlockD-Master-Repo.git" id="setup-upstream" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: DOCKER */}
                  {activeTab === 'docker' && (
                    <div className="space-y-6">
                      <div className="space-y-2 border-b border-white/5 pb-4">
                        <h2 className="text-2xl md:text-3xl font-display font-bold">🐳 Mandatory Docker Setup (Crucial)</h2>
                        <p className="text-white/60 text-sm">Your application must run inside Docker to be graded.</p>
                      </div>

                      <div className="space-y-5 text-sm">
                        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex gap-4">
                          <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <strong className="text-rose-300">The Dockerfile Rule:</strong>
                            <p className="text-xs text-white/60 leading-relaxed">
                              To ensure judges can run your application locally without dependency errors, your submission MUST be fully Dockerized. If a judge cannot build/run your containers, your submission automatically fails!
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-white/80">
                          <h4 className="font-semibold text-white">How the project is currently Dockerized:</h4>
                          <p className="text-xs text-white/50">We have provided a boilerplate Docker setup for you:</p>
                          <ul className="text-xs text-white/50 space-y-2 list-disc pl-4 leading-relaxed">
                            <li>
                              <strong>Root docker-compose.yml:</strong> Orchestrates the frontend, backend, and any databases you choose to add.
                            </li>
                            <li>
                              <strong>frontend/Dockerfile:</strong> Already configured to serve your Vite React app on port 5173.
                            </li>
                            <li>
                              <strong>backend/Dockerfile:</strong> A placeholder. You must update this file with instructions for whatever backend stack you build with.
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-3 pt-2">
                          <h4 className="font-semibold text-white">How to Run the Product:</h4>
                          <p className="text-xs text-white/60">
                            To spin up the entire application (both frontend and backend), open your terminal in the root directory and run:
                          </p>
                          <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-white/95">
                            <span className="overflow-x-auto whitespace-pre pr-4">
                              docker-compose up -d --build
                            </span>
                            <CopyButton text="docker-compose up -d --build" id="docker-up" />
                          </div>
                          <p className="text-xs text-white/50">
                            This command builds the images and runs containers in detached mode. You can view your frontend in your browser at{' '}
                            <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold font-mono">
                              http://localhost:5173
                            </a>.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: TECH */}
                  {activeTab === 'tech' && (
                    <div className="space-y-6">
                      <div className="space-y-2 border-b border-white/5 pb-4">
                        <h2 className="text-2xl md:text-3xl font-display font-bold">💻 Tech Stack Freedom & Backend</h2>
                        <p className="text-white/60 text-sm">Flexible backend & databases coupled with static frontend boilerplate.</p>
                      </div>

                      <div className="space-y-4 text-sm leading-relaxed">
                        <ul className="space-y-3 list-none pl-0">
                          <li className="p-4 rounded-xl bg-white/[0.01] border border-white/5">
                            <strong className="text-white block text-sm">Frontend</strong>
                            <span className="text-xs text-white/50">Provided as a React + TypeScript + Vite application.</span>
                          </li>
                          <li className="p-4 rounded-xl bg-white/[0.01] border border-white/5">
                            <strong className="text-white block text-sm">Backend Stack Choice</strong>
                            <span className="text-xs text-white/50">You have COMPLETE FREEDOM to use any backend language or framework. Whether you prefer Node.js, Python (FastAPI/Flask), Go, Java, or anything else—it is entirely up to you.</span>
                          </li>
                          <li className="p-4 rounded-xl bg-white/[0.01] border border-white/5">
                            <strong className="text-white block text-sm">Databases & Caching</strong>
                            <span className="text-xs text-white/50">You can also add any database you prefer (PostgreSQL, MongoDB, MySQL, Redis, etc.) by defining it in the provided docker-compose.yml.</span>
                          </li>
                        </ul>

                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                          <strong className="text-xs text-white flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-primary" /> Crucial Docker Rule for Integrations:
                          </strong>
                          <p className="text-xs text-white/60 leading-relaxed">
                            If your integration requires a local service (like a database or Redis cache), you must not run it separately. Instead, add it as an additional service in the provided <code className="bg-black/30 px-1 py-0.5 rounded text-white">docker-compose.yml</code> file. We have left commented-out examples in the docker-compose.yml file to show you exactly how to do this.
                          </p>
                        </div>

                        <div className="space-y-2 pt-2">
                          <h4 className="font-semibold text-white">🚀 Integrations & Bonus Features</h4>
                          <p className="text-xs text-white/50 leading-relaxed">
                            We encourage you to go above and beyond the baseline requirements! As long as you successfully complete the core sprint tasks, you have complete freedom to integrate extra features to "wow" the judges, such as implementing WebSockets for real-time updates, Redis for caching, or AI/ML APIs (like OCR receipt scanning or LLMs for spending insights).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: SUBMISSION */}
                  {activeTab === 'submission' && (
                    <div className="space-y-6">
                      <div className="space-y-2 border-b border-white/5 pb-4">
                        <h2 className="text-2xl md:text-3xl font-display font-bold">📤 Submission & Judging Process</h2>
                        <p className="text-white/60 text-sm">Understand how sprint checkpoints are submitted and locally tested.</p>
                      </div>

                      <div className="space-y-4 text-sm">
                        <h3 className="font-semibold text-white">The PR Submission Workflow:</h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                          When you finish a sprint, you must submit a Pull Request (PR) to the main UnlockD repository.
                        </p>

                        <div className="space-y-3 font-mono text-xs pl-2">
                          <div>
                            <span className="text-white/40 block mb-1">Create a Feature Branch (never work directly on main):</span>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 text-white/95">
                              <span>git checkout -b feature/your-sprint-name</span>
                              <CopyButton text="git checkout -b feature/your-sprint-name" id="sub-branch" />
                            </div>
                          </div>

                          <div>
                            <span className="text-white/40 block mb-1">Commit your work:</span>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 text-white/95">
                              <span>git add . && git commit -m "feat: completed sprint 1"</span>
                              <CopyButton text="git add . && git commit -m &quot;feat: completed sprint 1&quot;" id="sub-commit" />
                            </div>
                          </div>

                          <div>
                            <span className="text-white/40 block mb-1">Push to your Fork:</span>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 text-white/95">
                              <span>git push origin feature/your-sprint-name</span>
                              <CopyButton text="git push origin feature/your-sprint-name" id="sub-push" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 leading-relaxed">
                          <h4 className="font-semibold text-white">Open a PR & Fill Template:</h4>
                          <p className="text-xs text-white/50">
                            Go to the main project repository on GitHub (<a href="https://github.com/ad1tyq/UnlockD-Master-Repo" target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">ad1tyq/UnlockD-Master-Repo</a>) and open a Pull Request comparing your feature branch against the main repo. You must fill out the provided PR template (Team Name, Features Added, Known Bugs). Incomplete PRs will not be judged.
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-2">
                          <strong className="text-xs text-white">Local Judging Process:</strong>
                          <ul className="text-xs text-white/50 list-disc pl-4 space-y-1.5 leading-relaxed">
                            <li><strong>No Cloud Deployment Required:</strong> You are not required to host your app on AWS, Heroku, or Vercel.</li>
                            <li><strong>Direct Verification:</strong> Judges will pull your PR locally, run <code className="bg-black/30 px-1 py-0.5 rounded text-white">docker-compose up --build</code>, and test your application directly on their machines.</li>
                            <li><strong>Standardized Ports:</strong> Ensure your application exposes its web server on the specified ports. Document any changes in the PR or README!</li>
                          </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs text-rose-300 leading-relaxed">
                          ⚠️ <strong>Brutally Honest Reminder:</strong> If your submission does not follow these technical guidelines, it will fail the automated "gate check," and your team will not unlock the next task. If you experience setup issues, contact organizers on Discord immediately!
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: FIRST TIME SETUP */}
                  {activeTab === 'setup-video' && (
                    <div className="space-y-6">
                      <div className="space-y-2 border-b border-white/5 pb-4">
                        <h2 className="text-2xl md:text-3xl font-display font-bold">📹 First-time Setup Video</h2>
                        <p className="text-white/60 text-sm">Watch the official first-time environment setup guide.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="relative w-full aspect-video rounded-2xl border border-white/10 bg-black/60 shadow-2xl overflow-hidden">
                          <iframe
                            src="https://drive.google.com/file/d/1TJRhg2qGZNQ7cKA05FJx5TqEsyIQC3_o/preview"
                            width="100%"
                            height="100%"
                            className="w-full h-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                          ></iframe>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-white text-sm">Can't load the player?</h4>
                            <p className="text-xs text-white/50">Watch or download the video directly via Google Drive.</p>
                          </div>
                          <a
                            href="https://drive.google.com/file/d/1TJRhg2qGZNQ7cKA05FJx5TqEsyIQC3_o/view?usp=sharing"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-all text-xs font-semibold text-violet-300 cursor-pointer"
                          >
                            <Video className="w-4 h-4" />
                            Watch on Google Drive
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: VIDEO */}
                  {activeTab === 'video' && (
                    <div className="space-y-6">
                      <div className="space-y-2 border-b border-white/5 pb-4">
                        <h2 className="text-2xl md:text-3xl font-display font-bold">📹 Video Submission Guide</h2>
                        <p className="text-white/60 text-sm">Watch the official step-by-step submission workflow guide.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="relative w-full aspect-video rounded-2xl border border-white/10 bg-black/60 shadow-2xl overflow-hidden">
                          <iframe
                            src="https://drive.google.com/file/d/1LftP8NmepTI_3p2EvS88-ivtz7dNEAbh/preview"
                            width="100%"
                            height="100%"
                            className="w-full h-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                          ></iframe>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-white text-sm">Can't load the player?</h4>
                            <p className="text-xs text-white/50">Watch or download the video directly via Google Drive.</p>
                          </div>
                          <a
                            href="https://drive.google.com/file/d/1LftP8NmepTI_3p2EvS88-ivtz7dNEAbh/view?usp=sharing"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-all text-xs font-semibold text-violet-300 cursor-pointer"
                          >
                            <Video className="w-4 h-4" />
                            Watch on Google Drive
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <SponsorMarquee />
      </div>
    </main>
  )
}
