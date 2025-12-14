A react bracket könyvtár miatt, npm install --legacy-peer-deps kell telepíteni.
npm audit fix --force-ot is érdemes lefuttatni sok verzió változás történt, amit nem követtem és hibát nem okozott mikor kipróbáltam.
A versenygenerator mappába létre kell hozni egy .env.locale  fájlt és az env.locale.txt tartalmát bemásolni, majd a terminalba npx prisma generate, így nem kell regisztrálni supabasera és kulcsokat állítgatni.
npm run dev paranccsal kell futtatni.
Ha hibát jelez a params.id-re, az csak egy elavultabb eljárás miatt történik, működésben nem okoz problémát csak figyelmeztet, hogy van modernebb megoldás is.
