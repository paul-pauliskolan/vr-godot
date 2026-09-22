<div class="callout"><strong>Detta kapitel är valfritt.</strong><p>Du kan fortsätta bygga och testa spelet enbart med Meta Quest. Desktopläget finns för den som vill prova grundläggande spelmekanik snabbare eller saknar tillgång till ett headset.</p></div>

## Varför ett separat testläge? {#varfor-desktoplage}

Ett XR-spel behöver normalt ett aktivt OpenXR-headset för kamera- och kontrollspårning. Det gör små tester onödigt långsamma. Med en separat skrivbordsspelare kan vi starta samma huvudscen direkt på datorn och testa exempelvis rum, kollisioner, monster och projektiler.

Desktopläget ersätter inte ett riktigt XR-test. Det är ett extra verktyg under utvecklingen.

## Undvik OpenXR-varningen på Mac {#openxr-varning}

OpenXR måste vara aktivt redan när Godot startar ett XR-program. Om inställningen är påslagen för alla plattformar försöker därför den vanliga Play-knappen hitta ett Mac-anslutet headset innan spelets egen reservlösning hinner välja desktopspelaren. Utan en aktiv OpenXR-runtime visas då varningen `HMD was not detected`.

Projektet använder i stället en plattformsanpassad inställning i `project.godot`:

```ini
[xr]

openxr/enabled=false
openxr/enabled.android=true
openxr/reference_space=2
shaders/enabled=true
```

Grundvärdet `false` gör att **Play/F6 på Mac** startar desktopläget utan varning. Android-överskrivningen aktiverar OpenXR i den exporterade Quest-appen. Exportpreseten **Meta Quest** har dessutom `XR Mode` satt till `OpenXR`.

Det ger två tydliga testknappar:

- Godots vanliga Play-knapp testar desktopläget på Mac.
- Android/Quest-knappen uppe till höger bygger, installerar och startar XR-versionen i headsetet.

## Två spelare, samma spelvärld {#tva-spelare}

Projektet har nu två fristående spelarscener:

```text
Blueprints/
├── xr_player.tscn
└── desktop_player.tscn
```

`xr_player.tscn` innehåller XR-kamera, spårade kontroller, händer och XR Tools-funktioner. `desktop_player.tscn` innehåller i stället en `CharacterBody3D`, en vanlig `Camera3D` och en kollisionskapsel.

Huvudscenen innehåller inte längre en permanent spelare. `main.gd` väljer och skapar rätt spelarscen vid start:

```gdscript
const XR_PLAYER_SCENE := preload("res://Blueprints/xr_player.tscn")
const DESKTOP_PLAYER_SCENE := preload("res://Blueprints/desktop_player.tscn")

func _ready() -> void:
	var xr_interface := XRServer.find_interface("OpenXR")

	if xr_interface and xr_interface.is_initialized():
		get_viewport().use_xr = true
		add_child(XR_PLAYER_SCENE.instantiate())
	else:
		get_viewport().use_xr = false
		add_child(DESKTOP_PLAYER_SCENE.instantiate())
```

Koden på webbplatsen visar principen i koncentrerad form. Projektets `main.gd` innehåller dessutom namngivning och tydliga meddelanden i Godots Output-panel.

## Kontroller i desktopläget {#desktop-kontroller}

| Kontroll | Funktion |
| --- | --- |
| WASD eller piltangenter | Gå framåt, bakåt och åt sidorna |
| Mus | Titta uppåt, nedåt och åt sidorna |
| Högerklick | Plocka upp eller släpp ett greppbart föremål |
| Vänsterklick med ett vapen | Skjut |
| Mellanslag | Hoppa |
| Vänster Ctrl eller C | Huka så länge tangenten hålls nere |
| Esc | Släpp muspekaren |
| Vänsterklick efter Esc | Fånga muspekaren igen |

Spelaren använder gravitation och `move_and_slide()`. Kollisionskapseln har samma collision layer och mask som XR-spelarens kropp, så båda spelarna möter samma golv och hinder.

## Hoppa och huka {#hoppa-huka}

Mellanslag ger spelaren en uppåtriktad hastighet när kroppen står på golvet. Gravitationen tar sedan tillbaka spelaren till marken.

När vänster Ctrl eller C hålls nere sänks både kameran och kollisionskapseln gradvis. Det är viktigt att ändra båda: om bara kameran sänks ser spelaren hukad ut men den osynliga kroppen är fortfarande fullhög.

## Plocka upp utan XR-kontroller {#desktop-pickup}

En `RayCast3D` går från kameran genom siktet. När spelaren högerklickar kontrollerar desktopspelaren om strålen träffar ett greppbart XR Tools-föremål. Föremålet flyttas då till en `HoldPoint` framför kameran. Nästa högerklick släpper tillbaka det i spelvärlden och aktiverar fysiken igen.

Funktionen ligger i desktopspelaren, inte i pistolen. Därför fungerar samma kod för den primitiva pistolen, testkuberna och framtida greppbara föremål.

Ett hållet fysikobjekt sätts till kinematiskt frysläge och synkas med `HoldPoint` varje bildruta. Därför följer pistolen både spelarens förflyttning och musens kamerarotation utan att fysikmotorn lämnar kvar den i världen.

## Sikta och skjut {#desktop-sikte}

Siktet ligger mitt på skärmen, men den hållna pistolen ligger lite åt höger och nedanför kameran. Om kulan bara skulle flyga rakt fram parallellt med kameran skulle den därför hamna bredvid siktet, särskilt på nära håll.

När du vänsterklickar skickar desktopspelaren en osynlig stråle från kamerans mitt genom siktet. Träffpunkten blir målet, men själva projektilen skapas fortfarande vid pistolens `MuzzlePoint` och flyger från mynningen till målet. Om siktstrålen inte träffar något används en punkt långt fram i kamerans riktning.

Detta är bara en korrigering för desktoplägets skärmsikte. I XR finns inget fast sikte mitt i bilden: där fortsätter kulan längs den fysiska pistolens riktning.

## Blir det mycket dubbelkodning? {#dubbelkodning}

Nej, inte om vi håller gränsen tydlig. Det som beror på hur personen styr spelet behöver vara separat. Själva spelets regler ska vara gemensamma.

| Separat för XR och desktop | Gemensamt för båda lägena |
| --- | --- |
| Kamera och huvudrörelse | Monster och AI |
| Handkontroller eller mus | Hälsa och skada |
| Grepp med hand eller tangent | Vapenegenskaper |
| XR-rörelse eller WASD | Projektiler och träffar |
| Haptik | Slumpgenererade rum |
| XR-specifika menyer | Poäng, vinst och förlust |

Vapnets skada, ammunition och projektil ska inte skrivas två gånger. XR-spelaren och desktopspelaren använder samma vapenskript, men kan ange riktningen på olika sätt.

```text
XR-avtryckare ──> Weapon.fire() ─────────┐
                                         ├──> gemensam projektil och skada
Musklick ───────> Weapon.fire_towards() ─┘
```

Detta mönster gör att desktopläget ger lite extra kod nu men kan spara mycket testtid senare.

## Vad kan testas utan headset? {#kan-testas}

Desktopläget passar för att testa:

- nivåns geometri och kollisioner,
- greppbara föremål med höger musknapp,
- slumpgenererade rum,
- monster, navigation och AI,
- projektiler, träffar och skada,
- spelregler, poäng och omstart.

Ett riktigt headset behövs fortfarande för att bedöma:

- stereoskopisk bild och upplevd skala,
- händernas position och greppkänsla,
- komfort och risk för rörelsesjuka,
- haptik och kontrollernas knappar,
- prestanda i den exporterade Quest-versionen.

## Så provar du läget {#prova-desktoplage}

1. Koppla bort eller stäng av headsetets OpenXR-anslutning.
2. Öppna projektet i Godot.
3. Starta huvudscenen med <kbd>F6</kbd> eller hela projektet med <kbd>F5</kbd>.
4. Kontrollera att Output visar `Inget aktivt OpenXR-headset: startar desktop-spelaren.`
5. Gå runt med WASD och musen och kontrollera att spelaren stannar mot hindret.
6. Rikta siktet mot ett greppbart föremål och högerklicka för att plocka upp och släppa det.
7. Plocka upp pistolen, rikta siktet mot en kub och vänsterklicka. Kulan ska gå mot siktets punkt.
8. Tryck på mellanslag för att hoppa och håll Ctrl eller C för att huka.

Android/Quest-exporten aktiverar OpenXR och väljer XR-spelaren automatiskt. Du behöver inte ändra huvudscenen eller projektinställningen mellan testen.

<div class="checkpoint" data-checklist="desktoplage"><h3>Kontrollera desktopläget</h3><label><input type="checkbox"> Spelet startar utan ett anslutet headset.</label><label><input type="checkbox"> WASD eller piltangenter flyttar spelaren.</label><label><input type="checkbox"> Musen styr kameran och ett hållet vapen följer med.</label><label><input type="checkbox"> Golvet och hindret stoppar spelaren.</label><label><input type="checkbox"> Ett greppbart föremål kan plockas upp och släppas med högerklick.</label><label><input type="checkbox"> En kula från den hållna pistolen går mot siktets punkt.</label><label><input type="checkbox"> Mellanslag får spelaren att hoppa.</label><label><input type="checkbox"> Ctrl eller C sänker både kameran och kollisionskapseln.</label><label><input type="checkbox"> XR-spelaren startar fortfarande när OpenXR är aktivt.</label></div>

## Regeln för fortsatt utveckling {#regel-framat}

Nya spelmekaniker byggs som fristående scener och skript när det är möjligt. Spelarna ansvarar bara för inmatning och för att uttrycka spelarens avsikt. På så sätt kan samma monster, vapen och bana användas i både XR- och desktopläget utan kopierad spelkod.
