import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50 py-12">
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 pb-10">
          Üdvözlünk a Sportverseny Szervező Webalkalmazásban!
        </h1>
        <p className="text-lg md:text-xl text-gray-700">
          Ez az oldal azért jött létre, hogy leegyszerűsítse és átláthatóvá tegye a sportversenyek szervezését, legyen szó bajnoki rendszerű, egyenes kieséses vagy akár vigaszágas kieséséses tornákról.<br />
          Néhány kattintással könnyedén létrehozhatod a saját versenyedet, kezelheted a csapatokat, nyomon követheted az eredményeket, és átláthatóan megjelenítheted a tabellát vagy az ágrajzot is.
        </p>
      </div>
      <div className="w-full flex justify-center">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
          <Card className="w-96 h-[26rem] flex flex-col">
  <CardHeader>
    <CardTitle>Bajnoki/Körmérkőzéses Rendszer</CardTitle>
  </CardHeader>
  <CardContent className="flex justify-center items-center flex-1">
    <Image
      src="/league.png"
      alt="Bajnoki tabella"
      width={600}
      height={350}
      className="object-contain max-w-full h-full"
      priority
    />
  </CardContent>
</Card>

<Card className="w-96 h-[26rem] flex flex-col">
  <CardHeader>
    <CardTitle>Egyeneságú Kieséses Rendszer</CardTitle>
  </CardHeader>
  <CardContent className="flex justify-center items-center flex-1">
    <Image
      src="/single.png"
      alt="Egyeneságú kiesés ágrajz"
      width={600}
      height={350}
      className="object-contain max-w-full h-full"
      priority
    />
  </CardContent>
</Card>

<Card className="w-96 h-[26rem] flex flex-col">
  <CardHeader>
    <CardTitle>Vigaszágú Kieséses Rendszer</CardTitle>
  </CardHeader>
  <CardContent className="flex justify-center items-center flex-1">
    <Image
      src="/double.png"
      alt="Double elimination ágrajz"
      width={600}
      height={350}
      className="object-contain max-w-full h-full"
      priority
    />
  </CardContent>
</Card>

        </div>
      </div>
    </main>
  );
}
