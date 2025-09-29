import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, Upload, Trash2, Image, Plus } from 'lucide-react';

const GroundImageManager = ({ ground, isOpen, onClose, onSuccess }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + selectedImages.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    setSelectedImages(prev => [...prev, ...validFiles]);

    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePreviewImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedImages.length === 0) {
      toast.error('Please select images to upload');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      selectedImages.forEach((image) => {
        formData.append('images', image);
      });

      await axios.post(`/api/merchants/grounds/${ground._id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Images uploaded successfully!');
      setSelectedImages([]);
      setImagePreview([]);
      onSuccess();
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageIndex) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      await axios.delete(`/api/merchants/grounds/${ground._id}/images/${imageIndex}`);
      toast.success('Image deleted successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(error.response?.data?.message || 'Failed to delete image');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Manage Images - {ground.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Images */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Current Images ({ground.images?.length || 0}/5 minimum)
            </h3>

            {ground.images && ground.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {ground.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Ground ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    {ground.images.length > 5 && (
                      <button
                        onClick={() => handleDeleteImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                      Image {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No images uploaded yet</p>
                <p className="text-sm text-gray-500">Upload at least 5 images to get started</p>
              </div>
            )}
          </div>

          {/* Upload New Images */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Upload New Images
            </h3>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-sm text-gray-600 mb-4">
                  <p>Select images to upload</p>
                  <p className="text-xs text-gray-500">Maximum 10 images, 5MB each</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload-manager"
                />
                <label
                  htmlFor="image-upload-manager"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors cursor-pointer inline-block"
                >
                  Choose Images
                </label>
              </div>
            </div>

            {/* Preview New Images */}
            {imagePreview.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    Selected Images ({imagePreview.length})
                  </p>
                  <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Uploading...' : 'Upload Images'}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePreviewImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroundImageManager;
