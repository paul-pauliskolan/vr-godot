# Getting Started With XR in Godot 4.3 – svensk transkription

Källa: YouTube-videon _Getting Started With XR in Godot 4.3 Tutorial!_.

> \***\***Granskningskommentar\***\*:** Transkriptionen nedan återger videons instruktioner utan att ändra dem. Tekniska namn, Godot-noder, kod, VR/XR-termer, menyer och settings behålls på engelska. Videon gäller **Godot 4.3**, och vissa menyer, plugin-steg och rekommendationer kan därför skilja sig i senare versioner av Godot. Kommentarer markerade \*\*Granskningskommentar\*\* är tillagda separat och ändrar inte transkriptionen.

## 00:00 – Introduktion

Hej allihopa, Virtual Rook här. I dag hoppas jag kunna lära er hur man kommer igång med **OpenXR** i **Godot**. Jag kommer att använda **Godot 4.3**. Det här bör fungera även med framtida versioner, men jag planerar att uppdatera videon om det behövs när nya versioner kommer.

Jag vill också snabbt tacka Muddy Wolf på YouTube. Deras tutorials är i princip grunden för det jag kommer att visa i dag. Jag ville göra min egen version som är lite mer komprimerad och tar upp lite mer i en enda video. Tack så mycket till dem. Kolla gärna in deras material eftersom de går in mycket mer detaljerat på många andra saker kring **XR** i **Godot**.

Nu sätter vi igång och får **VR** att fungera i **Godot**.

## 00:29 – Skapa projektet

Skapa ett nytt projekt. Vi kallar det **XR Game**.

Vi lämnar **Renderer** på **Mobile**, så att det fungerar om du till exempel vill köra det på en **Quest**. Då bör allt vara rätt konfigurerat för det. Om du vill göra en PC-version kan du använda **Forward+**, som är den mer avancerade varianten.

Jag vill utforska det mer senare, men just nu använder vi **Mobile**. Jag stänger av **Git**, eftersom jag inte behöver det, och skapar projektet.

Jag kommer att gå igenom saker ganska snabbt. Om du har frågor kan du skriva dem i kommentarerna.

Vi sätter scenen som en **3D Scene**, eftersom det är VR och därför naturligtvis 3D. Tryck sedan **Ctrl+S** för att spara scenen direkt.

## 01:23 – Main scene och mappar

Vi kallar scenen **Main** och sparar den.

Högerklicka sedan på **Main** och välj **Set as Main Scene**.

I **FileSystem** högerklickar vi och skapar en ny folder som vi kallar **Worlds**. Sedan skapar vi ytterligare en folder som vi kallar **Blueprints**.

Jag kommer från **Unreal Engine**, så du kan kalla den vad du vill. Det här är bara foldern där jag lägger scenes som jag har byggt och som senare ska läggas till i andra maps och liknande.

## 01:56 – Skapa marken

I vår **Main**-map trycker vi **Ctrl+A** och söker efter **StaticBody3D**.

Den ger oss en warning eftersom den vill att vi lägger till **Collision**. Lägg därför till en child node genom att högerklicka och söka efter **CollisionShape3D**.

Jag gör ground plane till en **BoxShape3D**, men vi behöver också en visuell representation av samma box. Klicka därför på **StaticBody3D**, tryck **Ctrl+A** och lägg till **MeshInstance3D**.

**MeshInstance3D** behöver också veta hur den ska se ut, så vi väljer en **BoxMesh**.

Just nu ser de båda identiska ut, vilket är bra eftersom de ligger inuti varandra.

## 02:37 – Storlek på marken

Klicka på **Mesh** uppe till höger. Under **Size** sätter vi ungefär:

- **X = 10**
- **Y = 0.1**
- **Z = 10**

Nu är den tunn men ger oss en bra arbetsyta.

Gå sedan till **CollisionShape3D**, klicka på **BoxShape3D** uppe till höger och gör exakt samma sak:

- **X = 10**
- **Y = 0.1**
- **Z = 10**

Nu matchar de varandra.

Eftersom den vita ytan är ganska stark och kan vara obehaglig för ögonen i VR går jag till **Material**, väljer **New StandardMaterial3D**, klickar på materialet och går till **Albedo > Color**. Där gör jag färgen mörkgrå.

Det här görs på **MeshInstance3D**, inte på **CollisionShape3D**.

## 03:34 – Sun och Environment

Nu är marken färdig så att vi kan gå omkring.

Uppe vid knapparna för **Sun** och **World**, klicka på de tre punkterna och välj **Add Sun to Scene**. Gå sedan tillbaka och välj **Add Environment to Scene**.

På så sätt får vi ljus, shadows och kan se ordentligt när spelet startar.

Jag döper också om **StaticBody3D** till **Ground** så att det blir tydligare.

## 04:02 – Installera Godot XR Tools

Vi fortsätter med setup.

Gå till **AssetLib** och sök efter **XR**. Ett av de första resultaten bör vara **Godot XR Tools for Godot 4** av **M1X2**.

Välj det och tryck **Download**. Installera det sedan i projektet.

Det kan komma några failures, men oroa dig inte. Jag tror att det beror på att vi fortfarande behöver slå på några saker.

Gå tillbaka till **3D** och öppna **Project > Project Settings**.

## 04:36 – Aktivera XR

Gå till **Plugins** och aktivera **Godot XR Tools** som vi precis laddade ner. Jag vet inte varför det inte görs automatiskt, men du måste aktivera det.

Gå sedan tillbaka till **General**, scrolla ned till **XR**, öppna **OpenXR** och se till att **Enabled** är aktiverat.

Gå därefter till **Reference Space** och välj **Local Floor**.

Det gör att den floor som headsetet använder också motsvarar floor i din map. Annars kan spelet hitta på en annan höjd. Det här är ett bättre sätt att göra det.

Till sist går vi till **Shaders** och aktiverar **XR Shaders**.

Alla de här ändringarna kräver en restart, så tryck **Save & Restart**.

> **Granskningskommentar:** Principerna **OpenXR**, **Local Floor** och XR-anpassad rendering är fortfarande relevanta. Exakta namn och placeringar för settings kan däremot variera mellan Godot-versioner.

## 05:10 – Script för OpenXR

När Godot har startat om behöver vi göra ytterligare en viktig sak för att kunna köra projektet.

På vår **Node3D**, som är vår main map node, högerklickar vi och väljer **Attach Script**. Vi låter scriptet heta **main**.

Vi kan ta bort allt utom:

    extends Node3D

Sedan skapar vi en variabel för **XRInterface**:

    var xr_interface: XRInterface

I **\_ready()** hämtar vi **OpenXR** från **XRServer**:

    func _ready() -> void:
    	xr_interface = XRServer.find_interface("OpenXR")

Det här anger **OpenXR** som det XR-interface vi vill använda. Det finns olika VR runtimes, men här säger vi specifikt att vi vill använda **OpenXR**, som används av väldigt många VR-headsets.

Sedan kontrollerar vi om **XRInterface** finns och är initialized:

    if xr_interface and xr_interface.is_initialized():

Därefter stänger vi av **VSync**:

    DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)

**VSync** kan ställa till problem i VR och orsaka graphical errors, så vi vill se till att det är avstängt när vi testar spelet.

Sedan aktiverar vi XR för viewport:

    get_viewport().use_xr = true

När spelet startas ser vi då XR-perspektivets viewport på vår main monitor.

Spara med **Ctrl+S** och gå tillbaka till **3D**.

> **Granskningskommentar:** Den här delen bör granskas särskilt mot den Godot-version som används. Godots officiella OpenXR-exempel brukar explicit anropa `initialize()` på XR-interface innan `use_xr` aktiveras. Videons transkriberade kod ovan har inte ändrats.

Hela koden till **main.gd**:

```gdscript
# Scriptet hör till scenens Node3D och ärver dess funktioner.
extends Node3D

# Variabeln sparar en referens till det XR-interface som ska användas.
var xr_interface: XRInterface

# Körs när noden och dess barn är redo i scenen.
func _ready() -> void:
	# Hämta OpenXR från Godots XR-system.
	xr_interface = XRServer.find_interface("OpenXR")

	# Fortsätt bara om OpenXR finns och redan har initierats.
	if xr_interface and xr_interface.is_initialized():
		# Stäng av VSync för datorfönstret så att det inte styr bildtakten i VR.
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)

		# Aktivera XR-rendering i denna viewport så att bilden kan visas i headsetet.
		get_viewport().use_xr = true
```

## 08:07 – Skapa xr_player.tscn

Nu är vår main map konfigurerad och redo för en XR character, men vi har ingen ännu.

Skapa en ny scene och välj **Other Node**. Sök efter **XROrigin3D**.

Godot visar en warning eftersom **XROrigin3D** behöver en **XRCamera3D** som child node.

Tryck **Ctrl+A** eller plusknappen och lägg till **XRCamera3D**. Nu försvinner warning.

Spara scenen med **Ctrl+S** i foldern **Blueprints** och döp den till **xr_player.tscn**.

Nu kan du egentligen dra in **xr_player.tscn** i **Main** och åtminstone titta omkring. Men vi vill lägga till mer funktionalitet så att vi kan göra grundläggande saker i VR.

## 09:41 – Controllers

Markera **XROrigin3D** och tryck **Ctrl+A**. Lägg till **XRController3D**.

Duplicera den med **Ctrl+D**.

Döp den första till:

    controller_left

och den andra till:

    controller_right

Markera **controller_left** och gå till **Tracker** i Inspector. Sätt den till **Left Hand**.

Markera sedan **controller_right** och sätt **Tracker** till **Right Hand**.

Nu försvinner warnings eftersom Godot vet vilken controller respektive node representerar.

## 10:19 – Visa händer

Vi kan fortfarande inte se controllers, så vi lägger till händer.

På **controller_left**, tryck **Ctrl+Shift+A** för att öppna de child scenes som kommer från XR-pluginet.

Du kan behöva aktivera **Addons** längst nere till höger i dialogrutan **Select Scene** för att scenerna från XR-pluginet ska visas.

Sök efter **Hands** och välj **Left Hand Low**.

Gå sedan till **controller_right**, tryck **Ctrl+Shift+A**, sök efter **Right Hand Low** och lägg till den.

Nu har vi synliga händer.

## 11:24 – Player Body och collision

Jag gillar att ha riktig body collision så att spelaren inte kan gå rakt genom väggar.

Markera **XROrigin3D**, tryck **Ctrl+Shift+A** och sök efter **Player Body**. Öppna den.

Det ger kroppen physics så att den kan kollidera med väggar och andra objekt.

Om du får en warning om att det saknas en shape kan du lägga till en **CollisionShape3D**. En **CapsuleShape3D** fungerar bäst. Gör den ganska tunn och se till att nederdelen av kapseln ligger vid scene origin.

Spara med **Ctrl+S**.

Om du tar på dig headsetet nu bör du ha händer som följer controllers. Du kan fortfarande bara titta omkring; du kan ännu inte röra dig genom världen.

> **Granskningskommentar:** **PlayerBody** är fortfarande en dokumenterad del av Godot XR Tools för locomotion och collision. Exakt scene-struktur kan skilja sig mellan versioner av XR Tools.

## 12:31 – Movement

Gå tillbaka till **XR Player**.

Markera **controller_left**, tryck **Ctrl+Shift+A** och sök efter **Function**.

Bland functions finns flera saker från add-on. Vi vill använda **Movement Direct**, alltså directional movement.

Lägg till den på left controller.

I Inspector kan du ändra **Speed** för hur snabbt spelaren ska röra sig. Viktigast är att se till att **Strafe** är aktiverat. Då kan analog stick användas för rörelse i alla riktningar, även diagonalt.

Gå sedan till **controller_right** och gör motsvarande sak. Tryck **Ctrl+Shift+A** och leta efter **Movement Turn**.

Det gör att analog stick på höger hand styr rotationen av spelaren.

Under **Turn Mode**, som är satt till default, väljer jag **Smooth** eftersom jag tycker att smooth turning är bättre.

Du kan också välja **Snap** och ändra hur många degrees varje snap turn ska vara.

> **Granskningskommentar:** Godots nuvarande dokumentation för XR Tools visar också **Movement Direct**, men exempel på vilken hand som används kan skilja sig från videon. Handvalet är i praktiken en control-mapping-fråga och bör kontrolleras mot projektets action map och vald XR Tools-version.

## 13:31 – Pickup

Nu kan vi testa i **Main** och märka att vi kan röra oss och rotera.

Men vi vill också kunna plocka upp saker.

Gå tillbaka till **controller_left**, tryck **Ctrl+Shift+A**, sök efter **Pick** och välj **Function Pickup**.

Kopiera sedan den med **Ctrl+C**, gå till **controller_right** och klistra in med **Ctrl+V**.

Nu kan båda händerna plocka upp objekt, men bara objekt som är markerade som pickable.

Vår character är nu färdig. Spara med **Ctrl+S** och gå tillbaka till **Main**.

## 14:33 – Skapa ett Pickable Object

Nu vill vi skapa objekt som faktiskt går att plocka upp.

Gå till **Scene > New Inherited Scene**.

Gå upp en nivå om du befinner dig i **Blueprints**, öppna foldern **addons**, sedan **godot-xr-tools** och därefter **objects**.

Där ska det finnas en scene som heter **Pickup**. Välj den och öppna den.

Det skapar en ny scene med ett pickup object. Den har redan **CollisionShape3D**, men det är ännu inte definierat hur objektet ska se ut.

Spara först scenen med **Ctrl+S**.

Navigera tillbaka till projektets toppnivå där du ser **Blueprints**, **Worlds** och **addons**. Gå in i **Blueprints** och spara scenen som **Pickup Object**.

Det här blir vårt base pickup object.

## 15:05 – Mesh och collision för objektet

Markera **PickableObject** i scene tree, tryck **Ctrl+A** och lägg till **MeshInstance3D**.

Skapa en **BoxMesh**.

Under **Size** sätter vi:

- **X = 0.1**
- **Y = 0.1**
- **Z = 0.1**

Gå sedan till **CollisionShape3D**, välj **Shape > New BoxShape3D** och sätt samma **Size**:

- **X = 0.1**
- **Y = 0.1**
- **Z = 0.1**

Nu matchar mesh och collision.

Objektet är litet, vilket är bra eftersom vi inte vill att det ska vara enormt.

På **MeshInstance3D** går vi till **Material**, skapar **New StandardMaterial3D**, öppnar det och går till **Albedo**. Jag använder en teal-färg för saker som går att plocka upp.

## 16:15 – Grab Points

Nu tror jag att objektet går att plocka upp oavsett var man tar tag i det, men vi vill vara mer specifika med hur det hålls.

Markera **PickableObject**, tryck **Ctrl+Shift+A** och sök efter **Grab**.

Välj **Grab Point Hand Left**.

Nu får vi en osynlig box eftersom eye icon är avstängd. Slå på den så ser vi en hand.

Du kan göra många saker här, till exempel konfigurera en **Hand Pose**, men i den här tutorialen får du själv utforska de olika settings som finns.

Jag flyttar handen så att den ligger ungefär i en naturlig grab position runt kuben.

Gå sedan tillbaka till **PickableObject**, tryck **Ctrl+Shift+A** och gör samma sak för höger hand genom att välja **Grab Point Hand Right**.

Slå på eye icon och placera den ungefär på samma sätt som vänster hand, fast från andra sidan.

När placeringen är klar stänger vi av eye icon för båda.

Spara med **Ctrl+S**.

Nu är pickup object färdigt. Vi har en kub som går att ta upp.

## 17:24 – Testa projektet

Stäng pickup-scenen och gå tillbaka till **Main**.

Jag skapar snabbt ett table och placerar några av de pickable objects vi precis skapade på det.

### Cirka 17:40 – Skapa ett bord och placera ut objekten

Här snabbspolas arbetet i videon. Följande kompletterande instruktion visar hur du kan bygga ett liknande bord av ett rätblock. Måtten och placeringarna nedan är exempel, inte avlästa värden från videon. Exemplet utgår från att golvet ligger på **Y = 0** och att **Main** har oförändrad position, rotation och skala.

**Skapa bordet**

1. Öppna **Main** och markera scenens rotnod. Tryck **Ctrl+A**, lägg till **StaticBody3D** och döp den till **Table**. Det ger bordet en fast kropp som de upplockningsbara objekten kan kollidera med.
2. Markera **Table** och lägg till en **MeshInstance3D** som barn. Välj **Mesh > New BoxMesh** i Inspector.
3. Öppna din **BoxMesh** och sätt **Size** till **X = 1.5**, **Y = 0.8**, **Z = 0.7**. Det blir ett massivt rätblock som fungerar som bord.
4. Markera **Table** och sätt **Transform > Position** till **X = 0**, **Y = 0.4**, **Z = -1.5**. Bordets undersida hamnar då vid golvet och ovansidan på **Y = 0.8**. Anpassa X och Z om platsen redan är upptagen i din scen.
5. Markera **Table** igen och lägg till **CollisionShape3D** som ett andra barn. Välj **Shape > New BoxShape3D** och sätt dess **Size** till samma mått som meshens: **X = 1.5**, **Y = 0.8**, **Z = 0.7**.
6. Låt både **MeshInstance3D** och **CollisionShape3D** ha lokal **Position = (0, 0, 0)** och låt nodernas **Scale** vara **(1, 1, 1)**. Då ligger bordets synliga form och kollisionsform på samma plats.
7. Om du vill ge bordet en färg, skapa ett **StandardMaterial3D** på dess **MeshInstance3D** och välj färg under **Albedo**.

Scenens struktur ska nu innehålla:

```text
Main
└── Table (StaticBody3D)
    ├── MeshInstance3D
    └── CollisionShape3D
```

**Placera upplockningsbara objekt på bordet**

1. Leta upp scenen **Pickup Object** som du sparade i **Blueprints**. Dra in den från **FileSystem** till **Main** i scenträdet. Använd den färdiga pickup-scenen så att objektets pickup-funktion, mesh, kollisionsform och grab points följer med.
2. Markera det instansierade objektets rotnod och sätt **Transform > Position** till **X = -0.3**, **Y = 0.86**, **Z = -1.5**. Kuben är **0.1** meter hög, så dess undersida hamnar strax ovanför bordets ovansida. När spelet startar faller den den lilla biten ned på bordet.
3. Tryck **Ctrl+D** för att duplicera objektet. Sätt kopians **X = 0**. Duplicera en gång till och sätt nästa kopias **X = 0.3**. Behåll **Y = 0.86** och **Z = -1.5** för båda kopiorna. Nu ligger tre separata kuber ovanför bordet utan att överlappa varandra.
4. Om du har valt en annan placering för bordet, flytta även kuberna så att de ligger över bordsskivan. Flytta hela pickup-objektet, inte bara dess **MeshInstance3D**.
5. Spara **Main** med **Ctrl+S** och kör projektet. Kontrollera att kuberna stannar på bordet och att du kan plocka upp dem med båda händerna och släppa dem igen.

Om kuberna faller genom bordet, kontrollera att bordets **CollisionShape3D** har en **BoxShape3D**, att **Disabled** inte är aktiverat och att pickup-objektens **Collision Mask** inkluderar bordets **Collision Layer**.

Läs mer om bordets fysik i Godots dokumentation för [StaticBody3D](https://docs.godotengine.org/en/4.6/classes/class_staticbody3d.html) och [BoxShape3D](https://docs.godotengine.org/en/4.5/classes/class_boxshape3d.html).

Spara med **Ctrl+S** och testa.

Nu är vi inne i spelet. Vi kan gå fram till kuberna, plocka upp dem och släppa dem.

Vi använder left analog stick för att röra oss och right analog stick för att rotera.

Det bör räcka för att komma igång med VR så att du kan börja bygga maps.

## 18:32 – Avslutning

Jag tycker att **XR** i **Godot** är fullt användbart just nu, eller åtminstone väldigt användbart. Kanske inte hundra procent, men det fungerar bra.

Jag tycker att det går ganska snabbt att sätta upp och jag gillar det mycket.

Jag kommer att göra fler tutorials. Snart kommer jag bland annat att göra en tutorial om hur man bygger ett bow and arrow system i **Godot VR**.

Jag hoppas att det här hjälpte. Tack så mycket, vi hörs nästa gång.

---

## Granskningskommentarer

Transkriptionen bygger på videons automatiska transcript och återger instruktionerna utan att korrigera själva innehållet. fileciteturn0file0L5-L39

Vid kontroll mot aktuell Godot-dokumentation framstår grundstrukturen med **OpenXR**, **XROrigin3D**, **XRCamera3D**, **XRController3D**, **PlayerBody** och Godot XR Tools som relevant. Det finns däremot versionsberoende detaljer som bör granskas innan instruktionerna används ordagrant i en nyare Godot-version.

Särskilt bör OpenXR-initieringen i scriptet kontrolleras. Aktuell dokumentation använder normalt `XRServer.find_interface("OpenXR")`, följt av `initialize()`, och aktiverar därefter `get_viewport().use_xr = true`. Videons instruktion har lämnats oförändrad ovan.

Även menyer, plugin-installation, **XR Shaders**, controller mapping och placeringen av XR Tools-scenes kan ha ändrats sedan **Godot 4.3**. För Meta Quest kan export- och vendor-inställningar dessutom kräva ytterligare steg som inte behandlas i den här videon.
