import React from 'react';

const SaveToGooglePhotos = ({ imageUrl, clientEmail, className, onClick, children, disabled }) => {
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (disabled) return;
    if (onClick) onClick();
    try {
      // imageUrl can be a single string or an array of strings
      const urlsToProcess = Array.isArray(imageUrl) ? imageUrl : [imageUrl];
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/google-photos/auth-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrls: urlsToProcess,
            galleryUrl: window.location.href, // Current gallery URL to return to
            clientEmail: clientEmail,
          })
        }
      );
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; 
      }
    } catch (error) {
      console.error("Error saving to Google Photos:", error);
    }
  };

  return (
    <button disabled={disabled} onClick={handleSave} className={className}>
      {children || "Google Photos"}
    </button>
  );
};

export default SaveToGooglePhotos;