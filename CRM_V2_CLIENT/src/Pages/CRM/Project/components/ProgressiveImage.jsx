import React, { useState, useEffect, useRef } from "react";
import { Blurhash } from 'react-blurhash';

/**
 * ProgressiveImage — fallback priority approach:
 *   Layer 1 (bottom): Blurhash
 *   Layer 2: thumbSrc (fades in)
 *   Layer 3 (top): lowResSrc (fades in)
 *   If lowResSrc and thumbSrc are missing, falls back to originalSrc via props.
 */
export const ProgressiveImage = ({ thumbSrc, lowResSrc, originalSrc, alt, width, height, blurhash, className, objectFit = "cover" }) => {
  const [inView, setInView] = useState(false);
  const containerRef = useRef(null);

  const thumbRef = useRef(null);
  const lowResRef = useRef(null);
  const originalRef = useRef(null);

  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [lowResLoaded, setLowResLoaded] = useState(false);
  const [originalLoaded, setOriginalLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { rootMargin: "300px" }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setThumbLoaded(false);
    setLowResLoaded(false);
    setOriginalLoaded(false);
  }, [thumbSrc, lowResSrc, originalSrc]);

  useEffect(() => {
    if (!inView) return;
    if (thumbRef.current?.complete && thumbRef.current.naturalWidth > 0) setThumbLoaded(true);
    if (lowResRef.current?.complete && lowResRef.current.naturalWidth > 0) setLowResLoaded(true);
    if (originalRef.current?.complete && originalRef.current.naturalWidth > 0) setOriginalLoaded(true);
  }, [inView, thumbSrc, lowResSrc, originalSrc]);

  const aspectRatio = width && height ? (height / width) * 100 : null;
  
  // Decide which final source to show: prefer low-res if available, otherwise use original
  const finalSrc = lowResSrc || originalSrc;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        background: "#e5e7eb",
        ...(aspectRatio ? { paddingBottom: `${aspectRatio}%` } : { minHeight: "100px", height: "100%" }),
      }}
      className="progressive-image-container"
    >
      {/* Layer 1: Blurhash (base placeholder, under images) */}
      {blurhash && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Blurhash
            hash={blurhash}
            width="100%"
            height="100%"
            resolutionX={32}
            resolutionY={32}
            punch={1}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>
      )}

      {/* Layer 2: Thumb preview (if provided) */}
      {inView && thumbSrc && (
        <img
          ref={thumbRef}
          src={thumbSrc}
          alt={alt}
          onLoad={() => setThumbLoaded(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit,
            opacity: thumbLoaded ? 1 : 0,
            transition: "opacity 0.15s ease-in-out",
            zIndex: 1,
          }}
          className={className}
        />
      )}

      {/* Layer 3: Low-res or original image */}
      {inView && finalSrc && (
        <img
          ref={finalSrc === lowResSrc ? lowResRef : originalRef}
          src={finalSrc}
          alt={alt}
          onLoad={() => finalSrc === lowResSrc ? setLowResLoaded(true) : setOriginalLoaded(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit,
            opacity: (finalSrc === lowResSrc ? lowResLoaded : originalLoaded) ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
            zIndex: 2,
          }}
          className={className}
        />
      )}
    </div>
  );
};
