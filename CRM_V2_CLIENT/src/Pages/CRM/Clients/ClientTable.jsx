import React from 'react'
import { Edit2, Trash2, Building2, Eye, Bell } from 'lucide-react'
import { PermissionGate } from '@/Pages/utils/permissions'

export const ClientTable = ({
  clients,
  onClientClick,
  selectedClientId,
  onAddFollowUp
}) => {
  const getStatusBadge = (status) => {
    if (status === 'Ongoing') {
      return (
        <span className='px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold'>
          Ongoing
        </span>
      )
    } else if (status === 'Completed') {
      return (
        <span className='px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold'>
          Completed
        </span>
      )
    }
    return (
      <span className='px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold'>
        {status}
      </span>
    )
  }

  return (
    <div className='bg-white border rounded-xl border-gray-200 overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead className='bg-gray-50 border-b border-gray-200'>
            <tr>
              <th className='px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Client Name
              </th>
              <th className='px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Project Name
              </th>
              <th className='px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Relation
              </th>
              <th className='px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Email
              </th>
              <th className='px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Phone
              </th>
              <th className='px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Onboarded On
              </th>
              <th className='px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Status
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            {clients.length === 0 ? (
              <tr>
                <td colSpan='7' className='px-6 py-12 text-center'>
                  <div className='flex flex-col items-center justify-center text-gray-500'>
                    <Building2 size={48} className='text-gray-300 mb-3' />
                    <p className='text-lg font-medium mb-1'>No clients found</p>
                    <p className='text-sm'>Add your first client to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              clients.map((client, index) => (
                <tr
                  key={client.id}
                  onClick={() => onClientClick(client)}
                  className={`cursor-pointer transition-colors ${selectedClientId === client.id
                    ? 'bg-primary-light/80 hover:bg-primary-light/80'
                    : index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-primary-light/30 hover:bg-primary-light/80'
                    }`}
                >
                  <td className='px-4 py-2.5'>
                    <div className='font-semibold text-sm text-gray-900'>{client.name}</div>
                  </td>
                  <td className='px-4 py-2.5'>
                    {client.hasProject ? (
                      <div className='text-sm text-gray-900 max-w-[200px] truncate' title={client.projectTitle}>
                        {client.projectTitle}
                      </div>
                    ) : (
                      <span className='text-xs text-gray-400 italic'>No Project</span>
                    )}
                  </td>
                  <td className='px-4 py-2.5'>
                    <div className='text-sm text-gray-600'>{client.relation}</div>
                  </td>
                  <td className='px-4 py-2.5'>
                    <div className='text-sm text-gray-600 truncate max-w-[200px]'>{client.email}</div>
                  </td>
                  <td className='px-4 py-2.5'>
                    <div className='text-sm text-gray-600'>{client.phone}</div>
                  </td>
                  <td className='px-4 py-2.5'>
                    <div className='text-sm text-gray-600'>{client.onboardedOn}</div>
                  </td>
                  <td className='px-4 py-2.5'>
                    <div className='flex items-center justify-between gap-2 group/row'>
                      {getStatusBadge(client.status)}
                      <PermissionGate page="4" component="4_1" action="edit">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddFollowUp(client);
                            }}
                            className='p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all'
                            title='Tip : This is a future based follow up for this client.'
                          >
                            <Bell size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClientClick(client);
                            }}
                            className='p-1.5 text-gray-400 hover:text-primary-dark hover:bg-primary-light/50 rounded-lg transition-all'
                            title='View Details'
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

