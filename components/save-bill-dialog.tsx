"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Save } from "lucide-react"
import { saveBill } from "@/utils/database"
import type { BillItem, Person } from "./bill-split-calculator"

interface SaveBillDialogProps {
  billItems: BillItem[]
  people: Person[]
  billTotal: number
}

export function SaveBillDialog({ billItems, people, billTotal }: SaveBillDialogProps) {
  const [open, setOpen] = useState(false)
  const [billName, setBillName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSaveBill = async () => {
    if (!billName.trim()) {
      setError("Please enter a name for this bill")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      const billId = await saveBill({
        name: billName,
        billTotal,
        people,
        items: billItems,
      })

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        router.push("/history")
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save bill")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Bill</DialogTitle>
          <DialogDescription>Save this bill to your history to view it later.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription className="text-green-600">Bill saved successfully!</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bill-name" className="text-right">
              Bill Name
            </Label>
            <Input
              id="bill-name"
              placeholder="e.g., Dinner with friends"
              className="col-span-3"
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Total</Label>
            <div className="col-span-3 font-medium">${billTotal.toFixed(2)}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">People</Label>
            <div className="col-span-3">{people.length} people</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Items</Label>
            <div className="col-span-3">{billItems.length} items</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSaveBill} disabled={isLoading || !billName.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Bill"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

