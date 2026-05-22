
import { useEffect, useRef, useState } from 'react'
import Logo from "../../assets/logo.png"

import { Instagram, Linkedin, Facebook, Mail, Phone, MapPin, Youtube } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { Link, useNavigate, useLocation } from 'react-router-dom'


export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();


  const footerRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const [columnsVisible, setColumnsVisible] = useState({
    left: false,
    middle: false,
    right: false,
    socials: false,
  });


  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setReducedMotion(true);
      setInView(true);
      setColumnsVisible({
        left: true,
        middle: true,
        right: true,
        socials: true,
      });
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        } else {
          setInView(false);
          setColumnsVisible({
            left: false,
            middle: false,
            right: false,
            socials: false,
          });
        }
      },
      {
        threshold: 0.2,
      }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Staggered column reveal when footer enters view
  useEffect(() => {
    if (!inView || reducedMotion) return;

    const timeouts = [];

    // Left column
    timeouts.push(
      setTimeout(() => {
        setColumnsVisible((prev) => ({ ...prev, left: true }));
      }, 140)
    );

    // Middle column
    timeouts.push(
      setTimeout(() => {
        setColumnsVisible((prev) => ({ ...prev, middle: true }));
      }, 280)
    );

    // Right column + socials micro animation
    timeouts.push(
      setTimeout(() => {
        setColumnsVisible((prev) => ({ ...prev, right: true, socials: true }));
      }, 420)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [inView, reducedMotion]);

  // Smooth scroll function for internal navigation
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Navigate to contact section in Our Story page
  const navigateToContact = () => {
    if (location.pathname !== '/our-story') {
      // Navigate to our-story page first
      navigate('/our-story');
      // Wait for navigation, then scroll to contact
      setTimeout(() => {
        const element = document.getElementById('our-contact');
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    } else {
      // Already on our-story page, just scroll to contact
      const element = document.getElementById('our-contact');
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Navigate to landing page top
  const navigateToHome = () => {
    navigate('/');
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  // Navigate to features section on landing page
  const navigateToFeatures = () => {
    navigate('/');
    setTimeout(() => {
      const element = document.getElementById('features');
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  // Navigate to contact section in Our Story page


  // Navigate to login page
  const navigateToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="relative bg-white pb-24">
      <footer
        ref={footerRef}
        className="relative bg-gradient-to-b from-purple-50 via-violet-50/40 to-white/95 backdrop-blur-xl border border-purple-200/70 rounded-3xl mx-6 mb-8 shadow-[0_20px_60px_rgba(109,40,217,0.15)]"

        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
          transition: reducedMotion ? 'none' : 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        <div className="pointer-events-none absolute -top-6 -left-6 h-24 w-24 rounded-full bg-white/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -right-10 h-28 w-28 rounded-full bg-white/40 blur-3xl" />
        <div className="container mx-auto px-6 py-12 relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Contact - Centered on Mobile */}
            <div className="space-y-4 flex flex-col items-center md:items-start">
              <a href="/" className="flex items-center justify-center md:justify-start w-full">
                <img
                  src={Logo}
                  alt="Logo"
                  className="w-3/4 md:w-3/4"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translateX(0)' : 'translateX(-24px)',
                    transition: reducedMotion
                      ? 'none'
                      : 'transform 0.6s ease-out, opacity 0.6s ease-out',
                  }}
                />
              </a>

              <div
                className="space-y-1 flex flex-col items-center md:items-start w-full"
                style={{
                  opacity: columnsVisible.left ? 1 : 0,
                  transform: columnsVisible.left ? 'translateY(0)' : 'translateY(20px)',
                  transition: reducedMotion
                    ? 'none'
                    : 'transform 0.5s ease-out, opacity 0.5s ease-out',
                }}
              >
                <div className="flex items-center space-x-2">
                  <Mail size={16} className="text-gray-700" />
                  <a href="mailto:contact@plexis.in" className="text-sm text-gray-600 hover:text-purple-600">
                    contact@plexis.in
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone size={16} className="text-gray-700" />
                  <a href="tel:+919666155020" className="text-sm text-gray-600 hover:text-purple-600">
                    +91 96661 55020
                  </a>
                </div>
                <div className="flex items-start space-x-2">
                  <MapPin size={16} className="text-gray-700 mt-1" />
                  <p className="text-sm text-gray-600 hover:text-purple-600 text-center md:text-left">Gachibowli, Hyderabad, 500032</p>
                </div>
              </div>
            </div>

            {/* Quick Links and Legal - Side by Side on Mobile */}
            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 md:gap-8">
              {/* Quick Links */}
              <div className="text-center md:text-left">
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Quick Links</h3>
                <ul
                  className="space-y-1"
                  style={{
                    opacity: columnsVisible.middle ? 1 : 0,
                    transform: columnsVisible.middle ? 'translateY(0)' : 'translateY(20px)',
                    transition: reducedMotion
                      ? 'none'
                      : 'transform 0.5s ease-out, opacity 0.5s ease-out',
                  }}
                >
                  <li><button onClick={navigateToHome} className="text-sm text-gray-600 hover:text-purple-600 cursor-pointer">Home</button></li>
                  <li><Link to="/our-story" className="text-sm text-gray-600 hover:text-purple-600">About</Link></li>
                  <li><button onClick={navigateToFeatures} className="text-sm text-gray-600 hover:text-purple-600 cursor-pointer">Features</button></li>
                  <li><button onClick={navigateToContact} className="text-sm text-gray-600 hover:text-purple-600 cursor-pointer">Contact</button></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="text-center md:text-left">
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Legal</h3>
                <ul
                  className="space-y-1"
                  style={{
                    opacity: columnsVisible.right ? 1 : 0,
                    transform: columnsVisible.right ? 'translateY(0)' : 'translateY(20px)',
                    transition: reducedMotion
                      ? 'none'
                      : 'transform 0.5s ease-out, opacity 0.5s ease-out',
                  }}
                >
                  <li><Link to="/privacy" onClick={scrollToTop} className="text-sm text-gray-600 hover:text-purple-600">Privacy Policy</Link></li>
                  <li><Link to="/terms" onClick={scrollToTop} className="text-sm text-gray-600 hover:text-purple-600">Terms & Conditions</Link></li>
                  <li><Link to="/cookies" onClick={scrollToTop} className="text-sm text-gray-600 hover:text-purple-600">Cookies</Link></li>
                  <li><Link to="/data-deletion" onClick={scrollToTop} className="text-sm text-gray-600 hover:text-purple-600">Data Deletion</Link></li>
                </ul>
              </div>
            </div>

            {/* Join Us - Centered on Mobile */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">Contact Us</h3>
              <p className="text-sm text-gray-600 mb-4">We are new here and excited to connect with you!</p>
              <button
                onClick={navigateToContact}
                className="w-full md:w-full px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{
                  background: 'linear-gradient(to right, rgb(147, 51, 234), rgb(109, 40, 217))',
                  opacity: columnsVisible.right ? 1 : 0,
                  transform: columnsVisible.right ? 'translateY(0)' : 'translateY(20px)',
                  transition: reducedMotion
                    ? 'none'
                    : 'transform 0.5s ease-out, opacity 0.5s ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(126, 34, 206), rgb(91, 33, 182))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(147, 51, 234), rgb(109, 40, 217))';
                }}
              >
                Contact Us Now
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-purple-200 flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-600 text-center flex flex-col md:flex-row items-center justify-center md:gap-1">
              <span>&copy; 2025 Plexis Pvt Ltd.</span>
              <span className="text-purple-600 font-medium">Made in Hyderabad</span>
            </p>
            <div
              className="flex space-x-6"
              style={{
                opacity: columnsVisible.socials ? 1 : 0,
                transform: columnsVisible.socials
                  ? 'translateY(0) scale(1)'
                  : 'translateY(8px) scale(0.9)',
                transition: reducedMotion
                  ? 'none'
                  : 'transform 0.45s ease-out, opacity 0.45s ease-out',
              }}
            >
              <a href="https://www.instagram.com/plexis.in/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-purple-600 transition-colors">
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="https://www.linkedin.com/company/plexis/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a
                href="https://www.youtube.com/@PlexisOfficial"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
</svg>
                <span className="sr-only">YouTube</span>
              </a>
            </div>
          </div>

          {/* Plexis Description Section */}
          {/* <div className="mt-12 pt-8 border-t border-purple-200">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              Plexis – The Complete Photography & Event Management Platform
            </h3>

            <div className="space-y-6 text-gray-600 text-sm leading-relaxed">
              <p>
                The photography industry has long struggled with scattered tools and unorganized workflows. Plexis changes that. We bring together studio owners, photographers, and clients on one seamless platform that simplifies event creation, booking, storage, and delivery. With AI-powered features, photographers can deliver images faster, manage projects with ease, and focus on what they do best – capturing unforgettable moments.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="text-left">
                  <h4 className="text-lg font-semibold text-purple-600 mb-3">Streamlined Event Management</h4>
                  <p className="mb-4">
                    Whether you're running a busy studio or planning a wedding shoot, Plexis takes the complexity out of event coordination. From scheduling and team collaboration to client approvals and gallery sharing, every step is built to save time and reduce friction.
                  </p>

                  <h4 className="text-lg font-semibold text-purple-600 mb-3">Why Plexis?</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>All-in-one platform for studios, photographers, and clients</li>
                    <li>Event management, booking, and collaboration in one place</li>
                    <li>AI-powered auto-quotation, culling, retrieval, and delivery</li>
                    <li>Professional client galleries with secure sharing</li>
                    <li>Wedding books and print solutions to complement digital photos</li>
                    <li>Faster workflows, better collaboration, and happier clients</li>
                  </ul>
                </div>

                <div className="text-left">
                  <h4 className="text-lg font-semibold text-purple-600 mb-3">Designed for Studio Owners, Trusted by Clients</h4>
                  <p className="mb-4">
                    Studios and photographers can showcase their work through personalized client galleries, while clients enjoy a smooth, modern experience when booking services or receiving photos. From intimate family shoots to large-scale corporate events, Plexis is built to scale with your needs.
                  </p>
                </div>
              </div>

              <p className="mt-8 text-gray-500 italic">
                With Plexis, the photography industry finally has a platform designed to bring structure, speed, and simplicity to every project.
              </p>
            </div>
          </div>
        </div> */}
        </div>
      </footer>

      {/* Fixed WhatsApp Button */}
      <a
        href="https://wa.me/9666155020"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        title="Chat on WhatsApp"
      >
        <FaWhatsapp size={28} />
      </a>

      <div className="absolute bottom-0 left-0 right-0 h-20 md:h-36 overflow-hidden pointer-events-none">
        <div className="container mx-auto px-2 md:px-6 flex items-end justify-between pb-2 md:pb-4">
          <span
            className="text-[3rem] md:text-[12rem] lg:text-[14rem] font-extrabold select-none leading-none"
            style={{
              backgroundImage: 'linear-gradient(180deg, #ede9fe 0%, #d8c7ff 50%, #b9a6ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontWeight: '800',
              filter: 'drop-shadow(0 4px 16px rgba(255,255,255,0.35))'
            }}
          >
            P
          </span>
          <span
            className="text-[3rem] md:text-[12rem] lg:text-[14rem] font-extrabold select-none leading-none"
            style={{
              backgroundImage: 'linear-gradient(180deg, #ede9fe 0%, #d8c7ff 50%, #b9a6ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontWeight: '800',
              filter: 'drop-shadow(0 4px 16px rgba(255,255,255,0.35))'
            }}
          >
            L
          </span>
          <span
            className="text-[3rem] md:text-[12rem] lg:text-[14rem] font-extrabold select-none leading-none"
            style={{
              backgroundImage: 'linear-gradient(180deg, #ede9fe 0%, #d8c7ff 50%, #b9a6ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontWeight: '800',
              filter: 'drop-shadow(0 4px 16px rgba(255,255,255,0.35))'
            }}
          >
            E
          </span>
          <span
            className="text-[3rem] md:text-[12rem] lg:text-[14rem] font-extrabold select-none leading-none"
            style={{
              backgroundImage: 'linear-gradient(180deg, #ede9fe 0%, #d8c7ff 50%, #b9a6ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontWeight: '800',
              filter: 'drop-shadow(0 4px 16px rgba(255,255,255,0.35))'
            }}
          >
            X
          </span>
          <span
            className="text-[3rem] md:text-[12rem] lg:text-[14rem] font-extrabold select-none leading-none"
            style={{
              backgroundImage: 'linear-gradient(180deg, #ede9fe 0%, #d8c7ff 50%, #b9a6ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontWeight: '800',
              filter: 'drop-shadow(0 4px 16px rgba(255,255,255,0.35))'
            }}
          >
            I
          </span>
          <span
            className="text-[3rem] md:text-[12rem] lg:text-[14rem] font-extrabold select-none leading-none"
            style={{
              backgroundImage: 'linear-gradient(180deg, #ede9fe 0%, #d8c7ff 50%, #b9a6ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontWeight: '800',
              filter: 'drop-shadow(0 4px 16px rgba(255,255,255,0.35))'
            }}
          >
            S
          </span>
        </div>
      </div>
    </div>
  )
}
