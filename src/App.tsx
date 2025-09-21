import React from 'react'
import WindowManager from './components/WindowManager'
import MainApplication from './components/MainApplication'
import { Case } from './lib/supabase'

function App() {
  const handleOpenCase = (caseData: Case) => {
    // Use the global window management function
    ;(window as any).openCaseWindow(caseData)
  }

  return (
    <WindowManager>
      <MainApplication onOpenCase={handleOpenCase} />
    </WindowManager>
  )
}

export default App