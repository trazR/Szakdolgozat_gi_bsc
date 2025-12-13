'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TournamentNavProps {
  id: string;
  tournamentType: string;
}

export default function TournamentNav({ id, tournamentType }: TournamentNavProps) {
  const pathname = usePathname();

  const isLeague = tournamentType === 'league';
  const isKnockout = tournamentType === 'knockout';
  const isDouble = tournamentType === 'double';
  const isRoundRobin = tournamentType === 'round-robin';

  const menu = [
    { href: `/tournaments/${id}/overview`, label: 'Áttekintés', show: true },
    { href: `/tournaments/${id}/table`, label: 'Tabella', show: isLeague || isRoundRobin },
    { href: `/tournaments/${id}/league`, label: 'Mérkőzések', show: isLeague },
    { href: `/tournaments/${id}/single`, label: 'Ágrajz', show: isKnockout },
    { href: `/tournaments/${id}/double`, label: 'Ágrajz', show: isDouble },
    { href: `/tournaments/${id}/robin`, label: 'Mérkőzések', show: isRoundRobin },
    { href: `/tournaments/${id}/teams`, label: 'Csapatok', show: true },
    { href: `/tournaments/${id}/stats`, label: 'Statisztikák', show: true },
    { href: `/tournaments/${id}/referee`, label: 'Játékvezetők', show: true },
    { href: `/tournaments/${id}/venue`, label: 'Helyszínek', show: isKnockout || isDouble },
    { href: `/tournaments/${id}/scheduler`, label: 'Ütemező', show: true },
  ];

  return (
    <nav className="mb-10 flex justify-center">
      <ul className="flex gap-6">
        {menu.filter(item => item.show).map(item => {
          const isActive = pathname.startsWith(item.href);

          const baseClasses = "px-4 py-2 text-lg rounded-xl transition";

          const activeClasses =
            "text-orange-700 font-bold underline bg-blue-50 shadow";

          const inactiveClasses =
            "text-gray-700 hover:text-orange-200 hover:bg-gray-100";

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  baseClasses +
                  " " +
                  (isActive ? activeClasses : inactiveClasses)
                }
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
