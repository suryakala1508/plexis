import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TestimonialsSection() {
  // Real testimonials from Eluru studios
  const testimonials = [
    {
      id: 1,
      studio: "Mr. Portrait's Photography",
      quote: "Plexis has completely transformed our workflow. Managing multiple wedding events simultaneously is now a breeze. The client portal feature has reduced our follow-up calls by 70%!",
      rating: 5
    },
    {
      id: 2,
      studio: "Hema Studio 9",
      quote: "Before Plexis, tracking project deadlines and deliverables was a nightmare. Now everything is automated and organized. Our clients love the instant quote generation feature!",
      rating: 5
    },
    {
      id: 3,
      studio: "Keshav Photography",
      quote: "The AI-powered media management has saved us countless hours. We can now handle 3x more events without hiring additional staff. Plexis is a game-changer for studio operations.",
      rating: 5
    },
    {
      id: 4,
      studio: "Eluru Kids PhotoStudio",
      quote: "Managing our team of photographers and coordinating with Onsite photographers was always chaotic. Plexis brought everything under one roof. Our revenue has grown by 40% in just 6 months!",
      rating: 5
    },
    {
      id: 5,
      studio: "Hariharan Digital Studio & Events",
      quote: "The analytics dashboard gives us insights we never had before. We can now make data-driven decisions about our business. Plexis has become indispensable for our day-to-day operations.",
      rating: 5
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  // Auto-scroll functionality - slowed down to 6 seconds
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
      }, 5000); // Change slide every 6 seconds (slower)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, testimonials.length]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  // Helper function to get card index accounting for looping
  const getCardIndex = (offset) => {
    const index = currentIndex + offset;
    if (index < 0) return testimonials.length + index;
    if (index >= testimonials.length) return index - testimonials.length;
    return index;
  };

  return (
    <section className="relative bg-gradient-to-b from-white via-purple-50/30 to-white py-20 md:py-32 px-4 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container relative mx-auto max-w-7xl">
        {/* Header - Enhanced Animation */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
        >
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1]
            }}
            style={{
              fontFamily: "'Poppins', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
            }}
          >
            Stories That Inspire{' '}
            <motion.span 
              className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Studio Growth
            </motion.span>
          </motion.h2>
          
          <motion.p
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ 
              duration: 0.5, 
              delay: 0.5,
              ease: [0.22, 1, 0.36, 1]
            }}
            style={{ fontFamily: "'Lexend Deca', sans-serif" }}
          >
            Hear how Plexis is transforming the way businesses operate and grow.
          </motion.p>
        </motion.div>

        {/* 3-Card Carousel Container */}
        <div 
          className="relative max-w-7xl mx-auto px-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Cards Container - 3 visible at once */}
          <div className="relative flex items-center justify-center gap-6 min-h-[450px]">
            {/* Left Card (Previous) */}
            <div className="hidden md:block w-[28%] flex-shrink-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`left-${getCardIndex(-1)}`}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 0.5, scale: 0.9 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div className="relative h-[320px] bg-gradient-to-br from-white via-purple-50/30 to-white rounded-3xl p-6 shadow-lg border border-purple-100 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-200/40 to-violet-200/40 rounded-full blur-3xl" />
                    <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                      <div className="mb-4 w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-full flex items-center justify-center shadow-lg">
                        <Quote className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonials[getCardIndex(-1)].rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <blockquote 
                        className="text-gray-700 text-sm leading-relaxed mb-4 px-2 line-clamp-5"
                        style={{ fontFamily: "'Lexend Deca', sans-serif" }}
                      >
                        "{testimonials[getCardIndex(-1)].quote}"
                      </blockquote>
                      <div className="mt-auto">
                        <div className="w-12 h-0.5 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full mb-2 mx-auto" />
                        <p className="text-purple-600 font-bold text-sm">
                          {testimonials[getCardIndex(-1)].studio}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Center Card (Current) - Highlighted */}
            <div className="w-full md:w-[40%] flex-shrink-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`center-${currentIndex}`}
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -20 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div className="relative h-[420px] md:h-[400px] bg-gradient-to-br from-white via-purple-50/30 to-white rounded-3xl p-8 md:p-10 shadow-[0_20px_60px_rgba(109,40,217,0.25)] border-2 border-purple-200 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-200/40 to-violet-200/40 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-violet-200/40 to-purple-200/40 rounded-full blur-3xl" />
                    
                    <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                      <div className="mb-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-violet-600 rounded-full flex items-center justify-center shadow-lg">
                        <Quote className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex gap-1 mb-6">
                        {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                          <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                        ))}
                      </div>
                      <blockquote 
                        className="text-gray-800 text-base md:text-lg font-medium leading-relaxed mb-6"
                        style={{ fontFamily: "'Lexend Deca', sans-serif" }}
                      >
                        "{testimonials[currentIndex].quote}"
                      </blockquote>
                      <div className="mt-auto pt-4">
                        <div className="w-16 h-1 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full mb-4 mx-auto" />
                        <p className="text-purple-600 font-bold text-lg md:text-xl">
                          {testimonials[currentIndex].studio}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Card (Next) */}
            <div className="hidden md:block w-[28%] flex-shrink-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`right-${getCardIndex(1)}`}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 0.5, scale: 0.9 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div className="relative h-[320px] bg-gradient-to-br from-white via-purple-50/30 to-white rounded-3xl p-6 shadow-lg border border-purple-100 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-200/40 to-violet-200/40 rounded-full blur-3xl" />
                    <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                      <div className="mb-4 w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-full flex items-center justify-center shadow-lg">
                        <Quote className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonials[getCardIndex(1)].rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <blockquote 
                        className="text-gray-700 text-sm leading-relaxed mb-4 px-2 line-clamp-5"
                        style={{ fontFamily: "'Lexend Deca', sans-serif" }}
                      >
                        "{testimonials[getCardIndex(1)].quote}"
                      </blockquote>
                      <div className="mt-auto">
                        <div className="w-12 h-0.5 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full mb-2 mx-auto" />
                        <p className="text-purple-600 font-bold text-sm">
                          {testimonials[getCardIndex(1)].studio}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-2 mt-10">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-purple-600 w-8' 
                    : 'bg-purple-300 hover:bg-purple-400'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}