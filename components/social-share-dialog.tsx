"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Share2, Copy, Check, QrCode, Facebook, Twitter, Mail, MessageCircle, AlertCircle } from "lucide-react"
import type { BillItem, Person } from "./bill-split-calculator"
import { shareToSocialPlatform, generateQRCode } from "@/utils/social-share"
import { formatCurrency } from "@/utils/share-utils"

interface SocialShareDialogProps {
  billItems: BillItem[]
  people: Person[]
  billTotal: number
  billId?: string
}

export function SocialShareDialog({ billItems, people, billTotal, billId }: SocialShareDialogProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("social")
  const [customMessage, setCustomMessage] = useState("")
  const [isSharing, setIsSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  // Get the payer's name
  const payer = people.find((p) => p.isPayer)
  const payerName = payer ? payer.name : "Unknown"

  // Handle sharing to a specific platform
  const handleShare = async (platform: "general" | "whatsapp" | "facebook" | "twitter" | "email" | "copy") => {
    setIsSharing(true)
    setShareSuccess(null)
    setShareError(null)

    try {
      const success = await shareToSocialPlatform(billItems, people, billTotal, {
        platform,
        includeLink: true,
        message: customMessage,
        billId: billId, // Pass billId to the shareToSocialPlatform function
      })

      if (success) {
        if (platform === "copy") {
          setShareSuccess("Bill summary copied to clipboard!")
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
        } else if (platform === "general") {
          setShareSuccess("Shared successfully!")
        } else {
          setShareSuccess(`Opening ${platform} to share...`)
          // Close dialog after a delay for external platforms
          setTimeout(() => setOpen(false), 1500)
        }
      } else {
        if (platform === "general") {
          setShareSuccess("Bill summary copied to clipboard instead!")
        } else {
          setShareError("Sharing failed. The summary has been copied to your clipboard instead.")
        }
      }
    } catch (error) {
      console.error("Error sharing:", error)
      setShareError("An error occurred. The summary has been copied to your clipboard.")

      // Try to copy as fallback
      try {
        const shareText = await import("@/utils/share-utils").then((module) =>
          module.generateShareText(billItems, people, billTotal),
        )
        await navigator.clipboard.writeText(shareText)
        setShareSuccess("Bill summary copied to clipboard instead!")
      } catch (clipboardError) {
        console.error("Clipboard fallback failed:", clipboardError)
        setShareError("Sharing failed. Please try another method.")
      }
    } finally {
      setIsSharing(false)
    }
  }

  // Generate QR code
  const handleGenerateQRCode = async () => {
    setIsSharing(true)
    setShareSuccess(null)
    setShareError(null)

    try {
      const qrUrl = await generateQRCode(billId)
      setQrCodeUrl(qrUrl)
      setShareSuccess("QR code generated successfully!")
    } catch (error) {
      console.error("Error generating QR code:", error)
      setShareError("Failed to generate QR code. Please try again.")
    } finally {
      setIsSharing(false)
    }
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const generateShareableLink = (billId?: string) => {
    if (billId) {
      return `${window.location.origin}/bills/id?id=${billId}`
    }
    return window.location.origin
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-magenta hover:bg-purple-dark shadow-[0_2px_5px_rgba(165,21,140,0.2)] hover:shadow-[0_4px_8px_rgba(165,21,140,0.3)]">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share QuickSplit</DialogTitle>
          <DialogDescription>Share your bill split results with friends and family.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="link">Link & QR</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="social" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-message">Add a custom message (optional)</Label>
              <Input
                id="custom-message"
                placeholder="e.g., Here's our dinner bill from last night!"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 h-20 flex-col"
                onClick={() => handleShare("whatsapp")}
                disabled={isSharing}
              >
                <MessageCircle className="h-6 w-6 text-green-600" />
                <span>WhatsApp</span>
              </Button>

              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 h-20 flex-col"
                onClick={() => handleShare("facebook")}
                disabled={isSharing}
              >
                <Facebook className="h-6 w-6 text-blue-600" />
                <span>Facebook</span>
              </Button>

              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 h-20 flex-col"
                onClick={() => handleShare("twitter")}
                disabled={isSharing}
              >
                <Twitter className="h-6 w-6 text-blue-400" />
                <span>Twitter</span>
              </Button>

              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 h-20 flex-col"
                onClick={() => handleShare("email")}
                disabled={isSharing}
              >
                <Mail className="h-6 w-6 text-gray-600" />
                <span>Email</span>
              </Button>
            </div>

            <div className="pt-2">
              <Button
                variant="default"
                className="w-full flex items-center justify-center gap-2 bg-magenta hover:bg-purple-dark"
                onClick={() => handleShare("general")}
                disabled={isSharing}
              >
                {isSharing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Share via...
                  </>
                )}
              </Button>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 shadow-[0_2px_5px_rgba(165,21,140,0.15)] hover:shadow-[0_4px_8px_rgba(165,21,140,0.2)] hover:bg-yellow/5 transition-all duration-300"
                onClick={() => handleShare("copy")}
                disabled={isSharing}
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-link">Shareable Link</Label>
              <div className="flex gap-2">
                <Input
                  id="share-link"
                  value={generateShareableLink(billId)}
                  readOnly
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(generateShareableLink(billId))
                    setIsCopied(true)
                    setTimeout(() => setIsCopied(false), 2000)
                  }}
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label>QR Code</Label>
              <div className="flex flex-col items-center justify-center p-4 border rounded-md">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code" className="w-48 h-48" />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 p-8">
                    <QrCode className="h-12 w-12 text-gray-400" />
                    <Button
                      onClick={handleGenerateQRCode}
                      disabled={isSharing}
                      className="bg-magenta hover:bg-purple-dark"
                    >
                      {isSharing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate QR Code"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="py-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">QuickSplit Summary</h3>
                    <div className="text-xl font-bold text-magenta">{formatCurrency(billTotal)}</div>
                  </div>

                  <div className="text-sm text-gray-500">Paid by {payerName}</div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">People</div>
                    <div className="flex flex-wrap gap-2">
                      {people.map((person) => (
                        <div key={person.id} className="flex items-center gap-1">
                          <Avatar className={`h-6 w-6 ${person.color}`}>
                            <AvatarFallback className="text-xs">{getInitials(person.name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{person.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm">
                    {billItems.length} items • {people.length} people
                  </div>

                  <div className="text-xs text-gray-500 italic">
                    This is a preview of how your shared bill will appear.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {shareSuccess && (
          <Alert className="mt-2">
            <Check className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-600">{shareSuccess}</AlertDescription>
          </Alert>
        )}

        {shareError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{shareError}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}

