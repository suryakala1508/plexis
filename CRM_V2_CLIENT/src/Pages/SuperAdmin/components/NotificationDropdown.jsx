import React from 'react'
import { X, ArrowUp, Bell, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '../../../Components/ui/button'

export const NotificationDropdown = ({ 
  isOpen, 
  onClose, 
  upgradeRequests, 
  onManageClick 
}) => {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown Panel */}
      <div className="absolute right-0 top-full mt-2 w-[600px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b border-orange-200 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <ArrowUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Plan Upgrade Requests</h3>
                <p className="text-xs text-gray-600 font-normal mt-0.5">
                  {upgradeRequests.filter(r => r.status === 'open').length} pending actions
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-4">
          {upgradeRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-900 font-semibold mb-1">All caught up!</p>
              <p className="text-sm text-gray-500">No new plan upgrade requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upgradeRequests.map((request) => (
                <div
                  key={request._id}
                  className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                    request.status === 'open' 
                      ? 'border-orange-200 bg-orange-50/50 hover:border-orange-300' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Studio Avatar */}
                    <div className="w-10 h-10 rounded-lg bg-white border-2 border-orange-200 flex items-center justify-center font-bold text-orange-600 shadow-sm shrink-0">
                      {request.studioName?.[0]}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{request.studioName}</h4>
                          <p className="text-xs text-gray-500 font-medium">Ref: {request.refNo}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${
                          request.status === 'open' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                          request.status === 'resolved' ? 'bg-green-100 text-green-700 border border-green-200' :
                          'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      
                      {/* User Info */}
                      <div className="space-y-1 mb-2 text-xs">
                        <p className="text-gray-700">
                          <span className="font-semibold text-gray-900">User:</span> {request.userName}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold text-gray-900">Email:</span> {request.userEmail}
                        </p>
                      </div>
                      
                      {/* Description */}
                      <div className="bg-white rounded-lg p-2 border border-gray-200 mb-2">
                        <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed line-clamp-3">
                          {request.description}
                        </p>
                      </div>
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {new Date(request.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        
                        <Button
                          onClick={() => onManageClick(request)}
                          className="bg-primary hover:bg-primary-dark text-white font-bold px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all text-xs"
                          size="sm"
                        >
                          Manage Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
