import { useRef, useEffect } from "react";
import { gsap } from "gsap";

const ChromaGrid = ({
  items,
  className = "", // This className will now receive the grid classes from the parent
  cardClassName = "",
  radius = 300,
  damping = 0.45,
  fadeOut = 0.6,
  ease = "power3.out",
}) => {
  const rootRef = useRef(null);
  const fadeRef = useRef(null);
  const setX = useRef(null);
  const setY = useRef(null);
  const pos = useRef({ x: 0, y: 0 });

  const data = items;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setX.current = gsap.quickSetter(el, "--x", "px");
    setY.current = gsap.quickSetter(el, "--y", "px");
    const { width, height } = el.getBoundingClientRect();
    pos.current = { x: width / 2, y: height / 2 };
    setX.current(pos.current.x);
    setY.current(pos.current.y);
  }, []);

  const moveTo = (x, y) => {
    gsap.to(pos.current, {
      x,
      y,
      duration: damping,
      ease,
      onUpdate: () => {
        setX.current?.(pos.current.x);
        setY.current?.(pos.current.y);
      },
      overwrite: true,
    });
  };

  const handleMove = (e) => {
    const r = rootRef.current.getBoundingClientRect();
    moveTo(e.clientX - r.left, e.clientY - r.top);
    gsap.to(fadeRef.current, { opacity: 0, duration: 0.25, overwrite: true });
  };

  const handleLeave = () => {
    gsap.to(fadeRef.current, {
      opacity: 1,
      duration: fadeOut,
      overwrite: true,
    });
  };

  const handleCardClick = (url) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCardMove = (e) => {
    const c = e.currentTarget;
    const rect = c.getBoundingClientRect();
    // Corrected template literals
    c.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    c.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={rootRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      // Corrected template literals
      className={`relative w-full h-full p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 flex flex-col items-center justify-center gap-6 sm:gap-8 md:gap-10 lg:gap-16 ${className}`}
      style={{
        "--r": `${radius}px`,
        "--x": "50%",
        "--y": "50%",
        background: "linear-gradient(to bottom right, #1d1d37, #291f48)",
        borderRadius: 32, // optional for curved edge
      }}
    >
      {data.map((c, i) => (
        <article
          key={i}
          onMouseMove={handleCardMove}
          onClick={() => handleCardClick(c.url)}
          // Corrected template literals
          className={`group relative flex flex-col rounded-[28px] overflow-hidden border-2 border-transparent transition-colors duration-300 cursor-pointer shadow-xl bg-white mx-auto ${cardClassName}`}
          style={{
            "--card-border": c.borderColor || "transparent",
            background: c.gradient,
            "--spotlight-color": "rgba(255,255,255,0.3)",
          }}
        >
          {/* This div creates the spotlight effect, hidden on mobile/tablet */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-20 opacity-0 group-hover:opacity-30 hidden lg:block"
            style={{
              background:
                "radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.1), transparent 90%)",
            }}
          />

          <div className="relative z-10 flex-1 p-0 box-border flex flex-col items-center">
            <img
              src={c.image}
              alt={c.title}
              loading="lazy"
              // Made image size responsive
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-cover rounded-full mt-4 sm:mt-8 mb-2 shadow-lg"
            />
            <div className="w-full px-4 sm:px-6 pb-2 pt-2 flex flex-col items-center">
              {/* Made title text size responsive */}
              <h3 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-[Montserrat] font-semibold text-black mb-0">{c.title}</h3>
              {/* Made subtitle text size responsive */}
              <div className="uppercase text-gray-400 font-bold text-sm sm:text-base md:text-base lg:text-lg mb-2 tracking-wide">{c.subtitle}</div>
            </div>
          </div>
          {/* Adjusted padding for footer */}
          <footer className="relative z-10 px-4 pb-4 pt-2 sm:px-6 sm:pb-6 bg-gradient-to-t from-gray-100/90 to-white/70 text-black font-sans rounded-b-[28px]">
            {/* Made description text size responsive */}
            <p className="m-0 text-xs sm:text-sm md:text-sm lg:text-base font-medium opacity-90">{c.description}</p>
            <div className="flex justify-end mt-2 sm:mt-4">
              <a href={c.url} target="_blank" rel="noopener noreferrer">
                {/* Made LinkedIn icon size responsive */}
                <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg" alt="LinkedIn" className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              </a>
            </div>
          </footer>
        </article>
      ))}
      {/* This div creates the grayscale/brightness effect, hidden on mobile/tablet */}
      <div
        className="absolute inset-0 pointer-events-none z-30 hidden lg:block"
        style={{
          backdropFilter: "grayscale(1) brightness(0.78)",
          WebkitBackdropFilter: "grayscale(1) brightness(0.78)",
          background: "rgba(0,0,0,0.001)",
          maskImage:
            "radial-gradient(circle var(--r) at var(--x) var(--y),transparent 0%,transparent 15%,rgba(0,0,0,0.10) 30%,rgba(0,0,0,0.22)45%,rgba(0,0,0,0.35)60%,rgba(0,0,0,0.50)75%,rgba(0,0,0,0.68)88%,white 100%)",
          WebkitMaskImage:
            "radial-gradient(circle var(--r) at var(--x) var(--y),transparent 0%,transparent 15%,rgba(0,0,0,0.10) 30%,rgba(0,0,0,0.22)45%,rgba(0,0,0,0.35)60%,rgba(0,0,0,0.50)75%,rgba(0,0,0,0.68)88%,white 100%)",
        }}
      />
      {/* This div creates the fade effect, hidden on mobile/tablet */}
      <div
        ref={fadeRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-[250ms] z-40 hidden lg:block"
        style={{
          backdropFilter: "grayscale(1) brightness(0.78)",
          WebkitBackdropFilter: "grayscale(1) brightness(0.78)",
          background: "rgba(0,0,0,0.001)",
          maskImage:
            "radial-gradient(circle var(--r) at var(--x) var(--y),white 0%,white 15%,rgba(255,255,255,0.90)30%,rgba(255,255,255,0.78)45%,rgba(255,255,255,0.65)60%,rgba(255,255,255,0.50)75%,rgba(255,255,255,0.32)88%,transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(circle var(--r) at var(--x) var(--y),white 0%,white 15%,rgba(255,255,255,0.90)30%,rgba(255,255,255,0.78)45%,rgba(255,255,255,0.65)60%,rgba(255,255,255,0.50)75%,rgba(255,255,255,0.32)88%,transparent 100%)",
          opacity: 1,
        }}
      />
    </div>
  );
};

export default ChromaGrid;
