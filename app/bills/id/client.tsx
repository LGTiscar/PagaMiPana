"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getBillDetails, type SavedBill } from "@/utils/database"
import { Loader2, ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { shareResults, formatCurrency } from "@/utils/share-utils"
import { SocialShareDialog } from "@/components/social-share-dialog"

export default function BillDetailsClientPage({ id }: { id: string }) {
  const [bill, setBill] = useState<SavedBill | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    async function loadBillDetails() {
      try {
        const billDetails = await getBillDetails(id)
        setBill(billDetails)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bill details")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadBillDetails()
    }
  }, [id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const handleShare = async () => {
    if (bill) {
      await shareResults(bill.items, bill.people, bill.billTotal)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <AppHeader />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Bill Details</h1>
                <p className="text-gray-600">View the details of your saved bill</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push("/history")} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to History
                </Button>
                {bill && (
                  <SocialShareDialog
                    billItems={bill.items}
                    people={bill.people}
                    billTotal={bill.billTotal}
                    billId={bill.id}
                  />
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">{error}</div>
            ) : bill ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">{bill.name}</CardTitle>
                    <p className="text-gray-500">{formatDate(bill.date)}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-4">{formatCurrency(bill.billTotal)}</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* People */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">People</h3>
                        <div className="space-y-2">
                          {bill.people.map((person) => (
                            <div
                              key={person.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className={person.color}>
                                  <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                                </Avatar>
                                <span>{person.name}</span>
                                {person.isPayer && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    Paid
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">Items</h3>
                        <div className="space-y-2">
                          {bill.items.map((item) => (
                            <div key={item.id} className="p-2 bg-gray-50 rounded-lg">
                              <div className="flex justify-between">
                                <span>{item.name}</span>
                                <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                              </div>
                              <div className="mt-1 text-sm text-gray-500">
                                {item.quantity > 1 && (
                                  <span>
                                    {item.quantity} × {formatCurrency(item.price)}
                                  </span>
                                )}
                                {item.assignedTo.length > 0 && (
                                  <div className="mt-1">
                                    <span>Split between: </span>
                                    {item.assignedTo.map((personId, index) => {
                                      const person = bill.people.find((p) => p.id === personId)
                                      return (
                                        <span key={personId}>
                                          {person?.name}
                                          {index < item.assignedTo.length - 1 ? ", " : ""}
                                        </span>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/history")}>
                    Back to History
                  </Button>
                  <Button onClick={() => router.push("/")}>Create New Bill</Button>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">Bill not found</div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}

