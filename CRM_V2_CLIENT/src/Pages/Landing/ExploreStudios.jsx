import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Country, State, City } from "country-state-city";
import {
  Home,
  LogIn,
  X,
  Filter,
  Sparkles,
  MapPin,
  Globe,
  Building,
  Search,
  Camera,
  CheckCircle,
  DollarSign,
  UserCheck,
  Award,
  Star,
  Clock,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  AlignJustify,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  Heart,
  Share2,
  ExternalLink,
  Dribbble,
  Users,
  Loader2,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { api } from "@/api";
import { fetchStudiosAPI } from "@/services/studioServices";
import Navbar from "@/Customer/Navbar";
import axios from "axios";
import Cookies from "js-cookie";

const ExploreStudio = () => {
  const navigate = useNavigate();

  // ✅ All hooks are declared at the top
  const scrollContainerRef = useRef(null);
  const modalRef = useRef(null);
  const homeButtonRef = useRef(null);
  const leadPostedRef = useRef(new Set());
  const sidebarRef = useRef(null);
  const locationSectionRef = useRef(null);

  const [filters, setFilters] = useState({
    country: "",
    state: "",
    city: "",
    services: [],
    studioType: "",
    isVerified: false,
    isPremium: false,
    minRating: 0,
    priceRange: { min: 0, max: 50000 },
  });

  // --- Draft filters for sidebar/inputs ---
  const [tempFilters, setTempFilters] = useState({ ...filters });

  const [activeCategory, setActiveCategory] = useState("all");
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [allStudios, setAllStudios] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [currentStudioIndex, setCurrentStudioIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState({});
  const [countries] = useState(Country.getAllCountries());
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  // State
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventDetails, setEventDetails] = useState({
    eventType: "",
    date: "",
    city: "",
    budget: "",
  });

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const res = await axios.get(`${api}/user`, {
          withCredentials: true,
        });
        if (res.data) {
          const currentUser = res.data;

          if (currentUser?.role === "Client") {
            const savedPrefs = Cookies.get("eventPreferences");
            const skipFlag = Cookies.get("skipEventModal");

            if (savedPrefs) {
              const parsed = JSON.parse(savedPrefs);
              setEventDetails(parsed);

              // (Optional) Update filters
              // setFilters(prev => ({
              //   ...prev,
              //   services: parsed.eventType ? [parsed.eventType] : prev.services,
              //   city: parsed.city || prev.city,
              //   priceRange: {
              //     ...prev.priceRange,
              //     max: parsed.budget ? Number(parsed.budget) : prev.priceRange.max
              //   }
              // }));
            } else if (!skipFlag) {
              setShowEventModal(true);
            }
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    };

    fetchAuth();
  }, []);

  // ✅ Submit handler
  const handleEventSubmit = () => {
    Cookies.set("eventPreferences", JSON.stringify(eventDetails), {
      expires: 7,
    }); // keep for 7 days
    Cookies.remove("skipEventModal"); // clear skip flag if user submits
    setShowEventModal(false);

    // (Optional) update filters
    // setFilters(prev => ({
    //   ...prev,
    //   services: eventDetails.eventType ? [eventDetails.eventType] : prev.services,
    //   city: eventDetails.city || prev.city,
    //   priceRange: {
    //     ...prev.priceRange,
    //     max: eventDetails.budget ? Number(eventDetails.budget) : prev.priceRange.max
    //   }
    // }));
  };

  // ✅ Skip handler
  const handleSkipEventModal = () => {
    Cookies.set("skipEventModal", "true", { expires: 7 });
    setShowEventModal(false);
  };

  const categories = [
    { id: "all", name: "All", icon: "🎯" },
    { id: "photography", name: "Photography", icon: "📸" },
    { id: "videography", name: "Videography", icon: "🎥" },
    { id: "music", name: "Music & Audio", icon: "🎵" },
    { id: "podcast", name: "Podcast", icon: "🎙️" },
    { id: "commercial", name: "Commercial", icon: "🏢" },
    { id: "event", name: "Event Coverage", icon: "🎪" },
    { id: "studio", name: "Studio Services", icon: "🏠" },
  ];

  const filterOptions = {
    services: [
      "Wedding Photography",
      "Pre-Wedding Shoots",
      "Engagement & Anniversary Photography",
      "Portrait & Headshot Photography",
      "Fashion & Model Portfolio Photography",
      "Product Photography",
      "Real Estate & Architectural Photography",
      "Aerial & Drone Photography",
      "Cinematography & Video Production",
      "Short Films & Documentaries",
      "Live Streaming Services",
      "Photo Retouching & Editing",
      "Custom Album & Photobook Design",
      "Printing & Framing Services",
      "Studio Space Rental",
      "Lighting & Equipment Rental",
      "Music & Audio Recording",
      "Podcast Production",
    ],
    studioTypes: [
      { value: "individual", label: "Individual Studio" },
      { value: "company", label: "Company Studio" },
      { value: "freelancer", label: "Freelancer" },
    ],
  };

  // --- Category to service mapping based on filterOptions.services ---
  const categoryToServiceMap = {
    photography: "Wedding Photography", // Could also be broader, but we start with a key service
    videography: "Cinematography & Video Production",
    music: "Music & Audio Recording",
    podcast: "Podcast Production",
    commercial: "Product Photography (E-commerce & Catalog)",
    event: "Engagement & Anniversary Photography", // Adjust if you have a specific "Event Coverage" service
    studio: "Studio Space Rental",
  };

  // --- Scroll helpers ---
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };
  const scrollLeft = () =>
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  const scrollRight = () =>
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: "smooth" });

  // --- Category selection ---
  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);

    setFilters((prevFilters) => {
      if (categoryId === "all") {
        // Remove category-related services, keep other filters/services
        return {
          ...prevFilters,
          services: prevFilters.services.filter(
            (s) => !Object.values(categoryToServiceMap).includes(s)
          ),
        };
      } else {
        const mappedService = categoryToServiceMap[categoryId];
        if (!mappedService) return prevFilters;

        // Add mapped service without duplicates
        return {
          ...prevFilters,
          services: Array.from(
            new Set([...prevFilters.services, mappedService])
          ),
        };
      }
    });

    setCurrentPage(1);
  };

  // --- Alert helper ---
  const showAlert = (message, type = "info") => {
    setAlert({ show: true, message, type });
    setTimeout(
      () => setAlert({ show: false, message: "", type: "info" }),
      4000
    );
  };

  // --- Toggle sections ---
  const toggleSection = (section) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  // --- Checkbox handler ---
  const handleCheckboxChange = (filterType, value) => {
    setTempFilters((prevFilters) => {
      const currentValues = prevFilters[filterType];
      if (currentValues.includes(value)) {
        return {
          ...prevFilters,
          [filterType]: currentValues.filter((item) => item !== value),
        };
      } else {
        return { ...prevFilters, [filterType]: [...currentValues, value] };
      }
    });
  };

  // --- Location input handlers ---
  const handleLocationInputChange = (field, value) => {
    setTempFilters((prev) => ({ ...prev, [field]: value }));

    if (field === "country") {
      const selectedCountry = countries.find(
        (c) => c.name.toLowerCase() === value.toLowerCase()
      );
      if (selectedCountry) {
        setStates(State.getStatesOfCountry(selectedCountry.isoCode));
        setTempFilters((prev) => ({
          ...prev,
          country: selectedCountry.name,
          countryCode: selectedCountry.isoCode,
          state: "",
          city: "",
        }));
        setCities([]);
      }
      setLocationSuggestions([]);
    }

    if (field === "state") {
      const selectedState = states.find(
        (s) => s.name.toLowerCase() === value.toLowerCase()
      );
      if (selectedState && tempFilters.countryCode) {
        setCities(
          City.getCitiesOfState(tempFilters.countryCode, selectedState.isoCode)
        );
        setTempFilters((prev) => ({
          ...prev,
          state: selectedState.name,
          stateCode: selectedState.isoCode,
          city: "",
        }));
      }
      setLocationSuggestions([]);
    }

    if (field === "city" && value.length > 2) {
      const suggestions = cities
        .filter((c) => c.name.toLowerCase().startsWith(value.toLowerCase()))
        .slice(0, 10);
      setLocationSuggestions(suggestions);
    } else if (field === "city") setLocationSuggestions([]);
  };

  const handleLocationSelect = (city) => {
    setTempFilters((prev) => ({
      ...prev,
      city: city.name,
      state: city.state,
      country: city.country,
    }));
    setLocationSuggestions([]);
  };

  // --- Apply & clear filters ---
  const applyFilters = () => {
    setFilters({ ...tempFilters });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    const cleared = {
      country: "",
      state: "",
      city: "",
      services: [],
      studioType: "",
      isVerified: false,
      isPremium: false,
      minRating: 0,
      priceRange: { min: 0, max: 50000 },
    };
    setTempFilters(cleared);
    setFilters(cleared);
    setActiveCategory("all");
    setLocationSuggestions([]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  // --- Explore all studios ---
  const handleExploreAll = () => clearAllFilters();

  // --- Map full names to codes for backend ---
  const getFilterCodes = () => {
    return {
      countryCode: filters.countryCode || "",
      stateCode: filters.stateCode || "",
      cityName: filters.city || "",
    };
  };

  // --- Map API response codes to full names ---
  const mapResponseToFullNames = (studios) => {
    return studios.map((studio) => {
      const countryObj = countries.find((c) => c.isoCode === studio.country);
      const stateObj = countryObj
        ? State.getStatesOfCountry(countryObj.isoCode).find(
            (s) => s.isoCode === studio.state
          )
        : null;
      return {
        ...studio,
        country: countryObj?.name || studio.country,
        state: stateObj?.name || studio.state,
        city: studio.city || "",
      };
    });
  };

  const handleFetchStudios = async (page = 1) => {
    setIsLoading(true);
    try {
      const { studios, pagination } = await fetchStudiosAPI(
        filters,
        page,
        searchQuery
      );

      setAllStudios(studios);
      setSearchResults(studios);
      setTotalPages(pagination?.pages || 1);
      setCurrentPage(pagination?.page || 1);
      showAlert(`Found ${pagination?.total || 0} studios`, "success");
    } catch (error) {
      console.error(error);
      showAlert("Failed to fetch studios.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Initial fetch on page load ---
  useEffect(() => {
    handleFetchStudios(1);

    const container = scrollContainerRef.current;
    if (container) {
      checkScrollPosition();
      container.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);

      return () => {
        container.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, []);

  // Fetch studios when filters or category change
  useEffect(() => {
    handleFetchStudios(1);
  }, [filters, activeCategory]);

  // Handle search button click
  const handleSearch = () => {
    // Optionally, update filters with searchQuery if needed
    setFilters((prev) => ({ ...prev, search: searchQuery }));
    handleFetchStudios(1);
    // Fetch results based on current filters + searchQuery
  };

  // --- Modal outside click ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target))
        closeStudioModal();
    };

    if (showStudioModal) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [showStudioModal]);

  // --- Close location suggestions on scroll ---
  useEffect(() => {
    const handleScroll = () => {
      setLocationSuggestions([]);
    };

    const handleTouchMove = () => {
      setLocationSuggestions([]);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Fire lead API exactly once per studio open
  useEffect(() => {
    if (!showStudioModal || !selectedStudio) return;

    const key = selectedStudio.refNo || selectedStudio._id;
    if (leadPostedRef.current.has(key)) return;
    leadPostedRef.current.add(key);

    const postLead = async () => {
      try {
        // ✅ Get current user from /user
        const authRes = await axios.get(`${api}/user`, {
          withCredentials: true,
        });
        const userObj = authRes.data;

        if (!userObj) return;

        await axios.post(
          `${api}/api/studio/${selectedStudio.refNo}/lead`,
          {
            studioRefNo: selectedStudio.refNo,
            clientRefNo: userObj.refNo,
          },
          { withCredentials: true } // ✅ token is in cookies
        );
      } catch (error) {
        console.error("Error posting studio lead:", error);
      }
    };

    postLead();
  }, [showStudioModal, selectedStudio]);

  // --- Studio modal ---
  const handleOpenStudio = (studioId) => {
    if (!isAuthenticated) {
      showAlert("You must Sign Up to view studio details.", "warning");
      setTimeout(() => {
        navigate("/signup");
      }, 2000);
      return;
    }
    const studio = searchResults.find((s) => s._id === studioId);
    const index = searchResults.findIndex((s) => s._id === studioId);
    if (studio) {
      setSelectedStudio(studio);
      setCurrentStudioIndex(index);
      setShowStudioModal(true);
    } else showAlert("Studio not found", "error");
  };

  const handleNextStudio = () => {
    if (!searchResults.length) return;
    const nextIndex = (currentStudioIndex + 1) % searchResults.length;
    setSelectedStudio(searchResults[nextIndex]);
    setCurrentStudioIndex(nextIndex);
  };

  const handlePrevStudio = () => {
    if (!searchResults.length) return;
    const prevIndex =
      (currentStudioIndex - 1 + searchResults.length) % searchResults.length;
    setSelectedStudio(searchResults[prevIndex]);
    setCurrentStudioIndex(prevIndex);
  };

  const closeStudioModal = () => {
    setShowStudioModal(false);
    setSelectedStudio(null);
  };

  // --- Pagination ---
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) handleFetchStudios(page);
  };

  // --- Auth ---
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${api}/user`, {
          withCredentials: true,
        });
        if (res.data) {
          setIsAuthenticated(true);
          setUser(res.data); // server should return user object
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    checkAuth();

    // Optionally, you can re-check auth on focus (helps when cookies expire/refresh)
    const handleFocus = () => checkAuth();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleLoginClick = () => navigate("/login");

  const handleLogin = (userData) => {
    if (!userData || typeof userData !== "object") {
      return showAlert("Invalid user data for login.", "error");
    }

    // ✅ No sessionStorage — rely on cookies + state
    setIsAuthenticated(true);
    setUser(userData);
    showAlert(`Welcome ${userData.name || "User"}!`, "success");
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${api}/auth/logout`, {}, { withCredentials: true });

      setIsAuthenticated(false);
      setUser(null);
      setDropdownOpen(false);
      closeStudioModal();

      showAlert("You have been logged out.", "info");
    } catch (error) {
      console.error("Logout failed:", error);
      showAlert("Failed to log out. Please try again.", "error");
    }
  };

  const handleHomeClick = () => {
    navigate("/");
    showAlert("Navigating to home page...", "info");
  };

  const renderRightSidebar = () => (
    <>
      {/* Filter trigger button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed bottom-18 right-8 z-50 p-4 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
      >
        <Filter className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-gradient-to-b from-black via-gray-900 to-black backdrop-blur-xl border-l border-purple-500/20 shadow-2xl transform transition-transform duration-300 z-50
  ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header - Fixed at top */}
          <div className="flex justify-between items-center p-4 sm:p-6 pb-4 border-b border-purple-500/20 flex-shrink-0">
            <h3 className="text-lg font-bold text-white">Filters</h3>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-full hover:bg-purple-500/20 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-4 space-y-4">
            {/* Stats */}
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Filter className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Filters</h3>
              </div>
              <div className="text-sm text-gray-400">
                {searchResults.length} studios found
              </div>
            </div>

            {/* All Studios Button */}
            <div className="mb-4">
              <button
                onClick={handleExploreAll}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isLoading ? "Searching..." : "All Studios"}</span>
              </button>
            </div>

            {/* Location */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection("location")}
                className="w-full flex items-center justify-between p-3 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-colors duration-200 border border-purple-500/20"
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">Location</span>
                </div>
                {expandedSections.location ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {expandedSections.location && (
                <div className="mt-3 space-y-3">
                  {/* Country */}
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <input
                      type="text"
                      value={tempFilters.country}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempFilters((prev) => ({
                          ...prev,
                          country: val,
                          countryCode: "",
                          state: "",
                          stateCode: "",
                          city: "",
                        }));
                        if (val.length > 1) {
                          const filtered = countries.filter((c) =>
                            c.name.toLowerCase().startsWith(val.toLowerCase())
                          );
                          setLocationSuggestions(
                            filtered.map((c) => ({
                              label: c.name,
                              code: c.isoCode,
                              type: "country",
                            }))
                          );
                        } else {
                          setLocationSuggestions([]);
                        }
                      }}
                      placeholder="Country"
                      className="w-full pl-10 pr-4 py-2 bg-black/50 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 outline-none text-sm"
                    />
                    {locationSuggestions.length > 0 &&
                      locationSuggestions[0].type === "country" && (
                        <ul className="absolute z-20 w-full bg-black/95 border border-purple-500/30 rounded-lg mt-1 max-h-40 overflow-y-auto">
                          {locationSuggestions.map((c) => (
                            <li
                              key={c.code}
                              onClick={() => {
                                setTempFilters((prev) => ({
                                  ...prev,
                                  country: c.label,
                                  countryCode: c.code,
                                  state: "",
                                  stateCode: "",
                                  city: "",
                                }));
                                setStates(State.getStatesOfCountry(c.code));
                                setCities([]);
                                setLocationSuggestions([]);
                              }}
                              className="px-3 py-2 text-gray-200 cursor-pointer hover:bg-purple-500/20"
                            >
                              {c.label}
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>

                  {/* State */}
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <input
                      type="text"
                      value={tempFilters.state}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempFilters((prev) => ({
                          ...prev,
                          state: val,
                          stateCode: "",
                          city: "",
                        }));
                        if (val.length > 1) {
                          let filtered = [];
                          if (tempFilters.countryCode) {
                            filtered = states.filter((s) =>
                              s.name.toLowerCase().startsWith(val.toLowerCase())
                            );
                          } else {
                            filtered = State.getAllStates().filter((s) =>
                              s.name.toLowerCase().startsWith(val.toLowerCase())
                            );
                          }
                          setLocationSuggestions(
                            filtered.map((s) => ({
                              label: s.name,
                              code: s.isoCode,
                              countryCode: s.countryCode,
                              type: "state",
                            }))
                          );
                        } else {
                          setLocationSuggestions([]);
                        }
                      }}
                      placeholder="State"
                      className="w-full pl-10 pr-4 py-2 bg-black/50 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 outline-none text-sm"
                    />
                    {locationSuggestions.length > 0 &&
                      locationSuggestions[0].type === "state" && (
                        <ul className="absolute z-20 w-full bg-black/95 border border-purple-500/30 rounded-lg mt-1 max-h-40 overflow-y-auto">
                          {locationSuggestions.map((s) => (
                            <li
                              key={s.code}
                              onClick={() => {
                                const countryObj = countries.find(
                                  (c) => c.isoCode === s.countryCode
                                );
                                setTempFilters((prev) => ({
                                  ...prev,
                                  country: countryObj?.name || prev.country,
                                  countryCode:
                                    s.countryCode || prev.countryCode,
                                  state: s.label,
                                  stateCode: s.code,
                                  city: "",
                                }));
                                setStates(
                                  State.getStatesOfCountry(s.countryCode)
                                );
                                setCities(
                                  City.getCitiesOfState(s.countryCode, s.code)
                                );
                                setLocationSuggestions([]);
                              }}
                              className="px-3 py-2 text-gray-200 cursor-pointer hover:bg-purple-500/20"
                            >
                              {s.label}
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>

                  {/* City */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <input
                      type="text"
                      value={tempFilters.city}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempFilters((prev) => ({ ...prev, city: val }));
                        if (val.length > 1) {
                          let filtered = [];
                          if (
                            tempFilters.countryCode &&
                            tempFilters.stateCode
                          ) {
                            filtered = cities.filter((c) =>
                              c.name.toLowerCase().startsWith(val.toLowerCase())
                            );
                          } else {
                            filtered = City.getAllCities()
                              .filter((c) =>
                                c.name
                                  .toLowerCase()
                                  .startsWith(val.toLowerCase())
                              )
                              .slice(0, 20);
                          }
                          setLocationSuggestions(
                            filtered.map((c) => ({
                              label: c.name,
                              type: "city",
                              stateCode: c.stateCode,
                              countryCode: c.countryCode,
                            }))
                          );
                        } else {
                          setLocationSuggestions([]);
                        }
                      }}
                      placeholder="City"
                      className="w-full pl-10 pr-4 py-2 bg-black/50 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 outline-none text-sm"
                    />
                    {locationSuggestions.length > 0 &&
                      locationSuggestions[0].type === "city" && (
                        <ul className="absolute z-20 w-full bg-black/95 border border-purple-500/30 rounded-lg mt-1 max-h-40 overflow-y-auto">
                          {locationSuggestions.map((c) => (
                            <li
                              key={`${c.label}-${c.stateCode}-${c.countryCode}`}
                              onClick={() => {
                                const countryObj = countries.find(
                                  (ct) => ct.isoCode === c.countryCode
                                );
                                const stateObj = State.getStatesOfCountry(
                                  c.countryCode
                                ).find((st) => st.isoCode === c.stateCode);
                                setTempFilters((prev) => ({
                                  ...prev,
                                  country: countryObj?.name || prev.country,
                                  countryCode:
                                    c.countryCode || prev.countryCode,
                                  state: stateObj?.name || prev.state,
                                  stateCode: c.stateCode || prev.stateCode,
                                  city: c.label,
                                }));
                                setLocationSuggestions([]);
                              }}
                              className="px-3 py-2 text-gray-200 cursor-pointer hover:bg-purple-500/20"
                            >
                              {c.label}
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Services */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection("services")}
                className="w-full flex items-center justify-between p-3 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-colors duration-200 border border-purple-500/20"
              >
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">Services</span>
                </div>
                {expandedSections.services ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {expandedSections.services && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {filterOptions.services.map((service) => {
                    const checked = tempFilters.services.includes(service);
                    return (
                      <label
                        key={service}
                        className="flex items-center space-x-3 text-gray-300 cursor-pointer group"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setTempFilters((prev) => ({
                                ...prev,
                                services: checked
                                  ? prev.services.filter((s) => s !== service)
                                  : [...prev.services, service],
                              }))
                            }
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded border-2 transition-all duration-200 ${
                              checked
                                ? "bg-purple-500 border-purple-500"
                                : "border-purple-500/50 group-hover:border-purple-400"
                            }`}
                          >
                            {checked && (
                              <CheckCircle className="w-3 h-3 text-white absolute -top-0.5 -left-0.5" />
                            )}
                          </div>
                        </div>
                        <span className="group-hover:text-purple-300 transition-colors duration-200 text-sm">
                          {service}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Studio Type */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection("studioType")}
                className="w-full flex items-center justify-between p-3 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-colors duration-200 border border-purple-500/20"
              >
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">Studio Type</span>
                </div>
                {expandedSections.studioType ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {expandedSections.studioType && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {filterOptions.studioTypes.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center space-x-3 text-gray-300 cursor-pointer group"
                    >
                      <div className="relative">
                        <input
                          type="radio"
                          name="studioType"
                          value={type.value}
                          checked={tempFilters.studioType === type.value}
                          onChange={(e) =>
                            setTempFilters((prev) => ({
                              ...prev,
                              studioType: e.target.value,
                            }))
                          }
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                            tempFilters.studioType === type.value
                              ? "bg-purple-500 border-purple-500"
                              : "border-purple-500/50 group-hover:border-purple-400"
                          }`}
                        >
                          {tempFilters.studioType === type.value && (
                            <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </div>
                      </div>
                      <span className="group-hover:text-purple-300 transition-colors duration-200 text-sm">
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing & Rating */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection("pricing")}
                className="w-full flex items-center justify-between p-3 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-colors duration-200 border border-purple-500/20"
              >
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">
                    Pricing & Rating
                  </span>
                </div>
                {expandedSections.pricing ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {expandedSections.pricing && (
                <div className="mt-3 space-y-4">
                  {/* Price Range */}
                  <div>
                    <div className="text-gray-400 text-xs mb-2">
                      Hourly Rate (₹)
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <input
                        type="number"
                        value={tempFilters.priceRange.min}
                        onChange={(e) =>
                          setTempFilters((prev) => ({
                            ...prev,
                            priceRange: {
                              ...prev.priceRange,
                              min: Number(e.target.value) || 0,
                            },
                          }))
                        }
                        placeholder="Min"
                        className="w-20 px-2 py-1 bg-black/50 border border-purple-500/30 rounded text-white text-xs outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <span className="text-gray-400">to</span>
                      <input
                        type="number"
                        value={tempFilters.priceRange.max}
                        onChange={(e) =>
                          setTempFilters((prev) => ({
                            ...prev,
                            priceRange: {
                              ...prev.priceRange,
                              max: Number(e.target.value) || 50000,
                            },
                          }))
                        }
                        placeholder="Max"
                        className="w-20 px-2 py-1 bg-black/50 border border-purple-500/30 rounded text-white text-xs outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Minimum Rating */}
                  <div>
                    <div className="text-gray-400 text-xs mb-2">
                      Minimum Rating
                    </div>
                    <div className="flex items-center space-x-2">
                      {[0, 3, 4, 4.5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() =>
                            setTempFilters((prev) => ({
                              ...prev,
                              minRating: rating,
                            }))
                          }
                          className={`px-2 py-1 rounded text-xs transition-all duration-200 ${
                            tempFilters.minRating === rating
                              ? "bg-purple-500 text-white"
                              : "bg-black/50 text-gray-400 hover:bg-purple-500/20"
                          }`}
                        >
                          {rating === 0 ? "Any" : `${rating}+ ⭐`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Verification */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection("verification")}
                className="w-full flex items-center justify-between p-3 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-colors duration-200 border border-purple-500/20"
              >
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">Verification</span>
                </div>
                {expandedSections.verification ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {expandedSections.verification && (
                <div className="mt-3 space-y-3">
                  <label className="flex items-center space-x-3 text-gray-300 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={tempFilters.isVerified}
                        onChange={(e) =>
                          setTempFilters((prev) => ({
                            ...prev,
                            isVerified: e.target.checked,
                          }))
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border-2 transition-all duration-200 ${
                          tempFilters.isVerified
                            ? "bg-purple-500 border-purple-500"
                            : "border-purple-500/50 group-hover:border-purple-400"
                        }`}
                      >
                        {tempFilters.isVerified && (
                          <CheckCircle className="w-3 h-3 text-white absolute -top-0.5 -left-0.5" />
                        )}
                      </div>
                    </div>
                    <span className="group-hover:text-purple-300 transition-colors duration-200 text-sm flex items-center space-x-1">
                      <UserCheck className="w-3 h-3" />
                      <span>Verified Studios Only</span>
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 text-gray-300 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={tempFilters.isPremium}
                        onChange={(e) =>
                          setTempFilters((prev) => ({
                            ...prev,
                            isPremium: e.target.checked,
                          }))
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border-2 transition-all duration-200 ${
                          tempFilters.isPremium
                            ? "bg-purple-500 border-purple-500"
                            : "border-purple-500/50 group-hover:border-purple-400"
                        }`}
                      >
                        {tempFilters.isPremium && (
                          <CheckCircle className="w-3 h-3 text-white absolute -top-0.5 -left-0.5" />
                        )}
                      </div>
                    </div>
                    <span className="group-hover:text-purple-300 transition-colors duration-200 text-sm flex items-center space-x-1">
                      <Award className="w-3 h-3" />
                      <span>Premium Studios Only</span>
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-black/90 backdrop-blur-xl p-4 space-y-3 border-t border-purple-500/20">
            <button
              onClick={() => {
                setCurrentPage(1);
                setFilters(tempFilters);
                handleFetchStudios(1);
                setIsSidebarOpen(false); // close after apply
              }}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Applying…" : "Apply Filters"}
            </button>
            <button
              onClick={() => {
                const cleared = {
                  country: "",
                  state: "",
                  city: "",
                  services: [],
                  studioType: "",
                  isVerified: false,
                  isPremium: false,
                  minRating: 0,
                  priceRange: { min: 0, max: 50000 },
                };
                setTempFilters(cleared);
                setFilters(cleared);
                setActiveCategory("all");
                setLocationSuggestions([]);
                setSearchQuery("");
                setCurrentPage(1);
                handleFetchStudios(1);
                setIsSidebarOpen(false); // close after clear
              }}
              className="w-full px-4 py-3 bg-black/50 hover:bg-black/70 text-gray-300 font-semibold rounded-lg border border-purple-500/30 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Clear All Filters</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderStudioCard = (studio, index) => (
    <div
      key={studio._id}
      className="group relative bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 backdrop-blur-md border border-purple-500/30 p-2 xs:p-3 sm:p-3 md:p-4 lg:p-4 rounded-lg sm:rounded-xl shadow-2xl transition-all duration-500 cursor-pointer hover:bg-gradient-to-br hover:from-slate-800/95 hover:via-purple-800/30 hover:to-slate-800/95 hover:border-purple-400/50 hover:transform hover:scale-[1.01] sm:hover:scale-[1.02] hover:shadow-purple-500/25  overflow-hidden flex flex-col"
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => handleOpenStudio(studio._id)}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Header with Studio Logo/Avatar and Basic Info */}
      <div className="relative flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <div className="relative">
            <img
              src={
                studio.profile ||
                studio.studioLogo ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  studio.studioName || "Studio"
                )}&background=random`
              }
              alt={studio.studioName || "Studio Logo"}
              className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-md sm:rounded-lg object-cover flex-shrink-0 ring-1 sm:ring-2 ring-purple-500/20 group-hover:ring-purple-400/40 transition-all duration-300"
            />
            {studio.isActive && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-1 sm:border-2 border-slate-900 animate-pulse"></div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <h3 className="text-xs xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-lg font-bold text-white group-hover:text-purple-300 transition-colors duration-300 truncate leading-tight">
                {studio.studioName || studio.name}
              </h3>
              <div className="flex items-center space-x-0.5 sm:space-x-1">
                {studio.isVerified && (
                  <div className="relative">
                    <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-emerald-400 flex-shrink-0" />
                    <div className="absolute inset-0 bg-emerald-400 rounded-full blur-sm opacity-30 animate-pulse"></div>
                  </div>
                )}
                {studio.isPremium && (
                  <div className="relative">
                    <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-400 flex-shrink-0" />
                    <div className="absolute inset-0 bg-amber-400 rounded-full blur-sm opacity-30 animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-0.5 sm:space-x-1 text-slate-400 text-2xs xs:text-xs sm:text-xs mt-0.5">
              <MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-purple-400 flex-shrink-0" />
              <span className="truncate">
                {studio.address?.city || "Location not specified"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-0.5 sm:space-x-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded sm:rounded-md border border-amber-500/20 flex-shrink-0 ml-1 sm:ml-2">
          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
          <span className="text-2xs xs:text-xs sm:text-xs font-semibold text-amber-300">
            {studio.rating}
          </span>
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-between">
        {/* Status and Type Badges */}
        <div className="mb-2 sm:mb-3 flex flex-wrap gap-1 sm:gap-1.5">
          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-purple-600/30 to-violet-600/30 text-purple-200 rounded sm:rounded-md text-2xs xs:text-xs font-medium capitalize border border-purple-500/20 backdrop-blur-sm">
            {studio.studioType || "Studio"}
          </span>
          {studio.isActive && (
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-emerald-600/30 to-green-600/30 text-emerald-200 rounded sm:rounded-md text-2xs xs:text-xs font-medium border border-emerald-500/20 backdrop-blur-sm">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-400 rounded-full mr-0.5 sm:mr-1 animate-pulse"></div>
              Active
            </span>
          )}
        </div>

        {/* Description */}
        <div className="mb-2 sm:mb-3">
          <p className="text-slate-300 text-2xs xs:text-xs sm:text-xs leading-relaxed line-clamp-2 sm:line-clamp-2 md:line-clamp-3 min-h-[2rem] sm:min-h-[2.5rem] group-hover:text-slate-200 transition-colors duration-300">
            {studio.studioDescription ||
              "Professional studio services available"}
          </p>
        </div>

        {/* Services Tags */}
        <div className="flex flex-wrap gap-1 mb-2 sm:mb-3 min-h-[2rem]">
          {(studio.services || [])
            .slice(0, window.innerWidth < 640 ? 2 : 3)
            .map((service, index) => (
              <span
                key={index}
                className="px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-200 rounded text-2xs xs:text-xs font-medium border border-blue-500/20 backdrop-blur-sm hover:from-blue-600/30 hover:to-cyan-600/30 transition-all duration-300"
              >
                {service}
              </span>
            ))}
          {studio.services &&
            studio.services.length > (window.innerWidth < 640 ? 2 : 3) && (
              <span className="px-1.5 sm:px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded text-2xs xs:text-xs font-medium border border-slate-600/30 backdrop-blur-sm">
                +{studio.services.length - (window.innerWidth < 640 ? 2 : 3)}
              </span>
            )}
        </div>

        {/* Footer with Pricing */}
        <div className="relative flex items-center justify-center text-2xs xs:text-xs sm:text-xs pt-2 sm:pt-3 border-t border-gradient-to-r from-transparent via-purple-500/20 to-transparent">
          <div className="flex items-center space-x-1 sm:space-x-1.5 text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
            <div className="p-0.5 sm:p-1 bg-green-500/20 rounded">
              {/* <DollarSign className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400" /> */}
            </div>
            <span className="font-medium text-2xs xs:text-xs">
              {/* ₹{studio.pricing?.hourlyRate || "N/A"}/hr */}
            </span>
          </div>
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
    </div>
  );

  // Don't forget to import the additional icons you'll need:
  // import { Camera, MapPin, Star, Phone, Users, Clock, ExternalLink } from 'lucide-react';

  const renderStudioModal = () => {
    if (!showStudioModal || !selectedStudio) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div
          ref={modalRef}
          className="bg-gradient-to-br from-black/95 to-purple-900/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-fade-in-up"
        >
          <div
            className="flex flex-col flex-grow overflow-y-auto custom-scrollbar p-4 sm:p-6"
            key={selectedStudio._id}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Dribbble className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                      {selectedStudio.studioName || selectedStudio.name}
                    </h3>
                    {selectedStudio.isVerified && (
                      <UserCheck className="w-5 h-5 text-green-400" />
                    )}
                    {selectedStudio.isPremium && (
                      <Award className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span>
                      {selectedStudio.address?.city || "Location not specified"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                <div className="flex items-center space-x-1 text-yellow-400 bg-yellow-500/20 px-3 py-1 rounded-full">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-semibold">
                    {selectedStudio.rating}
                  </span>
                </div>
                <button
                  onClick={closeStudioModal}
                  className="p-2 hover:bg-purple-500/20 rounded-full transition-colors duration-200"
                >
                  <X className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Image Gallery */}
            {selectedStudio.portfolioImages &&
              selectedStudio.portfolioImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {selectedStudio.portfolioImages.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-video bg-purple-500/10 rounded-xl overflow-hidden border border-purple-500/20 animate-fade-in-up"
                      style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                    >
                      <img
                        src={typeof image === "string" ? image : image.url}
                        alt={`Studio preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

            {/* Main Content Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                {/* About Section */}
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <Info className="w-5 h-5 text-purple-400" />
                    <span>About This Studio</span>
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                    {selectedStudio.studioDescription ||
                      "Professional studio services with modern equipment and experienced team."}
                  </p>
                </div>

                {/* Location Details */}
                {selectedStudio.address && (
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-green-400" />
                      <span>Location Details</span>
                    </h3>
                    <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                      {(() => {
                        let countryName = selectedStudio.address.country;
                        let stateName = selectedStudio.address.state;
                        let cityName = selectedStudio.address.city;

                        const countryObj = countries.find(
                          (c) => c.isoCode === selectedStudio.address.country
                        );
                        if (countryObj) countryName = countryObj.name;

                        const stateObj = countryObj
                          ? State.getStatesOfCountry(countryObj.isoCode).find(
                              (s) => s.isoCode === selectedStudio.address.state
                            )
                          : null;
                        if (stateObj) stateName = stateObj.name;

                        return (
                          <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-gray-400 mb-1">
                                  Country
                                </div>
                                <div className="text-white font-medium">
                                  {countryName}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 mb-1">State</div>
                                <div className="text-white font-medium">
                                  {stateName}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 mb-1">City</div>
                                <div className="text-white font-medium">
                                  {cityName}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 mb-1">
                                  Zip Code
                                </div>
                                <div className="text-white font-medium">
                                  {selectedStudio.address.zipCode}
                                </div>
                              </div>
                            </div>
                            {selectedStudio.address.street && (
                              <div className="mt-3 pt-3 border-t border-purple-500/20">
                                <div className="text-gray-400 text-xs mb-1">
                                  Full Address
                                </div>
                                <div className="text-white text-sm">
                                  {selectedStudio.address.street}
                                  {""}, {cityName}
                                  {""}, {stateName} ,{countryName}
                                  {""},{selectedStudio.address.zipCode}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Services */}
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <AlignJustify className="w-5 h-5 text-teal-400" />
                    <span>Services Offered</span>
                  </h3>
                  <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                    <div className="flex flex-wrap gap-2">
                      {selectedStudio.services &&
                      selectedStudio.services.length > 0 ? (
                        selectedStudio.services.map((service) => (
                          <span
                            key={service}
                            className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30"
                          >
                            {service}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">
                          No services listed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar with Contact and Actions */}
              <div className="xl:col-span-1 space-y-6">
                <div className="bg-purple-500/10 p-4 sm:p-6 rounded-xl border border-purple-500/20">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    Contact & Booking
                  </h4>
                  <div className="space-y-3">
                    {selectedStudio.contactNumber && (
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <Phone className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Phone</div>
                          <div className="text-white text-sm">
                            {selectedStudio.contactNumber}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedStudio.email && (
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Mail className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-gray-400 text-xs">Email</div>
                          <div className="text-white text-sm break-all">
                            {selectedStudio.email}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedStudio.studioWebsite && (
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Globe className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-gray-400 text-xs">Website</div>
                          <div className="text-white text-sm break-all">
                            {selectedStudio.studioWebsite}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedStudio.studioOperatingHours && (
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                          <Clock className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">
                            Operating Hours
                          </div>
                          <div className="text-white text-sm">
                            {selectedStudio.studioOperatingHours}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing Info */}
                  {selectedStudio.pricing && (
                    <div className="mt-4 pt-4 border-t border-purple-500/20">
                      <div className="text-gray-400 text-xs mb-2">Pricing</div>
                      <div className="space-y-1">
                        {selectedStudio.pricing.hourlyRate && (
                          <div className="text-white text-sm">
                            Hourly: ₹{selectedStudio.pricing.hourlyRate}
                          </div>
                        )}
                        {selectedStudio.pricing.dayRate && (
                          <div className="text-white text-sm">
                            Daily: ₹{selectedStudio.pricing.dayRate}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-4">
                  <button
                    className={`w-full px-6 py-4 font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2 ${
                      selectedStudio.bookingSettings?.isAcceptingBookings
                        ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                        : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={
                      !selectedStudio.bookingSettings?.isAcceptingBookings
                    }
                  >
                    <Calendar className="w-5 h-5" />
                    <span>
                      {selectedStudio.bookingSettings?.isAcceptingBookings
                        ? "Book Now"
                        : "Booking Unavailable"}
                    </span>
                  </button>
                  <button className="w-full px-6 py-4 bg-black/50 hover:bg-black/70 text-white font-semibold rounded-xl border border-purple-500/30 transition-all duration-300 flex items-center justify-center space-x-2">
                    <MessageCircle className="w-5 h-5" />
                    <span>Send Message</span>
                  </button>

                  <div className="flex space-x-3">
                    <button className="flex-1 p-3 bg-black/30 hover:bg-black/50 text-gray-300 rounded-xl border border-purple-500/20 transition-all duration-300 flex items-center justify-center">
                      <Heart className="w-5 h-5" />
                    </button>
                    <button className="flex-1 p-3 bg-black/30 hover:bg-black/50 text-gray-300 rounded-xl border border-purple-500/20 transition-all duration-300 flex items-center justify-center">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button className="flex-1 p-3 bg-black/30 hover:bg-black/50 text-gray-300 rounded-xl border border-purple-500/20 transition-all duration-300 flex items-center justify-center">
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {searchResults.length > 1 && (
            <div className="flex items-center justify-between p-4 bg-black/90 border-t border-purple-500/20 space-x-2 flex-shrink-0">
              <button
                onClick={handlePrevStudio}
                className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all duration-200 flex items-center justify-center border border-purple-500/30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center text-gray-400 text-sm">
                {currentStudioIndex + 1} of {searchResults.length}
              </div>
              <button
                onClick={handleNextStudio}
                className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all duration-200 flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Additional icons you'll need to import:

  const renderMainContent = () => {
    return (
      <div className="flex-1 h-full overflow-hidden">
        <div className="p-3 sm:p-4 md:p-6 h-full overflow-y-auto custom-scrollbar smooth-scroll">
          {/* Hero Section */}
          <div className="relative mb-6 sm:mb-8 p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-900/50 to-black/80 shadow-2xl overflow-hidden border border-purple-500/20">
            <div className="absolute inset-0 bg-hero-pattern opacity-10"></div>
            <div className="relative z-10 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-2 sm:mb-4 drop-shadow-lg">
                Your Next Creative Space, Just a Click Away
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-4 md:mb-6 max-w-2xl mx-auto">
                Discover and book the perfect studio for music, photography,
                events, and more.
              </p>
              <div className="max-w-md mx-auto relative">
                {/* Input */}
                <input
                  type="text"
                  value={searchQuery}
                  placeholder="Search for studios, cities, and services..."
                  className="w-full pr-12 pl-4 py-3 bg-black/50 border border-purple-500/30 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-white placeholder-gray-400 outline-none text-sm sm:text-base"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />

                {/* Search Icon Button on the right */}
                <button
                  onClick={handleSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="mt-6 sm:mt-8">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
              Explore by Category
            </h3>
            <div className="relative">
              {showLeftArrow && (
                <button
                  onClick={scrollLeft}
                  className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 
                           bg-black/50 backdrop-blur-sm border border-purple-500/30 rounded-full 
                           flex items-center justify-center text-white hover:bg-black/70 
                           transition-all duration-200 shadow-lg hidden sm:flex"
                  aria-label="Scroll categories left"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {showRightArrow && (
                <button
                  onClick={scrollRight}
                  className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 
                           bg-black/50 backdrop-blur-sm border border-purple-500/30 rounded-full 
                           flex items-center justify-center text-white hover:bg-black/70 
                           transition-all duration-200 shadow-lg hidden sm:flex"
                  aria-label="Scroll categories right"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              <div
                ref={scrollContainerRef}
                className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide py-4 px-1 sm:px-2"
                onScroll={checkScrollPosition}
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {categories.map((category) => {
                  const isActive = activeCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      aria-pressed={isActive}
                      className={`flex flex-col items-center justify-center space-y-2 w-24 h-24 sm:w-28 sm:h-28 
                                    p-2 sm:p-3 rounded-xl sm:rounded-2xl whitespace-nowrap transition-all duration-300 
                                    flex-shrink-0 border focus:outline-none focus:ring-2 focus:ring-purple-400
                                    ${
                                      isActive
                                        ? "bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-xl border-purple-400/50"
                                        : "bg-black/30 text-gray-300 hover:bg-black/50 hover:text-white border-purple-500/30 hover:border-purple-400/50"
                                    }`}
                    >
                      <span className="text-2xl sm:text-3xl">
                        {category.icon}
                      </span>
                      <span className="font-medium text-xs text-center leading-tight">
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Studios Section */}
          <div className="mt-6 sm:mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-white">
                Available Studios
              </h3>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center space-x-2 lg:hidden px-3 sm:px-4 py-2 bg-black/50 border border-purple-500/30 rounded-full text-white text-sm hover:bg-black/70 transition-all duration-200"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Studios Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
            {searchResults.length > 0 ? (
              searchResults.map(renderStudioCard)
            ) : (
              <div className="col-span-full text-center text-gray-400 py-16">
                <div className="space-y-4">
                  <Sparkles className="w-16 h-16 text-purple-500 mx-auto opacity-50" />
                  <h3 className="text-xl sm:text-2xl font-semibold">
                    No studios found
                  </h3>
                  <p className="text-sm sm:text-base">
                    Try adjusting your filters or searching for something else.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-2">
              {/* Previous Button */}
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                    handleFetchStudios(currentPage - 1);
                  }
                }}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-full font-medium border transition-all duration-200 ${
                  currentPage === 1
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700"
                    : "bg-black/40 text-white border-purple-500/30 hover:bg-purple-600 hover:text-white"
                }`}
              >
                <span className="hidden sm:inline">← Previous</span>
                <span className="sm:hidden">←</span>
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      handleFetchStudios(pageNum);
                    }}
                    className={`px-4 py-2 rounded-full font-medium border transition-all duration-200 ${
                      currentPage === pageNum
                        ? "bg-purple-600 text-white border-purple-500 shadow-lg"
                        : "bg-black/40 text-white border-purple-500/30 hover:bg-purple-600 hover:text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}

              {/* Next Button */}
              <button
                onClick={() => {
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                    handleFetchStudios(currentPage + 1);
                  }
                }}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-full font-medium border transition-all duration-200 ${
                  currentPage === totalPages
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700"
                    : "bg-black/40 text-white border-purple-500/30 hover:bg-purple-600 hover:text-white"
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getAlertStyles = (type) => {
    const baseStyles =
      "fixed bottom-4 sm:bottom-6 right-4 sm:right-6 px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl z-50 backdrop-blur-sm border flex items-center space-x-3 animate-fade-in-up max-w-sm sm:max-w-md text-sm sm:text-base";

    switch (type) {
      case "success":
        return `${baseStyles} bg-green-500/90 border-green-400/50 text-white`;
      case "error":
        return `${baseStyles} bg-red-500/90 border-red-400/50 text-white`;
      case "warning":
        return `${baseStyles} bg-yellow-500/90 border-yellow-400/50 text-white`;
      default:
        return `${baseStyles} bg-purple-500/90 border-purple-400/50 text-white`;
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "error":
        return <X className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "warning":
        return (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  return (
    <>
      {showEventModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-gradient-to-br from-slate-900/95 via-purple-900/20 to-indigo-900/30 border border-purple-400/40 rounded-3xl shadow-2xl p-8 w-full max-w-lg relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-3xl"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  Plan Your Event
                </h2>
                <p className="text-gray-400 text-sm">
                  Tell us about your special day
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Event Type */}
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    Event Type
                  </label>
                  <div className="relative">
                    <select
                      value={eventDetails.eventType}
                      onChange={(e) =>
                        setEventDetails({
                          ...eventDetails,
                          eventType: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-black/60 border border-purple-400/30 rounded-xl text-white appearance-none cursor-pointer hover:border-purple-400/50 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    >
                      <option value="" className="bg-gray-900">
                        Select Event Type
                      </option>
                      <option
                        value="Wedding Photography"
                        className="bg-gray-900"
                      >
                        💒 Wedding
                      </option>
                      <option
                        value="Birthday Photography"
                        className="bg-gray-900"
                      >
                        🎂 Birthday
                      </option>
                      <option value="Corporate Event" className="bg-gray-900">
                        🏢 Corporate
                      </option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={eventDetails.date}
                    onChange={(e) =>
                      setEventDetails({ ...eventDetails, date: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-black/60 border border-purple-400/30 rounded-xl text-white hover:border-purple-400/50 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  />
                </div>

                {/* City */}
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    City
                  </label>
                  <input
                    type="text"
                    value={eventDetails.city}
                    onChange={(e) =>
                      setEventDetails({ ...eventDetails, city: e.target.value })
                    }
                    placeholder="Enter your city"
                    className="w-full px-4 py-3 bg-black/60 border border-purple-400/30 rounded-xl text-white placeholder-gray-500 hover:border-purple-400/50 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  />
                </div>

                {/* Budget */}
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    Budget
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={eventDetails.budget}
                      onChange={(e) =>
                        setEventDetails({
                          ...eventDetails,
                          budget: e.target.value,
                        })
                      }
                      placeholder="50,000"
                      className="w-full pl-8 pr-4 py-3 bg-black/60 border border-purple-400/30 rounded-xl text-white placeholder-gray-500 hover:border-purple-400/50 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleEventSubmit}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02] transition-all duration-200"
                >
                  Show Studios
                </button>
                <button
                  onClick={handleSkipEventModal}
                  className="px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 hover:border-gray-500/50 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-200"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-black text-gray-100 font-inter overflow-hidden relative">


        <Navbar
          currentPage="explorestudios"
          navigateTo={() => {}}
          user={user}
          hideBrandName={true}
        />

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)] sm:h-[calc(100vh-65px)] md:h-[calc(100vh-73px)] overflow-hidden">
          {renderMainContent()}

          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}

          {renderRightSidebar()}
        </div>
        {renderStudioModal()}

        {/* Alert Notification */}
        {alert.show && (
          <div className={getAlertStyles(alert.type)}>
            {getAlertIcon(alert.type)}
            <span className="font-medium">{alert.message}</span>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-black/60 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              <p className="text-white font-medium">Loading studios...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ExploreStudio;
//main