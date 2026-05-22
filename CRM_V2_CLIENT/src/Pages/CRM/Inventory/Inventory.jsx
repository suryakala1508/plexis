import React, { useState, useEffect, useMemo, useRef } from "react";
import { InventoryTable } from "./InventoryTable";
import { InventoryFilters } from "./InventoryFilters";
import { InventorySidebar } from "./InventorySidebar";
import { InventoryModal } from "./InventoryModal";
import { TableSkeleton } from "../../../Components/Loading";
import {
  getInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "../../../services/inventoryService";
import { useUser } from "../../../contexts/UserContext";
import ReactDOM from "react-dom/client";
import { Success } from "../../../Components/Success";
import { Error } from "../../../Components/Error";
import { TourGuide } from "../../../Components/TourGuide/TourGuide";

import { inventoryTourSteps } from "../../../Components/TourGuide/steps/inventoryTourSteps";
import { PageGuard, PermissionGate } from "@/Pages/utils/permissions";

/**
 * Inventory Main Component
 * Manages inventory items with table view, filters, and detailed sidebar
 * Designed for studio owners to track equipment and supplies
 */
export const Inventory = () => {
  // Get user from context
  const { user } = useUser();
  const startTourRef = useRef(null);

  const isCompletedByDate = d =>
    d && !isNaN(new Date(d)) &&
    new Date(d) < new Date(new Date().setHours(0, 0, 0, 0));


  // State management
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [itemToEdit, setItemToEdit] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    availability: "all",
  });

  // Fetch inventory items on mount - single API call
  useEffect(() => {
    fetchInventoryItems();
  }, []);

  // Transform backend data to frontend format
  const transformItemForFrontend = (item) => {
    // Build detailed assignments - show ALL assignments regardless of project status
    // Equipment will only be removed when explicitly released via the "Release" button
    const assignedProjects = Array.isArray(item.assignedTo)
      ? item.assignedTo
        .filter((a) => a && a.projectId)
        .map((assignment) => ({
          projectId:
            assignment.projectId?._id?.toString() ||
            assignment.projectId?.toString() ||
            "",
          projectTitle:
            assignment.projectId?.projectTitle || "Untitled Project",
          projectStatus:
            assignment.projectId?.projectStatus || "Unknown",
          quantity: assignment.quantity || 0,
          assignedFrom: assignment.assignedFrom || null,
          assignedTo: assignment.assignedTo || null,
        }))
      : [];

    const totalAssignedQuantity = assignedProjects.reduce(
      (sum, p) => sum + (p.quantity || 0),
      0,
    );

    // Derive available count from active assignments to "relieve" completed events
    const derivedAvailableCount = Math.max(
      0,
      (Number(item.quantity) || 0) - totalAssignedQuantity,
    );

    // Compact assignment summary string (still used for search/fallback)
    let assignmentInfo = null;
    if (assignedProjects.length > 0) {
      const projectNames = assignedProjects
        .map((p) => p.projectTitle)
        .join(", ");
      assignmentInfo = `${assignedProjects.length} project${assignedProjects.length === 1 ? "" : "s"
        } (${projectNames})`;
    }

    // Normalize category: trim and capitalize (e.g., "camera" -> "Camera")
    const rawCategory = item.category || 'Uncategorized';
    const normalizedCategory = rawCategory.trim().charAt(0).toUpperCase() + rawCategory.trim().slice(1).toLowerCase();

    return {
      id: item._id,
      name: item.itemName,
      category: normalizedCategory,
      description: item.itemDescription || "",

      quantity: item.quantity,
      availableCount:
        typeof item.available === "number" ? item.available : derivedAvailableCount,
      assignedTo: assignmentInfo,
      assignedProjects,
      totalAssignedQuantity,
      addedDate: item.createdAt
        ? new Date(item.createdAt).toLocaleString()
        : "",
      notes: item.notes || "",
      _original: item, // Keep original for updates and validation
    };
  };

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      const items = await getInventoryItems();
      const transformedItems = items.map(transformItemForFrontend);
      setItems(transformedItems);
      setLoading(false);
    } catch (err) {
      setError("Failed to load inventory items. Please try again later.");
      setLoading(false);
      console.error("Error fetching inventory:", err);
    }
  };

  // Filter items locally (no API call needed)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter - only by item name
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        !filters.search ||
        item.name?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory =
        !filters.category || item.category === filters.category;

      // Availability filter
      const matchesAvailability =
        filters.availability === "all" ||
        (filters.availability === "available" && item.availableCount > 0) ||
        (filters.availability === "unavailable" && item.availableCount === 0);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [items, filters]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(items.map((item) => item.category))];
    // Ensure 'Uncategorized' and custom categories are included and sorted
    return uniqueCategories.filter(Boolean).sort();
  }, [items]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    if (filterType === "reset") {
      setFilters({
        search: "",
        category: "",
        availability: "all",
      });
    } else {
      setFilters((prev) => ({
        ...prev,
        [filterType]: value,
      }));
    }
  };

  // Handle item click to open sidebar
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setSidebarOpen(true);
  };

  // Handle sidebar close
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    // Small delay before clearing selection for smooth animation
    setTimeout(() => setSelectedItem(null), 300);
  };

  // Handle notes update
  const handleUpdateNotes = async (itemId, notes) => {
    try {
      await updateInventoryItem(itemId, { notes });

      // Update local state
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, notes } : item,
        ),
      );

      // Update selected item if it's the one being edited
      if (selectedItem?.id === itemId) {
        setSelectedItem((prev) => ({ ...prev, notes }));
      }
    } catch (err) {
      console.error("Error updating notes:", err);
      throw err;
    }
  };

  // Handle Edit Item (open modal)
  const handleEditItem = (item) => {
    setItemToEdit(item);
    setModalOpen(true);
  };

  // Handle Delete Item
  const handleDeleteItem = async (item) => {
    try {
      await deleteInventoryItem(item.id);
      setItems((prevItems) => prevItems.filter((i) => i.id !== item.id));
      if (selectedItem?.id === item.id) {
        setSidebarOpen(false);
        setSelectedItem(null);
      }

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
          {item.name} has been removed from your inventory
        </Success>,
      );
    } catch (err) {
      console.error("Error deleting item:", err);

      // Show error toast
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
          Unable to remove {item.name}. Please try again.
        </Error>,
      );

      throw err; // Re-throw so ConfirmDialog can handle it
    }
  };

  // Handle add/update item
  const handleSaveItem = async (itemData) => {
    try {
      const isEdit = !!itemToEdit;

      // Transform frontend format to backend format
      const backendPayload = {
        itemName: itemData.name,
        itemDescription: itemData.description,
        category: itemData.category,
        quantity: itemData.quantity,
        notes: itemData.notes || "",
      };

      if (isEdit) {
        // Update existing item
        const updatedResponse = await updateInventoryItem(
          itemToEdit.id,
          backendPayload,
        );
        const updatedItem = updatedResponse.data || updatedResponse;
        const transformedItem = transformItemForFrontend(updatedItem);

        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === itemToEdit.id ? transformedItem : item,
          ),
        );
      } else {
        // Add new item
        const savedResponse = await addInventoryItem(backendPayload);
        const savedItem = savedResponse.data || savedResponse;
        const transformedItem = transformItemForFrontend(savedItem);
        setItems((prevItems) => [transformedItem, ...prevItems]);
      }

      // Show success toast
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
          {itemData.name} has been{" "}
          {isEdit ? "updated in your inventory" : "added to your inventory"}
        </Success>,
      );
    } catch (err) {
      console.error("Error saving item:", err);

      // Show error toast
      const errorDiv = document.createElement("div");
      document.body.appendChild(errorDiv);

      const errorRoot = ReactDOM.createRoot(errorDiv);
      errorRoot.render(
        <Error
          title="Save Failed"
          variant="error"
          makeDarker={true}
          autoClose={false}
          onClose={() => {
            errorRoot.unmount();
            document.body.removeChild(errorDiv);
          }}
        >
          Unable to save this item. Please check the details and try again.
        </Error>,
      );

      throw err;
    }
  };

  return (
    <PageGuard page="8">
      <div className="p-6 lg:pl-4">
        {/* Tour Guide Component */}
        <TourGuide
          steps={inventoryTourSteps}
          tourKey="inventory-tour"
          autoStart={false}
          onStartTour={(startFn) => { startTourRef.current = startFn; }}
        />

        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1
                id="inventory-page-header"
                className="text-2xl font-bold text-primary-dark mb-1"
              >
                Inventory
              </h1>
              <p className="text-sm text-gray-600">
                Track and manage your studio equipment and supplies
              </p>
            </div>
            <PermissionGate page="8" component="8_1" action="edit">
              <button
                id="add-item-button"
                onClick={() => setModalOpen(true)}
                className="bg-primary-dark text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary transition-all flex items-center gap-2 shadow-sm text-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Item
              </button>
            </PermissionGate>
          </div>

          {/* Loading State */}
          {loading && <TableSkeleton rows={8} columns={5} />}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={fetchInventoryItems}
                className="mt-2 text-primary-dark hover:text-primary font-medium text-sm"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Main Content */}
          {!loading && !error && (
            <>
              {/* Filters */}
              <InventoryFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                categories={categories}
              />

              {/* Results Count */}
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold">{filteredItems.length}</span> of{" "}
                  <span className="font-semibold">{items.length}</span> items
                </p>
              </div>

              {/* Table */}
              <InventoryTable
                items={filteredItems}
                onItemClick={handleItemClick}
                selectedItemId={selectedItem?.id}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />

              {/* Sidebar */}
              <InventorySidebar
                item={selectedItem}
                isOpen={sidebarOpen}
                onClose={handleCloseSidebar}
                onUpdateNotes={handleUpdateNotes}
              />
            </>
          )}

          {/* Add/Edit Item Modal */}
          <InventoryModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setItemToEdit(null); // Reset edit state on close
            }}
            onSave={handleSaveItem}
            itemToEdit={itemToEdit}
          />
        </div>
      </div>
    </PageGuard>
  );
};