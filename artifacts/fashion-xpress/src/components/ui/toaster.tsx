import { ToastProvider, ToastViewport } from "./toast"
import { useToast } from "./use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <div key={id} className="bg-card border border-white/10 text-white p-4 rounded-md shadow-lg mb-2">
            {title && <div className="font-medium">{title}</div>}
            {description && <div className="text-sm text-muted-foreground">{description}</div>}
          </div>
        )
      })}
      <ToastViewport className="fixed bottom-0 right-0 p-6 w-[390px] max-w-[100vw] m-0 list-none z-[100] outline-none" />
    </ToastProvider>
  )
}
