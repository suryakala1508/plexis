import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import pm1 from "../../assets/features/pm1.png";
import pm2 from "../../assets/features/pm2.png";
import pm3 from "../../assets/features/pm3.png";
import pm4 from "../../assets/features/pm4.png";
import pm0 from "../../assets/features/pm0.png";
import anal1 from "../../assets/features/anal1.png";
import anal2 from "../../assets/features/anal2.jpg";
import anal3 from "../../assets/features/anal3.png";
import anal4 from "../../assets/features/anal4.png";
import anal0 from "../../assets/features/anal0.png";
import tc1 from "../../assets/features/tc1.png";
import tc2 from "../../assets/features/tc2.png";
import tc3 from "../../assets/features/tc3.png";
import tc4 from "../../assets/features/tc4.png";
import tc0 from "../../assets/features/tc0.jpg";

const FEATURE_TABS = [
  {
    id: 'project',
    label: 'Project Management',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    subtitle: 'Plan, Organise, and Execute Every Project With Precision',
    features: [
      {
        label: 'Lead Generation',
        description: 'Leads scatter across platforms and manual follow-ups slow conversions.',
        details: 'Plexis captures, organises, and prioritises high-quality leads — helping your studio reach more clients, close deals faster, and grow efficiently.',
      },
      {
        label: 'Proposals',
        description: 'Creating consistent proposals takes time and affects booking confidence.',
        details: 'Create professional, customisable proposals in minutes with dynamic pricing, templates, and automated follow-ups that improve booking rates.',
      },
      {
        label: 'Smart Scheduling',
        description: 'Coordinating team availability and client timings becomes chaotic fast.',
        details: 'Simplify shoot planning with automatic calendar syncing, availability detection, and conflict-free scheduling for teams and clients.',
      },
      {
        label: 'AI Insights',
        description: 'Understanding bottlenecks and delays becomes guesswork during busy seasons.',
        details: 'AI-driven recommendations optimise project timelines, identify bottlenecks, and help you make faster, data-backed decisions.',
      },
    ],
    images: [pm0, pm1, pm2, pm3, pm4],
  },
  {
    id: 'analytics',
    label: 'Analytics & Insights',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    subtitle: 'Make Smarter Decisions With Actionable, Real-Time Data',
    features: [
      {
        label: 'Real-Time Analytics',
        description: 'Tracking performance manually leads to slow, scattered decision-making.',
        details: 'Monitor performance, bookings, revenue trends, and client behaviour with live dashboards built for data-driven decisions.',
      },
      {
        label: 'Growth Forecasting',
        description: 'Planning ahead is tough when future demand feels unpredictable.',
        details: 'Predict future demand, project revenue, and upcoming opportunities using AI-powered forecasting models.',
      },
      {
        label: 'Goal Tracking',
        description: 'Studio goals fade when the workload increases and visibility drops.',
        details: 'Set studio goals and track progress with visual dashboards that help you stay focused, organised, and on track.',
      },
      {
        label: 'Smart Alerts',
        description: 'Important updates get lost in the noise of daily tasks and deadlines.',
        details: 'Automated alerts for performance changes, upcoming milestones, low booking periods, and task reminders.',
      },
    ],
    images: [anal0, anal1, anal2, anal3, anal4],
  },
  {
    id: 'team',
    label: 'Team Collaboration',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    subtitle: 'Empower Your Team With Seamless Collaboration Tools',
    features: [
      {
        label: 'Team Management',
        description: 'Coordinating responsibilities gets harder as your team grows.',
        details: 'Assign roles, manage permissions, and keep everyone aligned with centralised team coordination features.',
      },
      {
        label: 'Enterprise Security',
        description: 'Client files and studio data become vulnerable across multiple tools.',
        details: 'Protect sensitive client data with enterprise-grade security, compliance tools, and granular access control.',
      },
      {
        label: 'Workflow Automation',
        description: 'Repetitive tasks drain time and slow down project momentum.',
        details: 'Automate repetitive tasks — from file delivery to approvals — saving time and ensuring consistent project execution.',
      },
      {
        label: 'Integrations',
        description: 'Switching between disconnected apps breaks focus and workflow continuity.',
        details: 'Connect your favourite tools with powerful integrations for payments, calendars, editing software, and cloud storage.',
      },
    ],
    images: [tc0, tc1, tc2, tc3, tc4],
  },
];

/* ── Tab content panel ── */
const TabPanel = ({ tab }) => {
  const [activeFeature, setActiveFeature] = useState(null);

  const currentImage =
    activeFeature === null ? tab.images[0] : tab.images[activeFeature + 1];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
      {/* Left — feature accordion */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="space-y-6 order-2 lg:order-1"
      >
        <div className="space-y-1.5">
          <h2
            className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent tracking-tight leading-tight"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {tab.label}
          </h2>
          <p className="text-base text-gray-500" style={{ fontFamily: "'Lexend Deca', sans-serif" }}>
            {tab.subtitle}
          </p>
        </div>

        <div className="space-y-2.5">
          {tab.features.map((feature, idx) => (
            <button
              key={idx}
              onClick={() => setActiveFeature(activeFeature === idx ? null : idx)}
              className={`w-full text-left rounded-xl transition-all duration-300 overflow-hidden border-l-4 ${
                activeFeature === idx
                  ? 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-500 shadow-sm'
                  : 'bg-white border-transparent hover:bg-purple-50/60 shadow-sm'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3
                      className={`text-sm font-bold mb-1 transition-colors ${
                        activeFeature === idx ? 'text-purple-600' : 'text-gray-900'
                      }`}
                    >
                      {feature.label}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
                  </div>
                  <motion.span
                    animate={{ rotate: activeFeature === idx ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`mt-0.5 flex-shrink-0 ${activeFeature === idx ? 'text-purple-500' : 'text-gray-300'}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                  </motion.span>
                </div>

                <AnimatePresence>
                  {activeFeature === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 pl-3 border-l-2 border-purple-300 ml-0.5">
                        <p className="text-xs text-gray-600 leading-relaxed">{feature.details}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Right — image with 3-D tilt */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="relative order-1 lg:order-2"
        style={{ perspective: '1400px' }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-2xl -z-10 blur-3xl opacity-30"
          style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.4),rgba(124,58,237,0.3))' }}
        />

        <motion.div
          className="relative"
          style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-6deg) rotateX(2deg)' }}
          whileHover={{ rotateY: 2, rotateX: -2, scale: 1.02, transition: { duration: 0.3 } }}
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-purple-200/40">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeFeature ?? 'default'}
                src={currentImage}
                alt={activeFeature === null ? tab.label : tab.features[activeFeature].label}
                className="w-full h-auto object-cover aspect-[4/3]"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{ filter: 'brightness(1.04) contrast(1.04) saturate(1.08)' }}
              />
            </AnimatePresence>
            {/* inner border shine */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* floating dot accents */}
          <motion.div
            className="absolute -top-3 -right-3 w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500/40"
            animate={{ y: [0, -8, 0], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-4 -left-4 w-4 h-4 bg-violet-500 rounded-full shadow-lg shadow-violet-500/40"
            animate={{ y: [0, 8, 0], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

/* ── Main export ── */
const ScrollFeatureShowcase = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="relative bg-gradient-to-b from-violet-50/60 via-white to-purple-50/40 py-16 md:py-24 px-4">
      {/* Section header */}
      <div className="max-w-3xl mx-auto text-center mb-10">
        <p className="text-[11px] uppercase tracking-[0.35em] text-violet-500 font-semibold mb-2">
          Deep-dive features
        </p>
        <h2
          className="text-3xl sm:text-4xl font-bold text-slate-900"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          Everything Your Studio Runs On
        </h2>
        <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto">
          Switch between modules to explore how Plexis handles every aspect of your studio workflow.
        </p>
      </div>

      {/* Tab bar */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="flex items-center bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 gap-1">
          {FEATURE_TABS.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(idx)}
              className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-250 ${
                activeTab === idx
                  ? 'text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {activeTab === idx && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {/* Mobile: short label */}
                <span className="sm:hidden">
                  {tab.label.split(' ')[0]}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab panel */}
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <TabPanel tab={FEATURE_TABS[activeTab]} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ScrollFeatureShowcase;
