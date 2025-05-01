"use client"

/**
 * Toast notification system inspired by react-hot-toast library.
 * Provides a way to display and manage toast notifications in the application.
 */
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

/** Maximum number of toasts that can be displayed at once */
const TOAST_LIMIT = 1
/** Time in milliseconds before a dismissed toast is removed from the DOM */
const TOAST_REMOVE_DELAY = 3000

/**
 * Extended toast properties including ID and content elements.
 */
type ToasterToast = ToastProps & {
  /** Unique identifier for the toast */
  id: string
  /** Title content of the toast */
  title?: React.ReactNode
  /** Description content of the toast */
  description?: React.ReactNode
  /** Optional action element (like a button) to display in the toast */
  action?: ToastActionElement
}

/**
 * Action types for the toast reducer.
 * These define the possible operations that can be performed on toasts.
 */
const actionTypes = {
  /** Add a new toast to the list */
  ADD_TOAST: "ADD_TOAST",
  /** Update an existing toast's properties */
  UPDATE_TOAST: "UPDATE_TOAST",
  /** Mark a toast as dismissed (starts the removal process) */
  DISMISS_TOAST: "DISMISS_TOAST",
  /** Remove a toast from the DOM completely */
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

/** Counter for generating unique toast IDs */
let count = 0

/**
 * Generates a unique ID for a toast notification.
 * Uses a simple counter that wraps around at MAX_SAFE_INTEGER.
 * 
 * @returns A string representation of the unique ID
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

/** Type representing the action types object */
type ActionType = typeof actionTypes

/**
 * Union type representing all possible actions that can be dispatched to the toast reducer.
 * Each action has a type and additional data specific to that action.
 */
type Action =
  | {
      /** Action to add a new toast */
      type: ActionType["ADD_TOAST"]
      /** The toast to add */
      toast: ToasterToast
    }
  | {
      /** Action to update an existing toast */
      type: ActionType["UPDATE_TOAST"]
      /** Partial toast data to update */
      toast: Partial<ToasterToast>
    }
  | {
      /** Action to dismiss a toast (start removal process) */
      type: ActionType["DISMISS_TOAST"]
      /** ID of the toast to dismiss, or undefined to dismiss all */
      toastId?: ToasterToast["id"]
    }
  | {
      /** Action to remove a toast from the DOM */
      type: ActionType["REMOVE_TOAST"]
      /** ID of the toast to remove, or undefined to remove all */
      toastId?: ToasterToast["id"]
    }

/**
 * Interface representing the state of the toast system.
 */
interface State {
  /** Array of all active toast notifications */
  toasts: ToasterToast[]
}

/** Map to track timeouts for toast removal */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Adds a toast to the removal queue, scheduling it to be removed after a delay.
 * If the toast is already in the queue, this function does nothing.
 * 
 * @param toastId - The ID of the toast to schedule for removal
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

/**
 * Reducer function for managing toast state.
 * Handles adding, updating, dismissing, and removing toasts based on dispatched actions.
 * 
 * @param state - The current state of the toast system
 * @param action - The action to process
 * @returns The new state after processing the action
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      // Add a new toast to the beginning of the array, respecting the toast limit
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      // Update an existing toast's properties
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        // Schedule a specific toast for removal
        addToRemoveQueue(toastId)
      } else {
        // Schedule all toasts for removal
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      // Mark the specified toast(s) as closed
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        // Remove all toasts
        return {
          ...state,
          toasts: [],
        }
      }
      // Remove a specific toast
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

/** Array of listener functions that will be called when the state changes */
const listeners: Array<(state: State) => void> = []

/** In-memory state that persists between component renders */
let memoryState: State = { toasts: [] }

/**
 * Dispatches an action to update the toast state.
 * Updates the in-memory state and notifies all listeners.
 * 
 * @param action - The action to dispatch
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

/** Type for toast properties without the ID (used when creating a new toast) */
type Toast = Omit<ToasterToast, "id">

/**
 * Creates and displays a new toast notification.
 * 
 * @param props - The properties for the toast
 * @returns An object with methods to control the toast (dismiss, update) and its ID
 */
function toast({ ...props }: Toast) {
  const id = genId()

  /**
   * Updates the properties of this toast.
   * 
   * @param props - The new properties to apply to the toast
   */
  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })

  /**
   * Dismisses this toast, starting the removal process.
   */
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  // Add the toast to the state
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

/**
 * Hook for using the toast system in React components.
 * Provides access to the current toasts and methods to create, update, and dismiss toasts.
 * 
 * @returns An object containing the current toasts and methods to control them
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  // Subscribe to state changes when the component mounts
  // and unsubscribe when it unmounts
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
