import React, { useState } from 'react'
import { Case, CONTAINER_TYPES, supabase } from '../../lib/supabase'

interface GoodsSectionProps {
  caseData: Case
  onUpdate: (updatedCase: Case) => void
}

export default function GoodsSection({ caseData, onUpdate }: GoodsSectionProps) {
  const [formData, setFormData] = useState({
    container_type: caseData.container_type || '20ft Standard',
    container_quantity: caseData.container_quantity || 1,
    weight_kg: caseData.weight_kg || 0,
    volume_cbm: caseData.volume_cbm || 0,
    cargo_description: caseData.cargo_description || ''
  })

  const handleInputChange = async (field: string, value: string | number) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)

    // Auto-save to database
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
      console.error('Error updating case:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Goods Information</h2>
        <p className="text-gray-600">Container and cargo specifications</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Container Information */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Container Information
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Container Type *
          </label>
          <select
            value={formData.container_type}
            onChange={(e) => handleInputChange('container_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CONTAINER_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity *
          </label>
          <input
            type="number"
            min="1"
            value={formData.container_quantity}
            onChange={(e) => handleInputChange('container_quantity', parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Cargo Specifications */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
            Cargo Specifications
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.weight_kg}
            onChange={(e) => handleInputChange('weight_kg', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Volume (CBM)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.volume_cbm}
            onChange={(e) => handleInputChange('volume_cbm', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Cargo Description
          </label>
          <textarea
            value={formData.cargo_description}
            onChange={(e) => handleInputChange('cargo_description', e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Provide detailed description of the cargo including:
- Product names and specifications
- Packaging details
- Special handling requirements
- Hazardous materials information (if applicable)
- Any other relevant details"
          />
        </div>

        {/* Container Summary */}
        <div className="col-span-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-blue-800 mb-2">Container Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Type:</span>
                <div className="text-gray-800">{formData.container_type}</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Quantity:</span>
                <div className="text-gray-800">{formData.container_quantity} container(s)</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Total Weight:</span>
                <div className="text-gray-800">{formData.weight_kg.toLocaleString()} kg</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}