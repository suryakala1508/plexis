import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import dataDeletionImage from '../../assets/data-deletion.png';

const steps = [
    { step: 1, text: <>Login to <strong>Plexis</strong></> },
    { step: 2, text: <>Go to <strong>Account → Profile</strong></> },
    { step: 3, text: <>Scroll to the bottom of the screen</> },
    { step: 4, text: <>Tap <strong>"Delete Account"</strong></> },
    { step: 5, text: <>Confirm deletion when prompted</> },
    { step: 6, text: <>Your data will be permanently removed from our servers</> },
];

const DataDeletion = () => {
    return (
        <div className="min-h-screen bg-[#FDFDFF]">
            <Navbar />

            {/* Header */}
            <div className="pt-32 pb-20 bg-gradient-to-b from-purple-50 via-white to-transparent border-b border-purple-100/50">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
                        Business Data <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">Deletion</span>
                    </h1>
                    <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto">
                        You have full control over your data. Delete your account and all associated data at any time.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">

                {/* Tag */}
                <div className="mb-8">
                    <span className="inline-block px-4 py-1.5 bg-gray-100 text-gray-600 rounded-md text-sm font-semibold">
                        User Data Deletion
                    </span>
                </div>

                {/* Intro */}
                <div className="mb-10 space-y-3">
                    <p className="text-gray-600">
                        Plexis is a product of <strong>Plexis Pvt Ltd.</strong>
                    </p>
                    <p className="text-gray-900 font-bold text-lg">
                        You can delete your account and all stored data at any time.
                    </p>
                    <p className="text-gray-900 font-bold">Follow these steps:</p>
                </div>

                {/* Steps */}
                <div className="space-y-4 mb-10">
                    {steps.map((item) => (
                        <div key={item.step} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-md bg-purple-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                                {item.step}
                            </span>
                            <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                    <img
                        src={dataDeletionImage}
                        alt="Delete Account screen in Plexis app"
                        className="w-full h-auto object-cover"
                    />
                </div>
                <p className="text-xs text-gray-400 text-center mt-3 mb-5">
                    Account → Profile → Delete Account
                </p>

                {/* Note */}
                <div className="bg-violet-50 p-5 rounded-2xl border border-violet-100 mb-10">
                    <p className="text-sm text-violet-800/80">
                        <strong>Note:</strong> Once deleted, your data cannot be recovered. If you need help, reach out to our support team before proceeding.
                    </p>
                </div>

                {/* Contact */}


                {/* Image at bottom */}

                <div className="mb-16">
                    <p className="text-sm text-gray-600 mb-3">Need help? Contact us at:</p>
                    <a
                        href="mailto:contact@plexis.in"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all duration-200 shadow-lg shadow-purple-100 hover:-translate-y-0.5"
                    >
                        contact@plexis.in
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </a>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default DataDeletion;    