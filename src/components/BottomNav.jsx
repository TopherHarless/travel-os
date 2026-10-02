export default function BottomNav({ currentView, setView }) {
  const items = [
    { id: 'home',      icon: '🏠', label: 'Home' },
    { id: 'new-trip',  icon: '✈️', label: 'New Trip' },
    { id: 'inventory', icon: '📦', label: 'Inventory' },
    { id: 'templates', icon: '📋', label: 'Templates' },
    { id: 'settings',  icon: '⚙️', label: 'Settings' },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#E5E7EB] z-50">
      <div className="flex">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
              currentView === item.id
                ? 'text-[#1B4332]'
                : 'text-[#6B7280]'
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
