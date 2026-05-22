import React, { useState, useEffect, useRef } from 'react';
import { Upload, Check, Trash2, Loader, Monitor, Smartphone, MoreVertical } from 'lucide-react';
import { Success } from './Success';
import { Error as ErrorMessage } from './Error';
import { normalizeUrl } from '../utils/formatUtils';
import {
    uploadHeaderImages,
    uploadBackgroundImages,
} from '../services/imageUploadService';
import {
    selectImage,
    deleteImage,
    getImages,
} from '../services/leadFormImageService';

/**
 * Compact image selector for ToolsPanel
 * Shows uploaded images as thumbnails and allows selection
 */
export const ImageSelector = ({ imageType, selectedImage, selectedImageMobile, onSelect }) => {
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [openMenuFor, setOpenMenuFor] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuFor(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        loadImages();
    }, [imageType]);

    const loadImages = async () => {
        try {
            setLoading(true);
            const response = await getImages(imageType);

            if (response.success) {
                const imageData = response.data[imageType];
                setImages(imageData?.images || []);

                // Update parent with selected image
                if (imageData?.selected && imageData.selected !== selectedImage) {
                    onSelect(imageData.selected, 'desktop');
                }
                if (imageType === 'header' && imageData?.selectedMobile && imageData.selectedMobile !== selectedImageMobile) {
                    onSelect(imageData.selectedMobile, 'mobile');
                }
            }
        } catch (error) {
            console.error('Load images error:', error);
            setErrorMessage('Failed to load images');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (files) => {
        if (!files || files.length === 0) return;

        try {
            setUploading(true);
            let response;
            if (imageType === 'header') {
                response = await uploadHeaderImages(Array.from(files));
            } else if (imageType === 'background') {
                response = await uploadBackgroundImages(Array.from(files));
            } else {
                // Fallback for other types if any
                throw new Error(`Unsupported image type for FastAPI: ${imageType}`);
            }

            if (response.success) {
                setSuccessMessage(`${files.length} image(s) uploaded successfully`);
                await loadImages();
            }
        } catch (error) {
            console.error('Upload error:', error);
            setErrorMessage(error.message || 'Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    const handleSelect = async (imageUrl, deviceType = 'desktop') => {
        try {
            if (imageUrl === '') {
                if (!selectedImage && (imageType !== 'header' || !selectedImageMobile)) return;
                await selectImage('', imageType, 'desktop');
                onSelect('', 'desktop');
                if (imageType === 'header') {
                    await selectImage('', imageType, 'mobile');
                    onSelect('', 'mobile');
                }
                setSuccessMessage('Image removed');
                return;
            }

            if (imageType === 'header') {
                await selectImage(imageUrl, imageType, deviceType);
                onSelect(imageUrl, deviceType);
                setSuccessMessage(`Set as ${deviceType} image`);
            } else {
                if (imageUrl === selectedImage) {
                    await selectImage('', imageType);
                    onSelect('');
                    setSuccessMessage('Image deselected');
                } else {
                    await selectImage(imageUrl, imageType);
                    onSelect(imageUrl);
                    setSuccessMessage('Image selected');
                }
            }
            setOpenMenuFor(null);
        } catch (error) {
            console.error('Select error:', error);
            setErrorMessage('Failed to update selection');
        }
    };

    const handleDelete = async (imageUrl, e) => {
        e.stopPropagation();

        try {
            await deleteImage(imageUrl, imageType);
            setSuccessMessage('Image deleted successfully');

            // If the deleted image was selected, clear the selection
            if (imageUrl === selectedImage) {
                onSelect('');
            }

            await loadImages();
        } catch (error) {
            console.error('Delete error:', error);
            setErrorMessage('Failed to delete image');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader size={20} className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <>
            {successMessage && (
                <Success onClose={() => setSuccessMessage(null)} autoClose={true} makeDarker={true}>
                    {successMessage}
                </Success>
            )}
            {errorMessage && (
                <ErrorMessage onClose={() => setErrorMessage(null)} autoClose={true} makeDarker={true}>
                    {errorMessage}
                </ErrorMessage>
            )}

            <div className="space-y-3">
                {/* Upload Button */}
                <label className="block">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleUpload(e.target.files)}
                        className="hidden"
                        disabled={uploading}
                    />
                    <div className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-dark hover:bg-gray-50 cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-medium text-gray-600">
                        {uploading ? (
                            <>
                                <Loader size={14} className="animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload size={14} />
                                Upload Images
                            </>
                        )}
                    </div>
                </label>

                {/* Image Grid — None tile is always visible */}
                <div className="grid grid-cols-3 gap-2">
                    {/* None tile — clears the selection */}
                    <div
                        onClick={() => handleSelect('')}
                        title="Remove image"
                        className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex flex-col items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 ${!selectedImage
                            ? 'border-primary-dark shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        {/* ✕ icon */}
                        <span className="text-gray-400 text-xl leading-none">✕</span>
                        <span className="text-[10px] font-medium text-gray-500">None</span>

                        {/* Active badge when no image selected */}
                        {(!selectedImage && (imageType !== 'header' || !selectedImageMobile)) && (
                            <div className="absolute top-1 left-1 bg-primary-dark text-white px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5">
                                <Check size={10} />
                                Active
                            </div>
                        )}
                    </div>

                    {/* Uploaded images */}
                    {images.map((imageUrl, index) => (
                        /* Outer wrapper — no overflow-hidden so the dropdown can escape */
                        <div
                            key={index}
                            className={`relative aspect-video rounded-lg border-2 transition-all group cursor-pointer ${
                                (selectedImage === imageUrl || selectedImageMobile === imageUrl)
                                ? 'border-primary-dark shadow-md'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            ref={openMenuFor === imageUrl ? menuRef : null}
                        >
                            {/* Inner image crop container */}
                            <div
                                className="absolute inset-0 rounded-lg overflow-hidden"
                                onClick={() => imageType !== 'header' && handleSelect(imageUrl)}
                            >
                                <img
                                    src={normalizeUrl(imageUrl)}
                                    alt={`${imageType} ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Selected Badges — inside crop area but pointer-events none */}
                            <div className="absolute top-1 left-1 flex flex-col gap-1 z-10 pointer-events-none">
                                {selectedImage === imageUrl && (
                                    <div className="bg-primary-dark shadow-sm border border-white/20 text-white px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5">
                                        <Monitor size={10} /> {imageType === 'header' ? 'Desktop' : 'Active'}
                                    </div>
                                )}
                                {imageType === 'header' && selectedImageMobile === imageUrl && (
                                    <div className="bg-blue-600 shadow-sm border border-white/20 text-white px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5">
                                        <Smartphone size={10} /> Mobile
                                    </div>
                                )}
                            </div>

                            {/* 3-dot Menu — on outer wrapper so dropdown is never clipped */}
                            <div className="absolute top-1 right-1 z-20">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setOpenMenuFor(openMenuFor === imageUrl ? null : imageUrl); }}
                                    className="bg-black/50 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                >
                                    <MoreVertical size={12} />
                                </button>

                                {openMenuFor === imageUrl && (
                                    <div className="absolute top-6 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-32 z-30">
                                        {imageType === 'header' && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSelect(imageUrl, 'desktop'); }}
                                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                                                >
                                                    <Monitor size={11} /> Set as Desktop
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSelect(imageUrl, 'mobile'); }}
                                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                                                >
                                                    <Smartphone size={11} /> Set as Mobile
                                                </button>
                                                <div className="border-t border-gray-100 my-1" />
                                            </>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(imageUrl, e); setOpenMenuFor(null); }}
                                            className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                                        >
                                            <Trash2 size={11} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Hint when no images uploaded yet */}
                {images.length === 0 && (
                    <p className="text-center text-[10px] text-gray-400 mt-1">
                        Upload images above to set a {imageType === 'header' ? 'banner' : 'background'}
                    </p>
                )}
            </div>
        </>
    );
};
