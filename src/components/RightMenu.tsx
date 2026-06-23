import { Settings } from "lucide-react"

function RightMenu() {
  return (
    <div className="min-h-screen w-full md:w-1/4 lg:w-1/5 flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-xs flex-1 min-h-64 bg-[#121212] rounded-lg"></div>

      <div className="w-full max-w-xs h-20 bg-[#121212] rounded-lg flex flex-col items-start justify-center p-5 gap-5">
        <div className="w-full flex items-center gap-2 text-white text-lg font-bold cursor-pointer transition-colors hover:bg-gray-800 p-2 rounded-lg">
          <Settings size={24} />
          <span>Configurações</span>
        </div>
      </div>
    </div>
  )
}

export default RightMenu
