"use client"

import * as React from "react"
import { Check, Palette } from "lucide-react"

import { cn } from "@/lib/utils"
import { useThemeColor } from "@/contexts/theme-color-context"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themeColors = [
    { name: "orange", label: "Orange", color: "hsl(25, 80%, 55%)" },
    { name: "blue", label: "Blue", color: "hsl(221, 83%, 53%)" },
    { name: "green", label: "Green", color: "hsl(142, 71%, 45%)" },
    { name: "rose", label: "Rose", color: "hsl(346, 84%, 61%)" },
    { name: "violet", label: "Violet", color: "hsl(262, 83%, 58%)" },
] as const

export function ThemeColorPicker() {
    const { themeColor, setThemeColor } = useThemeColor()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Palette className="h-4 w-4" />
                    <span className="sr-only">Toggle theme color</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {themeColors.map(({ name, label, color }) => (
                    <DropdownMenuItem
                        key={name}
                        onClick={() => setThemeColor(name)}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className="h-4 w-4 rounded-full border"
                                style={{ backgroundColor: color }}
                            />
                            <span className="capitalize">{label}</span>
                        </div>
                        {themeColor === name && <Check className="ml-2 h-4 w-4 opacity-100" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
