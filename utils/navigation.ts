// Store the current bill ID in memory
let currentBillId: string | null = null

// Set the current bill ID
export function setCurrentBillId(id: string): void {
    currentBillId = id

    // Also try to store in localStorage as a backup
    try {
        if (typeof window !== "undefined") {
            localStorage.setItem("currentBillId", id)
        }
    } catch (e) {
        console.error("Failed to store bill ID in localStorage:", e)
    }
}

// Get the current bill ID
export function getCurrentBillId(): string | null {
    // First check memory
    if (currentBillId) {
        return currentBillId
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

    // Finally try URL query params
    try {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search)
            const idFromUrl = urlParams.get("id")
            if (idFromUrl) {
                currentBillId = idFromUrl
                return idFromUrl
            }
        }
    } catch (e) {
        console.error("Failed to retrieve bill ID from URL:", e)
    }

    return null
}

// Navigate to a page in a Capacitor-friendly way
export function navigateTo(path: string): void {
    if (typeof window !== "undefined") {
        // For Capacitor apps, always use the index.html format
        if (window.Capacitor?.isNative) {
            // Make sure the path ends with index.html
            if (!path.endsWith("index.html") && !path.endsWith("/")) {
                path = `${path}/index.html`
            } else if (path.endsWith("/")) {
                path = `${path}index.html`
            }
        }

        // Use window.location for consistent behavior
        window.location.href = path
    }
}

