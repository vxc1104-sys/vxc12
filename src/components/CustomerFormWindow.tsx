import React, { useState, useEffect } from 'react'
import Draggable from 'react-draggable'
import { X, Minimize2, Maximize2, Save, User } from 'lucide-react'
import { supabase, Customer } from '../lib/supabase'

interface CustomerFormWindowProps {
  onClose: () => void
  onSave: (customer: Customer) => void
  initialData?: Partial<Customer>
  isEdit?: boolean
}

export default function CustomerFormWindow({ 
  onClose, 
  onSave, 
  initialData = {},
  isEdit = false 
}: CustomerFormWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    secondary_contact_name: '',
    secondary_contact_email: '',
    secondary_contact_phone: '',
    website: '',
    opening_hours: '',
    internal_notes: '',
    ...initialData
  })
  const [isSaving, setIsSaving] = useState(false)

  const generateCustomerCode = (companyName: string) => {
    return companyName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!formData.company_name.trim()) {
      alert('Company name is required')
      return
    }

    setIsSaving(true)
    try {
      const customerData = {
        ...formData,
        customer_code: generateCustomerCode(formData.company_name),
        updated_at: new Date().toISOString()
      }

      let result
      if (isEdit && initialData.id) {
        result = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', initialData.id)
          .select()
          .single()
      } else {
        result = await supabase
          .from('customers')
          .insert([customerData])
          .select()
          .single()
      }

      if (result.error) throw result.error

      onSave(result.data)
      onClose()
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('Error saving customer. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg cursor-pointer hover:bg-blue-700"
             onClick={() => setIsMinimized(false)}>
          <User className="w-4 h-4 inline mr-2" />
          {isEdit ? 'Edit Customer' : 'New Customer'}
        </div>
      </div>
    )
  }

  return (
    <Draggable handle=".window-header" bounds="parent">
      <div className={`fixed bg-white border border-gray-300 shadow-2xl z-50 ${
        isMaximized ? 'inset-4' : 'top-20 left-20 w-[800px] h-[600px]'
      }`}>
        {/* Window Header */}
        <div className="window-header bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 flex items-center justify-between cursor-move">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            <span className="font-medium">
              {isEdit ? 'Edit Customer' : 'New Customer'}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-blue-500 rounded"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 hover:bg-blue-500 rounded"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-red-500 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Window Content */}
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Company Information */}
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                  Company Information
                </h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.example.com"
                />
              </div>

              {/* Address Information */}
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                  Address Information
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => handleInputChange('address_line1', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.address_line2}
                  onChange={(e) => handleInputChange('address_line2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apartment, suite, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Postal code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Country"
                />
              </div>

              {/* Contact Information */}
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                  Primary Contact
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.primary_contact_name}
                  onChange={(e) => handleInputChange('primary_contact_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contact person name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.primary_contact_phone}
                  onChange={(e) => handleInputChange('primary_contact_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+49-40-123456"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.primary_contact_email}
                  onChange={(e) => handleInputChange('primary_contact_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@company.com"
                />
              </div>

              {/* Additional Information */}
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                  Additional Information
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Hours
                </label>
                <input
                  type="text"
                  value={formData.opening_hours}
                  onChange={(e) => handleInputChange('opening_hours', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mon-Fri 9:00-17:00"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  value={formData.internal_notes}
                  onChange={(e) => handleInputChange('internal_notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Internal notes and comments..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.company_name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </div>
      </div>
    </Draggable>
  )
}