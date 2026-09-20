## 1. Skapa en återanvändbar kub {#kub}

**Förutsättning:** [Kapitel 4](04-spelaren.html) är klart: händer och rörelse fungerar, och båda kontrollerna har FunctionPickup.

Vi gör en kub som är **10 centimeter** bred. I det här projektet motsvarar en Godot-enhet en meter. Följ samma skala för golv, bord och spelare.

1. Välj **Scene → New Inherited Scene**.
2. Öppna **addons/godot-xr-tools/objects/pickable.tscn**. Videon använder benämningen Pickup, men den dokumenterade grundscenen heter `pickable.tscn`.
3. Spara din ärvda scen som **scenes/pickup_object.tscn**. Spara inte över pluginets original.
4. Lägg till en **MeshInstance3D** under objektets rot. Välj **New BoxMesh** och sätt **Size = (0.1, 0.1, 0.1)**.
5. På den ärvda **CollisionShape3D**: skapa **BoxShape3D**, också **Size = (0.1, 0.1, 0.1)**. Om scenen redan har en delad shape-resurs, välj **Make Unique** innan du ändrar den för din kub.
6. Ge BoxMesh ett **StandardMaterial3D** och en tydlig färg, till exempel turkos. Mesh och collision ska båda ligga vid lokal position `(0, 0, 0)`.

Roten är en fysikkropp med pickup-logik. Lägg inte till en extra RigidBody3D runt den. [XR Tools: Pickable Objects](https://godotvr.github.io/godot-xr-tools/docs/pickable/)

## 2. Ställ in kollisionslager {#lager}

Ett **Collision Layer** säger vad objektet är. En **Collision Mask** säger vilka lager det ska upptäcka eller kollidera med. Följande enkla upplägg använder XR Tools rekommenderade lagernummer.

| Del | Collision Layer | Collision Mask / annan inställning |
| --- | --- | --- |
| Golv och bord | 1: Static World | Behåll övriga grundinställningar. |
| Kub som ligger löst | 3: Pickable Objects | 1 och 3: världen och andra kuber. |
| FunctionPickup | Behåll komponentens lager | Masken måste innehålla 3. |
| PlayerBody | 20: Player Body | Masken måste innehålla 1; standarden inkluderar normalt 1–10. |
| Kub medan den hålls | Picked Up Layer = 17 | Lager 17 ska inte ingå i PlayerBodys kollisionsmask. |

Lagernummer i tabellen är **kryssrutornas nummer**, inte de numeriska bitmaskvärdena. Namnge gärna lagren i **Project Settings → Layer Names → 3D Physics**. Pluginet kan också erbjuda **Project → Tools → XR Tools → Set Physics Layers**.

Välj **Release Mode = Original** på pickup-objektet för att återställa dess ursprungliga fysik när du släpper. Kontrollera att objektet är aktiverat. [Physics Layers](https://godotvr.github.io/godot-xr-tools/docs/physics_layers/) · [Pickable-inställningar](https://godotvr.github.io/godot-xr-tools/docs/pickable/)

## 3. Lägg till greppunkter {#greppunkter}

Greppunkter bestämmer hur handen placeras när den håller kuben. Markera pickup-scenens rot och instansiera **Grab Point Hand Left**. Slå tillfälligt på handens synlighet i editorn och flytta/rotera greppunkten så att handen ligger naturligt runt kuben.

Gör samma sak med **Grab Point Hand Right**. Placera greppunkterna på objektet, inte under spelarens kontroller. Stäng av förhandsvisningshänderna när du är färdig, enligt handscenens inställning, och spara. Anpassa vänster och höger grepp var för sig i stället för att bara duplicera en identisk rotation. [Grab Points](https://godotvr.github.io/godot-xr-tools/docs/grab_point/)

## 4. Bygg bordet som ett rätblock {#bord}

Det här utvecklar det snabbspolade momentet omkring **17:40** i [ursprungsvideon](https://www.youtube.com/watch?v=gbTUNg99lrg&t=1060s). Måtten är egna exempel. Golvets ovansida ligger på Y = 0 enligt kapitel 2.

1. Öppna **main.tscn**. Lägg till **StaticBody3D** under `Main` och döp den till `Table`.
2. Lägg till **MeshInstance3D** under `Table`. Skapa **BoxMesh** med **Size = (1.5, 0.8, 0.7)**.
3. Lägg till **CollisionShape3D** som ett andra barn. Skapa **BoxShape3D** med exakt samma storlek.
4. På `Table`: sätt **Position = (0, 0.4, -1.5)**. Bordets ovansida hamnar på **Y = 0.8**, och bordet står framför spelarens startpunkt.
5. Låt barnens lokala position vara `(0, 0, 0)` och samtliga skalor vara `(1, 1, 1)`.
6. Ge bordet en färg som skiljer sig från golvet. Kontrollera att det ligger på kollisionslager 1.

```text
Table (StaticBody3D)
├── MeshInstance3D → BoxMesh: 1.5 × 0.8 × 0.7
└── CollisionShape3D → BoxShape3D: 1.5 × 0.8 × 0.7
```

Ett massivt rätblock räcker för övningen. Du kan senare göra en tunn skiva med ben, men börja med en enda lättkontrollerad kollisionsform.

## 5. Ställ tre kuber på bordet {#placering}

Dra **scenes/pickup_object.tscn** från FileSystem till `Main` i scenträdet. Den ska vara ett syskon till bordet. Markera **hela objektets rot** och sätt positionen enligt tabellen. Duplicera två gånger.

| Instans | X | Y | Z |
| --- | --- | --- | --- |
| PickupObject | -0.3 | 0.86 | -1.5 |
| PickupObject2 | 0 | 0.86 | -1.5 |
| PickupObject3 | 0.3 | 0.86 | -1.5 |

Varje kub har halva höjden 0.05. Dess undersida börjar därför på **0.86 − 0.05 = 0.81**: en centimeter ovanför bordet. Vid start faller den den lilla biten ner. Börja inte med kuben inuti bordets collision.

## 6. Testa och utveckla {#test}

Spara och kör på Quest. Gå fram med styrspaken, för handen till kuben och använd greppknappen som är bunden till pickup-funktionen. Släpp och kontrollera att kuben stannar på bordet. Upprepa med andra handen.

<div class="checkpoint" data-checklist="objects"><h3>Sluttest</h3><label><input type="checkbox"> Tre kuber ligger kvar på bordet.</label><label><input type="checkbox"> Jag kan greppa med båda händerna.</label><label><input type="checkbox"> Kuben faller när jag släpper den.</label><label><input type="checkbox"> Spelaren skjuts inte iväg av ett hållet objekt.</label></div>

**Öva vidare:** gör en andra objektform med en matchande collision, flytta bordet och anpassa kubernas positioner, eller bygg ett litet rum. Behåll en kopia av den fungerande grundscenen innan du experimenterar.

Faller kuber genom bordet? Kontrollera shape och mask. Skjuts spelaren iväg? Kontrollera lagret för hållna objekt. Fungerar inte grepp alls? Kontrollera pickup-funktionen, lager 3 och action map. Se [felsökningen för interaktion](06-felsokning.html#interaktion).
