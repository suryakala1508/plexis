import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, HelpCircle } from 'lucide-react'

export const SidebarMenuItem = ({
  item,
  isActive,
  isExpanded,
  onToggleExpand,
  currentPath,
  isCollapsed = false
}) => {
  const navigate = useNavigate()
  const Icon = item.icon
  const hasSubItems = item.subItems && item.subItems.length > 0

  const handleClick = (e) => {
    // If it's the help button click, don't trigger main navigation
    if (e.target.closest('.tour-help-btn')) return;

    if (hasSubItems && !isCollapsed) {
      onToggleExpand()
    } else {
      if (currentPath !== item.path) {
        navigate(item.path)
      }
    }
  }

  const handleTourClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Individual section help: cancel any active chain so tour stays in this section only
    window.dispatchEvent(new CustomEvent('plexis-cancel-chain'));

    const eventDetail = { tourKey: item.tourKey, individualSection: true };

    // If currently on the same page, just dispatch event
    if (currentPath === item.path) {
      window.dispatchEvent(new CustomEvent('plexis-start-tour', { detail: eventDetail }));
    } else {
      // Navigate and pass state to start tour
      navigate(item.path, { state: { startTour: true, tourKey: item.tourKey } });

      // Fallback dispatch in case navigation doesn't remount if it's same component
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('plexis-start-tour', { detail: eventDetail }));
      }, 500);
    }
  }

  return (
    <div className="relative group">
      {/* Main Menu Item */}
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} 
          px-2 py-2 rounded-md text-xs transition-all duration-200 ease-in-out
          transform hover:scale-[1.02] active:scale-[0.98]
          ${isActive 
            ? 'bg-primary-dark text-white font-semibold shadow-md' 
            : 'text-gray-700 hover:bg-primary-light hover:text-primary-dark'
          }
        `}
        title={item.label}
      >
        <div className={`flex items-center ${isCollapsed ? '' : 'gap-2'} transition-all duration-200 flex-1`}>
          <Icon size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110" />
          {!isCollapsed && <span className='text-xs font-medium transition-opacity duration-200'>{item.label}</span>}
        </div>
        
        {!isCollapsed && (
            <div className="flex items-center gap-2">
            {item.tourKey && isActive && (
                <div 
                className={`
                    tour-help-btn p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer
                    ${isActive ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-primary-dark'}
                `}
                onClick={handleTourClick}
                title={`Start ${item.label} Tour`}
                >
                <HelpCircle size={14} strokeWidth={2} />
                </div>
            )}
            
            {hasSubItems && (
                <ChevronDown
                size={14}
                strokeWidth={2}
                className={`transition-transform duration-300 ease-in-out ${
                    isExpanded ? 'rotate-180' : 'rotate-0'
                }`}
                />
            )}
            </div>
        )}
      </button>

      {/* Tooltip on hover when collapsed */}
      {isCollapsed && (
        <div className="hidden group-hover:block absolute left-full ml-1.5 top-0 z-50 px-2 py-1.5 bg-primary-dark text-white text-xs rounded-md whitespace-nowrap shadow-lg fade-in slide-in-from-left-2">
          {item.label}
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-1.5 h-1.5 bg-primary-dark rotate-45"></div>
        </div>
      )}

      {/* Sub-items */}
      {!isCollapsed && hasSubItems && (
        <div key={item.id}
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isExpanded ? 'max-h-96 mt-1 opacity-100' : 'max-h-0 opacity-0'} 
          `}
        >
          <div className="ml-7 space-y-0.5 py-1">
            {item.subItems.map((subItem, index) => {
              const isSubActive = currentPath === subItem.path
              return (
                <button
                  key={subItem.id}
                  onClick={() => {
                    if (!isSubActive) {
                      navigate(subItem.path)
                    }
                  }}
                  className={`
                    w-full text-left px-2 py-1.5 rounded-md text-xs
                    transition-all duration-200 ease-in-out
                    transform hover:scale-[1.02] hover:translate-x-1
                    ${
                      isSubActive
                        ? 'bg-primary-light text-primary-dark font-semibold shadow-sm'
                        : 'text-gray-600 hover:bg-primary-light/50 hover:text-primary-dark'
                    }
                  `}
                  style={{
                    animationDelay: isExpanded ? `${index * 50}ms` : '0ms',
                    animation: isExpanded ? 'fadeInSlide 0.3s ease-out forwards' : 'none'
                  }}
                  title={subItem.label}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{subItem.label}</span>
                    {subItem.tourKey && isSubActive && (
                       <div 
                         className="p-0.5 rounded-full hover:bg-black/10 text-primary-dark transition-colors cursor-pointer"
                         onClick={(e) => {
                             e.stopPropagation();
                             e.preventDefault();
                             window.dispatchEvent(new CustomEvent('plexis-cancel-chain'));
                             window.dispatchEvent(new CustomEvent('plexis-start-tour', { 
                               detail: { tourKey: subItem.tourKey, individualSection: true } 
                             }));
                         }}
                         title="Start Tour"
                       >
                         <HelpCircle size={12} strokeWidth={2.5} />
                       </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

