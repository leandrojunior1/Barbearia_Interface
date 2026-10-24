export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex items-center justify-between rounded-2xl border p-4 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-gray-100 bg-white text-gray-800"
          }`}
        >
          <span>{toast.text}</span>
          <button
            type="button"
            aria-label="Fechar notificação"
            onClick={() => onDismiss(toast.id)}
            className="ml-4 text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
