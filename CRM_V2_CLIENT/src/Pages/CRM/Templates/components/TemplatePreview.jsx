import React from 'react'
import { Globe, Mail, Phone, Instagram, Facebook, Youtube, Check, Trash2, Upload } from 'lucide-react'
import { formatIndianCurrency } from '../../../../utils/formatUtils'
import { normalizeSocialLink } from '../../../../utils/socialLinkUtils'

export const TemplatePreview = ({ template, studio }) => {
    if (!template) return null

    const { background = {}, quotationBackground = {}, fields = {}, serviceColumns = {}, customization = {}, welcomeMessage = '' } = template
    const portfolioImages = [...new Set(
        (Array.isArray(customization.portfolioImages) ? customization.portfolioImages : [])
            .map((img) => (typeof img === 'string' ? img.trim() : ''))
            .filter(Boolean)
    )]
    const hasPortfolioImages = portfolioImages.length > 0

    // Default: show section unless explicitly disabled (false)
    // Matches FieldSelector toggle default: checked={fields[key] ?? true}
    const show = (key) => {
        if (key === 'portfolio') return customization.showPortfolio !== false && hasPortfolioImages
        return fields[key] !== false
    }
    const PORTFOLIO_IMAGES_PER_PAGE = 6
    const PORTFOLIO_GRID_COLUMNS = 2
    const PORTFOLIO_GRID_ROWS = 3
    const PORTFOLIO_GRID_INSET = '92%'

    const accent = customization.primaryColor || '#9916b1'
    const headerBg = background.headerColor || customization.headerColor || '#22031f'
    const font = customization.fontFamily || 'Poppins'
    
    // Cell Background Helper
    const hexToRgba = (hex, alpha = 1) => {
        const h = hex.replace('#', '');
        const r = parseInt(h.length === 3 ? h.slice(0, 1).repeat(2) : h.slice(0, 2), 16) || 255;
        const g = parseInt(h.length === 3 ? h.slice(1, 2).repeat(2) : h.slice(2, 4), 16) || 255;
        const b = parseInt(h.length === 3 ? h.slice(2, 3).repeat(2) : h.slice(4, 6), 16) || 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    const cellColor = customization.tableColumnColor || '#ffffff';
    const cellOpacity = customization.tableColumnOpacity !== undefined ? customization.tableColumnOpacity : 1;
    const cellBg = hexToRgba(cellColor, cellOpacity);

    // Build page background style
    const getPageBgStyle = () => {
        if (background.type === 'image' && background.imageUrl) {
            return {
                backgroundImage: `url(${background.imageUrl})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                position: 'relative',
            }
        }
        if (background.type === 'gradient') {
            return {
                background: `linear-gradient(${background.gradientDirection || 'to bottom right'}, ${background.gradientFrom || '#fff'}, ${background.gradientTo || '#f3e8ff'})`,
            }
        }
        return { backgroundColor: background.color || '#ffffff' }
    }

    const pageBgStyle = getPageBgStyle()
    const needsOverlay = background.type === 'image' && background.imageUrl

    const getIntroPageBgConfig = () => customization.introPageBackground || null

    const getIntroPageStyle = () => {
        const introBg = getIntroPageBgConfig()
        if (!introBg) return pageBgStyle

        if (introBg.type === 'image' && introBg.imageUrl) {
            return {
                backgroundImage: `url(${introBg.imageUrl})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                position: 'relative',
            }
        }
        if (introBg.type === 'gradient') {
            return {
                background: `linear-gradient(${introBg.gradientDirection || 'to bottom right'}, ${introBg.gradientFrom || '#fff'}, ${introBg.gradientTo || '#f3e8ff'})`,
            }
        }
        if (introBg.type === 'solid' && introBg.color) {
            return { backgroundColor: introBg.color }
        }
        return pageBgStyle
    }

    const getIntroPageOverlay = () => {
        const introBg = getIntroPageBgConfig()
        if (introBg?.type === 'image' && introBg?.imageUrl) {
            return introBg.imageOpacity ?? 0.15
        }
        if (needsOverlay) {
            return background.imageOpacity ?? 0.15
        }
        return null
    }

    const getPortfolioPageBgConfig = (pageIndex) => {
        const pageKey = `page${pageIndex + 1}`
        const pageMap = customization.portfolioPageBackgrounds || {}
        return pageMap[pageKey] || null
    }

    const getPortfolioPageStyle = (pageIndex) => {
        const pageBg = getPortfolioPageBgConfig(pageIndex)
        if (!pageBg) return pageBgStyle

        if (pageBg.type === 'image' && pageBg.imageUrl) {
            return {
                backgroundImage: `url(${pageBg.imageUrl})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                position: 'relative',
            }
        }
        if (pageBg.type === 'gradient') {
            return {
                background: `linear-gradient(${pageBg.gradientDirection || 'to bottom right'}, ${pageBg.gradientFrom || '#fff'}, ${pageBg.gradientTo || '#f3e8ff'})`,
            }
        }
        if (pageBg.type === 'solid' && pageBg.color) {
            return { backgroundColor: pageBg.color }
        }
        return pageBgStyle
    }

    const getPortfolioPageOverlay = (pageIndex) => {
        const pageBg = getPortfolioPageBgConfig(pageIndex)
        if (pageBg?.type === 'image' && pageBg?.imageUrl) {
            return pageBg.imageOpacity ?? 0.15
        }
        if (needsOverlay) {
            return background.imageOpacity ?? 0.15
        }
        return null
    }

    // Build quotation background style
    const getQuotationBgStyle = () => {
        if (!quotationBackground || Object.keys(quotationBackground).length === 0) return { backgroundColor: '#ffffff' }
        if (quotationBackground.type === 'image' && quotationBackground.imageUrl) {
            return {
                backgroundImage: `url(${quotationBackground.imageUrl})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }
        }
        if (quotationBackground.type === 'gradient') {
            return {
                background: `linear-gradient(${quotationBackground.gradientDirection || 'to bottom right'}, ${quotationBackground.gradientFrom || '#fff'}, ${quotationBackground.gradientTo || '#f3e8ff'})`,
            }
        }
        return { backgroundColor: quotationBackground.color || '#ffffff' }
    }

    const quotationBgStyle = getQuotationBgStyle()
    const needsQuotationOverlay = quotationBackground?.type === 'image' && quotationBackground?.imageUrl
    const socialLinks = {
        website: normalizeSocialLink('website', customization.website),
        youtube: normalizeSocialLink('youtube', customization.youtube),
        facebook: normalizeSocialLink('facebook', customization.facebook),
        instagram: normalizeSocialLink('instagram', customization.instagram),
    }

    const SERVICES = [
        { 
            event: 'Wedding Photography & Cinematic Video', 
            date: '2026-03-16', 
            location: 'Poolside / Lawn', 
            amount: 120000,
            crew: [{name: 'Candid Photographer'}, {name: 'Traditional Photographer'}, {name: 'Cinematographer'}],
            equipment: [{name: 'Drone'}, {name: 'Gimbal'}]
        },
        { 
            event: 'Reception Photography', 
            date: '2026-04-12', 
            location: 'Grand Ballroom', 
            amount: 95000,
            crew: [{name: 'Candid Photographer'}, {name: 'Traditional Photographer'}],
            equipment: []
        },
    ]

    const PageBreakMarker = () => (
        <div className="my-3 flex items-center gap-3 px-1">
            <div className="h-px flex-1 border-t border-dashed border-gray-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Page Break</span>
            <div className="h-px flex-1 border-t border-dashed border-gray-400" />
        </div>
    )

    return (
        <div className="min-h-full bg-gray-200 p-6">
            <div className="max-w-2xl mx-auto" style={{ fontFamily: font }}>

                {/* Relative wrapper so content sits above overlay (if any) */}
                <div className="relative">


                    {/* Portfolio & Cover Section (AT FIRST) */}
                    {show('portfolio') && (
                        <>
                            {/* Page 1: Cover Page — locked to A4 aspect ratio (210:297) */}
                            <div className="w-full relative flex flex-col mb-6 pb-16 rounded-sm shadow-2xl overflow-hidden" style={{ aspectRatio: '210/297', ...pageBgStyle }}>
                                {needsOverlay && (
                                    <div
                                        className="absolute inset-0 z-0 pointer-events-none"
                                        style={{ backgroundColor: `rgba(255,255,255,${background.imageOpacity ?? 0.15})` }}
                                    />
                                )}
                                <div className="relative z-10 pt-8 px-8 flex items-center justify-center gap-4 flex-wrap">
                                    {socialLinks.website ? (
                                        <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center">
                                            <Globe size={16} className="text-gray-700" />
                                        </a>
                                    ) : (
                                        <span className="w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center">
                                            <Globe size={16} className="text-gray-700" />
                                        </span>
                                    )}
                                    {socialLinks.youtube ? (
                                        <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center">
                                            <Youtube size={16} className="text-red-600" />
                                        </a>
                                    ) : (
                                        <span className="w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center">
                                            <Youtube size={16} className="text-red-600" />
                                        </span>
                                    )}
                                    {socialLinks.facebook ? (
                                        <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center">
                                            <Facebook size={16} className="text-blue-600" />
                                        </a>
                                    ) : (
                                        <span className="w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center">
                                            <Facebook size={16} className="text-blue-600" />
                                        </span>
                                    )}
                                    {socialLinks.instagram ? (
                                        <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center">
                                            <Instagram size={16} className="text-pink-600" />
                                        </a>
                                    ) : (
                                        <span className="w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center">
                                            <Instagram size={16} className="text-pink-600" />
                                        </span>
                                    )}
                                </div>

                                <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-8">
                                    <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/40 shadow-xl backdrop-blur-sm mb-4">
                                         {studio?.logo ? (
                                              <img src={studio.logo} alt={studio.name} className="w-full h-full rounded-2xl object-cover" />
                                         ) : (
                                              <span className="text-gray-800 font-bold text-2xl tracking-widest">{(studio?.name || 'P').charAt(0).toUpperCase()}</span>
                                         )}
                                    </div>
                                    <h1 className="text-xl font-bold text-black tracking-wider uppercase">{studio?.name || 'Your Studio'}</h1>
                                    <p className="text-xs text-gray-800 font-medium tracking-wider">{studio?.tagline || 'Photography & Videography'}</p>
                                    {studio?.address && (
                                        <p className="text-xs text-gray-800 mt-1 font-medium tracking-wide">{studio.address}</p>
                                    )}
                                </div>

                            </div>

                            <PageBreakMarker />

                            {/* Page 2+ Chunks & Intro Continuous Splitting */}
                            {(() => {
                                const chunkSize = PORTFOLIO_IMAGES_PER_PAGE
                                const chunks = []
                                for (let i = 0; i < portfolioImages.length; i += chunkSize) {
                                    chunks.push(portfolioImages.slice(i, i + chunkSize))
                                }

                                const pages = []

                                // A. Add Intro / Description page (Page 2)
                                if (customization.coverDescription || (customization.featuredOnItems && customization.featuredOnItems.length > 0)) {
                                     const introPageStyle = getIntroPageStyle()
                                     const introPageOverlayOpacity = getIntroPageOverlay()
                                     pages.push(
                                         <React.Fragment key="intro-wrap">
                                             <div className="w-full relative flex flex-col items-center text-center justify-start p-16 mb-6 rounded-sm shadow-2xl overflow-hidden" style={{ aspectRatio: '210/297', ...introPageStyle }}>
                                                {introPageOverlayOpacity !== null && (
                                                    <div
                                                            className="absolute inset-0 z-0 pointer-events-none"
                                                        style={{ backgroundColor: `rgba(255,255,255,${introPageOverlayOpacity})` }}
                                                    />
                                                )}
                                                    <div className="relative z-10 flex w-full flex-col items-center text-center">
                                                  <p className="text-xl font-semibold font-serif text-black mb-4">Hello,</p>

                                                  {customization.coverDescription && (
                                                      <p className="text-sm text-black max-w-xl leading-relaxed whitespace-pre-line mb-8">{customization.coverDescription}</p>
                                                  )}

                                                  {customization.featuredOnItems && customization.featuredOnItems.length > 0 && (
                                                        <div className="mt-8 mb-4 w-full flex flex-col items-center justify-center text-center">
                                                             <h3 className="text-xl font-semibold text-black mb-2 font-serif tracking-wide inline-block border-b-2 border-black pb-0.5">Featured On</h3>
                                                             <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
                                                                  {customization.featuredOnItems.map((item, i) => (
                                                                       <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold border-b border-dashed pb-0.5" style={{ color: accent, borderColor: accent }}>{(item.name || 'Link')}</a>
                                                                  ))}
                                                             </div>
                                                        </div>
                                                   )}
                                               </div>
                                             </div>
                                             <PageBreakMarker />
                                         </React.Fragment>
                                     );
                                }

                                const mappedPages = chunks.map((chunk, index) => {
                                    const portfolioPageStyle = getPortfolioPageStyle(index)
                                    const portfolioPageOverlayOpacity = getPortfolioPageOverlay(index)
                                     return (
                                         <React.Fragment key={`portfolio-${index}`}>
                                             <div className="w-full relative p-0 flex flex-col mb-6 rounded-sm shadow-2xl overflow-hidden" style={{ aspectRatio: '210/297', ...portfolioPageStyle }}>
                                                {portfolioPageOverlayOpacity !== null && (
                                                    <div
                                                        className="absolute inset-0 z-0 pointer-events-none"
                                                        style={{ backgroundColor: `rgba(255,255,255,${portfolioPageOverlayOpacity})` }}
                                                    />
                                                )}
                                                   <div className="relative z-10 flex-1 flex items-center justify-center w-full overflow-hidden">
                                                        <div
                                                            className="grid gap-0"
                                                            style={{
                                                                width: PORTFOLIO_GRID_INSET,
                                                                height: PORTFOLIO_GRID_INSET,
                                                                gridTemplateColumns: `repeat(${PORTFOLIO_GRID_COLUMNS}, minmax(0, 1fr))`,
                                                                gridTemplateRows: `repeat(${PORTFOLIO_GRID_ROWS}, minmax(0, 1fr))`,
                                                            }}
                                                        >
                                                            {chunk.map((img, i) => (
                                                                <div key={i} className="overflow-hidden">
                                                                    <img src={img} className="w-full h-full object-cover block" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                   </div>
                                             </div>
                                             {index < chunks.length - 1 && <PageBreakMarker />}
                                         </React.Fragment>
                                     );
                                });

                                return [...pages, ...mappedPages];
                            })()}
                        </>
                    )}

                    {/* ─── Page 2: Main Quotation Content ─── */}
                    <div className="mb-6 rounded-sm shadow-2xl overflow-hidden relative" style={{ ...quotationBgStyle, minHeight: '842px', backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
                        {needsQuotationOverlay && (
                            <div
                                className="absolute inset-0 z-0 pointer-events-none"
                                style={{ backgroundColor: `rgba(255,255,255,${quotationBackground.imageOpacity ?? 0.15})` }}
                            />
                        )}
                        <div className="relative z-10">

                    {/* Studio Header */}
                    {/* Studio Header */}
                    {show('studioHeader') && (
                        <div className="flex items-center justify-between px-8 py-5" style={{ backgroundColor: headerBg }}>
                            <div className="flex items-center gap-3">
                                {/* Logo placeholder */}
                                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center border border-white/30">
                                    <span className="text-white font-bold text-lg">Px</span>
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm tracking-wide">{studio?.name || 'studio name'}</p>
                                    <p className="text-white/60 text-xs">{studio?.tagline || 'Photography & Videography'}</p>
                                    <p className="text-white/50 text-xs mt-0.5">
                                        {studio?.phone && <span>{studio.phone}</span>}
                                        {studio?.email && <span> &middot; {studio.email}</span>}
                                        {studio?.address && <span> &middot; {studio.address}</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white/60 text-xs uppercase tracking-widest">Quotation</p>
                                <p className="text-white font-bold text-base">#VE/2026/001</p>
                                <p className="text-white/50 text-xs mt-0.5">Feb 19, 2026</p>
                            </div>
                        </div>
                    )}

                    {/* Welcome Message */}
                    {/* Welcome Message */}
                    {show('welcomeMessage') && (
                        <div className="px-8 pt-6 pb-3">
                            <p className="text-sm font-semibold text-gray-800 mb-1.5">Welcome, client name!</p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                {welcomeMessage || 'Thank you for trusting us with your special day. We would be honored to be a part of your celebrations and tell your story through our vision.'}
                            </p>
                        </div>
                    )}

                    {/* Client Details + Quote Details (side by side, separate) */}
                    {/* Client Details + Quote Details (side by side, separate) */}
                    {show('clientDetails') && (
                        <div className="px-8 py-4 flex gap-6 items-start">
                            {/* Client Details */}
                            <div className="flex-1">
                                <p className="text-xs font-bold mb-2" style={{ color: accent }}>Client Details</p>
                                <table className="text-xs w-full">
                                    <tbody>
                                        {[
                                            ['Name', 'client name'],
                                            ['Contact', 'client contact'],
                                            ['Email', 'client email'],
                                            ['Address', 'client address'],
                                        ].map(([k, v]) => (
                                            <tr key={k}>
                                                <td className="py-0.5 font-semibold text-gray-600 w-20">{k}</td>
                                                <td className="py-0.5 text-gray-500">: {v}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Quote Details -- compact, dark header style */}
                            {/* Quote Details -- compact, dark header style */}
                            <div className="shrink-0">
                                <p className="text-xs font-bold mb-2" style={{ color: accent }}>Quote Details</p>
                                <table className="text-xs border border-gray-300 rounded overflow-hidden">
                                    <tbody style={{ backgroundColor: cellBg }}>
                                        {[['ID', '#VE/2026/001'], ['Date', 'Feb 19, 2026'], ['Valid Till', 'Mar 19, 2026']].map(([k, v]) => (
                                            <tr key={k} className="border-b border-gray-200 last:border-0">
                                                <td className="px-2 py-1 font-medium text-white text-xs whitespace-nowrap" style={{ backgroundColor: headerBg }}>{k}</td>
                                                <td className="px-2 py-1 text-gray-700 whitespace-nowrap">{v}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Event Details */}
                    {/* Event Details */}
                    {show('eventDetails') && (
                        <div className="px-8 py-3">
                            <p className="text-xs font-bold mb-2" style={{ color: accent }}>Event Details</p>
                            <table className="text-xs w-full">
                                <tbody>
                                    {[
                                        ['Type', 'Hindu Wedding'],
                                        ['Date', 'Mar 15, 2026 10:00 AM - 4:00 PM'],
                                        ['Venue', 'Taj Falaknuma Palace, Hyderabad'],
                                    ].map(([k, v]) => (
                                        <tr key={k}>
                                            <td className="py-0.5 font-semibold text-gray-600 w-24">{k}</td>
                                            <td className="py-0.5 text-gray-500">: {v}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Services Table */}
                    {/* Services Table */}
                    {show('servicesTable') && (
                        <div className="px-8 py-3">
                            {/* Centered section heading */}
                            <p className="text-xs font-bold mb-2" style={{ color: accent }}>Services</p>
                            <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
                                <thead>
                                    <tr style={{ backgroundColor: headerBg }}>
                                        <th className="text-left px-3 py-2 text-white font-semibold w-8">#</th>
                                        <th className="text-left px-3 py-2 text-white font-semibold">Event Details</th>
                                        {(serviceColumns.individualAmounts !== false) && <th className="text-right px-3 py-2 text-white font-semibold w-24">Amount</th>}
                                    </tr>
                                </thead>
                                <tbody style={{ backgroundColor: cellBg }}>
                                   {SERVICES.map((svc, i) => (
                                                <tr key={i} className="border-b border-gray-100 align-top">
                                                    <td className="px-3 py-3 text-gray-400">{i + 1}</td>

                                                    <td className="px-3 py-3">
                                                    <div className="flex flex-col gap-1 text-xs text-gray-600">

                                                        {/* First Line: Name | Date | Location */}
                                                        <div className="flex flex-wrap items-center gap-x-3 text-sm">
                                                        <span className="font-semibold text-gray-800">
                                                            {svc.event || svc.description || svc.name || `Service ${i + 1}`}
                                                        </span>

                                                        {serviceColumns.date !== false && (
                                                            <span className="text-gray-500">
                                                            {svc.date || "Date TBD"}
                                                            </span>
                                                        )}

                                                        {serviceColumns.location !== false && (
                                                            <span className="text-gray-500">
                                                            {svc.location || "-"}
                                                            </span>
                                                        )}
                                                        </div>

                                                        {/* Crew */}
                                                        {serviceColumns.crew !== false && svc.crew?.length > 0 && (
                                                            <span className="text-gray-500">
                                                                Crew: {svc.crew.map(c => c.name || c).join(', ')}
                                                            </span>
                                                        )}

                                                        {/* Equipment */}
                                                        {serviceColumns.equipment !== false && svc.equipment?.length > 0 && (
                                                            <span className="text-gray-500">
                                                                Equipment: {svc.equipment.map(e => e.name || e).join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    </td>

                                                     {/* Amount */}
                                                     {serviceColumns.individualAmounts !== false && (
                                                         <td className="px-3 py-3 text-gray-700 text-right font-medium whitespace-nowrap">
                                                             {formatIndianCurrency(svc.amount)}
                                                         </td>
                                                     )}
                                                </tr>
                                                ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className="mt-2 flex justify-end">
                                <div className="w-52 space-y-1">
                                    {serviceColumns.subTotal && (
                                        <div className="flex justify-between text-xs text-gray-600 py-0.5">
                                            <span>Sub Total</span><span>₹88,000</span>
                                        </div>
                                    )}
                                    {serviceColumns.gst && (
                                        <div className="flex justify-between text-xs text-gray-600 py-0.5">
                                            <span>GST (18%)</span><span>₹15,840</span>
                                        </div>
                                    )}
                                    {serviceColumns.discount && (
                                        <div className="flex justify-between text-xs text-green-600 py-0.5">
                                            <span>Discount</span><span>-₹5,000</span>
                                        </div>
                                    )}
                                    {serviceColumns.grandTotal && (
                                        <div className="flex justify-between text-sm font-bold py-1 border-t border-gray-300 mt-1" style={{ color: accent }}>
                                            <span>Grand Total</span><span>₹98,840</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deliverables Table */}
                    {/* Deliverables Table */}
                    {show('deliverablesTable') && (
                        <div className="px-8 py-3">
                            <p className="text-xs font-bold mb-2" style={{ color: accent }}>Deliverables</p>
                            <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
                                <thead>
                                    <tr style={{ backgroundColor: headerBg }}>
                                        <th className="text-left px-3 py-2 text-white font-semibold">#</th>
                                        <th className="text-left px-3 py-2 text-white font-semibold">Item</th>
                                        <th className="text-center px-3 py-2 text-white font-semibold">Qty</th>
                                    </tr>
                                </thead>
                                <tbody style={{ backgroundColor: cellBg }}>
                                    {[
                                        ['Edited Photos (500+)', '1 Set'],
                                        ['Wedding Film (10–15 min)', '1 Film'],
                                        ['Highlight Reel (3 min)', '1 Reel'],
                                        ['Online Gallery (1 yr access)', '1 Link'],
                                        ['Printed Album (30 pages)', '1 Album'],
                                    ].map(([d, qty], i) => (
                                        <tr key={i} className="border-b border-gray-100">
                                            <td className="px-3 py-1.5 text-gray-500">{i + 1}</td>
                                            <td className="px-3 py-1.5 text-gray-700">{d}</td>
                                            <td className="px-3 py-1.5 text-gray-500 text-center">{qty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Complimentary Table */}
                    {/* Complimentary Table */}
                    {show('complimentaryTable') && (
                        <div className="px-8 py-3">
                            <p className="text-xs font-bold mb-2" style={{ color: accent }}>Complimentary</p>
                            <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
                                <thead>
                                    <tr style={{ backgroundColor: headerBg }}>
                                        <th className="text-left px-3 py-2 text-white font-semibold">#</th>
                                        <th className="text-left px-3 py-2 text-white font-semibold">Item</th>
                                    </tr>
                                </thead>
                                <tbody style={{ backgroundColor: cellBg }}>
                                    {[
                                        'Engagement Shoot (1 hr)',
                                        'Same-Day Edit Teaser (2 min)',
                                        'USB Drive with all raw files',
                                    ].map((c, i) => (
                                        <tr key={i} className="border-b border-gray-100">
                                            <td className="px-3 py-1.5 text-gray-500">{i + 1}</td>
                                            <td className="px-3 py-1.5 text-gray-700">{c}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Payment Timeline */}
                    {/* Payment Timeline */}
                    {show('paymentTimeline') && (
                        <div className="px-8 py-3">
                            <p className="text-xs font-bold mb-2" style={{ color: accent }}>Payment Timeline</p>
                            <div className="space-y-1">
                                {[
                                    ['Advance (50%)', '₹49,420', 'Due on booking'],
                                    ['Pre-event (25%)', '₹24,710', '7 days before event'],
                                    ['On Delivery (25%)', '₹24,710', 'After final delivery'],
                                ].map(([label, amt, note], i) => (
                                    <div key={i} className="flex items-center justify-between text-xs rounded px-3 py-1.5 border border-gray-100" style={{ backgroundColor: cellBg }}>
                                        <span className="text-gray-700 font-medium">{label}</span>
                                        <span className="text-gray-400 text-xs">{note}</span>
                                        <span className="font-semibold" style={{ color: accent }}>{amt}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {/* Notes */}
                    {show('notes') && (
                        <div className="px-8 py-3">
                            <p className="text-xs font-bold mb-1" style={{ color: accent }}>Notes</p>
                            <p className="text-xs text-gray-500 italic rounded px-3 py-2 border border-gray-100" style={{ backgroundColor: cellBg }}>
                                Travel charges applicable for venues outside Hyderabad. Quotation valid for 30 days from date of issue. Kindly confirm availability before making any advance payment.
                            </p>
                        </div>
                    )}

                    {/* Terms & Conditions */}
                    {/* Terms & Conditions */}
                    {show('termsAndConditions') && (
                        <div className="px-8 py-3">
                            <p className="text-xs font-bold mb-1" style={{ color: accent }}>Terms & Conditions</p>
                            <div className="text-xs text-gray-500 rounded px-3 py-2 border border-gray-100 space-y-0.5" style={{ backgroundColor: cellBg }}>
                                <p>1. 50% advance required to confirm the booking.</p>
                                <p>2. Cancellation within 30 days of event forfeits the advance.</p>
                                <p>3. Final deliverables within 60 working days of the event.</p>
                                <p>4. Client is responsible for providing access to all venues.</p>
                            </div>
                        </div>
                    )}
                    {/* Footer */}
                    {/* Footer */}
                    <div className="px-8 py-4 mt-2 text-center text-xs text-white" style={{ backgroundColor: headerBg }}>
                        <p className="font-semibold">Thank you for choosing {studio?.name || 'studio name'}</p>
                        <p className="text-white/50 mt-0.5">
                            {[studio?.email, studio?.phone, studio?.address].filter(Boolean).join('')}
                        </p>
                        <p className="text-white/40 mt-0.5 text-xs">Powered by Plexis</p>
                    </div>

                        </div>{/* end inner relative */}
                    </div>{/* end Page 2 white card */}

                </div>{/* end relative */}
            </div>
        </div>
    )
}
