import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ isOpen, onClose, title, children, className }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn("fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]", className)}
          >
            {/* Handle/Drag Indicator */}
            <div className="flex justify-center pt-3 pb-1 shrink-0" onClick={onClose}>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full cursor-pointer hover:bg-slate-300 transition-colors" />
            </div>

            {/* Header */}
            {title && (
              <div className="px-5 py-3 flex items-center justify-between shrink-0 border-b border-slate-100 mb-2">
                <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
                <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content (Scrollable) */}
            <div className="px-5 pb-8 overflow-y-auto w-full custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
