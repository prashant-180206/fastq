export type BusinessDay = {
  day: string;
  isOpen: boolean;
  slots: { open: string; close: string }[];
};

export const DAY_NAMES: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function getTodaySchedule(
  businessHours: BusinessDay[] | undefined | null,
) {
  const now = new Date(Date.now() + 330 * 60_000);
  const weekday = WEEKDAYS[now.getUTCDay()];

  const day = businessHours?.find((item) => item.day === weekday);

  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const isOpenNow =
    Boolean(day?.isOpen) &&
    Boolean(
      day?.slots.some((slot) => {
        const [openHour, openMinute] = slot.open.split(":").map(Number);
        const [closeHour, closeMinute] = slot.close.split(":").map(Number);

        const open = openHour * 60 + openMinute;
        const close = closeHour * 60 + closeMinute;

        return currentMinutes >= open && currentMinutes < close;
      }),
    );

  return { day, isOpenNow, currentMinutes };
}