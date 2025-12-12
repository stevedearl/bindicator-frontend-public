import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative max-w-lg w-[90%] rounded-2xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-black/10 dark:ring-white/10 p-5"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

