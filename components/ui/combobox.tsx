"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export interface ComboboxOption {
  value: string;
  label: string;
  image?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
}

export function Combobox({
  options = [],
  value = [],
  onChange,
  placeholder = "Select items...",
  emptyText = "No items found.",
  searchPlaceholder = "Search...",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Ensure options is an array and filter out any undefined values
  const safeOptions = Array.isArray(options) ? options.filter(Boolean) : [];

  // Filter options based on search query
  const filteredOptions = safeOptions.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected items' labels
  const selectedLabels = value
    .map((v) => safeOptions.find((opt) => opt.value === v)?.label)
    .filter(Boolean)
    .join(", ");

  // Get initials from label
  const getInitials = (label: string) => {
    return label
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">{selectedLabels || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => {
                  const newValue = value.includes(option.value)
                    ? value.filter((v) => v !== option.value)
                    : [...value, option.value];
                  onChange(newValue);
                }}
                className="flex items-center gap-2 px-4 py-2"
              >
                <Avatar className="h-6 w-6">
                  {option.image ? (
                    <AvatarImage src={option.image} alt={option.label} />
                  ) : null}
                  <AvatarFallback>{getInitials(option.label)}</AvatarFallback>
                </Avatar>
                <span className="flex-1">{option.label}</span>
                <Check
                  className={cn(
                    "h-4 w-4",
                    value.includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
