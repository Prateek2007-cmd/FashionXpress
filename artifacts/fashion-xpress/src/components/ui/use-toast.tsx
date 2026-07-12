import { useState, useEffect } from "react"

export function useToast() {
  const [toasts, setToasts] = useState<any[]>([])

  const toast = ({ ...props }) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((toasts) => [...toasts, { id, ...props }])
    setTimeout(() => {
      setToasts((toasts) => toasts.filter((t) => t.id !== id))
    }, 5000)
  }

  return { toast, toasts }
}
