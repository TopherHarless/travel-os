export default function Header({ title, onBack, action }) {
  return (
    <header className="sticky top-0 bg-white border-b border-[#E5E7EB] z-40">
      <div className="flex items-center gap-3 px-4 lg:px-8 h-14 max-w-[1100px] mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="text-[#1B4332] font-medium text-sm flex items-center gap-1 flex-none"
          >
            ‹ Back
          </button>
        )}
        <h1 className="flex-1 text-[15px] font-semibold text-[#2D2D2D] truncate">
          {title}
        </h1>
        {action && action}
      </div>
    </header>
  )
}
