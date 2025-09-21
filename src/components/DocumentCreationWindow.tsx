import React, { useState, useEffect } from 'react'
import Draggable from 'react-draggable'
import { X, Minimize2, Maximize2, FileText, Download, Eye } from 'lucide-react'
import { supabase, DocumentTemplate, Case } from '../lib/supabase'

interface DocumentCreationWindowProps {
  onClose: () => void
  caseData: Case
  onDocumentCreated: () => void
}

export default function DocumentCreationWindow({ 
  onClose, 
  caseData,
  onDocumentCreated 
}: DocumentCreationWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [documentContent, setDocumentContent] = useState('')
  const [documentName, setDocumentName] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .order('template_name')

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    setDocumentName(`${template.template_name} - ${caseData.case_number}`)
    
    // Replace placeholders with case data
    let content = template.html_content
    const replacements = {
      case_number: caseData.case_number || '',
      customer_name: caseData.customer?.company_name || '',
      customer_reference: caseData.customer_reference || '',
      cargo_description: caseData.cargo_description || '',
      container_type: caseData.container_type || '',
      container_quantity: caseData.container_quantity?.toString() || '1',
      weight_kg: caseData.weight_kg?.toString() || '',
      loading_port: caseData.loading_port?.port_name || '',
      discharge_port: caseData.discharge_port?.port_name || '',
      vessel_name: caseData.vessel_name || '',
      carrier: caseData.carrier || '',
      current_date: new Date().toLocaleDateString(),
      standard_closing: caseData.standard_closing ? new Date(caseData.standard_closing).toLocaleDateString() : '',
      vwm_closing: caseData.vwm_closing ? new Date(caseData.vwm_closing).toLocaleDateString() : '',
      cy_closing: caseData.cy_closing ? new Date(caseData.cy_closing).toLocaleDateString() : '',
      pickup_date: caseData.pickup_date ? new Date(caseData.pickup_date).toLocaleDateString() : '',
      delivery_date: caseData.delivery_date ? new Date(caseData.delivery_date).toLocaleDateString() : ''
    }

    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, value)
    })

    setDocumentContent(content)
  }

  const handleSaveDocument = async () => {
    if (!selectedTemplate || !documentName.trim()) {
      alert('Please select a template and enter a document name')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('case_documents')
        .insert([{
          case_id: caseData.id,
          document_name: documentName,
          document_type: selectedTemplate.template_type,
          html_content: documentContent
        }])

      if (error) throw error

      onDocumentCreated()
      onClose()
    } catch (error) {
      console.error('Error saving document:', error)
      alert('Error saving document. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([documentContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentName}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <div className="bg-green-600 text-white px-4 py-2 rounded-md shadow-lg cursor-pointer hover:bg-green-700"
             onClick={() => setIsMinimized(false)}>
          <FileText className="w-4 h-4 inline mr-2" />
          Create Document
        </div>
      </div>
    )
  }

  return (
    <Draggable handle=".window-header" bounds="parent">
      <div className={`fixed bg-white border border-gray-300 shadow-2xl z-50 ${
        isMaximized ? 'inset-4' : 'top-24 left-24 w-[1000px] h-[700px]'
      }`}>
        {/* Window Header */}
        <div className="window-header bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 flex items-center justify-between cursor-move">
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            <span className="font-medium">Create Document - {caseData.case_number}</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-green-500 rounded"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 hover:bg-green-500 rounded"
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
          <div className="flex-1 flex">
            {/* Left Panel - Template Selection */}
            <div className="w-1/3 border-r bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Select Template</h3>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-3 rounded-md cursor-pointer border ${
                      selectedTemplate?.id === template.id
                        ? 'bg-blue-100 border-blue-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-800">{template.template_name}</div>
                    <div className="text-sm text-gray-500">{template.template_type}</div>
                  </div>
                ))}
              </div>

              {selectedTemplate && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Name
                  </label>
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter document name"
                  />
                </div>
              )}
            </div>

            {/* Right Panel - Document Content */}
            <div className="flex-1 flex flex-col">
              {selectedTemplate && (
                <>
                  <div className="border-b bg-gray-50 px-4 py-2 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Document Content</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsPreview(!isPreview)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          isPreview 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        {isPreview ? 'Edit' : 'Preview'}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                      >
                        <Download className="w-4 h-4 inline mr-1" />
                        Download
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 p-4">
                    {isPreview ? (
                      <div 
                        className="w-full h-full border border-gray-300 rounded-md overflow-auto bg-white p-4"
                        dangerouslySetInnerHTML={{ __html: documentContent }}
                      />
                    ) : (
                      <textarea
                        value={documentContent}
                        onChange={(e) => setDocumentContent(e.target.value)}
                        className="w-full h-full border border-gray-300 rounded-md p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Document content will appear here..."
                      />
                    )}
                  </div>
                </>
              )}

              {!selectedTemplate && (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Select a template to start creating your document</p>
                  </div>
                </div>
              )}
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
              onClick={handleSaveDocument}
              disabled={isSaving || !selectedTemplate || !documentName.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Document'}
            </button>
          </div>
        </div>
      </div>
    </Draggable>
  )
}