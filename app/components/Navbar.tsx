"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

export default function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Poopers", href: "/poopers" },
    { name: "My Profile", href: "/profile" },
  ]

  return (
    <nav className="w-full h-20 flex items-center justify-between px-6 bg-rose-100 shadow-md relative z-50">
      <div className="font-gasoek text-3xl text-amber-900">
        PARTY POOPERS
      </div>

      <div className="font-rubik text-md text-amber-900 flex gap-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative group pb-0.20"
            >
              {item.name}

              {/* Animated underline */}
              <span
                className={`
                  absolute left-0 bottom-0 h-[1.5px] w-full
                  bg-amber-900
                  origin-left
                  transition-transform duration-350 ease-in-out
                  ${
                    isActive
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }
                `}
              />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
