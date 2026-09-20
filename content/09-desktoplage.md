<div class="callout"><strong>Detta kapitel är valfritt.</strong><p>Du kan fortsätta bygga och testa spelet enbart med Meta Quest. Desktopläget finns för den som vill prova grundläggande spelmekanik snabbare eller saknar tillgång till ett headset.</p></div>

## Varför ett separat testläge? {#varfor-desktoplage}

Ett XR-spel behöver normalt ett aktivt OpenXR-headset för kamera- och kontrollspårning. Det gör små tester onödigt långsamma. Med en separat skrivbordsspelare kan vi starta samma huvudscen direkt på datorn och testa exempelvis rum, kollisioner, monster och projektiler.

Desktopläget ersätter inte ett riktigt XR-test. Det är ett extra verktyg under utvecklingen.

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
| Esc | Släpp muspekaren |
| Vänsterklick efter Esc | Fånga muspekaren igen |

Spelaren använder gravitation och `move_and_slide()`. Kollisionskapseln har samma collision layer och mask som XR-spelarens kropp, så båda spelarna möter samma golv och hinder.

## Plocka upp utan XR-kontroller {#desktop-pickup}

En `RayCast3D` går från kameran genom siktet. När spelaren högerklickar kontrollerar desktopspelaren om strålen träffar ett greppbart XR Tools-föremål. Föremålet flyttas då till en `HoldPoint` framför kameran. Nästa högerklick släpper tillbaka det i spelvärlden och aktiverar fysiken igen.

Funktionen ligger i desktopspelaren, inte i pistolen. Därför fungerar samma kod för den primitiva pistolen, testkuberna och framtida greppbara föremål.

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

När vi senare bygger ett vapen ska vapnets skada, ammunition och projektil inte skrivas två gånger. XR-spelaren och desktopspelaren ska bara skicka samma kommando, till exempel `fire()`, till samma vapenskript.

```text
XR-avtryckare ─┐
               ├──> Weapon.fire() ──> gemensam projektil och skada
Musklick ─────┘
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

Om OpenXR är aktivt väljer spelet i stället XR-spelaren automatiskt. Du behöver inte ändra huvudscenen mellan testen.

<div class="checkpoint" data-checklist="desktoplage"><h3>Kontrollera desktopläget</h3><label><input type="checkbox"> Spelet startar utan ett anslutet headset.</label><label><input type="checkbox"> WASD eller piltangenter flyttar spelaren.</label><label><input type="checkbox"> Musen styr kameran.</label><label><input type="checkbox"> Golvet och hindret stoppar spelaren.</label><label><input type="checkbox"> Ett greppbart föremål kan plockas upp och släppas med högerklick.</label><label><input type="checkbox"> XR-spelaren startar fortfarande när OpenXR är aktivt.</label></div>

## Regeln för fortsatt utveckling {#regel-framat}

Nya spelmekaniker byggs som fristående scener och skript när det är möjligt. Spelarna ansvarar bara för inmatning och för att uttrycka spelarens avsikt. På så sätt kan samma monster, vapen och bana användas i både XR- och desktopläget utan kopierad spelkod.
