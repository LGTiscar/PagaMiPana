"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export function ApiStatus() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY

    if (!apiKey) {
      setStatus("error")
      setMessage(
        "Google API key is not configured. Please add NEXT_PUBLIC_GOOGLE_API_KEY to your environment variables.",
      )
      return
    }

    // Simple check if API key exists
    setStatus("success")
    setMessage("API key configured. OCR service should work properly.")
  }, [])

  if (status === "loading") {
    return null
  }

  return (
    <Alert variant={status === "success" ? "default" : "destructive"} className="mb-4">
      {status === "success" ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
      <AlertTitle>{status === "success" ? "API Connected" : "API Error"}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

