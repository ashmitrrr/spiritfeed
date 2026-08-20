"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import type { GroupMember } from "@/lib/members"
import { spiritAnimalTagline } from "@/lib/spirit-animals"
import { Avatar } from "./Avatar"
import { NotificationToggle } from "./NotificationToggle"
import { SignOutButton } from "./SignOutButton"

/**
 * Top-right overflow menu: notifications, admin link, sign out, and the
 * member roster — everything the header used to spread across separate
 * buttons, now tucked behind one hamburger so the header stays uncluttered.
 */
export function HeaderMenu({
  isAdmin,
  members,
}: {
  isAdmin: boolean
  members: GroupMember[]
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menu"
        className="pixel-chip flex h-9 w-9 flex-col items-center justify-center gap-1"
      >
        <span className="block h-0.5 w-4 bg-ink" />
        <span className="block h-0.5 w-4 bg-ink" />
        <span className="block h-0.5 w-4 bg-ink" />
      </button>

      {open && (
        <div className="pixel-panel absolute right-0 top-full z-20 mt-2 w-72 p-3">
          <div className="flex flex-col items-start gap-2 border-b-2 border-ink/15 pb-3">
            <NotificationToggle />
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="pixel-chip px-3 py-1.5 text-xs"
              >
                Admin
              </Link>
            )}
            <SignOutButton className="pixel-chip px-3 py-1.5 text-xs" />
          </div>

          <div className="pt-3">
            <p className="text-xs font-medium tracking-wide text-ink/50">
              Members — {members.length}
            </p>
            <ul className="mt-2 flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  <Avatar animalKey={m.spiritAnimal} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">
                      {m.displayName}
                      {m.isAdmin && (
                        <span className="ml-1 text-[10px] font-normal text-olive-dark">
                          admin
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[11px] text-ink/50">
                      {spiritAnimalTagline(m.spiritAnimal, m.nickname, m.adjective, {
                        short: true,
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
