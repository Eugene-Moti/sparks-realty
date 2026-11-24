"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";

/**
 * Admin-wide client bits: light palette for portals (dialogs, toasts and
 * popovers render into <body>), and the toast host.
 */
export function AdminRoot() {
  useEffect(() => {
    document.body.classList.add("light-scope");
    return () => document.body.classList.remove("light-scope");
  }, []);

  return (
    <Toaster
      position="top-center"
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border !border-hairline !bg-surface !text-foreground !shadow-lift !font-sans",
          description: "!text-muted",
          success: "[&_[data-icon]]:!text-green-600",
          error: "[&_[data-icon]]:!text-danger",
        },
      }}
    />
  );
}
