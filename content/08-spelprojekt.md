## Från fungerande XR-grund till spel {#fran-grund-till-spel}

Du har nu en XR-miljö där spelaren kan se världen, röra sig och plocka upp enkla föremål. Nästa långsiktiga mål är ett skjutspel med olika vapen, monster och banor som sätts samman med hjälp av slump. Vi bygger inte allt på en gång. Varje ny funktion ska vara liten, begriplig och möjlig att testa innan nästa läggs till.

<div class="callout"><strong>Spelet är kursens tekniska källa.</strong><p>Vi dokumenterar först vad vi tänker göra, bygger den minsta fungerande versionen i Godot och provar den. Först därefter blir resultatet en färdig tutorial på webbplatsen.</p></div>

## Visionen {#visionen}

Den tänkta spel-loopen är enkel:

1. Spelaren går in i ett rum.
2. Spelaren hittar eller håller ett vapen.
3. Ett eller flera monster dyker upp.
4. Spelaren besegrar monstren.
5. Vägen till nästa rum öppnas.

På längre sikt kan spelet innehålla flera vapen, olika monstertyper och en modulär bana. I början representeras allt av kuber, kapslar, cylindrar och enkla färger.

## Varför vi använder primitiva objekt {#primitiva-objekt}

En detaljerad modell kan dölja vad som faktiskt är fel. En kub gör det lättare att se position, riktning, skala och kollision. Samma GDScript som fungerar med en kub kan senare användas med en mer avancerad modell.

Det ger oss tre fördelar:

- Vi kan koncentrera oss på ett programmeringsproblem i taget.
- Testerna går snabbt att upprepa.
- Eleverna ser skillnaden mellan spelets regler och dess utseende.

## Den stegvisa planen {#stegvis-plan}

| Fas | Minsta funktion | Kontroll innan vi går vidare |
| --- | --- | --- |
| 0 | Stabil XR-grund | Rörelse, rotation och pickup fungerar i headsetet. |
| 1 | Primitivt vapen | Vapnet kan plockas upp och reagerar en gång per avtryckning. |
| 2 | Enkel projektil | Projektilen lämnar mynningen och kolliderar förutsägbart. |
| 3 | Stillastående mål | Målet tar skada och kan förstöras. |
| 4 | Enkelt monster | En kapsel rör sig mot spelaren och kan besegras. |
| 5 | Flera vapen | Två vapen delar grundkod men har olika egenskaper. |
| 6 | Slumpmässigt möte | Antal och placering av monster kan varieras reproducerbart. |
| 7 | Modulär bana | Ett fåtal testade rum kan kopplas ihop i olika ordning. |
| 8 | Hel spel-loop | Start, vinst, förlust och omstart fungerar. |

Varje rad kan bli ett eller flera framtida kurskapitel. Planen är en riktning, inte ett krav på att alla idéer måste byggas.

## Regler för varje nytt steg {#regler-for-steg}

När vi utvecklar nästa funktion följer vi samma ordning:

1. Formulera ett tydligt lärandemål.
2. Beskriv scenens noder innan kod skrivs.
3. Bygg den minsta fungerande versionen.
4. Testa normalt beteende och minst ett felaktigt fall.
5. Skriv ned problem och beslut i utvecklingsloggen.
6. Skapa tutorialen från den verifierade versionen.

Det betyder att kursen aldrig ska beskriva en planerad funktion som om den redan fungerade.

## Projektets nuläge {#projektets-nulage}

Det aktuella projektet använder Godot 4.7, GDScript, OpenXR, Jolt Physics och Godot XR Tools. Huvudscenen innehåller golv, ljus, ett hinder, en XR-spelare och tre greppbara testkuber. Vänster styrspak används för rörelse, höger styrspak för mjuk rotation och båda händerna kan plocka upp föremål.

Projektets källscener och GDScript-filer har kontrollerats i Godot 4.7.2. Den aktiva huvudscenen kan starta utan skript- eller scenfel. Ett fysiskt Quest-test behövs fortfarande när en funktion är beroende av headset, kontroller eller verklig OpenXR-spårning.

## Nästa minsta steg {#nasta-steg}

Innan vapenkod läggs till ska den befintliga XR-grunden provas på målheadsetet. Därefter skapar vi ett enda primitivt vapen av enkla former. Det första målet är bara att vapnet kan hållas och att avtryckaren ger en tydlig, kontrollerad reaktion. Projektiler och skada kommer senare.

<div class="checkpoint" data-checklist="spelprojekt-grund"><h3>Redo för det första vapnet</h3><label><input type="checkbox"> Huvudscenen öppnas utan skript- eller scenfel.</label><label><input type="checkbox"> Spelarens händer följer kontrollerna i headsetet.</label><label><input type="checkbox"> Rörelse och rotation fungerar som avsett.</label><label><input type="checkbox"> En testkub kan plockas upp och släppas med båda händerna.</label></div>

## Dokumentation som växer med spelet {#dokumentation-som-vaxer}

Projektets interna dokumentation behåller idéer, utvecklingsplan och kronologisk logg. Webbplatsen innehåller den bearbetade kursversionen. När nästa funktion har byggts och testats uppdateras båda: loggen berättar vad som faktiskt hände och ett nytt kapitel lär ut den fungerande lösningen.
