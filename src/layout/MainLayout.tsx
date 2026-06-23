import { Outlet } from "react-router-dom"
import LeftMenu from "../components/LeftMenu"
import RightMenu from "../components/RightMenu"

function MainLayout() {
  return (
    <div className="app flex flex-col md:flex-row min-h-screen bg-black">
      <LeftMenu />

      <main className="content flex-1 p-4">
        <Outlet />
      </main>

      <RightMenu />
    </div>
  )
}

export default MainLayout
