import { ChevronLeft } from "lucide-react"

function MainPage() {
  return (
    <div className="w-full h-full bg-[#121212] rounded-lg flex flex-col items-center justify-start">
      <div className="w-full flex items-center gap-2 text-white text-lg font-bold cursor-pointer p-4 rounded-lg">
        <ChevronLeft size={24} />
        {/* <span className="hover:underline">Página Inicial</span> */}
        <span className="ml-auto">logo aqui</span>
      </div>

      <div className="w-full h-full rounded-lg flex flex-col items-center justify-start bg-blue-500"></div>
    </div>
  )
}

export default MainPage
