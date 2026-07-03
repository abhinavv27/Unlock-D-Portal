'use client'

import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import SponsorMarquee from '@/components/SponsorMarquee'
import SplineRobot from '@/components/SplineRobot'
import { api } from '@/trpc/react'
import MentorTeamPanel from '@/components/MentorTeamPanel'
import { 
  Terminal, 
  BookOpen, 
  Layers, 
  Settings, 
  Play, 
  CheckCircle2, 
  Video, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  GitFork, 
  GitPullRequest, 
  ArrowRight, 
  ShieldAlert, 
  Cpu,
  Info,
  RefreshCw,
  LogOut,
  Sparkles
} from 'lucide-react'

function getFeatureLabel(taskId: string): string {
  if (!taskId) return ''
  if (taskId === 'FINAL-FEATURE') return 'Final Feature'
  if (taskId.startsWith('FEATURE-')) return `Feature ${taskId.split('-')[1]}`
  if (taskId.startsWith('ROUND-')) return `Round ${taskId.split('-')[1]}`
  return taskId
}

interface ParsedFeedbackItem {
  header?: string
  body: string
}

function parseFeedbackText(text: string): ParsedFeedbackItem[] {
  if (!text) return []
  
  const pipeBlocks = text.split('|').map(b => b.trim()).filter(Boolean)
  const items: ParsedFeedbackItem[] = []
  
  for (const block of pipeBlocks) {
    const regex = /([A-Z][a-zA-Z0-9\s&()\-']{2,60}):/g
    let match
    const matches: { header: string; index: number; length: number }[] = []
    
    while ((match = regex.exec(block)) !== null) {
      const matchedHeader = match[1]
      const matchIndex = match.index
      const isUrl = block.slice(matchIndex, matchIndex + 20).includes('://')
      if (!isUrl) {
        matches.push({
          header: matchedHeader.trim(),
          index: matchIndex,
          length: match[0].length
        })
      }
    }
    
    if (matches.length === 0) {
      items.push({ body: block })
    } else {
      if (matches[0].index > 0) {
        const leadText = block.slice(0, matches[0].index).trim()
        if (leadText) {
          items.push({ body: leadText })
        }
      }
      
      for (let i = 0; i < matches.length; i++) {
        const current = matches[i]
        const next = matches[i + 1]
        const startPos = current.index + current.length
        const endPos = next ? next.index : block.length
        const bodyText = block.slice(startPos, endPos).trim()
        items.push({
          header: current.header,
          body: bodyText
        })
      }
    }
  }
  
  return items
}

function renderFeedbackList(feedbackText: string, theme: 'default' | 'rose' = 'default') {
  if (!feedbackText) return null
  
  const items = parseFeedbackText(feedbackText)
  
  return (
    <div className="space-y-3 mt-2">
      {items.map((item, index) => {
        if (item.header) {
          return (
            <div 
              key={index} 
              className={`p-4 rounded-xl border transition-all text-left space-y-1.5 ${
                theme === 'rose' 
                  ? 'bg-rose-500/[0.02] border-rose-500/10 hover:border-rose-500/20' 
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${theme === 'rose' ? 'bg-rose-400' : 'bg-primary'}`} />
                <h5 className={`text-[10px] md:text-xs font-bold uppercase tracking-wider font-display ${theme === 'rose' ? 'text-rose-300' : 'text-white'}`}>
                  {item.header}
                </h5>
              </div>
              <p className={`text-xs leading-relaxed pl-3.5 ${theme === 'rose' ? 'text-rose-200/70' : 'text-white/60'}`}>
                {item.body}
              </p>
            </div>
          )
        }
        
        return (
          <div 
            key={index} 
            className={`p-4 rounded-xl border transition-all text-left relative overflow-hidden ${
              theme === 'rose'
                ? 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/25'
                : 'bg-violet-500/5 border-violet-500/10 hover:border-violet-500/20'
            }`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 blur-xl pointer-events-none ${theme === 'rose' ? 'bg-rose-500/[0.02]' : 'bg-violet-500/[0.02]'}`} />
            <p className={`text-xs leading-relaxed italic pl-2 border-l ${
              theme === 'rose' 
                ? 'text-rose-300 border-rose-500/30' 
                : 'text-violet-300 border-violet-500/30'
            }`}>
              &ldquo;{item.body}&rdquo;
            </p>
          </div>
        )
      })}
    </div>
  )
}

interface DashboardClientProps {
  session: {
    user: {
      name?: string | null
      image?: string | null
      id?: string | null
    }
  }
  status: string
  team?: any
  staff?: any
}

export default function DashboardClient({ session, status, team, staff }: DashboardClientProps) {
  const submitMutation = api.teams.submit.useMutation()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'setup' | 'setup-video' | 'docker' | 'tech' | 'submission' | 'video'>('overview')
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(id)
    setTimeout(() => setCopiedText(null), 2000)
  }
  const { scrollYProgress } = useScroll()
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"])
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Submission form states
  const [githubUrl, setGithubUrl] = useState('')
  const [liveDemoUrl, setLiveDemoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)



  // Round 3 states
  const [r3Entering, setR3Entering] = useState(false)
  const [r3EntryError, setR3EntryError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Poll for Round 3 demo call updates every 5 minutes
  useEffect(() => {
    if (!team) return
    const isR3 = team.allowedTaskId === 'ROUND-3' || team.submissions?.some((s: any) => s.taskId === 'ROUND-3')
    if (!isR3) return
    const hasR3Submission = team.submissions?.some((s: any) => s.taskId === 'ROUND-3')
    if (!hasR3Submission) return
    // Only poll when waiting for a call or during an active call
    if (team.demoCall?.status === 'COMPLETED') return

    const interval = setInterval(() => {
      window.location.reload()
    }, 300000)

    return () => clearInterval(interval)
  }, [team])

  // Auto-refresh dashboard data every 30s + on tab focus / reconnect
  const refreshDashboard = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    const interval = setInterval(refreshDashboard, 30000)

    const onVisible = () => { if (document.visibilityState === 'visible') refreshDashboard() }
    const onOnline = () => refreshDashboard()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
  }, [refreshDashboard])

  // Resolve config objects based on authentication status role
  let config = {
    label: status,
    color: 'text-primary/80', 
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    message: 'Welcome to your event workspace nexus.'
  }

  if (status.startsWith('STAGE ')) {
    let label = status
    if (status === 'STAGE 1') {
      const taskSuffix = team?.allowedTaskId ? ` - ${team.allowedTaskId.replace('-', ' ')}` : ''
      label = `ROUND 1${taskSuffix}`
    } else if (team?.allowedTaskId && team.allowedTaskId.startsWith('ROUND-')) {
      label = team.allowedTaskId.replace('-', ' ')
    }

    config = {
      label,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
      message: 'Deliver your payload below to advance to the next round of the challenge.'
    }
  } else if (status === 'ADMIN') {
    config = {
      label: 'Admin Control',
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
      border: 'border-indigo-400/20',
      message: 'You have full administration access over the portal database, registrations and grading pipeline.'
    }
  } else if (status === 'JUDGE') {
    config = {
      label: 'Judging Arena',
      color: 'text-teal-400',
      bg: 'bg-teal-400/10',
      border: 'border-teal-400/20',
      message: 'Access the global submission queue to grade hackathon submissions.'
    }
  }

  const handleWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!githubUrl.trim()) {
      setSubmitError('GitHub Commit Submission Link is mandatory.')
      return
    }

    if (!liveDemoUrl.trim()) {
      setSubmitError('Drive Video Link is mandatory.')
      return
    }

    if (description.trim() && description.trim().length < 20) {
      setSubmitError('Description must be at least 20 characters.')
      return
    }

    setLoading(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      await submitMutation.mutateAsync({
        githubUrl: githubUrl.trim(),
        liveDemoUrl: liveDemoUrl.trim(),
        description: description.trim(),
      })

      setSubmitSuccess(true)
      setGithubUrl('')
      setLiveDemoUrl('')
      setDescription('')

      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }





  const handleLogout = () => {
    localStorage.removeItem('team_token')
    localStorage.removeItem('staff_token')
    window.location.href = '/api/auth/logout'
  }

  if (!mounted) return null

  // Check if team has an active pending submission for the current active task
  const hasPending = team?.submissions?.some((sub: any) => sub.status === 'PENDING' && sub.taskId === team.allowedTaskId)

  // Extract stage data from event config for roadmap
  const stages: { stage: number; name: string; pointsRequired: number }[] = team?.event?.config?.stages || []
  const currentStageNum: number = team?.progressState?.current_stage !== undefined ? team.progressState.current_stage : 0
  const currentStage = stages.find(s => s.stage === currentStageNum) || null

  // Find the most recent rejected submission for resubmit prompt
  const lastRejected = team?.submissions?.find((sub: any) => sub.status === 'REJECTED')

  // Round 0: event hasn't started yet — show a simple landing page
  if (team?.eventRound === 0) {
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
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-mono tracking-widest border border-primary/20 uppercase animate-pulse">
                  ⚡ Round 0 — Stand By
                </span>
                <h1 className="text-3xl md:text-5xl font-display font-black leading-tight text-white uppercase tracking-tight">
                  Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">{team.teamName}</span>
                </h1>
                <p className="text-sm md:text-base text-white/60 max-w-2xl leading-relaxed">
                  You are successfully checked in. Round 1 has not started yet. Please use this setup guide to initialize your environment and prepare your build.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 self-start md:self-center">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-vibrant !py-3 !px-6 text-xs font-semibold rounded-xl flex items-center gap-2 group cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" />
                  Refresh Status
                </button>
                <button
                  onClick={handleLogout}
                  className="btn-ghost !py-3 !px-6 text-xs font-semibold rounded-xl border-white/10 hover:border-white/20 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/50 flex items-center gap-3 text-left">
              <Info className="w-5 h-5 text-primary flex-shrink-0" />
              <span>
                <strong>System Notice:</strong> Submissions open when the administrator advances the global round to Round 1. Keep this page open or refresh status to proceed.
              </span>
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

  // Round 3: Final Demo & Evaluation landing page
  if (!team?.isEliminated && (team?.allowedTaskId === 'ROUND-3' || team?.submissions?.some((s: any) => s.taskId === 'ROUND-3'))) {
    const hasR3Submission = team.submissions?.some((s: any) => s.taskId === 'ROUND-3')
    const demoCall = team.demoCall

    const handleEnterRound3 = async () => {
      setR3Entering(true)
      setR3EntryError(null)
      try {
        await submitMutation.mutateAsync({
          githubUrl: '',
          liveDemoUrl: '',
          description: 'Round 3 — Final Demonstration entry',
        })
        setTimeout(() => window.location.reload(), 1000)
      } catch (err: any) {
        setR3EntryError(err.message || 'Failed to enter Round 3.')
        setR3Entering(false)
      }
    }

    return (
      <main className="min-h-screen bg-[oklch(var(--background))] selection:bg-primary selection:text-white overflow-x-hidden relative font-sans text-white">
        <motion.div
          style={{ y: backgroundY }}
          className="fixed inset-0 pointer-events-none z-0"
        >
          <div className="mesh-gradient !opacity-25">
            <div className="mesh-blob w-[1200px] h-[1200px] bg-violet-600 top-[-10%] left-[-10%]" />
            <div className="mesh-blob w-[1000px] h-[1000px] bg-primary/40 bottom-[-10%] right-[-10%]" />
          </div>
          <div className="absolute inset-0 neural-grid opacity-[0.03]" />
          <SplineRobot />
        </motion.div>

        <Navbar session={session as any} />

        <div className="max-w-4xl mx-auto px-4 md:px-8 pt-32 md:pt-48 pb-16 relative z-10 flex flex-col items-center justify-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as any }}
            className="w-full glass-premium rounded-3xl md:rounded-[2.5rem] p-8 md:p-14 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] text-center relative overflow-hidden space-y-8"
          >
            {/* Ambient glows */}
            <div className="absolute -top-24 -left-24 w-56 h-56 bg-violet-500/30 blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-primary/20 blur-[100px] pointer-events-none" />

            <div className="flex flex-col items-center gap-4 relative z-10">
              <span className="px-4 py-1.5 rounded-full bg-violet-500/10 text-violet-300 text-[10px] font-mono tracking-widest border border-violet-500/20 uppercase animate-pulse">
                🎤 Round 3 — Final Demonstration
              </span>
              <h1 className="text-5xl md:text-7xl font-display font-black leading-tight text-white uppercase tracking-tight">
                Welcome to<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-primary to-fuchsia-400">
                  Round 3.
                </span>
              </h1>
              <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
                {hasR3Submission
                  ? `You're queued for your final demo, ${team.teamName}. A judge will call your team with a meeting link when it's your turn.`
                  : `Congratulations on reaching the finals, ${team.teamName}! Enter Round 3 to join the presentation queue and wait for a judge to call you.`
                }
              </p>
            </div>

            {/* NOT YET ENTERED — Show Enter Button */}
            {!hasR3Submission && (
              <div className="space-y-4 relative z-10">
                {r3EntryError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs max-w-md mx-auto">
                    {r3EntryError}
                  </div>
                )}
                <button
                  onClick={handleEnterRound3}
                  disabled={r3Entering}
                  className="px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-primary text-white text-sm font-black uppercase tracking-wider shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {r3Entering ? '⏳ Entering...' : '🚀 Enter Round 3'}
                </button>
                <p className="text-[10px] text-white/30 font-mono">
                  This will add your team to the presentation queue
                </p>
              </div>
            )}

            {/* ENTERED — Show Call Status */}
            {hasR3Submission && (
              <div className="space-y-6 relative z-10">
                {/* Demo Call Status Card */}
                {!demoCall || demoCall.status === 'QUEUED' ? (
                  /* Waiting for judge to call */
                  <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 max-w-lg mx-auto space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
                      <span className="text-sm font-bold text-amber-400 uppercase tracking-wider">In Queue</span>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">
                      Your team is in the presentation queue. A judge will send you a meeting link when it&apos;s your turn. This page updates automatically.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-white/20 font-mono">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                        className="w-3 h-3 border border-white/20 border-t-primary rounded-full"
                      />
                      <span>Auto-refreshing...</span>
                    </div>
                  </div>
                ) : demoCall.status === 'CALLED' ? (
                  /* Judge has called — Show meeting link */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/30 max-w-lg mx-auto space-y-5 shadow-[0_0_60px_-10px_rgba(52,211,153,0.15)]"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                      <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">You&apos;re Being Called!</span>
                    </div>
                    <p className="text-xs text-white/50">
                      Judge <strong className="text-white/80">{demoCall.judgeName}</strong> has called your team. Join the meeting now:
                    </p>
                    <a
                      href={demoCall.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-4 rounded-xl bg-emerald-500 text-black text-sm font-black uppercase tracking-wider text-center shadow-2xl shadow-emerald-500/30 hover:bg-emerald-400 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      🔗 Join Meeting Now
                    </a>
                    <p className="text-[10px] text-white/25 font-mono break-all">
                      {demoCall.meetingLink}
                    </p>
                    {demoCall.calledAt && (
                      <p className="text-[9px] text-white/20 font-mono">
                        Called at {new Date(demoCall.calledAt).toLocaleTimeString()}
                      </p>
                    )}
                  </motion.div>
                ) : (
                  /* Demo Completed */
                  <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 max-w-lg mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-3xl">
                      🏆
                    </div>
                    <h3 className="text-2xl font-display font-medium text-white">Demo Complete</h3>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Your final demonstration has been completed. Thank you for participating!
                    </p>
                    {demoCall.completedAt && (
                      <p className="text-[9px] text-white/20 font-mono">
                        Completed at {new Date(demoCall.completedAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[9px] text-white/30 font-mono uppercase block">Score</span>
                    <span className="text-2xl font-mono font-bold text-primary mt-1 block">
                      {team.progressState?.score || 0}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[9px] text-white/30 font-mono uppercase block">Status</span>
                    <span className={`text-xs font-bold mt-2 block uppercase tracking-wider ${
                      demoCall?.status === 'COMPLETED' ? 'text-emerald-400'
                      : demoCall?.status === 'CALLED' ? 'text-emerald-400'
                      : 'text-amber-400'
                    }`}>
                      {demoCall?.status === 'COMPLETED' ? 'Finished'
                        : demoCall?.status === 'CALLED' ? 'In Call'
                        : 'Queued'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4 pt-4 relative z-10">
              <button
                onClick={() => window.location.reload()}
                className="btn-vibrant !py-3 !px-8 text-xs font-semibold rounded-xl"
              >
                🔄 Refresh Status
              </button>
              <button
                onClick={handleLogout}
                className="btn-ghost !py-3 !px-8 text-xs font-semibold rounded-xl border-white/10 hover:border-white/20"
              >
                DISCONNECT
              </button>
            </div>
          </motion.div>
          <SponsorMarquee />
        </div>
      </main>
    )
  }

  if (team?.allowedTaskId === 'WAITING_ROOM') {
    return (
      <main className="min-h-screen bg-[oklch(var(--background))] selection:bg-primary selection:text-white overflow-x-hidden relative font-sans text-white">
        {/* Background Layer */}
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

        <div className="max-w-4xl mx-auto px-4 md:px-8 pt-32 md:pt-48 pb-16 relative z-10 flex flex-col items-center justify-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
            className="w-full glass-premium rounded-3xl md:rounded-[2.5rem] p-8 md:p-14 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] text-center relative overflow-hidden space-y-8"
          >
            {/* Ambient glows inside card */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/25 blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px] pointer-events-none" />

            <div className="flex flex-col items-center gap-4">
              <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono tracking-widest border border-amber-500/20 uppercase animate-pulse">
                ⏳ Synchronized Waiting Room
              </span>
              <h1 className="text-5xl md:text-7xl font-display font-black leading-tight text-white uppercase tracking-tight">
                Round {team?.allowedRound} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  Completed.
                </span>
              </h1>
              <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
                Excellent work, <strong>{team.teamName}</strong>! Your team has successfully submitted and passed all milestones for Round {team?.allowedRound}. You are currently in the workspace waiting room.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center">
                <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Cumulative Score</span>
                <span className="text-4xl md:text-5xl font-mono font-bold text-primary mt-2">
                  {team.progressState?.score || 0} pts
                </span>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center">
                <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Global Status</span>
                <span className="text-sm font-bold text-emerald-400 mt-3 uppercase tracking-wider">
                  Waiting for Round {(team?.allowedRound || 0) + 1}
                </span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 text-xs text-white/45 max-w-lg mx-auto leading-relaxed">
              💡 <strong>System Notice:</strong> Progression in this event is synchronized. The administrator must advance the global event ceiling before you can access Round {(team?.allowedRound || 0) + 1} objectives.
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button 
                onClick={() => window.location.reload()}
                className="btn-vibrant !py-3 !px-8 text-xs font-semibold rounded-xl"
              >
                🔄 Refresh Status
              </button>
              <button 
                onClick={handleLogout}
                className="btn-ghost !py-3 !px-8 text-xs font-semibold rounded-xl border-white/10 hover:border-white/20"
              >
                DISCONNECT
              </button>
            </div>
          </motion.div>

          {/* Submission logs of completed tasks */}
          {team.submissions && team.submissions.length > 0 && (
            <div className="w-full mt-12 space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-xl text-white/60 font-display uppercase tracking-wider">Milestone Submissions</h3>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.submissions.filter((s: any) => s.status === 'APPROVED' || s.status === 'PENDING').map((sub: any) => (
                  <div key={sub.id} className="p-6 rounded-2xl glass-premium border border-white/5 flex flex-col justify-between gap-4 text-left">
                    <div>
                      <div className="flex justify-between items-center gap-3">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider border ${sub.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          {getFeatureLabel(sub.taskId)}
                        </span>
                        {sub.status === 'PENDING' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[8px] font-mono tracking-widest border border-amber-500/20 uppercase animate-pulse">
                            Pending Evaluation
                          </span>
                        )}
                      </div>

                      {/* Display active links */}
                      <div className="mt-4 space-y-2">
                        {sub.payload?.github && (
                          <div>
                            <span className="text-[9px] text-white/20 uppercase font-mono block">GitHub Repository</span>
                            <a 
                              href={sub.payload.github} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-emerald-400 underline break-all font-mono hover:text-emerald-300 transition-colors block"
                            >
                              {sub.payload.github}
                            </a>
                          </div>
                        )}
                        {sub.payload?.liveDemo && (
                          <div>
                            <span className="text-[9px] text-white/20 uppercase font-mono block mt-2">Live Demo / Video</span>
                            <a 
                              href={sub.payload.liveDemo} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-emerald-400 underline break-all font-mono hover:text-emerald-300 transition-colors block"
                            >
                              {sub.payload.liveDemo}
                            </a>
                          </div>
                        )}
                        {sub.payload?.description && (
                          <div className="mt-3">
                            <span className="text-[9px] text-white/20 uppercase font-mono block">Description</span>
                            <p className="text-xs text-white/70 mt-1 leading-relaxed">{sub.payload.description}</p>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-white/50 mt-4 font-mono">
                        {sub.status === 'APPROVED'
                          ? `Approved on ${new Date(sub.submittedAt).toLocaleDateString()}`
                          : `Submitted on ${new Date(sub.submittedAt).toLocaleDateString()} (Awaiting Evaluation)`}
                      </p>
                      {sub.payload?.editHistory && sub.payload.editHistory.length > 0 && (
                        <div className="text-[9px] text-white/30 font-mono mt-2 flex items-center gap-1.5">
                          <span>✏️ Last modified:</span>
                          <span className="text-white/40">{new Date(sub.payload.editHistory[sub.payload.editHistory.length - 1].editedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    {sub.evaluation && (
                      <div className="pt-2 border-t border-white/5 space-y-3">
                        {!sub.taskId.startsWith('FEATURE-') && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white/40 font-mono">Judge Score</span>
                            <span className="text-sm font-bold text-primary font-mono">{sub.evaluation.totalScore} Points</span>
                          </div>
                        )}
                        {sub.evaluation.feedback && (
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-[9px] text-white/20 uppercase font-mono block">Evaluations Feedback</span>
                            {renderFeedbackList(sub.evaluation.feedback)}
                          </div>
                        )}
                        {sub.evaluation.scoreBreakdown && !sub.taskId.startsWith('FEATURE-') && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Object.entries(sub.evaluation.scoreBreakdown).map(([key, val]: any) => (
                              <div key={key} className="bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/5 text-[9px] font-mono">
                                <span className="text-white/40 capitalize">{key}:</span> <span className="text-white font-bold">{val}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <SponsorMarquee />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[oklch(var(--background))] selection:bg-primary selection:text-white overflow-x-hidden relative font-sans text-white">
      
      {/* Background Layer */}
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

      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <Navbar session={session as any} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 md:pt-48 lg:pt-56 pb-16 md:pb-32 relative z-10">
        
        {/* Header Section */}
        <section className="mb-16 md:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className="premium-sticker mb-8 inline-block">Workspace Nexus</div>
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
              <h1 className="text-6xl md:text-8xl text-hero leading-[0.85]">
                SALUTATIONS, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/20">
                  {session.user.name?.split(' ')[0] || 'GUEST'}.
                </span>
              </h1>
              <button 
                onClick={handleLogout}
                className="btn-ghost !py-2.5 !px-6 !rounded-full text-xs font-mono tracking-widest hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 transition-all duration-300"
              >
                DISCONNECT // EXIT
              </button>
            </div>
            <p className="text-lg md:text-2xl text-editorial max-w-3xl text-white/70">
              {team 
                ? `You are connected as a team member of "${team.teamName}" under event "${team.event.name}".`
                : `You are connected to the administrator panel. Monitor the event, check entries, and execute grading protocols.`}
            </p>
          </motion.div>
        </section>

        {/* Roadmap Tracker */}
        {team && stages.length > 0 && (
          <section className="mb-16 md:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="glass-premium rounded-2xl md:rounded-[var(--radius)] p-8 md:p-12 border-white/5"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_20px_rgba(52,211,153,0.2)]" />
                <span className="text-label-caps !text-[9px] tracking-[0.2em] text-white/40">Round Progress</span>
              </div>
              <div className="flex items-center gap-0">
                {stages.map((stage, idx) => {
                  const isCompleted = currentStageNum > stage.stage
                  const isCurrent = currentStageNum === stage.stage
                  const isLocked = currentStageNum < stage.stage
                  return (
                    <div key={stage.stage} className="flex-1 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 ${
                          isCompleted
                            ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                            : isCurrent
                              ? 'bg-primary text-black shadow-[0_0_20px_rgba(109,40,217,0.4)] ring-2 ring-primary/50'
                              : 'bg-white/5 text-white/20 border border-white/10'
                        }`}>
                          {isCompleted ? '✓' : stage.stage}
                        </div>
                        <span className={`mt-3 text-[9px] font-black text-center uppercase tracking-[0.15em] leading-relaxed max-w-[90px] ${
                          isCompleted
                            ? 'text-emerald-400/80'
                            : isCurrent
                              ? 'text-white'
                              : 'text-white/20'
                        }`}>
                          {stage.name}
                        </span>
                      </div>
                      {idx < stages.length - 1 && (
                        <div className={`absolute top-5 left-[60%] w-[80%] h-[2px] -translate-y-1/2 ${
                          isCompleted ? 'bg-emerald-500/50' : 'bg-white/10'
                        }`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </section>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mb-20 md:mb-32">
          
          {/* Status & Action Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className={`lg:col-span-8 glass-premium rounded-2xl md:rounded-[var(--radius)] p-6 md:p-12 relative overflow-hidden group border-t-2 ${config.border} shadow-2xl`}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10 md:mb-16">
                <div className={`w-2.5 h-2.5 rounded-full ${config.color} animate-pulse shadow-[0_0_20px_rgba(255,255,255,0.2)]`} />
                <span className="text-label-caps !text-[9px] tracking-[0.2em]">{team ? 'Team Milestones' : 'System Operations'}</span>
              </div>

              <h2 className={`text-6xl md:text-8xl lg:text-[90px] text-stat mb-6 ${config.color} leading-none`}>
                {config.label}
              </h2>
              
              <p className="text-lg md:text-2xl text-editorial leading-snug max-w-2xl text-white/70">
                {config.message}
              </p>

              {team && team.isEliminated ? (
                <div className="mt-10 p-10 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex flex-col items-center text-center space-y-4">
                  <h3 className="text-3xl font-display font-medium text-rose-400">
                    Not Selected
                  </h3>
                  <p className="text-sm text-rose-200/80 leading-relaxed font-mono max-w-md">
                    {team.eliminationReason === 'FAILED_ROUND_1_CUTOFF' ? (
                      `Your team did not qualify for Round 2 because your Round 1 final score was ${team.round1Score ?? 0} points, which is below the cutoff of 60 points.`
                    ) : team.eliminationReason === 'FAILED_ROUND_2_CUTOFF' ? (
                      `Your team did not qualify for Round 3 because your Round 2 score was ${team.round2Score ?? 0} points, which is below the cutoff of 60 points.`
                    ) : team.eliminationReason === 'NOT_IN_TOP_10' ? (
                      `Your team did not qualify for Round 3 because you were not in the top 10 teams on the leaderboard.`
                    ) : (
                      "The next round has started, but unfortunately your team did not meet the requirements to advance. Thank you for participating!"
                    )}
                  </p>
                </div>
              ) : team && team.allowedTaskId === 'WAITING_ROOM' ? (
                <div className="mt-10 md:mt-14 pt-10 border-t border-white/5">
                  <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center max-w-xl mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary text-3xl animate-pulse">
                      ⏳
                    </div>
                    <h3 className="text-2xl font-display font-medium text-white">Waiting Room</h3>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Salutations! Your team has completed the requirements for the current round early.
                      Please wait here in the workspace nexus until the administrator lifts the global ceiling and unlocks the next round.
                    </p>
                  </div>
                </div>
              ) : team && team.allowedTaskId === 'COMPLETED' ? (
                <div className="mt-10 md:mt-14 pt-10 border-t border-white/5">
                  <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center max-w-xl mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 text-3xl">
                      🏆
                    </div>
                    <h3 className="text-2xl font-display font-medium text-white">Event Completed</h3>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Congratulations! Your team has completed all challenges and tasks for this event!
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Dynamic Active Task Card */}
                  {team && (
                    <div className="mt-10 md:mt-14 space-y-4">
                      <div className="p-6 rounded-2xl bg-primary/[0.03] border border-primary/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] pointer-events-none" />
                        <div className="relative z-10">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-mono tracking-widest border border-primary/20 uppercase">
                            Active Milestone
                          </span>
                          <h3 className="text-2xl md:text-3xl font-display font-medium text-white mt-3">
                            {team.allowedTaskName || 'No Active Task'}
                          </h3>
                          {team.allowedTaskDescription && (
                            <p className="text-sm text-white/50 mt-2 max-w-2xl leading-relaxed">
                              {team.allowedTaskDescription}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PARTICIPANT WORK SUBMISSION INPUT */}
                  {team && (
                    <div className="mt-10 md:mt-14 pt-10 border-t border-white/5">
                      <h3 className="text-xl md:text-2xl font-display font-medium text-white mb-6">Submit Round Progress</h3>
                      
                      {/* Rejected submission feedback + resubmit prompt */}
                      {lastRejected && lastRejected.evaluation && !hasPending && (
                        <div className="mb-6 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/15">
                          <div className="flex items-start gap-3">
                            <span className="text-rose-400 text-sm mt-0.5">!</span>
                            <div className="flex-1">
                              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block">Submission Rejected</span>
                              {renderFeedbackList(lastRejected.evaluation.feedback, 'rose')}
                              <p className="text-[10px] text-white/40 mt-3">Fix the issues below and resubmit to advance.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {hasPending ? (
                        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-400 text-sm leading-relaxed max-w-xl">
                          ⚡ Your team&apos;s latest submission is currently queued for grading. Judging panel will inspect and score shortly.
                        </div>
                      ) : (
                        <form onSubmit={handleWorkSubmit} className="max-w-xl space-y-4">
                          {submitError && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                              {submitError}
                            </div>
                          )}
                          {submitSuccess && (
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                              Submission uploaded successfully! Refreshing dashboard...
                            </div>
                          )}
                          <div className="space-y-3">
                            <input
                              type="url"
                              value={githubUrl}
                              onChange={(e) => setGithubUrl(e.target.value)}
                              placeholder="GitHub Commit Submission Link (Mandatory)"
                              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-primary/50 text-value-mono !text-xs"
                            />
                            <input
                              type="url"
                              value={liveDemoUrl}
                              onChange={(e) => setLiveDemoUrl(e.target.value)}
                              placeholder="Drive Video Link (Mandatory)"
                              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-primary/50 text-value-mono !text-xs"
                            />
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Describe what you built and any notable features or changes"
                              maxLength={1000}
                              rows={3}
                              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-primary/50 text-value-mono !text-xs resize-none text-white/75 placeholder:text-white/15"
                            />
                            <div className="flex justify-between text-[9px] font-mono text-white/25 px-1">
                              <span>{description.length} / 1000 chars</span>
                              {description.length > 0 && description.length < 20 && (
                                <span className="text-amber-400">min 20 chars</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                            <button
                              type="submit"
                              disabled={loading || !githubUrl.trim() || !liveDemoUrl.trim()}
                              className="btn-vibrant !py-3.5 !px-8 text-xs font-semibold rounded-xl"
                            >
                              {loading ? 'Submitting...' : 'Submit Entry'}
                            </button>
                            <span className="text-[10px] text-white/20 font-mono">
                              Provide your GitHub commit submission link (Mandatory) and drive demo video URL (Mandatory).
                            </span>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* STAFF LINKS */}
              {staff && (
                <div className="mt-12 md:mt-20 pt-10 border-t border-white/5 flex flex-wrap gap-4">
                  {(staff.role === 'ADMIN' || staff.role === 'JUDGE') && (
                    <>
                      <a href="/judging" className="btn-vibrant !py-3.5 !px-8 text-xs font-semibold rounded-xl flex items-center gap-2">
                        Grading Queue <span className="text-sm">→</span>
                      </a>
                      <a href="/mentor" className="btn-ghost !py-3.5 !px-8 text-xs font-semibold rounded-xl border-white/10 hover:border-white/20 flex items-center gap-2">
                        Mentor Console <span className="text-sm">→</span>
                      </a>
                    </>
                  )}
                  {staff.role === 'ADMIN' && (
                    <a href="/admin/import" className="btn-ghost !py-3.5 !px-8 text-xs font-semibold rounded-xl border-white/10 hover:border-white/20">
                      Import Unstop CSV
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Side Cards */}
          <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
            {team ? (
              <>
                {/* Event Cumulative Score */}
                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="glass-premium rounded-2xl md:rounded-[var(--radius)] p-6 md:p-8 flex-1 relative overflow-hidden group border-white/10 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-label-caps !text-[9px] tracking-[0.2em] text-white/40">Event Score Marks</span>
                    <span className="text-5xl text-headline">🏆</span>
                  </div>
                  <div className="relative z-10 mt-4">
                    <h3 className="text-7xl font-mono text-primary font-bold drop-shadow-[0_0_15px_oklch(var(--primary))] leading-none">
                      {((team.progressState as any)?.score !== undefined) ? (team.progressState as any).score : 0}
                    </h3>
                    <p className="text-value-mono !text-[10px] text-white/30 uppercase mt-4">Cumulative Points Acquired</p>
                  </div>
                </motion.div>

                {/* Team Info Code */}
                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="glass-premium rounded-2xl md:rounded-[var(--radius)] p-6 md:p-8 flex-1 relative overflow-hidden group border-white/10 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-label-caps !text-[9px] tracking-[0.2em] text-white/40">Credential Nexus</span>
                    <span className="text-value-mono bg-white/5 border border-white/5 text-emerald-400 !text-[9px] px-2 py-0.5 rounded-md">SECURE</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] text-white/20 uppercase font-mono block">Unstop Team ID</span>
                      <span className="text-value-mono text-white/70 !text-[11px] font-bold">{team.unstopTeamId}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/20 uppercase font-mono block">Registration Token (UUID)</span>
                      <span className="text-value-mono text-white/30 !text-[9px] font-mono block break-all select-all">{team.id}</span>
                    </div>
                  </div>
                </motion.div>
              </>
            ) : (
              <>
                {/* Staff metrics card */}
                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="glass-premium rounded-2xl md:rounded-[var(--radius)] p-6 md:p-8 flex-1 relative overflow-hidden group border-white/10 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-label-caps !text-[9px] tracking-[0.2em] text-white/40">Active Role</span>
                    <span className="text-value-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 !text-[9px] px-2.5 py-0.5 rounded-md font-mono">{staff.role}</span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-3xl text-headline leading-tight font-display mb-4">Operations <br />Console</h3>
                    <p className="text-[11px] text-white/40 leading-relaxed font-mono">
                      Authorize CSV rosters, grade incoming entries, or audit logging events on Supabase.
                    </p>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* MENTOR HELP DESK (PARTICIPANTS ONLY) */}
        {team && (
          <section className="mb-20 md:mb-32">
            <MentorTeamPanel />
          </section>
        )}

        {/* SUBMISSION LOGS PANEL (PARTICIPANTS ONLY) */}
        {team && team.submissions && team.submissions.length > 0 && (
          <section className="mb-20 md:mb-32">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 mb-10">
              <h3 className="text-hero text-3xl md:text-5xl uppercase">Submission Logs</h3>
              <div className="flex-1 h-px bg-white/10 hidden md:block" />
              <div className="text-micro text-[10px] font-mono">{team.submissions.length} Entry Logs</div>
            </div>

            <div className="space-y-4">
              {team.submissions.map((sub: any) => {
                const isApproved = sub.status === 'APPROVED'
                const isRejected = sub.status === 'REJECTED'
                const isPending = sub.status === 'PENDING'

                let statusBadgeColor = 'text-amber-400 bg-amber-400/5 border-amber-400/10'
                if (isApproved) statusBadgeColor = 'text-emerald-400 bg-emerald-400/5 border-emerald-400/10'
                if (isRejected) statusBadgeColor = 'text-rose-400 bg-rose-400/5 border-rose-400/10'

                return (
                  <div 
                    key={sub.id} 
                    className="p-6 rounded-2xl glass-premium border border-white/5 hover:border-white/10 transition-all duration-300 relative group overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono uppercase tracking-wider">
                          {getFeatureLabel(sub.taskId)}
                        </span>
                        {sub.status !== 'APPROVED' && (
                          <span className={`text-[10px] px-3 py-1 rounded-full border ${statusBadgeColor} font-mono tracking-wider`}>
                            {sub.status}
                          </span>
                        )}
                        <span className="text-[10px] text-white/30 font-mono">
                          Submitted on {new Date(sub.submittedAt).toLocaleString()}
                        </span>
                      </div>
                      {sub.evaluation && (
                        <div className="text-right">
                          {!sub.taskId.startsWith('FEATURE-') && (
                            <>
                              <span className="text-xs text-white/40 font-mono">Score Acquired: </span>
                              <span className="text-sm font-bold text-primary font-mono">{sub.evaluation.totalScore} Points</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 space-y-2">
                      {sub.payload?.github && (
                        <>
                          <span className="text-[9px] text-white/20 uppercase font-mono block">GitHub Repository</span>
                          <a 
                            href={sub.payload.github} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-emerald-400 underline break-all font-mono hover:text-emerald-300 transition-colors block"
                          >
                            {sub.payload.github}
                          </a>
                        </>
                      )}
                      {sub.payload?.liveDemo && (
                        <>
                          <span className="text-[9px] text-white/20 uppercase font-mono block mt-2">Live Demo</span>
                          <a 
                            href={sub.payload.liveDemo} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-emerald-400 underline break-all font-mono hover:text-emerald-300 transition-colors block"
                          >
                            {sub.payload.liveDemo}
                          </a>
                        </>
                      )}
                      {sub.payload?.description && (
                        <div className="mt-3">
                          <span className="text-[9px] text-white/20 uppercase font-mono block">Description</span>
                          <p className="text-xs text-white/70 mt-1 leading-relaxed">{sub.payload.description}</p>
                        </div>
                      )}
                      {sub.payload?.editHistory && sub.payload.editHistory.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                          <span className="text-[9px] text-white/20 uppercase font-mono block">Edit History</span>
                          <div className="space-y-2">
                            {sub.payload.editHistory.map((historyItem: any, hIdx: number) => (
                              <div key={hIdx} className="text-[10px] font-mono text-white/40 flex items-start gap-2">
                                <span className="text-primary/70">✏️</span>
                                <div>
                                  <span className="font-semibold text-white/50">Modified on {new Date(historyItem.editedAt).toLocaleString()}</span>
                                  <div className="text-[9px] text-white/20 mt-0.5 space-y-1.5 pl-2 border-l border-white/5">
                                    {historyItem.previousGithub && (
                                      <div className="truncate max-w-lg">Prev GitHub: <span className="text-white/30">{historyItem.previousGithub}</span></div>
                                    )}
                                    {historyItem.previousLiveDemo && (
                                      <div className="truncate max-w-lg">Prev Demo: <span className="text-white/30">{historyItem.previousLiveDemo}</span></div>
                                    )}
                                    {historyItem.previousEvaluations && historyItem.previousEvaluations.length > 0 && (
                                      <div className="mt-1 space-y-1">
                                        {!sub.taskId.startsWith('FEATURE-') && <span className="text-[8px] text-white/25 uppercase font-mono block">Previous Scores</span>}
                                        {historyItem.previousEvaluations.map((pe: any, peIdx: number) => (
                                          <div key={peIdx} className="bg-white/5 px-2 py-1 rounded border border-white/5 text-[9px] text-white/40">
                                            {!sub.taskId.startsWith('FEATURE-') && <span>Score: <strong className="text-primary">{pe.totalScore} pts</strong></span>}
                                            {pe.feedback && <p className="italic text-[8px] text-white/30 mt-0.5">"{pe.feedback}"</p>}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {sub.evaluation && (
                      <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                        <span className="text-[9px] text-white/20 uppercase font-mono block">Evaluations Feedback</span>
                        {renderFeedbackList(sub.evaluation.feedback)}
                        {sub.evaluation.scoreBreakdown && !sub.taskId.startsWith('FEATURE-') && (
                          <div className="flex flex-wrap gap-4 mt-2">
                            {Object.entries(sub.evaluation.scoreBreakdown).map(([key, val]: any) => (
                              <div key={key} className="bg-white/5 px-3 py-1 rounded-lg border border-white/5 text-[10px] font-mono">
                                <span className="text-white/40 capitalize">{key}:</span> <span className="text-white font-bold">{val}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Resource Grid */}
        <section className="mb-20 md:mb-32">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 mb-12">
            <h3 className="text-hero text-3xl md:text-5xl uppercase">Resources</h3>
            <div className="flex-1 h-px bg-white/10 hidden md:block" />
            <div className="text-micro text-[10px]">Quick Links</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {[
              { title: 'Timeline', desc: 'View the full event schedule', href: '/schedule', icon: '⚡' },
              { title: 'Protocols', desc: 'Rules and documentation', href: 'https://ieee-ras-ruby.vercel.app/unlockd#overview', external: true, icon: '📑' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <a
                  href={item.href}
                  {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="group relative block p-6 md:p-10 rounded-2xl glass-premium border border-white/5 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-700 overflow-hidden shadow-2xl"
                >
                  <div className="relative z-10">
                    <div className="text-5xl mb-8 group-hover:scale-110 transition-transform duration-700 inline-block filter grayscale group-hover:grayscale-0">{item.icon}</div>
                    <h4 className="text-3xl text-headline mb-3 group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-editorial !text-white/60 !font-normal group-hover:text-white transition-colors">{item.desc}</p>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 blur-[80px] group-hover:bg-primary/20 transition-all duration-700" />
                </a>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 md:px-8 py-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-white/20 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl">
            <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-label-caps text-white/60 !text-[10px]">IEEE RAS 2026</span>
        </div>
        <div className="flex gap-12 text-label-caps !text-[10px]">
          <a href="/schedule" className="hover:text-white transition-colors">Timeline</a>
          <a href="/login" className="hover:text-white transition-colors">Portal</a>
          <a href="#" className="hover:text-white transition-colors">Support</a>
        </div>
        <div className="text-value-mono text-white/10 uppercase !text-[9px]">
          Logged in as {session.user.name?.split(' ')[0] || 'Guest'}
        </div>
      </footer>

      <SponsorMarquee />
    </main>
  )
}
