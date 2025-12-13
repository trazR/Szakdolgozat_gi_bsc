"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const TournamentForm = () => {
  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [type, setType] = useState("");

  const [participants, setParticipants] = useState<string>("2");
  const [pointsForWin, setPointsForWin] = useState<string>("0");
  const [pointsForDraw, setPointsForDraw] = useState<string>("0");
  const [rounds, setRounds] = useState<string>("1");

  const [description, setDescription] = useState("");
  const [hasThirdPlaceMatch, setHasThirdPlaceMatch] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || name.trim().length < 6) {
      toast.error("A verseny neve legalább 6 karakter hosszú legyen.");
      return;
    }
    if (!game) {
      toast.error("Válaszd ki a sportágat.");
      return;
    }
    if (!type) {
      toast.error("Válaszd ki a versenytípust.");
      return;
    }

    const participantsNum = Number(participants);
    const pointsForWinNum = Number(pointsForWin);
    const pointsForDrawNum = Number(pointsForDraw);
    const roundsNum = Number(rounds);

    if (!Number.isFinite(participantsNum) || participantsNum < 2) {
      toast.error("Legalább 2 résztvevő szükséges.");
      return;
    }

    if (
      (type === "league" || type === "round-robin") &&
      ((!Number.isFinite(pointsForWinNum) || pointsForWinNum < 0) ||
        (!Number.isFinite(pointsForDrawNum) || pointsForDrawNum < 0))
    ) {
      toast.error("A pontszámok nem lehetnek negatívak.");
      return;
    }

    if (type === "round-robin") {
      if (!Number.isFinite(roundsNum) || roundsNum < 1) {
        toast.error("A körmérkőzéshez legalább 1 forduló szükséges.");
        return;
      }
    }

    const formData = {
      name: name.trim(),
      game,
      type,
      participants: participantsNum,
      description,
      hasThirdPlaceMatch,
      pointsForWin: pointsForWinNum,
      pointsForDraw: pointsForDrawNum,
      rounds: roundsNum,
    };

    setIsLoading(true);

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Hiba történt a verseny létrehozása során.");
        return;
      }

      toast.success("Verseny sikeresen létrehozva!");
      router.push(`/tournaments/${result.tournament.tournament_id}/overview`);
    } catch (error) {
      toast.error("Nem sikerült létrehozni a versenyt.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-2xl px-6 py-4 shadow-xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="mb-4">
            <CardTitle className="text-center text-3xl">Új Verseny</CardTitle>
          </CardHeader>

          <CardContent className="mb-4">
            <div className="mb-12">
              <Label>Verseny neve:</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="mb-12">
              <Label>Résztvevők száma:</Label>
              <Input
                min={2}
                type="number"
                inputMode="numeric"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)} // ✅ nem Number()
                required
              />
            </div>

            <div className="mb-12">
              <Label className="block mb-2">Sport:</Label>
              <Select value={game} onValueChange={setGame}>
                <SelectTrigger className="w-full p-3 text-lg">
                  <SelectValue placeholder="Válassz sportot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="football">Labdarúgás</SelectItem>
                    <SelectItem value="basketball">Kosárlabda</SelectItem>
                    <SelectItem value="handball">Kézilabda</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="mb-12">
              <Label className="block mb-2">Versenytípus:</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full p-3 text-lg">
                  <SelectValue placeholder="Válassz típust" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="league">Bajnoki rendszer</SelectItem>
                    <SelectItem value="knockout">Kieséses rendszer</SelectItem>
                    <SelectItem value="double">Vigaszágas rendszer</SelectItem>
                    <SelectItem value="round-robin">Körmérkőzés</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {type === "knockout" && (
              <div className="flex items-center gap-3">
                <Input
                  type="checkbox"
                  checked={hasThirdPlaceMatch}
                  onChange={() => setHasThirdPlaceMatch(!hasThirdPlaceMatch)}
                  className="w-6 h-6"
                />
                <Label>Harmadik hely mérkőzés</Label>
              </div>
            )}

            {(type === "league" || type === "round-robin") && (
              <>
                <div className="mb-12">
                  <Label>Pont a győzelemért:</Label>
                  <Input
                    min={0}
                    type="number"
                    inputMode="numeric"
                    value={pointsForWin}
                    onChange={(e) => setPointsForWin(e.target.value)} // ✅
                    required
                  />
                </div>

                <div className="mb-12">
                  <Label>Pont a döntetlenért:</Label>
                  <Input
                    min={0}
                    type="number"
                    inputMode="numeric"
                    value={pointsForDraw}
                    onChange={(e) => setPointsForDraw(e.target.value)} // ✅
                    required
                  />
                </div>
              </>
            )}

            {type === "round-robin" && (
              <div className="mb-12">
                <Label>Fordulók száma:</Label>
                <Input
                  min={1}
                  type="number"
                  inputMode="numeric"
                  value={rounds}
                  onChange={(e) => setRounds(e.target.value)} // ✅
                  required
                />
              </div>
            )}

            <div className="mb-12">
              <Label>Leírás:</Label>
              <Textarea
                placeholder="Leírás megadása"
                value={description}
                rows={4}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>

          <Button
            className="w-full text-lg bg-blue-500 text-white hover:bg-blue-600"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Verseny létrehozása folyamatban..." : "Verseny létrehozása"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default TournamentForm;
