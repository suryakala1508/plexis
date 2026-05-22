import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar/Sidebar'
import { useUser } from '../../contexts/UserContext'
import { useUpload } from '../../contexts/UploadContext'
import { UploadProgressWidget } from './Project/components/UploadProgressWidget'

export const Layout = ({ children }) => {
  const { user, studio, refreshUser } = useUser()
  const { uploadBatches, showWidget, dismissWidget, handleRetry, activeProjectId, timeLeft } = useUpload();

  // Support both old pattern (with children) and new pattern (with Outlet)
  const content = children || <Outlet />

  React.useEffect(() => {
    // Lock body overflow to prevent the whole page from scrolling
    // and ensuring our Layout container handles everything.
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  return (
    <div className='fixed inset-0 h-screen w-screen flex bg-gray-50 overflow-hidden'>
      <Sidebar user={user} studio={studio} />

      <main
        className='flex-1 min-w-0 overflow-y-auto no-scrollbar bg-gray-50 pt-16 lg:pt-0'
        style={{
          willChange: 'auto',
        }}
      >
        {content}
      </main>

      {showWidget && (
        <UploadProgressWidget
          uploadBatches={uploadBatches}
          onRetry={handleRetry}
          onDismiss={dismissWidget}
          projectId={activeProjectId}
          timeLeft={timeLeft}
        />
      )}
    </div>
  )
}

