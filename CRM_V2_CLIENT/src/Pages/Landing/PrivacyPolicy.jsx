import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const sections = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'acceptance', title: '01 Acceptance of Terms' },
    { id: 'definitions', title: '02 Definitions' },
    { id: 'changes', title: '03 Changes to Privacy Policy' },
    { id: 'scope', title: '04 Scope of This Policy' },
    { id: 'questions', title: '05 Questions & Concerns' },
    { id: 'collection', title: '06 Information We Collect' },
    { id: 'usage', title: '07 How We Use Information' },
    { id: 'public-info', title: '08 Public Information' },
    { id: 'third-parties', title: '09 Third Parties' },
    { id: 'security', title: '10 Security' },
    { id: 'access', title: '11 Access & Corrections' },
    { id: 'data-transfer', title: '12 Data Transfer' },
    { id: 'legal', title: '13 Indian Law Compliance' },
];

const PrivacyPolicy = () => {
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

    return (
        <div className="min-h-screen bg-[#FDFDFF]">
            <Navbar />

            {/* Header Section */}
            <div className="pt-32 pb-20 bg-gradient-to-b from-purple-50 via-white to-transparent border-b border-purple-100/50">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
                        Privacy <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">Policy</span>
                    </h1>
                    <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto">
                        At Plexis, your privacy is our priority. We are committed to protecting your personal data and being transparent about our practices.
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

                {/* Content Section */}
                <main className="flex-1 max-w-3xl">
                    <div className="prose prose-lg prose-purple prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-strong:text-gray-900 space-y-12 md:space-y-16">

                        <section id="introduction">
                            <div className="relative overflow-hidden bg-white p-7 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-purple-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <div className="hidden md:block absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[5rem] -mr-10 -mt-10 opacity-50"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-9 h-9 md:w-10 md:h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                        </div>
                                        <span className="text-xs md:text-sm font-black text-purple-600 uppercase tracking-[0.2em]">Agreement Notice</span>
                                    </div>
                                    <p className="text-lg md:text-xl text-gray-800 font-semibold leading-relaxed mb-6">
                                        This agreement is between <span className="text-purple-600">Plexis Pvt Ltd</span> (also known as Plexis) and you/the entity you represent.
                                    </p>
                                    <p className="text-sm md:text-base text-gray-600 leading-relaxed italic border-l-4 border-purple-200 pl-4 md:pl-6">
                                        By accessing or using any part of the service, you agree to be bound by these terms. If you are entering into this on behalf of a company, you must have the authority to bind that entity.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section id="acceptance" className="scroll-mt-32">
                            <h2 className="text-2xl md:text-3xl font-black mb-6 text-gray-900 flex items-center gap-3 md:gap-4">
                                <span className="text-purple-200 text-3xl md:text-4xl font-light">01</span>
                                Acceptance of Terms
                            </h2>
                            <div className="space-y-4">
                                <p>
                                    This policy clearly explains what, why and how the information is collected by us during your visit to our website or while you are using our service or while communicating with us through direct or indirect channels (which are all collectively referred to as “Services”).
                                </p>
                                <p>
                                    We are extremely cautious and take privacy very seriously and <strong>never sell your information</strong>, email address, mobile number and customer information.
                                </p>
                            </div>
                        </section>

                        <section id="definitions" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">02</span>
                                Definitions
                            </h2>
                            <div className="grid gap-6">
                                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">"We", "Us", "Our"</span>
                                    <p className="text-sm">Refers to <strong>Plexis Pvt Ltd</strong> and the product <strong>Plexis</strong>.</p>
                                </div>
                                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">"Customer Data"</span>
                                    <p className="text-sm">Refers to personal information, emails, images, reports, and electronic data stored within the Service.</p>
                                </div>
                                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">"Personal Information"</span>
                                    <p className="text-sm">Information that identifies you directly or indirectly, including name, email, and professional details.</p>
                                </div>
                            </div>
                        </section>

                        <section id="changes" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">03</span>
                                Changes to Privacy Policy
                            </h2>
                            <p>
                                We reserve the right to change this Privacy Policy at any time. The most recent version is reflected by the date at the bottom. Updates are effective immediately upon notice, which may be given via website posting or direct email.
                            </p>
                        </section>

                        <section id="scope" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">04</span>
                                Scope of This Policy
                            </h2>
                            <p>
                                This Privacy Policy is effective with respect to any data we have collected or collect about and/or from you, according to our Terms of Service.
                            </p>
                        </section>

                        <section id="questions" className="scroll-mt-32 py-4 md:py-10">
                            <h2 className="text-2xl md:text-3xl font-black mb-8 md:mb-10 text-gray-900 flex items-center gap-3 md:gap-4">
                                <span className="text-purple-200 text-3xl md:text-4xl font-light">05</span>
                                Questions & Concerns
                            </h2>
                            <div className="group relative bg-white p-8 md:p-12 rounded-[1.5rem] md:rounded-[2.5rem] border border-purple-100 shadow-[0_15px_50px_rgba(109,40,217,0.03)] hover:border-purple-300 transition-all duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-10">
                                    <div className="space-y-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-2">
                                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">Need further clarification?</h3>
                                            <p className="text-gray-500 text-base md:text-lg mt-2 max-w-sm">Our privacy experts are ready to assist you with any inquiries regarding your data.</p>
                                        </div>
                                    </div>
                                    <a
                                        href="mailto:contact@plexis.in"
                                        className="inline-flex items-center justify-center px-8 md:px-10 py-4 md:py-5 bg-purple-600 text-white rounded-[1rem] md:rounded-[1.5rem] font-black hover:bg-purple-700 transition-all duration-300 shadow-xl shadow-purple-100 hover:shadow-purple-200 hover:-translate-y-1 text-sm md:text-base"
                                    >
                                        Contact Privacy Team
                                        <svg className="w-4 h-4 md:w-5 md:h-5 ml-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </a>
                                </div>
                            </div>
                        </section>

                        <section id="collection" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">06</span>
                                Information We Collect
                            </h2>
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">Voluntary Information</h4>
                                    <p>Personal details given during sign-up, consulting, or integrations (e.g., name, address, payment info).</p>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">Automatic Collection</h4>
                                    <p>Usage data, IP addresses, browser types, and interaction logs collected via cookies and beacons.</p>
                                </div>
                                <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100">
                                    <h4 className="text-lg font-bold text-violet-900 mb-2">Cookie Policy</h4>
                                    <p className="text-sm text-violet-800/80">
                                        We use session and persistent cookies to optimize your experience. You can browse Plexis without cookies via browser settings, though some facilitate features may be limited.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section id="usage" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">07</span>
                                How We Use Information
                            </h2>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
                                {[
                                    "To promote our services to you",
                                    "To bill and collect payments",
                                    "To send system alerts and updates",
                                    "To provide dedicated customer support",
                                    "To ensure compliance with legal terms",
                                    "To protect rights and safety of users",
                                    "To improve service functionality",
                                    "To provide personalized suggestions"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                                        <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] mt-1">✓</span>
                                        <span className="text-sm font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section id="public-info" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">08</span>
                                Public Information
                            </h2>
                            <p>
                                Information included in comments on our public blogs may be read, collected, and used by anyone. You participate at your own risk without expectation of privacy.
                            </p>
                        </section>

                        <section id="third-parties" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">09</span>
                                Third Parties
                            </h2>
                            <p>
                                We may share your information with third-party service providers (e.g., payment processors, hosting services) only as necessary to provide the Services and in a manner consistent with this policy.
                            </p>
                        </section>

                        <section id="security" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">10</span>
                                Security
                            </h2>
                            <p>
                                If a security breach materially affects you or your customer data, <strong>Plexis</strong> will notify you as soon as possible and provide a detailed report on actions taken in response.
                            </p>
                            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mt-6">
                                <p className="text-sm text-red-800 font-medium">
                                    We use SSL encryption for all data transmission and follow industry-standard practices to protect your information.
                                </p>
                            </div>
                        </section>

                        <section id="access" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">11</span>
                                Access & Corrections
                            </h2>
                            <p>
                                We provide you with reasonable access to personal data you have provided. You may update, correct, or delete your account information through the Service at any time.
                            </p>
                        </section>

                        <section id="data-transfer" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">12</span>
                                Data Transfer
                            </h2>
                            <p>
                                We store and process data in India and possibly other countries. By using our Services, you consent to this processing and transfer of information.
                            </p>
                        </section>

                        <section id="legal" className="scroll-mt-32 pb-20">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">13</span>
                                Indian Law Compliance
                            </h2>
                            <p>
                                Under Indian Law, we will not share any Personal Information with third-parties for their direct marketing purposes to the extent prohibited by Indian law. We adhere to national standards for data transparency and security.
                            </p>

                            <div className="mt-12 md:mt-20 relative p-1 pb-1 flex justify-center">
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
                                            <svg className="w-4 h-4 md:w-5 md:h-5 ml-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E9D5FF;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D8B4FE;
        }
      `}} />
        </div>
    );
};

export default PrivacyPolicy;
