import React, { useState, useRef, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

import LightRays from './LightRays';

import Navbar from './Navbar.jsx';
import BetaWelcomeModal from '../../Components/BetaWelcomeModal.jsx';
import FreeTrialPopup from '../../Components/FreeTrialPopup.jsx';
import ScrollToTop from './ScrollToTop.jsx';
import { Star } from 'lucide-react';
// SEO: Import Helmet for managing head tags
import { Helmet } from 'react-helmet';

import LogoCarousel from './LogoCarousel.jsx';
import StatsSection from './StatsSection.jsx';
// Cards asset imports
// Cards asset imports
import studioOwnerImg from "../../assets/studio_owner.webp";
import photographerImg from "../../assets/photographer.webp";
import printingVendorImg from "../../assets/printing_vendor.webp";
import clientImg from "../../assets/client.webp";
import joinUsImg from "../../assets/joinus.webp";
import dashboardImg from "../../assets/dashboard_hero.png";
import nvidiaLogo from "../../assets/nvidia_logo.jpg";
import aws from "../../assets/aws_startups.png"
import ScrollFeatureShowcase from './ScrollTest.jsx';
import ModernFeaturesSection from './ModernFeatures.jsx';
// import PricingSection from './PricingSection.jsx';
import FoundingPartnersSection from './FoundingPartnersSection.jsx';

// Feature Image Imports for Preloading
import FS3 from "../../assets/features/FS3.webp";
import FS4 from "../../assets/features/FS4.webp";
import FS5 from "../../assets/features/FS5.webp";
import FS6 from "../../assets/features/FS6.webp";
import FS7 from "../../assets/features/FS7.webp";
import FS1 from "../../assets/features/FS1.webp";
import FS2 from "../../assets/features/FS2.webp";

import pm1 from "../../assets/features/pm1.webp";
import pm2 from "../../assets/features/pm2.webp";
import pm3 from "../../assets/features/pm3.webp";
import pm4 from "../../assets/features/pm4.webp";
import pm0 from "../../assets/features/pm0.webp";
import anal1 from "../../assets/features/anal1.webp";
import anal2 from "../../assets/features/anal2.webp";
import anal3 from "../../assets/features/anal3.webp";
import anal4 from "../../assets/features/anal4.webp";
import anal0 from "../../assets/features/anal0.webp";
import tc1 from "../../assets/features/tc1.webp";
import tc2 from "../../assets/features/tc2.webp";
import tc3 from "../../assets/features/tc3.webp";
import tc4 from "../../assets/features/tc4.webp";
import tc0 from "../../assets/features/tc0.webp";

import { motion } from 'framer-motion';
import TestimonialsSection from './TestimonialsSection.jsx';
import ContactUsSection from './ContactUsSection.jsx';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { FiUsers, FiCalendar, FiCamera, FiGlobe, FiUser, FiMail, FiBarChart2 } from "react-icons/fi";
import { useNavigate } from 'react-router-dom';
import FaqSection from './FaqSection.jsx';
import Footer from './Footer.jsx';


const useWindowSize = () => {
  const [size, setSize] = useState([0, 0]);
  useEffect(() => {
    const handleResize = () => {
      setSize([window.innerWidth, window.innerHeight]);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      handleResize(); // Set initial size
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);
  return size;
};

// Optimized Scroll Spy Hook with IntersectionObserver
const titleClassName = `text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-4 p-2 whitespace-normal sm:whitespace-pre-line bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent`;

const titleStyle = {
  fontFamily: "'Poppins', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale'
};

const useOptimizedScrollSpy = (sectionIds, offset = 100) => {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: `-${offset}px 0px -50% 0px`,
        threshold: 0.1
      }
    );

    sectionIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sectionIds, offset]);

  return activeSection;
};

// Updated Features array with more official icons from Lucide
const FEATURES = [
  {
    icon: <FiUsers size={32} className="text-purple-500" />,
    title: "Client & Lead Hub",
    desc: "Convert leads into clients, send instant quotes, and track every interaction."
  },
  {
    icon: <FiCalendar size={32} className="text-blue-500" />,
    title: "Smart Event Management",
    desc: "Plan timelines, assign teams, and share real-time updates with clients"
  },
  {
    icon: <FiCamera size={32} className="text-green-500" />,
    title: "AI-Powered Media Tools",
    desc: "Cull, search, and organize thousands of images with AI & facial recognition."
  },
  {
    icon: <FiGlobe size={32} className="text-pink-500" />,
    title: "Digital Albums",
    desc: "Deliver stunning, shareable albums your clients can access anytime."
  },
  {
    icon: <FiUser size={32} className="text-indigo-500" />,
    title: "Vendor Discovery",
    desc: "Find photographers, editors, and printing partners near you with ease."
  },
  {
    icon: <FiMail size={32} className="text-yellow-500" />,
    title: "Seamless Collaboration",
    desc: "Chat, manage tasks, and control user access — all in one place."
  },
  {
    icon: <FiBarChart2 size={32} className="text-purple-500" />,
    title: "Insightful Dashboard",
    desc: "Track performance, revenue, and project milestones with powerful analytics."
  },
];

// Optimized Image Component with lazy loading
const OptimizedImage = React.memo(({ src, alt, className, ...props }) => {
  return (
    <img
      src={src}
      alt={alt} // SEO: `alt` prop is passed and used here
      className={className}
      loading="lazy"
      decoding="async"
      style={{
        willChange: 'auto',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      }}
      {...props}
    />
  );
});



// Desktop looping carousel (one card at a time, loops)


// Mobile list (show all, no loop)


// Optimized Feature Item Component


// Smooth scroll function
const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

/* ─────────────────────────────────────────────────────────────
   TRUST SECTION  –  two-tier, infinitely scalable
   Tier 1: Startup / tech accelerators  (NVIDIA Inception, …)
   Tier 2: Studio partners & clients    (Vision Eye, Tiny Hugs, …)
───────────────────────────────────────────────────────────── */

const TrustStrip = () => (
  <motion.div
    className="flex flex-col items-center gap-5 w-full pt-2"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.45 }}
  >
    {/* ── Tier 1: Accelerators ── */}
    <div className="flex flex-col items-center gap-3 w-full">
      <p className="text-[9.5px] uppercase tracking-[0.32em] text-gray-400 font-semibold">
        Backed by world-class accelerators
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="inline-flex items-center px-4 py-2.5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-default">
          <img
            src={nvidiaLogo}
            alt="NVIDIA Inception Programme"
            className="h-8 w-auto object-contain"
            style={{ maxWidth: '80px' }}
          />
        </div>
        <div className="inline-flex items-center justify-center px-4 py-2.5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-default">
          <img
            src={aws}
            alt="aws startup"
            className="h-8 w-auto object-contain object-center"
            style={{ maxWidth: '80px', display: 'block' }}
          />
        </div>
      </div>
    </div>
  </motion.div>
);


// Main Landing Component with optimizations
const Landing = React.memo(({ user, loading }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const sectionIds = useMemo(() => ['features', 'stakeholders', 'testimonials'], []);
  const activeSection = useOptimizedScrollSpy(sectionIds);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [windowWidth] = useWindowSize();
  const navigate = useNavigate();

  // Preload only critical high-priority images to reduce initial load lag
  useEffect(() => {
    const criticalImages = [
      dashboardImg,
      studioOwnerImg,
      photographerImg,
    ];

    criticalImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    // Strategy: Deferred preloading for non-critical assets
    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 2000));
    idleCallback(() => {
      const secondaryImages = [
        printingVendorImg, clientImg, joinUsImg,
        FS1, FS2, FS3, FS4, FS5, FS6, FS7
      ];
      secondaryImages.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    });
  }, []);

  // Use a useEffect to check when all fonts have loaded
  useEffect(() => {
    // This promise resolves when all fonts have been loaded.
    if (document.fonts) {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    } else {
      // Fallback for older browsers
      setFontsLoaded(true);
    }
  }, []);


  // Helper for navigation
  const handleContactClick = () => {
    window.open('https://calendar.app.google/juMgbSws2VmzJpiC6', '_blank');
  };

  const handleModalClose = () => {
    setShowBetaModal(false);
    localStorage.setItem('betaWelcomeModalShown', 'true');
  };

  const handleModalFeedback = () => {
    // Navigate to contact section in our-story page
    window.location.href = '/our-story#our-contact';
    handleModalClose();
  };

  // SEO: Add JSON-LD Structured Data
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Creative Workflow Platform",
    "description": "A unified, enterprise-ready platform for seamless project management and collaboration connecting photography studios, photographers, printing vendors, and clients.",
    "url": "https://www.your-website.com/", // SEO: Replace with your actual URL
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0", // SEO: Replace with actual rating
      "reviewCount": "120" // SEO: Replace with actual review count
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  };

  // Memoize heavy components with stable references
  const memoizedLightRays = useMemo(() => {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1.5}
          lightSpread={1.0}
          rayLength={1.5}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="custom-rays"
        />
      </div>
    );
  }, [windowWidth]);

  // Memoize section styles
  const sectionStyles = useMemo(() => ({
    hero: `relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden pt-20 bg-white text-gray-900`,
    features: `py-16 md:py-32 px-4 min-h-screen transition-colors duration-300 bg-gray-50`,
    stakeholders: `py-16 md:py-32 px-4 min-h-screen transition-colors duration-300 bg-gradient-to-br from-purple-50 via-white to-violet-50 will-change-transform`,
    others: `py-0 transition-colors duration-300 bg-white`,
    community: `px-4 py-8 transition-colors duration-300 bg-gray-50`
  }), []);

  return (
    <div className={`font-sans transition-colors duration-300 overflow-x-hidden bg-white min-h-screen flex flex-col`}>
      <Helmet>
        <link rel="preload" as="image" href={dashboardImg} />
        <link rel="preload" as="image" href={FS1} />
        <link rel="preload" as="image" href={FS2} />
        <link rel="preload" as="image" href={pm0} />
      </Helmet>
      <Navbar activeSection={activeSection} />

      {/* Hero Section */}
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-50 via-violet-50/30 to-white">
        {/* Purple Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.08)_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Violet glow behind navbar + heading */}
        {/* <div className="pointer-events-none absolute inset-x-0 -top-24 h-72 bg-gradient-to-b from-purple-600/30 via-purple-500/15 to-transparent blur-3xl" /> */}

        {/* Radial highlight behind main heading */}
        {/* <div className="pointer-events-none absolute left-1/2 top-32 -translate-x-1/2 w-[70vw] max-w-4xl h-64 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.4),transparent_60%)] blur-3xl opacity-70" /> */}

        <div className="container relative mx-auto max-w-[1400px] px-6 pt-16 pb-0">
          <div className="flex flex-col items-center text-center">
            {/* Spacer for proper layout */}
            <div className="mb-4" />

            {/* Eyebrow badge */}
            <motion.div
              className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-[11px] font-semibold uppercase tracking-widest"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              AI-Powered Studio CRM
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              className="mb-4 max-w-7xl text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-bold leading-[1.08] tracking-tight text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                fontFamily: "'Poppins', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              Onboard Clients.
              <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                Track Every Step.
              </span>
              <br />
              Deliver Excellence.
            </motion.h1>

            {/* Description */}
            <motion.p
              className="mb-5 mt-2 max-w-2xl text-base sm:text-lg md:text-lg text-gray-600 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ fontFamily: "'Lexend Deca', sans-serif" }}
            >
              Plexis gives photography studios one intelligent platform to onboard clients, manage bookings, track projects end-to-end, and deliver stunning albums so you focus on the craft, not the chaos.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-6 mt-2 relative z-20"
            >
              <button 
                onClick={handleContactClick}
                className="group relative px-6 py-3 text-sm md:text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 rounded-full overflow-hidden shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
              >


                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                <span className="relative flex items-center gap-2">
                  Book a Demo
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <div className="w-full max-w-2xl mb-4">
              <TrustStrip />
            </div>
          </div>
        </div>
        <motion.div
          className="relative w-full max-w-7xl mx-auto mb-6 md:mb-10"
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            perspective: '2000px',
            willChange: 'transform, opacity'
          }}
        >
          {/* Ambient purple glow - Reduced */}
          <motion.div
            className="absolute -inset-16 rounded-[3rem] opacity-10 blur-2xl"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.3), rgba(124, 58, 237, 0.2), transparent 70%)',
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Subtle Top Glow - Reduced */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-gradient-to-b from-purple-400/20 via-violet-500/10 to-transparent blur-2xl opacity-40" />

          {/* Dashboard frame */}
          <motion.div
            className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem]"
            style={{
              transformStyle: 'preserve-3d',
              background: 'linear-gradient(120deg, #1a1a1a 0%, #2d2d2d 100%)',
              padding: '14px',
              boxShadow: `
                0 50px 100px -20px rgba(139, 92, 246, 0.4),
                0 30px 60px -30px rgba(124, 58, 237, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                inset 0 1px 1px 0 rgba(255, 255, 255, 0.15),
                inset 0 -1px 1px 0 rgba(0, 0, 0, 0.3)
              `,
            }}
            whileHover={{
              y: -10,
              rotateX: 1.5,
              rotateY: -1.5,
              transition: { duration: 0.4, ease: 'easeOut' }
            }}
          >
            {/* Bezel highlight */}
            <div className="absolute inset-0 rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-60 pointer-events-none z-10" />

            <motion.div
              className="relative bg-white rounded-[1rem] md:rounded-[1.5rem] overflow-hidden"
            >
              <div className="relative aspect-[4/3] sm:aspect-[16/8] md:aspect-[21/9] lg:aspect-[2.5/1] overflow-hidden box-border">
                <img
                  src={dashboardImg}
                  alt="Plexis CRM Dashboard"
                  className="absolute inset-0 w-full h-full object-cover object-top block"
                />
              </div>
            </motion.div>

            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 pointer-events-none rounded-[2.5rem] md:rounded-[3rem]"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
            />
          </motion.div>

          {/* Subtle floating particles */}
          <motion.div
            className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-violet-600 opacity-15 blur-2xl"
            animate={{
              y: [0, -15, 0],
              scale: [1, 1.1, 1],
              opacity: [0.15, 0.25, 0.15]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 opacity-15 blur-2xl"
            animate={{
              y: [0, 12, 0],
              scale: [1, 1.1, 1],
              opacity: [0.15, 0.25, 0.15]
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />

        </motion.div>

        {/* Global Fade Overlay to visually blend the dashboard into the carousels below */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-32 md:h-64 bg-gradient-to-t from-white via-white/90 to-transparent z-10" />
      </section>
      <div className="relative z-20  -mt-20 overflow-hidden">
        <LogoCarousel />
      </div>
      <StatsSection />
      {/* Features Section - Optimized */}
      {/* Features Section - Optimized */}
      <div id="features" className="relative z-20">
        <ModernFeaturesSection />
      </div>

      {/* Stakeholder Benefits Section */}
      {/* Stakeholder Benefits Section */}
      <div id="stakeholders">
        <ScrollFeatureShowcase />
      </div>
      {/* Testimonials and Contact Sections */}
      <div id="testimonials" >
        <TestimonialsSection />
      </div>





      {/* Community/Join Section */}

      {/* <section className={sectionStyles.community}>
  <div className="max-w-7xl mx-auto w-full">
    <div className="flex flex-col items-center text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
        Join Our Growing Community
      </h2>
      <p className="text-base md:text-lg text-gray-400 mb-2 max-w-md">
        Connect with other professionals and stay ahead of the curve.
      </p>
      <HashLink
        smooth
        to="/login"
        className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg font-semibold shadow-lg transition text-white inline-block"
      >
        Join Now
      </HashLink>
    </div>
  </div>
</section> */}
      {/* Pricing section commented out - replaced with Founding Partners */}
      {/* <div className={sectionStyles.others}>
        <PricingSection />
      </div> */}
      <div className={sectionStyles.others}>
        <FoundingPartnersSection />
      </div>
      <div className={sectionStyles.others}>
        <FaqSection />
      </div>

      <div className={`${sectionStyles.others} mt-8`}>
        <Footer />
      </div>
      <ScrollToTop />

      {/* Beta Welcome Modal */}
      {showBetaModal && (
        <BetaWelcomeModal
          open={showBetaModal}
          onClose={handleModalClose}
          onFeedback={handleModalFeedback}
        />
      )}

      {/* Free Trial Popup for new / guest visitors */}
      <FreeTrialPopup user={user} />
    </div>
  );
});

export default Landing;
//mainnnn