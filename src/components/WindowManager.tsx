import React, { useState, useEffect } from 'react'
import CaseWindow from './CaseWindow'
import CustomerFormWindow from './CustomerFormWindow'
import DocumentCreationWindow from './DocumentCreationWindow'
import { Case, Customer } from '../lib/supabase'

interface WindowState {
  id: string
  type: 'case' | 'customer' | 'document'
  data: any
  isMinimized?: boolean
}

interface WindowManagerProps {
  children: React.ReactNode
}

export default function WindowManager({ children }: WindowManagerProps) {
  const [windows, setWindows] = useState<WindowState[]>([])

  // Global window management functions
  useEffect(() => {
    // Make window management functions globally available
    (window as any).openCaseWindow = (caseData: Case) => {
      const existingWindow = windows.find(w => w.type === 'case' && w.data.id === caseData.id)
      if (existingWindow) {
        // Bring existing window to front
        setWindows(prev => [
          ...prev.filter(w => w.id !== existingWindow.id),
          { ...existingWindow, isMinimized: false }
        ])
        return
      }

      const newWindow: WindowState = {
        id: `case-${caseData.id}-${Date.now()}`,
        type: 'case',
        data: caseData
      }
      setWindows(prev => [...prev, newWindow])
    }

    ;(window as any).openCustomerWindow = (customerData?: Partial<Customer>, isEdit = false) => {
      const newWindow: WindowState = {
        id: `customer-${Date.now()}`,
        type: 'customer',
        data: { customerData, isEdit }
      }
      setWindows(prev => [...prev, newWindow])
    }

    ;(window as any).openDocumentWindow = (caseData: Case) => {
      const newWindow: WindowState = {
        id: `document-${caseData.id}-${Date.now()}`,
        type: 'document',
        data: caseData
      }
      setWindows(prev => [...prev, newWindow])
    }
  }, [windows])

  const closeWindow = (windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId))
  }

  const handleCaseUpdate = (updatedCase: Case) => {
    // Update case data in all relevant windows
    setWindows(prev => prev.map(w => {
      if (w.type === 'case' && w.data.id === updatedCase.id) {
        return { ...w, data: updatedCase }
      }
      return w
    }))

    // Trigger refresh of main application
    window.dispatchEvent(new CustomEvent('caseUpdated', { detail: updatedCase }))
  }

  const handleCustomerSave = (customer: Customer) => {
    // Trigger refresh of main application
    window.dispatchEvent(new CustomEvent('customerUpdated', { detail: customer }))
  }

  const handleDocumentCreated = () => {
    // Trigger refresh of main application
    window.dispatchEvent(new CustomEvent('documentCreated'))
  }

  return (
    <>
      {children}
      
      {/* Render all open windows */}
      {windows.map((window) => {
        switch (window.type) {
          case 'case':
            return (
              <CaseWindow
                key={window.id}
                caseData={window.data}
                onClose={() => closeWindow(window.id)}
                onUpdate={handleCaseUpdate}
              />
            )
          case 'customer':
            return (
              <CustomerFormWindow
                key={window.id}
                onClose={() => closeWindow(window.id)}
                onSave={handleCustomerSave}
                initialData={window.data.customerData}
                isEdit={window.data.isEdit}
              />
            )
          case 'document':
            return (
              <DocumentCreationWindow
                key={window.id}
                onClose={() => closeWindow(window.id)}
                caseData={window.data}
                onDocumentCreated={handleDocumentCreated}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}