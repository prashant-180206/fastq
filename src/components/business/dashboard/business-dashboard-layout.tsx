"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { AppSidebar } from "./app-sidebar";
import { getActiveSectionLabel } from "./business-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Calendar02Icon,
  ChevronDownIcon,
  DashboardSquare02Icon,
  LogOutIcon,
  Queue02Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface BusinessDashboardLayoutProps {
  businessId: string;
  children: ReactNode;
}

function DashboardUserMenu() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(
    api.users.me,
    isAuthenticated && !isLoading ? {} : "skip",
  );

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const displayName = user?.name ?? user?.email ?? "Account";
  const initials = (user?.name ?? user?.email ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const accountItems = [
    {
      href: "/customer/dashboard",
      label: "My dashboard",
      icon: DashboardSquare02Icon,
    },
    { href: "/customer/appointments", label: "Appointments", icon: Calendar02Icon },
    { href: "/customer/queue", label: "My queue", icon: Queue02Icon },
    { href: "/business", label: "My businesses", icon: Store01Icon },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="size-9 rounded-full px-0"
            aria-label="Open account menu"
          >
            <Avatar size="sm">
              {user?.image ? (
                <AvatarImage src={user.image} alt={displayName} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <HugeiconsIcon
              icon={ChevronDownIcon}
              strokeWidth={2}
              className="hidden size-4 text-muted-foreground sm:block"
            />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="truncate text-sm font-medium text-foreground">
              {displayName}
            </span>
            {user?.email ? (
              <span className="truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {accountItems.map((item) => (
            <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
              <HugeiconsIcon icon={item.icon} strokeWidth={2} />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <HugeiconsIcon icon={LogOutIcon} strokeWidth={2} />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DashboardTopbar({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  const id = businessId as Id<"businesses">;
  const business = useQuery(api.business.data.getById, { businessId: id });
  const section = getActiveSectionLabel(businessId, pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/40 bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 sm:gap-3 sm:px-6">
      <SidebarTrigger />

      <Separator orientation="vertical" className="hidden h-5 sm:inline-flex" />

      <div className="flex min-w-0 flex-1 items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link href="/business" />}
                className="hidden sm:inline"
              >
                Businesses
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:inline-flex" />
            <BreadcrumbItem>
              {business === undefined ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <BreadcrumbPage className="max-w-40 truncate">
                  {business.name}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{section}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ModeToggle />
        <DashboardUserMenu />
      </div>
    </header>
  );
}

export function BusinessDashboardLayout({
  businessId,
  children,
}: BusinessDashboardLayoutProps) {
  return (
    <SidebarProvider>
      <TooltipProvider>
        <AppSidebar businessId={businessId} />
        <SidebarInset>
          <DashboardTopbar businessId={businessId} />
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}