import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FullScreenGallery } from "./components/FullScreenGallery";
import { getProjectById } from "../../../services/projectService";

/**
 * Standalone page for the full-screen gallery.
 * Route: /project/:projectId/gallery
 * Close → navigate back to /project/:projectId
 */
export const ProjectGalleryPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projectTitle, setProjectTitle] = useState("");

  useEffect(() => {
    if (projectId) {
      getProjectById(projectId)
        .then((p) => setProjectTitle(p?.projectTitle || ""))
        .catch(() => {});
    }
  }, [projectId]);

  const handleClose = () => {
    navigate(`/project/${projectId}`);
  };

  const handleOpenCreateFolder = () => {
    // Navigate back to project and open create folder via state
    navigate(`/project/${projectId}`, { state: { openCreateFolder: true } });
  };

  return (
    <FullScreenGallery
      projectId={projectId}
      projectTitle={projectTitle}
      onClose={handleClose}
      onOpenCreateFolder={handleOpenCreateFolder}
      onFolderChange={() => {}}
    />
  );
};
