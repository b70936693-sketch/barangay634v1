"use client"

import { useEffect, useState } from "react"

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const updateMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches)
    }

    updateMobile()
    window.addEventListener("resize", updateMobile)

    return () => window.removeEventListener("resize", updateMobile)
  }, [])

  return isMobile
}
