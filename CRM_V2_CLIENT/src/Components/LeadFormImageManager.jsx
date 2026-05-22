import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { Upload, X, Check, Trash2, Image as ImageIcon, AlertCircle, Database } from 'lucide-react';
import { toast } from 'react-toastify';
import {
    uploadMultipleImages,
    selectImage,
    deleteImage,
    getImages,
} from '../../../services/leadFormImageService';
import { formatFileSize } from '../../../utils/formatUtils';

export const LeadFormImageManager = () => {
    const { refreshUser } = useUser();
    const [headerImages, setHeaderImages] = useState([]);
    const [backgroundImages, setBackgroundImages] = useState([]);
    const [selectedHeader, setSelectedHeader] = useState('');
    const [selectedBackground, setSelectedBackground] = useState('');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [storageInfo, setStorageInfo] = useState(null);

    // Load images on component mount
    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            setLoading(true);
            const response = await getImages('all');

            if (response.success) {
                setHeaderImages(response.data.header?.images || []);
                setBackgroundImages(response.data.background?.images || []);
                setSelectedHeader(response.data.header?.selected || '');
                setSelectedBackground(response.data.background?.selected || '');

                // Add storage info from response
                if (response.storageUsed !== undefined) {
                    setStorageInfo({
                        used: response.storageUsed,
                        remaining: response.storageRemaining,
                    });
                }
            }
        } catch (error) {
            console.error('Load images error:', error);
            toast.error('Failed to load images');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (files, imageType) => {
        if (!files || files.length === 0) return;

        try {
            setUploading(true);
            const response = await uploadMultipleImages(Array.from(files), imageType);

            if (response.success) {
                toast.success(response.message);
                setStorageInfo({
                    used: response.data.storageUsed,
                    remaining: response.data.storageRemaining,
                });

                // Reload images to get updated list
                await loadImages();
                await refreshUser(); // Update global storage stats
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    const handleSelectImage = async (imageUrl, imageType) => {
        try {
            const response = await selectImage(imageUrl, imageType);

            if (response.success) {
                if (imageType === 'header') {
                    setSelectedHeader(imageUrl);
                } else {
                    setSelectedBackground(imageUrl);
                }
                toast.success(`${imageType} image selected`);
            }
        } catch (error) {
            console.error('Select error:', error);
            toast.error('Failed to select image');
        }
    };

    const handleDeleteImage = async (imageUrl, imageType) => {
        if (!window.confirm('Are you sure you want to delete this image?')) {
            return;
        }

        try {
            const response = await deleteImage(imageUrl, imageType);

            if (response.success) {
                toast.success('Image deleted successfully');
                await loadImages();
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete image');
        }
    };

    const ImageSection = ({ title, images, selectedImage, imageType, icon: Icon }) => (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon size={20} className="text-primary-dark" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500">{images.length} image(s) uploaded</p>
                    </div>
                </div>

                <label className="cursor-pointer">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files, imageType)}
                        disabled={uploading}
                    />
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors">
                        <Upload size={18} />
                        <span className="text-sm font-medium">Upload Images</span>
                    </div>
                </label>
            </div>

            {images.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <ImageIcon size={48} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 mb-1">No {imageType} images uploaded yet</p>
                    <p className="text-sm text-gray-500">Upload images to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((imageUrl, index) => (
                        <div
                            key={index}
                            className={`relative group rounded-lg overflow-hidden border-2 transition-all ${selectedImage === imageUrl
                                ? 'border-primary-dark shadow-lg'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {/* Image */}
                            <div
                                className="aspect-video bg-gray-100 cursor-pointer"
                                onClick={() => handleSelectImage(imageUrl, imageType)}
                            >
                                <img
                                    src={imageUrl}
                                    alt={`${imageType} ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Selected Badge */}
                            {selectedImage === imageUrl && (
                                <div className="absolute top-2 left-2 bg-primary-dark text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium">
                                    <Check size={14} />
                                    Active
                                </div>
                            )}

                            {/* Delete Button */}
                            <button
                                onClick={() => handleDeleteImage(imageUrl, imageType)}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Delete image"
                            >
                                <Trash2 size={14} />
                            </button>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-dark"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Storage Info */}
            {storageInfo && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Database size={18} className="text-primary-dark" />
                            <h3 className="text-sm font-semibold text-gray-900">Storage Consumption</h3>
                        </div>
                        <span className="text-[11px] font-bold text-primary-dark bg-primary-dark/5 px-2 py-0.5 rounded-full border border-primary-dark/10">
                            {((storageInfo.used / (storageInfo.used + storageInfo.remaining)) * 100).toFixed(1)}%
                        </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-700 ease-out ${(storageInfo.used / (storageInfo.used + storageInfo.remaining)) * 100 >= 90
                                ? 'bg-red-500'
                                : (storageInfo.used / (storageInfo.used + storageInfo.remaining)) * 100 >= 70
                                    ? 'bg-yellow-500'
                                    : 'bg-primary-dark'
                                }`}
                            style={{ width: `${(storageInfo.used / (storageInfo.used + storageInfo.remaining)) * 100}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-medium text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-dark"></span>
                            Used: {formatFileSize(storageInfo.used)}
                        </span>
                        <span>Total: {formatFileSize(storageInfo.used + storageInfo.remaining)}</span>
                    </div>
                </div>
            )}

            {/* Header Images */}
            <ImageSection
                title="Header Images"
                images={headerImages}
                selectedImage={selectedHeader}
                imageType="header"
                icon={ImageIcon}
            />

            {/* Background Images */}
            <ImageSection
                title="Background Images"
                images={backgroundImages}
                selectedImage={selectedBackground}
                imageType="background"
                icon={ImageIcon}
            />

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">How to use:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Click "Upload Images" to add new header or background images</li>
                    <li>• Click on an image to select it as the active one</li>
                    <li>• Hover over an image and click the trash icon to delete it</li>
                    <li>• The active image will be displayed in your lead form</li>
                    <li>• You can upload multiple images and switch between them anytime</li>
                </ul>
            </div>
        </div>
    );
};
