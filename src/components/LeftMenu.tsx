import { Home, Search, Book, Plus } from "lucide-react"

function LeftMenu() {
  return (
    <div className="min-h-screen w-full md:w-1/4 lg:w-1/5 flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-xs h-40 bg-[#121212] rounded-lg flex flex-col items-start justify-center p-5 gap-5">
        <div className="w-full flex items-center gap-2 text-white text-lg font-bold cursor-pointer transition-colors hover:bg-gray-800 p-2 rounded-lg">
          <Home size={24} />
          <span>Página Inicial</span>
        </div>

        <div className="w-full flex items-center gap-2 text-white text-lg font-bold cursor-pointer transition-colors hover:bg-gray-800 p-2 rounded-lg">
          <Search size={24} />
          <span>Pesquisar</span>
        </div>
      </div>

      <div className="w-full max-w-xs flex-1 min-h-64 bg-[#121212] rounded-lg">
        <div className="w-full flex items-center p-5 gap-2 text-white text-lg font-bold">
          <Book size={24} />
          <span>Biblioteca</span>
          <span className="ml-auto">
            <div className="text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-800 cursor-pointer transition-colors">
              <Plus size={24} />
            </div>
          </span>
        </div>
      </div>
    </div>
  )
}

export default LeftMenu
