import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Users, Camera, Zap, BarChart2, TrendingUp, Briefcase } from 'lucide-react';

// Coordinates (x, y) represent percentages on the desktop canvas
// `enter` defines the initial offset direction for the scroll animation
const desktopNodes = [
  { id: 'studios',       icon: Briefcase,  label: 'Studios',       x: 8,  y: 18, connectTo: ['mission'], enter: { x: -150, y: 0 } },
  { id: 'clients',       icon: Users,      label: 'Clients',       x: 8,  y: 72, connectTo: ['mission'], enter: { x: -150, y: 0 } },
  { id: 'ai',            icon: Zap,        label: 'AI Features',   x: 50, y: 6,  connectTo: ['mission', 'vision'], enter: { x: 0, y: -150 } },
  { id: 'photographers', icon: Camera,     label: 'Photographers', x: 50, y: 84, connectTo: ['mission', 'vision'], enter: { x: 0, y: 150 } },
  { id: 'leads',         icon: TrendingUp, label: 'Leads',         x: 92, y: 22, connectTo: ['vision'], enter: { x: 150, y: 0 } },
  { id: 'analytics',     icon: BarChart2,  label: 'Analytics',     x: 92, y: 78, connectTo: ['vision'], enter: { x: 150, y: 0 } },
];

const centers = {
  mission: { x: 32, y: 40 },
  vision:  { x: 68, y: 60 },
};

export default function MissionVisionSection() {
  return (
    <section className="w-full py-12 bg-[#FAFAFA]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative">

        <div className="text-center mb-8 lg:hidden">
          <span className="text-xs font-bold tracking-[0.2em] text-purple-600 uppercase">What Drives Us</span>
        </div>

        {/* --- DESKTOP CONSTELLATION VIEW --- */}
        <div className="hidden lg:block relative w-full h-[750px] overflow-visible">
          
          {/* SVG Background Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#C084FC" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#E9D5FF" stopOpacity="0.2" />
              </linearGradient>
              <style>
                {`
                  @keyframes dash { to { stroke-dashoffset: -20; } }
                  .animated-line { animation: dash 2s linear infinite; }
                `}
              </style>
            </defs>

            {/* Draw lines from nodes to their targets */}
            {desktopNodes.map((node) => (
              <React.Fragment key={`line-${node.id}`}>
                {node.connectTo.includes('mission') && (
                  <line 
                    x1={`${node.x}%`} y1={`${node.y}%`} 
                    x2={`${centers.mission.x}%`} y2={`${centers.mission.y}%`} 
                    stroke="url(#line-gradient)" strokeWidth="1.5" strokeDasharray="4 6" className="animated-line" 
                  />
                )}
                {node.connectTo.includes('vision') && (
                  <line 
                    x1={`${node.x}%`} y1={`${node.y}%`} 
                    x2={`${centers.vision.x}%`} y2={`${centers.vision.y}%`} 
                    stroke="url(#line-gradient)" strokeWidth="1.5" strokeDasharray="4 6" className="animated-line" 
                  />
                )}
              </React.Fragment>
            ))}
          </svg>

          {/* Nodes (Icons) — each slides in from its designated direction on scroll */}
          {desktopNodes.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: node.enter.x, y: node.enter.y }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ 
                type: "spring", 
                stiffness: 40, 
                damping: 15, 
                delay: i * 0.1, 
                duration: 1.2 
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 group z-10"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div className="w-14 h-14 rounded-full bg-white border border-purple-100 shadow-sm flex items-center justify-center text-purple-600 group-hover:scale-110 group-hover:border-purple-300 group-hover:shadow-md transition-all duration-300">
                <node.icon size={22} strokeWidth={1.5} />
              </div>
              <span className="text-sm font-semibold text-gray-500 group-hover:text-purple-700 transition-colors bg-[#FAFAFA] px-2">
                {node.label}
              </span>
            </motion.div>
          ))}

          {/* MISSION TEXT BLOCK */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-[420px] text-center z-20"
            style={{ left: `${centers.mission.x}%`, top: `${centers.mission.y}%` }}
          >
            <div className="inline-flex items-center gap-2 mb-4 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-purple-100">
              <Target className="text-purple-600" size={16} />
              <span className="text-xs font-bold tracking-[0.15em] text-purple-600 uppercase">Our Mission</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-[1.1] mb-4 tracking-tight">
              Empower the <br />
              <span className="text-purple-600">creative pipeline.</span>
            </h2>
            <p className="text-gray-600 font-normal leading-relaxed">
              We centralize tools and streamline workflows. Automating the unnecessary, so you can focus entirely on the creative.
            </p>
          </motion.div>

          {/* VISION TEXT BLOCK */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-[420px] text-center z-20"
            style={{ left: `${centers.vision.x}%`, top: `${centers.vision.y}%` }}
          >
            <div className="inline-flex items-center gap-2 mb-4 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-purple-100">
              <Eye className="text-purple-600" size={16} />
              <span className="text-xs font-bold tracking-[0.15em] text-purple-600 uppercase">Our Vision</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-[1.1] mb-4 tracking-tight">
              Lead the industry's <br />
              <span className="text-purple-600">transformation.</span>
            </h2>
            <p className="text-gray-600 font-normal leading-relaxed">
              Becoming the single platform where studios, creatives, and clients connect and work together without friction.
            </p>
          </motion.div>

        </div>

        {/* --- MOBILE/TABLET VIEW (Sleek Vertical Flow) --- */}
        <div className="lg:hidden flex flex-col gap-12 relative">
          
          {/* Vertical connecting line */}
          <div className="absolute left-8 top-10 bottom-10 w-px bg-gradient-to-b from-purple-100 via-purple-300 to-purple-100" />

          {/* Mission */}
          <div className="relative pl-20 pt-4">
            <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-purple-500 border-4 border-[#FAFAFA]" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Our Mission</h2>
            <p className="text-gray-600 font-normal leading-relaxed mb-6">
              Centralizing tools and streamlining workflows. Automating the unnecessary, so you can focus on the creative.
            </p>
            {/* Fixed: use flex-col list instead of grid to prevent label overflow/overlap */}
            <div className="flex flex-col gap-3">
              {desktopNodes.slice(0, 3).map((node) => (
                <div key={node.id} className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-white border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                    <node.icon size={16} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 truncate">{node.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Vision */}
          <div className="relative pl-20 pt-4">
            <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-purple-500 border-4 border-[#FAFAFA]" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Our Vision</h2>
            <p className="text-gray-600 font-normal leading-relaxed mb-6">
              Becoming the single platform where studios, creatives, and clients connect and work together without friction.
            </p>
            {/* Fixed: use flex-col list instead of grid to prevent label overflow/overlap */}
            <div className="flex flex-col gap-3">
              {desktopNodes.slice(3, 6).map((node) => (
                <div key={node.id} className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-white border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                    <node.icon size={16} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 truncate">{node.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}