## 1. Installera Godot XR Tools {#xr-tools}

**Förutsättning:** Du har slutfört [kapitel 3](03-macos-quest.html#kor) och sett grundscenen i headsetet. Öppna Godots **AssetLib / Asset Store**, sök efter **Godot XR Tools** och välj Godot 4-utgåvan från GodotVR-projektet. Installera i projektet och vänta tills importen är färdig.

Öppna **Project → Project Settings → Plugins** och aktivera **Godot XR Tools**. Notera versionen du installerar. Läs tilläggets versionskrav innan uppgradering och spara en fungerande kopia av projektet. Importfel ska lösas innan du exporterar vidare. [Installation](https://godotvr.github.io/godot-xr-tools/docs/installation/) · [Utgåvor och versionskrav](https://github.com/GodotVR/godot-xr-tools/releases)

OpenXR aktiverades i kapitel 2 och provades på Quest i kapitel 3. XR Tools ersätter inte den inställningen. Behåll vårt `main.gd`; lägg inte samtidigt till tilläggets alternativa `start_xr.tscn`.

## 2. Lägg till vänster och höger kontroll {#kontroller}

Öppna **scenes/xr_player.tscn**. Lägg till två **XRController3D** direkt under `XRPlayer`.

| Nodnamn | Tracker | Pose |
| --- | --- | --- |
| controller_left | left_hand | grip |
| controller_right | right_hand | grip |

Välj värdena i Inspector. Om tracker visas som en sökväg väljer du motsvarande vänster eller höger hand i listan. Namnet på noden räcker inte: det är **Tracker** som avgör vilken fysisk kontroll noden följer.

Håll kontrollernas skala vid `(1, 1, 1)`. Spårningen sätter deras position när spelet körs. [Godots XR-noder](https://docs.godotengine.org/en/4.7/tutorials/xr/setting_up_xr.html)

## 3. Visa händer {#hander}

1. Markera `controller_left` och välj **Instantiate Child Scene** (kedjeikonen i scenpanelen).
2. I **Select Scene**: aktivera **Addons** längst nere till höger om pluginets scener inte visas.
3. Sök efter **Left Hand Low** eller `left_hand_low` och lägg till handscenen.
4. Upprepa på `controller_right` med **Right Hand Low**.
5. Spara och exportera igen. Vicka på båda kontrollerna och kontrollera att rätt hand följer med.

Om scenlistans namn skiljer sig, bläddra i `addons/godot-xr-tools` i FileSystem och använd motsvarande handscen i din installerade version. De här händerna är **modeller som följer kontrollerna**. Det är inte samma funktion som kamerabaserad handspårning utan kontroller. [XR Tools: Hand Models](https://godotvr.github.io/godot-xr-tools/docs/hand_models/)

## 4. Kontrollera OpenXR action map {#actions}

En **action** är en namngiven inmatning, exempelvis ett grepp eller en styrspak. En **binding** kopplar den till en fysisk knapp för en viss kontrolltyp. Spårningen kan fungera även om knappbindningarna är fel.

Öppna projektets OpenXR action map, normalt **openxr_action_map.tres**, genom FileSystem. Du kan hitta resursen via **Project Settings → XR → OpenXR → Default Action Map**. Kontrollera att en interaction profile för Quest-kontrollerna finns, exempelvis Oculus Touch eller en relevant Meta Touch-profil som stöds av din version.

Behåll de standardactions som XR Tools förväntar sig. Kontrollera i varje tillagd funktions Inspector vilket **Action**-namn den läser. Det måste motsvara namnet i action map och ha en binding i kontrollprofilen. Skapa inte ett nytt godtyckligt namn för samma knapp. Godots vanliga **Input Map** är inte ersättningen för OpenXR action map. [Actions och bindings](https://docs.godotengine.org/en/4.7/tutorials/xr/xr_action_map.html)

## 5. Lägg till förflyttning {#rorelse}

Markera `controller_left`, välj **Instantiate Child Scene** och sök efter **Movement Direct**. Lägg till den rörelsefunktion som använder styrspaken. Markera därefter `controller_right` och lägg till **Movement Turn**.

Funktionerna ska vara barn till den kontroll vars styrspak de läser. I Inspector för svängfunktionen väljer du stegvis rotation, **snap turn**, till exempel **30°**. Börja med låg förflyttningshastighet. Prova först en liten rörelse, sedan en sväng.

I aktuella XR Tools skapas **PlayerBody** automatiskt när en rörelsefunktion behöver den. Kontrollera därför scenen innan du lägger till en till. Om din installerade version kräver att kroppen läggs till manuellt använder du pluginets färdiga Player Body-scen under XROrigin3D. Lägg inte på en extra egen kapsel om pluginet redan hanterar kroppen. [Direct Movement](https://godotvr.github.io/godot-xr-tools/docs/direct/) · [Turn](https://godotvr.github.io/godot-xr-tools/docs/turn/) · [Player Body](https://godotvr.github.io/godot-xr-tools/docs/player_body/)

**Kontroll:** Spelaren ska stå kvar på golvet och kunna röra sig längs det. Om du faller igenom: kontrollera golvets collision och att PlayerBodys mask inkluderar golvets lager. Ändra inte kamerans höjd för att dölja ett kollisionsfel.

## 6. Lägg till hopp och hukning {#hopp-hukning}

I det här projektet följer vi Metas vanliga kontrollkarta för artificiell förflyttning:

| Kontroll | Funktion |
| --- | --- |
| Vänster styrspak | Gå |
| Höger styrspak åt sidan | Sväng |
| **A på höger kontroll** | Hoppa |
| **Klick på höger styrspak** | Växla mellan stående och hukad |

Det är alltså **ett klick på styrspaken**, som om den vore en knapp. Att dra höger styrspak nedåt gör inte spelaren hukad; styrspakens riktning är fortfarande reserverad för svängning. B används ofta för tillbaka eller avbryt i menyer och används därför inte som hoppknapp här. Se [Metas rekommenderade locomotion-bindningar](https://developers.meta.com/horizon/design/locomotion-input-maps/).

1. Markera `controller_right` och instansiera XR Tools-scenen **Movement Jump**.
2. Markera `MovementJump` och sätt **Jump Button Action** till `ax_button`. Eftersom noden ligger under höger kontroll betyder det höger **A**.
3. Markera `controller_right` igen och instansiera **Movement Crouch**.
4. Sätt **Crouch Button Action** till `primary_click`, **Crouch Type** till `Toggle` och **Crouch Height** till `1.0` meter.

`Toggle` innebär att ett klick hukar spelaren och nästa klick reser spelaren. Funktionen använder samma PlayerBody som den övriga rörelsen, så lägg inte till en separat kropp eller egen hoppfysik.

Kontrollera i **openxr_action_map.tres** att `ax_button` är bunden till A på höger kontroll och att `primary_click` är bunden till höger styrspaksklick. Samma actionnamn kan också ha en binding för vänster kontroll; det är nodens placering under `controller_right` som väljer höger hand.

## 7. Ge båda händerna en greppfunktion {#pickup}

Instansiera **addons/godot-xr-tools/functions/function_pickup.tscn** under `controller_left`. Lägg en andra instans under `controller_right`. I scenvalet kan du söka efter **Function Pickup**.

Pickup-funktionen söker efter särskilda pickable-objekt. En vanlig BoxMesh blir inte automatiskt greppbar. I nästa kapitel bygger du rätt typ av objekt. [Pickup Function](https://godotvr.github.io/godot-xr-tools/docs/pickup/)

```text
XRPlayer (XROrigin3D)
├── XRCamera3D
├── controller_left (XRController3D)
│   ├── LeftHandLow
│   ├── MovementDirect
│   └── FunctionPickup
└── controller_right (XRController3D)
    ├── RightHandLow
    ├── MovementTurn
    ├── MovementJump
    ├── MovementCrouch
    └── FunctionPickup
```

Trädet visar dina egna tillägg. PlayerBody kan skapas automatiskt av rörelsekomponenten. De exakta visningsnamnen kan variera mellan XR Tools-versioner.

## 8. Testa en funktion i taget {#test}

<div class="checkpoint" data-checklist="player"><h3>Spelaren fungerar när …</h3><label><input type="checkbox"> Huvudets rörelser styr kameran.</label><label><input type="checkbox"> Vänster och höger hand följer rätt kontroll.</label><label><input type="checkbox"> Vänster styrspak flyttar mig på golvet.</label><label><input type="checkbox"> Höger styrspak svänger i steg.</label><label><input type="checkbox"> A på höger kontroll får mig att hoppa.</label><label><input type="checkbox"> Ett klick på höger styrspak växlar mellan stående och hukad.</label><label><input type="checkbox"> Båda kontrollerna har en FunctionPickup.</label></div>

Om händerna följer med men knapparna inte reagerar: börja med [action map](#actions). Om något script inte kan tolkas: följ [pluginfelsökningen](06-felsokning.html#plugin).
