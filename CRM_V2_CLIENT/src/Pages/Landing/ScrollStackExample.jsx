// ScrollStackExample.js
import React from "react";
import { useNavigate } from "react-router-dom"; // Add this import for navigation
import ScrollStack, { ScrollStackItem } from "./ScrollStack";
import studioOwnerImg from "../../assets/Studio.png";
import photographerImg from "../../assets/camera-with-strap-flat-style-vector-removebg-preview.png";
import printingVendorImg from "../../assets/Printingvendor.png";

const ScrollStackExample = () => {
  const navigate = useNavigate(); // Initialize navigation hook

  const handleStudioOwnerClick = () => {
    navigate("/login");
  };

  const handlePhotographerClick = () => {
    navigate("/login");
  };

  const handlePrintingVendorClick = () => {
    navigate("/login");
  };

  return (
    <ScrollStack
      className="w-full h-screen"
      itemDistance={50}
      itemScale={0.05}
      itemStackDistance={20}
      stackPosition="10%" // Reduced from 15% to 10% to decrease space above
      scaleEndPosition="10%"
      baseScale={0.9}
      rotationAmount={0}
      blurAmount={0}
    >
      <ScrollStackItem itemClassName="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white h-[26rem] p-16 flex items-center relative">
        <img
          src={studioOwnerImg}
          alt="Studio Owner"
          className="w-56 h-56 object-contain shadow-none border-none mr-10"
          style={{ background: "none" }}
        />
        <div className="flex-1 text-left pr-8">
          <h3 className="text-5xl font-black mb-4 font-sans tracking-tight" style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}>
            Studio Owners
          </h3>
          <p className="text-xl leading-relaxed font-normal font-[Inter]">
        Your platform isn’t just an ordinary CRM—it uniquely provides studio owners with a complete, intelligent project ecosystem. The dashboard is designed for total visibility, enabling real-time updates across every project phase, from lead acquisition and booking to final delivery. Studio owners can recruit and manage team members directly, assign roles with a click, and use advanced automations to reduce manual effort. With integrated photo culling, AI-driven face recognition, and secure sharing, studios can speed up editing and deliverables while protecting client privacy. Custom analytics and financial summaries give owners actionable business insights, helping them grow sustainably.          </p>
        </div>
        <button 
          onClick={handleStudioOwnerClick}
          className="absolute bottom-6 right-6 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 text-white px-8 py-3 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-black/20 flex items-center gap-2 group"
        >
          <span>View</span>
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </ScrollStackItem>

      <ScrollStackItem itemClassName="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white h-[26rem] p-16 flex items-center relative">
        <img
          src={photographerImg}
          alt="Photographer"
          className="w-56 h-56 object-contain shadow-none border-none mr-10"
          style={{ background: "none" }}
        />
        <div className="flex-1 text-left pr-8">
          <h3 className="text-5xl font-black mb-4 font-sans tracking-tight" style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}>
            Photographers
          </h3>
          <p className="text-xl leading-relaxed font-normal font-[Inter]">
        Unlike marketplaces that simply list profiles, your platform actively promotes photographers via intelligent matching systems that connect them with clients and studios suited to their expertise and style. The onboarding is rapid, enabling creators to start new projects within minutes. Portfolio tools are deeply integrated; photographers can showcase full galleries, receive direct client inquiries, and even get automated feedback from studios post-project. Intelligent workflow automation—like timeline reminders, deadline tracking, and instant file sharing—frees up creative energy by minimizing administrative work. The built-in network functionality fosters real professional relationships, community, and skill-building—truly supporting photographers’ growth beyond just job matching.          </p>
        </div>
        <button 
          onClick={handlePhotographerClick}
          className="absolute bottom-6 right-6 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 text-white px-8 py-3 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-black/20 flex items-center gap-2 group"
        >
          <span>View</span>
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </ScrollStackItem>

      <ScrollStackItem itemClassName="bg-gradient-to-br from-green-900 via-green-800 to-green-700 text-white h-[26rem] p-16 flex items-center relative">
        <img
          src={printingVendorImg}
          alt="Printing Vendor"
          className="w-56 h-56 object-contain shadow-none border-none mr-10"
          style={{ background: "none" }}
        />
        <div className="flex-1 text-left pr-8">
          <h3 className="text-5xl font-black mb-4 font-sans tracking-tight" style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}>
            Printing Vendors
          </h3>
          <p className="text-xl leading-relaxed font-normal font-[Inter]">
          Our platform offers printing vendors a unique, always-on discovery engine: automated lead distribution ensures vendors get matched with suitable jobs, not just raw inquiries. Auto-quotation tools allow vendors to customize pricing on the fly, providing instant estimates and improving win rates. The order workflow is transparent, with real-time status tracking for both vendors and their customers. Integration with studios and photographers means files are transferred securely and instantly once projects are approved—eliminating manual file handovers and miscommunication. Direct chat and update features create seamless collaboration, transforming print fulfillment from a transactional service to a consultative partnership.          </p>
        </div>
        <button 
          onClick={handlePrintingVendorClick}
          className="absolute bottom-6 right-6 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 text-white px-8 py-3 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-black/20 flex items-center gap-2 group"
        >
          <span>View</span>
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </ScrollStackItem>
    </ScrollStack>
  );
};

export default ScrollStackExample;