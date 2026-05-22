import { get, post, put, del } from './api';

/**
 * Get all crew members
 * Returns all crew and staff members for the studio
 */
export const getCrewList = async () => {
  const response = await get('/studio/crew');
  return response.crew;
};
export const getCrewListWithProjects = async () => {
  const response = await get('/studio/crewWithProjects');
  return response.crew;
};

/**
 * Add a new crew or staff member
 * @param {Object|FormData} memberData - Member data (can be FormData for photo upload)
 * @param {boolean} isFormData - Whether memberData is FormData
 */
export const addCrewMember = async (memberData, isFormData = false) => {
  const config = isFormData ? {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  } : {};
  const response = await post('/studio/addCrew', memberData, config);
  return response;
};


/**
 * Update crew or staff member
 * @param {string} crewId
 * @param {Object|FormData} memberData - Member data (can be FormData for photo upload)
 * @param {boolean} isFormData - Whether memberData is FormData
 */
export const updateCrewMember = async (crewId, memberData, isFormData = false) => {
  const config = isFormData ? {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  } : {};
  const response = await put(`/studio/crew/${crewId}`, memberData, config);
  return response;
};

/**
 * Update notes for a crew/staff member
 * @param {string} crewId
 * @param {string} notes
 */
export const updateCrewNotes = async (crewId, notes) => {
  const response = await put(`/studio/crew/${crewId}`, { notes });
  return response;
};

/**
 * Delete crew or staff
 * @param {string} crewId
 */
export const deleteCrewMember = async (crewId) => {
  const response = await del(`/studio/crew/${crewId}`);
  return response;
};


/**
 * Get all available roles for the studio
 */
export const getAllRoles = async () => {
  try {
    const response = await get('/studio/roles');
    return response.roles;
  } catch (error) {
    if (error.response?.status === 402) {
      return {
        roles: [],
        locked: true,
        message: error.response.data?.message || 'Upgrade to get more premium options.',
      };
    }

    throw error;
  }
};

/**
 * Create a new role
 * @param {Object} roleData - Role data
 * @param {string} roleData.roleName - Name of the role
 * @param {Array<string>} roleData.permissions - Array of permissions
 */
export const addRole = async (roleData) => {
  const response = await post('/studio/addRole', roleData);
  return response;
};


/**
 * Verify invite token and fetch invite details
 * @param {Object} params
 * @param {string} params.token - Invite token
 * @param {string} params.ref - Email reference
 */
export const verifyInvite = async ({ token, ref }) => {
  const response = await get("/role/verify", {
    params: { token, ref },
  });

  return response;
};


/**
 * Set password for invited staff member
 * @param {Object} payload
 * @param {string} payload.token - Invite token
 * @param {string} payload.ref - Email reference
 * @param {string} payload.password - New password
 */
export const setInvitePassword = async ({ token, ref, password }) => {
  const response = await post("/role/set-password", {
    token,
    ref,
    password,
  });

  return response;
};
