import React, { useState, useEffect } from 'react'
import Draggable from 'react-draggable'
import { X, Minimize2, Maximize2, Package } from 'lucide-react'
import { Case } from '../lib/supabase'
import OverviewSection from './sections/OverviewSection'
import GoodsSection from './sections/GoodsSection'
import RouteSection from './sections/RouteSection'
import FinanceSection from './sections/FinanceSection'
import DocumentsSection from './sections/DocumentsSection'
import HistorySection from './sections/HistorySection'
import SettingsSection from './sections/SettingsSection'

interface CaseWindowProps {
  caseData: Case
  onClose: () => void
  onUpdate: (updatedCase: Case) => void
}

type Section = 'overview' | 'goods' | 'route' | 'finance' | 'documents' | 'history' | 'settings'

export default function CaseWindow({ caseData, onClose, onUpdate }: CaseWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>('overview')
  const [currentCase, setCurrentCase] = useState<Case>(caseData)

  const sections = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'goods', label: 'Goods', icon: '📦' },
    { id: 'route', label: 'Route', icon: '🚢' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'history', label: 'History', icon: '📜' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  const handleCaseUpdate = (updatedCase: Case) => {
    setCurrentCase(updatedCase)
    onUpdate(updatedCase)
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg cursor-pointer hover:bg-blue-700"
             onClick={() => setIsMinimized(false)}>
          <Package className="w-4 h-4 inline mr-2" />
          {currentCase.case_number}
        </div>
      </div>
    )
  }

  return (
    <Draggable handle=".window-header" bounds="parent">
      <div className={`fixed bg-white border border-gray-300 shadow-2xl z-40 ${
        isMaximized ? 'inset-4' : 'top-16 left-16 w-[1200px] h-[800px]'
      }`}>
        {/* Window Header */}
        <div className="window-header bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 flex items-center justify-between cursor-move">
          <div className="flex items-center">
            <Package className="w-4 h-4 mr-2" />
            <span className="font-medium">Case {currentCase.case_number}</span>
            <span className="ml-2 px-2 py-1 bg-blue-500 rounded-full text-xs">
              {currentCase.status?.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-blue-500 rounded"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 hover:bg-blue-500 rounded"
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
        <div className="flex h-full">
          {/* Left Navigation */}
          <div className="w-64 bg-gray-50 border-r border-gray-200">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Navigation
              </h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as Section)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3 text-lg">{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              {activeSection === 'overview' && (
                <OverviewSection caseData={currentCase} onUpdate={handleCaseUpdate} />
              )}
              {activeSection === 'goods' && (
                <GoodsSection caseData={currentCase} onUpdate={handleCaseUpdate} />
              )}
              {activeSection === 'route' && (
                <RouteSection caseData={currentCase} onUpdate={handleCaseUpdate} />
              )}
              {activeSection === 'finance' && (
                <FinanceSection caseData={currentCase} onUpdate={handleCaseUpdate} />
              )}
              {activeSection === 'documents' && (
                <DocumentsSection caseData={currentCase} onUpdate={handleCaseUpdate} />
              )}
              {activeSection === 'history' && (
                <HistorySection caseData={currentCase} />
              )}
              {activeSection === 'settings' && (
                <SettingsSection caseData={currentCase} onUpdate={handleCaseUpdate} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Draggable>
  )
}