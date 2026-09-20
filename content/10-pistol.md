<div class="callout"><strong>Ett litet steg i taget.</strong><p>I det här kapitlet bygger vi bara pistolens form, kollisioner och greppunkter. Pistolen skjuter inte ännu. Projektiler, träffar och skada blir egna kapitel.</p></div>

## Målet med kapitlet {#malet}

Vi ska bygga en enkel svart pistol av Godots primitiva former. Modellen ska vara ungefär lika stor som en verklig mindre handpistol, kunna ligga i fysikvärlden och vara förberedd för att plockas upp med båda XR-händerna.

Efter kapitlet har pistolen:

- en separat, återanvändbar scen,
- synliga delar av `BoxMesh` och `CylinderMesh`,
- enkla och stabila kollisionsformer,
- en greppunkt för varje hand,
- en `MuzzlePoint` där framtida projektiler kan skapas.

## Skapa en ärvd Pickable-scen {#skapa-scen}

XR Tools innehåller redan logiken för greppbara objekt. Vi återanvänder den i stället för att skriva egen pickupkod i pistolen.

1. Leta upp `addons/godot-xr-tools/objects/pickable.tscn` i FileSystem-panelen.
2. Öppna scenen.
3. Välj **Scene → New Inherited Scene**.
4. Spara den nya scenen som `Blueprints/pistol.tscn`.
5. Döp rotnoden till `Pistol`.
6. Sätt `Mass` till `0.8` och aktivera `Sleeping`.

Roten är en `RigidBody3D` med XR Tools-skriptet `XRToolsPickable`. Det gör att pistolen kan reagera på gravitation och kollisioner samt plockas upp av XR-spelarens pickupfunktion.

## Planera nodstrukturen {#nodstruktur}

Lägg till följande barnnoder:

```text
Pistol (XRToolsPickable/RigidBody3D)
├── CollisionShape3D
├── GripCollision
├── Frame
├── Slide
├── Grip
├── Trigger
├── TriggerGuardFront
├── TriggerGuardBottom
├── Muzzle
├── EjectionPort
├── FrontSight
├── RearSight
├── MuzzlePoint
├── GrabPointHandLeft
└── GrabPointHandRight
```

Namnen beskriver delarnas uppgift. Det blir enklare att justera modellen och senare hitta mynningen eller greppunkterna från GDScript.

## Skapa materialen {#material}

Skapa tre `StandardMaterial3D`-resurser. De kan sparas lokalt i pistolscenen.

| Material | Albedo | Metallic | Roughness | Används till |
| --- | --- | ---: | ---: | --- |
| Svart metall | Nästan svart | 0.55 | 0.48 | Ram, slide och avtryckarskydd |
| Svart grepp | Mörkt gråsvart | 0.0 | 0.90 | Handtag och mynning |
| Mörk detalj | Mörkgrå | 0.70 | 0.70 | Avtryckare, sikten och utkastarport |

Materialen är avsiktligt enkla. Formen och proportionerna är viktigare än realistiska texturer i detta steg.

## Bygg pistolens huvudform {#huvudform}

Skapa en `MeshInstance3D` för varje rad. Välj `BoxMesh` som mesh och ange värdena i meter.

| Nod | Position X, Y, Z | Rotation X | Mesh-storlek X, Y, Z |
| --- | --- | ---: | --- |
| `Frame` | `0, 0.050, -0.035` | `0°` | `0.036, 0.052, 0.145` |
| `Slide` | `0, 0.083, -0.045` | `0°` | `0.032, 0.038, 0.175` |
| `Grip` | `0, -0.025, 0.025` | `-12°` | `0.038, 0.105, 0.045` |
| `Trigger` | `0, 0.012, -0.025` | `-20°` | `0.012, 0.030, 0.006` |

Det vinklade greppet gör siluetten lättare att känna igen. Slide är längre och smalare än ramen och ligger ovanpå den.

## Lägg till avtryckarskydd och detaljer {#detaljer}

Avtryckarskyddet byggs av två små `BoxMesh`-noder:

| Nod | Position X, Y, Z | Mesh-storlek X, Y, Z |
| --- | --- | --- |
| `TriggerGuardFront` | `0, 0.002, -0.052` | `0.032, 0.043, 0.006` |
| `TriggerGuardBottom` | `0, -0.018, -0.028` | `0.032, 0.006, 0.052` |

Lägg sedan till dessa detaljer:

- `Muzzle`: en `CylinderMesh` med radie `0.012`, höjd `0.014`, position `0, 0.083, -0.139` och X-rotation `90°`.
- `EjectionPort`: en `BoxMesh` med storlek `0.034, 0.014, 0.045` och position `0, 0.098, -0.035`.
- `FrontSight`: en liten `BoxMesh` vid `0, 0.108, -0.112`.
- `RearSight`: samma lilla mesh vid `0, 0.108, 0.027`.

Siktenas BoxMesh har storleken `0.010, 0.012, 0.014`. Använd det mörkgrå detaljmaterialet till avtryckaren, utkastarporten och siktena.

## Använd enkla kollisionsformer {#kollisioner}

Den synliga modellen har många små delar, men den behöver inte lika många kollisionsformer. Två `BoxShape3D` räcker:

| Kollisionsnod | Position X, Y, Z | Rotation X | Shape-storlek X, Y, Z |
| --- | --- | ---: | --- |
| `CollisionShape3D` | `0, 0.055, -0.045` | `0°` | `0.040, 0.090, 0.190` |
| `GripCollision` | `0, -0.025, 0.025` | `-12°` | `0.045, 0.120, 0.055` |

Enklare kollisioner är billigare och stabilare än att försöka följa varje liten visuell detalj.

## Förbered mynningen {#muzzle-point}

Lägg till en `Marker3D` med namnet `MuzzlePoint` och positionen:

```text
X:  0
Y:  0.083
Z: -0.150
```

Godots framåtriktning i 3D är normalt negativ Z. Markören sitter därför strax framför pipan. I ett senare kapitel kan vapnet skapa en projektil vid `MuzzlePoint.global_transform`.

## Lägg till greppunkterna {#greppunkter}

Instansiera dessa två XR Tools-scener som barn till `Pistol`:

- `addons/godot-xr-tools/objects/grab_points/grab_point_hand_left.tscn`
- `addons/godot-xr-tools/objects/grab_points/grab_point_hand_right.tscn`

Använd följande transform för båda:

```text
Position: 0, -0.022, 0.028
Rotation X: -12°
```

Greppunkten talar om var handen ska hamna i förhållande till pistolen. För att finjustera greppläget markerar du `GrabPointHandLeft` eller `GrabPointHandRight` och ändrar nodens `Transform` i Inspector.

<div class="callout"><strong>Flytta greppunkten, inte modellen.</strong><p>Om pistolen ligger fel i handen ska du justera den aktuella greppunktens position och rotation. Då kan vänster och höger hand korrigeras oberoende utan att mynningen, kollisionerna eller övriga delar flyttas.</p></div>

Aktivera `Editor Preview Mode` på greppunkten om du vill se en förhandsvisning av handen. Gör små justeringar, exempelvis `0.005` meter eller `2–5°` i taget. Den slutliga vinkeln måste alltid provas i headsetet.

## Placera pistolen i huvudscenen {#placera-pistolen}

1. Öppna `Main.tscn`.
2. Dra `Blueprints/pistol.tscn` från FileSystem-panelen till scenen.
3. Döp instansen till `Pistol`.
4. Placera den på testbordet vid ungefär `0.45, 1.17, -1.08`.

Pistolen kan nu ses i både XR- och desktopläget. I desktopläget riktar du siktet mot pistolen och högerklickar för att plocka upp eller släppa den. [Desktopläget beskrivs i kapitel 09](09-desktoplage.html#desktop-pickup).

## Testa innan du fortsätter {#testa}

Testa först på datorn:

1. Starta projektet utan ett aktivt OpenXR-headset.
2. Kontrollera att pistolen ligger på bordet och har rimlig storlek.
3. Rikta siktet mot pistolen och högerklicka.
4. Kontrollera att pistolen följer kameran.
5. Högerklicka igen och kontrollera att pistolen faller och kolliderar med världen.

Testa sedan i Quest:

1. Plocka upp pistolen med höger hand och kontrollera vinkeln.
2. Upprepa med vänster hand.
3. Justera respektive greppunkt om handen hamnar fel.
4. Kontrollera att pistolen kan släppas utan att fastna i handen eller spelaren.

<div class="checkpoint" data-checklist="primitiv-pistol"><h3>Kontrollera pistolscenen</h3><label><input type="checkbox"> Pistolen har en tydlig slide, ram, mynning och ett vinklat grepp.</label><label><input type="checkbox"> Pistolen ligger stabilt på bordet.</label><label><input type="checkbox"> Desktopspelaren kan plocka upp och släppa pistolen med högerklick.</label><label><input type="checkbox"> Pistolen kan plockas upp med höger XR-hand.</label><label><input type="checkbox"> Pistolen kan plockas upp med vänster XR-hand.</label><label><input type="checkbox"> MuzzlePoint sitter strax framför mynningen.</label></div>

## Vad kommer härnäst? {#nasta-steg}

Pistolen har ännu ingen skjutkod. Nästa minsta steg är ett kort GDScript med metoden `fire()`. Först ska metoden ge en tydlig debug-reaktion exakt en gång per avtryckning. När det fungerar kopplar vi in en separat projektilscen.
