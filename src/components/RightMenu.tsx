import { Settings, History } from "lucide-react"
import Logo from "../static/img/logo-light.png"

function RightMenu() {
  return (
    <div className="min-h-screen w-full md:w-1/4 lg:w-1/5 flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-xs h-50 flex flex-col items-start justify-center p-5 gap-5">
        <img
          src={Logo}
          alt="Logo"
          className="w-[300px] h-[300px] object-contain"
        />
      </div>

      <div className="w-full max-w-xs flex-1 min-h-64 bg-[#121212] rounded-lg p-4">
        <div className="w-full flex items-center gap-2 text-white text-lg font-bold p-2 rounded-lg">
          <History size={24} />
          <span>Histórico de leitura</span>
        </div>
      </div>

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
