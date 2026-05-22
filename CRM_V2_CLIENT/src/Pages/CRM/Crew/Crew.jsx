import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { PeopleTable } from "./PeopleTable";
import { CrewFilters } from "./CrewFilters";
import { CrewModal } from "./CrewModal";
import { CrewSidebar } from "./CrewSidebar";
import { TableSkeleton } from "../../../Components/Loading";
import ReactDOM from "react-dom/client";
import {
  getCrewList,
  getCrewListWithProjects,
  addCrewMember,
  getAllRoles,
  deleteCrewMember,
  updateCrewMember,
} from "../../../services/crewService";
import { useUser } from "../../../contexts/UserContext";
import { formatDate } from "../../../utils/formatUtils";
import { PermissionGate, PageGuard } from "@/Pages/utils/permissions";
import { Success } from "../../../Components/Success"; // Add this
import { Error } from "../../../Components/Error"; // Add this
import { TourGuide } from "../../../Components/TourGuide/TourGuide";

import { crewTourSteps } from "../../../Components/TourGuide/steps/crewTourSteps";
import { canView, canEdit, canDeny } from "@/Pages/utils/permissions";
import { useSession } from "@/contexts/SessionContext";
import { Lock } from "lucide-react";


/**
 * Toast Notification Component
 */

/**
 * Crew Management Component
 */
export const Crew = () => {
  const { session } = useSession();
  const { user } = useUser();
  const location = useLocation();
  const startTourRef = useRef(null);

  const denyCrew = canDeny(session, "7", "7_1");
  const denyStaff = canDeny(session, "7", "7_2");

  const editCrew = canEdit(session, "7", "7_1");
  const editStaff = canEdit(session, "7", "7_2");


  const isCompletedByDate = (dateLike) => {
    if (!dateLike) return false;
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return false;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return d < todayStart;
  };

  const isProjectActive = (project) => {
    if (!project) return false;
    return (
      project.projectStatus !== 'Completed' &&
      project.projectStatus !== 'Cancelled' &&
      !isCompletedByDate(project.endDate)
    );
  };

  useEffect(() => {
    if (!session) return;

    let safeTab = localStorage.getItem("crewActiveTab") || "crew";

    if (safeTab === "crew" && denyCrew) {
      safeTab = "staff";
    }

    if (safeTab === "staff" && denyStaff) {
      safeTab = "crew";
    }

    setActiveTab(safeTab);
  }, [session, denyCrew, denyStaff]);

  // State management
  const [allPeople, setAllPeople] = useState([]);
  const [peopleForTable, setPeopleForTable] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rolesLockedMessage, setRolesLockedMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('crewActiveTab') || 'crew';
  });



  // Persist tab
  useEffect(() => {
    localStorage.setItem('crewActiveTab', activeTab);
  }, [activeTab]);

  // Toast state

  const handleEditMember = (personFromTable) => {
    const rawPerson = allPeople.find((p) => p._id === personFromTable.id);

    if (!rawPerson) return;

    const editPayload = {
      id: rawPerson._id,
      name: rawPerson.name || "",
      position: rawPerson.position || "",
      email: rawPerson.contactInfo.email || "",
      phone: rawPerson.contactInfo.phone || "",
      hasAccess: !!rawPerson.role,
      role: rawPerson.role != null ? String(rawPerson.role) : "",
      pages: rawPerson.pages || {},
      components: rawPerson.components || {},
      invite: rawPerson.invite || null,
      photo: rawPerson.photo || null,
    };

    setEditingMember(editPayload);
    setModalOpen(true);
  };

  const handleDeleteMember = async (person) => {
    try {
      // Close sidebar if the same person is open
      if (selectedPerson?.id === person.id) {
        setSidebarOpen(false);
        setSelectedPerson(null);
      }

      await deleteCrewMember(person.id);

      // Show success toast
      const successDiv = document.createElement("div");
      document.body.appendChild(successDiv);

      const root = ReactDOM.createRoot(successDiv);
      root.render(
        <Success
          title="Successfully Deleted"
          autoClose={true}
          autoCloseDelay={4500}
          makeDarker={true}
          onClose={() => {
            root.unmount();
            document.body.removeChild(successDiv);
          }}
        >
          {person.name} has been removed from your{" "}
          {person.hasAccess ? "staff" : "crew"}
        </Success>,
      );

      // Update local state instead of refetching everything
      setAllPeople((prev) => prev.filter((p) => p._id !== person.id));
      setPeopleForTable((prev) => prev.filter((p) => p.id !== person.id));
    } catch (err) {
      console.error("Delete failed", err);

      // Create an error notification element
      const errorDiv = document.createElement("div");
      document.body.appendChild(errorDiv);

      const errorRoot = ReactDOM.createRoot(errorDiv);
      errorRoot.render(
        <Error
          title="Delete Failed"
          variant="error"
          makeDarker={true}
          autoClose={false}
          onClose={() => {
            errorRoot.unmount();
            document.body.removeChild(errorDiv);
          }}
        >
          Unable to remove {person.name}. Please try again.
        </Error>,
      );
    }
  };

  // Filter states
  const [crewFilters, setCrewFilters] = useState({
    search: "",
    position: "",
  });

  const [staffFilters, setStaffFilters] = useState({
    search: "",
    position: "",
    role: "",
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  // Check if we should open create modal from navigation state
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setModalOpen(true);
    }
  }, [location.state]);

  // Transform backend data to frontend format
  const transformPersonForFrontend = (person) => {
    const assignedProjects = Array.isArray(person.assignedTo)
      ? person.assignedTo
        .filter((p) => p && p._id)
        // If event date has passed, treat as completed -> not assigned
        .filter((project) => isProjectActive(project))
        .map((project) => ({
          projectId: project._id,
          projectTitle: project.projectTitle,
          startDate: project.startDate,
          endDate: project.endDate,
          projectType: project.projectType,
        }))
      : [];

    return {
      id: person._id,
      name: person.name,
      position: person.position,
      email: person.contactInfo?.email || "",
      phone: person.contactInfo?.phone || "",
      assignedProjects: assignedProjects,
      status: assignedProjects.length > 0 ? "Assigned" : "Available",
      role: person.role || null,
      roleName: person.role?.roleName || null,
      invite: person.invite || null,
      permissions: person.role?.permissions || [],
      hasAccess: !!person.role,
      addedDate: formatDate(person.createdAt),
      notes: person.notes || "",
      photo: person.photo || null,
    };
  };

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      setRolesLockedMessage("");

      // Fetch both crew and roles initially
      const crewData = await getCrewListWithProjects();
      const rolesResult = await getAllRoles();

      setAllPeople(crewData);
      const transformedPeople = crewData.map(transformPersonForFrontend);
      setPeopleForTable(transformedPeople);
      if (Array.isArray(rolesResult)) {
        setRoles(rolesResult);
      } else {
        setRoles(rolesResult?.roles || []);
        if (rolesResult?.locked) {
          setRolesLockedMessage(rolesResult.message || "Upgrade to get more premium options.");
        }
      }

      // Update selected person if sidebar is open
      if (selectedPerson) {
        const updated = transformedPeople.find(p => p.id === selectedPerson.id);
        if (updated) setSelectedPerson(updated);
      }
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      setError("Failed to load team members. Please try again later.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchCrewData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const crewData = await getCrewListWithProjects();
      setAllPeople(crewData);
      const transformedPeople = crewData.map(transformPersonForFrontend);
      setPeopleForTable(transformedPeople);

      if (selectedPerson) {
        const updated = transformedPeople.find(p => p.id === selectedPerson.id);
        if (updated) setSelectedPerson(updated);
      }
    } catch (err) {
      console.error("❌ Error fetching crew data:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleUpdateNotesLocal = (crewId, newNotes) => {
    setAllPeople(prev => prev.map(p => p._id === crewId ? { ...p, notes: newNotes } : p));
    setPeopleForTable(prev => prev.map(p => p.id === crewId ? { ...p, notes: newNotes } : p));
    if (selectedPerson?.id === crewId) {
      setSelectedPerson(prev => ({ ...prev, notes: newNotes }));
    }
  };

  // Separate crew and staff
  const crew = useMemo(() => {
    return peopleForTable.filter((person) => !person.hasAccess);
  }, [peopleForTable]);

  const staff = useMemo(() => {
    return peopleForTable.filter((person) => person.hasAccess);
  }, [peopleForTable]);

  // Filter crew locally
  const filteredCrew = useMemo(() => {
    return crew.filter((person) => {
      const searchLower = crewFilters.search.toLowerCase();
      const matchesSearch =
        !crewFilters.search ||
        person.name?.toLowerCase().includes(searchLower) ||
        person.email?.toLowerCase().includes(searchLower) ||
        person.position?.toLowerCase().includes(searchLower);

      const matchesPosition =
        !crewFilters.position || person.position === crewFilters.position;

      return matchesSearch && matchesPosition;
    });
  }, [crew, crewFilters]);

  // Filter staff locally
  const filteredStaff = useMemo(() => {
    return staff.filter((person) => {
      const searchLower = staffFilters.search.toLowerCase();
      const matchesSearch =
        !staffFilters.search ||
        person.name?.toLowerCase().includes(searchLower) ||
        person.email?.toLowerCase().includes(searchLower) ||
        person.position?.toLowerCase().includes(searchLower);

      const matchesPosition =
        !staffFilters.position || person.position === staffFilters.position;
      const matchesRole =
        !staffFilters.role || person.role === staffFilters.role;
      const invite =
        !staffFilters.invite || person.invite?.used === staffFilters.invite.used;

      return matchesSearch && matchesPosition && matchesRole && invite;
    });
  }, [staff, staffFilters]);

  const showRoleLockedHint = rolesLockedMessage && !loading && !error;

  // Get unique positions for filters
  const crewPositions = useMemo(() => {
    const positions = [
      ...new Set(crew.map((person) => person.position).filter(Boolean)),
    ];
    return positions.sort();
  }, [crew]);

  const staffPositions = useMemo(() => {
    const positions = [
      ...new Set(staff.map((person) => person.position).filter(Boolean)),
    ];
    return positions.sort();
  }, [staff]);

  // Handle filter changes
  const handleCrewFilterChange = (filterType, value) => {
    if (filterType === "reset") {
      setCrewFilters({ search: "", position: "" });
    } else {
      setCrewFilters((prev) => ({ ...prev, [filterType]: value }));
    }
  };

  const handleStaffFilterChange = (filterType, value) => {
    if (filterType === "reset") {
      setStaffFilters({ search: "", position: "", role: "", invite: "" });
    } else {
      setStaffFilters((prev) => ({ ...prev, [filterType]: value }));
    }
  };

  // Handle person click
  const handlePersonClick = (person) => {
    setSelectedPerson(person);
    setSidebarOpen(true);
  };

  // Handle sidebar close
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setTimeout(() => setSelectedPerson(null), 300);
  };

  // Handle ADD + EDIT member
  const handleSaveMember = async (memberData, isFormData = false) => {
    try {
      const isEdit = isFormData ? memberData.get("id") : !!memberData.id;

      let result;
      if (isFormData) {
        // Handle FormData (with photo)
        if (isEdit) {
          const crewId = memberData.get("id");
          memberData.delete("id");
          result = await updateCrewMember(crewId, memberData, true);
        } else {
          result = await addCrewMember(memberData, true);
        }
      } else {
        // Handle regular JSON payload
        const payload = {
          name: memberData.name,
          position: memberData.position,
          email: memberData.email,
          phone: memberData.phone || "",
          hasaccess: !!memberData.hasaccess,
        };

        if (memberData.hasaccess && memberData.role) {
          payload.role = memberData.role;
          payload.pages = memberData.pages;
          payload.components = memberData.components;
        }

        if (isEdit) {
          result = await updateCrewMember(memberData.id, payload);
        } else {
          result = await addCrewMember(payload);
        }
      }
      // Close modal and sidebar
      setModalOpen(false);
      setSidebarOpen(false);
      setEditingMember(null);

      // Show success toast
      const memberName = isFormData ? memberData.get("name") : memberData.name;

      // Update local state instead of refetching
      if (isEdit) {
          const updatedRawCrew = result.crew || result.data || result;
          // preserve existing assignedTo if not returned from backend
          const oldPerson = allPeople.find(p => p._id === (isFormData ? memberData.get("id") : memberData.id));
          if (oldPerson && !updatedRawCrew.assignedTo) {
             updatedRawCrew.assignedTo = oldPerson.assignedTo;
          }
          
          setAllPeople(prev => prev.map(p => p._id === updatedRawCrew._id ? updatedRawCrew : p));
          const transformedObj = transformPersonForFrontend(updatedRawCrew);
          setPeopleForTable(prev => prev.map(p => p.id === transformedObj.id ? transformedObj : p));
          if (selectedPerson?.id === transformedObj.id) {
             setSelectedPerson(transformedObj);
          }
      } else {
          const newRawCrew = result.crew || result.data || result;
          if (!newRawCrew.assignedTo) newRawCrew.assignedTo = [];
          setAllPeople(prev => [newRawCrew, ...prev]);
          const transformedObj = transformPersonForFrontend(newRawCrew);
          setPeopleForTable(prev => [transformedObj, ...prev]);
      }

      // Create a success notification element
      const successDiv = document.createElement("div");
      document.body.appendChild(successDiv);

      const root = ReactDOM.createRoot(successDiv);
      root.render(
        <Success
          title={isEdit ? "Successfully Updated" : "Successfully Added"}
          autoClose={true}
          autoCloseDelay={4500}
          makeDarker={true}
          onClose={() => {
            root.unmount();
            document.body.removeChild(successDiv);
          }}
        >
          {memberName} has been {isEdit ? "updated" : "added to your team"}
        </Success>,
      );
    } catch (err) {
      console.error("Error saving member:", err);

      // Parse error message from backend
      let errorMessage = "Unable to save team member. Please try again.";
      let errorDetails = "";

      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      // Check for specific error types
      if (
        errorMessage.toLowerCase().includes("email") &&
        (errorMessage.toLowerCase().includes("already") ||
          errorMessage.toLowerCase().includes("exists") ||
          errorMessage.toLowerCase().includes("duplicate"))
      ) {
        errorMessage = "Email Already Exists";
        errorDetails =
          "This email address is already registered. Please use a different email.";
      } else if (
        errorMessage.toLowerCase().includes("phone") &&
        (errorMessage.toLowerCase().includes("invalid") ||
          errorMessage.toLowerCase().includes("format"))
      ) {
        errorMessage = "Invalid Phone Number";
        errorDetails = "Please enter a valid phone number (10-15 digits).";
      } else {
        errorDetails = errorMessage;
      }

      // Create an error notification element
      const errorDiv = document.createElement("div");
      document.body.appendChild(errorDiv);

      const errorRoot = ReactDOM.createRoot(errorDiv);
      errorRoot.render(
        <Error
          title={errorMessage}
          variant="error"
          makeDarker={true}
          autoClose={false}
          onClose={() => {
            errorRoot.unmount();
            document.body.removeChild(errorDiv);
          }}
        >
          {errorDetails}
        </Error>,
      );

      throw err;
    }
  };

  return (
    <>
      <TourGuide 
        steps={crewTourSteps} 
        tourKey="crew-tour" 
        autoStart={false}
        onStartTour={(startFn) => { startTourRef.current = startFn; }}
      />
      {/* Toast Notifications */}
      <PageGuard page={7}>

      <div className="p-4 sm:p-6 lg:pl-4">
        <div className="max-w-400 mx-auto">
          {/* Header */}
          <div id="crew-header-section" className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary-dark mb-1">
                Team Management
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Manage your crew members and staff with dashboard access
              </p>
            </div>
            {canView(session, "7", "7_3") && (
              <button
                id="add-team-member-button"
                onClick={() => {
                  setEditingMember(null);
                  setModalOpen(true);
                }}
                className="bg-primary-dark text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-primary hover:shadow-xl transition-all flex items-center gap-2 shadow-lg text-xs sm:text-sm group w-full sm:w-auto justify-center"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Team Member
              </button>
              )}

            </div>

            {/* Loading State */}
            {loading && <TableSkeleton rows={8} columns={4} />}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-red-600 shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-red-800 font-semibold mb-1">
                      Error Loading Team Members
                    </p>
                    <p className="text-red-700 text-sm">{error}</p>
                    <button
                      onClick={fetchData}
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Main Content */}
          {!loading && !error && (
            <>
              {/* Tabs */}
              <div id="crew-staff-tabs" className="mb-6 border-b-2 border-gray-200 overflow-x-auto">
                <div className="flex gap-8 min-w-max pb-px">
                  {!canDeny(session, "7", "7_1") && (
                    <button
                      onClick={() => setActiveTab("crew")}
                      className={`pb-4 px-3 font-bold transition-all relative text-sm group whitespace-nowrap ${activeTab === "crew"
                        ? "text-primary-dark"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>Crew Members</span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${activeTab === "crew"
                            ? "bg-primary-dark text-white"
                            : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {crew.length}
                        </span>
                      </div>
                      {activeTab === "crew" && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-dark rounded-t-full" />
                      )}
                    </button>
                    )}
                    {!denyStaff && (<button
                      onClick={() => setActiveTab("staff")}
                      className={`pb-4 px-3 font-bold transition-all relative text-sm group whitespace-nowrap ${activeTab === "staff"
                        ? "text-primary-dark"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>Staff (Dashboard Access)</span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${activeTab === "staff"
                            ? "bg-primary-dark text-white"
                            : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {staff.length}
                        </span>
                      </div>
                      {activeTab === "staff" && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-dark rounded-t-full" />
                      )}
                    </button>
                    )}
                  </div>
                </div>

                {/* Crew Tab */}
                {activeTab === "crew" && !denyCrew && (
                  <>
                    <CrewFilters
                      filters={crewFilters}
                      onFilterChange={handleCrewFilterChange}
                      positions={crewPositions}
                      roles={[]}
                      showRoleFilter={false}
                    />

                    <div className="mb-4 px-1">
                      <p className="text-sm text-gray-600 font-medium">
                        Showing{" "}
                        <span className="text-primary-dark font-bold">
                          {filteredCrew.length}
                        </span>{" "}
                        of{" "}
                        <span className="text-primary-dark font-bold">
                          {crew.length}
                        </span>{" "}
                        crew members
                      </p>
                    </div>

                    <PeopleTable
                      people={filteredCrew}
                      onPersonClick={handlePersonClick}
                      selectedPersonId={selectedPerson?.id}
                      type="crew"
                      onEdit={handleEditMember}
                      onDelete={handleDeleteMember}
                    />
                  </>
                )}

                {/* Staff Tab */}
                {activeTab === "staff" && !denyStaff && (
                  <>
                    {showRoleLockedHint && (
                      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-3">
                        <Lock size={16} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold">Role-based access is a premium feature.</p>
                          <p className="text-amber-800">{rolesLockedMessage}</p>
                        </div>
                      </div>
                    )}

                    <CrewFilters
                      filters={staffFilters}
                      onFilterChange={handleStaffFilterChange}
                      positions={staffPositions}
                      roles={roles.map((r) => ({ id: r._id, name: r.roleName }))}
                      showRoleFilter={true}
                    />

                    <div className="mb-4 px-1">
                      <p className="text-sm text-gray-600 font-medium">
                        Showing{" "}
                        <span className="text-primary-dark font-bold">
                          {filteredStaff.length}
                        </span>{" "}
                        of{" "}
                        <span className="text-primary-dark font-bold">
                          {staff.length}
                        </span>{" "}
                        staff members
                      </p>
                    </div>

                    <PeopleTable
                      people={filteredStaff}
                      onPersonClick={handlePersonClick}
                      selectedPersonId={selectedPerson?.id}
                      type="staff"
                      onEdit={handleEditMember}
                      onDelete={handleDeleteMember}
                    />
                  </>
                )}

                {/* Sidebar */}
                <CrewSidebar
                  person={selectedPerson}
                  isOpen={sidebarOpen}
                  onClose={handleCloseSidebar}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
                onNotesUpdate={handleUpdateNotesLocal}
                  openedFrom={activeTab}     // 🔥 THIS IS THE KEY
                  crewEdit={editCrew}
                  staffEdit={editStaff}
                  isStaff={selectedPerson?.hasAccess}
                />
              </>
            )}

          {/* Add/Edit Member Modal */}
          <CrewModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditingMember(null);
            }}
            onSave={handleSaveMember}
            roles={roles}
            initialData={editingMember}
            existingEmails={peopleForTable.map(p => p.email).filter(Boolean)}
            userEmail={user?.email || ''}
            staffAccessLocked={Boolean(rolesLockedMessage)}
            staffAccessLockMessage={rolesLockedMessage || "Upgrade to access staff role-based permissions."}
          />
        </div>
      </div>

      </PageGuard>


    </>
  );
};
