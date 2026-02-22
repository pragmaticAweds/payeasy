"use client";

import { useState, useCallback } from "react";

/**
 * Hook to manage modal open/close state.
 * 
 * @param initialOpen Initial state of the modal (default: false)
 * @returns [isOpen, open, close, toggle]
 */
export function useModal(initialOpen = false) {
    const [isOpen, setIsOpen] = useState(initialOpen);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

    return {
        isOpen,
        open,
        close,
        toggle,
    };
}
