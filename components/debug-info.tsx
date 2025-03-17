"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DebugInfo() {
    const [isVisible, setIsVisible] = useState(false)
    const [info, setInfo] = useState<Record<string, any>>({})

    useEffect(() => {
        // Collect debug information
        const debugInfo: Record<string, any> = {
            url: window.location.href,
            pathname: window.location.pathname,
            hash: window.location.hash,
            search: window.location.search,
            isCapacitor: typeof window.Capacitor !== "undefined" && window.Capacitor.isNative,
            platform: typeof window.Capacitor !== "undefined" ? window.Capacitor.getPlatform() : "web",
            localStorage: {},
            sessionStorage: {},
        }

        // Get localStorage items
        try {
            debugInfo.localStorage.currentBillId = localStorage.getItem("currentBillId")
        } catch (e) {
            debugInfo.localStorage.error = String(e)
        }

        // Get sessionStorage items
        try {
            debugInfo.sessionStorage.currentBillId = sessionStorage.getItem("currentBillId")
        } catch (e) {
            debugInfo.sessionStorage.error = String(e)
        }

        setInfo(debugInfo)
    }, [isVisible])

    if (!isVisible) {
        return (
            <Button
                variant="outline"
                size="sm"
                className="fixed bottom-4 right-4 z-50 opacity-70"
                onClick={() => setIsVisible(true)}
            >
                Debug
            </Button>
        )
    }

    return (
        <Card className="fixed bottom-4 right-4 z-50 w-80 max-h-96 overflow-auto">
            <CardHeader className="py-2">
                <CardTitle className="text-sm flex justify-between">
                    <span>Debug Info</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsVisible(false)}>
                        ×
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="py-2 text-xs">
                <pre className="whitespace-pre-wrap">{JSON.stringify(info, null, 2)}</pre>
            </CardContent>
        </Card>
    )
}

