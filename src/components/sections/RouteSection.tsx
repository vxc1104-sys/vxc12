import React, { useState, useEffect } from 'react'
import { Case, Port, supabase } from '../../lib/supabase'
import AutocompleteInput from '../AutocompleteInput'

interface RouteSectionProps {
  caseData: Case
  onUpdate: (updatedCase: Case) => void
}

export default function RouteSection({ caseData, onUpdate }: RouteSectionProps) {
  const [ports, setPorts] = useState<Port[]>([])
  const [formData, setFormData] = useState({
    loading_port_id: caseData.loading_port_id || '',
    discharge_port_id: caseData.discharge_port_id || '',
    loading_terminal: caseData.loading_terminal || '',
    discharge_terminal: caseData.discharge_terminal || '',
    vessel_name: caseData.vessel_name || '',
    carrier: caseData.carrier || '',
    voyage_number: caseData.voyage_number || ''
  })

  useEffect(() => {
    loadPorts()
  }, [])

  const loadPorts = async () => {
    try {
      const { data, error } = await supabase
        .from('ports')
        .select('*')
        .order('port_name')

      if (error) throw error
      setPorts(data || [])
    } catch (error) {
      console.error('Error loading ports:', error)
    }
  }

  const handleInputChange = async (field: string, value: string) => {
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

  const handlePortSelect = async (field: string, value: string, selectedOption?: any) => {
    const portId = selectedOption?.id || ''
    await handleInputChange(field, portId)
  }

  const handleCreatePort = async (portName: string) => {
    try {
      // Extract potential port code from name
      const portCode = portName.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 5)
      
      const { data, error } = await supabase
        .from('ports')
        .insert([{
          port_code: portCode,
          port_name: portName,
          city: portName,
          country: 'Unknown'
        }])
        .select()
        .single()

      if (error) throw error
      
      // Reload ports to include the new one
      await loadPorts()
      
      alert(`Port "${portName}" has been created successfully!`)
    } catch (error) {
      console.error('Error creating port:', error)
      alert('Error creating port. Please try again.')
    }
  }

  const portOptions = ports.map(port => ({
    id: port.id,
    label: port.port_name,
    subtitle: `${port.port_code} • ${port.country}`,
    data: port
  }))

  const selectedLoadingPort = ports.find(p => p.id === formData.loading_port_id)
  const selectedDischargePort = ports.find(p => p.id === formData.discharge_port_id)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Route Information</h2>
        <p className="text-gray-600">Ports, terminals, and vessel details</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Port Information */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Port Information
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loading Port *
          </label>
          <AutocompleteInput
            value={selectedLoadingPort?.port_name || ''}
            onChange={(value, option) => handlePortSelect('loading_port_id', value, option)}
            options={portOptions}
            placeholder="Search loading port..."
            onCreateNew={handleCreatePort}
          />
          {selectedLoadingPort && (
            <div className="mt-2 p-3 bg-green-50 rounded-md">
              <div className="text-sm text-gray-600">
                <div><strong>Code:</strong> {selectedLoadingPort.port_code}</div>
                <div><strong>Country:</strong> {selectedLoadingPort.country}</div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discharge Port *
          </label>
          <AutocompleteInput
            value={selectedDischargePort?.port_name || ''}
            onChange={(value, option) => handlePortSelect('discharge_port_id', value, option)}
            options={portOptions}
            placeholder="Search discharge port..."
            onCreateNew={handleCreatePort}
          />
          {selectedDischargePort && (
            <div className="mt-2 p-3 bg-red-50 rounded-md">
              <div className="text-sm text-gray-600">
                <div><strong>Code:</strong> {selectedDischargePort.port_code}</div>
                <div><strong>Country:</strong> {selectedDischargePort.country}</div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loading Terminal
          </label>
          <input
            type="text"
            value={formData.loading_terminal}
            onChange={(e) => handleInputChange('loading_terminal', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Terminal name or code"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discharge Terminal
          </label>
          <input
            type="text"
            value={formData.discharge_terminal}
            onChange={(e) => handleInputChange('discharge_terminal', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Terminal name or code"
          />
        </div>

        {/* Vessel Information */}
        {caseData.case_type === 'booking' && (
          <>
            <div className="col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                Vessel Information
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vessel Name
              </label>
              <input
                type="text"
                value={formData.vessel_name}
                onChange={(e) => handleInputChange('vessel_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter vessel name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carrier
              </label>
              <input
                type="text"
                value={formData.carrier}
                onChange={(e) => handleInputChange('carrier', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Shipping line/carrier"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voyage Number
              </label>
              <input
                type="text"
                value={formData.voyage_number}
                onChange={(e) => handleInputChange('voyage_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Voyage/rotation number"
              />
            </div>
          </>
        )}

        {/* Route Summary */}
        <div className="col-span-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-blue-800 mb-3">Route Summary</h4>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800">
                  {selectedLoadingPort?.port_name || 'Loading Port'}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedLoadingPort?.port_code || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  {formData.loading_terminal && `Terminal: ${formData.loading_terminal}`}
                </div>
              </div>
              
              <div className="flex-1 mx-4">
                <div className="border-t-2 border-blue-300 relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                    🚢 {formData.vessel_name || 'Vessel TBD'}
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800">
                  {selectedDischargePort?.port_name || 'Discharge Port'}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedDischargePort?.port_code || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  {formData.discharge_terminal && `Terminal: ${formData.discharge_terminal}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}