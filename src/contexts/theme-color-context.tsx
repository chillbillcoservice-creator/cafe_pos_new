"use client"

import * as React from "react"

type ThemeColor = "orange" | "blue" | "green" | "rose" | "violet"

interface ThemeColorContextType {
  themeColor: ThemeColor
  setThemeColor: (color: ThemeColor) => void
}

const ThemeColorContext = React.createContext<ThemeColorContextType | undefined>(undefined)

export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const [themeColor, setThemeColor] = React.useState<ThemeColor>("orange")

  React.useEffect(() => {
    const savedColor = localStorage.getItem("themeColor") as ThemeColor
    if (savedColor) {
      setThemeColor(savedColor)
    }
  }, [])

  React.useEffect(() => {
    const root = document.documentElement
    root.classList.remove("theme-orange", "theme-blue", "theme-green", "theme-rose", "theme-violet")
    root.classList.add(`theme-${themeColor}`)
    localStorage.setItem("themeColor", themeColor)
  }, [themeColor])

  return (
    <ThemeColorContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeColorContext.Provider>
  )
}

export function useThemeColor() {
  const context = React.useContext(ThemeColorContext)
  if (context === undefined) {
    throw new Error("useThemeColor must be used within a ThemeColorProvider")
  }
  return context
}
