import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const sections = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'what-are-cookies', title: '01 What Are Cookies?' },
    { id: 'types', title: '02 Types of Cookies' },
    { id: 'how-to-control', title: '03 How to Control Cookies' },
    { id: 'consent', title: '04 Consent' },
    { id: 'updates', title: '05 Updates' },
    { id: 'contact', title: '06 Contact Us' },
];

const CookiePolicy = () => {
    const [activeSection, setActiveSection] = useState('introduction');

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200;
            for (const section of sections) {
                const element = document.getElementById(section.id);
                if (element && element.offsetTop <= scrollPosition && (element.offsetTop + element.offsetHeight) > scrollPosition) {
                    setActiveSection(section.id);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollTo = (id) => {
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    };

    const cookieTypes = [
        { type: 'Essential Cookies', purpose: 'Required for basic functionality like login, navigation, and security.' },
        { type: 'Analytics Cookies', purpose: 'Help us understand how you use the service (e.g., Microsoft Clarity).' },
        { type: 'Functional Cookies', purpose: 'Remember your settings and preferences.' },
        { type: 'Marketing Cookies', purpose: 'Used for personalized ads or retargeting (e.g., Facebook Pixel).' },
    ];

    return (
        <div className="min-h-screen bg-[#FDFDFF]">
            <Navbar />

            {/* Header Section */}
            <div className="pt-32 pb-20 bg-gradient-to-b from-purple-50 via-white to-transparent border-b border-purple-100/50">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
                        Cookie <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">Policy</span>
                    </h1>
                    <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto">
                        At Plexis, we use cookies to enhance your experience. This policy explains how and why we use them.
                    </p>
                    <div className="mt-8 flex items-center justify-center space-x-4">
                        <span className="px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">Version 3.0</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500 font-medium text-sm">Effective: Jan 01, 2025</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col md:flex-row gap-10 md:gap-16">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-80 shrink-0">
                    <div className="md:sticky md:top-28 space-y-4">
                        <h3 className="hidden md:block text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-4">Table of Contents</h3>
                        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-hide snap-x snap-mandatory gap-2 md:gap-1">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollTo(section.id)}
                                    className={`whitespace-nowrap md:whitespace-normal text-left px-5 py-3 rounded-xl md:rounded-xl text-sm font-semibold transition-all duration-200 border-b-2 md:border-b-0 md:border-l-2 snap-start shrink-0 ${activeSection === section.id
                                        ? 'bg-purple-50 text-purple-700 border-purple-600'
                                        : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700'
                                        }`}
                                >
                                    {section.title}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Content */}
                <main className="flex-1 max-w-3xl">
                    <div className="prose prose-lg prose-purple prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-strong:text-gray-900 space-y-12 md:space-y-16">

                        {/* Introduction */}
                        <section id="introduction">
                            <div className="relative overflow-hidden bg-white p-7 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-purple-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <div className="hidden md:block absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[5rem] -mr-10 -mt-10 opacity-50"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-9 h-9 md:w-10 md:h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3" /><path d="M6.168 18.849A4 4 0 0 1 10 17h4a4 4 0 0 1 3.834 2.855" />
                                            </svg>
                                        </div>
                                        <span className="text-xs md:text-sm font-black text-purple-600 uppercase tracking-[0.2em]">Cookie Notice</span>
                                    </div>
                                    <p className="text-lg md:text-xl text-gray-800 font-semibold leading-relaxed mb-6">
                                        This Cookie Policy explains how <span className="text-purple-600">Plexis Pvt Ltd</span> uses cookies and similar technologies on our website and services, including plexis.in.
                                    </p>
                                    <p className="text-sm md:text-base text-gray-600 leading-relaxed italic border-l-4 border-purple-200 pl-4 md:pl-6">
                                        By using our Service, you agree to the use of cookies as described in this policy.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* What Are Cookies */}
                        <section id="what-are-cookies" className="scroll-mt-32">
                            <h2 className="text-2xl md:text-3xl font-black mb-6 text-gray-900 flex items-center gap-3 md:gap-4">
                                <span className="text-purple-200 text-3xl md:text-4xl font-light">01</span>
                                What Are Cookies?
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Cookies are small text files stored on your device when you visit a website. They help us:
                            </p>
                            <ul className="space-y-2 text-gray-600 list-disc list-inside">
                                <li>Remember your login</li>
                                <li>Improve site performance</li>
                                <li>Analyze usage for better features</li>
                                <li>Show relevant content or promotions</li>
                            </ul>
                        </section>

                        {/* Types of Cookies */}
                        <section id="types" className="scroll-mt-32">
                            <h2 className="text-2xl md:text-3xl font-black mb-6 text-gray-900 flex items-center gap-3 md:gap-4">
                                <span className="text-purple-200 text-3xl md:text-4xl font-light">02</span>
                                Types of Cookies We Use
                            </h2>
                            <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="text-left px-6 py-4 font-semibold text-gray-500 w-1/3">Type</th>
                                            <th className="text-left px-6 py-4 font-semibold text-gray-500">Purpose</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {cookieTypes.map((cookie, i) => (
                                            <tr key={i} className="bg-white hover:bg-purple-50/30 transition-colors duration-150">
                                                <td className="px-6 py-4 font-bold text-purple-700">{cookie.type}</td>
                                                <td className="px-6 py-4 text-gray-600">{cookie.purpose}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* How to Control Cookies */}
                        <section id="how-to-control" className="scroll-mt-32">
                            <h2 className="text-2xl md:text-3xl font-black mb-6 text-gray-900 flex items-center gap-3 md:gap-4">
                                <span className="text-purple-200 text-3xl md:text-4xl font-light">03</span>
                                How to Control Cookies
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                You can control and manage cookies through your browser settings. Most browsers allow you to:
                            </p>
                            <ul className="space-y-2 text-gray-600 list-disc list-inside">
                                <li>See what cookies are stored</li>
                                <li>Delete or block specific cookies</li>
                                <li>Block all cookies from being set</li>
                            </ul>
                        </section>

                        {/* Consent */}
                        <section id="consent" className="scroll-mt-32">
                            <h2 className="text-2xl md:text-3xl font-black mb-6 text-gray-900 flex items-center gap-3 md:gap-4">
                                <span className="text-purple-200 text-3xl md:text-4xl font-light">04</span>
                                Consent
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                By continuing to use our website and clicking "Accept" on the cookie notice, you consent to our use of cookies in accordance with this policy.
                            </p>
                            <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100">
                                <p className="text-sm text-violet-800/80">
                                    If you do not accept the use of cookies, you may disable them through your browser settings or leave the website. Note that disabling cookies may limit certain features of our Service.
                                </p>
                            </div>
                        </section>

                        {/* Updates */}
                        <section id="updates" className="scroll-mt-32">
                            <h2 className="text-2xl md:text-3xl font-black mb-6 text-gray-900 flex items-center gap-3 md:gap-4">
                                <span className="text-purple-200 text-3xl md:text-4xl font-light">05</span>
                                Updates
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                We may update this Cookie Policy from time to time. Changes will be posted on this page with a new "Last Updated" date. We encourage you to review this policy periodically to stay informed about how we use cookies.
                            </p>
                        </section>

                        {/* Contact */}
                        <section id="contact" className="scroll-mt-32 pb-20">
                            <h2 className="text-2xl md:text-3xl font-black mb-6 text-gray-900 flex items-center gap-3 md:gap-4">
                                <span className="text-purple-200 text-3xl md:text-4xl font-light">06</span>
                                Contact Us
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-8">
                                If you have questions about our Cookie Policy, please contact us at:
                            </p>

                            <div className="group relative bg-white p-8 md:p-12 rounded-[1.5rem] md:rounded-[2.5rem] border border-purple-100 shadow-[0_15px_50px_rgba(109,40,217,0.03)] hover:border-purple-300 transition-all duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-10">
                                    <div className="space-y-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-2">
                                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">Have questions about cookies?</h3>
                                            <p className="text-gray-500 text-base md:text-lg mt-2 max-w-sm">Our privacy team is ready to help you with any cookie-related concerns.</p>
                                        </div>
                                    </div>
                                    <a
                                        href="mailto:contact@plexis.in"
                                        className="inline-flex items-center  justify-center px-8 md:px-10 py-4 md:py-5 bg-purple-600 text-white rounded-[1rem] md:rounded-[1.5rem] font-black hover:bg-purple-700 transition-all duration-300 shadow-xl shadow-purple-100 hover:shadow-purple-200 hover:-translate-y-1 text-sm md:text-base whitespace-nowrap"
                                    >
                                        Contact Privacy Team
                                        <svg className="w-4 h-4 md:w-5 md:h-5 ml-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            {/* Bottom CTA */}
                            <div className="mt-12 md:mt-20 relative p-1 flex justify-center">
                                <div className="w-full bg-gradient-to-br from-white via-purple-50/30 to-white p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border border-purple-100 relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(109,40,217,0.1)]">
                                    <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-purple-200/20 blur-[80px] rounded-full"></div>
                                    <div className="hidden md:block absolute -bottom-24 -left-24 w-64 h-64 bg-violet-200/20 blur-[80px] rounded-full"></div>
                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-purple-100 shadow-sm mb-6 md:mb-8">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                                            <span className="text-[10px] md:text-xs font-black text-purple-600 uppercase tracking-widest">Formal Inquiries</span>
                                        </div>
                                        <h4 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                                            Legal & Privacy Support
                                        </h4>
                                        <p className="text-gray-500 text-base md:text-lg max-w-lg mb-8 md:mb-10 leading-relaxed">
                                            For formal data processing requests or legal inquiries, our dedicated support channel is available to assist you.
                                        </p>
                                        <a
                                            href="mailto:contact@plexis.in"
                                            className="group relative inline-flex items-center justify-center px-8 md:px-10 py-4 md:py-5 bg-white border-2 border-purple-600 text-purple-600 rounded-xl md:rounded-2xl font-black transition-all duration-300 hover:bg-purple-600 hover:text-white hover:shadow-2xl hover:shadow-purple-200 active:scale-95 text-sm md:text-base"
                                        >
                                            contact@plexis.in
                                            <svg className="w-4 h-4 md:w-5 md:h-5 ml-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                </main>
            </div>

            <Footer />

            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E9D5FF; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D8B4FE; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
        </div>
    );
};

export default CookiePolicy;