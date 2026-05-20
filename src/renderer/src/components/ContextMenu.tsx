import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface ContextMenuOption {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  className?: string
  divider?: boolean
}

interface ContextMenuProps {
  isOpen: boolean
  x: number
  y: number
  options: ContextMenuOption[]
  onClose: () => void
}

export default function ContextMenu({ isOpen, x, y, options, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50 bg-app-card border border-app-border rounded-lg shadow-lg overflow-hidden"
          style={{
            left: `${x}px`,
            top: `${y}px`,
          }}
        >
          {options.map((option, idx) => (
            <div key={idx}>
              {option.divider && <div className="h-px bg-app-border my-1" />}
              <button
                onClick={() => {
                  option.onClick()
                  onClose()
                }}
                className={`w-full px-3 py-2 text-sm flex items-center gap-2 text-left hover:bg-app-accent/10 transition-colors ${
                  option.className || 'text-app-text'
                }`}
              >
                {option.icon && <span className="shrink-0">{option.icon}</span>}
                <span>{option.label}</span>
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
