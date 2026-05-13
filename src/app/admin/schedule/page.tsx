'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { api } from '@/trpc/react'

export default function AdminSchedulePage() {
  const { data: events, isLoading, refetch } = api.schedule.getAllEvents.useQuery()
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    type: 'GENERAL' as const,
    isPublic: true,
    color: '',
  })
  const createMutation = api.schedule.createEvent.useMutation({
    onSuccess: () => {
      setShowModal(false)
      setFormData({ title: '', description: '', location: '', startTime: '', endTime: '', type: 'GENERAL', isPublic: true, color: '' })
      refetch()
    },
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.startTime || !formData.endTime) return
    createMutation.mutate({
      ...formData,
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime),
    })
  }

  return (
    <main className="min-h-screen flex bg-[#050505] text-white selection:bg-primary relative overflow-hidden">
      {/* Background Parallax Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a,transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.03]" />

        {/* Animated Blobs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 50, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full"
        />
      </div>

      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col z-10 sticky top-0 h-screen">
        <div className="p-8 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-black font-display font-black text-[10px]">RA</span>
            </div>
            <span className="text-label-caps !text-white/40 group-hover:!text-white transition-colors">Admin_Hub</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4">
          {[
            { href: '/admin', label: 'Overview', icon: '📊' },
            { href: '/admin/applications', label: 'Applications', icon: '📋' },
            { href: '/admin/schedule', label: 'Schedule', icon: '📅', active: true },
            { href: '/admin/projects', label: 'Projects', icon: '🚀' },
          ].map(({ href, label, icon, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-label-caps transition-all ${
                active
                  ? 'bg-white !text-black shadow-lg shadow-white/10'
                  : '!text-white/40 hover:!text-white hover:bg-white/5'
              }`}
            >
              <span className="text-sm">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 text-center">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">IEEE RAS 2026</p>
        </div>
      </aside>

      {/* Content Container */}
      <div className="flex-1 relative z-10 overflow-auto">
        <div className="max-w-7xl mx-auto p-12 space-y-12">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-label-caps !text-primary">
                Time_Management
              </div>
              <h1 className="text-5xl text-hero leading-[0.9]">
                Event <br />
                <span className="text-white/20">Schedule.</span>
              </h1>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/90 transition-colors shadow-lg shadow-white/10"
            >
              CREATE EVENT
            </button>
          </header>

          {/* Create Event Modal */}
          <AnimatePresence>
            {showModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowModal(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="glass-premium rounded-3xl border-white/5 p-8 md:p-12 w-full max-w-lg shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl text-hero font-display">Create Event</h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-white/40 hover:text-white text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="text-label-caps !text-[9px] text-white/40 mb-2 block">Title *</label>
                      <input
                        value={formData.title}
                        onChange={e => handleChange('title', e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/20"
                        placeholder="Event title"
                      />
                    </div>
                    <div>
                      <label className="text-label-caps !text-[9px] text-white/40 mb-2 block">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={e => handleChange('description', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors min-h-[80px] resize-none placeholder:text-white/20"
                        placeholder="Event description (optional)"
                      />
                    </div>
                    <div>
                      <label className="text-label-caps !text-[9px] text-white/40 mb-2 block">Location</label>
                      <input
                        value={formData.location}
                        onChange={e => handleChange('location', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/20"
                        placeholder="Event location (optional)"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-label-caps !text-[9px] text-white/40 mb-2 block">Start Time *</label>
                        <input
                          type="datetime-local"
                          value={formData.startTime}
                          onChange={e => handleChange('startTime', e.target.value)}
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors [&::-webkit-calendar-picker-indicator]:text-white/40 placeholder:text-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-label-caps !text-[9px] text-white/40 mb-2 block">End Time *</label>
                        <input
                          type="datetime-local"
                          value={formData.endTime}
                          onChange={e => handleChange('endTime', e.target.value)}
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors [&::-webkit-calendar-picker-indicator]:text-white/40 placeholder:text-white/20"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-label-caps !text-[9px] text-white/40 mb-2 block">Type *</label>
                        <select
                          value={formData.type}
                          onChange={e => handleChange('type', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                        >
                          <option value="GENERAL">General</option>
                          <option value="WORKSHOP">Workshop</option>
                          <option value="MEAL">Meal</option>
                          <option value="JUDGING">Judging</option>
                          <option value="CEREMONY">Ceremony</option>
                          <option value="SPONSOR">Sponsor</option>
                        </select>
                      </div>
                      <div className="flex items-end gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.isPublic}
                            onChange={e => handleChange('isPublic', e.target.checked)}
                            id="isPublic"
                            className="w-4 h-4 rounded border-white/10 text-primary focus:ring-primary"
                          />
                          <label htmlFor="isPublic" className="text-label-caps !text-[9px] text-white/40">
                            Public
                          </label>
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="w-full btn-vibrant !py-4 text-label-caps !text-[11px] disabled:opacity-50"
                    >
                      {createMutation.isPending ? 'Creating...' : 'Create Event'}
                    </button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table Card */}
          <div className="glass-premium rounded-3xl border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="p-6 text-label-caps">Title / Desc</th>
                    <th className="p-6 text-label-caps">Type</th>
                    <th className="p-6 text-label-caps">Start Time</th>
                    <th className="p-6 text-label-caps">End Time</th>
                    <th className="p-6 text-label-caps text-center">Visibility</th>
                    <th className="p-6 text-label-caps text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Loading_Schedule...</span>
                        </div>
                      </td>
                    </tr>
                  ) : events?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-20">
                          <span className="text-4xl">📁</span>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em]">No_Events_Found</span>
                        </div>
                      </td>
                    </tr>
                  ) : events?.map((event, idx) => (
                    <motion.tr
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <td className="p-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-white group-hover:text-primary transition-colors font-display uppercase tracking-tight">{event.title}</span>
                          <span className="text-value-mono !text-white/20 !text-[9px]">{event.description || 'No description'} • {event.location || 'No location'}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="inline-flex px-3 py-1 rounded-lg text-label-caps !text-[9px] border bg-amber-500/10 text-amber-400 border-amber-500/20">
                          {event.type}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className="text-value-mono !text-white/60">
                          {new Date(event.startTime).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className="text-value-mono !text-white/60">
                          {new Date(event.endTime).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-lg text-label-caps !text-[9px] border ${event.isPublic ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {event.isPublic ? 'PUBLIC' : 'PRIVATE'}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-colors">EDIT</button>
                          <button className="text-[10px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-widest transition-colors">DELETE</button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Pagination Stats */}
          <div className="p-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
              Total <span className="text-white/40">{events?.length ?? 0}</span> Events
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}