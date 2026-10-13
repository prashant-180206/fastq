import {
  Calendar02Icon,
  DashboardSquare02Icon,
  Queue02Icon,
  ServiceIcon,
  TimeScheduleIcon,
  TimeSetting03Icon,
} from "@hugeicons/core-free-icons";

export type BusinessNavItem = {
  href: string;
  label: string;
  icon: typeof DashboardSquare02Icon;
  matchExact?: boolean;
};

export type BusinessNavGroup = {
  label: string;
  items: BusinessNavItem[];
};

export function getBusinessNav(businessId: string): BusinessNavGroup[] {
  const base = `/business/${businessId}`;

  return [
    {
      label: "Manage",
      items: [
        {
          href: base,
          label: "Overview",
          icon: DashboardSquare02Icon,
          matchExact: true,
        },
        { href: `${base}/services`, label: "Services", icon: ServiceIcon },
        { href: `${base}/queues`, label: "Queues", icon: Queue02Icon },
        {
          href: `${base}/appointments`,
          label: "Appointments",
          icon: Calendar02Icon,
        },
      ],
    },
    {
      label: "Configure",
      items: [
        { href: `${base}/schedule`, label: "Schedule", icon: TimeScheduleIcon },
        {
          href: `${base}/working-hours`,
          label: "Working hours",
          icon: TimeSetting03Icon,
        },
      ],
    },
  ];
}

export function isNavActive(item: BusinessNavItem, pathname: string): boolean {
  if (item.matchExact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getActiveSectionLabel(
  businessId: string,
  pathname: string,
): string {
  for (const group of getBusinessNav(businessId)) {
    for (const item of group.items) {
      if (isNavActive(item, pathname)) {
        return item.label;
      }
    }
  }
  return "Overview";
}