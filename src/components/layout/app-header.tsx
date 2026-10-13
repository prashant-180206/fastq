"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { api } from "@/../convex/_generated/api";
import { Logo } from "@/components/layout/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar02Icon,
  ChevronDownIcon,
  DashboardSquare02Icon,
  LogOutIcon,
  Menu01Icon,
  Queue02Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/customer", label: "Discover", exact: true },
  { href: "/business", label: "My businesses" },
  { href: "/customer/dashboard", label: "My account" },
];

function isActiveRoute(pathname: string, item: NavItem) {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function UserMenu() {
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
    { href: "/customer/dashboard", label: "My dashboard", icon: DashboardSquare02Icon },
    { href: "/customer/appointments", label: "Appointments", icon: Calendar02Icon },
    { href: "/customer/queue", label: "My queue", icon: Queue02Icon },
    { href: "/business", label: "My businesses", icon: Store01Icon },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="h-9 gap-2 rounded-full px-2">
            <Avatar size="sm">
              {user?.image ? (
                <AvatarImage src={user.image} alt={displayName} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
              {displayName}
            </span>
            <HugeiconsIcon
              icon={ChevronDownIcon}
              strokeWidth={2}
              className="hidden size-4 text-muted-foreground sm:block"
            />
          </Button>
        }
      >
        <span className="sr-only">Open account menu</span>
      </DropdownMenuTrigger>
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

function MobileNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" aria-label="Open navigation" />
        }
      >
        <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          {NAV_ITEMS.map((item) => (
            <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Logo href={isAuthenticated ? "/customer" : "/"} />

          {isAuthenticated && (
            <nav className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                      isActiveRoute(pathname, item)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ModeToggle />

          {isLoading ? (
            <Skeleton className="size-9 rounded-full" />
          ) : isAuthenticated ? (
            <>
              <UserMenu />
              <div className="md:hidden">
                <MobileNav />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}