import React from 'react';
import logo from "../../assets/logo.png";

/* ─────────────────────────────────────────────────────────────
   DashboardMockup
   A coded replica of the Plexis dashboard with demo-ready
   numbers that look credible and impressive to studio owners.
   Matches the real app's layout: sidebar + stat cards +
   charts + recent activity + today's tasks panel.
───────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { label: 'Dashboard', active: true },
  { label: 'Calendar' },
  { label: 'Leads' },
  { label: 'Project' },
  { label: 'Clients' },
  { label: 'Accounts' },
  { label: 'Catalog' },
  { label: 'Templates' },
  { label: 'Crew & Staff' },
  { label: 'Inventory' },
  { label: 'Profile' },
];

const STATS = [
  {
    label: 'Total Leads',
    value: '124',
    color: '#3b82f6',
    bg: '#eff6ff',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Total Projects',
    value: '48',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    ),
  },
  {
    label: 'Total Clients',
    value: '86',
    color: '#f97316',
    bg: '#fff7ed',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    label: 'Revenue',
    value: '₹12,40,000',
    color: '#22c55e',
    bg: '#f0fdf4',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
];

// Mini bar chart — 7 bars for Sun–Sat
const BAR_HEIGHTS = [28, 44, 36, 52, 40, 60, 48]; // % heights
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ACTIVITIES = [
  { icon: '💰', title: 'Payment Received', sub: 'Arjun Wedding — ₹85,000', time: '02/04/2026' },
  { icon: '📁', title: 'Project Update', sub: 'Priya & Karthik — Pre-Wedding', time: '02/04/2026' },
  { icon: '👤', title: 'New Client Onboarded', sub: 'Meghana Reddy — Birthday Shoot', time: '01/04/2026' },
  { icon: '👥', title: 'Crew Member Added', sub: 'Sravani — Chief Marketing', time: '01/04/2026' },
];

const TODAY_EVENTS = [
  { dot: '#f97316', title: 'Arjun — Wedding', sub: '6:00 AM · Venue: Taj Falaknuma' },
  { dot: '#8b5cf6', title: 'Priya — Pre-Wedding', sub: '4:00 PM · Hussain Sagar Lake' },
];

const DashboardMockup = () => (
  <div
    className="flex text-gray-900 select-none overflow-hidden"
    style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", fontSize: '11px', height: '480px' }}
  >
    {/* ── Sidebar ── */}
    <div className="flex flex-col bg-white border-r border-gray-100 flex-shrink-0" style={{ width: '148px' }}>
      {/* Logo */}
      <div className="flex items-center gap-1.5 px-3 py-3 border-b border-gray-100">
        <img src={logo} alt="Plexis" className="h-8 w-auto object-contain" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-hidden">
        {NAV_ITEMS.map(({ label, active }) => (
          <div
            key={label}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10.5px] font-medium transition-colors ${
              active
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: active ? 'rgba(255,255,255,0.7)' : '#d1d5db' }}
            />
            {label}
          </div>
        ))}
      </nav>

      {/* Studio info */}
      <div className="px-2.5 py-2.5 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[8px] font-bold">M</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-[9.5px] font-semibold text-gray-800 truncate leading-none">Masterpiece Photography</p>
            <p className="text-[8.5px] text-gray-400 truncate leading-none mt-0.5">demo@plexis.in</p>
          </div>
        </div>
      </div>
    </div>

    {/* ── Main content ── */}
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex-shrink-0">
        <h1 className="text-lg font-bold text-purple-600 leading-none">Dashboard</h1>
        <p className="text-[10px] text-gray-500 mt-0.5">Welcome back, Sri! Here's what's happening today.</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Centre panel ── */}
        <div className="flex-1 px-4 py-3 overflow-hidden space-y-3">

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-2.5">
            {STATS.map(({ label, value, color, bg, icon }) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9.5px] text-gray-500 font-medium">{label}</span>
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: bg }}
                  >
                    {icon}
                  </div>
                </div>
                <p
                  className="text-[17px] font-black leading-none"
                  style={{ color }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Lead Count bar chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-gray-800">Lead Count</span>
                <span className="text-[8.5px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">This Week</span>
              </div>
              <div className="flex items-end gap-1.5 h-14">
                {BAR_HEIGHTS.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t"
                      style={{ height: `${h}%`, background: '#7c3aed', opacity: 0.85 }}
                    />
                    <span className="text-[7.5px] text-gray-400">{DAYS[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Project types donut */}
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-gray-800">Project Types</span>
                <span className="text-[8.5px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">This Month</span>
              </div>
              <div className="flex items-center gap-3 flex-1">
                {/* SVG donut */}
                <svg width="56" height="56" viewBox="0 0 56 56" className="flex-shrink-0">
                  {/* Wedding 52% */}
                  <circle cx="28" cy="28" r="20" fill="none" stroke="#7c3aed" strokeWidth="9"
                    strokeDasharray="65.4 99.6" strokeDashoffset="0" transform="rotate(-90 28 28)" />
                  {/* Pre-Wedding 28% */}
                  <circle cx="28" cy="28" r="20" fill="none" stroke="#f97316" strokeWidth="9"
                    strokeDasharray="35.2 129.8" strokeDashoffset="-65.4" transform="rotate(-90 28 28)" />
                  {/* Others 20% */}
                  <circle cx="28" cy="28" r="20" fill="none" stroke="#22c55e" strokeWidth="9"
                    strokeDasharray="25.1 139.9" strokeDashoffset="-100.6" transform="rotate(-90 28 28)" />
                </svg>
                <div className="space-y-1">
                  {[
                    { color: '#7c3aed', label: 'Wedding', val: '52%' },
                    { color: '#f97316', label: 'Pre-Wedding', val: '28%' },
                    { color: '#22c55e', label: 'Others', val: '20%' },
                  ].map(({ color, label, val }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-[8.5px] text-gray-600">{label}</span>
                      <span className="text-[8.5px] font-bold text-gray-800 ml-auto">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-800 mb-2">Recent Activity</p>
            <div className="space-y-1.5">
              {ACTIVITIES.map(({ icon, title, sub, time }) => (
                <div key={title} className="flex items-center gap-2">
                  <span className="text-[12px] flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9.5px] font-semibold text-gray-800 leading-none truncate">{title}</p>
                    <p className="text-[8.5px] text-gray-400 truncate leading-none mt-0.5">{sub}</p>
                  </div>
                  <span className="text-[8px] text-gray-300 flex-shrink-0">{time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel: Today's Tasks ── */}
        <div className="flex-shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-hidden" style={{ width: '160px' }}>
          <div className="px-3 py-3 border-b border-gray-100">
            <p className="text-[10.5px] font-bold text-gray-800 leading-none">Today's Tasks</p>
            <p className="text-[8.5px] text-gray-400 mt-0.5">Saturday, Apr 4, 2026</p>
          </div>

          {/* Quick counters */}
          <div className="grid grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
            {[
              { val: '4', label: 'Follow-ups', color: '#3b82f6' },
              { val: '2', label: 'Reminders', color: '#f97316' },
              { val: '3', label: 'Events', color: '#22c55e' },
              { val: '1', label: 'Payments', color: '#8b5cf6' },
            ].map(({ val, label, color }) => (
              <div key={label} className="bg-white flex flex-col items-center py-1.5">
                <span className="text-[12px] font-black leading-none" style={{ color }}>{val}</span>
                <span className="text-[7px] text-gray-400 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>

          {/* Events */}
          <div className="flex-1 px-2.5 py-2 overflow-hidden">
            <p className="text-[8px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Events & Meetups</p>
            <div className="space-y-2">
              {TODAY_EVENTS.map(({ dot, title, sub }) => (
                <div key={title} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: dot }} />
                  <div>
                    <p className="text-[9px] font-semibold text-gray-800 leading-tight">{title}</p>
                    <p className="text-[8px] text-gray-400 leading-tight">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardMockup;
