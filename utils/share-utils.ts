import type { BillItem, Person } from "@/components/bill-split-calculator"

// Define the interface for payment summary
interface PaymentSummary {
  from: string
  to: string
  amount: number
}

// Format currency consistently
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

// Generate text summary for sharing
export const generateShareText = (billItems: BillItem[], people: Person[], billTotal: number): string => {
  // Calculate what each person owes
  const personTotals = people.reduce<Record<string, number>>((acc, person) => {
    acc[person.id] = 0
    return acc
  }, {})

  // Calculate each person's share
  billItems.forEach((item) => {
    if (item.assignedTo.length === 0) {
      // If no one is assigned, split equally among all
      const perPersonAmount = item.totalPrice / people.length
      people.forEach((person) => {
        personTotals[person.id] += perPersonAmount
      })
    } else {
      // Split among assigned people
      const perPersonAmount = item.totalPrice / item.assignedTo.length
      item.assignedTo.forEach((personId) => {
        personTotals[personId] += perPersonAmount
      })
    }
  })

  // Find the payer
  const payer = people.find((p) => p.isPayer)

  // Calculate who owes what to whom
  const payments: PaymentSummary[] = []

  if (payer) {
    people.forEach((person) => {
      if (person.id !== payer.id && personTotals[person.id] > 0) {
        payments.push({
          from: person.id,
          to: payer.id,
          amount: personTotals[person.id],
        })
      }
    })
  }

  // Get person name by ID
  const getPersonName = (id: string) => {
    return people.find((p) => p.id === id)?.name || "Unknown"
  }

  // Build the share text
  let shareText = "📝 QuickSplit Summary\n\n"

  // Add bill details
  shareText += `💰 Total Bill: ${formatCurrency(billTotal)}\n`
  shareText += `👥 Number of People: ${people.length}\n`
  shareText += `💳 Paid By: ${payer ? getPersonName(payer.id) : "Not specified"}\n\n`

  // Add individual totals
  shareText += "👤 Individual Totals:\n"
  people.forEach((person) => {
    shareText += `${person.name}: ${formatCurrency(personTotals[person.id])}\n`
  })

  // Add payment summary
  if (payments.length > 0) {
    shareText += "\n💸 Payment Summary:\n"
    payments.forEach((payment) => {
      shareText += `${getPersonName(payment.from)} owes ${getPersonName(payment.to)} ${formatCurrency(payment.amount)}\n`
    })
  } else {
    shareText += "\nNo payments needed.\n"
  }

  // Add footer
  shareText += "\nShared via QuickSplit App"

  return shareText
}

// Share the results using the native share dialog
export const shareResults = async (billItems: BillItem[], people: Person[], billTotal: number): Promise<void> => {
  const shareText = generateShareText(billItems, people, billTotal)

  try {
    // Check if running in Capacitor
    if (typeof window !== "undefined" && window.Capacitor?.isNative) {
      // Use Capacitor Share API
      const { Share } = await import("@capacitor/share")
      await Share.share({
        title: "QuickSplit Summary",
        text: shareText,
        dialogTitle: "Share your bill split results",
      })
    } else {
      // Fallback for web
      if (navigator.share) {
        await navigator.share({
          title: "QuickSplit Summary",
          text: shareText,
        })
      } else {
        // Copy to clipboard if Web Share API is not available
        await navigator.clipboard.writeText(shareText)
        alert("Summary copied to clipboard!")
      }
    }
  } catch (error) {
    console.error("Error sharing results:", error)
    // Fallback to copying to clipboard
    try {
      await navigator.clipboard.writeText(shareText)
      alert("Summary copied to clipboard!")
    } catch (clipboardError) {
      console.error("Error copying to clipboard:", clipboardError)
      alert("Could not share results. Please try again.")
    }
  }
}

// Generate HTML summary for copying or saving as PDF
export const generateHtmlSummary = (billItems: BillItem[], people: Person[], billTotal: number): string => {
  // Calculate what each person owes (same logic as above)
  const personTotals = people.reduce<Record<string, number>>((acc, person) => {
    acc[person.id] = 0
    return acc
  }, {})

  billItems.forEach((item) => {
    if (item.assignedTo.length === 0) {
      const perPersonAmount = item.totalPrice / people.length
      people.forEach((person) => {
        personTotals[person.id] += perPersonAmount
      })
    } else {
      const perPersonAmount = item.totalPrice / item.assignedTo.length
      item.assignedTo.forEach((personId) => {
        personTotals[personId] += perPersonAmount
      })
    }
  })

  const payer = people.find((p) => p.isPayer)
  const payments: PaymentSummary[] = []

  if (payer) {
    people.forEach((person) => {
      if (person.id !== payer.id && personTotals[person.id] > 0) {
        payments.push({
          from: person.id,
          to: payer.id,
          amount: personTotals[person.id],
        })
      }
    })
  }

  const getPersonName = (id: string) => {
    return people.find((p) => p.id === id)?.name || "Unknown"
  }

  // Build HTML
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QuickSplit Summary</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      h1 {
        color: #2563eb;
        text-align: center;
      }
      .section {
        margin-bottom: 20px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 15px;
      }
      .section-title {
        font-weight: bold;
        margin-bottom: 10px;
        color: #1f2937;
      }
      .payment-item {
        padding: 10px;
        margin-bottom: 8px;
        background-color: #f3f4f6;
        border-radius: 4px;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        font-size: 0.8em;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <h1>QuickSplit Summary</h1>
    
    <div class="section">
      <div class="section-title">Bill Details</div>
      <p>Total Bill: ${formatCurrency(billTotal)}</p>
      <p>Number of People: ${people.length}</p>
      <p>Paid By: ${payer ? getPersonName(payer.id) : "Not specified"}</p>
    </div>
    
    <div class="section">
      <div class="section-title">Individual Totals</div>
`

  people.forEach((person) => {
    html += `<p>${person.name}: ${formatCurrency(personTotals[person.id])}</p>`
  })

  html += `
    </div>
    
    <div class="section">
      <div class="section-title">Payment Summary</div>
`

  if (payments.length > 0) {
    payments.forEach((payment) => {
      html += `
      <div class="payment-item">
        ${getPersonName(payment.from)} owes ${getPersonName(payment.to)} ${formatCurrency(payment.amount)}
      </div>
    `
    })
  } else {
    html += `<p>No payments needed.</p>`
  }

  html += `
    </div>
    
    <div class="footer">
      Generated by QuickSplit App
    </div>
  </body>
  </html>
`

  return html
}

