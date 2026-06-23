import { useState } from "react"
import { Outlet } from "react-router-dom"
import LeftMenu from "../components/LeftMenu"
import RightMenu from "../components/RightMenu"

function MainLayout() {
  const [selectedDir, setSelectedDir] = useState<string | null>(null)

  return (
    <div className="app flex flex-col md:flex-row min-h-screen bg-black">
      <LeftMenu onSelectDir={setSelectedDir} selectedDir={selectedDir} />

      <main className="content flex-1 p-4 overflow-hidden">
        <Outlet context={{ selectedDir }} />
      </main>

      <RightMenu />
    </div>
  )
}

export default MainLayout
