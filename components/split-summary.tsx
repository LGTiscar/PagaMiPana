"use client"

import { useState } from "react"
import type { BillItem, Person } from "./bill-split-calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowRight, Download, Copy, Check } from "lucide-react"
import { shareResults, formatCurrency, generateHtmlSummary } from "@/utils/share-utils"
import { SaveBillDialog } from "./save-bill-dialog"
import { SocialShareDialog } from "./social-share-dialog"

interface SplitSummaryProps {
  billItems: BillItem[]
  people: Person[]
  billTotal: number
}

interface PaymentSummary {
  from: string
  to: string
  amount: number
}

export function SplitSummary({ billItems, people, billTotal }: SplitSummaryProps) {
  const [isCopied, setIsCopied] = useState(false)

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

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Handle share button click
  const handleShare = async () => {
    await shareResults(billItems, people, billTotal)
  }

  // Handle copy summary button click
  const handleCopy = async () => {
    try {
      const shareText = await import("@/utils/share-utils").then((module) =>
        module.generateShareText(billItems, people, billTotal),
      )
      await navigator.clipboard.writeText(shareText)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error("Error copying summary:", error)
      alert("Failed to copy summary. Please try again.")
    }
  }

  // Handle save as PDF (this is a placeholder - actual PDF generation would require additional libraries)
  const handleSaveAsPDF = async () => {
    try {
      // For a real implementation, you would use a library like jsPDF or pdfmake
      // This is a simple placeholder that opens the HTML in a new window for printing
      const htmlContent = generateHtmlSummary(billItems, people, billTotal)

      // Create a blob from the HTML content
      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)

      // Open in a new window
      const newWindow = window.open(url, "_blank")

      // Add print instructions
      if (newWindow) {
        newWindow.onload = () => {
          newWindow.document.title = "Bill Split Summary"
          alert("Use your browser's print function to save as PDF")
        }
      } else {
        alert("Please allow pop-ups to save as PDF")
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Final Split Summary</h2>
        <p className="text-gray-500 mt-1">Here's how much everyone owes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-effect border-gray-100/50 hover:subtle-yellow-border transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Bill Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Bill</span>
                <span className="font-medium text-magenta">{formatCurrency(billTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Number of People</span>
                <span className="font-medium">{people.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid By</span>
                <span className="font-medium">{payer ? getPersonName(payer.id) : "Not specified"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-gray-100/50 hover:subtle-yellow-border transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Individual Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {people.map((person) => (
                <div key={person.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Avatar className={`h-6 w-6 ${person.color}`}>
                      <AvatarFallback className="text-xs">{getInitials(person.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-gray-600">{person.name}</span>
                  </div>
                  <span className="font-medium text-magenta">{formatCurrency(personTotals[person.id])}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-effect border-gray-100/50 hover:subtle-yellow-border transition-all duration-300">
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment, index) => {
                const fromPerson = people.find((p) => p.id === payment.from)
                const toPerson = people.find((p) => p.id === payment.to)

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50/70 backdrop-blur-sm hover:bg-yellow/5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className={fromPerson?.color}>
                        <AvatarFallback>{getInitials(getPersonName(payment.from))}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{getPersonName(payment.from)}</div>
                      <ArrowRight className="h-4 w-4 text-magenta" />
                      <Avatar className={toPerson?.color}>
                        <AvatarFallback>{getInitials(getPersonName(payment.to))}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{getPersonName(payment.to)}</div>
                    </div>
                    <div className="text-lg font-bold text-magenta">{formatCurrency(payment.amount)}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 italic">No payments needed</p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
        <SocialShareDialog billItems={billItems} people={people} billTotal={billTotal} />
        <Button
          variant="outline"
          className="flex items-center gap-2 shadow-[0_2px_5px_rgba(165,21,140,0.15)] hover:bg-yellow/5 transition-all duration-300"
          onClick={handleCopy}
        >
          {isCopied ? (
            <>
              <Check className="h-4 w-4 text-pink" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Summary
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-2 shadow-[0_2px_5px_rgba(165,21,140,0.15)] hover:bg-yellow/5 transition-all duration-300"
          onClick={handleSaveAsPDF}
        >
          <Download className="h-4 w-4" />
          Save as PDF
        </Button>
        <SaveBillDialog billItems={billItems} people={people} billTotal={billTotal} />
      </div>
    </div>
  )
}

