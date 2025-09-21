import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Package, Eye } from 'lucide-react'
import { Case, supabase } from '../lib/supabase'

interface MainApplicationProps {
  onOpenCase: (caseData: Case) => void
}

export default function MainApplication({ onOpenCase }: MainApplicationProps) {
  const [cases, setCases] = useState<Case[]>([])
  const [filteredCases, setFilteredCases] = useState<Case[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCases()
    
    // Listen for case updates
    const handleCaseUpdate = (event: any) => {
      const updatedCase = event.detail
      setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c))
    }

    window.addEventListener('caseUpdated', handleCaseUpdate)
    return () => window.removeEventListener('caseUpdated', handleCaseUpdate)
  }, [])

  useEffect(() => {
    filterCases()
  }, [cases, searchTerm, statusFilter])

  const loadCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          customer:customers(*),
          loading_port:ports!loading_port_id(*),
          discharge_port:ports!discharge_port_id(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCases(data || [])
    } catch (error) {
      console.error('Error loading cases:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterCases = () => {
    let filtered = cases

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(case_ =>
        case_.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.cargo_description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(case_ => case_.status === statusFilter)
    }

    setFilteredCases(filtered)
  }

  const createNewCase = async () => {
    try {
      const caseNumber = `CASE-${Date.now()}`
      const { data, error } = await supabase
        .from('cases')
        .insert([{
          case_number: caseNumber,
          case_type: 'booking',
          direction: 'export',
          status: 'draft'
        }])
        .select(`
          *,
          customer:customers(*),
          loading_port:ports!loading_port_id(*),
          discharge_port:ports!discharge_port_id(*)
        `)
        .single()

      if (error) throw error
      
      setCases(prev => [data, ...prev])
      onOpenCase(data)
    } catch (error) {
      console.error('Error creating case:', error)
      alert('Error creating case. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cases...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Logistics Management</h1>
            </div>
            <button
              onClick={createNewCase}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cases, customers, or cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="on_hold">On Hold</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((case_) => (
            <div
              key={case_.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
              onDoubleClick={() => onOpenCase(case_)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {case_.case_number}
                    </h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(case_.status)}`}>
                      {formatStatus(case_.status)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {case_.case_type?.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {case_.direction?.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {case_.customer && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-600">Customer:</span>
                      <span className="ml-2 text-gray-800">{case_.customer.company_name}</span>
                    </div>
                  )}
                  
                  {case_.cargo_description && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-600">Cargo:</span>
                      <span className="ml-2 text-gray-800">
                        {case_.cargo_description.length > 50 
                          ? `${case_.cargo_description.substring(0, 50)}...`
                          : case_.cargo_description
                        }
                      </span>
                    </div>
                  )}

                  {(case_.loading_port || case_.discharge_port) && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-600">Route:</span>
                      <span className="ml-2 text-gray-800">
                        {case_.loading_port?.port_code || 'TBD'} → {case_.discharge_port?.port_code || 'TBD'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    Created: {new Date(case_.created_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenCase(case_)
                    }}
                    className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Open
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCases.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              {cases.length === 0 ? 'No cases yet' : 'No cases match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {cases.length === 0 
                ? 'Create your first case to get started with logistics management'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {cases.length === 0 && (
              <button
                onClick={createNewCase}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Case
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}