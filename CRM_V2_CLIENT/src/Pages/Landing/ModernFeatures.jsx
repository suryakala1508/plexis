import React from 'react';
import { motion } from 'framer-motion';
import FS3 from "../../assets/features/FS3.png";
import FS4 from "../../assets/features/FS4.png";
import FS5 from "../../assets/features/FS5.png";
import FS6 from "../../assets/features/FS6.png";
import FS7 from "../../assets/features/FS7.png";
import FS1 from "../../assets/features/FS1.jpg";
import FS2 from "../../assets/features/FS2.png";
const FEATURES = [
  {
    badge: "Leads & Clients",
    title: "Client Onboarding & Lead Hub",
    description:
      "Capture inquiries, onboard clients in minutes, send instant quotes, and never miss a follow-up again.",
    image: "https://res.cloudinary.com/dtrw7hrri/image/upload/w_800,f_auto,q_auto,dpr_auto/v1765798639/FS1_h3mi9p.png",
  },
  {
    badge: "AI Media",
    title: "AI-Powered Photo Management",
    description:
      "Search thousands of images by face or prompt, cull faster, and deliver the right photos to the right client instantly.",
    image: FS2,
  },
  {
    badge: "Delivery",
    title: "Digital Albums & Client Delivery",
    description:
      "Create beautiful, branded digital albums and share them securely — clients can access, like, and download anytime.",
    image: FS3,
  },
  {
    badge: "Analytics",
    title: "Studio Insights Dashboard",
    description:
      "Track revenue, bookings, and studio performance at a glance with real-time dashboards built for growth.",
    image: FS4,
  },
  {
    badge: "Smart Search",
    title: "Face Recognition & Smart Search",
    description:
      "Find any person or moment across your entire media library in seconds using AI-driven face and text search.",
    image: FS5,
  },
  {
    badge: "Events",
    title: "Event & Project Scheduling",
    description:
      "Plan shoots, assign crew, set timelines, and share live updates with clients — all from one workspace.",
    image: FS6,
  },
  {
    badge: "Team",
    title: "Team & Crew Management",
    description:
      "Assign roles, manage permissions, and keep your entire team aligned without switching between apps.",
    image: FS7,
  },
];



const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.2 + index * 0.12,
      ease: [0.25, 0.25, 0.25, 1],
    },
  }),
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: (index) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.55,
      delay: 0.26 + index * 0.12,
      ease: [0.2, 0.6, 0.2, 1],
    },
  }),
};

const ModernFeatureCard = ({ feature, index }) => {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35, margin: '0px 0px -80px 0px' }}
      className="group flex flex-col h-full overflow-hidden rounded-3xl border border-violet-100 bg-white/90 shadow-[0_20px_60px_rgba(76,29,149,0.08)] transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02] hover:border-violet-400 hover:shadow-[0_35px_100px_rgba(109,40,217,0.35),0_0_40px_rgba(139,92,246,0.3)]"    >
      <motion.div
        custom={index}
        variants={imageVariants}
        className="relative overflow-hidden  h-40 sm:h-44 lg:h-48 p-2"
      >
        <div className="relative h-full w-full overflow-hidden bg-white rounded-2xl">
          <img
            src={feature.image}
            alt={feature.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>
      </motion.div>

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          {feature.badge && (
            <span className="inline-block mb-2 px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-[10px] font-semibold uppercase tracking-widest border border-violet-100">
              {feature.badge}
            </span>
          )}
          <h3
            className="text-[13px] font-semibold leading-tight text-slate-900 sm:text-sm lg:text-base"
            style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
          >
            {feature.title}
          </h3>
          <p className="mt-2 text-sm text-slate-600 sm:text-[15px] leading-relaxed">{feature.description}</p>
        </div>
      </div>
    </motion.div>
  );
};

const MergedFeatureCard = ({ primary, secondary, index }) => {
  const merged = {
    title: `${primary.title} & ${secondary.title}`,
    description: `${primary.description} ${secondary.description}`,
    image: primary.image,
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35, margin: '0px 0px -80px 0px' }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white/90 shadow-[0_20px_60px_rgba(76,29,149,0.08)] transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02] hover:border-violet-400 hover:shadow-[0_35px_100px_rgba(109,40,217,0.35),0_0_40px_rgba(139,92,246,0.3)] sm:col-span-2 lg:col-span-2"
    >
      <motion.div
        custom={index}
        variants={imageVariants}
        className="relative overflow-hidden bg-violet-50 h-44 sm:h-48 lg:h-52 p-2"
      >
        <div className="relative h-full w-full overflow-hidden rounded-2xl">
          <img
            src={merged.image}
            alt={merged.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>
      </motion.div>

      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div>
          <h3
            className="text-base font-semibold leading-snug text-slate-900 sm:text-lg lg:text-xl"
            style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
          >
            {merged.title}
          </h3>
          <p className="mt-2 text-sm text-slate-600 sm:text-[15px]">{merged.description}</p>        </div>


      </div>

    </motion.div>
  );
};

const ModernFeaturesSection = () => {
  return (
    <section
      id="features"
      className="relative isolate overflow-hidden bg-gradient-to-b from-white via-white to-violet-50/50 px-4 pt-12 pb-20 sm:pt-4 sm:pb-24"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-violet-100/60 via-white to-transparent" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center text-center">
        {/* <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5, margin: '0px 0px -120px 0px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[11px] uppercase tracking-[0.42em] text-violet-500/80"
          >
            Crafted for Photography Studios
          </motion.p> */}
        {/* Section eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5, margin: '0px 0px -80px 0px' }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-[11px] uppercase tracking-[0.35em] text-violet-500 font-semibold mb-1"
        >
          Everything your studio needs
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5, margin: '0px 0px -80px 0px' }}
          transition={{ duration: 0.65, delay: 0.16, ease: [0.2, 0.6, 0.2, 1] }}
          className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
          }}
        >
          Powerful Features, Built for Studio Owners
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.55, margin: '0px 0px -80px 0px' }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 md:text-[15px]"
        >
          From capturing the first lead to delivering the final album — every tool you need to run a professional studio is right here, in one place.
        </motion.p>
      </div>

      <div className="relative mx-auto mt-12 max-w-7xl">
        {/* First Row - 4 cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-5">
          {FEATURES.slice(0, 4).map((feature, index) => (
            <div key={feature.title}>
              <ModernFeatureCard feature={feature} index={index} />
            </div>
          ))}
        </div>

        {/* Second Row - 3 cards with custom widths */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-12">
          {/* Card 5 - slightly wider for "Engine" word */}
          <div className="lg:col-span-4">
            <ModernFeatureCard feature={FEATURES[4]} index={4} />
          </div>

          {/* Card 6 - slightly wider for "Suite" word */}
          <div className="lg:col-span-4">
            <ModernFeatureCard feature={FEATURES[5]} index={5} />
          </div>

          {/* Card 7 - rest of space */}
          <div className="lg:col-span-4">
            <ModernFeatureCard feature={FEATURES[6]} index={6} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModernFeaturesSection;