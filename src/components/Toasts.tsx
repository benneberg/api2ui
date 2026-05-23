import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, CheckCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  details?: string[];
}

interface ToastsProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export function Toasts({ toasts, removeToast }: ToastsProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "pointer-events-auto flex items-start gap-4 p-4 min-w-[300px] max-w-md border-2 shadow-[4px_4px_0_0_#121212] bg-white",
              toast.type === 'error' ? "border-red-500" : 
              toast.type === 'success' ? "border-green-500" : "border-brand-accent text-brand-accent"
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
              {toast.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
              {toast.type === 'info' && <Info size={20} className="text-brand-accent" />}
            </div>
            
            <div className="flex-1">
              <p className={cn(
                "text-sm font-bold uppercase tracking-tight",
                toast.type === 'error' ? "text-red-500" : 
                toast.type === 'success' ? "text-green-500" : "text-brand-accent"
              )}>
                {toast.message}
              </p>
              {toast.details && toast.details.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {toast.details.map((detail, i) => (
                    <li key={i} className="font-mono text-[10px] text-gray-500 flex items-start gap-2">
                      <span className="opacity-50">→</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-brand-ink transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
