import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Calculator } from 'lucide-react'
import { Case, CaseFinance, Service, Supplier, Customer, CURRENCY_OPTIONS, supabase } from '../../lib/supabase'
import AutocompleteInput from '../AutocompleteInput'

interface FinanceSectionProps {
  caseData: Case
  onUpdate: (updatedCase: Case) => void
}

export default function FinanceSection({ caseData, onUpdate }: FinanceSectionProps) {
  const [financeEntries, setFinanceEntries] = useState<CaseFinance[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [totals, setTotals] = useState({
    totalPurchase: 0,
    totalSales: 0,
    profit: 0,
    profitMargin: 0
  })

  useEffect(() => {
    loadFinanceData()
    loadMasterData()
  }, [caseData.id])

  useEffect(() => {
    calculateTotals()
  }, [financeEntries])

  const loadFinanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('case_finance')
        .select(`
          *,
          service:services(*),
          supplier:suppliers(*),
          customer:customers(*)
        `)
        .eq('case_id', caseData.id)
        .order('created_at')

      if (error) throw error
      setFinanceEntries(data || [])
    } catch (error) {
      console.error('Error loading finance data:', error)
    }
  }

  const loadMasterData = async () => {
    try {
      const [servicesResult, suppliersResult, customersResult] = await Promise.all([
        supabase.from('services').select('*').order('service_name'),
        supabase.from('suppliers').select('*').order('company_name'),
        supabase.from('customers').select('*').order('company_name')
      ])

      if (servicesResult.error) throw servicesResult.error
      if (suppliersResult.error) throw suppliersResult.error
      if (customersResult.error) throw customersResult.error

      setServices(servicesResult.data || [])
      setSuppliers(suppliersResult.data || [])
      setCustomers(customersResult.data || [])
    } catch (error) {
      console.error('Error loading master data:', error)
    }
  }

  const calculateTotals = () => {
    const totalPurchase = financeEntries.reduce((sum, entry) => sum + (entry.purchase_price * entry.quantity), 0)
    const totalSales = financeEntries.reduce((sum, entry) => sum + (entry.sales_price * entry.quantity), 0)
    const profit = totalSales - totalPurchase
    const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0

    setTotals({ totalPurchase, totalSales, profit, profitMargin })
  }

  const addFinanceEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('case_finance')
        .insert([{
          case_id: caseData.id,
          quantity: 1,
          purchase_price: 0,
          purchase_currency: 'EUR',
          sales_price: 0,
          sales_currency: 'EUR'
        }])
        .select(`
          *,
          service:services(*),
          supplier:suppliers(*),
          customer:customers(*)
        `)
        .single()

      if (error) throw error
      setFinanceEntries(prev => [...prev, data])
    } catch (error) {
      console.error('Error adding finance entry:', error)
    }
  }

  const updateFinanceEntry = async (entryId: string, field: string, value: any) => {
    try {
      const { data, error } = await supabase
        .from('case_finance')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', entryId)
        .select(`
          *,
          service:services(*),
          supplier:suppliers(*),
          customer:customers(*)
        `)
        .single()

      if (error) throw error

      setFinanceEntries(prev => prev.map(entry => 
        entry.id === entryId ? data : entry
      ))
    } catch (error) {
      console.error('Error updating finance entry:', error)
    }
  }

  const deleteFinanceEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('case_finance')
        .delete()
        .eq('id', entryId)

      if (error) throw error
      setFinanceEntries(prev => prev.filter(entry => entry.id !== entryId))
    } catch (error) {
      console.error('Error deleting finance entry:', error)
    }
  }

  const handleServiceSelect = async (entryId: string, value: string, selectedOption?: any) => {
    if (selectedOption) {
      const service = selectedOption.data
      await updateFinanceEntry(entryId, 'service_id', service.id)
      
      // Auto-fill prices if available
      if (service.default_purchase_price) {
        await updateFinanceEntry(entryId, 'purchase_price', service.default_purchase_price)
      }
      if (service.default_sales_price) {
        await updateFinanceEntry(entryId, 'sales_price', service.default_sales_price)
      }
    }
  }

  const serviceOptions = services.map(service => ({
    id: service.id,
    label: service.service_name,
    subtitle: `${service.category} • ${service.unit}`,
    data: service
  }))

  const supplierOptions = suppliers.map(supplier => ({
    id: supplier.id,
    label: supplier.company_name,
    subtitle: `${supplier.category} • ${supplier.supplier_code}`,
    data: supplier
  }))

  const customerOptions = customers.map(customer => ({
    id: customer.id,
    label: customer.company_name,
    subtitle: customer.customer_code,
    data: customer
  }))

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Finance Management</h2>
            <p className="text-gray-600">Cost and revenue tracking</p>
          </div>
          <button
            onClick={addFinanceEntry}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Finance Spreadsheet */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Qty
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Service/Fee
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Additional Text
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Purchase Price
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Currency
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Supplier
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Sales Price
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Currency
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Customer
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {financeEntries.map((entry, index) => (
                <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={entry.quantity}
                      onChange={(e) => updateFinanceEntry(entry.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AutocompleteInput
                      value={entry.service?.service_name || ''}
                      onChange={(value, option) => handleServiceSelect(entry.id, value, option)}
                      options={serviceOptions}
                      placeholder="Select service..."
                      className="text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={entry.additional_text || ''}
                      onChange={(e) => updateFinanceEntry(entry.id, 'additional_text', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Additional info..."
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={entry.purchase_price}
                      onChange={(e) => updateFinanceEntry(entry.id, 'purchase_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={entry.purchase_currency}
                      onChange={(e) => updateFinanceEntry(entry.id, 'purchase_currency', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {CURRENCY_OPTIONS.map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <AutocompleteInput
                      value={entry.supplier?.company_name || ''}
                      onChange={(value, option) => updateFinanceEntry(entry.id, 'supplier_id', option?.id || null)}
                      options={supplierOptions}
                      placeholder="Select supplier..."
                      className="text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={entry.sales_price}
                      onChange={(e) => updateFinanceEntry(entry.id, 'sales_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={entry.sales_currency}
                      onChange={(e) => updateFinanceEntry(entry.id, 'sales_currency', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {CURRENCY_OPTIONS.map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <AutocompleteInput
                      value={entry.customer?.company_name || ''}
                      onChange={(value, option) => updateFinanceEntry(entry.id, 'customer_id', option?.id || null)}
                      options={customerOptions}
                      placeholder="Select customer..."
                      className="text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => deleteFinanceEntry(entry.id)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {financeEntries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No finance entries yet. Click "Add Entry" to start tracking costs and revenue.</p>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-600">Total Purchase Costs</div>
          <div className="text-2xl font-bold text-blue-800">
            €{totals.totalPurchase.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-600">Total Sales Revenue</div>
          <div className="text-2xl font-bold text-green-800">
            €{totals.totalSales.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className={`border rounded-lg p-4 ${
          totals.profit >= 0 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`text-sm font-medium ${
            totals.profit >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            Profit
          </div>
          <div className={`text-2xl font-bold ${
            totals.profit >= 0 ? 'text-emerald-800' : 'text-red-800'
          }`}>
            €{totals.profit.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className={`border rounded-lg p-4 ${
          totals.profitMargin >= 0 
            ? 'bg-purple-50 border-purple-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`text-sm font-medium ${
            totals.profitMargin >= 0 ? 'text-purple-600' : 'text-red-600'
          }`}>
            Profit Margin
          </div>
          <div className={`text-2xl font-bold ${
            totals.profitMargin >= 0 ? 'text-purple-800' : 'text-red-800'
          }`}>
            {totals.profitMargin.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  )
}