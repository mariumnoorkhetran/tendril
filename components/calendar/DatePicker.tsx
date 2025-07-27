"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  onDateSelect: (date: Date | undefined) => void;
  selectedDate: Date | undefined;
}

export default function DatePicker({ onDateSelect, selectedDate }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!selectedDate}
          className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal bg-[#795663] hover:bg-[#795663]/90 text-white hover:text-white"
        >
          <CalendarIcon className="text-white"/>
          {selectedDate ? format(selectedDate, "PPP") : <span className="text-white">Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar 
          mode="single" 
          selected={selectedDate} 
          onSelect={onDateSelect}
        />
      </PopoverContent>
    </Popover>
  )
}