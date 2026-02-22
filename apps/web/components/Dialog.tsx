"use client";

import React from "react";
import { Modal } from "./Modal";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    type?: "centered" | "side-panel";
    size?: "sm" | "md" | "lg" | "xl" | "full";
    children: React.ReactNode;
    className?: string;
}

/**
 * Dialog component for consistent form or confirmation layouts.
 */
export function Dialog({
    isOpen,
    onClose,
    title,
    type,
    size,
    children,
    className,
}: DialogProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            type={type}
            size={size}
            className={className}
        >
            <div className="flex flex-col gap-4">{children}</div>
        </Modal>
    );
}

/**
 * Sub-components for Dialog structure
 */

export function DialogHeader({
    title,
    description,
    className,
}: {
    title: string;
    description?: string;
    className?: string;
}) {
    return (
        <div className={cn("mb-4 flex flex-col space-y-1.5 text-center sm:text-left", className)}>
            <h3 className="text-lg font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-100">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {description}
                </p>
            )}
        </div>
    );
}

export function DialogBody({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <div className={cn("py-2", className)}>{children}</div>;
}

export function DialogFooter({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
                className
            )}
        >
            {children}
        </div>
    );
}
