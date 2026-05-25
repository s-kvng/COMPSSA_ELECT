"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthContext } from "@/features/auth/mockAuth"
import { useNavigation } from "@/features/auth/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  useSidebar,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Award01Icon,
  DashboardSquare01Icon,
  CheckmarkSquare01Icon,
  TrendingUpDownIcon,
  SlidersHorizontalIcon,
  UserGroupIcon,
  Tv01Icon,
} from "@hugeicons/core-free-icons"
import type { Role } from "@/lib/types"

interface NavItem {
  title: string
  url: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  roles: Role[]
  isActive: (pathname: string) => boolean
  badge?: React.ReactNode
}

function buildNavItems(activeElectionId: string): NavItem[] {
  return [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: DashboardSquare01Icon,
      roles: ["Student", "Candidate", "EC", "HOD"],
      isActive: (p) => p === "/dashboard",
    },
    {
      title: "Vote",
      url: "/vote",
      icon: CheckmarkSquare01Icon,
      roles: ["Student", "Candidate"],
      isActive: (p) => p === "/vote" || p.startsWith("/vote/"),
    },
    {
      title: "My Tally",
      url: "/dashboard/candidate",
      icon: TrendingUpDownIcon,
      roles: ["Candidate"],
      isActive: (p) => p === "/dashboard/candidate",
    },
    {
      title: "Elections",
      url: "/admin/elections",
      icon: SlidersHorizontalIcon,
      roles: ["EC"],
      isActive: (p) =>
        p === "/admin/elections" ||
        (p.startsWith("/admin/elections/") && !p.endsWith("/live")),
    },
    {
      title: "Students",
      url: "/admin/students",
      icon: UserGroupIcon,
      roles: ["EC"],
      isActive: (p) => p === "/admin/students",
    },
    {
      title: "Live Tracker",
      url: `/admin/elections/${activeElectionId}/live`,
      icon: Tv01Icon,
      roles: ["EC"],
      isActive: (p) => p.endsWith("/live") && p.startsWith("/admin/elections/"),
      badge: (
        <span className="ml-auto size-2 rounded-full bg-(--color-success) animate-pulse" />
      ),
    },
    {
      title: "Live Dashboard",
      url: "/admin/live",
      icon: Tv01Icon,
      roles: ["HOD"],
      isActive: (p) => p === "/admin/live",
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { currentUser, elections, logout } = useAuthContext()
  const { navigateTo } = useNavigation()
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  if (!currentUser) return null

  const activeElection = elections.find(
    (e) => e.status === "Active" || e.status === "Ready" || e.status === "Closed"
  )
  const activeElectionId = activeElection?.id ?? elections[0]?.id ?? "elect-2026"

  const allItems = buildNavItems(activeElectionId)
  const allowedItems = allItems.filter((item) =>
    item.roles.includes(currentUser.role as Role)
  )

  // Hide the Live Tracker link if no election exists yet
  const visibleItems = allowedItems.filter(
    (item) => item.title !== "Live Tracker" || !!activeElection
  )

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = () => {
    logout()
    navigateTo("/login")
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-(--color-accent) text-white shrink-0">
                  <HugeiconsIcon icon={Award01Icon} strokeWidth={2} className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-tight">COMPSSA</span>
                  <span className="truncate text-xs text-sidebar-foreground/60 font-mono uppercase tracking-wider">
                    Election Platform
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {visibleItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={item.isActive(pathname)}
                  tooltip={item.title}
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  <Link href={item.url}>
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                    <span>{item.title}</span>
                    {item.badge}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: currentUser.name,
            role: currentUser.role,
            initials,
            avatarUrl: currentUser.avatarUrl,
          }}
          onLogout={handleLogout}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
