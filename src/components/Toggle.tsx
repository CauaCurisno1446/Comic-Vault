function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-800">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        {description && (
          <p className="text-gray-500 text-xs mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          value ? "bg-white" : "bg-gray-700"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
            value ? "left-6 bg-black" : "left-1 bg-gray-400"
          }`}
        />
      </button>
    </div>
  )
}

export default Toggle
