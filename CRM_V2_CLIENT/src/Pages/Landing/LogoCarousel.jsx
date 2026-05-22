import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// Import local studio logos
import tinyHugsLogo from "../../assets/studio_logo/Tiny_hugs.png";
import visionEyeLogo from "../../assets/studio_logo/vision_eye.png";
import krashshaLogo from "../../assets/studio_logo/Krasha_PhotoGraphy.jpg";
import promiseChapterLogo from "../../assets/studio_logo/The_Promise_Chapter.png";
import gkStudiozLogo from "../../assets/studio_logo/Gk_Studioz.jpg";

const LogoCarousel = () => {
  const scrollRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const logos = [
    { name: 'Vision Eye Photography', src: visionEyeLogo },
    { name: 'Tiny Hugs Photography', src: tinyHugsLogo },
    { name: 'Krasha Photography', src: krashshaLogo },
    { name: 'The Promise Chapter', src: promiseChapterLogo },
    { name: 'GK Studioz', src: gkStudiozLogo },
  ];

  // Tripled for seamless loop with no gaps
  const displayLogos = [...logos, ...logos, ...logos];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll for mobile & tablet (below lg)
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || !isMobile) return;

    let animationFrameId;
    const scroll = () => {
      scrollContainer.scrollLeft += 1.2;

      // Reset to start of second copy to loop seamlessly
      const oneThird = scrollContainer.scrollWidth / 3;
      if (scrollContainer.scrollLeft >= oneThird * 2) {
        scrollContainer.scrollLeft = oneThird;
      }

      animationFrameId = requestAnimationFrame(scroll);
    };

    // Start at second copy so reset never shows a jump
    scrollContainer.scrollLeft = scrollContainer.scrollWidth / 3;
    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isMobile]);

  return (
    <section className="py-6 md:py-2 bg-white/10 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-8 max-w-6xl">

        {/* Section Header */}
        <motion.div
          className="flex flex-col items-center text-center mb-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[11px] uppercase tracking-[0.38em] text-violet-500 font-semibold mb-3">
            Our Studio Partners
          </p>
        </motion.div>

        {/* MOBILE & TABLET: Carousel */}
        {isMobile && (
          <div
            ref={scrollRef}
            className="flex overflow-x-auto no-scrollbar"
            style={{ gap: '0px' }} // No gap = no white flashes between logos
          >
            <style>{`
              .no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {displayLogos.map((logo, index) => {
              const sizeIndex = index % logos.length;
              let sizeClass = "h-24";
              if (sizeIndex === 2) sizeClass = "h-20";
              else if (sizeIndex === 3) sizeClass = "h-16";
              else if (sizeIndex === 4) sizeClass = "h-18";

              return (
                <div
                  key={`${logo.name}-${index}`}
                  className="flex-shrink-0 flex items-center justify-center px-8"
                >
                  <div className={`relative flex items-center justify-center ${sizeClass}`}>
                    <img
                      src={logo.src}
                      alt={`${logo.name} logo`}
                      className="h-full w-auto object-contain opacity-100"
                      loading="eager"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DESKTOP: Static Grid — untouched from your original */}
        {!isMobile && (
          <div className="grid grid-cols-5 items-center justify-center gap-6">
            {logos.map((logo, index) => {
              let sizeClass = "h-16 sm:h-30 md:h-46";
              if (index === 2) sizeClass = "h-14 sm:h-26 md:h-40";
              else if (index === 3) sizeClass = "h-10 sm:h-22 md:h-33";
              else if (index === 4) sizeClass = "h-12 sm:h-24 md:h-36";

              let customStyle = {};
              if (index === 3) customStyle = { marginLeft: '-14px', marginTop: '8px' };
              if (index === 4) customStyle = { marginTop: '4px',marginLeft: '-24px' };

              return (
                <motion.div
                  key={logo.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.12 }}
                  className="group flex flex-col items-center justify-center"
                  style={customStyle}
                >
                  <div className={`relative flex items-center justify-center w-full ${sizeClass} sm:w-50 md:w-72 transition-transform duration-500`}>
                    <img
                      src={logo.src}
                      alt={`${logo.name} logo`}
                      className="max-h-full max-w-[80%] sm:max-w-full object-contain opacity-100"
                      loading="eager"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};

export default LogoCarousel;