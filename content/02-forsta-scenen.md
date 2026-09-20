## 1. Skapa projektet {#projekt}

**Förutsättning:** Du har installerat och startat Godot enligt [kapitel 1](01-start.html#installera-godot).

Öppna Godot Project Manager och välj **Create / New Project**. Döp projektet till **VR Start**, välj en tom projektmapp och välj **GDScript/Standard-versionen** av Godot. Skapa gärna ett Git-repository om du använder Git, men det krävs inte för övningen.

Välj **Mobile** som renderer för kursens huvudspår. Godots 4.7-guide *Setting up XR* rekommenderar Mobile även för Quest 3. Android-XR-guiden innehåller samtidigt en rekommendation om Compatibility. Därför använder vi Mobile först och provar Compatibility på en kopia av ett minimalt projekt om loggen pekar mot grafikproblem. Forward+ tillför onödig komplexitet i denna startövning. [Jämförelse av källorna](07-kallor.html#skillnader)

Skapa en **3D Scene**. Rotnoden ska vara **Node3D** och heta `Main`. Spara den som **main.tscn** i projektets rot. Högerklicka filen och välj **Set as Main Scene**. Skapa mapparna `scenes` och `scripts` i **FileSystem**.

## 2. Bygg ett golv {#golv}

1. Markera `Main`. Använd **Add Child Node** (+) och lägg till **StaticBody3D**. Döp den till `Ground`.
2. Lägg till **MeshInstance3D** under `Ground`. I Inspector: **Mesh → New BoxMesh**.
3. Öppna BoxMesh-resursen och sätt **Size = (10, 0.1, 10)**.
4. Lägg till **CollisionShape3D** direkt under `Ground`, som syskon till mesh-noden. Välj **Shape → New BoxShape3D**, med samma **Size = (10, 0.1, 10)**.
5. På `Ground`: sätt **Transform → Position → Y = -0.05**. Då ligger golvets ovansida exakt vid **Y = 0**.
6. Låt barnens position vara `(0, 0, 0)` och alla noders skala vara `(1, 1, 1)`.

För färg: öppna BoxMesh-resursens **Material**, skapa **StandardMaterial3D** och välj en medelgrå **Albedo → Color**. Färgen hör till den synliga modellen, inte kollisionsformen.

**Kontroll:** Mesh och collision ska ligga på samma plats och vara lika stora. Golvet ska ligga under världens origo. Dessa mått är kursens exempel.

## 3. Ge världen ljus {#ljus}

Lägg till **DirectionalLight3D** under `Main`. Sätt till exempel dess rotation till **X = -60°, Y = -30°, Z = 0°**. Det belyser golvet snett uppifrån.

Lägg till **WorldEnvironment**. Välj **Environment → New Environment**, öppna resursen och sätt **Background → Mode = Sky**. Skapa **Sky** och välj **ProceduralSkyMaterial** som dess **Sky Material**. Alternativt kan du använda 3D-vyns meny för att lägga till förhandsvisningens sol och miljö i scenen.

En sol som bara visas i editorns förhandsvisning följer inte automatiskt med spelet. Kontrollera att ljuset och WorldEnvironment verkligen syns som noder i scenens träd.

## 4. Aktivera OpenXR {#openxr}

Öppna **Project → Project Settings**. Slå på **Advanced Settings** om någon inställning saknas.

| Inställning | Värde |
| --- | --- |
| XR → OpenXR → Enabled | På |
| XR → OpenXR → Reference Space | Local Floor |
| XR → Shaders → Enabled | På |

Välj **Save & Restart** när Godot begär det. Local Floor låter den spårade golvnivån vara utgångspunkt för spelaren. Du ska därför inte lägga på en extra ståhöjd på hela spelarens XROrigin3D. [OpenXR-inställningar](https://docs.godotengine.org/en/4.7/tutorials/xr/openxr_settings.html)

## 5. Skapa xr_player.tscn {#xr-player}

Skapa en ny scen med **Other Node → XROrigin3D** som rot. Döp rotnoden till `XRPlayer`. Lägg till **XRCamera3D** som barn. Spara scenen som **scenes/xr_player.tscn**.

Gå tillbaka till `main.tscn` och dra in `xr_player.tscn` som ett barn till `Main`. Sätt instansens position till `(0, 0, 0)`. Kamerans spårade position kommer från headsetet när spelet körs. Det är normalt att kameran ligger nära origo i editorn.

```text
Main (Node3D)
├── Ground (StaticBody3D)
│   ├── MeshInstance3D
│   └── CollisionShape3D
├── DirectionalLight3D
├── WorldEnvironment
└── XRPlayer (instans av xr_player.tscn)
    └── XRCamera3D
```

## 6. Lägg startkoden i main.gd {#main-gd}

Markera `Main`, välj **Attach Script** och spara som **scripts/main.gd**. Ersätt mallkoden med detta:

```gdscript
extends Node3D

# Sparar en referens till Godots OpenXR-interface.
var xr_interface: XRInterface

# Körs när scenens noder är redo.
func _ready() -> void:
    xr_interface = XRServer.find_interface("OpenXR")

    # OpenXR startas av motorn när det är aktiverat i projektet.
    if xr_interface and xr_interface.is_initialized():
        # Skicka denna viewports bild till headsetets båda ögon.
        get_viewport().use_xr = true
        print("OpenXR är redo – VR-bilden är aktiverad.")
    else:
        # På Mac kan detta bero på att projektet körs lokalt med F5.
        push_warning("OpenXR är inte redo. Kör Android-exporten på Quest.")
```

**Varför inget `initialize()`?** OpenXR startar tidigt i Godot 4.7. Det officiella exemplet kontrollerar därför `is_initialized()`. Lägg inte till flera olika XR-startscript i samma projekt. Godot beskriver också att OpenXR sköter sin egen bildtiming; videons manuella avstängning av VSync behövs inte i detta grundexempel. [Godot 4.7: startkod och bildtiming](https://docs.godotengine.org/en/4.7/tutorials/xr/setting_up_xr.html)

Du kan [ladda ner main.gd](downloads/main.gd) om du vill jämföra din fil med exemplet.

## 7. Kontrollera scenen före export {#forsta-testet}

Spara allt och kontrollera scenen i editorn. Första headsettestet görs i **nästa kapitel**, efter installation av Android-verktyg och anslutning av Quest. Vanlig **F5** på Mac startar datorversionen. För denna kurs ska Android-exporten startas på Quest med **One-click deploy**.

<div class="checkpoint" data-checklist="scene"><h3>Klart när …</h3><label><input type="checkbox"> main.tscn är huvudscen och main.gd sitter på Main.</label><label><input type="checkbox"> Golv, ljus, XROrigin3D och XRCamera3D finns.</label><label><input type="checkbox"> Projektet är sparat och editorn visar inga scriptfel.</label></div>

Fortsätt nu till [kapitel 3: Från Mac till Quest 3](03-macos-quest.html). Där installerar du byggverktygen och provar den här scenen i headsetet. XR Tools lägger du till först i kapitel 4, när grundtestet fungerar.
