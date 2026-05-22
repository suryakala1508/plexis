import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Key, MessageCircle, Award } from 'lucide-react';

const scrollToContactSection = () => {
  const el = document.getElementById('our-contact');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  return false;
};

const FoundingPartnersSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const [reducedMotion, setReducedMotion] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleApplyClick = () => {
    navigate('/foundingStudioOnboard');
  };

  const fadeUp = (delay = 0) =>
    reducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
          transition: { duration: 0.45, delay },
        };

  const cards = [
    {
      icon: Key,
      title: 'Lifetime Early Access',
      description: 'Be first to use new features and shape the product.',
    },
    {
      icon: MessageCircle,
      title: 'Direct Line to Product',
      description: 'Direct feedback channel with our team.',
    },
    {
      icon: Award,
      title: 'Founding Partner Badge',
      description: 'Recognition as a founding partner of Studio Ops.',
    },
  ];

  return (
    <section
      id="founding-partners"
      ref={sectionRef}
      className="relative py-20 md:py-28 px-4 bg-gradient-to-b from-stone-50 via-white to-purple-50/30"
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          {...fadeUp(0)}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold uppercase tracking-wider mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span>Limited Seats · Founding Studio Partners</span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          {...fadeUp(0.08)}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight leading-[1.1] text-gray-900 mb-6 overflow-visible"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Be the Studio That{' '}
          <span
            className="inline-block bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent font-semibold italic"
            style={{ padding: '0.05em 0.15em 0.15em 0.04em' }}
          >
            Leads the Industry.
          </span>
        </motion.h2>

        {/* Description */}
        <motion.p
          {...fadeUp(0.12)}
          className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          We're partnering with a select group of photography studios to shape Plexis from the ground up — get lifetime early access, direct product influence, and a Founding Partner badge that sets you apart.
        </motion.p>

        {/* Benefit pills */}
        <motion.div
          {...fadeUp(0.14)}
          className="flex flex-wrap justify-center gap-3 mb-8"
        >
          {[
            { icon: Key, text: 'Lifetime Early Access' },
            { icon: MessageCircle, text: 'Direct Product Line' },
            { icon: Award, text: 'Founding Partner Badge' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700"
            >
              <Icon className="w-3.5 h-3.5 text-purple-500" />
              {text}
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div {...fadeUp(0.18)} className="mb-5">
          <button
            type="button"
            onClick={handleApplyClick}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300"
          >
            Apply for Founding Partnership
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Urgency */}
        <motion.p
          {...fadeUp(0.22)}
          className="text-sm text-gray-400 mb-16"
        >
          Spots are limited —{' '}
          <span className="text-purple-600 font-semibold">filling fast.</span>
        </motion.p>
      </div>
    </section>
  );
};

export default FoundingPartnersSection;
