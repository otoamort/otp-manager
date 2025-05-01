import * as React from "react"

/**
 * The width in pixels below which a device is considered mobile.
 * Standard breakpoint for tablets is typically 768px.
 */
const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect whether the current device is a mobile device based on screen width.
 * Uses media queries to detect screen size and updates when the window is resized.
 * 
 * @returns A boolean indicating whether the current device is mobile (true) or desktop (false)
 */
export function useIsMobile() {
  // Initially undefined until we can check the window size
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Create a media query list for the mobile breakpoint
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    // Handler for when the media query changes (e.g., window resize)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Add event listener and set initial value
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // Clean up event listener on component unmount
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Convert undefined to false and ensure boolean return type
  return !!isMobile
}
