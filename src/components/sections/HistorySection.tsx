import React, { useState, useEffect } from 'react'
import { Clock, User, FileText } from 'lucide-react'
import { Case, CaseStatusHistory, supabase } from '../../lib/supabase'

interface HistorySectionProps {
  caseData: Case
}

export default function HistorySection({ caseData }: HistorySectionProps) {
  const [history, setHistory] = useState<CaseStatusHistory[]>([])

  useEffect(() => {
    loadHistory()
  }, [caseData.id])

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('case_status_history')
        .select('*')
        .eq('case_id', caseData.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Change History</h2>
        <p className="text-gray-600">Track all changes and status updates</p>
      </div>

      <div className="space-y-4">
        {history.length > 0 ? (
          history.map((entry, index) => (
            <div
              key={entry.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-800">
                        Status Changed
                      </span>
                      {entry.old_status && (
                        <>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.old_status)}`}>
                            {formatStatus(entry.old_status)}
                          </span>
                          <span className="text-gray-400">→</span>
                        </>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.new_status)}`}>
                        {formatStatus(entry.new_status)}
                      </span>
                    </div>
                    
                    {entry.change_reason && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Reason:</strong> {entry.change_reason}
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(entry.created_at).toLocaleString()}
                      </div>
                      {entry.changed_by && (
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {entry.changed_by}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No history yet</h3>
            <p>Changes and status updates will appear here</p>
          </div>
        )}
      </div>

      {/* Current Status Summary */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Current Status</h3>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(caseData.status)}`}>
            {formatStatus(caseData.status)}
          </span>
          <span className="text-sm text-blue-600">
            Last updated: {new Date(caseData.updated_at).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}