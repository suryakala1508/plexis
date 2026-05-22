import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const sections = [
    { id: 'overview', title: 'Terms Overview' },
    { id: 'acceptance', title: '01 Acceptance of Terms' },
    { id: 'description', title: '02 Description of Service' },
    { id: 'modification', title: '03 Modification of Terms' },
    { id: 'registration', title: '04 Account Registration' },
    { id: 'admin', title: '05 Organizations & Admins' },
    { id: 'privacy', title: '06 Privacy' },
    { id: 'questions', title: '07 Questions & Support' },
    { id: 'liability', title: '08 Limitation of Liability' },
    { id: 'communications', title: '09 Communications' },
    { id: 'complaints', title: '10 Complaints' },
    { id: 'fees', title: '11 Fees and Payments' },
    { id: 'restrictions', title: '12 Restrictions on Usage' },
    { id: 'spam', title: '13 Spamming & Illegal' },
    { id: 'inactive', title: '14 Inactive Accounts' },
    { id: 'ownership', title: '15 Data Ownership' },
    { id: 'arbitration', title: '16 Arbitration' },
    { id: 'termination', title: '17 Suspension & Termination' },
];

const TermsAndConditions = () => {
    const [activeSection, setActiveSection] = useState('overview');

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
                        Terms of <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">Service</span>
                    </h1>
                    <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto">
                        These terms govern your use of the Plexis platform. We recommend reading them carefully to understand your rights and obligations.
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
                        <h3 className="hidden md:block text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-4">Agreement Sections</h3>
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

                        <section id="overview" className="scroll-mt-32">
                            <div className="relative overflow-hidden bg-white p-7 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-purple-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <div className="hidden md:block absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[5rem] -mr-10 -mt-10 opacity-50"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-9 h-9 md:w-10 md:h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                        </div>
                                        <span className="text-xs md:text-sm font-black text-purple-600 uppercase tracking-[0.2em]">Service Agreement</span>
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
                            <p>
                                You agree to the terms and conditions by clicking the checkbox that indicates your acceptance during the registration or subscription process. Usage of the service without explicit disagreement constitutes acceptance.
                            </p>
                        </section>

                        <section id="description" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">02</span>
                                Description of Service
                            </h2>
                            <p>
                                <strong>Plexis</strong> is a product of <strong>Plexis Pvt Ltd</strong>, providing an advanced email client and management service tailored for organizational and personal needs. We offer tools to manage business exchanges, media storage, and project workflows.
                            </p>
                            <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 text-sm shadow-sm">
                                <strong>Note:</strong> Internet access and necessary hardware to access the service are the sole responsibility of the user.
                            </div>
                        </section>

                        <section id="modification" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">03</span>
                                Modification of Terms
                            </h2>
                            <p>
                                <strong>Plexis</strong> reserves the right to update these terms at any time. Major changes affecting your rights will be notified via your primary email address with 20 days' advanced notice. Continued use post-changes indicates consent.
                            </p>
                        </section>

                        <section id="registration" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">04</span>
                                Account Registration
                            </h2>
                            <p>
                                Users must provide accurate, complete, and true information during sign-up. Failure to maintain current information may result in account termination. We reserve the right to refuse service if information is found to be false or misleading.
                            </p>
                        </section>

                        <section id="admin" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">05</span>
                                Organizations & Administrators
                            </h2>
                            <p>
                                Organization accounts may designate multiple administrators. Administrators are responsible for user management and account configuration. <strong>Plexis</strong> is not responsible for internal management or unauthorized actions by designated administrators.
                            </p>
                        </section>

                        <section id="privacy" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">06</span>
                                Personal Information and Privacy
                            </h2>
                            <p>
                                The personal information provided by you to <strong>Plexis</strong> through the service is governed by the <strong>Plexis</strong> Privacy policy. Your selection to use the Service indicated that you are accepting the terms.
                            </p>
                        </section>

                        <section id="questions" className="scroll-mt-32 py-4 md:py-10">
                            <h2 className="text-2xl md:text-3xl font-black mb-8 md:mb-10 text-gray-900 flex items-center gap-3 md:gap-4">
                                <span className="text-purple-200 text-3xl md:text-4xl font-light">07</span>
                                Questions & Support
                            </h2>
                            <div className="group relative bg-white p-8 md:p-12 rounded-[1.5rem] md:rounded-[2.5rem] border border-purple-100 shadow-[0_15px_50px_rgba(109,40,217,0.03)] hover:border-purple-300 transition-all duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-10">
                                    <div className="space-y-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-2">
                                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">Doubts about our terms?</h3>
                                            <p className="text-gray-500 text-base md:text-lg mt-2 max-w-sm">Our legal consultants are here to help you navigate our service agreements.</p>
                                        </div>
                                    </div>
                                    <a
                                        href="mailto:contact@plexis.in"
                                        className="inline-flex items-center justify-center px-8 md:px-10 py-4 md:py-5 bg-purple-600 text-white rounded-[1rem] md:rounded-[1.5rem] font-black hover:bg-purple-700 transition-all duration-300 shadow-xl shadow-purple-100 hover:shadow-purple-200 hover:-translate-y-1 text-sm md:text-base"
                                    >
                                        Contact Support
                                        <svg className="w-4 h-4 md:w-5 md:h-5 ml-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </a>
                                </div>
                            </div>
                        </section>

                        <section id="liability" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">08</span>
                                Limitation of Liability
                            </h2>
                            <p>
                                In no event shall <strong>Plexis Pvt Ltd</strong>, its directors, or affiliates be liable for indirect, incidental, or consequential damages resulting from service usage or inability to use the service. Our total liability shall not exceed the fees paid by you for the service.
                            </p>
                        </section>

                        <section id="communications" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">09</span>
                                Communications from Plexis
                            </h2>
                            <p>
                                The Service includes certain communication from <strong>Plexis</strong> and this includes administrative messages and service announcements. You understand that these communications are considered as a part of using the Service.
                            </p>
                        </section>

                        <section id="complaints" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">10</span>
                                Complaints
                            </h2>
                            <p>
                                If you were to receive any complaints from any person against you in connection with your activities on using the Service, we would be forwarding that complaint to the primary email address in your user account.
                            </p>
                        </section>

                        <section id="fees" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">11</span>
                                Fees and Payments
                            </h2>
                            <p>
                                Services are provided on a subscription basis, billed annually unless specified otherwise. Fees are non-refundable. Failure to process payments may result in immediate suspension of access.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
                                    <span className="font-bold text-purple-600">Plan Upgrades:</span>
                                    <span className="text-xs text-gray-500">7 days notice required</span>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
                                    <span className="font-bold text-purple-600">Termination:</span>
                                    <span className="text-xs text-gray-500">10 days notice required</span>
                                </div>
                            </div>
                        </section>

                        <section id="restrictions" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">12</span>
                                Restrictions on Usage
                            </h2>
                            <p>
                                You agree that you will not transfer or make the Service available for use to any third party. You shall not provide any service based on the Service without prior written permission.
                            </p>
                        </section>

                        <section id="spam" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">13</span>
                                Spamming & Illegal Activities
                            </h2>
                            <p>
                                The service must not be used for illegal transmission, harassment, or distribution of unsolicited "spam" or malicious code. We reserve the right to terminate access if unauthorized or illegal activity is suspected.
                            </p>
                        </section>

                        <section id="inactive" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">14</span>
                                Inactive User Accounts Policy
                            </h2>
                            <p>
                                <strong>Plexis</strong> reserves the right to terminate user accounts which are unpaid and are inactive for a continuous period of 90 days. In such an event of account termination, all the data associated with the user account will also be deleted permanently.
                            </p>
                        </section>

                        <section id="ownership" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">15</span>
                                Data Ownership
                            </h2>
                            <p>
                                <strong>Plexis</strong> respects your right to have ownership over data and content created and stored by you. Therefore <strong>Plexis</strong> does not own the customer data. You are responsible for the content created and stored by you.
                            </p>
                        </section>

                        <section id="arbitration" className="scroll-mt-32">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">16</span>
                                Arbitration
                            </h2>
                            <p>
                                Any controversy or claim arising out of or relating to the Terms shall be settled by binding arbitration in accordance with the commercial arbitration rules of the Indian Arbitration Association. The arbitration shall be conducted in Chennai.
                            </p>
                        </section>

                        <section id="termination" className="scroll-mt-32 pb-20">
                            <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-4">
                                <span className="text-purple-200 text-4xl font-light">17</span>
                                Suspension & Termination
                            </h2>
                            <p>
                                We may disable accounts for illegal activity, extended inactivity (90 days for unpaid accounts), or government requests. Data associated with terminated accounts will be deleted permanently after the specified notice period.
                            </p>

                            <div className="mt-12 md:mt-20 relative p-1 pb-1 flex justify-center">
                                <div className="w-full bg-gradient-to-br from-white via-purple-50/30 to-white p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border border-purple-100 relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(109,40,217,0.1)]">
                                    <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-purple-200/20 blur-[80px] rounded-full"></div>
                                    <div className="hidden md:block absolute -bottom-24 -left-24 w-64 h-64 bg-violet-200/20 blur-[80px] rounded-full"></div>

                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-purple-100 shadow-sm mb-6 md:mb-8">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                                            <span className="text-[10px] md:text-xs font-black text-purple-600 uppercase tracking-widest">Legal Assistance</span>
                                        </div>

                                        <h4 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                                            Questions about these terms?
                                        </h4>
                                        <p className="text-gray-500 text-base md:text-lg max-w-lg mb-8 md:mb-10 leading-relaxed">
                                            Our legal support team is available to help clarify any part of this agreement and ensure you're fully informed.
                                        </p>

                                        <a
                                            href="mailto:contact@plexis.in"
                                            className="group relative inline-flex items-center justify-center px-12 py-5 bg-white border-2 border-purple-600 text-purple-600 rounded-xl md:rounded-2xl font-black transition-all duration-300 hover:bg-purple-600 hover:text-white hover:shadow-2xl hover:shadow-purple-200 active:scale-95 text-sm md:text-base"
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

export default TermsAndConditions;
