"use client"

import type * as React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, ...props }: CalendarProps) {
  return <DayPicker className={className} {...props} />
}
Calendar.displayName = "Calendar"

export { Calendar }

