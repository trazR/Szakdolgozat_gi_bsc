import Link from "next/link";
import { Button } from "./ui/button";
import LogOutButton from "./LogOutButton";
import { getUser } from "@/auth/server";
import { prisma } from "@/db/prisma";

async function Header() {
    const user = await getUser();
    let tournaments: any[] = [];
    if (user) {
      tournaments = await prisma.tournament.findMany({
        where: { user_id: user.id },
        select: {
          tournament_id: true,
          tournament_name: true,
          tournament_type: true,
          tournament_start: true,
        },
        orderBy: { tournament_start: "desc" },
      });
    }
    
    return (
        <header className="bg-orange-700 text-white p-4 flex justify-end items-center">
            <Link href="/" className="flex items-center mr-auto">
                <span className="text-4xl font-bold">Verseny generátor</span>
            </Link>
            <div className="flex gap-4 items-center">
            {user && (
              <div className="relative group">
                <Button
                  type="button"
                  className="size-lg"
                  tabIndex={0}
                >
                  Versenyeim
                </Button>
                <div
                  className="
                    absolute right-0 mt-2
                    bg-white text-black rounded shadow-lg min-w-[260px] z-20
                    opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                    pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto
                    transition-opacity
                  "
                >
                  {tournaments.length === 0 ? (
                    <div className="px-4 py-3 text-gray-500">Nincs még versenyed.</div>
                  ) : (
                    tournaments.map((t) => (
                      <Link
                        key={t.tournament_id}
                        href={`/tournaments/${t.tournament_id}/overview`}
                        className="px-4 py-3 hover:bg-orange-200 transition flex flex-col border-b last:border-0"
                      >
                        <span className="font-semibold">{t.tournament_name}</span>
                        <span className="text-sm">{t.tournament_type}</span>
                        <span className="text-xs text-gray-600">{t.tournament_start ? new Date(t.tournament_start).toLocaleDateString() : ''}</span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
            {user ? (
              <>
                <LogOutButton />
                <Button asChild size='lg' variant={"secondary"}>
                  <Link href="/newtournament">Verseny létrehozása</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size='lg' variant={"secondary"}>
                  <Link href="/sign-up">Regisztráció</Link>
                </Button>
                <Button asChild size='lg' variant={"secondary"}>
                  <Link href="/login">Bejelentkezés</Link>
                </Button>
              </>
            )}
            </div>
        </header>
    );
}

export default Header;
