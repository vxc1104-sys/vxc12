import React, { useState, useEffect } from 'react'
import { Plus, FileText, Download, Eye, Trash2 } from 'lucide-react'
import { Case, CaseDocument, supabase } from '../../lib/supabase'

interface DocumentsSectionProps {
  caseData: Case
  onUpdate: (updatedCase: Case) => void
}

export default function DocumentsSection({ caseData, onUpdate }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<CaseDocument[]>([])
  const [selectedDocument, setSelectedDocument] = useState<CaseDocument | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [caseData.id])

  useEffect(() => {
    // Listen for document creation events
    const handleDocumentCreated = () => {
      loadDocuments()
    }

    window.addEventListener('documentCreated', handleDocumentCreated)
    return () => window.removeEventListener('documentCreated', handleDocumentCreated)
  }, [])

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('case_documents')
        .select('*')
        .eq('case_id', caseData.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const handleCreateDocument = () => {
    // Open document creation window
    ;(window as any).openDocumentWindow(caseData)
  }

  const handleDownloadDocument = (document: CaseDocument) => {
    if (document.html_content) {
      const blob = new Blob([document.html_content], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${document.document_name}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handlePreviewDocument = (document: CaseDocument) => {
    setSelectedDocument(document)
    setIsPreviewOpen(true)
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('case_documents')
        .delete()
        .eq('id', documentId)

      if (error) throw error
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Error deleting document. Please try again.')
    }
  }

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'transport_order':
        return '🚚'
      case 'booking_confirmation':
        return '📋'
      default:
        return '📄'
    }
  }

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'transport_order':
        return 'bg-blue-100 text-blue-800'
      case 'booking_confirmation':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Documents</h2>
            <p className="text-gray-600">Generated documents and files</p>
          </div>
          <button
            onClick={handleCreateDocument}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Document
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((document) => (
          <div
            key={document.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <span className="text-2xl mr-3">
                  {getDocumentTypeIcon(document.document_type)}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {document.document_name}
                  </h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDocumentTypeColor(document.document_type)}`}>
                    {document.document_type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteDocument(document.id)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-gray-500 mb-4">
              Created: {new Date(document.created_at).toLocaleDateString()}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handlePreviewDocument(document)}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </button>
              <button
                onClick={() => handleDownloadDocument(document)}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No documents yet</h3>
          <p className="mb-4">Create your first document using our templates</p>
          <button
            onClick={handleCreateDocument}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Document
          </button>
        </div>
      )}

      {/* Document Preview Modal */}
      {isPreviewOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedDocument.document_name}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadDocument(selectedDocument)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedDocument.html_content || '' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}