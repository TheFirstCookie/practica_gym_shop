"use client";

import { useEffect, useRef, useState } from "react";
import type { FocusEvent, PointerEvent } from "react";

// Shared behaviour for the site's dropdowns: a mouse opens them on hover,
// touch and keyboard toggle them on click. They close on an outside click,
// on Escape, or when focus leaves the menu.
export function useHoverMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastPointerType = useRef("");

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: globalThis.PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const containerProps = {
    ref: menuRef,
    onPointerEnter(event: PointerEvent) {
      if (event.pointerType === "mouse") {
        setOpen(true);
      }
    },
    onPointerLeave(event: PointerEvent) {
      if (event.pointerType === "mouse") {
        setOpen(false);
      }
    },
    onBlur(event: FocusEvent<HTMLDivElement>) {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setOpen(false);
      }
    }
  };

  const triggerProps = {
    "aria-expanded": open,
    onPointerDown(event: PointerEvent) {
      lastPointerType.current = event.pointerType;
    },
    onClick() {
      // A mouse already opened the menu on hover, so a click shouldn't close it.
      if (lastPointerType.current === "mouse") {
        setOpen(true);
      } else {
        setOpen((isOpen) => !isOpen);
      }

      lastPointerType.current = "";
    }
  };

  return { open, setOpen, containerProps, triggerProps };
}
