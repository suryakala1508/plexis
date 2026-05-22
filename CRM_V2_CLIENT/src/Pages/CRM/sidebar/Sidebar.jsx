import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { SidebarMenuItem } from './SidebarMenuItem'
import { logout } from '../../../services/authService'
import { useSession } from '../../../contexts/SessionContext'
import { completeTour } from '../../../services/studioService'
import { useUser } from '../../../contexts/UserContext'
import { canDeny } from '../../../Pages/utils/permissions'
import {
  LayoutDashboard,
  Calendar,
  Users,
  FolderKanban,
  FileText,
  Settings,
  HelpCircle,
  Bell,
  ChevronLeft,
  Menu,
  X,
  Wallet,
  LogOut,
  Layers,
  Grid,
  Zap,
  Handshake,
  ListChecks,
  Briefcase,
  Container,
  UserCircle
} from 'lucide-react'

export const Sidebar = ({ user, studio }) => {
  const { refreshUser } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState({})
  // const [permissions, setPermissions] = useState(null);
  // const [loadingPermissions, setLoadingPermissions] = useState(true);
  const { session } = useSession();

  // Robust activeUser resolution with logging
  const activeUser = React.useMemo(() => {
    console.log('Sidebar - Resolving activeUser from:', { userProp: !!user, session: !!session });

    // `session` = JWT payload decoded from /auth/verify (has role, pages, components)
    // `user`    = DB user doc from /user endpoint (has display info but NO pages/components)
    // We must use session as the authority for permissions, merged with user for display info.
    const jwtData = session?.data || session; // support both wrapped and flat session shapes

    if (jwtData && jwtData.role) {
      // Merge: spread user display fields, then overlay JWT permission fields
      return {
        ...(user || {}),
        ...jwtData,
      };
    }

    // Fallback: if session not ready yet, use user prop (sidebar will be gated by hasPageAccess)
    if (user && Object.keys(user).length > 0) return user;

    return null;
  }, [user, session]);

  useEffect(() => {
    if (activeUser) {
      console.log('Sidebar - Active User Resolved:', {
        id: activeUser._id || activeUser.id,
        role: activeUser.role,
        hasPages: !!activeUser.pages,
        pageCount: activeUser.pages ? Object.keys(activeUser.pages).length : 0
      });
    }
  }, [activeUser]);

  // Assume this flag comes from backend (for now, keep true)
  const showTour = true;

  // Global Plexis tour chain (Dashboard -> Leads -> Projects -> Clients -> Crew -> Inventory -> Profile)
  const tourSequenceRef = useRef([
    { tourKey: 'dashboard-tour', path: '/dashboard' },
    { tourKey: 'calendar-tour', path: '/calendar' },
    { tourKey: 'leads-tour', path: '/leads' },
    { tourKey: 'forms-tour', path: '/forms' },
    { tourKey: 'projects-tour', path: '/project' },
    { tourKey: 'clients-tour', path: '/clients' },
    { tourKey: 'accounts-overview-tour', path: '/accounts/overview' },
    { tourKey: 'accounts-expenses-tour', path: '/accounts/expenses' },
    { tourKey: 'accounts-profit-loss-tour', path: '/accounts/profit-loss' },
    { tourKey: 'crew-tour', path: '/crew' },
    { tourKey: 'inventory-tour', path: '/inventory' },
    { tourKey: 'studio-profile-tour', path: '/studio/profile' },
  ]);

  const currentTourIndexRef = useRef(-1);
  const chainActiveRef = useRef(false);
  // useEffect(() => {
  //   const loadUser = async () => {
  //     try {
  //       const user = await fetchUserFromJWT();
  //       setPermissions(user);
  //     } catch (err) {
  //       setPermissions(null);
  //     } finally {
  //       setLoadingPermissions(false);
  //     }
  //   };

  //   loadUser();
  // }, []);



  // returns true for exact match OR when `current` is a child of `path` (e.g. '/leads' -> '/leads/form')
  // avoids accidental partial matches like '/lead' matching '/leads'
  const pathMatches = (path, current) => {
    if (!path) return false;
    if (current === path) return true;
    const base = path.endsWith('/') ? path : path + '/';
    return current.startsWith(base);
  };


  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      tourKey: 'dashboard-tour',
      subItems: [],
      pageid: "1",
      pageComponents: []  // admin-only page, no component-level deny needed
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      path: '/calendar',
      tourKey: 'calendar-tour',
      subItems: [],
      pageid: "2",
      pageComponents: ['2_1']
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: Users,
      path: '/leads',
      subItems: [
        { id: 'view-leads', label: 'View Leads', path: '/leads', tourKey: 'leads-tour', componentId: '3_1' },
        { id: 'lead-form', label: 'Lead Form', path: '/forms', tourKey: 'forms-tour', componentId: '3_2' }
      ],
      pageid: "3",
      pageComponents: ['3_1', '3_2']
    },
    {
      id: 'project',
      label: 'Project',
      icon: FolderKanban,
      path: '/project',
      tourKey: 'projects-tour',
      subItems: [],
      pageid: "4",
      pageComponents: ['4_1']
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Handshake,
      path: '/clients',
      tourKey: 'clients-tour',
      subItems: [],
      pageid: "5",
      pageComponents: ['5_1']
    },
    {
      id: 'accounts',
      label: 'Accounts',
      icon: Wallet,
      path: '/accounts/overview',
      subItems: [
        { id: 'accounts-overview', label: 'Overview', path: '/accounts/overview', tourKey: 'accounts-overview-tour' },
        { id: 'accounts-expenses', label: 'All Expenses', path: '/accounts/expenses', tourKey: 'accounts-expenses-tour' },
        { id: 'accounts-profit-loss', label: 'Profit & Loss', path: '/accounts/profit-loss', tourKey: 'accounts-profit-loss-tour' },
        { id: 'payment-dues', label: 'Payment Dues', path: '/accounts/paymentdues', tourKey: 'payment-dues-tour' }
      ],
      pageid: "6",
      pageComponents: ['6_1']
    },
    {
      id: 'pricing',
      label: 'Catalog',
      icon: ListChecks,
      path: '/pricing',
      subItems: [],
      pageid: "11",
      pageComponents: ['11_1']
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: Layers,
      path: '/templates',
      subItems: [],
      pageid: "10",
      pageComponents: ['10_1']
    },
    {
      id: 'crew',
      label: 'Crew & Staff',
      icon: Briefcase,
      path: '/crew',
      tourKey: 'crew-tour',
      subItems: [],
      pageid: "7",
      pageComponents: ['7_1', '7_2']
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Container,
      path: '/inventory',
      tourKey: 'inventory-tour',
      subItems: [],
      pageid: "8",
      pageComponents: ['8_1']
    },
    {
      id: 'configurations',
      label: 'Profile',
      icon: UserCircle,
      path: '/studio/profile',
      tourKey: 'studio-profile-tour',
      subItems: [],
      pageid: "9",
      pageComponents: []  // always accessible for staff
    },
  ]

  const hasPageAccess = (item) => {
    if (!activeUser) return false;
    const role = String(activeUser.role);
    if (role === "1") return true;
    
    // 1. Direct page access
    if (activeUser.pages?.[item.pageid]) return true;

    // 2. Component-level access (if they have access to ANY component on this page, show the sidebar item)
    if (item.pageComponents && item.pageComponents.length > 0) {
      return item.pageComponents.some(compId => {
        const comp = activeUser.components?.[String(compId)];
        return comp?.view === true || comp?.edit === true;
      });
    }

    return false;
  };

  // Returns true if a sub-item (with componentId) should be hidden because it is denied.
  const isSubItemDenied = (pageid, componentId) => {
    if (!activeUser) return false;
    const role = String(activeUser.role);
    if (role === "1") return false;
    return canDeny(activeUser, pageid, componentId);
  };

  // Returns true when ALL of a page's components are denied (= treat as no access at all).
  const isPageFullyDenied = (item) => {
    if (!activeUser) return false;
    const role = String(activeUser.role);
    if (role === "1") return false;
    const comps = item.pageComponents;
    // No components defined → never considered fully denied
    if (!comps || comps.length === 0) return false;
    // Only fully deny if they lack page access AND lack any individual component access.
    // If they have the main page permission (pageid), show the sidebar.
    if (activeUser.pages?.[item.pageid]) return false;

    // If they don't have the main page permission, only show if at least one component is explicitly allowed.
    if (!comps || comps.length === 0) return true; 

    return comps.every(cid => {
      const comp = activeUser.components?.[String(cid)];
      return comp?.deny === true || (!comp?.view && !comp?.edit);
    });
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };



  const filteredMenuItems = React.useMemo(() => {
    if (!activeUser) return [];

    return menuItems
      .filter(item => hasPageAccess(item))
      // Hide pages where every component is denied (same as never granting access)
      .filter(item => !isPageFullyDenied(item))
      .map(item => {
        // For items whose sub-items carry a componentId, filter out individually denied ones.
        if (item.subItems && item.subItems.length > 0 && item.subItems.some(s => s.componentId)) {
          const visibleSubItems = item.subItems.filter(sub =>
            !sub.componentId || !isSubItemDenied(item.pageid, sub.componentId)
          );
          // If ALL sub-items are denied, drop the parent item entirely
          if (visibleSubItems.length === 0) return null;
          return { ...item, subItems: visibleSubItems };
        }
        return item;
      })
      .filter(Boolean);
  }, [activeUser]);







  useEffect(() => {
    const parent = menuItems.find(item =>
      item.subItems?.some(sub => pathMatches(sub.path, location.pathname)) ||
      pathMatches(item.path, location.pathname)
    );
    if (parent) {
      setExpandedItems(prev => ({ ...prev, [parent.id]: true }));
    }
  }, [location.pathname]);

  // Handle chained Plexis tour progression
  // Helper to trigger a tour start on the current page after navigation
  // In Sidebar.jsx
  const triggerTourStart = (tourKey, delay = 2000) => { // Increase from 700 to 1200

    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('plexis-start-tour', { detail: { tourKey } })
      );
    }, delay);
  };

  useEffect(() => {
    const handleTourFinished = (event) => {

      if (!chainActiveRef.current) {
        return;
      }

      const finishedKey = event?.detail?.tourKey;
      const sequence = tourSequenceRef.current;
      const currentIndex = currentTourIndexRef.current;


      if (currentIndex < 0 || currentIndex >= sequence.length) {
        console.log('❌ Invalid index'); // ADD THIS
        return;
      }

      if (sequence[currentIndex].tourKey !== finishedKey) {
        console.log('⚠️ Key mismatch!', { // ADD THIS
          expected: sequence[currentIndex].tourKey,
          received: finishedKey
        });
        return;
      }

      const nextIndex = currentIndex + 1;


      if (nextIndex >= sequence.length) {
        chainActiveRef.current = false;
        currentTourIndexRef.current = -1;

        // Call API to mark tour as completed (sets tourDone in backend)
        completeTour().then(() => {
          refreshUser?.(); // Refresh studio so banner hides immediately
        }).catch(err => {
          console.error('Failed to persist tour completion:', err);
        });

        return;
      }

      currentTourIndexRef.current = nextIndex;
      const next = sequence[nextIndex];


      navigate(next.path);
      triggerTourStart(next.tourKey);
    };

    window.addEventListener('plexis-tour-finished', handleTourFinished);

    // Cancel chain when user clicks individual section help icon (tour stays in that section only)
    const handleCancelChain = () => {
      chainActiveRef.current = false;
      currentTourIndexRef.current = -1;
    };
    window.addEventListener('plexis-cancel-chain', handleCancelChain);

    // Listen for global start request (e.g., from Dashboard Banner)
    const handleChainStartRequest = () => {
      handleStartPlexisTour();
    };
    window.addEventListener('plexis-start-chain', handleChainStartRequest);

    return () => {
      window.removeEventListener('plexis-tour-finished', handleTourFinished);
      window.removeEventListener('plexis-cancel-chain', handleCancelChain);
      window.removeEventListener('plexis-start-chain', handleChainStartRequest);
    };
  }, [navigate]);

  const handleStartPlexisTour = () => {
    const sequence = tourSequenceRef.current;
    if (!sequence.length) return;
    chainActiveRef.current = true;
    currentTourIndexRef.current = 0;
    const first = sequence[0];
    navigate(first.path);
    triggerTourStart(first.tourKey);
  };


  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      navigate('/login')
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white rounded-lg shadow-lg text-gray-700 transition-all duration-200 hover:scale-110 active:scale-95"
      >
        {isOpen ? <X size={20} className="transition-transform duration-200 rotate-90" /> : <Menu size={20} className="transition-transform duration-200" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white z-40
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
          ${isCollapsed ? 'w-16' : 'w-56 lg:w-60 xl:w-64 2xl:w-72'} flex flex-col border-r border-gray-200
        `}
        style={{
          willChange: 'transform, width',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          perspective: '1000px'
        }}
      >

        <div className={`px-3 py-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} transition-all duration-300`}>
          {/* Brand */}
          {!isCollapsed && (
            <div className="text-xl font-bold bg-linear-to-r text-black bg-clip-text select-none fade-in slide-in-from-left-2">
              Plexis
            </div>
          )}

          {isCollapsed && (
            <div className="w-7 h-7 hidden">

            </div>
          )}

          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex p-1 hover:bg-primary-light hover:text-primary-dark rounded-md transition-all duration-300 ease-in-out ${isCollapsed ? 'rotate-180' : 'rotate-0'
              }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft size={14} className="text-gray-600 transition-transform duration-300" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {filteredMenuItems.map((item, index) => {
            const parentActive =
              pathMatches(item.path, location.pathname) ||
              item.subItems?.some((si) => pathMatches(si.path, location.pathname));

            return (
              <div
                key={item.id}
                className="fade-in slide-in-from-left-2"
                style={{
                  animationDelay: `${index * 30}ms`,
                  animationDuration: '300ms',
                  animationFillMode: 'both'
                }}
              >
                <SidebarMenuItem
                  item={item}
                  isActive={parentActive}
                  isExpanded={expandedItems[item.id]}
                  onToggleExpand={() => toggleExpand(item.id)}
                  currentPath={location.pathname}
                  isCollapsed={isCollapsed}
                />
              </div>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-t border-gray-200 my-2 fade-in" />

        {/* Bottom Section */}
        <div className={`px-2 pb-3 fade-in slide-in-from-bottom-2`}>

          {/* studioprofile */}
          {!isCollapsed && (
            <div className="px-2 py-1 mt-1 rounded-lg fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-2 w-full text-left group transition-all">
                {studio?.logo ? (
                  <img
                    src={studio.logo}
                    alt={studio.name || 'Studio'}
                    className="w-8 h-8 rounded-lg object-cover shadow-md transition-transform"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-dark to-primary rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md transition-transform duration-200">
                    {studio?.name?.[0] || user?.firstName?.[0] || 'S'}
                  </div>
                )}
                <div className="flex-1 min-w-0 transition-opacity duration-200">
                  <div className="text-xs font-semibold text-primary-dark truncate">
                    {studio?.name || 'Studio'}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="relative group px-2 py-2 mt-1 flex justify-center fade-in">
              {studio?.logo ? (
                <img
                  src={studio.logo}
                  alt={studio.name || 'Studio'}
                  className="w-8 h-8 rounded-lg object-cover cursor-pointer shadow-md transition-transform duration-200 "
                  title={studio.name || 'Studio'}
                />
              ) : (
                <div
                  className="w-8 h-8 bg-gradient-to-br from-primary-dark to-primary rounded-lg flex items-center justify-center text-white font-bold text-xs cursor-pointer shadow-md transition-transform duration-200"
                  title={studio?.name || 'Studio'}
                  onClick={() => navigate('/studio/profile')}
                >
                  {studio?.name?.[0] || user?.firstName?.[0] || 'S'}
                </div>
              )}
            </div>
          )}

          {/* Help Center, Start Tour & Logout Buttons */}
          <div className="space-y-0.5 mt-2">
            {/* Help Center */}
            {/* Help Center — Only for Admin */}
            {String(session?.role) === "1" && (
              <div className="relative group">
                <button
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} px-2 py-2 rounded-md text-xs text-gray-700 hover:bg-primary-light hover:text-primary-dark transition-all duration-200 ease-in-out transform hover:scale-[1.02]`}
                  title="Get help and support"
                  onClick={() => navigate('/my-tickets')}
                >
                  <HelpCircle size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110" />
                  {!isCollapsed && <span className="transition-opacity duration-200">Help center</span>}
                </button>

                {isCollapsed && (
                  <div className="hidden group-hover:block absolute left-full ml-1.5 bottom-0 z-50 px-2 py-1.5 bg-primary-dark text-white text-xs rounded-md whitespace-nowrap shadow-lg fade-in slide-in-from-left-2">
                    Help center
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-1.5 h-1.5 bg-primary-dark rotate-45"></div>
                  </div>
                )}
              </div>
            )}



            {/* Logout Button - Full View */}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
                title="Sign out of your account"
              >
                <LogOut size={14} strokeWidth={2} />
                <span>Logout</span>
              </button>
            )}

            {/* Logout - Collapsed View */}
            {isCollapsed && (
              <div className="relative group">
                <button
                  className="w-full flex items-center justify-center px-2 py-2 rounded-md text-xs text-red-600 hover:bg-red-50 transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
                  title="Sign out of your account"
                  onClick={handleLogout}
                >
                  <LogOut size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110" />
                </button>
                <div className="hidden group-hover:block absolute left-full ml-1.5 bottom-0 z-50 px-2 py-1.5 bg-red-600 text-white text-xs rounded-md whitespace-nowrap shadow-lg fade-in slide-in-from-left-2">
                  Logout
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-1.5 h-1.5 bg-red-600 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
