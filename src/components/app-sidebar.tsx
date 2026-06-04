"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { useCurrentUser } from "@/shared/auth"
import { api } from "../../convex/_generated/api"
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

function buildNavItems(activeElectionId: string | null): NavItem[] {
  return [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: DashboardSquare01Icon,
      roles: ["student", "candidate", "ec", "hod"],
      isActive: (p) => p === "/dashboard",
    },
    {
      title: "Vote",
      url: "/vote",
      icon: CheckmarkSquare01Icon,
      roles: ["student", "candidate"],
      isActive: (p) => p === "/vote" || p.startsWith("/vote/"),
    },
    {
      title: "My Tally",
      url: "/dashboard/candidate",
      icon: TrendingUpDownIcon,
      roles: ["candidate"],
      isActive: (p) => p === "/dashboard/candidate",
    },
    {
      title: "Elections",
      url: "/admin/elections",
      icon: SlidersHorizontalIcon,
      roles: ["ec"],
      isActive: (p) =>
        p === "/admin/elections" ||
        (p.startsWith("/admin/elections/") && !p.endsWith("/live")),
    },
    {
      title: "Students",
      url: "/admin/students",
      icon: UserGroupIcon,
      roles: ["ec"],
      isActive: (p) => p === "/admin/students",
    },
    {
      title: "Live Tracker",
      url: activeElectionId ? `/admin/elections/${activeElectionId}/live` : "#",
      icon: Tv01Icon,
      roles: ["ec"],
      isActive: (p) => p.endsWith("/live") && p.startsWith("/admin/elections/"),
      badge: (
        <span className="ml-auto size-2 rounded-full bg-(--color-success) animate-pulse" />
      ),
    },
    {
      title: "Live Dashboard",
      url: "/admin/live",
      icon: Tv01Icon,
      roles: ["hod"],
      isActive: (p) => p === "/admin/live",
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentUser = useCurrentUser()
  const { signOut } = useAuthActions()
  const router = useRouter()
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const currentElection = useQuery(api.elections.getCurrentElection)

  if (!currentUser) return null

  const activeElectionId = currentElection?._id ?? null
  const allItems = buildNavItems(activeElectionId)
  const allowedItems = allItems.filter((item) =>
    item.roles.includes(currentUser.role as Role)
  )

  const visibleItems = allowedItems.filter(
    (item) => item.title !== "Live Tracker" || !!activeElectionId
  )

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
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
            avatarUrl: undefined,
          }}
          onLogout={handleLogout}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
