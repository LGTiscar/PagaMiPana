"use client"

import type React from "react"

import { useAuth } from "@/utils/auth-context"
import { UserMenu } from "./user-menu"
import { useRouter } from "next/navigation"
import { QuickSplitLogo } from "./quicksplit-logo"
import { useEffect, useState } from "react"

export function AppHeader() {
  const { user } = useAuth()
  const router = useRouter()
  const [statusBarHeight, setStatusBarHeight] = useState(0)

  useEffect(() => {
    // Check if we're in a Capacitor environment
    if (typeof window !== "undefined" && window.Capacitor?.isNative) {
      // For iOS, we need to get the status bar height
      if (window.Capacitor.getPlatform() === "ios") {
        // This is a placeholder - in a real app, you would use Capacitor's
        // StatusBar plugin to get the actual height
        // For now, we'll use a reasonable default for iOS devices
        setStatusBarHeight(47) // Approximate height for iPhone with notch/Dynamic Island
      }
    }
  }, [])

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.location.href = "/"
  }

  return (
    <header
      className="glass-effect border-b border-gray-100/50 px-4 flex items-center justify-between sticky top-0 z-50"
      style={{
        paddingTop: `max(env(safe-area-inset-top, ${statusBarHeight}px), 0.75rem)`,
        paddingBottom: "0.75rem",
        height: `calc(env(safe-area-inset-top, ${statusBarHeight}px) + 3.5rem)`,
      }}
    >
      <a href="/" onClick={handleLogoClick}>
        <QuickSplitLogo size="md" />
      </a>
      {user && <UserMenu />}
    </header>
  )
}

