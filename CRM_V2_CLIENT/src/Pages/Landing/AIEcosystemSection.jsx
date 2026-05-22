import React from "react";
import logo3d from "../../assets/Camera18.gif";

export default function AIEcosystemSection() {
  return (
    <section className="w-full min-h-[60vh] bg-gradient-to-br from-purple-50 via-white to-purple-100 flex flex-col md:flex-row items-center justify-center px-6 py-16 overflow-x-hidden">
      {/* Left: 3D Illustration (swapped from right) */}
      <div className="flex-1 flex items-center justify-center relative w-full h-auto min-h-[300px] md:min-h-[400px] order-2 md:order-1">
        <img
          src={logo3d}
          alt="3D Company Logo"
          className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-auto object-contain"
          style={{ boxShadow: "none", background: "none", borderRadius: 0 }}
        />
      </div>
      
      {/* Right: Text (swapped from left) */}
      <div className="flex-1 flex items-center justify-center order-1 md:order-2">
        <div>
          <h2 
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight max-w-full"
            style={{ fontFamily: "'Poppins', Arial, sans-serif" }}
          >
            We unite the event management community—
            <span className="text-purple-600 font-extrabold">photographers</span>,{" "}
            <span className="text-purple-600 font-extrabold">studios</span>,{" "}
            <span className="text-purple-600 font-extrabold">vendors</span>, and{" "}
            <span className="text-purple-600 font-extrabold">clients</span>
            —on one platform, simplifying every step of your projects.
          </h2>
          <p 
            className="mt-6 text-lg md:text-xl text-gray-600 max-w-full font-semibold"
            style={{ fontFamily: "'Poppins', Arial, sans-serif" }}
          >
            Built with passion and relentless effort, our solution transforms hard work into seamless collaboration and success for all.
          </p>
        </div>
      </div>
    </section>
  );
}