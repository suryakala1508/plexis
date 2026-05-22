import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, RotateCw, Square, Circle } from 'lucide-react';
import { createCroppedImage } from '../utils/cropImage';

export const ImageCropModal = ({ image, onSave, onCancel, initialAspectRatio = 1 }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [selectedShape, setSelectedShape] = useState('rect');
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) {
            alert('Please select a crop area first');
            return;
        }

        try {
            setIsProcessing(true);
            const croppedImage = await createCroppedImage(
                image,
                croppedAreaPixels,
                rotation
            );
            onSave(croppedImage);
        } catch (error) {
            console.error('Error cropping image:', error);
            alert('Failed to crop image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />

            {/* Modal */}
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Crop Image</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Adjust your image to perfection</p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={isProcessing}
                        >
                            <X size={18} className="text-gray-600" />
                        </button>
                    </div>

                    {/* Crop Area - Reduced height */}
                    <div className="relative h-[320px] bg-gray-900">
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={1}
                            cropShape={selectedShape}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                            style={{
                                containerStyle: {
                                    backgroundColor: '#111827',
                                },
                                cropAreaStyle: {
                                    border: '2px solid #8B5CF6',
                                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                },
                            }}
                        />
                    </div>

                    {/* Controls */}
                    <div className="px-5 py-4 space-y-4 border-t border-gray-200 bg-white">
                        <div>
                            <label className="block text-[10px] font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                                Crop Options
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setSelectedShape('rect')}
                                    className={`
                                        flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all
                                        ${selectedShape === 'rect'
                                            ? 'border-primary-dark bg-primary-dark/5 text-primary-dark'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                                        }
                                    `}
                                    disabled={isProcessing}
                                >
                                    <Square size={16} />
                                    <span className="text-[10px] font-semibold">Square</span>
                                </button>
                                <button
                                    onClick={() => setSelectedShape('round')}
                                    className={`
                                        flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all
                                        ${selectedShape === 'round'
                                            ? 'border-primary-dark bg-primary-dark/5 text-primary-dark'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                                        }
                                    `}
                                    disabled={isProcessing}
                                >
                                    <Circle size={16} />
                                    <span className="text-[10px] font-semibold">Circle</span>
                                </button>
                                <button
                                    onClick={handleRotate}
                                    className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50 transition-all font-medium"
                                    disabled={isProcessing}
                                >
                                    <RotateCw size={16} />
                                    <span className="text-[10px] font-semibold">Rotate 90°</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 px-5 py-3 bg-gray-50 rounded-b-2xl border-t border-gray-200">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-bold text-sm"
                            disabled={isProcessing}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-all font-bold text-sm shadow-md shadow-primary-dark/20 disabled:opacity-50"
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Processing...' : 'Save & Apply'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

