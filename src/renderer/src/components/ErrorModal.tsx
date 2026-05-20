import { X } from 'lucide-react'
import { motion } from 'framer-motion'

interface ErrorModalProps {
  isOpen: boolean
  error: string
  title: string
  onClose: () => void
}

export default function ErrorModal({ isOpen, error, title, onClose }: ErrorModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-app-card border border-app-border rounded-xl shadow-2xl max-w-md w-full max-h-96 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-app-border">
          <h2 className="text-sm font-semibold text-app-text line-clamp-2">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-white/5 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-red-400/90 leading-relaxed whitespace-pre-wrap break-words font-mono">
            {error}
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-app-border p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-app-accent hover:bg-app-accent-hover text-white font-medium rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}
