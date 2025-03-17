"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Euro, Hash } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ManualItemEntryProps {
  onAddItem: (name: string, price: number, quantity?: number) => void
}

export function ManualItemEntry({ onAddItem }: ManualItemEntryProps) {
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState("")
  const [itemPrice, setItemPrice] = useState("")
  const [itemQuantity, setItemQuantity] = useState("1")
  const [error, setError] = useState<string | null>(null)

  const handleAddItem = () => {
    if (!itemName.trim()) {
      setError("Please enter an item name")
      return
    }

    const price = Number.parseFloat(itemPrice)
    if (isNaN(price) || price <= 0) {
      setError("Please enter a valid price")
      return
    }

    const quantity = Number.parseFloat(itemQuantity)
    if (isNaN(quantity) || quantity <= 0) {
      setError("Please enter a valid quantity")
      return
    }

    onAddItem(itemName.trim(), price, quantity)
    setItemName("")
    setItemPrice("")
    setItemQuantity("1")
    setError(null)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 shadow-[0_2px_5px_rgba(165,21,140,0.15)] hover:shadow-[0_4px_8px_rgba(165,21,140,0.2)] hover:bg-yellow/5 transition-all duration-300"
        >
          <Plus className="h-4 w-4" /> Add Item Manually
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
          <DialogDescription>Manually add an item from your bill</DialogDescription>
        </DialogHeader>

        {error && <div className="text-sm text-red-500 mb-2">{error}</div>}

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="item-name">Item Name</Label>
            <Input
              id="item-name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              placeholder="e.g., Pasta Carbonara"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="item-price">Unit Price</Label>
            <div className="relative">
              <Euro className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="item-price"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                className="pl-8"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="item-quantity">Quantity</Label>
            <div className="relative">
              <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="item-quantity"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
                placeholder="1"
                type="number"
                step="1"
                min="1"
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="shadow-[0_2px_5px_rgba(165,21,140,0.15)] hover:shadow-[0_4px_8px_rgba(165,21,140,0.2)] hover:bg-yellow/5 transition-all duration-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddItem}
            className="bg-magenta hover:bg-purple-dark shadow-[0_2px_5px_rgba(165,21,140,0.2)] hover:shadow-[0_4px_8px_rgba(165,21,140,0.3)]"
          >
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

