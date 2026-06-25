import { useState } from "react"
import { Outlet } from "react-router-dom"
import LeftMenu from "../components/LeftMenu"
import RightMenu from "../components/RightMenu"
import { SettingsModal } from "../components/SettingsModal"
import { useSettings } from "../hooks/useSettings"

export interface SelectedFile {
  name: string
  path: string
  type: string
  pageCount?: number
}

function MainLayout() {
  const [selectedDir, setSelectedDir] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [search, setSearch] = useState("")
  const { settings, update } = useSettings()

  return (
    <div className="app flex flex-col md:flex-row min-h-screen bg-cv-sidebar">
      <LeftMenu
        onSelectDir={setSelectedDir}
        selectedDir={selectedDir}
        search={search}
        onSearch={setSearch}
      />

      <main className="content flex-1 p-4 overflow-hidden">
        <Outlet context={{ selectedDir, setSelectedFile, search }} />
      </main>

      <RightMenu
        selectedFile={selectedFile}
        onOpenSettings={() => setShowSettings(true)}
      />

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={update}
          onClose={() => setShowSettings(false)}
          showDirConfig
        />
      )}
    </div>
  )
}

export default MainLayout
