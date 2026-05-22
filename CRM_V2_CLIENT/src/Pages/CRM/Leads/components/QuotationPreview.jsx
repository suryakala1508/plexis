import React from 'react'
import { Globe, Mail, Phone, Instagram, Facebook, Youtube, Check, Trash2, Upload } from 'lucide-react'
import { formatIndianCurrency } from '../../../../utils/formatUtils'
import { normalizeSocialLink } from '../../../../utils/socialLinkUtils'

/**
 * QuotationPreview
 * Visual layout matches TemplatePreview exactly.
 * When a template is applied, background, colors, and field-visibility are driven by it.
 * All real quotation data is rendered in the same styled sections.
 */
export const QuotationPreview = ({ quotationData, selectedTemplate }) => {
    if (!quotationData) {
        return <div className='p-8 text-center text-gray-500'>No quotation data available</div>
    }

    const { studio = {}, client = {}, event = {}, items = [], paymentMilestones = [], customization = {} } = quotationData

    const tplBg = quotationData.background || selectedTemplate?.background || null
    const tplQuotationBg = quotationData.quotationBackground || selectedTemplate?.quotationBackground || null
    const tplFields = quotationData.fields || selectedTemplate?.fields || null
    const tplServiceColumns = quotationData.serviceColumns || selectedTemplate?.serviceColumns || {}
    const portfolioImages = [...new Set(
        (Array.isArray(customization.portfolioImages) ? customization.portfolioImages : [])
            .map((img) => (typeof img === 'string' ? img.trim() : ''))
            .filter(Boolean)
    )]
    const hasPortfolioImages = portfolioImages.length > 0
    const accent = customization.primaryColor || selectedTemplate?.customization?.primaryColor || '#9916b1'
    const headerBg = tplBg?.headerColor || customization.headerColor || '#22031f'
    const font = customization.fontFamily || selectedTemplate?.customization?.fontFamily || 'Inter'
    const hexToRgba = (hex, alpha = 1) => {
        const h = String(hex || '#ffffff').replace('#', '')
        const r = parseInt(h.length === 3 ? h.slice(0, 1).repeat(2) : h.slice(0, 2), 16) || 255
        const g = parseInt(h.length === 3 ? h.slice(1, 2).repeat(2) : h.slice(2, 4), 16) || 255
        const b = parseInt(h.length === 3 ? h.slice(2, 3).repeat(2) : h.slice(4, 6), 16) || 255
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    const cellColor = customization.tableColumnColor || '#ffffff'
    const cellOpacity = customization.tableColumnOpacity !== undefined ? customization.tableColumnOpacity : 1
    const cellBg = hexToRgba(cellColor, cellOpacity)
    const show = (key) => {
        if (key === 'portfolio') return customization.showPortfolio !== false && hasPortfolioImages
        return !tplFields || tplFields[key] !== false
    }
    const PORTFOLIO_IMAGES_PER_PAGE = 6
    const PORTFOLIO_GRID_COLUMNS = 2
    const PORTFOLIO_GRID_ROWS = 3
    const PORTFOLIO_GRID_INSET = '92%'

    const getPageBgStyle = () => {
        if (!tplBg) return {}
        if (tplBg.type === 'image' && tplBg.imageUrl) {
            return {
                backgroundImage: `url(${tplBg.imageUrl})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                position: 'relative',
            }
        }
        if (tplBg.type === 'gradient') {
            return {
                background: `linear-gradient(${tplBg.gradientDirection || 'to bottom right'}, ${tplBg.gradientFrom || '#fff'}, ${tplBg.gradientTo || '#f3e8ff'})`,
            }
        }
        return { backgroundColor: tplBg.color || '#ffffff' }
    }

    const needsOverlay = tplBg?.type === 'image' && tplBg?.imageUrl

    const getIntroPageBgConfig = () => customization.introPageBackground || null

    const getIntroPageStyle = () => {
        const introBg = getIntroPageBgConfig()
        if (!introBg) return getPageBgStyle()

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
        return getPageBgStyle()
    }

    const getIntroPageOverlay = () => {
        const introBg = getIntroPageBgConfig()
        if (introBg?.type === 'image' && introBg?.imageUrl) {
            return introBg.imageOpacity ?? 0.15
        }
        if (needsOverlay) {
            return tplBg.imageOpacity ?? 0.15
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
        if (!pageBg) return getPageBgStyle()

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
        return getPageBgStyle()
    }

    const getPortfolioPageOverlay = (pageIndex) => {
        const pageBg = getPortfolioPageBgConfig(pageIndex)
        if (pageBg?.type === 'image' && pageBg?.imageUrl) {
            return pageBg.imageOpacity ?? 0.15
        }
        if (needsOverlay) {
            return tplBg.imageOpacity ?? 0.15
        }
        return null
    }

    const getQuotationBgStyle = () => {
        if (!tplQuotationBg || Object.keys(tplQuotationBg).length === 0) return { backgroundColor: '#ffffff' }
        if (tplQuotationBg.type === 'image' && tplQuotationBg.imageUrl) {
            return {
                backgroundImage: `url(${tplQuotationBg.imageUrl})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }
        }
        if (tplQuotationBg.type === 'gradient') {
            return {
                background: `linear-gradient(${tplQuotationBg.gradientDirection || 'to bottom right'}, ${tplQuotationBg.gradientFrom || '#fff'}, ${tplQuotationBg.gradientTo || '#f3e8ff'})`,
            }
        }
        return { backgroundColor: tplQuotationBg.color || '#ffffff' }
    }

    const quotationBgStyle = getQuotationBgStyle()
    const needsQuotationOverlay = tplQuotationBg?.type === 'image' && tplQuotationBg?.imageUrl
    const socialLinks = {
        website: normalizeSocialLink('website', customization.website),
        youtube: normalizeSocialLink('youtube', customization.youtube),
        facebook: normalizeSocialLink('facebook', customization.facebook),
        instagram: normalizeSocialLink('instagram', customization.instagram),
    }

    const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || Number(item.total) || 0), 0)
    const taxRate = Number(quotationData.taxRate) || 0
    const taxAmount = (subtotal * taxRate) / 100
    const discountValue = Number(quotationData.discount?.value) || 0
    const discountAmt = quotationData.discount?.enabled
        ? quotationData.discount.type === 'percentage'
            ? (subtotal * discountValue) / 100
            : discountValue
        : 0
    const grandTotal = subtotal + taxAmount - discountAmt

  
    const fmtDate = (d) => {
        if (!d) return ''
        return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const PageBreakMarker = () => (
        <div className="my-3 flex items-center gap-3 px-1">
            <div className="h-px flex-1 border-t border-dashed border-gray-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Page Break</span>
            <div className="h-px flex-1 border-t border-dashed border-gray-400" />
        </div>
    )

    return (
        <div className='min-h-full bg-gray-200 p-6'>
            <div className='max-w-2xl mx-auto' style={{ fontFamily: font }}>

                <div className='relative'>

                    {/* STUDIO HEADER */}

                    {/* Portfolio & Cover Section (AT FIRST) */}
                    {show('portfolio') && (
                        <>
                            {/* Page 1: Cover Page — locked to A4 aspect ratio (210:297) */}
                            <div className="w-full relative flex flex-col mb-6 pb-16 rounded-sm shadow-2xl overflow-hidden" style={{ aspectRatio: '210/297', ...getPageBgStyle() }}>
                                {needsOverlay && (
                                    <div
                                        className='absolute inset-0 z-0 pointer-events-none'
                                        style={{ backgroundColor: `rgba(255,255,255,${tplBg.imageOpacity ?? 0.15})` }}
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
                                              <span className="text-gray-900 font-bold text-2xl tracking-widest">{(studio?.name || 'P').charAt(0).toUpperCase()}</span>
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

                                const pages = [];

                                // A. Add Intro / Description page (Page 2)
                                if (customization.coverDescription || (customization.featuredOnItems && customization.featuredOnItems.length > 0)) {
                                     const introPageStyle = getIntroPageStyle()
                                     const introPageOverlayOpacity = getIntroPageOverlay()
                                    pages.push(
                                         <React.Fragment key="intro-wrap">
                                             <div className="w-full relative flex flex-col items-center text-center justify-start p-16 mb-6 rounded-sm shadow-2xl overflow-hidden" style={{ aspectRatio: '210/297', ...introPageStyle }}>
                                                {introPageOverlayOpacity !== null && (
                                                    <div
                                                        className='absolute inset-0 z-0 pointer-events-none'
                                                        style={{ backgroundColor: `rgba(255,255,255,${introPageOverlayOpacity})` }}
                                                    />
                                                )}
                                                <div className="relative z-10 flex w-full flex-col items-center text-center">
                                                  <p className="text-xl font-semibold font-serif text-black mb-4">Hello,</p>

                                                  {customization.coverDescription && (
                                                      <p className="text-sm text-black max-w-xl leading-relaxed whitespace-pre-line mb-8">{customization.coverDescription}</p>
                                                  )}

                                                  {customization.featuredOnItems && customization.featuredOnItems.length > 0 && (
                                                       <div className="mt-6 w-full flex flex-col items-center text-center">
                                                            <h3 className="text-base font-bold text-black font-serif mb-3 border-b-2 border-black pb-1 inline-block">Featured On</h3>
                                                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
                                                                 {customization.featuredOnItems.map((item, i) => (
                                                                      <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold border-b border-dashed pb-0.5" style={{ color: accent, borderColor: accent }}>{(item.name || 'Link').toUpperCase()}</a>
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
                                                        className='absolute inset-0 z-0 pointer-events-none'
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
                                style={{ backgroundColor: `rgba(255,255,255,${tplQuotationBg.imageOpacity ?? 0.15})` }}
                            />
                        )}
                        <div className="relative z-10">

                    {show('studioHeader') && (
                        <div className='flex items-center justify-start gap-8 px-8 py-5' style={{ backgroundColor: headerBg }}>
                            <div className='flex items-center gap-3'>
                                {studio.logo ? (
                                    <img src={studio.logo} alt={studio.name} className='w-12 h-12 rounded-lg object-cover border border-white/30' />
                                ) : (
                                    <div className='w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center border border-white/30'>
                                        <span className='text-white font-bold text-lg'>{(studio.name || 'S').charAt(0).toUpperCase()}</span>
                                    </div>
                                )}
                                <div>
                                    <p className='text-white font-bold text-sm tracking-wide'>{studio.name || 'Studio Name'}</p>
                                    <p className='text-white/60 text-xs'>{studio?.tagline || 'Photography & Videography'}</p>
                                    {(studio.phone || studio.email || studio.address) && (
                                        <p className='text-white/50 text-xs mt-0.5'>
                                            {[studio.phone, studio.email, studio.address].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className='ml-auto text-right'>
                                <p className='text-white/60 text-xs uppercase tracking-widest'>Quotation</p>
                                {quotationData.quotationNumber && (
                                    <p className='text-white font-bold text-base'>{quotationData.quotationNumber}</p>
                                )}
                                {quotationData.quotationDate && (
                                    <p className='text-white/50 text-xs mt-0.5'>{fmtDate(quotationData.quotationDate)}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* WELCOME MESSAGE */}
                    {/* WELCOME MESSAGE */}
                    {show('welcomeMessage') && (quotationData.welcomeMessage || selectedTemplate?.welcomeMessage) && (
                        <div className='px-8 pt-6 pb-3'>
                            <p className='text-sm font-semibold text-gray-800 mb-1.5'>Welcome, {client.name || 'Client'}!</p>
                            <p className='text-xs text-gray-600 leading-relaxed whitespace-pre-wrap'>
                                {quotationData.welcomeMessage || selectedTemplate?.welcomeMessage}
                            </p>
                        </div>
                    )}

                    {/* CLIENT DETAILS + QUOTE META */}
                    {/* CLIENT DETAILS + QUOTE META */}
                    {show('clientDetails') && (
                        <div className='px-8 py-4 flex gap-6 items-start'>
                            {/* Client Details */}
                            <div className='flex-1'>
                                <p className='text-xs font-bold mb-2' style={{ color: accent }}>Client Details</p>
                                <table className='text-xs w-full'>
                                    <tbody>
                                        {[
                                            ['Name', client.name || '–'],
                                            ['Contact', client.phone || '–'],
                                            ['Email', client.email || '–'],
                                            ['Address', client.address || '–'],
                                        ].map(([k, v]) => (
                                            <tr key={k}>
                                                <td className='py-0.5 font-semibold text-gray-600 w-20'>{k}</td>
                                                <td className='py-0.5 text-gray-500'>: {v}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Quote Meta */}
                            <div className='shrink-0'>
                                <p className='text-xs font-bold mb-2' style={{ color: accent }}>Quote Details</p>
                                <table className='text-xs border border-gray-300 rounded overflow-hidden'>
                                    <tbody style={{ backgroundColor: cellBg }}>
                                        {[
                                            ['ID', quotationData.quotationNumber || '–'],
                                            ['Date', fmtDate(quotationData.quotationDate) || '–'],
                                            ['Valid Till', fmtDate(quotationData.dueDate) || '–'],
                                            ...(quotationData.eventName ? [['Event', quotationData.eventName]] : []),
                                        ].map(([k, v]) => (
                                            <tr key={k} className='border-b border-gray-200 last:border-0'>
                                                <td className='px-2 py-1 font-medium text-white text-xs whitespace-nowrap' style={{ backgroundColor: headerBg }}>{k}</td>
                                                <td className='px-2 py-1 text-gray-700 whitespace-nowrap'>{v}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* EVENT DETAILS */}
                    {/* EVENT DETAILS */}
                    {show('eventDetails') && (event?.type || event?.date || event?.location || event?.time) && (
                        <div className='px-8 py-3'>
                            <p className='text-xs font-bold mb-2' style={{ color: accent }}>Event Details</p>
                            <table className='text-xs w-full'>
                                <tbody>
                                    {[
                                        event.type && ['Type', event.type],
                                        (event.date || event.time) && ['Date', event.date?.includes(' - ') ? event.date : `${event.date ? fmtDate(event.date) : ''} ${event.time || ''}`.trim()],
                                        event.location && ['Venue', event.location],
                                    ].filter(Boolean).map(([k, v]) => (
                                        <tr key={k}>
                                            <td className='py-0.5 font-semibold text-gray-600 w-20'>{k}</td>
                                            <td className='py-0.5 text-gray-500'>: {v}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* SERVICES TABLE */}
                    {/* SERVICES TABLE */}
                    {show('servicesTable') && items.length > 0 && (
                        <div className='px-8 py-3'>
                            <p className='text-xs font-bold mb-2' style={{ color: accent }}>Services</p>
                            <table className='w-full text-xs border border-gray-200 rounded overflow-hidden'>
                                <thead>
                                    <tr style={{ backgroundColor: headerBg }}>
                                        <th className='text-left px-3 py-2 text-white font-semibold w-8'>#</th>
                                        <th className='text-left px-3 py-2 text-white font-semibold'>Event Details</th>
                                        {(tplServiceColumns.individualAmounts !== false) && <th className='text-right px-3 py-2 text-white font-semibold w-24'>Amount</th>}
                                    </tr>
                                </thead>
                                <tbody style={{ backgroundColor: cellBg }}>
                                    {items.map((item, i) => {
                                        const amount = Number(item.amount) || Number(item.total) || 0
                                        return (
                                            <tr key={item.id || i} className='border-b border-gray-100 align-top'>
                                                <td className='px-3 py-3 text-gray-400'>{i + 1}</td>
                                                <td className='px-3 py-3'>
                                                    <div className='flex flex-col gap-1 text-xs text-gray-600'>

                                                        {/* First Line: Name | Date | Location */}
                                                        <div className='flex flex-wrap items-center gap-x-3 text-sm'>
                                                            <span className='font-semibold text-gray-800'>
                                                                {item.event || item.description || `Item ${i + 1}`}
                                                            </span>

                                                            {tplServiceColumns.date !== false && item.date && (
                                                                <span className='text-gray-500'>
                                                                    {item.date.includes(' - ') ? item.date : fmtDate(item.date)}
                                                                </span>
                                                            )}

                                                            {tplServiceColumns.location !== false && item.location && (
                                                                <span className='text-gray-500'>
                                                                    {item.location}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Packages, Crew, Equipment: same styling, no bullets (left margin only), items listed one per line */}
                                                        {((item.packages && item.packages.length > 0) || (tplServiceColumns.crew !== false && item.crew?.length) || (tplServiceColumns.equipment !== false && item.equipment?.length)) && (
                                                            <div className=" pt-1">
                                                                <div className="pl-2 space-y-0.5">
                                                                    {item.packages?.map((pkg, pidx) => (
                                                                        <div key={pidx} className="mb-1">
                                                                            {/* <span className="font-semibold text-gray-700 block mb-0.5">{pkg.name}</span> */} 
                                                                        </div>
                                                                    ))}

                                                                    {/* Grouped Crew */}
                                                                    {(() => {
                                                                        if (tplServiceColumns.crew === false || !item.crew?.length) return null;
                                                                        const groups = {};
                                                                        item.crew.forEach(c => {
                                                                            const name = c.name || String(c);
                                                                            groups[name] = (groups[name] || 0) + 1;
                                                                        });
                                                                        return Object.entries(groups).map(([name, qty], idx) => (
                                                                            <div key={`crew-grp-${idx}`} className="text-[11px] text-gray-500 ml-2.5 pl-1 mt-0.5">
                                                                                {qty > 1 ? `${name} x ${qty}` : name}
                                                                            </div>
                                                                        ));
                                                                    })()}

                                                                    {/* Grouped Equipment */}
                                                                    {(() => {
                                                                        if (tplServiceColumns.equipment === false || !item.equipment?.length) return null;
                                                                        const groups = {};
                                                                        item.equipment.forEach(e => {
                                                                            const name = e.name || String(e);
                                                                            groups[name] = (groups[name] || 0) + 1;
                                                                        });
                                                                        return Object.entries(groups).map(([name, qty], idx) => (
                                                                            <div key={`equip-grp-${idx}`} className="text-[11px] text-gray-500 ml-2.5 pl-1 mt-0.5">
                                                                                {qty > 1 ? `${name} x ${qty}` : name}
                                                                            </div>
                                                                        ));
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Amount */}
                                                {tplServiceColumns.individualAmounts !== false && (
                                                    <td className='px-3 py-3 text-gray-700 text-right font-medium whitespace-nowrap'>
                                                        {formatIndianCurrency(amount)}
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className='mt-2 flex justify-end'>
                                <div className='w-52 space-y-1'>
                                    <div className='flex justify-between text-xs text-gray-600 py-0.5'>
                                        <span>Sub Total</span>
                                        <span>{formatIndianCurrency(subtotal)}</span>
                                    </div>
                                    {taxRate > 0 && (
                                        <div className='flex justify-between text-xs text-gray-600 py-0.5'>
                                            <span>GST ({taxRate}%)</span>
                                            <span>{formatIndianCurrency(taxAmount)}</span>
                                        </div>
                                    )}
                                    {quotationData.discount?.enabled && discountAmt > 0 && (
                                        <div className='flex justify-between text-xs text-green-600 py-0.5'>
                                            <span>Discount</span>
                                            <span>-{formatIndianCurrency(discountAmt)}</span>
                                        </div>
                                    )}
                                    <div className='flex justify-between text-sm font-bold py-1 border-t border-gray-300 mt-1' style={{ color: accent }}>
                                        <span>Grand Total</span>
                                        <span>{formatIndianCurrency(grandTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DELIVERABLES TABLE */}
                    {/* DELIVERABLES TABLE */}
                    {show('deliverablesTable') && (quotationData.deliverables && quotationData.deliverables.length > 0) && (
                        <div className='px-8 py-3'>
                            <p className='text-xs font-bold mb-2' style={{ color: accent }}>Deliverables</p>
                            <table className='w-full text-xs border border-gray-200 rounded overflow-hidden'>
                                <thead>
                                    <tr style={{ backgroundColor: headerBg }}>
                                        <th className='text-left px-3 py-2 text-white font-semibold w-8'>#</th>
                                        <th className='text-left px-3 py-2 text-white font-semibold'>Item</th>
                                    </tr>
                                </thead>
                                <tbody style={{ backgroundColor: cellBg }}>
                                    {quotationData.deliverables.map((item, i) => {
                                        const qty = Number(item.quantity) || 1;
                                        const displayName = qty > 1 ? `${item.name || item.description || '-'} x ${qty}` : (item.name || item.description || '-');
                                        return (
                                            <tr key={item.id || i} className='border-b border-gray-100'>
                                                <td className='px-3 py-1.5 text-gray-500'>{i + 1}</td>
                                                <td className='px-3 py-1.5 text-gray-700'>{displayName}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* COMPLIMENTARY TABLE */}
                    {/* COMPLIMENTARY TABLE */}
                    {show('complimentaryTable') && (quotationData.complimentary && quotationData.complimentary.length > 0) && (
                        <div className='px-8 py-3'>
                            <p className='text-xs font-bold mb-2' style={{ color: accent }}>Complimentary</p>
                            <table className='w-full text-xs border border-gray-200 rounded overflow-hidden'>
                                <thead>
                                    <tr style={{ backgroundColor: headerBg }}>
                                        <th className='text-left px-3 py-2 text-white font-semibold w-8'>#</th>
                                        <th className='text-left px-3 py-2 text-white font-semibold'>Item</th>
                                    </tr>
                                </thead>
                                <tbody style={{ backgroundColor: cellBg }}>
                                    {quotationData.complimentary.map((item, i) => {
                                        const qty = Number(item.quantity) || 1;
                                        const name = typeof item === 'string' ? item : (item.name || item.description || '-');
                                        const displayName = qty > 1 ? `${name} x ${qty}` : name;
                                        return (
                                            <tr key={`complimentary-${item.id || i}`} className='border-b border-gray-100'>
                                                <td className='px-3 py-1.5 text-gray-500'>{i + 1}</td>
                                                <td className='px-3 py-1.5 text-gray-700'>{displayName}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                  
                    {show('paymentTimeline') && paymentMilestones.length > 0 && (
                        <div className='px-8 py-3'>
                            <p className='text-xs font-bold mb-2' style={{ color: accent }}>Payment Timeline</p>
                            <div className='space-y-1'>
                                {paymentMilestones.map((m, i) => {
                                    const amount = Number(m.amount) || 0
                                    return (
                                        <div key={m.id || i} className='flex items-center justify-between text-xs rounded px-3 py-1.5 border border-gray-100' style={{ backgroundColor: cellBg }}>
                                            <span className='text-gray-700 font-medium'>{m.description || `Milestone ${i + 1}`}</span>
                                            <span className='text-gray-400 text-xs'>{m.dueDate ? `Due ${fmtDate(m.dueDate)}` : ''}</span>
                                            <span className='font-semibold' style={{ color: accent }}>{formatIndianCurrency(amount)}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                
                    {quotationData.notes && (
                        <div className='px-8 py-3'>
                            <p className='text-xs font-bold mb-1' style={{ color: accent }}>Notes</p>
                            <p className='text-xs text-gray-500 italic rounded px-3 py-2 border border-gray-100 whitespace-pre-wrap' style={{ backgroundColor: cellBg }}>
                                {quotationData.notes}
                            </p>
                        </div>
                    )}

                  
                    {quotationData.paymentMethods && Object.values(quotationData.paymentMethods).some(v => v === true) && (
                        <div className='px-8 py-3'>
                            <p className='text-xs font-bold mb-1' style={{ color: accent }}>Accepted Payment Methods</p>
                            <div className='flex flex-wrap gap-2 mt-1'>
                                {Object.entries(quotationData.paymentMethods)
                                    .filter(([_, enabled]) => enabled === true)
                                    .map(([method, _]) => (
                                        <span key={method} className='text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 text-gray-600 rounded border border-gray-200' style={{ backgroundColor: cellBg }}>
                                            {method.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                    ))}
                            </div>
                        </div>
                    )}
                    {quotationData.termsAndConditions && (
                        <div className='px-8 py-3'>
                            <p className='text-xs font-bold mb-1' style={{ color: accent }}>Terms &amp; Conditions</p>
                            <p className='text-xs text-gray-500 rounded px-3 py-2 border border-gray-100 whitespace-pre-wrap' style={{ backgroundColor: cellBg }}>
                                {quotationData.termsAndConditions}
                            </p>
                        </div>
                    )}
                    <div className='px-8 py-4 mt-2 text-center text-xs text-white' style={{ backgroundColor: headerBg }}>
                        <p className='font-semibold'>Thank you for choosing {studio.name || 'us'}</p>
                        {(studio.email || studio.phone || studio.address) && (
                            <p className='text-white/50 mt-0.5'>{[studio.email, studio.phone, studio.address].filter(Boolean).join('')}</p>
                        )}
                        <p className='text-white/40 mt-0.5 text-xs'>Powered by Plexis</p>
                    </div>
                    </div>{/* end inner relative */}
                    </div>{/* end Page 2 */}

                </div>
            </div>
        </div>
    )
}



