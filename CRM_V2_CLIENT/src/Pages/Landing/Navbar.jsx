import { useState, useRef, useEffect } from "react"
import { Link, useNavigate,useLocation } from "react-router-dom"
import { LogOut, Settings, ChevronRight, Menu, X, BarChart3, Calendar, User } from "lucide-react"
import logo from "../../assets/logo.png"
import lightlogo from "/logo_light.png"
import { API_URL } from "@/services/api"

const Navbar = ({ activeSection }) => {
const navigate = useNavigate();
const location = useLocation(); 

// ADD THESE 3 LINES:
const isOurStoryPage = location.pathname === "/our-story";
const isContactSection = activeSection === "contact" || location.hash === "#our-contact";
const isDarkTheme =false;
const [user, setUser] = useState(null);
const [isProfileOpen, setIsProfileOpen] = useState(false);
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const profileRef = useRef(null);
const mobileMenuRef = useRef(null);


const fetchUser = async () => {
  try {
    const res = await fetch(`${API_URL}/user`, {
      method: "GET",
      credentials: "include", // send cookies
    });
    const data = await res.json();
    if (data?.success && data.user) {
      setUser(data.user);
    } else {
      setUser(null);
    }
  } catch (err) {
    console.error("Failed to fetch user:", err);
    setUser(null);
  }
};

// Check auth on mount & listen for login/logout events
useEffect(() => {
  fetchUser();

  const handleAuthChange = () => fetchUser();
  window.addEventListener("authChange", handleAuthChange);

  return () => window.removeEventListener("authChange", handleAuthChange);
}, []);

// Close profile/mobile dropdown when clicking outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setIsProfileOpen(false);
    }
    if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
      setIsMobileMenuOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

// Close mobile menu on window resize
useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth >= 1024) {
      setIsMobileMenuOpen(false);
    }
  };

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

// Scroll direction visibility toggle
const [isNavbarVisible, setIsNavbarVisible] = useState(true);
const [scrolled, setScrolled] = useState(false);




useEffect(() => {
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    setScrolled(currentScrollY > 10);
    setIsNavbarVisible(true); // Always keep navbar visible
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
const scrollToSection = (sectionId, path = null) => {
  // Close mobile menu first
  setIsMobileMenuOpen(false);
  
  // Special handling for contact section on our-story page
  if (sectionId === 'contact' && path === '/our-story') {
    if (location.pathname !== '/our-story') {
      // Navigate to our-story page first
      navigate('/our-story');
      // Wait for navigation, then scroll to contact
      setTimeout(() => {
        const element = document.getElementById('our-contact');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // Already on our-story page, just scroll to contact
      const element = document.getElementById('our-contact');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    return;
  }
  
  // If we're not on the home page, navigate there first
  if (location.pathname !== '/') {
    navigate('/');
    // Wait for navigation, then scroll
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  } else {
    // Already on home page, just scroll
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

const navItems = [
  { label: "Features", id: "features" },
  { label: "Benefits", id: "stakeholders" },
  { label: "Testimonials", id: "testimonials" },
  { label: "Contact Us", path: "/our-story", id: "contact" }, 
];

const navLinkBaseClass = "relative py-2 transition-all duration-300 group";
const getTextColor = (isActive = false) => {
  if (isDarkTheme) {
    return isActive ? "text-purple-400" : "text-white hover:text-purple-300";
  }
  return isActive ? "text-purple-600" : "text-gray-700 hover:text-purple-600";
};
const getMobileTextColor = (isActive = false) => {
  if (isDarkTheme) {
    return isActive ? "text-purple-400" : "text-white hover:text-purple-300";
  }
  return isActive ? "text-purple-600" : "text-gray-700 hover:text-purple-600";
};
const navLinkFontStyles = {
  fontFamily: '"Lexend Deca", sans-serif',
  fontWeight: 600,
  fontSize: "15px",
  lineHeight: "18px",
};
const getLinkClass = (id) => `${navLinkBaseClass} ${getTextColor(activeSection === id)}`;

// Logout
const handleLogout = async () => {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include", // send cookies
    });
  } catch (err) {
    console.error("Error logging out:", err);
  }

  setUser(null);
  setIsProfileOpen(false);
  setIsMobileMenuOpen(false);

  window.dispatchEvent(new Event("authChange"));
  navigate("/");
};

// Dashboard/profile navigation
const navigateToDashboard = () => {
  if (user?.role?.toLowerCase() === "client") {
    navigate(`/client/${user.refNo}`);
  } else if (user?.role === "StudioOwner") {
    navigate(`/studio/${user.refNo}`);
  }
  setIsProfileOpen(false);
  setIsMobileMenuOpen(false);
};

const navigateToSettings = () => {
  if (user?.role?.toLowerCase() === "client") {
    navigate(`/client/${user.refNo}/account`);
  } else if (user?.role === "StudioOwner") {
    navigate(`/studio/${user.refNo}`);
  }
  setIsProfileOpen(false);
  setIsMobileMenuOpen(false);
};

const handleMobileLinkClick = () => {
  setIsMobileMenuOpen(false);
};

// Profile Avatar Component
const ProfileAvatar = ({ size = "md", onClick = null }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-16 h-16"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
    xl: "text-xl"
  };

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-transparent hover:border-purple-400/70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900 hover:scale-105 active:scale-95`}
      aria-label="Profile menu"
    >
      {user?.profilePicture ? (
        <img
          src={user.profilePicture}
          alt={user?.name || "User"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user?.name || "U"
            )}&background=random`;
          }}
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-600 flex items-center justify-center text-white font-bold ${textSizes[size]} shadow-inner`}>
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
      )}
    </button>
  );
};

// Menu Item Component
const MenuItem = ({ icon: Icon, title, subtitle, onClick, variant = "default", chevron = true }) => {
  const variants = {
    default: "hover:bg-gray-100 text-gray-900",
    primary: "hover:bg-purple-50 text-gray-900",
    danger: "hover:bg-red-50 text-red-600"
  };

  const iconVariants = {
    default: "bg-gray-100 text-gray-600",
    primary: "bg-purple-100 text-purple-600",
    danger: "bg-red-100 text-red-600"
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${variants[variant]}`}
    >
      <div className={`p-2.5 rounded-lg ${iconVariants[variant]} group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="w-4 h-4 md:w-5 md:h-5" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="font-semibold text-sm md:text-base truncate">{title}</p>
        <p className={`text-xs md:text-sm opacity-70 truncate ${
          variant === "danger" ? "text-red-500/70" : "text-gray-500"
        }`}>
          {subtitle}
        </p>
      </div>
      {chevron && (
        <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
      )}
    </button>
  );
};

return (
  <>
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300
        ${isNavbarVisible ? "translate-y-0" : "-translate-y-full"}
      `}
      style={{ willChange: "transform" }}
    >
      <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 ${scrolled ? "py-3" : ""}`}>

<div
  className={`flex items-center justify-between h-16 md:h-20 transition-all duration-300 ${
    scrolled
      ? "rounded-2xl px-4 border border-gray-200 shadow-lg bg-white"
      : "border border-transparent bg-transparent"
  }`}
>
          {/* Logo and Company Name */}
<Link to="/" className="flex items-center space-x-2 flex-shrink-0 group ml-2 md:ml-4">            <div className="relative">
              <img
                src={isDarkTheme ? lightlogo : logo} 
                alt="Plexis Logo"
                className="w-24 h-24 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-22 lg:h-22 object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-purple-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </div>
          </Link>

            {/* Desktop Navigation */}
<div className="hidden lg:flex items-center justify-center flex-1 px-8">
  <div className="flex items-baseline space-x-6 lg:space-x-10">
    {navItems.map(({ label, id, path }) => {
      // Special handling for Contact Us (goes to different page)

  if (path) {
    return (
      <button
        key={id}
        onClick={() => scrollToSection(id, path)}
        className={`relative px-4 py-2 transition-all duration-300 group font-semibold ${
          activeSection === id 
            ? (isDarkTheme ? "text-purple-400" : "text-purple-600")
            : (isDarkTheme ? "text-white hover:text-purple-300" : "text-gray-700 hover:text-purple-600")
        } ${isDarkTheme ? "hover:bg-white/10" : "hover:bg-purple-50"} rounded-lg`}
        style={navLinkFontStyles}
        aria-label={label}
        aria-current={activeSection === id ? "page" : undefined}
      >
        {label}
        <span
          className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 transition-all duration-300 ease-out
          bg-gradient-to-r from-purple-600 to-violet-600 rounded-full
          ${activeSection === id ? "w-3/4" : "group-hover:w-3/4"}`}
        />
      </button>
    );
  }
      
      // For Features, Benefits, Testimonials - use scroll function
      return (
        <button
          key={id}
          onClick={() => scrollToSection(id)}
          className={`relative px-4 py-2 transition-all duration-300 group font-semibold ${
            activeSection === id 
              ? (isDarkTheme ? "text-purple-400" : "text-purple-600")
              : (isDarkTheme ? "text-white hover:text-purple-300" : "text-gray-700 hover:text-purple-600")
          } ${isDarkTheme ? "hover:bg-white/10" : "hover:bg-purple-50"} rounded-lg`}
          style={navLinkFontStyles}
          aria-label={label}
          aria-current={activeSection === id ? "page" : undefined}
        >
          {label}
          <span
            className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 transition-all duration-300 ease-out
            bg-gradient-to-r from-purple-600 to-violet-600 rounded-full
            ${activeSection === id ? "w-3/4" : "group-hover:w-3/4"}`}
          />
        </button>
      );
    })}

    <Link
      to="/our-story"
      className={`relative py-2 transition-colors duration-200 group font-semibold ${
        activeSection === "our-story"
          ? (isDarkTheme ? "text-purple-400" : "text-purple-600")
          : (isDarkTheme ? "text-white hover:text-purple-300" : "text-gray-700 hover:text-purple-600")
      }`}
      style={navLinkFontStyles}
      aria-label="Our Story"
      aria-current={activeSection === "our-story" ? "page" : undefined}
    >
      Our Story
      <span
        className={`absolute bottom-0 left-0 w-full h-0.5 transition-transform duration-300 ease-out
        bg-purple-600
        ${activeSection === "our-story" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
      />
    </Link>
  </div>
</div>

          {/* Right Side - Auth Section & Mobile Menu Button */}
          <div className="flex items-center space-x-3">
            {user ? (
              // Profile Section (when logged in) - Desktop Only
              <div className="relative hidden lg:flex" ref={profileRef}>
                <ProfileAvatar onClick={() => setIsProfileOpen(!isProfileOpen)} />

                {/* Enhanced Profile Dropdown */}
                {isProfileOpen && (
                  <div
                    className="absolute right-0 mt-4 w-80 xl:w-96 rounded-2xl shadow-2xl border backdrop-blur-xl transform transition-all duration-300 ease-out bg-white/95 border-purple-200/50"
                    style={{
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(147, 51, 234, 0.1), 0 0 20px rgba(147, 51, 234, 0.1)",
                      backdropFilter: "blur(20px) saturate(180%)"
                    }}
                  >
                    {/* User Info Header - Enhanced */}
                    <div className="p-6 border-b border-purple-200/50 bg-gradient-to-r from-purple-50 to-violet-50">
                      <div className="flex items-center space-x-4">
                        <ProfileAvatar size="xl" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg xl:text-xl text-gray-900 truncate">
                            {user.name || "User Name"}
                          </h3>
                          <p className="text-sm text-gray-600 truncate mb-2">
                            {user.email || "user@example.com"}
                          </p>
                          <div className="flex items-center">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                                user.role === "StudioOwner"
                                  ? "bg-gradient-to-r from-purple-600/20 to-purple-700/20 text-purple-300 border border-purple-600/30"
                                  : "bg-gradient-to-r from-blue-600/20 to-blue-700/20 text-blue-300 border border-blue-600/30"
                              }`}
                            >
                              {user.role === "StudioOwner" ? "🎨 Studio Owner" : "👤 Client"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items - Enhanced */}
                    <div className="p-4 space-y-2">
                      {/* Primary Action */}
                      <MenuItem
                        icon={user.role === "StudioOwner" ? BarChart3 : User}
                        title={user.role === "StudioOwner" ? "Studio Dashboard" : "My Dashboard"}
                        subtitle={user.role === "StudioOwner" ? "Manage studio and bookings" : "Manage events and bookings"}
                        onClick={navigateToDashboard}
                        variant="primary"
                      />

                      {/* Profile Settings */}
                      <MenuItem
                        icon={Settings}
                        title="Account Settings"
                        subtitle="Manage profile and preferences"
                        onClick={navigateToSettings}
                      />

                      {/* Studio Owner Specific Actions */}
                      {user.role === "StudioOwner" && (
                        <>
                          <MenuItem
                            icon={BarChart3}
                            title="Analytics"
                            subtitle="View performance metrics"
                            onClick={() => {
                              navigate(`/studio/${user.id}/analytics`)
                              setIsProfileOpen(false)
                            }}
                          />

                          <MenuItem
                            icon={Calendar}
                            title="Bookings Management"
                            subtitle="Manage reservations"
                            onClick={() => {
                              navigate(`/studio/${user.id}/bookings`)
                              setIsProfileOpen(false)
                            }}
                          />
                        </>
                      )}

                      {/* Divider */}
                      <div className="my-4 border-t border-purple-200/50" />

                      {/* Sign Out */}
                      <MenuItem
                        icon={LogOut}
                        title="Sign Out"
                        subtitle="Sign out of your account"
                        onClick={handleLogout}
                        variant="danger"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Login/Signup Buttons (when not logged in) - Desktop Only
              <div className="hidden lg:flex items-center space-x-4">
<Link
  to="/login"
  className={`relative px-4 py-2 transition-all duration-300 font-semibold ${
    isDarkTheme 
      ? "text-white hover:text-purple-300 hover:bg-white/10 border border-white/20" 
      : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
  } rounded-lg`}
                  style={navLinkFontStyles}
                  aria-label="Sign in"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="relative inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-purple-700 to-violet-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 text-sm font-semibold overflow-hidden group"
                  style={navLinkFontStyles}
                  aria-label="Get Started"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-purple-800 to-violet-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            )}

            {/* Mobile/Tablet Menu Button - Enhanced */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden relative p-2.5 rounded-xl transition-all duration-300 ${
  isDarkTheme 
    ? "text-white hover:bg-white/10" 
    : "text-gray-700 hover:bg-purple-50"
} hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2`}
              aria-label="Toggle mobile menu"
            >
              <div className="relative w-6 h-6">
                <span className={`absolute inset-0 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 opacity-100' : 'rotate-0 opacity-100'}`}>
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div
            ref={mobileMenuRef}
            className={`fixed top-[70px] left-0 right-0 mx-4 mt-2 rounded-2xl shadow-2xl border backdrop-blur-sm max-h-[calc(100vh-90px)] overflow-y-auto ${
  isDarkTheme 
    ? "bg-gray-900/95 border-white/10" 
    : "bg-white/95 border-purple-200/50"
}`}
          >
            <div className="p-6">
              {/* Mobile Navigation Links */}
<div className="space-y-4">
  {navItems.map(({ label, id, path }) => {
    // Special handling for Contact Us
 if (path) {
    return (
      <button
        key={id}
        onClick={() => scrollToSection(id, path)}
        className={`block w-full text-left py-3 px-4 rounded-xl transition-all duration-200 font-semibold ${
          activeSection === id
            ? (isDarkTheme ? "text-purple-400 bg-white/10" : "text-purple-600 bg-purple-100")
            : getMobileTextColor(activeSection === id)
        } ${isDarkTheme ? "hover:bg-white/10" : "hover:bg-purple-50"}`}
        style={navLinkFontStyles}
      >
        {label}
      </button>
    );
  }
    
    // For Features, Benefits, Testimonials
    return (
      <button
        key={id}
        onClick={() => scrollToSection(id)}
        className={`block w-full text-left py-3 px-4 rounded-xl transition-all duration-200 font-semibold ${
          activeSection === id
            ? (isDarkTheme ? "text-purple-400 bg-white/10" : "text-purple-600 bg-purple-100")
            : getMobileTextColor(activeSection === id)
        } ${isDarkTheme ? "hover:bg-white/10" : "hover:bg-purple-50"}`}
        style={navLinkFontStyles}
      >
        {label}
      </button>
    );
  })}

  <Link
    to="/our-story"
    onClick={handleMobileLinkClick}
    className={`block py-3 px-4 rounded-xl transition-all duration-200 font-semibold ${
      activeSection === "our-story"
        ? (isDarkTheme ? "text-purple-400 bg-white/10" : "text-purple-600 bg-purple-100")
        : getMobileTextColor()
    } ${isDarkTheme ? "hover:bg-white/10" : "hover:bg-purple-50"}`}
    style={navLinkFontStyles}
  >
    Our Story
  </Link>
</div>
            {/* Mobile Auth Section or User Actions */}
            {!user ? (
              <>
               <div className={`border-t ${isDarkTheme ? "border-white/10" : "border-gray-700/50"} pt-6`} />
                <div className="space-y-3">
                  <Link
                    to="/login"
                    onClick={handleMobileLinkClick}
                    className={`block w-full py-3.5 px-4 text-center rounded-xl border-2 transition-all duration-300 font-semibold ${
  isDarkTheme
    ? "border-white/20 text-white hover:bg-white/10"
    : "border-purple-600 text-purple-600 hover:bg-purple-50 hover:border-purple-700"
}`}
                    style={navLinkFontStyles}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={handleMobileLinkClick}
                    className="block w-full py-3.5 px-4 text-center rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:scale-[1.02] transition-all duration-300 font-semibold"
                    style={navLinkFontStyles}
                  >
                    Get Started
                  </Link>
                </div>
              </>
            ) : (
              <>
               <div className={`border-t ${isDarkTheme ? "border-white/10" : "border-gray-700/50"} pt-4`} />
                <div className="space-y-2">
                  <MenuItem
                    icon={user.role === "StudioOwner" ? BarChart3 : User}
                    title={user.role === "StudioOwner" ? "Studio Dashboard" : "My Dashboard"}
                    subtitle={user.role === "StudioOwner" ? "Manage studio and bookings" : "Manage events and bookings"}
                    onClick={navigateToDashboard}
                    variant="primary"
                  />

                  <MenuItem
                    icon={Settings}
                    title="Account Settings"
                    subtitle="Manage profile and preferences"
                    onClick={navigateToSettings}
                  />

                  {user.role === "StudioOwner" && (
                    <>
                      <MenuItem
                        icon={BarChart3}
                        title="Analytics"
                        subtitle="View performance metrics"
                        onClick={() => {
                          navigate(`/studio/${user.id}/analytics`)
                          setIsMobileMenuOpen(false)
                        }}
                      />

                      <MenuItem
                        icon={Calendar}
                        title="Bookings Management"
                        subtitle="Manage reservations"
                        onClick={() => {
                          navigate(`/studio/${user.id}/bookings`)
                          setIsMobileMenuOpen(false)
                        }}
                      />
                    </>
                  )}

    <div className={`my-4 border-t ${isDarkTheme ? "border-white/10" : "border-gray-700/50"}`} />

                  <MenuItem
                    icon={LogOut}
                    title="Sign Out"
                    subtitle="Sign out of your account"
                    onClick={handleLogout}
                    variant="danger"
                    chevron={false}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )}
  </>
)
}

export default Navbar