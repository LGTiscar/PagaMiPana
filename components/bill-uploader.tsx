"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Loader2, Image, AlertCircle, Camera } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { BillItem } from "./bill-split-calculator"
import { processReceiptWithGemini } from "@/utils/gemini-client"
import { ApiStatus } from "./api-status"

// Import Capacitor plugins (these would be properly imported in a real Capacitor project)
declare global {
  interface Window {
    Capacitor?: {
      isNative: boolean
      getPlatform: () => string
    }
    capacitorExports?: {
      Camera?: {
        getPhoto: (options: {
          quality: number
          allowEditing: boolean
          resultType: "base64" | "dataUrl" | "uri"
          source: "camera" | "photos" | "prompt"
        }) => Promise<{ base64String?: string; dataUrl?: string; path?: string }>
      }
    }
  }
}

interface BillUploaderProps {
  onStartOcr: () => void
  isLoading: boolean
  onOcrComplete: (items: BillItem[], total: number) => void
}

export function BillUploader({ onStartOcr, isLoading, onOcrComplete }: BillUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [ocrError, setOcrError] = useState<string | null>(null)

  // Check if running in Capacitor
  const isCapacitor = typeof window !== "undefined" && !!window.Capacitor?.isNative

  const handleTakePhoto = async () => {
    try {
      if (isCapacitor && window.capacitorExports?.Camera) {
        // Use Capacitor Camera API
        const image = await window.capacitorExports.Camera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: "dataUrl",
          source: "prompt", // Let user choose between camera and photos
        })

        if (image.dataUrl) {
          setPreviewUrl(image.dataUrl)
          setOcrError(null)
        }
      } else {
        // Fallback for web - open file dialog
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"

        input.onchange = (e: Event) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = () => {
              setPreviewUrl(reader.result as string)
              setOcrError(null)
            }
            reader.readAsDataURL(file)
          }
        }

        input.click()
      }
    } catch (error) {
      console.error("Error capturing image:", error)
      setOcrError("Failed to capture image. Please try again.")
    }
  }

  const handleProcessImage = async () => {
    if (!previewUrl) {
      setOcrError("Please upload an image first")
      return
    }

    try {
      onStartOcr() // Set loading state
      setOcrError(null)

      console.log("Starting OCR process...")

      // Use the Gemini client to process the receipt
      const result = await processReceiptWithGemini(previewUrl)

      if (result.success && result.items.length > 0) {
        console.log("OCR successful")
        onOcrComplete(result.items, result.total)
      } else {
        console.log("OCR failed:", result.error)
        const errorMsg = result.error || "Could not detect any items on the receipt"
        throw new Error(`${errorMsg}. Try taking a clearer photo with good lighting.`)
      }
    } catch (error) {
      console.error("Error processing image:", error)
      setOcrError(
        error instanceof Error ? error.message : "An error occurred while processing the image. Please try again.",
      )
      onStartOcr() // Reset loading state
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Step 1: Upload Your Bill</h2>
        <p className="text-gray-500 mt-1">Upload an image of your restaurant bill</p>
      </div>

      {/* API Status */}
      <ApiStatus />

      {ocrError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>OCR Error</AlertTitle>
          <AlertDescription>{ocrError}</AlertDescription>
        </Alert>
      )}

      <Card className="glass-effect border-gray-100/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300/70 rounded-lg p-12 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Camera className="h-10 w-10 text-magenta" />
              <Upload className="h-10 w-10 text-pink" />
            </div>
            <p className="text-sm text-gray-600 text-center mb-2">Take a photo or upload an image of your bill</p>
            <p className="text-xs text-gray-500 text-center mb-4">
              You can select an image from your gallery or take a new photo
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button
                onClick={handleTakePhoto}
                className="bg-magenta hover:bg-purple-dark shadow-[0_2px_5px_rgba(165,21,140,0.2)] hover:shadow-[0_4px_8px_rgba(165,21,140,0.3)]"
              >
                {isCapacitor ? "Take Photo or Choose Image" : "Select Image"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {previewUrl ? (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Preview</h3>
          <div className="relative max-w-md mx-auto">
            <div className="glass-effect p-2 rounded-lg border border-gray-100/50">
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Bill preview"
                className="rounded-lg w-full object-contain max-h-[400px]"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button
                className="w-full bg-magenta hover:bg-purple-dark shadow-[0_2px_5px_rgba(165,21,140,0.2)] hover:shadow-[0_4px_8px_rgba(165,21,140,0.3)]"
                onClick={handleProcessImage}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing image...
                  </>
                ) : (
                  "Analyze Bill"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200/70 rounded-lg bg-gray-50/50 backdrop-blur-sm">
          <Image className="h-16 w-16 text-gray-300 mb-2" />
          <p className="text-gray-500 text-center">Your bill preview will appear here</p>
        </div>
      )}

      <div className="bg-purple-dark/10 backdrop-blur-sm p-4 rounded-lg border border-purple-dark/20">
        <h3 className="text-sm font-medium text-purple-dark mb-2">OCR Scanning Tips:</h3>
        <ol className="text-sm text-purple-dark list-decimal list-inside space-y-1">
          <li>Ensure the bill is well-lit and the text is clearly visible</li>
          <li>Avoid shadows and glare on the receipt</li>
          <li>Make sure the entire bill is in the frame</li>
          <li>Hold the camera steady to avoid blurry images</li>
          <li>If scanning fails, try adjusting the lighting or use the demo data</li>
          <li>You can always manually add or edit items after processing</li>
        </ol>
      </div>
    </div>
  )
}

