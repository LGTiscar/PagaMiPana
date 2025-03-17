"use client"

import { useState } from "react"
import type { BillItem, Person } from "./bill-split-calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash, Search, Plus, Minus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ManualItemEntry } from "./manual-item-entry"
import { formatCurrency } from "@/utils/share-utils"

interface BillItemsListProps {
  items: BillItem[]
  people: Person[]
  onAssignItem: (itemId: string, personId: string, isAssigned: boolean) => void
  onAddItem: (name: string, price: number, quantity?: number) => void
  onRemoveItem: (itemId: string) => void
  onUpdateItemQuantity: (itemId: string, quantity: number) => void
  billTotal: number
}

export function BillItemsList({
  items,
  people,
  onAssignItem,
  onAddItem,
  onRemoveItem,
  onUpdateItemQuantity,
  billTotal,
}: BillItemsListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const filteredItems = items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      onUpdateItemQuantity(itemId, newQuantity)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Step 3: Assign Items to People</h2>
        <p className="text-gray-500 mt-1">Select who participated in each item</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search items..."
            className="pl-8 bg-white/80 backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-right ml-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-magenta">{formatCurrency(billTotal)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className="overflow-hidden card-hover glass-effect border-gray-100/50 hover:subtle-yellow-border transition-all duration-300"
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-magenta">{formatCurrency(item.totalPrice)}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem(item.id)}
                    className="h-8 w-8 text-gray-500 hover:text-red-500"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Label className="text-sm text-gray-500 mr-2">Quantity:</Label>
                  <div className="flex items-center border rounded-md bg-white/80 hover:bg-yellow/5 transition-all duration-300">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-r-none"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-l-none"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  <span>Unit price: {formatCurrency(item.price)}</span>
                </div>
              </div>

              <div className="mt-2">
                <Label className="text-sm text-gray-500 mb-2 block">Who had this item?</Label>
                <div className="flex flex-wrap gap-2">
                  {people.map((person) => {
                    const isAssigned = item.assignedTo.includes(person.id)
                    return (
                      <Badge
                        key={person.id}
                        variant={isAssigned ? "default" : "outline"}
                        className={`cursor-pointer flex items-center gap-1 ${
                          isAssigned ? person.color : "bg-white/80 backdrop-blur-sm hover:bg-gray-100"
                        } ${isAssigned ? "text-white" : "text-gray-700"}`}
                        onClick={() => onAssignItem(item.id, person.id, !isAssigned)}
                      >
                        <Avatar className={`h-5 w-5 ${isAssigned ? "bg-white/20" : person.color}`}>
                          <AvatarFallback className="text-xs">{getInitials(person.name)}</AvatarFallback>
                        </Avatar>
                        {person.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              {item.assignedTo.length > 0 && (
                <div className="mt-3 text-sm text-purple-dark">
                  <span className="font-medium">Split:</span> {formatCurrency(item.totalPrice / item.assignedTo.length)}{" "}
                  per person
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center p-8 bg-gray-50/70 backdrop-blur-sm rounded-lg border border-dashed border-gray-200/80">
            <p className="text-gray-500">No items found matching your search.</p>
            <p className="text-gray-500 mt-2">
              {items.length === 0
                ? "The OCR service couldn't detect any items. Try uploading a clearer image or add items manually."
                : "Try adjusting your search or add items manually using the button below."}
            </p>
            <Button
              variant="outline"
              className="mt-4 bg-white/80 backdrop-blur-sm shadow-[0_2px_5px_rgba(165,21,140,0.15)]"
              onClick={() => setSearchTerm("")}
            >
              {items.length === 0 ? "Add Items Manually" : "Clear Search"}
            </Button>
          </div>
        )}

        <ManualItemEntry onAddItem={onAddItem} />
      </div>

      <div className="bg-purple-dark/5 backdrop-blur-sm p-4 rounded-lg border border-purple-dark/10 subtle-yellow-bg">
        <h3 className="text-sm font-medium text-purple-dark mb-2">How to assign items:</h3>
        <ol className="text-sm text-purple-dark list-decimal list-inside space-y-1">
          <li>Adjust the quantity of each item if needed</li>
          <li>Click on a person's badge to assign them to an item</li>
          <li>Click again to remove them from the item</li>
          <li>Each item's cost will be split equally among assigned people</li>
          <li>Items not assigned to anyone will be split equally among all participants</li>
        </ol>
      </div>
    </div>
  )
}

