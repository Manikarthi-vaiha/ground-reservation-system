import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, MapPin, DollarSign, Info, Image, Wifi, Car, Coffee, Shield, Upload, Trash2 } from 'lucide-react';

const AddGroundModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'cricket',
    location: '',
    description: '',
    facilities: [],
    pricing: {
      weekday: 800,
      weekend: 1000,
      continuous: 900,
      membership: 800
    }
  });
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

  const facilityOptions = [
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'cafe', label: 'Cafe', icon: Coffee },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'equipment', label: 'Equipment Rental', icon: Image },
    { id: 'changing_room', label: 'Changing Room', icon: MapPin },
    { id: 'water', label: 'Water Facility', icon: Coffee },
    { id: 'lighting', label: 'Flood Lights', icon: Shield }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('pricing.')) {
      const pricingField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          [pricingField]: parseInt(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFacilityToggle = (facilityId) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facilityId)
        ? prev.facilities.filter(id => id !== facilityId)
        : [...prev.facilities, facilityId]
    }));
  };

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

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedImages.length < 5) {
      toast.error('Please upload at least 5 images');
      return;
    }

    setLoading(true);

    try {
      // First create the ground
      const groundResponse = await axios.post('/api/merchants/grounds', formData);
      const groundId = groundResponse.data._id;

      // Then upload images
      const formDataWithImages = new FormData();
      selectedImages.forEach((image, index) => {
        formDataWithImages.append('images', image);
      });

      await axios.post(`/api/merchants/grounds/${groundId}/images`, formDataWithImages, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Ground added successfully with images!');
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        name: '',
        type: 'cricket',
        location: '',
        description: '',
        facilities: [],
        pricing: {
          weekday: 800,
          weekend: 1000,
          continuous: 900,
          membership: 800
        }
      });
      setSelectedImages([]);
      setImagePreview([]);
    } catch (error) {
      console.error('Error adding ground:', error);
      toast.error(error.response?.data?.message || 'Failed to add ground');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Ground</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ground Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter ground name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ground Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="cricket">Cricket</option>
                  <option value="football">Football</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter ground location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe your ground, its features, and what makes it special"
              />
            </div>
          </div>

          {/* Facilities */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Wifi className="w-5 h-5 mr-2" />
              Facilities
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {facilityOptions.map((facility) => {
                const Icon = facility.icon;
                return (
                  <button
                    key={facility.id}
                    type="button"
                    onClick={() => handleFacilityToggle(facility.id)}
                    className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center ${
                      formData.facilities.includes(facility.id)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{facility.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Ground Images (Minimum 5 required)
            </h3>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-sm text-gray-600 mb-4">
                  <p>Upload at least 5 images of your ground</p>
                  <p className="text-xs text-gray-500">Maximum 10 images, 5MB each</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors cursor-pointer inline-block"
                >
                  Choose Images
                </label>
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Selected Images ({imagePreview.length}/10)
                  </p>
                  {imagePreview.length < 5 && (
                    <p className="text-sm text-red-600">
                      Need {5 - imagePreview.length} more images
                    </p>
                  )}
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
                        onClick={() => removeImage(index)}
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

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Pricing (₹ per hour)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekday (Mon-Thu)
                </label>
                <input
                  type="number"
                  name="pricing.weekday"
                  value={formData.pricing.weekday}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekend (Fri-Sun)
                </label>
                <input
                  type="number"
                  name="pricing.weekend"
                  value={formData.pricing.weekend}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Continuous (2+ hrs)
                </label>
                <input
                  type="number"
                  name="pricing.continuous"
                  value={formData.pricing.continuous}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership
                </label>
                <input
                  type="number"
                  name="pricing.membership"
                  value={formData.pricing.membership}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Ground...' : 'Add Ground'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGroundModal;
