import type { BillItem, Person } from "@/components/bill-split-calculator"
import { generateShareText } from "./share-utils"

// Define the interface for share options
export interface ShareOptions {
  platform?: "general" | "whatsapp" | "facebook" | "twitter" | "email" | "copy" | "qrcode"
  includeLink?: boolean
  message?: string
  billId?: string // Add billId to the interface
}

// Generate a shareable link for a bill
export function generateShareableLink(billId?: string): string {
  // If we have a bill ID, create a direct link to it
  if (billId) {
    // Use the current origin or a default one for development
    const origin = typeof window !== "undefined" ? window.location.origin : "https://billsplitter.app"
    return `${origin}/bills/${billId}`
  }

  // If no bill ID (temporary share), return the app URL
  return typeof window !== "undefined" ? window.location.origin : "https://billsplitter.app"
}

// Generate a share message with appropriate formatting for different platforms
export function generateSocialShareText(
  billItems: BillItem[],
  people: Person[],
  billTotal: number,
  options: ShareOptions = {},
): string {
  // Get the basic share text
  let shareText = generateShareText(billItems, people, billTotal)

  // Add a link if requested
  if (options.includeLink) {
    shareText += `\n\nView details: ${generateShareableLink(options.billId)}`
  }

  // Add custom message if provided
  if (options.message) {
    shareText = `${options.message}\n\n${shareText}`
  }

  // Format for specific platforms
  switch (options.platform) {
    case "whatsapp":
      // WhatsApp has character limits and handles line breaks differently
      return shareText.substring(0, 4000)

    case "twitter":
      // Twitter has a character limit
      return shareText.substring(0, 280)

    case "facebook":
      // Facebook formatting
      return shareText

    case "email":
      // Email formatting (replace line breaks with HTML)
      return shareText.replace(/\n/g, "<br>")

    default:
      return shareText
  }
}

// Check if Web Share API is available and has permission
function canUseWebShare(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  )
}

// Share to a specific platform
export async function shareToSocialPlatform(
  billItems: BillItem[],
  people: Person[],
  billTotal: number,
  options: ShareOptions = {},
): Promise<boolean> {
  try {
    const shareText = generateSocialShareText(billItems, people, billTotal, options)
    const shareTitle = "Bill Split Summary"

    // Handle platform-specific sharing first
    if (options.platform === "copy") {
      // For copy, just copy to clipboard
      await navigator.clipboard.writeText(shareText)
      return true
    }

    if (options.platform === "qrcode") {
      // QR code is handled separately in the UI
      return true
    }

    // Check if running in Capacitor
    if (typeof window !== "undefined" && window.Capacitor?.isNative) {
      try {
        // Use Capacitor Share API
        const { Share } = await import("@capacitor/share")

        // Handle platform-specific sharing
        switch (options.platform) {
          case "whatsapp":
            // On mobile, we can try to deep link to WhatsApp
            if (window.Capacitor.getPlatform() === "android" || window.Capacitor.getPlatform() === "ios") {
              const encodedText = encodeURIComponent(shareText)
              window.open(`whatsapp://send?text=${encodedText}`, "_blank")
              return true
            }
            break

          case "facebook":
            // For Facebook, we can use the Facebook Share Dialog if available
            if (window.Capacitor.getPlatform() === "android" || window.Capacitor.getPlatform() === "ios") {
              const url = generateShareableLink(options.billId)
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank")
              return true
            }
            break

          case "twitter":
            // For Twitter, we can use the Twitter Web Intent
            if (window.Capacitor.getPlatform() === "android" || window.Capacitor.getPlatform() === "ios") {
              const text = encodeURIComponent(shareText.substring(0, 280))
              window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
              return true
            }
            break

          case "email":
            // For email, we can use the mailto protocol
            if (window.Capacitor.getPlatform() === "android" || window.Capacitor.getPlatform() === "ios") {
              const subject = encodeURIComponent("Bill Split Summary")
              const body = encodeURIComponent(shareText)
              window.open(`mailto:?subject=${subject}&body=${body}`, "_blank")
              return true
            }
            break
        }

        // Fallback to general share if platform-specific sharing failed
        await Share.share({
          title: shareTitle,
          text: shareText,
          dialogTitle: "Share your bill split results",
        })
        return true
      } catch (capacitorError) {
        console.error("Capacitor Share error:", capacitorError)
        // Fall through to web fallbacks
      }
    }

    // Web fallbacks - handle specific platforms with direct links
    switch (options.platform) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank")
        return true

      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generateShareableLink(options.billId))}`,
          "_blank",
        )
        return true

      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.substring(0, 280))}`,
          "_blank",
        )
        return true

      case "email":
        const subject = encodeURIComponent("Bill Split Summary")
        const body = encodeURIComponent(shareText)
        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank")
        return true
    }

    // Try to use the Web Share API for general sharing if available and permitted
    if (options.platform === "general" && canUseWebShare()) {
      try {
        const shareData = {
          title: shareTitle,
          text: shareText,
        }

        // Check if we can share this data
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData)
          return true
        }
      } catch (webShareError) {
        console.error("Web Share API error:", webShareError)
        // Fall through to clipboard fallback
      }
    }

    // Final fallback - copy to clipboard
    await navigator.clipboard.writeText(shareText)
    return true
  } catch (error) {
    console.error("Error sharing to social platform:", error)

    // Fallback to copying to clipboard
    try {
      const shareText = generateSocialShareText(billItems, people, billTotal, options)
      await navigator.clipboard.writeText(shareText)
      return true
    } catch (clipboardError) {
      console.error("Error copying to clipboard:", clipboardError)
      return false
    }
  }
}

// Generate a QR code for sharing
export async function generateQRCode(billId?: string): Promise<string> {
  try {
    // Use a QR code generation service
    const url = generateShareableLink(billId)
    const encodedUrl = encodeURIComponent(url)

    // Use a free QR code API (you might want to replace this with a more reliable service)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw error
  }
}

