import React, { useState, useEffect } from 'react'
import { Save, Calendar, AlertCircle } from 'lucide-react'
import { Case, STATUS_OPTIONS, supabase } from '../../lib/supabase'

interface SettingsSectionProps {
  caseData: Case
  onUpdate: (updatedCase: Case) => void
}

export default function SettingsSection({ caseData, onUpdate }: SettingsSectionProps) {
  const [formData, setFormData] = useState({
    case_type: caseData.case_type || 'booking',
    status: caseData.status || 'draft',
    pickup_date: caseData.pickup_date || '',
    delivery_date: caseData.delivery_date || '',
    standard_closing: caseData.standard_closing ? caseData.standard_closing.split('T')[0] : '',
    vwm_closing: caseData.vwm_closing ? caseData.vwm_closing.split('T')[0] : '',
    cy_closing: caseData.cy_closing ? caseData.cy_closing.split('T')[0] : '',
    dock_closing_carrier: caseData.dock_closing_carrier ? caseData.dock_closing_carrier.split('T')[0] : '',
    dock_closing_customer: caseData.dock_closing_customer ? caseData.dock_closing_customer.split('T')[0] : '',
    validity_from: caseData.validity_from || '',
    validity_to: caseData.validity_to || ''
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleInputChange = async (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)

    // Special handling for status changes
    if (field === 'status' && value !== caseData.status) {
      await handleStatusChange(value)
    } else {
      // Auto-save other fields
      await saveField(field, value)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setIsSaving(true)
    try {
      // First, record the status change in history
      await supabase
        .from('case_status_history')
        .insert([{
          case_id: caseData.id,
          old_status: caseData.status,
          new_status: newStatus,
          changed_by: 'System User',
          change_reason: 'Status updated via settings'
        }])

      // Then update the case
      const { data, error } = await supabase
        .from('cases')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', caseData.id)
        .select(`
          *,
          customer:customers(*),
          loading_port:ports!loading_port_id(*),
          discharge_port:ports!discharge_port_id(*)
        `)
        .single()

      if (error) throw error
      onUpdate(data)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const saveField = async (field: string, value: string) => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', caseData.id)
        .select(`
          *,
          customer:customers(*),
          loading_port:ports!loading_port_id(*),
          discharge_port:ports!discharge_port_id(*)
        `)
        .single()

      if (error) throw error
      onUpdate(data)
    } catch (error) {
      console.error('Error updating field:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'archived':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Case Settings</h2>
        <p className="text-gray-600">Configure case type, status, and important dates</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Case Configuration */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Case Configuration
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Case Type
          </label>
          <select
            value={formData.case_type}
            onChange={(e) => handleInputChange('case_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="quotation">Quotation</option>
            <option value="booking">Booking</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Status
          </label>
          <div className="relative">
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              disabled={isSaving}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(formData.status)} ${
                isSaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            {isSaving && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Quotation Specific Fields */}
        {formData.case_type === 'quotation' && (
          <>
            <div className="col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                Quotation Validity
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid From
              </label>
              <input
                type="date"
                value={formData.validity_from}
                onChange={(e) => handleInputChange('validity_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.validity_to}
                onChange={(e) => handleInputChange('validity_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {/* Booking Specific Fields */}
        {formData.case_type === 'booking' && (
          <>
            <div className="col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                Important Dates
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Date
              </label>
              <input
                type="date"
                value={formData.pickup_date}
                onChange={(e) => handleInputChange('pickup_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date
              </label>
              <input
                type="date"
                value={formData.delivery_date}
                onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                Closing Dates
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard Closing
              </label>
              <input
                type="date"
                value={formData.standard_closing}
                onChange={(e) => handleInputChange('standard_closing', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VWM Closing
              </label>
              <input
                type="date"
                value={formData.vwm_closing}
                onChange={(e) => handleInputChange('vwm_closing', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CY Closing
              </label>
              <input
                type="date"
                value={formData.cy_closing}
                onChange={(e) => handleInputChange('cy_closing', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dock Closing (Carrier)
              </label>
              <input
                type="date"
                value={formData.dock_closing_carrier}
                onChange={(e) => handleInputChange('dock_closing_carrier', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dock Closing (Customer)
              </label>
              <input
                type="date"
                value={formData.dock_closing_customer}
                onChange={(e) => handleInputChange('dock_closing_customer', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {/* Status Information */}
        <div className="col-span-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">Status Information</h4>
                <p className="text-sm text-blue-700">
                  Status changes are automatically tracked in the history section. 
                  Changing the status will immediately update the case overview and trigger notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}