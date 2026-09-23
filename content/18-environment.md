<div class="callout"><strong>Från grå prototyp till egen spelplats.</strong><p>Vi bygger ett övergivet urbant rum med spruckna ytor, rostigt tak, ett brukat arbetsbord och en svag främmande glöd. Miljön är inspirerad av stämningen i postapokalyptiska spel, men använder egna former och fristående CC0-texturer.</p></div>

## Text i spelet: engelska {#engelsk-speltext}

Manualen är fortsatt på svenska, men all text som spelaren ser i själva spelet ska vara på engelska. Det gäller desktopinstruktioner, HUD och Game over-panelen. Godots Output-meddelanden från våra spelskript är också på engelska, så att manualens förväntade text matchar projektet.

| Var | Text i spelet |
| --- | --- |
| Desktopinstruktioner | `Desktop: WASD/arrow keys = move · Space = jump · Ctrl/C = crouch · left click = fire · right click = pick up/drop` |
| HUD | `HEALTH`, `MONSTERS KILLED` |
| Förlustläge | `GAME OVER`, `Play again (R)`, `Press B to play again` |

Detta ändrar inte språket i förklarande kommentarer eller i den svenska manualen. Det är en regel för spelargränssnittet.

## Välj fria texturer {#texturkallor}

Vi använder fyra material från Poly Haven. Varje rad länkar direkt till texturens källsida, där filerna och upphovspersonen finns angivna:

| Yta i spelet | Textur och källa | Filer i projektet |
| --- | --- | --- |
| Golv | [Cracked Concrete](https://polyhaven.com/a/cracked_concrete) | `cracked_concrete_*_1k.jpg` |
| Väggar | [Rebar Reinforced Concrete](https://polyhaven.com/a/rebar_reinforced_concrete) | `rebar_reinforced_concrete_*_1k.jpg` |
| Tak och rostiga metalldelar | [Rusty Metal Sheet](https://polyhaven.com/a/rusty_metal_sheet) | `rusty_metal_sheet_*_1k.jpg` |
| Bordsskiva och lådfront | [Weathered Planks](https://polyhaven.com/a/weathered_planks) | `weathered_planks_*_1k.jpg` |

Alla fyra är publicerade under [Poly Havens CC0-licens](https://polyhaven.com/license). Projektet innehåller bara 1K-versionernas `diff` (färg), `nor_gl` (normal map för OpenGL-orientering) och `rough` (ytans strävhet). Det håller de tolv källbilderna på ungefär 7,4 MB. Högre upplösning behövs inte för den här första Quest-versionen.

Lägg bilderna under `assets/textures/polyhaven/`. Använd `StandardMaterial3D` för varje yta: koppla `diff` till Albedo, aktivera Normal och koppla `nor_gl`, och koppla `rough` till Roughness. Återanvänd materialet på flera väggar i stället för att skapa nya kopior för varje vägg.

## Bygg den större arenan {#arena}

`Blueprints/urban_arena.tscn` samlar miljön i en egen scen:

```text
UrbanArena
├── Ground             (12 × 12 m, sprucken betong)
├── North/South/East/WestWall
├── BrokenRoof         (två rostiga takhalvor)
├── CrossBeams + Columns
├── AlienGrowth        (självlysande former och ett svagt ljus)
├── DistantCity        (mörka byggnadssiluetter)
└── WorkbenchLight + CornerLight
```

Golvet, väggarna och takhalvorna är `StaticBody3D` med enkla `BoxShape3D`-kollisioner. Taket lämnar ett öppet parti i mitten, så att himlen syns och ljuset får en tydligare riktning. De avlägsna byggnaderna och de främmande formerna är enbart visuella, inte extra hinder i spelområdet.

Placeringen av monster och power-ups från kapitel 16 ligger kvar. Ytorna är nu större än spawnpunkternas område, så monstren kan fortfarande dyka upp på golv och på säkert avstånd från spelaren.

## Bygg om bordet {#arbetsbord}

Det gamla bordet var en enda grå låda. `Blueprints/workbench.tscn` består nu av en sliten träskiva, fyra rostiga metallben, fram- och bakre stag, en nedre hylla, en lådfront, handtag och små hörnplåtar. Bordsskivan och benen har egna kollisioner.

Arbetsbordet står kvar framför spelaren. Pistolen och de greppbara testföremålen är placerade ovanför skivan, så den gamla interaktionen går att använda i den nya miljön. Håll ett tydligt grepputrymme runt pistolen när du lägger till fler dekorationer senare.

## Ljus och främmande stämning {#ljus}

Miljön använder mörkare himmel, ett varmt ljus vid arbetsbordet, ett svalare hörnljus och en liten turkos ljuskälla vid den främmande tillväxten på väggen. De lysande formerna använder ett enkelt emissivt material. Vi använder inga texturer, modeller eller logotyper från *Half-Life: Alyx*; det är den ödsliga urbana känslan som inspirerar, inte dess skyddade bildmaterial.

Håll antalet dynamiska ljus och skuggor lågt i Quest. De tre lokala ljusen kastar inte skuggor. Mät bildfrekvensen i headsetet innan du lägger till fler effekter.

## Testa i desktopläget {#testa-desktop}

1. Starta spelet med Godots Play-knapp. Kontrollera att speltexten är på engelska.
2. Gå runt: golv, väggar, tak och bord ska ha fungerande kollision.
3. Plocka upp pistolen från den nya bordsskivan och skjut ett monster.
4. Kontrollera att monster och power-ups fortfarande skapas på giltiga punkter.
5. Låt hälsan ta slut och kontrollera att `GAME OVER` och `Play again (R)` visas.

Det automatiska testet `tests/phase49_environment_test.gd` kontrollerar material och kollisioner för de viktigaste ytorna. Ett långt headless-test och Quest-export används också för teknisk kontroll, men inte för att bedöma den visuella känslan.

## Testa i Quest {#testa-quest}

Det sista godkännandet måste göras i headsetet:

1. Kontrollera att bordet har behaglig höjd och att pistolen fortfarande går lätt att greppa.
2. Se efter att taköppningen, stadsformerna och ljusen känns tydliga utan att vara bländande.
3. Gå längs väggarna och bekräfta att du inte fastnar i kollisioner.
4. Bedöm om texturerna är tillräckligt skarpa och om bildfrekvensen känns stabil när fyra monster finns i scenen.

<div class="checkpoint" data-checklist="environment"><h3>Kontrollera miljön</h3><label><input type="checkbox"> All spelarsynlig text är på engelska.</label><label><input type="checkbox"> Golv, väggar, tak och bord har kollision.</label><label><input type="checkbox"> Pistolen kan greppas från arbetsbordet.</label><label><input type="checkbox"> Monster och power-ups fungerar i den större arenan.</label><label><input type="checkbox"> Ljuset och bordets höjd fungerar i Quest.</label><label><input type="checkbox"> Bildfrekvensen känns stabil i headsetet.</label></div>

## Nästa steg {#nasta-steg}

När miljön är godkänd i Quest kan nästa steg vara en andra vapentyp eller mer varierade monster. Vi bör inte lägga till fler visuella effekter förrän denna scen har testats för komfort och prestanda i headsetet.
