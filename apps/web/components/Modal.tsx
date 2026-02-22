"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    type?: "centered" | "side-panel";
    size?: "sm" | "md" | "lg" | "xl" | "full";
    showCloseButton?: boolean;
    closeOnBackdropClick?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full",
};

/**
 * Polished Modal component with backdrop blur and animations.
 */
export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    type = "centered",
    size = "md",
    showCloseButton = true,
    closeOnBackdropClick = true,
    className,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    // Handle ESC key to close
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden"; // Prevent scrolling
        } else {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, handleKeyDown]);

    // Focus trap implementation
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTab = (e: KeyboardEvent) => {
            if (e.key === "Tab") {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        document.addEventListener("keydown", handleTab);
        return () => document.removeEventListener("keydown", handleTab);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (closeOnBackdropClick && e.target === backdropRef.current) {
            onClose();
        }
    };

    const isSidePanel = type === "side-panel";

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
            {/* Backdrop */}
            <div
                ref={backdropRef}
                onClick={handleBackdropClick}
                className={cn(
                    "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
            />

            {/* Modal Container */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "modal-title" : undefined}
                className={cn(
                    "relative z-10 w-full bg-white shadow-2xl transition-all duration-300 ease-in-out dark:bg-zinc-900",
                    // Layout types
                    isSidePanel
                        ? "ml-auto h-full max-w-md animate-slide-in-right transform rounded-l-2xl"
                        : cn("m-4 rounded-2xl animate-fade-in-up transform", sizeClasses[size]),
                    className
                )}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
                        {title && (
                            <h3 id="modal-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                {title}
                            </h3>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="ml-auto rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className={cn("overflow-y-auto p-6", isSidePanel ? "h-[calc(100%-64px)]" : "max-h-[85vh]")}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
