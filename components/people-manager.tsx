"use client"

import { useState } from "react"
import type { Person } from "./bill-split-calculator"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CreditCard, Plus, Trash } from "lucide-react"

interface PeopleManagerProps {
  people: Person[]
  onAddPerson: (name: string) => void
  onRemovePerson: (id: string) => void
  onSetPayer: (id: string) => void
}

export function PeopleManager({ people, onAddPerson, onRemovePerson, onSetPayer }: PeopleManagerProps) {
  const [newPersonName, setNewPersonName] = useState("")

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      onAddPerson(newPersonName.trim())
      setNewPersonName("")
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Step 2: Add People to Split With</h2>
        <p className="text-gray-500 mt-1">Add everyone who's splitting the bill</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {people.map((person) => (
          <Card key={person.id} className="card-hover glass-effect border-gray-100/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className={person.color}>
                  <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{person.name}</span>
                {person.isPayer && (
                  <span className="bg-yellow/20 text-purple-dark text-xs px-2 py-1 rounded-full flex items-center">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Paid the bill
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemovePerson(person.id)}
                  className="h-8 w-8 text-gray-500 hover:text-red-500"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <Input
          placeholder="Add person's name"
          value={newPersonName}
          onChange={(e) => setNewPersonName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddPerson()
            }
          }}
          className="bg-white/80 backdrop-blur-sm"
        />
        <Button
          onClick={handleAddPerson}
          disabled={!newPersonName.trim()}
          className="bg-magenta hover:bg-purple-dark shadow-[0_2px_5px_rgba(165,21,140,0.2)] hover:shadow-[0_4px_8px_rgba(165,21,140,0.3)]"
        >
          <Plus className="h-4 w-4 mr-2" /> Add
        </Button>
      </div>

      {people.length > 0 && (
        <div className="p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100/50 shadow-sm">
          <h3 className="text-lg font-medium mb-3">Who Paid the Bill?</h3>
          <RadioGroup defaultValue={people.find((p) => p.isPayer)?.id || people[0].id} onValueChange={onSetPayer}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {people.map((person) => (
                <div key={person.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={person.id} id={`payer-${person.id}`} className="text-magenta" />
                  <Label htmlFor={`payer-${person.id}`} className="flex items-center gap-2">
                    <Avatar className={`h-6 w-6 ${person.color}`}>
                      <AvatarFallback className="text-xs">{getInitials(person.name)}</AvatarFallback>
                    </Avatar>
                    {person.name}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}

      <div className="bg-purple-dark/10 backdrop-blur-sm p-4 rounded-lg border border-purple-dark/20">
        <h3 className="text-sm font-medium text-purple-dark mb-2">Next step:</h3>
        <p className="text-sm text-purple-dark">
          After adding everyone, you'll assign bill items to each person in the next step.
        </p>
      </div>
    </div>
  )
}

