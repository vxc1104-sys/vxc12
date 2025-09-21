import React, { useState, useEffect } from 'react'
import { Case, Customer, supabase } from '../../lib/supabase'
import AutocompleteInput from '../AutocompleteInput'

interface OverviewSectionProps {
  caseData: Case
  onUpdate: (updatedCase: Case) => void
}

export default function OverviewSection({ caseData, onUpdate }: OverviewSectionProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState({
    customer_id: caseData.customer_id || '',
    customer_reference: caseData.customer_reference || '',
    cargo_description: caseData.cargo_description || '',
    incoterms: caseData.incoterms || 'FOB',
    payment_terms: caseData.payment_terms || '',
    notes: caseData.notes || ''
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('company_name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
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

  const handleCustomerSelect = async (value: string, selectedOption?: any) => {
    const customerId = selectedOption?.id || ''
    await handleInputChange('customer_id', customerId)
  }

  const handleCreateCustomer = (companyName: string) => {
    // Open customer creation window
    ;(window as any).openCustomerWindow({ company_name: companyName }, false)
  }

  const customerOptions = customers.map(customer => ({
    id: customer.id,
    label: customer.company_name,
    subtitle: `${customer.customer_code} • ${customer.city || 'No city'}`,
    data: customer
  }))

  const selectedCustomer = customers.find(c => c.id === formData.customer_id)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Case Overview</h2>
        <p className="text-gray-600">General information and customer details</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Customer Information */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Customer Information
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer *
          </label>
          <AutocompleteInput
            value={selectedCustomer?.company_name || ''}
            onChange={handleCustomerSelect}
            options={customerOptions}
            placeholder="Search customers..."
            onCreateNew={handleCreateCustomer}
          />
          {selectedCustomer && (
            <div className="mt-2 p-3 bg-blue-50 rounded-md">
              <div className="text-sm text-gray-600">
                <div><strong>Code:</strong> {selectedCustomer.customer_code}</div>
                <div><strong>Contact:</strong> {selectedCustomer.primary_contact_name}</div>
                <div><strong>Email:</strong> {selectedCustomer.primary_contact_email}</div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Reference
          </label>
          <input
            type="text"
            value={formData.customer_reference}
            onChange={(e) => handleInputChange('customer_reference', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Customer's reference number"
          />
        </div>

        {/* Cargo Information */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
            Cargo Information
          </h3>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cargo Description
          </label>
          <textarea
            value={formData.cargo_description}
            onChange={(e) => handleInputChange('cargo_description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the cargo being shipped..."
          />
        </div>

        {/* Terms & Conditions */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
            Terms & Conditions
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Incoterms
          </label>
          <select
            value={formData.incoterms}
            onChange={(e) => handleInputChange('incoterms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="EXW">EXW - Ex Works</option>
            <option value="FCA">FCA - Free Carrier</option>
            <option value="CPT">CPT - Carriage Paid To</option>
            <option value="CIP">CIP - Carriage and Insurance Paid To</option>
            <option value="DAP">DAP - Delivered at Place</option>
            <option value="DPU">DPU - Delivered at Place Unloaded</option>
            <option value="DDP">DDP - Delivered Duty Paid</option>
            <option value="FAS">FAS - Free Alongside Ship</option>
            <option value="FOB">FOB - Free on Board</option>
            <option value="CFR">CFR - Cost and Freight</option>
            <option value="CIF">CIF - Cost, Insurance and Freight</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Terms
          </label>
          <input
            type="text"
            value={formData.payment_terms}
            onChange={(e) => handleInputChange('payment_terms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 30 days net"
          />
        </div>

        {/* Additional Notes */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
            Additional Information
          </h3>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Internal Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Internal notes and comments..."
          />
        </div>
      </div>
    </div>
  )
}