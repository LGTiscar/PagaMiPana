import { supabase } from "./supabase-client"
import type { BillItem, Person } from "@/components/bill-split-calculator"

// Interface for saved bill data
export interface SavedBill {
  id?: string
  name: string
  date: string
  billTotal: number
  people: Person[]
  items: BillItem[]
}

// Fix the variable naming conflict in the saveBill function

// Change this function signature and references inside
export async function saveBill(bill: {
  name: string
  billTotal: number
  people: Person[]
  items: BillItem[]
}): Promise<string | null> {
  try {
    // 1. Insert the bill
    const { data: insertedBill, error: billError } = await supabase
      .from("bills")
      .insert({
        name: bill.name,
        bill_total: bill.billTotal,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      })
      .select("id")
      .single()

    if (billError || !insertedBill) {
      console.error("Error saving bill:", billError)
      throw new Error(billError?.message || "Failed to save bill")
    }

    const billId = insertedBill.id

    // 2. Insert people
    const peopleToInsert = bill.people.map((person) => ({
      bill_id: billId,
      name: person.name,
      is_payer: person.isPayer,
      color: person.color,
    }))

    const { data: peopleData, error: peopleError } = await supabase
      .from("people")
      .insert(peopleToInsert)
      .select("id, name")

    if (peopleError) {
      console.error("Error saving people:", peopleError)
      throw new Error(peopleError.message)
    }

    // Create a map of original person IDs to new database IDs
    const personIdMap = new Map<string, string>()
    if (peopleData) {
      bill.people.forEach((person, index) => {
        if (peopleData[index]) {
          personIdMap.set(person.id, peopleData[index].id)
        }
      })
    }

    // 3. Insert bill items
    const itemsToInsert = bill.items.map((item) => ({
      bill_id: billId,
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
      total_price: item.totalPrice || item.price * (item.quantity || 1),
    }))

    const { data: itemsData, error: itemsError } = await supabase.from("bill_items").insert(itemsToInsert).select("id")

    if (itemsError) {
      console.error("Error saving bill items:", itemsError)
      throw new Error(itemsError.message)
    }

    // 4. Insert item assignments
    if (itemsData) {
      const assignments = []

      for (let i = 0; i < bill.items.length; i++) {
        const item = bill.items[i]
        const dbItemId = itemsData[i]?.id

        if (dbItemId) {
          for (const personId of item.assignedTo) {
            const dbPersonId = personIdMap.get(personId)
            if (dbPersonId) {
              assignments.push({
                bill_item_id: dbItemId,
                person_id: dbPersonId,
              })
            }
          }
        }
      }

      if (assignments.length > 0) {
        const { error: assignmentError } = await supabase.from("item_assignments").insert(assignments)

        if (assignmentError) {
          console.error("Error saving item assignments:", assignmentError)
          throw new Error(assignmentError.message)
        }
      }
    }

    return billId
  } catch (error) {
    console.error("Error in saveBill:", error)
    throw error
  }
}

// Get all bills for the current user
export async function getUserBills(): Promise<SavedBill[]> {
  try {
    const { data: bills, error: billsError } = await supabase
      .from("bills")
      .select("id, name, date, bill_total, created_at")
      .order("created_at", { ascending: false })

    if (billsError) {
      console.error("Error fetching bills:", billsError)
      throw new Error(billsError.message)
    }

    return bills.map((bill) => ({
      id: bill.id,
      name: bill.name,
      date: new Date(bill.date).toISOString(),
      billTotal: bill.bill_total,
      people: [],
      items: [],
    }))
  } catch (error) {
    console.error("Error in getUserBills:", error)
    throw error
  }
}

// Get a single bill with all its details
export async function getBillDetails(billId: string): Promise<SavedBill | null> {
  try {
    // 1. Get the bill
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .select("id, name, date, bill_total")
      .eq("id", billId)
      .single()

    if (billError) {
      console.error("Error fetching bill:", billError)
      throw new Error(billError.message)
    }

    if (!bill) return null

    // 2. Get the people
    const { data: people, error: peopleError } = await supabase
      .from("people")
      .select("id, name, is_payer, color")
      .eq("bill_id", billId)

    if (peopleError) {
      console.error("Error fetching people:", peopleError)
      throw new Error(peopleError.message)
    }

    // 3. Get the bill items
    const { data: items, error: itemsError } = await supabase
      .from("bill_items")
      .select("id, name, price, quantity, total_price")
      .eq("bill_id", billId)

    if (itemsError) {
      console.error("Error fetching bill items:", itemsError)
      throw new Error(itemsError.message)
    }

    // 4. Get the item assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from("item_assignments")
      .select("bill_item_id, person_id")
      .in(
        "bill_item_id",
        items.map((item) => item.id),
      )

    if (assignmentsError) {
      console.error("Error fetching item assignments:", assignmentsError)
      throw new Error(assignmentsError.message)
    }

    // Convert to our app's data structure
    const formattedPeople: Person[] = people.map((person) => ({
      id: person.id,
      name: person.name,
      isPayer: person.is_payer,
      color: person.color,
    }))

    const formattedItems: BillItem[] = items.map((item) => {
      // Find all assignments for this item
      const itemAssignments = assignments.filter((a) => a.bill_item_id === item.id)
      const assignedTo = itemAssignments.map((a) => a.person_id)

      return {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.total_price,
        assignedTo,
      }
    })

    return {
      id: bill.id,
      name: bill.name,
      date: new Date(bill.date).toISOString(),
      billTotal: bill.bill_total,
      people: formattedPeople,
      items: formattedItems,
    }
  } catch (error) {
    console.error("Error in getBillDetails:", error)
    throw error
  }
}

// Delete a bill
export async function deleteBill(billId: string): Promise<boolean> {
  try {
    // First, get all bill items for this bill
    const { data: billItems, error: itemsQueryError } = await supabase
      .from("bill_items")
      .select("id")
      .eq("bill_id", billId)

    if (itemsQueryError) {
      console.error("Error querying bill items:", itemsQueryError)
      throw new Error(itemsQueryError.message)
    }

    // Extract the item IDs
    const billItemIds = billItems.map((item) => item.id)

    // Only proceed with item assignments deletion if there are bill items
    if (billItemIds.length > 0) {
      // 1. Delete item assignments for these bill items
      const { error: assignmentsError } = await supabase
        .from("item_assignments")
        .delete()
        .in("bill_item_id", billItemIds)

      if (assignmentsError) {
        console.error("Error deleting item assignments:", assignmentsError)
        throw new Error(assignmentsError.message)
      }
    }

    // 2. Delete bill items
    const { error: itemsError } = await supabase.from("bill_items").delete().eq("bill_id", billId)

    if (itemsError) {
      console.error("Error deleting bill items:", itemsError)
      throw new Error(itemsError.message)
    }

    // 3. Delete people
    const { error: peopleError } = await supabase.from("people").delete().eq("bill_id", billId)

    if (peopleError) {
      console.error("Error deleting people:", peopleError)
      throw new Error(peopleError.message)
    }

    // 4. Finally delete the bill itself
    const { error: billError } = await supabase.from("bills").delete().eq("id", billId)

    if (billError) {
      console.error("Error deleting bill:", billError)
      throw new Error(billError.message)
    }

    return true
  } catch (error) {
    console.error("Error in deleteBill:", error)
    throw error
  }
}

