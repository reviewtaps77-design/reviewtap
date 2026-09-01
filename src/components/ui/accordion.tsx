"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextType {
  openItem: string | null;
  toggleItem: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextType | undefined>(undefined);

export function Accordion({
  children,
  className,
  defaultValue = null,
  type = "single",
  collapsible = true,
}: {
  children: React.ReactNode;
  className?: string;
  defaultValue?: string | null;
  type?: "single";
  collapsible?: boolean;
}) {
  const [openItem, setOpenItem] = React.useState<string | null>(defaultValue);

  const toggleItem = (value: string) => {
    if (openItem === value) {
      if (collapsible) setOpenItem(null);
    } else {
      setOpenItem(value);
    }
  };

  return (
    <AccordionContext.Provider value={{ openItem, toggleItem }}>
      <div className={cn("space-y-2 divide-y divide-gray-200", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <div data-value={value} className={cn("py-2", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { itemValue: value } as any);
        }
        return child;
      })}
    </div>
  );
}

export function AccordionTrigger({
  children,
  className,
  itemValue,
}: {
  children: React.ReactNode;
  className?: string;
  itemValue?: string;
}) {
  const context = React.useContext(AccordionContext);
  if (!context) throw new Error("AccordionTrigger must be used within Accordion");

  const isOpen = context.openItem === itemValue;

  return (
    <button
      type="button"
      onClick={() => itemValue && context.toggleItem(itemValue)}
      className={cn(
        "flex w-full items-center justify-between py-3 text-left font-medium text-gray-900 transition-all hover:text-primary",
        className
      )}
    >
      <span>{children}</span>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200",
          isOpen && "rotate-180 text-primary"
        )}
      />
    </button>
  );
}

export function AccordionContent({
  children,
  className,
  itemValue,
}: {
  children: React.ReactNode;
  className?: string;
  itemValue?: string;
}) {
  const context = React.useContext(AccordionContext);
  if (!context) throw new Error("AccordionContent must be used within Accordion");

  const isOpen = context.openItem === itemValue;

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "pt-1 pb-3 text-sm text-gray-600 animate-in fade-in-50 duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}
