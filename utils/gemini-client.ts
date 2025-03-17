import type { BillItem } from "@/components/bill-split-calculator"

// Get API key from environment variable
// NEXT_PUBLIC_ prefix is required for client-side access
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ""

export async function processReceiptWithGemini(imageBase64: string): Promise<{
  items: BillItem[]
  total: number
  success: boolean
  error?: string
}> {
  try {
    console.log("Starting OCR processing with Gemini...")

    // Log API key status (not the actual key for security)
    if (!GOOGLE_API_KEY) {
      console.error("API key is missing!")
      throw new Error(
        "Google API key is not configured. Please add NEXT_PUBLIC_GOOGLE_API_KEY to your environment variables.",
      )
    } else {
      console.log("API key is configured (first few chars):", GOOGLE_API_KEY.substring(0, 3) + "...")
    }

    // Check if imageBase64 is defined
    if (!imageBase64) {
      console.log("Image data is undefined")
      throw new Error("No image data provided")
    }

    // Remove the data URL prefix if present
    let base64Image = imageBase64
    if (typeof imageBase64 === "string" && imageBase64.indexOf("base64,") !== -1) {
      base64Image = imageBase64.split("base64,")[1]
    }

    // Prepare the prompt for Gemini - with quantity extraction
    const prompt = `You are an expert at analyzing restaurant receipts. 
    
Please carefully examine this receipt image and extract:
1. All individual menu items with their exact names, quantities, unit prices, and total prices
2. The total amount of the bill

Format your response as a clean JSON object with this exact structure:
{
"items": [
  {"name": "Item Name 1", "quantity": 2, "unitPrice": 10.99, "totalPrice": 21.98},
  {"name": "Item Name 2", "quantity": 1, "unitPrice": 5.99, "totalPrice": 5.99}
],
"total": 27.97
}

Be precise with item names, quantities, and prices. If you can't read something clearly, make your best guess.
For quantities, if not explicitly stated, assume 1.
For unit prices, divide the total price by the quantity.
For total prices, multiply the unit price by the quantity.

IMPORTANT: Your response must ONLY contain this JSON object and nothing else.`

    console.log("Calling Gemini API...")

    // Call Gemini API using fetch
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GOOGLE_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generation_config: {
            temperature: 0.2,
            max_output_tokens: 4000,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API error response:", errorText)

      // Try to parse the error response as JSON
      try {
        const errorJson = JSON.parse(errorText)
        const errorMessage = errorJson.error?.message || JSON.stringify(errorJson)
        throw new Error(`Gemini API error: ${errorMessage}`)
      } catch (e) {
        // If parsing fails, use the raw error text
        throw new Error(`Gemini API error: ${errorText.substring(0, 100)}...`)
      }
    }

    const data = await response.json()
    console.log("Gemini API response received")

    // Extract the text from the response
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      console.error("Invalid response format:", JSON.stringify(data).substring(0, 200))
      throw new Error("Invalid response format from Gemini API")
    }

    const aiResponse = data.candidates[0].content.parts[0].text || ""
    console.log("AI Response (first 200 chars):", aiResponse.substring(0, 200))

    // Try to parse the response as JSON
    let jsonData
    try {
      // First, try to parse the entire response as JSON
      jsonData = JSON.parse(aiResponse)
      console.log("Successfully parsed JSON response")
    } catch (e) {
      console.log("Couldn't parse entire response as JSON, trying to extract JSON object...")

      // If that fails, try to extract a JSON object using regex
      const jsonMatch = aiResponse.match(/\{(?:[^{}]|(\{(?:[^{}]|(\{(?:[^{}]|(\{[^{}]*\}))*\}))*\}))*\}/s)

      if (!jsonMatch) {
        console.error("No JSON object found in response")
        throw new Error("Could not extract valid JSON from AI response")
      }

      try {
        jsonData = JSON.parse(jsonMatch[0])
        console.log("Successfully parsed extracted JSON")
      } catch (e) {
        console.error("Extracted text is not valid JSON:", jsonMatch[0])
        throw new Error("Extracted text is not valid JSON")
      }
    }

    // Handle both formats: direct items array or object with items property
    let items = []
    if (jsonData && typeof jsonData === "object") {
      items = Array.isArray(jsonData.items) ? jsonData.items : []
    }

    let total = 0
    if (jsonData && typeof jsonData === "object" && typeof jsonData.total !== "undefined") {
      total = Number.parseFloat(String(jsonData.total))
      if (isNaN(total)) total = 0
    }

    console.log(`Extracted ${items.length} items and total: ${total}`)

    // Convert to our BillItem format
    const billItems: BillItem[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      // Skip if item is undefined
      if (!item) {
        continue
      }

      // Extract quantity (default to 1 if not provided)
      let quantity = 1
      if (typeof item.quantity === "number" && !isNaN(item.quantity) && item.quantity > 0) {
        quantity = item.quantity
      } else if (typeof item.quantity === "string") {
        const parsedQuantity = Number.parseFloat(item.quantity)
        if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
          quantity = parsedQuantity
        }
      }

      // Handle unit price
      let unitPrice = 0
      if (typeof item.unitPrice === "number") {
        unitPrice = item.unitPrice
      } else if (typeof item.unitPrice === "string") {
        const priceStr = item.unitPrice.replace(/[^0-9.]/g, "")
        unitPrice = Number.parseFloat(priceStr)
      } else if (typeof item.price === "number") {
        // Fallback to price if unitPrice is not available
        unitPrice = item.price
      } else if (typeof item.price === "string") {
        const priceStr = item.price.replace(/[^0-9.]/g, "")
        unitPrice = Number.parseFloat(priceStr)
      }

      // Handle total price
      let totalPrice = 0
      if (typeof item.totalPrice === "number") {
        totalPrice = item.totalPrice
      } else if (typeof item.totalPrice === "string") {
        const priceStr = item.totalPrice.replace(/[^0-9.]/g, "")
        totalPrice = Number.parseFloat(priceStr)
      } else {
        // Calculate total price if not provided
        totalPrice = unitPrice * quantity
      }

      // If we have a total price but no unit price, calculate the unit price
      if (totalPrice > 0 && unitPrice === 0 && quantity > 0) {
        unitPrice = totalPrice / quantity
      }

      // Ensure all values are valid numbers
      if (isNaN(unitPrice)) unitPrice = 0
      if (isNaN(totalPrice)) totalPrice = 0
      if (isNaN(quantity) || quantity <= 0) quantity = 1

      // Ensure name is a string
      let name = `Item ${i + 1}`
      if (item.name) {
        name = String(item.name)
      }

      billItems.push({
        id: `item-${i}`,
        name: name,
        price: unitPrice,
        quantity: quantity,
        totalPrice: totalPrice,
        assignedTo: [],
      })
    }

    console.log(
      "Processed bill items:",
      billItems.map((item) => `${item.name}: ${item.quantity} x $${item.price} = $${item.totalPrice}`),
    )

    // If no total was provided or calculated, sum up the total prices of all items
    if (total === 0 && billItems.length > 0) {
      total = billItems.reduce((sum, item) => sum + item.totalPrice, 0)
      console.log(`Calculated total from items: ${total}`)
    }

    return {
      items: billItems,
      total: isNaN(total) ? 0 : total,
      success: true,
    }
  } catch (error) {
    console.error("OCR processing error:", error)
    return {
      items: [],
      total: 0,
      success: false,
      error: error instanceof Error ? error.message : "Unknown OCR error",
    }
  }
}

