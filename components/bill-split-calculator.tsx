"use client"

import type React from "react"

import { useState } from "react"
import { BillUploader } from "./bill-uploader"
import { BillItemsList } from "./bill-items-list"
import { PeopleManager } from "./people-manager"
import { SplitSummary } from "./split-summary"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Camera, Users, Receipt, Calculator } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export type BillItem = {
  id: string
  name: string
  price: number // This is now the unit price
  quantity: number // New field for quantity
  totalPrice: number // New field for total price (price * quantity)
  assignedTo: string[]
}

export type Person = {
  id: string
  name: string
  isPayer: boolean
  color?: string
}

// Array of colors for user avatars - updated with our new palette
const AVATAR_COLORS = [
  "bg-purple-dark",
  "bg-magenta",
  "bg-pink",
  "bg-yellow",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-red-500",
]

export function BillSplitCalculator() {
  const [step, setStep] = useState<"upload" | "people" | "items" | "summary">("upload")
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [isOcrLoading, setIsOcrLoading] = useState(false)
  const [billTotal, setBillTotal] = useState(0)

  const handleOcrComplete = (items: BillItem[], total: number) => {
    setBillItems(items)
    setBillTotal(total)
    setStep("people") // Go to people step first
    setIsOcrLoading(false)
  }

  const handleStartOcr = () => {
    setIsOcrLoading(!isOcrLoading) // Toggle loading state
  }

  const handleAssignItem = (itemId: string, personId: string, isAssigned: boolean) => {
    setBillItems(
      billItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            assignedTo: isAssigned ? [...item.assignedTo, personId] : item.assignedTo.filter((id) => id !== personId),
          }
        }
        return item
      }),
    )
  }

  const handleAddItem = (name: string, price: number, quantity = 1) => {
    const totalPrice = price * quantity

    const newItem: BillItem = {
      id: `item-${Date.now()}`,
      name,
      price, // Unit price
      quantity,
      totalPrice,
      assignedTo: [],
    }

    setBillItems([...billItems, newItem])
    setBillTotal(billTotal + totalPrice)
  }

  const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
    setBillItems(
      billItems.map((item) => {
        if (item.id === itemId) {
          const newTotalPrice = item.price * quantity
          const oldTotalPrice = item.totalPrice

          // Update the bill total
          setBillTotal(billTotal - oldTotalPrice + newTotalPrice)

          return {
            ...item,
            quantity,
            totalPrice: newTotalPrice,
          }
        }
        return item
      }),
    )
  }

  const handleRemoveItem = (itemId: string) => {
    const itemToRemove = billItems.find((item) => item.id === itemId)
    if (itemToRemove) {
      setBillItems(billItems.filter((item) => item.id !== itemId))
      setBillTotal(billTotal - itemToRemove.totalPrice)
    }
  }

  const handleAddPerson = (name: string) => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name,
      isPayer: people.length === 0, // First person is the payer by default
      color: AVATAR_COLORS[people.length % AVATAR_COLORS.length],
    }
    setPeople([...people, newPerson])
  }

  const handleSetPayer = (personId: string) => {
    setPeople(
      people.map((person) => ({
        ...person,
        isPayer: person.id === personId,
      })),
    )
  }

  const handleRemovePerson = (personId: string) => {
    setPeople(people.filter((person) => person.id !== personId))

    // Remove this person from all item assignments
    setBillItems(
      billItems.map((item) => ({
        ...item,
        assignedTo: item.assignedTo.filter((id) => id !== personId),
      })),
    )
  }

  const getStepProgress = () => {
    switch (step) {
      case "upload":
        return 25
      case "people":
        return 50
      case "items":
        return 75
      case "summary":
        return 100
      default:
        return 0
    }
  }

  const nextStep = () => {
    if (step === "upload") setStep("people")
    else if (step === "people") setStep("items")
    else if (step === "items") setStep("summary")
  }

  const prevStep = () => {
    if (step === "summary") setStep("items")
    else if (step === "items") setStep("people")
    else if (step === "people") setStep("upload")
  }

  // Custom tab navigation instead of using the Tabs component
  const renderTabContent = () => {
    switch (step) {
      case "upload":
        return <BillUploader onStartOcr={handleStartOcr} isLoading={isOcrLoading} onOcrComplete={handleOcrComplete} />
      case "people":
        return (
          <PeopleManager
            people={people}
            onAddPerson={handleAddPerson}
            onRemovePerson={handleRemovePerson}
            onSetPayer={handleSetPayer}
          />
        )
      case "items":
        return (
          <BillItemsList
            items={billItems}
            people={people}
            onAssignItem={handleAssignItem}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onUpdateItemQuantity={handleUpdateItemQuantity}
            billTotal={billTotal}
          />
        )
      case "summary":
        return <SplitSummary billItems={billItems} people={people} billTotal={billTotal} />
      default:
        return null
    }
  }

  return (
    <div className="glass-effect rounded-xl shadow-xl p-6 overflow-hidden border border-gray-100">
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm font-medium">{getStepProgress()}%</span>
        </div>
        <Progress value={getStepProgress()} className="h-2 [&>div]:bg-magenta" />
      </div>

      {/* Custom tab navigation */}
      <div className="w-full bg-gray-50/70 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-200/80">
        {/* Tab buttons */}
        <div className="flex w-full">
          <TabButton
            isActive={step === "upload"}
            onClick={() => setStep("upload")}
            disabled={isOcrLoading}
            icon={<Camera className="h-4 w-4" />}
            label="Upload Bill"
          />
          <TabButton
            isActive={step === "people"}
            onClick={() => setStep("people")}
            disabled={billItems.length === 0 || isOcrLoading}
            icon={<Users className="h-4 w-4" />}
            label="Add People"
          />
          <TabButton
            isActive={step === "items"}
            onClick={() => setStep("items")}
            disabled={people.length === 0 || isOcrLoading}
            icon={<Receipt className="h-4 w-4" />}
            label="Assign Items"
          />
          <TabButton
            isActive={step === "summary"}
            onClick={() => setStep("summary")}
            disabled={people.length === 0 || isOcrLoading}
            icon={<Calculator className="h-4 w-4" />}
            label="Summary"
          />
        </div>

        {/* Tab content */}
        <div className="subtle-pattern p-6 bg-white/90 backdrop-blur-sm">{renderTabContent()}</div>
      </div>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === "upload" || isOcrLoading}
          className="flex items-center gap-2 shadow-[0_2px_5px_rgba(65,4,69,0.15)] hover:shadow-[0_4px_8px_rgba(65,4,69,0.2)] bg-white/80 backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <Button
          onClick={nextStep}
          disabled={
            (step === "upload" && billItems.length === 0) ||
            (step === "people" && people.length === 0) ||
            step === "summary" ||
            isOcrLoading
          }
          className="flex items-center gap-2 bg-magenta hover:bg-purple-dark shadow-[0_2px_5px_rgba(165,21,140,0.2)] hover:shadow-[0_4px_8px_rgba(165,21,140,0.3)]"
        >
          Next <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Custom TabButton component
function TabButton({
  isActive,
  onClick,
  disabled,
  icon,
  label,
}: {
  isActive: boolean
  onClick: () => void
  disabled?: boolean
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-1 flex-col sm:flex-row items-center justify-center gap-1 py-3 px-2 transition-all",
        "text-xs sm:text-sm font-medium relative",
        isActive
          ? "bg-white/90 backdrop-blur-sm text-black font-semibold shadow-[0_2px_5px_rgba(165,21,140,0.15)]"
          : "bg-transparent text-gray-500 hover:bg-gray-100/50 hover:text-gray-700",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {icon}
      <span>{label}</span>
      {isActive && <div className="absolute top-0 left-0 w-full h-1 bg-magenta"></div>}
    </button>
  )
}

