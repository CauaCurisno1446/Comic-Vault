import { Routes, Route } from "react-router-dom"
import MainLayout from "../layout/MainLayout"
import MainPage from "../pages/MainPage"

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<MainPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
