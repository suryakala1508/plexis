  import React, { useState, useEffect, useMemo } from "react";
  import { motion } from "framer-motion";
  import AboutUsSection from "./AboutUsSection.jsx";
  import ScrollStackExample from './ScrollStackExample.jsx';
  import AIEcosystemSection from './AIEcosystemSection.jsx';
  import ChromaGrid from './ChromaGrid.jsx';
  import Navbar from './Navbar.jsx';
  import Footer from "./Footer.jsx";
  import ContactUsSection from "./ContactUsSection.jsx";



  const splitText = "OUR STORY".split("");
  const letterVariants = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 }
  };
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.07
      }
    }
  };
  const placeholderVariants = {
    initial: { scale: 0.7, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0 }
  };
  const staggerDelays = [0.0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8];
  const zPhotoPlaceholders = [
    { top: 10, left: -5, sizeClasses: 'w-24 h-16 sm:w-28 sm:h-20 md:w-32 md:h-24 lg:w-40 lg:h-32 xl:w-56 xl:h-44', rotate: -8 },
    { top: 0, left: 140, sizeClasses: 'w-24 h-16 sm:w-28 sm:h-20 md:w-32 md:h-24 lg:w-40 lg:h-32 xl:w-56 xl:h-44', rotate: 4 },
    { top: 100, left: 280, sizeClasses: 'w-24 h-16 sm:w-28 sm:h-20 md:w-32 md:h-24 lg:w-40 lg:h-32 xl:w-56 xl:h-44', rotate: -5 },
    { top: 200, left: 180, sizeClasses: 'w-24 h-16 sm:w-28 sm:h-20 md:w-32 md:h-24 lg:w-40 lg:h-32 xl:w-56 xl:h-44', rotate: 8 },
    { top: 220, left: 0, sizeClasses: 'w-24 h-16 sm:w-28 sm:h-20 md:w-32 md:h-24 lg:w-40 lg:h-32 xl:w-56 xl:h-44', rotate: 0 },
    { top: 380, left: 120, sizeClasses: 'w-24 h-16 sm:w-28 sm:h-20 md:w-32 md:h-24 lg:w-40 lg:h-32 xl:w-56 xl:h-44', rotate: 0 }
  ];
  const photoLayout = [
    { top: 30, left: 0, rotate: -8 },
    { top: 70, left: 110, rotate: 4 },
    { top: 110, left: 220, rotate: -5 },
    { top: 40, left: 230, rotate: 8 }
  ];
  const zPhotoImages = [
    "https://thebusinessfame.com/wp-content/uploads/2021/01/watermark-oimages-05.jpg",
    "https://www.kdmevents.co.uk/_cache/is-event-management-503x327.jpg",
    "https://img.freepik.com/premium-vector/event-management-wedding-planner-manager-planning-event-conference-party_501813-2157.jpg",
    "https://5.imimg.com/data5/SELLER/Default/2023/3/295133854/TJ/YR/WW/156624171/event-management-website-services-500x500.jpg",
    "https://www.ticketfairy.com/blog/wp-content/uploads/2022/11/event-planning-skills-feature.jpg",
    "https://cdn.dribbble.com/userupload/19454256/file/original-227e70d853258834b8cb6c7e447562d8.gif",
  ];


  // Blob animation variants for mobile
  const blobVariants = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 6,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
  };

  // Optimized Scroll Spy Hook with IntersectionObserver
  const useOptimizedScrollSpy = (sectionMapping, offset = 100) => {
      const [activeSection, setActiveSection] = useState('');

      useEffect(() => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                // Map the actual section ID to the navbar section ID
                const navbarSectionId = sectionMapping[entry.target.id];
                setActiveSection(navbarSectionId || entry.target.id);
              }
            });
          },
          {
            rootMargin: `-${offset}px 0px -50% 0px`,
            threshold: 0.1
          }
        );

        Object.keys(sectionMapping).forEach(id => {
          const element = document.getElementById(id);
          if (element) observer.observe(element);
        });

        return () => observer.disconnect();
      }, [sectionMapping, offset]);

      return activeSection;
  };

  export default function HeroSplitScreen() {
    const [windowWidth, setWindowWidth] = useState(0);
    const [activeSection, setActiveSection] = useState('our-story'); // Default to our-story
    
    // Custom scroll spy for our-story page
    useEffect(() => {
      const handleScroll = () => {
        const contactSection = document.getElementById('our-contact');
        if (contactSection) {
          const rect = contactSection.getBoundingClientRect();
          // If contact section is in view (with some offset), set contact as active
          if (rect.top <= 200) { // 200px offset from top
            setActiveSection('contact');
          } else {
            setActiveSection('our-story');
          }
        }
      };

      // Set initial state
      handleScroll();
      
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
      // Scroll to top when component mounts
      window.scrollTo(0, 0);
      
      setWindowWidth(window.innerWidth);

      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getChromaGridRadius = () => {
      if (windowWidth >= 1024) {
        return 300;
      } else if (windowWidth >= 768) {
        return 200;
      } else {
        return 100;
      }
    };

    const getChromaGridClassName = () => {
      return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 lg:gap-16";
    };

    // Determine if it's a mobile view based on the md breakpoint (768px)
    const isMobile = windowWidth < 768;

    return (
     <div className="bg-gradient-to-br from-purple-50 via-white to-purple-100 text-gray-900 font-sans min-h-screen overflow-x-hidden">
        <Navbar activeSection={activeSection} />

    <div className="w-full flex flex-col md:flex-row relative pt-16 box-border">
          {isMobile && (
<motion.div
  className="absolute inset-0 z-0 opacity-30"
  variants={blobVariants}
  animate="animate"
>
  <div
    className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-purple-300 blur-3xl opacity-60"
    style={{ animation: 'pulse 8s infinite ease-in-out' }}
  />
  <div
    className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-purple-200 blur-3xl opacity-60"
    style={{ animation: 'pulse-reverse 8s infinite ease-in-out' }}
  />
</motion.div>
          )}
          
          <style>
            {`
              @keyframes pulse {
                0% { transform: scale(1) translateX(0); }
                50% { transform: scale(1.1) translateX(10px); }
                100% { transform: scale(1) translateX(0); }
              }
              @keyframes pulse-reverse {
                0% { transform: scale(1) translateX(0); }
                50% { transform: scale(1.1) translateX(-10px); }
                100% { transform: scale(1) translateX(0); }
              }
            `}
          </style>

          {/* Left Panel: Animated Heading */}
          <motion.div
className="flex-1 flex flex-col justify-center items-start px-4 sm:px-8 md:px-16 lg:px-20 py-16 z-20 text-center md:text-left"
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 60 }}
            viewport={{ once: true, amount: 0.3 }}
          >
<motion.h3
  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-widest text-transparent uppercase mb-4 md:mb-8 mt-8 hidden md:flex md:flex-wrap md:justify-start"
  style={{ WebkitTextStroke: "1.5px #6b21a8" }}
              variants={containerVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.3 }}
            >
              {splitText.map((char, idx) => (
                <motion.span
                  key={idx}
                  variants={letterVariants}
                  className="inline-block"
                  style={{ minWidth: char === " " ? "0.5em" : undefined }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.h3>

            <div className="w-full" style={{ transitionDelay: "0.3s" }}>
<span
  className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-1 sm:mb-2 tracking-wide text-center md:text-left"
  style={{ fontFamily: "'Poppins', Arial, sans-serif" }}
>
  WE BELIEVE IN EMPOWERING
</span>
            </div>

            <div className="w-full" style={{ transitionDelay: "0.5s" }}>
<span
  className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-purple-600 mb-1 sm:mb-2 tracking-wide text-center md:text-left"
  style={{ fontFamily: "'Poppins', Arial, sans-serif" }}
>
  CREATIVITY & <br className="hidden sm:block" />
  SIMPLICITY
</span>
            </div>

            <div className="w-full" style={{ transitionDelay: "0.7s" }}>
<p
  className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed mt-2 sm:mt-4 max-w-full md:max-w-xl lg:max-w-2xl font-medium text-center md:text-left"
  style={{
    fontFamily: "'Poppins', 'Montserrat', Arial, sans-serif",
    textShadow: "none",
  }}
>
  The event management world faces many challenges today, but no community is better equipped than ours to overcome them. Through passion, innovation, and collaboration, we lead the way forward.
</p>
            </div>
          </motion.div>

          {/* Right Panel: Z-shaped Placeholders */}
<div
className="flex-1 hidden lg:flex items-center justify-center bg-gradient-to-br from-purple-50 to-white overflow-hidden relative">
  <div
    className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl w-11/12 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl aspect-square relative flex items-center justify-center border border-purple-100"
    style={{ boxShadow: "0 20px 40px rgba(139, 92, 246, 0.15)" }}
  >
              {zPhotoPlaceholders.map((pos, idx) => {
                const imgURL = zPhotoImages[idx];
                const styleCommon = {
                  position: "absolute",
                  border: "4px solid #fff",
                  borderRadius: 5,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.13)",
                  zIndex: idx + 1,
                  top: pos.top,
                  left: pos.left,
                  transform: `rotate(${pos.rotate}deg)`,
                };
                const responsiveImageClasses = `${pos.sizeClasses} object-cover`;

                return imgURL ? (
                  <a
                    key={idx}
                    href={imgURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      position: "absolute",
                      zIndex: idx + 1,
                      top: pos.top,
                      left: pos.left,
                      transform: `rotate(${pos.rotate}deg)`,
                    }}
                  >
                    <motion.img
                      src={imgURL}
                      alt={`photo ${idx + 1}`}
                      className={responsiveImageClasses}
                      style={{
                        border: "4px solid #fff",
                        borderRadius: 5,
                        boxShadow: "0 6px 20px rgba(0,0,0,0.13)",
                      }}
                      variants={placeholderVariants}
                      initial="initial"
                      animate="animate"
                      transition={{
                        type: "spring",
                        stiffness: 80,
                        damping: 18,
                        delay: staggerDelays[idx]
                      }}
                      onError={(e) => { e.target.src = "https://placehold.co/220x170/cccccc/000000?text=Error"; }}
                    />
                  </a>
                ) : (
                  <motion.div
                    key={idx}
                    className={`${responsiveImageClasses} bg-gray-700`}
                    style={styleCommon}
                    variants={placeholderVariants}
                    initial="initial"
                    animate="animate"
                    transition={{
                      type: "spring",
                      stiffness: 80,
                      damping: 18,
                      delay: staggerDelays[idx]
                    }}
                  />
                );
              })}
            </div>
          </div>

        </div>

        <AboutUsSection />
        <AIEcosystemSection />
  <section id="our-contact" className="pt-20">
    <ContactUsSection />
  </section>
            <Footer />
      </div>
    );
  }