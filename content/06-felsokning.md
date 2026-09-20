## Börja där kedjan bryts {#snabbdiagnos}

Den här guiden bygger på **Godot_4.7.2_Meta_Quest_3_felsokningsguide.md** och är omarbetad till ett allmänt arbetssätt för macOS med Apple Silicon. Det dokumenterade fallet gällde bland annat två ADB-versioner. Det är ett exempel på en orsak, inte en diagnos som gäller varje dator.

Följ kedjan **bygga → hitta enhet → installera → starta → ladda scen → rendera → interagera**. Skärmspegling är ett separat spår. Ett sent fel betyder inte att alla tidigare steg misslyckades.

<label class="filter-label" for="symptom-filter">Filtrera symtom eller felmeddelande</label>
<input id="symptom-filter" type="search" placeholder="Till exempel unauthorized, svart eller Java">
<p id="symptom-count" class="muted" aria-live="polite"></p>

| Symtom eller meddelande | Börja här |
| --- | --- |
| Android eller exportmallar saknas | [Mallar och bygge](#bygge) |
| Android build template is missing | [Mallar och bygge](#bygge) |
| Java / SDK / Gradle / license error | [Byggverktyg](#bygge) |
| Quest saknas / tom adb devices / offline | [USB och behörighet](#usb) |
| unauthorized | [Godkänn datorn i Quest](#usb) |
| adb server version … doesn't match | [Samma ADB överallt](#adb-konflikt) |
| APK installeras men appen startar inte | [Installation och start](#installation) |
| Appen stängs / återgår till Quest Home | [Läs logcat](#logcat) |
| Parse Error / function_teleport.gd / Node3D | [XR Tools och script](#plugin) |
| ETC2 / ASTC / Failed loading / saknade resurser | [Import och resurser](#resurser) |
| HMD was not detected / F5 på Mac | [OpenXR och svart bild](#openxr) |
| Bilden är svart i headsetet | [OpenXR och rendering](#openxr) |
| Händer / rörelse / grepp fungerar inte | [Interaktion och fysik](#interaktion) |
| Could not create child process: scrcpy | [Skärmspegling](#spegling) |
| Svart scrcpy-fönster | [Skärmspegling](#spegling) |
| Fungerar i Terminal men inte från Finder | [Macens programmiljö](#finder) |
| Debugger ansluter inte | [Remote debugging](#debugger) |
| graph_offset / Jolt / ViewportTexture | [Varningar och scenfel](#varningar) |

<p class="no-results" id="symptom-empty" hidden>Inget symtom matchar. Prova ett kortare ord, eller börja med logcat längre ner.</p>

## 1. Exportmallar, Java och Gradle {#bygge}

**Mallar saknas:** jämför hela Godot-versionen med **Manage Export Templates**. Installera exakt rätt mallar. Saknas Android Build Template: välj **Project → Install Android Build Template**. Efter byte av Godot-version kan även projektets build template behöva uppdateras; spara egna Android-anpassningar först.

**Java saknas eller är fel:** kör `/usr/libexec/java_home -v 17` och ange den returnerade mappen i Godots **Java SDK Path**. Mappen ska sluta med `Contents/Home` för en vanlig JDK-installation på Mac.

**SDK-fel:** jämför SDK Location i Android Studio med Godots **Android SDK Path**. Kontrollera paketversionerna i [Mac-guidens SDK-tabell](03-macos-quest.html#sdk). Om licenser saknas öppnar du SDK Manager och slutför installationen. Läs den första konkreta orsaken i Gradle-loggen, inte bara slutraden `BUILD FAILED`.

**Nedladdning misslyckas:** kontrollera internet och eventuell skolproxy. Första Gradle-bygget hämtar beroenden. Ett nätverksfel löses inte genom att ändra OpenXR-kameran.

**Ingen Android-knapp:** kontrollera att en Android-exportprofil finns och är **Runnable**, att exportvarningarna är åtgärdade och att ADB ser Quest. [Godot Android-export](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_android.html) · [One-click deploy](https://docs.godotengine.org/en/4.7/tutorials/export/one-click_deploy.html)

## 2. Quest syns inte eller är unauthorized {#usb}

Använd ADB från **samma SDK som Godot**. Kommandona antar standardplatsen; ändra sökvägen om din SDK ligger någon annanstans.

```bash
"$HOME/Library/Android/sdk/platform-tools/adb" devices -l
```

Vid `unauthorized`: ta på headsetet och godkänn USB-debuggning. Vid tom lista: prova en känd datakabel, en annan port, ett vaket headset och rätt utvecklarkonto. En USB-hubb kan uteslutas genom att ansluta direkt till datorn.

Om enheten visas som `offline`, koppla ur och anslut igen. Du kan starta om ADB-servern nedan; det bryter även andra pågående Android-debuganslutningar på datorn.

```bash
"$HOME/Library/Android/sdk/platform-tools/adb" kill-server
"$HOME/Library/Android/sdk/platform-tools/adb" start-server
"$HOME/Library/Android/sdk/platform-tools/adb" devices -l
```

**Gå vidare först när status är `device`.** Metas USB-godkännande och ADB:s tillståndslista beskriver två sidor av samma anslutning. [Meta Device Setup](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/) · [Android ADB](https://developer.android.com/tools/adb)

## 3. Två ADB-versioner konkurrerar {#adb-konflikt}

Ett meddelande som `adb server version (41) doesn't match this client (40)` betyder att klienten och servern inte använder kompatibla ADB-versioner. Det är inte headsetets OS-version som siffrorna anger.

Undersök sökvägarna:

```bash
which -a adb
adb version
"$HOME/Library/Android/sdk/platform-tools/adb" version
```

Om det första `adb`-kommandot saknas men kommandot med full sökväg fungerar är SDK-verktyget installerat; det ligger bara inte i Terminalens PATH. Det är inte samma sak som en versionskonflikt.

I underlagsfallet hittades en äldre ADB i `/usr/local/bin/adb`, medan Godot använde SDK:ns `platform-tools/adb`. På andra datorer kan platserna vara annorlunda. Stäng program som återstartar en gammal ADB-server. Välj samma aktuella ADB i alla verktyg.

För scrcpy kan du ange den direkt:

```bash
ADB="$HOME/Library/Android/sdk/platform-tools/adb" scrcpy --no-audio
```

Variabeln väljer ADB för scrcpy. **Godots egen ADB-sökväg styrs fortfarande av Android SDK Path.** Radera inte andra programinstallationer på måfå. scrcpy dokumenterar uttryckligen den här konfliktorsaken och stödet för variabeln `ADB`. [scrcpy FAQ](https://github.com/Genymobile/scrcpy/blob/master/FAQ.md)

## 4. Appen fungerar från Terminal men inte Finder {#finder}

Finder/Dock och ett Terminal-fönster kan starta program med olika miljövariabler. En ändring i `~/.zshrc` gäller inte automatiskt appar som öppnas från Dock.

I underlagsfallet fungerade `export ADB=…` följt av `open -a Godot`. För en tydligare kontroll använder vi här **appens körbara fil direkt** så att den blir barnprocess till samma shell. Spara projektet och avsluta först Godot helt. Anpassa appens namn/plats om den inte heter `Godot.app` i Applications.

```bash
export ADB="$HOME/Library/Android/sdk/platform-tools/adb"
export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"
"/Applications/Godot.app/Contents/MacOS/Godot" --editor
```

Om detta löser problemet, kontrollera absoluta sökvägar för SDK och scrcpy i editorn. Du kan lägga PATH-raden i din `~/.zshrc` för **nya Terminal-sessioner**, men räkna inte med att det ensamt förändrar Finder-startade appar. Använd samma direkta start när du behöver den miljön. [Godots kommandorad](https://docs.godotengine.org/en/4.7/tutorials/editor/command_line_tutorial.html)

## 5. Byggd, installerad och startad är olika saker {#installation}

Kontrollera om appen faktiskt finns innan du försöker bygga om allt:

```bash
"$HOME/Library/Android/sdk/platform-tools/adb" shell pm list packages com.example.vrstart
```

Byt paketnamnet till **Package → Unique Name** i din exportprofil. Om du inte vet namnet kan du lista tredjepartsappar:

```bash
"$HOME/Library/Android/sdk/platform-tools/adb" shell pm list packages -3
```

En träff betyder att paketet är installerat, men det kan vara en tidigare version om senaste uppdateringen misslyckades. Kontrollera installationsresultatet och öka **Version Code** när Android kräver det.

Starta kursens exempelapp:

```bash
"$HOME/Library/Android/sdk/platform-tools/adb" shell monkey -p com.example.vrstart -c android.intent.category.LAUNCHER 1
```

Ett skickat launch-event garanterar inte att appen är frisk. Om den stängs direkt går du till logcat. [Android Monkey](https://developer.android.com/studio/test/other-testing-tools/monkey)

Vid `INSTALL_FAILED_UPDATE_INCOMPATIBLE` kan samma paket vara signerat med en annan nyckel. Använd samma signering, eller välj ett nytt paketnamn för ett separat test. Att avinstallera den gamla appen tar normalt bort dess lokala data; gör det bara om du vill ersätta installationen och har sparat det du behöver. Vid versionsnedgradering: höj Version Code eller återgå till rätt bygge. [Godots installationsfelsökning](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_android.html)

## 6. Läs logcat vid krasch {#logcat}

Spara först eventuell gammal logg du behöver. `logcat -c` rensar enhetens aktuella loggbuffert. Kör sedan:

```bash
"$HOME/Library/Android/sdk/platform-tools/adb" logcat -c
```

Starta appen, återskapa felet och spara hela loggen:

```bash
"$HOME/Library/Android/sdk/platform-tools/adb" logcat -d > "$HOME/Desktop/quest-log.txt"
```

Öppna filen i en texteditor. En filtrerad överblick kan hjälpa, men behåll hela loggen eftersom närliggande rader ofta förklarar orsaken:

```bash
"$HOME/Library/Android/sdk/platform-tools/adb" logcat -d | grep -Ei 'godot|openxr|vrstart|fatal|exception|failed|parse error'
```

Läs kronologiskt runt senaste appstarten. Leta efter **första relevanta felet**, inte bara sista `Unable to start engine`. En saknad textur kan hindra ett material, som hindrar en handscen, som hindrar spelarens scen. Loggar kan innehålla enhets- och appuppgifter; ta bort sådant som inte behövs innan du delar dem. [Android: Logcat](https://developer.android.com/tools/logcat)

## 7. XR Tools och GDScript-fel {#plugin}

Underlaget innehåller `Not all code paths return a value` i `function_teleport.gd` och ett fel där ett Node3D-script hamnat på en Node. Dessa är projekt-/pluginfel. En ny USB-kabel rättar inte GDScript.

1. Öppna projektet i rätt Godot-version och läs första parse error i editorns Debugger/Output.
2. Notera installerad XR Tools-version. Jämför dess Godot-krav och release notes.
3. Säkerhetskopiera egna ändringar. Uppdatera till en **kompatibel** release eller återställ ett känt fungerande par av Godot och XR Tools.
4. Kontrollera att rätt script sitter på rätt nodtyp. Ändra inte basklass på måfå.
5. Vänta på import och lös scriptfelen innan ny Android-export.

Det exakta radnumret från underlaget gäller bara den pluginversionen. Det är ingen universell instruktion att ändra rad 382. [XR Tools-utgåvor](https://github.com/GodotVR/godot-xr-tools/releases)

## 8. Saknade resurser och ETC2/ASTC {#resurser}

Om loggen säger `Failed loading` ska du läsa **vilken sökväg** som saknas. Kontrollera att filen finns i projektet, att stora/små bokstäver matchar och att den refereras rätt från scenen. Android kan avslöja skiftlägesfel som inte märktes på en vanlig Mac-disk.

Vid en exportvarning om **ETC2/ASTC**: sök efter `ETC2` i **Project Settings** med **Advanced Settings** aktiverat och slå på den import som exporten efterfrågar. Vänta på texturimporten, eller välj **Project → Reload Current Project**. Bygg först när importen är färdig.

Kontrollera att pluginets resurser finns under `res://addons/godot-xr-tools/` och inte har uteslutits i exportprofilen. Kedjan kan vara **textur → material → handscen → xr_player.tscn → main.tscn**.

Om en full reimport behövs: stäng Godot, ta en kopia av projektet och **byt namn på den genererade `.godot`-mappen** i projektkopian. Öppna kopian och låt Godot bygga cachen igen. Radera aldrig `addons`, originaltexturer eller scener för att ”rensa cache”. [Godots importsystem](https://docs.godotengine.org/en/4.7/tutorials/assets_pipeline/import_process.html)

## 9. OpenXR och svart bild i headsetet {#openxr}

**HMD saknas när du trycker F5 på Mac:** kör Android-exporten på Quest. Datorns lokala körning är en annan miljö. Följ [Mac-guiden](03-macos-quest.html#kor).

**Appen startar i ett platt fönster:** kontrollera exportprofilens **XR Mode = OpenXR**, projektets **OpenXR Enabled** och att rätt APK verkligen har installerats.

**Immersiv app men svart värld:** kontrollera huvudscenen, att `XRCamera3D` ligger under `XROrigin3D`, att `use_xr` aktiveras, att ljuset sparats i scenen och att modellen är framför kameran. En kamera inne i golvet kan ge en missvisande bild. Kontrollera även near/far clipping om föremål försvinner på vissa avstånd.

Börja med [main.gd från grundscenen](02-forsta-scenen.html#main-gd). Godot 4.7 startar OpenXR tidigt och exemplet kontrollerar `is_initialized()`. Återkommande manuella `initialize()` är ingen generell lösning. [Godots XR-start](https://docs.godotengine.org/en/4.7/tutorials/xr/setting_up_xr.html)

Om loggen redan visar lyckad OpenXR-session men därefter ett resursfel: lös resursfelet. Om ett minimalt projekt har grafikfel utan script-/resursfel kan du prova **Compatibility** på en kopia och jämföra med Mobile. De officiella renderer-råden skiljer sig; se [källgranskningen](07-kallor.html#skillnader).

## 10. Kontroller, rörelse och fysik {#interaktion}

- **Händerna står stilla:** rätt left_hand/right_hand-tracker, grip-pose och rätt föräldranod? Är kontrollerna vakna?
- **Spårning fungerar men knappar inte:** matchar action-namn och bindings i OpenXR action map funktionernas inställningar?
- **Ingen förflyttning:** ligger rörelsefunktionen under rätt kontroll och finns en aktiv PlayerBody?
- **Du faller igenom golvet:** finns BoxShape3D och ingår golvets lager i kroppens mask?
- **Kub går inte att ta:** är den ett XR Tools-pickable och innehåller pickup-funktionens mask kubens lager?
- **Kuben faller genom bordet:** matchar collision och mesh och inkluderar kubens mask lager 1?
- **Spelaren skjuts bakåt vid grepp:** kolliderar hållet objekt med PlayerBody? Kontrollera Picked Up Layer.

Testa i ordningen huvud → kontroller → knapp → rörelse → grepp. [Kursens lagerexempel](05-objekt.html#lager) · [XR Tools Physics Layers](https://godotvr.github.io/godot-xr-tools/docs/physics_layers/)

## 11. scrcpy saknas eller visar svart {#spegling}

`Could not create child process: scrcpy` betyder att speglingsprogrammet inte kunde startas. Det säger inte att APK-installationen misslyckades. Prova appen i headsetet och stäng tillfälligt av Godots spegling.

Om du vill använda scrcpy: följ [installationssteget](03-macos-quest.html#scrcpy), kör `command -v scrcpy` och ange sökvägen i Godots scrcpy-inställning. På Apple Silicon är `/opt/homebrew/bin/scrcpy` vanligt men inte garanterat.

**Ett fönster öppnas men är svart:** det är ett annat fel. Kontrollera om appen syns i headsetet, att Quest är vaket och att scrcpy är aktuellt. Prova direkt från Terminal med `--no-audio` och läs dess felutskrift. Förutsätt inte att spegling av all VR-/systemgrafik fungerar likadant på alla Horizon OS-versioner. [scrcpy för macOS](https://github.com/Genymobile/scrcpy/blob/master/doc/macos.md)

Om ADB-servern startas om upprepade gånger: gå till [versionskonflikten](#adb-konflikt).

## 12. Remote debugging är ett eget steg {#debugger}

Om spelet går att starta självständigt men editorns debugger inte ansluter har du redan bevisat att spelet kan köras. Kontrollera Godots debug-/deployinställningar och rätt enhetsval. Under USB-test kan Godot använda **ADB reverse** för anslutningen tillbaka till datorn.

Raden `Reverse result: 0` i underlagsfallet visade att just reverse-kommandot lyckades, inte att hela debugger-sessionen fungerade. Undvik att kopiera en gammal debugport från en annan installation; läs den aktuella loggen. [One-click deploy](https://docs.godotengine.org/en/4.7/tutorials/export/one-click_deploy.html)

## 13. Varningar som behöver värderas {#varningar}

| Meddelande | Hur du går vidare |
| --- | --- |
| `graph_offset property is deprecated` | Uppdatera berörd resurs/plugin när lämpligt. En deprecation är inte automatiskt orsaken till stängningen. |
| Jolt: custom solver bias stöds inte | Det anpassade värdet ignoreras. Felsök ett samtidigt parse-/resursfel först. |
| `Viewport Texture must be set to use it` | Kontrollera vilket material eller UI som använder ViewportTexture och tilldela rätt viewport. |
| `Uninstalling previous version` | Kan vara del av deploy. Läs nästa rader: lyckades installationen och sedan start? |

Dessa exempel kommer från det lokala felsökningsunderlaget. En varning kan fortfarande vara relevant för beteendet; prioritera efter loggens faktiska felkedja i stället för att behandla alla gula rader som krascher.

## 14. Isolera med ett minimalt projekt {#minimalprojekt}

Bygg bara [golv, ljus, XROrigin3D, XRCamera3D och main.gd](02-forsta-scenen.html). Använd samma Android-verktyg och exportinställningar som i ditt vanliga projekt.

Om det fungerar på Quest har du belägg för att USB, bygge, installation och grundläggande OpenXR/rendering fungerar tillsammans. Lägg tillbaka XR Tools, händer, rörelse och föremål **ett i taget**. När felet återkommer vet du vilken förändring du ska undersöka.

<div class="checkpoint" data-checklist="debug"><h3>Underlag när du ber om hjälp</h3><label><input type="checkbox"> Godots fullständiga version och renderer.</label><label><input type="checkbox"> XR Tools- och eventuell Vendors-version.</label><label><input type="checkbox"> ADB-sökväg, version och anslutningsstatus.</label><label><input type="checkbox"> Exakt steg som misslyckas och första relevanta felraden.</label><label><input type="checkbox"> Resultatet från ett minimalt projekt.</label></div>
