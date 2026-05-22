import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { LeadForm } from './LeadForm'
import { PortfolioMasonry } from './PortfolioMasonry'
import { BANNER_HEIGHT_OPTIONS } from '../types/StudioConfig.js'
import { normalizeUrl } from '../utils/formatUtils'

// ─── Stable style injection ───────────────────────────────────────────────────
// We write to a single persistent <style> node instead of letting React
// re-inject <style>{styles}</style> on every render. React re-rendering a
// <style> tag causes the browser to re-parse CSS + trigger a full layout
// reflow every time, which is the root cause of scroll jank.
function useInjectedStyle(id, css) {
  useEffect(() => {
    let el = document.getElementById(id)
    if (!el) {
      el = document.createElement('style')
      el.id = id
      document.head.appendChild(el)
    }
    el.textContent = css
    return () => {
      // cleanup when component unmounts
      const node = document.getElementById(id)
      if (node) node.remove()
    }
  }, [id, css]) // only fires when css string actually changes
}
// ─────────────────────────────────────────────────────────────────────────────

export const PreviewCanvas = ({ config, onSubmit, isSubmitting = false, publicMode = false }) => {
  const formRef = useRef(null)

  // Track viewport width to switch mobile/desktop banner in JS rather than CSS media query.
  // CSS media queries fire on viewport width, so <picture><source> never switches inside
  // the editor preview (desktop viewport). JS-based approach works everywhere.
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth <= 768)
  useEffect(() => {
    const handler = () => setIsMobileView(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const activeBannerImage = (config.bannerImageMobile && isMobileView)
    ? config.bannerImageMobile
    : config.bannerImage

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const accent = config.accentColor || '#D4AF37'

  // Banner height — connected to BANNER_HEIGHT_OPTIONS
  // We map the tailwind h-* values to pixel equivalents for use inside our
  // custom CSS (Tailwind classes don't work inside a <style> string).
  const bannerHeightPx = useMemo(() => {
    const val = config.banner?.height || 'large'
    const map = { small: '60vh', medium: '80vh', large: '100vh' }
    return map[val] || '100vh'
  }, [config.banner?.height])

  // Overlay darkness — connected to config.banner.overlay (0–100)
  const overlayOpacity = useMemo(() => {
    return ((config.banner?.overlay ?? 50) / 100).toFixed(2)
  }, [config.banner?.overlay])

  const objectPosition = config.banner?.objectPosition || 'center'

  // CSS string — only rebuilds when these specific values change
  const styles = useMemo(() => `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500&display=swap');

    * { box-sizing: border-box; }
    .pvc-wrap { min-height: 100vh; background: #faf8f4; font-family: 'Inter', sans-serif; color: #1a1a1a; }

    .pvc-hero {
      position: relative;
      height: ${bannerHeightPx};
      min-height: 500px;
      overflow: hidden;
      display: flex;
      align-items: flex-end;
    }
    .pvc-hero-bg { position: absolute; inset: 0; }
    .pvc-hero-bg img {
      display: block;
      width: 100%; height: 100%; object-fit: cover;
      object-position: ${objectPosition};
      will-change: transform;
    }
    .pvc-hero-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,${overlayOpacity});
      pointer-events: none;
    }
    .pvc-hero-gradient {
      position: absolute; inset: 0;
      background: linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 75%, #faf8f4 100%);
      pointer-events: none;
    }
    .pvc-hero-content {
      position: relative; z-index: 2;
      padding: 0 64px 100px; width: 100%;
      color: #fff;
    }
    .pvc-hero-content h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 88px; font-weight: 400; margin: 0 0 12px;
      line-height: 0.9; letter-spacing: -2px;
      color: #fff;
    }
    .pvc-hero-eyebrow {
      font-size: 11px; letter-spacing: 4px; text-transform: uppercase;
      color: ${accent}; margin-bottom: 16px; font-weight: 500;
    }
    .pvc-hero-content p {
      color: rgba(255,255,255,0.65); font-size: 17px; font-weight: 300; margin: 0;
      max-width: 380px; line-height: 1.6;
    }
    .pvc-hero-actions { display: flex; align-items: center; gap: 24px; margin-top: 32px; }
    .pvc-cta-btn {
      background: ${accent}; color: #fff;
      border: none; border-radius: 4px; padding: 14px 32px;
      font-size: 13px; font-weight: 500; cursor: pointer;
      font-family: 'Inter', sans-serif;
      letter-spacing: 0.5px;
      box-shadow: 0 0 32px ${accent}55;
    }

    .pvc-body { background: #faf8f4; }

    ${config.backgroundImage ? `
    .pvc-wrap { position: relative; }
    .pvc-dynamic-bg {
      position: ${publicMode ? 'fixed' : 'absolute'};
      inset: 0;
      z-index: 0;
      background-image: url(${normalizeUrl(config.backgroundImage)});
      background-size: cover;
      background-position: center;
      opacity: 0.15;
      pointer-events: none;
    }
    .pvc-hero, .pvc-body { position: relative; z-index: 1; background: transparent; }
    ` : ''}

    /* ── MARQUEE STRIP ── */
    .pvc-marquee-wrap {
      overflow: hidden;
      position: relative;
      padding: 0;
      mask-image: linear-gradient(to right, transparent 0%, #faf8f4 6%, #faf8f4 94%, transparent 100%);
      -webkit-mask-image: linear-gradient(to right, transparent 0%, #faf8f4 6%, #faf8f4 94%, transparent 100%);
    }
    .pvc-marquee-track {
      display: flex;
      gap: 4px;
      width: max-content;
      animation: marqueeScroll 35s linear infinite;
      /* promote to GPU layer so marquee animation doesn't repaint the page */
      will-change: transform;
    }
    .pvc-marquee-track:hover { animation-play-state: paused; }
    @keyframes marqueeScroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .pvc-strip-item { flex: 0 0 280px; height: 210px; overflow: hidden; border-radius: 4px; }
    .pvc-strip-item img {
      width: 100%; height: 100%; object-fit: cover;
      filter: grayscale(25%) brightness(0.9);
      transition: filter 0.4s, transform 0.4s;
      cursor: pointer;
    }
    .pvc-strip-item:hover img { filter: grayscale(0%) brightness(1.05); transform: scale(1.04); }

    .pvc-center { max-width: 720px; margin: 0 auto; padding: 0 32px; }

    .pvc-section-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 48px; font-weight: 400; color: #1a1a1a;
      margin: 72px 0 6px; line-height: 1;
    }
    .pvc-section-sub { color: #888; font-size: 13px; font-weight: 300; margin: 0 0 28px; letter-spacing: 0.5px; }
    .pvc-rule { width: 40px; height: 2px; background: ${accent}; margin: 12px 0 28px; border-radius: 2px; }

    .pvc-video-stack { display: flex; flex-direction: column; gap: 20px; }
    .pvc-video-item {
      border-radius: 10px; overflow: hidden; background: #fff;
      border: 1px solid rgba(0,0,0,0.07);
      box-shadow: 0 2px 16px rgba(0,0,0,0.04);
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .pvc-video-item:hover { border-color: ${accent}55; box-shadow: 0 6px 24px rgba(0,0,0,0.09); }
    .pvc-video-embed { position: relative; padding-top: 56.25%; }
    .pvc-video-embed iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
    .pvc-video-label {
      padding: 14px 18px;
      display: flex; justify-content: space-between; align-items: center;
      background: #fff;
    }
    .pvc-video-label h4 { margin: 0; font-size: 14px; font-weight: 500; color: #1a1a1a; }
    .pvc-video-label p { margin: 0; font-size: 12px; color: #aaa; }
    .pvc-play-dot {
      width: 28px; height: 28px; border-radius: 50%;
      background: ${accent}18; border: 1px solid ${accent}55;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; color: ${accent};
    }

    .pvc-about {
      margin: 72px 0 0;
    }
    .pvc-about-content { }
    .pvc-about-eyebrow {
      font-size: 10px; letter-spacing: 4px; text-transform: uppercase;
      color: ${accent}; margin-bottom: 10px; font-weight: 600;
    }
    .pvc-about-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 42px; font-weight: 400; color: #1a1a1a;
      margin: 0 0 16px; line-height: 1.1;
    }
    .pvc-about-desc {
      font-size: 15px; color: #555; line-height: 1.8;
      margin: 0; font-weight: 300; max-width: 560px;
      white-space: pre-line;
    }

    .pvc-form-wrap {
      margin: 72px 0 0;
      background: #fff; border-radius: 16px; overflow: hidden;
      border: 1px solid rgba(0,0,0,0.07);
      box-shadow: 0 4px 32px rgba(0,0,0,0.07);
    }
    .pvc-form-accent-bar { height: 4px; background: linear-gradient(to right, ${accent}, ${accent}88); }
    .pvc-form-header { padding: 36px 40px 24px; }
    .pvc-form-header h2 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 38px; color: #1a1a1a; margin: 0 0 6px;
    }
    .pvc-form-header p { color: #888; font-size: 14px; margin: 0; }
    .pvc-form-inner { padding: 24px 40px 40px; }

    .pvc-form-inner form {
      display: grid !important;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .pvc-form-inner form > * { margin-top: 0 !important; }
    .pvc-form-inner form > button[type="submit"] {
      grid-column: 1 / -1;
      margin-top: 8px !important;
    }

    @media (max-width: 900px) {
      .pvc-hero-content { padding: 0 40px 80px; }
      .pvc-hero-content h1 { font-size: 64px; }
      .pvc-section-title { font-size: 40px; }
    }
    @media (max-width: 768px) {
      .pvc-hero-content h1 { font-size: 56px; }
      .pvc-hero-content { padding: 0 28px 72px; }
      .pvc-form-inner { padding: 20px 24px 32px; }
      .pvc-form-header { padding: 24px; }
      .pvc-strip-item { flex: 0 0 200px; height: 150px; }
    }
    @media (max-width: 560px) {
      .pvc-hero-content { padding: 0 24px 60px; }
      .pvc-hero-content h1 { font-size: 48px; }
      .pvc-hero-content p { font-size: 15px; }
      .pvc-form-inner form { grid-template-columns: 1fr !important; gap: 12px; }
      .pvc-form-inner { padding: 20px 20px 32px; }
      .pvc-form-header { padding: 24px 20px; }
      .pvc-form-header h2 { font-size: 28px; }
    }

    .pvc-footer { text-align: center; padding: 48px 32px 32px; font-size: 12px; color: #ccc; }
    .pvc-footer span { color: #888; font-weight: 500; }
  `, [accent, config.backgroundImage, publicMode, bannerHeightPx, overlayOpacity, objectPosition])

  // Inject styles into a stable <style> node — avoids React re-injecting on every render
  useInjectedStyle('pvc-styles', styles)

  const portfolioImages = useMemo(() => {
    const all = publicMode
      ? (config.portfolio || config.portfolioImages || [])
      : (config.portfolio || config.portfolioImages || []).slice(0, 10)
    if (config.portfolioSelected && config.portfolioSelected.length > 0) {
      return all.filter(img => {
        const url = img.url || img.src || img
        return config.portfolioSelected.includes(url)
      })
    }
    return all
  }, [config.portfolio, config.portfolioImages, config.portfolioSelected, publicMode])

  const duplicated = useMemo(() =>
    portfolioImages.length > 0
      ? [...portfolioImages, ...portfolioImages, ...portfolioImages]
      : [],
    [portfolioImages]
  )

  const getOutputVideoId = useCallback((url) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }, [])

  return (
    <div className="pvc-wrap">
      {config.backgroundImage && <div className="pvc-dynamic-bg" />}

      {/* Hero */}
      <div className="pvc-hero">
        {activeBannerImage && config.banner?.show !== false && (
          <div className="pvc-hero-bg">
            <img
              src={normalizeUrl(activeBannerImage)}
              alt="banner"
              width="1920"
              height="1080"
            />
          </div>
        )}
        {/* Darkness overlay — driven by config.banner.overlay */}
        <div className="pvc-hero-overlay" />
        {/* Bottom fade to page bg */}
        {config.banner?.showGradient !== false && (
          <div className="pvc-hero-gradient" />
        )}
        <div className="pvc-hero-content">
          <h1>{config.studioName}</h1>
          {config.tagline && <p>{config.tagline}</p>}
          <div className="pvc-hero-actions">
            <button className="pvc-cta-btn" onClick={scrollToForm}>Book Your Story</button>
          </div>
        </div>
      </div>

      <div className="pvc-body">

        {/* Marquee strip */}
        {duplicated.length > 0 && (
          <div className="pvc-marquee-wrap">
            <div
              className="pvc-marquee-track"
              style={{ animationDuration: `${Math.max(35, duplicated.length * 3)}s` }}
            >
              {duplicated.map((img, i) => (
                <div className="pvc-strip-item" key={`${img.id || ''}-${i}`}>
                  <img
                    src={normalizeUrl(img.url || img.src || img)}
                    alt={img.alt || 'portfolio'}
                    loading="lazy"
                    width="280"
                    height="210"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pvc-center">

          {/* About Us */}
          {(config.aboutUs?.title || config.aboutUs?.description) && (
            <div className="pvc-about">
              <div className="pvc-about-content">
                <p className="pvc-about-eyebrow">About Us</p>
                {config.aboutUs.title && (
                  <h2 className="pvc-about-title">{config.aboutUs.title}</h2>
                )}
                {config.aboutUs.description && (
                  <p className="pvc-about-desc">{config.aboutUs.description}</p>
                )}
              </div>
            </div>
          )}

          {/* Videos */}
          {config.youtubeLinks?.length > 0 && (
            <>
              <h2 className="pvc-section-title">Cinematic Films</h2>
              <p className="pvc-section-sub">Stories we've had the privilege to tell</p>
              <div className="pvc-video-stack">
                {config.youtubeLinks.map((v, i) => {
                  const embedId = getOutputVideoId(v.url)
                  if (!embedId) return null
                  return (
                    <div className="pvc-video-item" key={v.id || i}>
                      <div className="pvc-video-embed">
                        <iframe
                          src={`https://www.youtube.com/embed/${embedId}`}
                          title={v.title || 'Video'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                      {(v.title || v.subtitle) && (
                        <div className="pvc-video-label">
                          <div>
                            {v.title && <h4>{v.title}</h4>}
                            {v.subtitle && <p>{v.subtitle}</p>}
                          </div>
                          <div className="pvc-play-dot">▶</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Form */}
          <div className="pvc-form-wrap" ref={formRef}>
            <div className="pvc-form-accent-bar" />
            <div className="pvc-form-header">
              <h2>{config.form?.title || 'Book Your Story'}</h2>
              <p>{config.form?.description || "Tell us about your event and we'll get back to you shortly"}</p>
            </div>
            <div className="pvc-form-inner">
              <LeadForm
                config={config}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>

          {!publicMode && (
            <div className='mt-8 text-center'>
              <p className='text-xs sm:text-sm text-gray-600 bg-white/90 backdrop-blur-sm inline-block px-5 py-2.5 rounded-full shadow-sm border border-gray-200'>
                👁️ Preview Mode - This is how your form will appear to clients
              </p>
            </div>
          )}

        </div>

        <div className="pvc-footer">Powered by <span>Plexis</span></div>
      </div>
    </div>
  )
}