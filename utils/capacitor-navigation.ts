// Store the current bill ID in memory and localStorage
let currentBillId: string | null = null

// Set the current bill ID
export function setCurrentBillId(id: string): void {
    currentBillId = id

    // Also try to store in localStorage as a backup
    try {
        if (typeof window !== "undefined") {
            localStorage.setItem("currentBillId", id)

            // Also store in sessionStorage which is more reliable in some WebViews
            sessionStorage.setItem("currentBillId", id)
        }
    } catch (e) {
        console.error("Failed to store bill ID in storage:", e)
    }
}

// Get the current bill ID
export function getCurrentBillId(): string | null {
    // First check memory
    if (currentBillId) {
        return currentBillId
    }

    // Then try sessionStorage
    try {
        if (typeof window !== "undefined") {
            const sessionId = sessionStorage.getItem("currentBillId")
            if (sessionId) {
                currentBillId = sessionId
                return sessionId
            }
        }
    } catch (e) {
        console.error("Failed to retrieve bill ID from sessionStorage:", e)
    }

    // Then try localStorage
    try {
        if (typeof window !== "undefined") {
            const storedId = localStorage.getItem("currentBillId")
            if (storedId) {
                currentBillId = storedId
                return storedId
            }
        }
    } catch (e) {
        console.error("Failed to retrieve bill ID from localStorage:", e)
    }

    // Finally try URL hash
    try {
        if (typeof window !== "undefined") {
            const hash = window.location.hash
            if (hash.startsWith("#billId=")) {
                const idFromHash = hash.substring(8)
                if (idFromHash) {
                    currentBillId = idFromHash
                    return idFromHash
                }
            }
        }
    } catch (e) {
        console.error("Failed to retrieve bill ID from URL hash:", e)
    }

    return null
}

// Navigate to a page in a Capacitor-friendly way using hash navigation
export function navigateToDetails(billId: string): void {
    // Set the bill ID first
    setCurrentBillId(billId)

    if (typeof window !== "undefined") {
        // For Capacitor apps, use hash navigation which is more reliable
        if (window.Capacitor?.isNative) {
            // Set the hash and navigate to the details page
            window.location.hash = `billId=${billId}`
            window.location.href = "/bills/id/index.html"
        } else {
            // For web, use the standard approach
            window.location.href = `/bills/id/?id=${billId}`
        }
    }
}

// Navigate back to history
export function navigateToHistory(): void {
    if (typeof window !== "undefined") {
        if (window.Capacitor?.isNative) {
            window.location.href = "/history/index.html"
        } else {
            window.location.href = "/history"
        }
    }
}

// Navigate to home
export function navigateToHome(): void {
    if (typeof window !== "undefined") {
        window.location.href = "/"
    }
}

