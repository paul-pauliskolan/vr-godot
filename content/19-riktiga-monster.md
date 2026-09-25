<div class="callout"><strong>Två riktiga monster, en gemensam spelmekanik.</strong><p>Här ersätter vi den lila kapselns synliga form med Horror Game Monster och Giant Mutant. Skada, kontaktskada och HUD-räknare återanvänder samma system. Samtidigt växer arenan till 24 × 24 meter med väggar mellan spelaren och fiendernas startpunkter.</p></div>

## Hämta modellerna och kontrollera licensen {#kallor}

| Modell | Källsida och licens | Filer som används |
| --- | --- | --- |
| Horror Game Monster | [OpenGameArt: 3D Horror Game Monster](https://opengameart.org/content/3d-horror-game-monster), CC0 enligt källsidan. | `Poses.zip` innehåller `Idle.fbx`, `Walk.fbx` och `Run.fbx`. `Colors.zip` innehåller bland annat den svarta färgtexturen. |
| Giant Mutant | [OpenGameArt: Giant Mutant](https://opengameart.org/content/giant-mutant), CC0 enligt källsidan. | `giant_mutant.zip` innehåller en `.glb`-modell med idle-, löp-, slag- och dödsanimationer. |

**Licensförtydligande för Giant Mutant:** Upphovspersonen bekräftar i en kommentar på källsidan att animationerna gjordes med Mixamo. [Adobes Mixamo-FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) tillåter royaltyfri användning i spel, men säger inte att själva animationerna är CC0. Betrakta därför inte den kompletta animerade GLB-filen som fritt omlicensierbar under CC0, trots CC0-märkningen på modellsidan.

Originalarkiven behöver inte ligga i Godot-projektet. Projektet innehåller färdiga, konverterade filer i `assets/monsters/`: `horror_monster.glb` och `giant_mutant.glb`. Konverteringsskriptet `tools/prepare_monster_models.py` visar hur FBX-klippen från Horror Game Monster slås samman i Blender och hur Giant Mutants geometri förenklas för ett första Quest-test. Horror-modellen har **Idle**, **Walk** och **Run** i den importerade spelversionen. Källsidan nämner fler rörelser, men vi påstår inte att ett separat attackklipp finns i de filer vi faktiskt använder.

## Byt endast det synliga monstret {#modellbyte}

Öppna `Blueprints/simple_monster.tscn`. Roten är fortfarande `CharacterBody3D` med samma `CollisionShape3D`, `ContactArea` och timrar. Under en ny `Visual`-nod finns två instanser:

```text
SimpleMonster (CharacterBody3D)
├── Visual
│   ├── HorrorVisual  (horror_monster.glb)
│   └── GiantVisual   (giant_mutant.glb)
├── CollisionShape3D
├── HeadHitbox       (Area3D med egen sfär)
├── ContactArea
├── HitFlashTimer
└── ContactDamageTimer
```

`simple_monster.gd` visar en modell åt gången. Horror-modellen använder **Idle** när den står still och **Walk** när den rör sig. Giant Mutant använder **idle**, **Giant Run** och **Death**. Den senare har fem träffpoäng, gör två poäng kontaktskada och rör sig lite långsammare; Horror behåller tre träffpoäng och en poäng kontaktskada. Båda använder `take_damage()` från kapitel 12 och 13. Vid träff läggs en kort röd materialöverlagring på modellens mesh. Vapnet och projektilen behöver inte veta vilken modell som syns.

Giant-modellen roteras och skalas i scenen så att den står på golvet i rimlig spelstorlek. Den konverterade versionen har förenklad geometri. I `monster_spawner.gd` blir ungefär var tredje fiende en Giant, men aldrig fler än en Giant samtidigt. Det minskar belastningen i headsetet.

## Låt skotten träffa huvudet {#huvudtraff}

Den gamla kapseln var 1,40 meter hög, medan Horror-modellens synliga geometri når ungefär 1,87 meter. Ett skott mot huvudet kunde därför passera över kroppens träffyta. `HeadHitbox` är en separat `Area3D` med en sfär kring huvudets höjd. Den ligger på ett eget fysiklager (21), och projektilens svepta stråltest inkluderar nu både kroppar och den träffbara ytan. `monster_head_hitbox.gd` skickar skadan vidare till förälderns `take_damage()`. Vapnet behöver fortfarande inte veta vilken del av monstret det träffade. När monstret dör stängs även huvudytan av.

Prova att sikta just över kroppskapselns övre kant. Det automatiska testet skjuter en riktig projektil på cirka 1,75 meters höjd och verifierar att Horror-monstrets hälsa minskar. I Quest behöver du också bedöma om sfären visuellt följer huvudet under animationerna; justera dess höjd eller radie om den känns för generös eller snäv.

## Bygg en bana som döljer fienderna {#storre-bana}

`Blueprints/urban_arena.tscn` har nu ett **24 × 24 meter** stort golv. Ytterväggarna och de två takhalvorna har vuxit med golvet. Under `InteriorWalls` finns fyra nya kolliderande väggar: `NorthDivider`, `SouthDivider`, `WestAlley` och `EastAlley`. De två långa väggarna skymmer monster som skapas norr och söder om spelaren. Öppningarna ligger på motsatta sidor, så fienderna måste ta sig runt väggen för att komma fram. Arbetsbordet och pistolen står kvar vid spelarens startpunkt.

Monsterpunkterna i `monster_spawner.tscn` ligger nu ungefär åtta meter från mitten, och `minimum_player_distance` är sex meter. Varje punkt är skymd av en innervägg från startpunkten. Power-up-punkterna är också utspridda i den större banan.

Monstren gick tidigare rakt mot spelaren. Det skulle få dem att fastna mot de nya väggarna. Därför bygger `urban_arena.gd` ett enkelt platt `AStarGrid2D`-rutnät som märker väggarnas positioner som blockerade. Monstren frågar efter nästa fria steg med jämna mellanrum och fortsätter sedan mot spelaren runt hörnen. Detta är avsiktligt enklare än avancerad 3D-navigation: banan är plan och hindren är fasta.

## Lägg till ljud utan att avslöja monstren {#ljud}

`game_audio.gd` skapar tre korta ljud direkt i spelet: skott, fotsteg och hopp. Inga externa ljudfiler eller extra ljudlicenser behövs. `ShotAudio` är en `AudioStreamPlayer3D` vid pistolens mynning och spelas bara när ett skott faktiskt avfyras. Desktop- och XR-spelaren har varsin fotstegs- och hoppspelare. Fotstegen kommer tätare vid sprint och tystnar när spelaren står still eller är i luften.

Monstren får **inga kontinuerliga gång-, löp- eller andningsljud** i detta steg. Annars skulle de lätt avslöja sin position bakom de nya väggarna. Ljud för närkontakt eller träff kan övervägas senare, efter ett speltest där överraskningen och tydligheten bedöms i headsetet.

## Sprint och engelsk kontrollguide {#kontroller}

XR Tools har en färdig `MovementSprint` som nu sitter direkt under `XROrigin3D`. Den använder **vänster styrspaks klick** (`primary_click` på vänster hand) medan knappen hålls nere. Höger styrspaks klick är fortfarande kopplat till huka. I desktopläget hålls **Shift** nere för sprint. Ett startmeddelande visar rätt knappar på engelska i respektive läge; det försvinner automatiskt efter 10 sekunder på desktop respektive 12 sekunder i Quest.

| Funktion | Desktop | Quest 3 |
| --- | --- | --- |
| Gå och titta | `WASD`/piltangenter och mus | Vänster styrspak och huvudrörelse |
| Spring | Håll `Shift` | Håll vänster styrspaks klick |
| Vänd | Mus | Höger styrspak |
| Hoppa | `Space` | Höger `A` |
| Huka | `Ctrl` eller `C` | Klicka höger styrspak för att växla |
| Plocka upp/släpp | Högerklick | Greppknapp på handen |
| Skjut med hållet vapen | Vänsterklick | Avtryckaren på handen som håller vapnet |
| Starta om efter förlust | `R` | Höger `B` |

På desktop frigör `Esc` muspekaren. Denna tabell beskriver projektets faktiska bindningar, inte alla knappar som finns i XR Tools.

## Testa i Godot och Quest {#testa}

1. Starta spelet i desktopläget. Du ska se bordet och pistolen, men inte monstren direkt genom väggarna.
2. Gå mot en öppning och vänta in fienderna. Kontrollera att Horror Game Monster går runt väggen med gånganimation och att Giant Mutant använder löpanimation.
3. Skjut båda typerna, även i Horror-monstrets huvud. Kontrollera röd träffblinkning, tre respektive fem träffpoäng och att räknaren `MONSTERS KILLED` ökar när de dör. Hörs skottljudet vid varje godkänt skott?
4. Gå, spring och hoppa. Kontrollera fotsteg och hoppljud samt att stegen går snabbare vid sprint.
5. Kontrollera att en Giant i taget skapas och att gröna power-ups ligger på användbara platser.
6. Kör därefter Android-versionen i Quest. Läs den engelska kontrollguiden, prova vänster styrspaks klick för sprint och höger för huka. Kontrollera huvudträff, ljudnivå, material, skala, animation, kollision och bildfrekvens.

Det automatiska testet `tests/phase51_monsters_arena_test.gd` verifierar bland annat modeller, spawnpunkter, vägval och ett skott i Horror-monstrets huvud. `tests/phase52_controls_audio_test.gd` kontrollerar att de syntetiserade ljuden innehåller signal och att desktopspelaren har sprint och ljudspelare. Testerna ersätter **inte** den visuella, ljudmässiga och prestandamässiga kontrollen i ett riktigt headset. Om Quest känns tungt: börja med färre levande monster eller ytterligare förenklad Giant-geometri innan du lägger till effekter.

<div class="checkpoint" data-checklist="real-monsters"><h3>Kontrollera kapitel 19</h3><label><input type="checkbox"> Horror Game Monster och Giant Mutant syns och animeras.</label><label><input type="checkbox"> Båda kan skadas och besegras, även med ett skott i huvudet.</label><label><input type="checkbox"> Fienderna syns inte direkt från startpunkten och hittar runt väggarna.</label><label><input type="checkbox"> Skott, spelarsteg och hopp hörs utan att monstren avslöjas för tidigt.</label><label><input type="checkbox"> Vänster styrspaks klick sprintar, höger klick hukar och kontrollguiden stämmer.</label><label><input type="checkbox"> Skala, material, ljudnivå och bildfrekvens har kontrollerats i Quest.</label></div>
