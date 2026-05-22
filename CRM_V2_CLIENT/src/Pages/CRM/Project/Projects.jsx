import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Calendar, User, Search, Filter, ChevronRight, Clock, CheckCircle2, AlertCircle, HardDrive, Trash2 } from 'lucide-react'
import { getProjects, deleteProject } from '../../../services/projectService'
import DeleteProjectModal from '../../../Components/DeleteProjectModal'
import { useUser } from '../../../contexts/UserContext'
import { ExpiryLock } from '../../../Components/ExpiryLock'
import { Success } from '../../../Components/Success'
import { Error } from '../../../Components/Error'
import { TableSkeleton } from '../../../Components/Loading'
import { CreateProject } from './CreateProject'
import { formatDate, formatFileSize } from '../../../utils/formatUtils'
import { TourGuide } from '../../../Components/TourGuide/TourGuide'

import { projectsTourSteps } from '../../../Components/TourGuide/steps/projectsTourSteps'
import { PermissionGate, PageGuard } from '@/Pages/utils/permissions'


export const Projects = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  // `TourGuide` handles starting via `plexis-start-tour` events directly.
  // We only keep tour-active state here for demo UI.

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [prefillData, setPrefillData] = useState({})
  const [isTourActive, setIsTourActive] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [isDeletingProject, setIsDeletingProject] = useState(false)
  

  useEffect(() => {
    fetchProjects()
  }, [])

  // Check if we should open the modal from location state (e.g., from Lead page) or query param
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setPrefillData(location.state.prefillData || {})
      setShowCreateModal(true)
      // Clear the state to prevent reopening on re-render
      window.history.replaceState({}, document.title)
    } else if (location.search.includes('create=true')) {
      setPrefillData({})
      setShowCreateModal(true)
      // Clear the query param
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, location.search, navigate])

  // Track tour status via global events
  useEffect(() => {
    const handleTourStart = (e) => {
      if (e.detail?.tourKey === 'projects-tour') {
        setIsTourActive(true);
      }
    };

    const handleTourFinish = (e) => {
      if (e.detail?.tourKey === 'projects-tour') {
        setIsTourActive(false);
      }
    };

    window.addEventListener('plexis-start-tour', handleTourStart);
    window.addEventListener('plexis-tour-finished', handleTourFinish);

    return () => {
      window.removeEventListener('plexis-start-tour', handleTourStart);
      window.removeEventListener('plexis-tour-finished', handleTourFinish);
    };
  }, []);

  // Mock data for testing - set USE_MOCK_DATA to true to always use mock data
  const USE_MOCK_DATA = false   // Change to false to use real API

  const getMockProjects = () => {
    return [
      {
        id: '1',
        title: 'Sarah & John Wedding Photography',
        description: 'Complete wedding photography package including pre-wedding, ceremony, and reception coverage. Full day event with multiple locations.',
        clientName: 'Sarah Johnson',
        clientEmail: 'sarah.johnson@email.com',
        clientPhone: '+91 9876543210',
        startDate: '15-12-2024',
        endDate: '17-12-2024',
        projectType: 'Wedding',
        progress: 65,
        status: 'In Progress',
        createdBy: user?._id || user?.id,
        assignedTo: null,
        progressTimeline: [
          { title: 'Project Created', description: 'Project has been created', completedAt: new Date('2024-11-01') },
          { title: 'Pre-wedding Shoot', description: 'Completed pre-wedding photoshoot', completedAt: new Date('2024-11-15') },
          { title: 'Wedding Day Coverage', description: 'Full day wedding photography', completedAt: null }
        ]
      },
      {
        id: '2',
        title: 'Corporate Event - Tech Summit 2024',
        description: 'Corporate event photography for annual tech summit. Coverage includes keynote sessions, networking events, and product launches.',
        clientName: 'Tech Solutions Inc.',
        clientEmail: 'events@techsolutions.com',
        clientPhone: '+91 9876543211',
        startDate: '20-11-2024',
        endDate: '20-11-2024',
        projectType: 'Corporate',
        progress: 100,
        status: 'Completed',
        createdBy: user?._id || user?.id,
        assignedTo: null,
        progressTimeline: [
          { title: 'Project Created', description: 'Project has been created', completedAt: new Date('2024-10-15') },
          { title: 'Event Coverage', description: 'Completed full event photography', completedAt: new Date('2024-11-20') },
          { title: 'Photo Delivery', description: 'Delivered all photos to client', completedAt: new Date('2024-11-25') }
        ]
      },
      {
        id: '3',
        title: 'Portrait Session - Family Photos',
        description: 'Family portrait session at outdoor location. Includes individual and group shots with natural lighting.',
        clientName: 'Emily Rodriguez',
        clientEmail: 'emily.r@family.com',
        clientPhone: '+91 9876543212',
        startDate: '01-12-2024',
        endDate: '01-12-2024',
        projectType: 'Portrait',
        progress: 40,
        status: 'In Progress',
        createdBy: user?._id || user?.id,
        assignedTo: null,
        progressTimeline: [
          { title: 'Project Created', description: 'Project has been created', completedAt: new Date('2024-11-10') },
          { title: 'Photo Session', description: 'Completed portrait session', completedAt: new Date('2024-12-01') },
          { title: 'Photo Editing', description: 'Editing in progress', completedAt: null }
        ]
      },
      {
        id: '4',
        title: 'Pre-wedding Shoot - Beach Theme',
        description: 'Romantic pre-wedding photoshoot at beach location during sunset. Includes couple shots and candid moments.',
        clientName: 'David Park',
        clientEmail: 'david.park@email.com',
        clientPhone: '+91 9876543213',
        startDate: '10-12-2024',
        endDate: '10-12-2024',
        projectType: 'Pre-wedding',
        progress: 25,
        status: 'Due Soon',
        createdBy: user?._id || user?.id,
        assignedTo: null,
        progressTimeline: [
          { title: 'Project Created', description: 'Project has been created', completedAt: new Date('2024-11-20') },
          { title: 'Location Scouting', description: 'Completed location visit', completedAt: new Date('2024-11-25') },
          { title: 'Photo Session', description: 'Scheduled for Dec 10', completedAt: null }
        ]
      },
      {
        id: '5',
        title: 'Product Photography - Fashion Line',
        description: 'Professional product photography for new fashion line. Studio setup with multiple angles and lifestyle shots.',
        clientName: 'Fashion Brand LLC',
        clientEmail: 'photography@fashionbrand.com',
        clientPhone: '+91 9876543214',
        startDate: '15-11-2024',
        endDate: '30-11-2024',
        projectType: 'Corporate',
        progress: 80,
        status: 'In Progress',
        createdBy: user?._id || user?.id,
        assignedTo: null,
        progressTimeline: [
          { title: 'Project Created', description: 'Project has been created', completedAt: new Date('2024-11-01') },
          { title: 'Studio Setup', description: 'Completed studio preparation', completedAt: new Date('2024-11-10') },
          { title: 'Product Photography', description: 'Completed all product shots', completedAt: new Date('2024-11-20') },
          { title: 'Post Processing', description: 'Editing and retouching in progress', completedAt: null }
        ]
      }
    ]
  }

  const fetchProjects = async () => {
    try {
      setLoading(true)

      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API delay
        const mockProjects = getMockProjects()
        setProjects(mockProjects)
        return
      }

      // Real API call
      const data = await getProjects()
      // Transform backend data to frontend format
      const transformedProjects = data.map(project => ({
        id: project._id || project.id,
        title: project.projectTitle || 'Untitled Project',
        description: project.projectDescription || '',
        clientName: project.clientName || 'Unknown Client',
        clientEmail: project.clientEmail || '',
        clientPhone: project.clientPhone || '',
        startDate: formatDate(project.startDate),
        endDate: formatDate(project.endDate),
        projectType: project.projectType?.typeName || project.projectType || 'General',
        progress: calculateProgress(project || []),
        status: getProjectStatus(project),
        createdBy: project.createdBy,
        assignedTo: project.assignedTo,
        progressTimeline: project.progressTimeline || [],
        createdAt: project.createdAt ? new Date(project.createdAt) : new Date(), // Add createdAt for sorting
        storageUsed: project.storageUsed || 0,
      }))

      // Sort projects by creation date newest first
      const sortedProjects = transformedProjects.sort((a, b) => b.createdAt - a.createdAt);

      setProjects(sortedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error)
      // Fallback to mock data on error
      const mockProjects = getMockProjects()
      setProjects(mockProjects)
      // Uncomment the line below to show error message instead of mock data
      // setErrorMessage(`Failed to load projects: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (project) => {
    if (!project.startDate || !project.endDate) return 0;

    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const today = new Date();

    // If project has not started yet → default 20%
    if (today < start) return 20;

    // If project is already finished → 100%
    if (today >= end) return 100;

    const totalDuration = end - start; // in ms
    const elapsed = today - start; // in ms

    const progress = (elapsed / totalDuration) * 100;

    return Math.round(progress);
  };


  const getProjectStatus = (project) => {
    if (project.endDate) {
      const endDate = new Date(project.endDate)
      const today = new Date()
      if (endDate < today) return 'Completed'
    }
    return project.projectStatus || 'In Progress'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Planning":
        return "bg-purple-100 text-purple-700";
      case "In Progress":
        return "bg-blue-100 text-blue-700";
      case "Review":
        return "bg-yellow-100 text-yellow-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      case "On Hold":
        return "bg-orange-100 text-orange-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";


      case 'Due Soon':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 size={16} />
      case 'Due Soon':
        return <AlertCircle size={16} />
      default:
        return <Clock size={16} />
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === 'All' || project.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const handleDeleteProject = async () => {
    if (!projectToDelete) return
    try {
      setIsDeletingProject(true)
      await deleteProject(projectToDelete.id)
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id))
      setSuccessMessage(`"${projectToDelete.title}" has been deleted.`)
      setProjectToDelete(null)
    } catch (error) {
      setErrorMessage(`Failed to delete project: ${error.message}`)
      setIsDeletingProject(false)
      setProjectToDelete(null)
    } finally {
      setIsDeletingProject(false)
    }
  }

  const handleCreateProject = () => {
    setPrefillData({})
    setShowCreateModal(true)
  }

  const handleCreateSuccess = (createdProject) => {
    setShowCreateModal(false)
    fetchProjects() // Refresh the list
    navigate(`/project/${createdProject._id || createdProject.id}`)
  }

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`)
  }

  return (
    <PageGuard page="4">
      <div className='p-8 lg:pl-4'>
      <TourGuide 
        steps={projectsTourSteps} 
        tourKey="projects-tour" 
        autoStart={false}
        onComplete={(opts) => {
            const targetId = filteredProjects.length > 0 ? filteredProjects[0].id : '1';
            const state = { continueTour: true, isTourMode: true };
            if (opts?.isIndividualSection) {
              state.individualSectionReturnTo = '/project';
            }
            navigate(`/project/${targetId}`, { state });
          }}
      />
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='flex items-center justify-between mb-8'>
            <div>
              <h1 id="projects-header" className='text-2xl font-bold text-primary-dark mb-1'>
                Projects
              </h1>
              <p className='text-gray-600'>
                Manage and track your creative projects
              </p>
            </div>
            
              <ExpiryLock>
              <PermissionGate page="8" component="4_1" action="edit">
            <button
              id="projects-add-btn"
                  onClick={handleCreateProject}
                  className='flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-all font-medium'
                >
                  <Plus size={20} />
                  Create Project
                </button>
            </PermissionGate>
            </ExpiryLock>
        </div>

          {/* Messages */}
          {successMessage && (
            <Success message={successMessage} onClose={() => setSuccessMessage(null)} />
          )}
          {errorMessage && (
            <Error message={errorMessage} onClose={() => setErrorMessage(null)} />
          )}

        {/* Filters */}
        <div id="projects-filter-search" className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
              <input
                type='text'
                placeholder='Search projects by title, client, or description...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark'
              />
            </div>
            <div className='flex items-center gap-4'>
              <Filter size={20} className='text-gray-400' />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark min-w-[150px] bg-white cursor-pointer'
              >
                <option value='All'>All Status</option>
                <option value='Planning'>Planning</option>
                <option value='In Progress'>In Progress</option>
                <option value='Review'>Review</option>
                <option value='Completed'>Completed</option>
                <option value='On Hold'>On Hold</option>
                <option value='Cancelled'>Cancelled</option>
              </select>
            </div>
          </div>
        </div>

          {/* Projects List */}
          {loading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : filteredProjects.length === 0 ? (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {projects.length === 0
                    ? "No projects yet"
                    : "No projects found"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {projects.length === 0
                    ? "Get started by creating your first project"
                    : "Try adjusting your search or filter criteria"}
                </p>
                {projects.length === 0 && (
                  <PermissionGate page="8" component="4_1" action="edit">
                    <button
                      onClick={handleCreateProject}
                      className="px-6 py-3 bg-primary-dark text-white rounded-lg hover:bg-primary transition-all font-medium"
                    >
                      Create Your First Project
                    </button>
                  </PermissionGate>
                )}
              </div>

              {/* Demo Project Card for Tour - Only show when tour is active and no real projects found */}
              {isTourActive && (
                <div
                  id="project-item-0"
                  className="mt-8 opacity-60 pointer-events-none relative" // Visual distinction for demo
                >
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full z-10">
                    Example Project
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Demo Project - Wedding Photography
                          </h3>
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-700">
                            <Clock size={16} /> In Progress
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          This is a demo project to show you how the interface looks.
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <User size={16} />
                            <span>Demo Client</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={16} />
                            <span>Start: Today</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-400 ml-4" />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div id="projects-list" className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
              <div className='divide-y divide-gray-200'>
                {filteredProjects.map((project, index) => (
                  <div
                    key={project.id}
                    id={index === 0 ? "project-item-0" : undefined}
                    onClick={() => handleProjectClick(project.id)}
                    className='group p-6 hover:bg-gray-50 cursor-pointer transition-colors'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-3 mb-2'>
                          <h3 className='text-lg font-semibold text-gray-900'>
                            {project.title}
                          </h3>
                          <span
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}
                          >
                            {getStatusIcon(project.status)}
                            {project.status}
                          </span>
                        </div>
                        <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
                          {project.description || 'No description provided'}
                        </p>
                        <div className='flex flex-wrap items-center gap-4 text-sm text-gray-500'>
                          <div className='flex items-center gap-1.5'>
                            <User size={16} />
                            <span>{project.clientName}</span>
                          </div>
                          <div className='flex items-center gap-1.5'>
                            <Calendar size={16} />
                            <span>
                              Start: {project.startDate}
                              {project.endDate && ` | End: ${project.endDate}`}
                            </span>
                          </div>
                          <div className='flex items-center gap-1.5'>
                            <span className='font-medium text-gray-700'>{project.progress}%</span>
                            <span>Complete</span>
                          </div>
                          <div className='flex items-center gap-1.5'>
                            <HardDrive size={16} />
                            <span>{formatFileSize(project.storageUsed)}</span>
                          </div>
                          <div className='text-xs text-gray-400'>
                            {project.projectType}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-2 ml-4'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setProjectToDelete(project)
                          }}
                          title='Delete project'
                          className='opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150'
                        >
                          <Trash2 size={16} />
                        </button>
                        <ChevronRight size={20} className='text-gray-400' />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Create Project Modal */}
      <ExpiryLock>
          <CreateProject
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            prefillData={prefillData}
            onSuccess={handleCreateSuccess}
          />
      </ExpiryLock>

      {/* Delete Project Modal */}
      <DeleteProjectModal
        open={!!projectToDelete}
        projectTitle={projectToDelete?.title || ''}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
        isDeleting={isDeletingProject}
      />
      </div>
    </PageGuard>
  )
}

