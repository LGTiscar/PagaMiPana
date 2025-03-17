"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserBills, deleteBill, type SavedBill } from "@/utils/database"
import { Loader2, Trash2, Eye, ArrowLeft, Receipt, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/utils/share-utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Import the new navigation utility
import { navigateToDetails, navigateToHome } from "@/utils/capacitor-navigation"

// Import the debug component
import { DebugInfo } from "@/components/debug-info"

export default function HistoryPage() {
  const [bills, setBills] = useState<SavedBill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [billToDelete, setBillToDelete] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadBills()
  }, [])

  async function loadBills() {
    setLoading(true)
    setError("")

    try {
      const userBills = await getUserBills()
      setBills(userBills)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bills")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBill = async () => {
    if (!billToDelete) return

    setIsDeleting(true)
    setDeleteSuccess(null)
    setDeleteError(null)

    try {
      await deleteBill(billToDelete)
      setBills(bills.filter((bill) => bill.id !== billToDelete))
      setDeleteSuccess("Bill deleted successfully")

      // Close dialog after a short delay
      setTimeout(() => {
        setDeleteDialogOpen(false)
        setDeleteSuccess(null)
      }, 1500)
    } catch (err) {
      console.error("Error deleting bill:", err)
      setDeleteError(err instanceof Error ? err.message : "Failed to delete bill")
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (billId: string) => {
    setBillToDelete(billId)
    setDeleteDialogOpen(true)
    setDeleteSuccess(null)
    setDeleteError(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Replace the handleViewBill function with this:
  const handleViewBill = (billId: string) => {
    console.log("Viewing bill:", billId)
    navigateToDetails(billId)
  }

  // Replace the handleBackToCalculator function with this:
  const handleBackToCalculator = () => {
    navigateToHome()
  }

  return (
      <AuthGuard>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <AppHeader />
          <main className="flex-1 p-4 md:p-8 safe-area-padding">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Bill History</h1>
                  <p className="text-gray-600">View and manage your saved bills</p>
                </div>
                <Button variant="outline" onClick={handleBackToCalculator} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Calculator
                </Button>
              </div>

              {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}

              {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
              ) : bills.length === 0 ? (
                  <Card className="text-center p-8">
                    <CardContent className="pt-6">
                      <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-medium mb-2">No Bills Yet</h3>
                      <p className="text-gray-500 mb-6">
                        You haven't saved any bills yet. Create and save a bill to see it here.
                      </p>
                      <Button onClick={handleBackToCalculator} className="bg-magenta hover:bg-purple-dark">
                        Create a Bill
                      </Button>
                    </CardContent>
                  </Card>
              ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {bills.map((bill) => (
                        <Card key={bill.id} className="overflow-hidden card-hover glass-effect border-gray-100/50">
                          <CardHeader className="pb-2">
                            <CardTitle>{bill.name}</CardTitle>
                            <CardDescription>{formatDate(bill.date)}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-magenta">{formatCurrency(bill.billTotal)}</div>
                          </CardContent>
                          <CardFooter className="flex justify-between bg-gray-50 border-t p-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => bill.id && handleViewBill(bill.id)}
                                className="flex items-center gap-1 shadow-[0_2px_5px_rgba(165,21,140,0.15)] hover:shadow-[0_4px_8px_rgba(165,21,140,0.2)]"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => bill.id && openDeleteDialog(bill.id)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </CardFooter>
                        </Card>
                    ))}
                  </div>
              )}
            </div>
          </main>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this bill and all its data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {deleteSuccess && (
                  <Alert className="mt-2 bg-green-50 text-green-700 border-green-200">
                    <AlertDescription>{deleteSuccess}</AlertDescription>
                  </Alert>
              )}

              {deleteError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{deleteError}</AlertDescription>
                  </Alert>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDeleteBill}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isDeleting || !billToDelete}
                >
                  {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                  ) : (
                      "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {/* Debug component */}
          <DebugInfo />
        </div>
      </AuthGuard>
  )
}

