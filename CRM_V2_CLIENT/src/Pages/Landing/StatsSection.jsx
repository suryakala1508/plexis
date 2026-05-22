import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';

const Counter = ({ value, duration = 1.5, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (inView) {
      const controls = animate(0, value, {
        duration: duration,
        onUpdate: (latest) => setCount(Math.floor(latest)),
        ease: "easeOut"
      });
      return () => controls.stop();
    }
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
};

const StatsSection = () => {
  const stats = [
    { label: "Studios", value: 50, suffix: "+" },
    { label: "Projects", value: 100, suffix: "+" },
    { label: "Leads and Clients", value: 1000, suffix: "+" },
  ];

  return (
    <section className="py-8 md:py-14 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-100/50 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center mb-10 md:mb-16"
        >
          <p 
            className="text-[10px] md:text-[11px] uppercase tracking-[0.5em] text-purple-600 font-bold mb-2 text-center"
            style={{ fontFamily: "'Lexend Deca', sans-serif" }}
          >
            Our Growing Ecosystem
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center justify-items-center">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              <motion.div 
                className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-1 md:mb-2"
                style={{ fontFamily: "'Poppins', sans-serif" }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Counter value={stat.value} suffix={stat.suffix} />
              </motion.div>
              <p 
                className="text-purple-600/80 font-bold text-[10px] md:text-xs uppercase tracking-[0.3em] text-center w-full"
                style={{ 
                  fontFamily: "'Lexend Deca', sans-serif",
                  paddingRight: index < 2 ? '0.4em' : '0', // Shift first two slightly left
                  paddingLeft: index === 2 ? '0.3em' : '0' // Keep last one centered
                }}
              >
                {stat.label === "Leads and Clients" ? "Leads & Clients" : stat.label}
              </p>
              
              {/* Subtle divider for mobile */}
              {index < stats.length - 1 && (
                <div className="w-12 h-px bg-gray-100 mt-8 md:hidden" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
