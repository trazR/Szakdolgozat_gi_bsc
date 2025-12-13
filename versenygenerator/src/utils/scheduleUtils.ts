const daysOfWeek: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2,
  wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

// Következő nap kiszámítása
export function getNextDate(base: Date, target: number, weekOffset = 0) {
  const date = new Date(base);
  const diff = (target + 7 - date.getDay()) % 7 + weekOffset * 7;
  date.setDate(date.getDate() + diff);
  return date;
}

// Idő hozzáadása dátumhoz
export function setTimeForDate(date: Date, time: string) {
  const [h, m] = time.split(":").map(Number);
  const newDate = new Date(date);
  newDate.setHours(h, m, 0, 0);
  return newDate;
}

// Mérkőzés időpontok generálása
export function buildScheduleSlots(schedule: any[]) {
  return schedule.map((slot) => {
    const dayOfWeek = daysOfWeek[slot.day_of_week.toLowerCase()];
    const startMinutes = toMinutes(slot.start_time);
    const endMinutes = toMinutes(slot.end_time);
    const matchDuration = slot.match_duration ?? 90;

    const slotTimes: string[] = [];

    for (let currentMinute = startMinutes; currentMinute + matchDuration <= endMinutes; currentMinute += matchDuration) {
      slotTimes.push(minutesToTime(currentMinute));
    }

    return {
      dayOfWeek,
      times: slotTimes,
    };
  });
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number) {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
