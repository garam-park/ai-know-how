import { createContext, useContext, useState, useCallback, ReactNode, JSX } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);
let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }): JSX.Element | null {
  if (toasts.length === 0) return null;

  const colors: Record<ToastType, { bg: string; border: string; text: string }> = {
    success: { bg: '#f0fff4', border: '#38a169', text: '#22543d' },
    error: { bg: '#fff5f5', border: '#e53e3e', text: '#742a2a' },
    warning: { bg: '#fffff0', border: '#d69e2e', text: '#744210' },
    info: { bg: '#ebf8ff', border: '#3182ce', text: '#2a4365' },
  };

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map((toast) => {
        const color = colors[toast.type];
        return (
          <div
            key={toast.id}
            onClick={() => onRemove(toast.id)}
            style={{
              padding: '12px 20px',
              background: color.bg,
              color: color.text,
              borderLeft: `5px solid ${color.border}`,
              borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              maxWidth: 400,
              fontSize: 15,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            <span>{toast.message}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(toast.id);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                marginLeft: 16,
                cursor: 'pointer',
                color: color.text,
                opacity: 0.6,
                fontSize: 16,
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
