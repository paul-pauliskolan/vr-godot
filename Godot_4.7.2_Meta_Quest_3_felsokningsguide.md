# Felsökningsguide -- Godot 4.7.2, Meta Quest 3 och OpenXR på macOS

## Syfte

Den här guiden är avsedd för utveckling av ett VR-projekt i **Godot
4.7.2** på **macOS/Apple Silicon** som ska byggas, installeras och köras
direkt på **Meta Quest 3**.

Guiden följer hela kedjan:

**Godot-projekt → Android-export → ADB → installation på Quest → OpenXR
→ start → felsökning → scrcpy**

Den innehåller både de problem som faktiskt uppstod under installationen
och ytterligare vanliga kontrollpunkter.

------------------------------------------------------------------------

## 1. Snabbdiagnos -- var ligger felet?

Försök först avgöra hur långt processen kommer.

  ----------------------------------------------------------------------------
  Symtom                                   Trolig del att kontrollera
  ---------------------------------------- -----------------------------------
  Android saknas i Export                  Export Templates

  `Android build template is missing`      Android Build Template

  Godot hittar inte Android SDK            Android SDK Path

  Godot hittar inte Java                   Java SDK Path / JDK 17

  Quest visas inte av Godot                ADB / USB debugging

  `adb devices` är tom                     USB, Developer Mode eller
                                           authorization

  `unauthorized`                           Tillåt USB debugging i Quest

  APK byggs inte                           Export preset / Gradle / SDK

  ETC2/ASTC-varning                        Texture compression

  App installeras men startar inte         Package / launch / OpenXR

  App börjar ladda och stängs              `adb logcat`

  XR Tools-resurser saknas                 Import / plugin / export

  `scrcpy` kan inte startas                scrcpy Path

  `adb server version ... doesn't match`   Flera ADB-installationer

  Godot fungerar från Terminal men inte    PATH / `ADB` environment variable
  Finder                                   

  F5 på Mac säger att HMD saknas           Du kör lokalt på Mac i stället för
                                           på Quest
  ----------------------------------------------------------------------------

------------------------------------------------------------------------

# 2. Grundinstallation

## Godot

Kontrollera att rätt Godot-version används.

I detta fall:

`Godot Engine v4.7.2.stable.official`

Om projektet skapats i en annan Godot-version kan plugins och GDScript
behöva uppdateras.

------------------------------------------------------------------------

## Java

Godot 4.7:s Android-dokumentation anger OpenJDK 17 för Android-export.

Exempel på fungerande Java SDK Path:

`.../temurin-17.jdk/Contents/Home`

Kontroll i Terminal:

    java -version

Kontrollera i Godot:

**Editor → Editor Settings → Export → Android → Java SDK Path**

------------------------------------------------------------------------

## Android SDK

I detta system används:

`/Users/paul/Library/Android/sdk`

Kontrollera i Godot:

**Editor → Editor Settings → Export → Android → Android SDK Path**

ADB ska då finnas här:

`/Users/paul/Library/Android/sdk/platform-tools/adb`

Verifiera:

    /Users/paul/Library/Android/sdk/platform-tools/adb version

------------------------------------------------------------------------

# 3. Godot Export Templates

Godot måste ha export templates installerade för samma Godot-version som
editorn.

Öppna:

**Editor → Manage Export Templates**

För Godot 4.7.2 ska motsvarande templates vara installerade.

I den fungerande installationen fanns bland annat:

-   Android
-   iOS

Om Android-export saknas eller Godot säger att templates saknas,
installera templates för exakt samma Godot-version.

------------------------------------------------------------------------

# 4. Android Build Template

För XR/Android-projekt kan Gradle-build behövas.

Öppna:

**Project → Install Android Build Template...**

Det skapar projektets Android build-filer.

Om Godot visar:

`Android build template is missing`

kontrollera först att Android Export Templates är installerade.

Godots OpenXR-dokumentation anger att Gradle Android build används för
Android XR-konfiguration och plugins.

------------------------------------------------------------------------

# 5. Android Export Preset för Quest

Öppna:

**Project → Export...**

Skapa:

**Add... → Android**

Exempel på namn:

`Meta Quest`

Kontrollera särskilt:

  Inställning        Värde
  ------------------ ------------------
  Runnable           On
  Use Gradle Build   On
  Export Format      APK vid testning
  XR Mode            OpenXR

`Runnable` krävs för Godots one-click deploy.

Godot 4.7 kan exportera direkt till många Android-kompatibla XR-enheter.
OpenXR Vendors-plugin är från Godot 4.6 optional men recommended,
särskilt om vendorspecifika funktioner behövs.

------------------------------------------------------------------------

# 6. OpenXR

I export preset:

**XR Features → XR Mode → OpenXR**

Kontrollera även projektets OpenXR-inställningar om XR inte
initialiseras.

Ett vanligt missförstånd är att trycka F5 och försöka köra OpenXR direkt
på Macen.

Fel som:

`OpenXR was requested but failed to start`

och:

`HMD was not detected`

kan vara helt förväntade om Godot försöker starta projektet lokalt på
macOS utan ett lokalt OpenXR-headset/runtime.

För standalone Quest ska projektet i stället exporteras och köras på
Quest.

------------------------------------------------------------------------

# 7. ETC2/ASTC Texture Compression

Android/Quest kan kräva ETC2/ASTC-importerade texturer.

Ett fel kan exempelvis säga:

`Target platform requires 'ETC2/ASTC' texture compression.`

Aktivera motsvarande Android texture compression/import-inställning i
Project Settings.

Efter att inställningen ändrats bör projektets resurser importeras om.

En enkel första åtgärd är:

**Project → Reload Current Project**

Vänta tills all import är färdig innan ny export görs.

Om resurser fortfarande saknas kan `.godot/imported` behöva byggas om
genom en fullständig reimport. Gör detta först efter backup/version
control.

------------------------------------------------------------------------

# 8. Quest 3 och ADB

Quest måste vara tillgänglig för Android Debug Bridge.

Kontrollera med den ADB som hör till Android SDK:

    /Users/paul/Library/Android/sdk/platform-tools/adb devices

Fungerande resultat såg ut ungefär så här:

    List of devices attached
    2G0YC5ZF8N0147    device

## Om listan är tom

Kontrollera:

-   USB-kabeln
-   att kabeln stöder data, inte bara laddning
-   USB debugging
-   att Quest är upplåst
-   att USB debugging-dialogen accepterats i headsetet
-   prova koppla ur och ansluta kabeln igen
-   starta om ADB

Kommandon:

    /Users/paul/Library/Android/sdk/platform-tools/adb kill-server
    /Users/paul/Library/Android/sdk/platform-tools/adb start-server
    /Users/paul/Library/Android/sdk/platform-tools/adb devices

## Om `unauthorized` visas

Ta på headsetet och acceptera USB debugging.

Kör sedan `adb devices` igen.

------------------------------------------------------------------------

# 9. Kontrollera att APK faktiskt installerats

Om Godot rapporterar fel efter installationen behöver det inte betyda
att APK-installationen misslyckades.

Lista paket:

    /Users/paul/Library/Android/sdk/platform-tools/adb shell pm list packages

Sök efter XR:

    /Users/paul/Library/Android/sdk/platform-tools/adb shell pm list packages | grep -i xr

I felsökningen hittades:

`package:com.example.xrgame`

Det bevisade att XRGame var installerat på Quest.

Om paketnamnet är okänt kan tredjepartsappar listas med:

    /Users/paul/Library/Android/sdk/platform-tools/adb shell pm list packages -3

------------------------------------------------------------------------

# 10. Starta appen manuellt via ADB

Om Godot installerar APK:n men inte lyckas starta den kan appen startas
direkt.

För detta projekt:

    /Users/paul/Library/Android/sdk/platform-tools/adb shell monkey -p com.example.xrgame -c android.intent.category.LAUNCHER 1

Ett lyckat startkommando kan ge:

`Events injected: 1`

Det betyder inte att appen fortsätter fungera. Det betyder att Android
tog emot launch-eventet.

Om appen börjar ladda och sedan stängs måste logcat undersökas.

------------------------------------------------------------------------

# 11. Logcat -- viktigaste verktyget vid krasch

Rensa gammal logg:

    /Users/paul/Library/Android/sdk/platform-tools/adb logcat -c

Starta sedan appen.

Efter kraschen:

    /Users/paul/Library/Android/sdk/platform-tools/adb logcat -d | grep -Ei "godot|xrgame|openxr|fatal|exception|crash"

För en komplett logg:

    /Users/paul/Library/Android/sdk/platform-tools/adb logcat -d

Spara gärna loggen till fil:

    /Users/paul/Library/Android/sdk/platform-tools/adb logcat -d > quest-log.txt

## Vad man letar efter

Sök efter:

-   `ERROR`
-   `FATAL`
-   `Exception`
-   `Godot`
-   paketnamnet
-   `OpenXR`
-   `Failed loading`
-   `Unable to start engine`
-   `Parse Error`
-   `signal`
-   `crash`

------------------------------------------------------------------------

# 12. Hur man avgör om OpenXR faktiskt fungerar

I den aktuella felsökningen syntes att Quest:

-   startade `com.example.xrgame`
-   bytte från Quest shell till XRGame
-   gick in i immersive mode
-   skapade en OpenXR-session

Det innebar att OpenXR-kedjan faktiskt fungerade.

Om loggen visar normala OpenXR session state transitions men projektet
senare avslutas ska man inte automatiskt börja ändra
OpenXR-inställningarna.

Felsök i stället nästa fel längre ned i loggen.

------------------------------------------------------------------------

# 13. Godot XR Tools-fel

Ett konkret fel som uppstod var:

`function_teleport.gd:382 - Parse Error: Not all code paths return a value.`

Dessutom:

`Script inherits from native type 'Node3D', so it can't be assigned to an object of type 'Node'.`

Sådana fel ska behandlas som projekt/plugin-fel, inte som USB- eller
Quest-fel.

Kontrollera:

-   vilken version av Godot XR Tools som används
-   om pluginversionen är kompatibel med Godot 4.7
-   om plugin har uppdaterats efter uppgradering av Godot
-   om scripts innehåller parse errors
-   om en scen förväntar sig `Node` men scriptet ärver `Node3D`

Parse errors bör lösas innan man försöker felsöka rendering eller
headsetfunktioner.

------------------------------------------------------------------------

# 14. Saknade XR Tools-resurser

Under felsökningen fanns även problem där XR Tools-resurser/texturer
inte kunde laddas.

Exempel på resurstyper som kan orsaka kedjefel:

-   hand textures
-   hand materials
-   hand scenes
-   XR player scene
-   main scene

Ett saknat beroende kan ge en kedja:

**texture → material → hand scene → XR player → Main.tscn → engine start
fails**

Därför ska man inte bara fokusera på det sista felet:

`Unable to start engine!`

Leta upp det **första relevanta resursfelet** före det.

Kontrollera att pluginfilerna verkligen finns under exempelvis:

`res://addons/godot-xr-tools/`

och att de är importerade för Android.

------------------------------------------------------------------------

# 15. Viewport Texture-fel

Under felsökningen förekom:

`Viewport Texture must be set to use it.`

Detta är ett projekt/scenfel.

Kontrollera noder eller material som använder `ViewportTexture` och
verifiera att rätt SubViewport/Viewport är tilldelad.

Om flera sådana fel visas betyder det inte automatiskt att de orsakar
appens avslut. Leta efter senare `FATAL`, `Failed loading scene` eller
motsvarande.

------------------------------------------------------------------------

# 16. Deprecated warnings

Exempel:

`graph_offset property is deprecated. Setting it has no effect.`

Detta är normalt en warning, inte ett kraschfel.

Prioritera i denna ordning:

1.  Parse errors
2.  Missing resources
3.  Failed scene loading
4.  OpenXR initialization errors
5.  Android exceptions/native crashes
6.  Vanliga warnings/deprecations

------------------------------------------------------------------------

# 17. Jolt Physics-warning

Efter reload visades:

`Custom solver bias for shapes is not supported when using Jolt Physics. Any such value will be ignored.`

Det betyder att en shape har ett custom solver bias-värde som Jolt
ignorerar.

Det är normalt inte ett skäl till att XR-applikationen inte startar.

Behandla warningen separat från Android/OpenXR-startkedjan.

------------------------------------------------------------------------

# 18. scrcpy

Godot kan använda `scrcpy` i samband med Android debugging/mirroring.

Fel:

`Could not create child process: scrcpy`

betyder att Godot inte kan starta scrcpy.

Installera exempelvis via Homebrew:

    brew install scrcpy

Kontrollera:

    which scrcpy
    scrcpy --version

På den aktuella Apple Silicon-Macen blev sökvägen:

`/opt/homebrew/bin/scrcpy`

I Godot 4.7.2 kan scrcpy-sökvägen anges i Editor Settings.

Sök efter:

`scrcpy`

och ange:

`/opt/homebrew/bin/scrcpy`

Starta om Godot efter ändringen.

------------------------------------------------------------------------

# 19. scrcpy-fönstret är svart

I felsökningen kunde `scrcpy` öppna ett fönster med namnet **Quest 3**,
men ingen bild visades.

Det är ett annat problem än:

`Could not create child process: scrcpy`

Om fönstret öppnas vet man åtminstone att:

-   scrcpy-programmet startar
-   ADB kan hitta enheten
-   processen kommer längre än tidigare

Ett svart mirroring-fönster behöver inte betyda att själva VR-appen inte
fungerar. Felsök appen och mirroring som separata problem.

------------------------------------------------------------------------

# 20. Det viktiga ADB-versionfelet

Det avgörande felet i denna installation var:

`adb server version (41) doesn't match this client (40); killing...`

Det betyder att två olika ADB-versioner användes.

Kontroll:

    which adb
    adb version

Resultatet var:

`/usr/local/bin/adb`

och:

`Android Debug Bridge version 1.0.40`

Samtidigt använde Godot Android SDK:s modernare ADB:

`/Users/paul/Library/Android/sdk/platform-tools/adb`

Det skapade konflikt mellan Godot, scrcpy och ADB-servern.

------------------------------------------------------------------------

# 21. Kontrollera alla ADB-installationer

Kör:

    which -a adb

Kontrollera varje relevant ADB:

    /usr/local/bin/adb version

och:

    /Users/paul/Library/Android/sdk/platform-tools/adb version

Målet är att Godot, scrcpy och Terminal använder samma moderna
`platform-tools/adb`.

Undvik att slumpmässigt radera gamla ADB-installationer innan du vet
vilket program som använder dem.

------------------------------------------------------------------------

# 22. Tvinga scrcpy att använda rätt ADB

I den fungerande felsökningen användes:

    export ADB=/Users/paul/Library/Android/sdk/platform-tools/adb

Därefter:

    scrcpy

Det gjorde att scrcpy använde Android SDK:s ADB i stället för
`/usr/local/bin/adb`.

Observera att:

`export ADB=...`

bara gäller aktuell shell-session och processer som startas från den.

------------------------------------------------------------------------

# 23. Starta Godot från samma Terminal

Detta var den avgörande lösningen i den aktuella felsökningen.

Stäng först Godot helt.

Kör:

    export ADB=/Users/paul/Library/Android/sdk/platform-tools/adb

Starta därefter Godot från samma Terminal:

    open -a Godot

Godot ärver då miljövariabeln `ADB`.

Efter detta fungerade deploy-kedjan.

Det här är särskilt viktigt på macOS eftersom en app som startas från
Finder/Dock inte nödvändigtvis får samma shell environment som Terminal.

------------------------------------------------------------------------

# 24. Permanent lösning för ADB-konflikten

När allt fungerar bör miljön städas så att samma ADB används konsekvent.

Kontrollera först:

    which -a adb

En möjlig permanent lösning är att lägga Android SDK platform-tools före
äldre ADB-mappar i `PATH`.

Exempel för zsh:

    export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"

Det kan läggas i:

`~/.zshrc`

Ladda om:

    source ~/.zshrc

Kontrollera:

    which adb
    adb version

Förväntat:

`/Users/paul/Library/Android/sdk/platform-tools/adb`

Ta inte bort `/usr/local/bin/adb` förrän du vet varifrån den
installerades och att inget annat behöver den.

------------------------------------------------------------------------

# 25. Testa hela kedjan manuellt

När Godots one-click deploy beter sig konstigt kan varje steg testas
separat.

## Steg A -- enheten

    /Users/paul/Library/Android/sdk/platform-tools/adb devices

## Steg B -- paketet

    /Users/paul/Library/Android/sdk/platform-tools/adb shell pm list packages | grep -i xr

## Steg C -- start

    /Users/paul/Library/Android/sdk/platform-tools/adb shell monkey -p com.example.xrgame -c android.intent.category.LAUNCHER 1

## Steg D -- logg

    /Users/paul/Library/Android/sdk/platform-tools/adb logcat -d | grep -Ei "godot|xrgame|openxr|fatal|exception|crash"

Om A--C fungerar men appen stängs är problemet sannolikt i
projektet/runtime snarare än USB-installationen.

------------------------------------------------------------------------

# 26. Godot one-click deploy

För att one-click deploy ska fungera krävs bland annat:

-   Android export preset
-   preset markerat `Runnable`
-   korrekt Android SDK
-   enheten synlig för ADB
-   USB debugging godkänd
-   fungerande export
-   OpenXR-konfiguration för XR-projektet

Godots dokumentation anger att om enheten inte syns i:

`adb devices`

kommer den inte heller att vara tillgänglig för Godot.

------------------------------------------------------------------------

# 27. Om Godot avinstallerar tidigare version

Loggen kan visa:

`Uninstalling previous version: Oculus Quest 3`

och sedan:

`Installing to device (please wait...): Oculus Quest 3`

Det är inte i sig ett fel.

Efter installationen kan ett senare fel exempelvis ligga i:

-   launch
-   scrcpy
-   remote debugging
-   själva appen

Kontrollera därför alltid om paketet faktiskt installerades innan du
antar att exporten misslyckades.

------------------------------------------------------------------------

# 28. Remote debugging

Godot kan starta Android-exporten med argument som:

`--remote-debug`

`tcp://localhost:6007`

`--xr_mode_openxr`

Godot kan även använda ADB reverse för debuganslutningen.

Exempel:

`Reverse result: 0`

Det indikerar att ADB reverse-kommandot lyckades.

Om appen fungerar standalone men Godots debugger inte ansluter ska
remote debugging felsökas separat från OpenXR.

------------------------------------------------------------------------

# 29. OpenXR Vendors-plugin

För Godot 4.7 och senare rekommenderar pluginets dokumentation
installation via Godots Asset Store genom att söka efter:

`OpenXR vendors`

Från Godot 4.6 är vendors-pluginet optional men recommended för många
Android XR-scenarier. Det behövs framför allt för vendorspecifika
implementationer/funktioner och kan krävas vid distribution via vissa
stores.

Om plugin används:

-   kontrollera att rätt version är installerad
-   använd Gradle Build
-   aktivera rätt vendor
-   välj inte flera vendors i samma export preset om pluginets
    dokumentation avråder från detta

------------------------------------------------------------------------

# 30. Renderer -- ytterligare kontrollpunkt

Detta var inte det avgörande felet i den aktuella felsökningen, men är
en relevant Quest-kontroll.

Godots 4.7-dokumentation varnar för att Mobile Vulkan fortfarande kan ha
problem på Android-baserade XR-enheter och rekommenderar
Compatibility/OpenGL som ett säkrare felsökningsalternativ.

Om ett minimalt XR-projekt fungerar men ett Vulkan-projekt kraschar
eller renderar fel kan renderer därför testas separat.

Ändra inte renderer som första åtgärd när loggen redan visar ett tydligt
script-, resource- eller ADB-fel.

------------------------------------------------------------------------

# 31. Om appen fungerar men kontrollerna inte gör det

Detta inträffade inte i den aktuella felsökningen men är vanligt.

Kontrollera:

-   `XRController3D`
-   OpenXR action map
-   controller bindings
-   left/right hand tracker
-   Godot XR Tools-version
-   att rätt actions finns i projektet
-   att controller-noderna har rätt tracker/hand

Testa först head tracking. Därefter controllers. Därefter teleport/grab.

På så sätt isoleras problemen.

------------------------------------------------------------------------

# 32. Om bilden är svart i headsetet

Detta är en generell kontrollpunkt och var inte den slutliga orsaken
här.

Kontrollera:

-   att `XROrigin3D` finns
-   att `XRCamera3D` finns under rätt origin
-   att OpenXR initieras
-   att scenen faktiskt laddas
-   camera position
-   near/far clipping
-   environment
-   att objekt inte ligger bakom eller inuti kameran
-   renderer
-   logcat

Om logcat säger `Failed loading scene` är det inte ett kamerafel förrän
scene-loading-felet är löst.

------------------------------------------------------------------------

# 33. Om appen omedelbart återgår till Quest Home

Det betyder inte automatiskt OpenXR-fel.

Kontrollera logcat.

Vanliga orsaker:

-   GDScript parse error
-   saknad `.tscn`
-   saknad texture/material
-   pluginfel
-   native crash
-   Android exception
-   felaktigt OpenXR-init
-   renderer/driverproblem

Läs loggen kronologiskt och hitta det första relevanta felet.

------------------------------------------------------------------------

# 34. Minimalprojekt som diagnostiskt verktyg

Om ett stort projekt inte fungerar kan ett minimalt XR-projekt användas
för att isolera miljön.

Skapa endast:

-   `Node3D`
-   `XROrigin3D`
-   `XRCamera3D`
-   ett enkelt synligt `MeshInstance3D`
-   OpenXR

Om detta fungerar på Quest vet man att:

-   Android SDK fungerar
-   ADB fungerar
-   export fungerar
-   APK-installation fungerar
-   OpenXR fungerar
-   grundrendering fungerar

Därefter kan XR Tools, controllers, teleport, hands och övriga system
läggas till ett i taget.

------------------------------------------------------------------------

# 35. Bra kommandon att spara

## ADB som Godot använder

    /Users/paul/Library/Android/sdk/platform-tools/adb

## Kontrollera Quest

    /Users/paul/Library/Android/sdk/platform-tools/adb devices

## Kontrollera ADB-version

    /Users/paul/Library/Android/sdk/platform-tools/adb version

## Hitta systemets ADB

    which adb

## Hitta alla ADB

    which -a adb

## Lista installerade XR-paket

    /Users/paul/Library/Android/sdk/platform-tools/adb shell pm list packages | grep -i xr

## Lista tredjepartsappar

    /Users/paul/Library/Android/sdk/platform-tools/adb shell pm list packages -3

## Starta XRGame

    /Users/paul/Library/Android/sdk/platform-tools/adb shell monkey -p com.example.xrgame -c android.intent.category.LAUNCHER 1

## Rensa logcat

    /Users/paul/Library/Android/sdk/platform-tools/adb logcat -c

## Filtrerad logcat

    /Users/paul/Library/Android/sdk/platform-tools/adb logcat -d | grep -Ei "godot|xrgame|openxr|fatal|exception|crash"

## Starta om ADB

    /Users/paul/Library/Android/sdk/platform-tools/adb kill-server
    /Users/paul/Library/Android/sdk/platform-tools/adb start-server

## Rätt ADB för scrcpy/Godot

    export ADB=/Users/paul/Library/Android/sdk/platform-tools/adb

## Starta scrcpy

    scrcpy

## Hitta scrcpy

    which scrcpy

## Starta Godot med rätt ADB-environment

    export ADB=/Users/paul/Library/Android/sdk/platform-tools/adb
    open -a Godot

------------------------------------------------------------------------

# 36. Rekommenderad felsökningsordning

Felsök alltid från nedersta infrastrukturen uppåt:

1.  **USB-kabel och Quest authorization**
2.  **`adb devices`**
3.  **Samma ADB-version överallt**
4.  **Java 17 och Android SDK**
5.  **Godot Export Templates**
6.  **Android Build Template / Gradle**
7.  **Android Export Preset**
8.  **ETC2/ASTC-import**
9.  **APK byggs**
10. **APK installeras**
11. **Paketet finns på Quest**
12. **Appen kan startas med ADB**
13. **OpenXR-session skapas**
14. **Main scene laddas**
15. **XR Tools/scripts/resources**
16. **Controllers/hands/teleport**
17. **scrcpy/mirroring**
18. **Prestanda och rendering**

Detta förhindrar att man ändrar OpenXR-inställningar när problemet
egentligen är ADB, eller ändrar Quest-inställningar när problemet
egentligen är ett GDScript parse error.

------------------------------------------------------------------------

# 37. Den fungerande lösningen i just detta fall

Den viktigaste felkedjan var:

1.  Quest kunde anslutas med ADB.
2.  APK:n kunde byggas och installeras.
3.  XRGame fanns som `com.example.xrgame`.
4.  Appen kunde startas manuellt.
5.  OpenXR kunde komma igång.
6.  Godot försökte använda `scrcpy`.
7.  `scrcpy` hittade en äldre ADB: `/usr/local/bin/adb`
8.  Den gamla ADB:n var version/protocol 40.
9.  Android SDK/Godot använde en nyare ADB med protocol 41.
10. Resultatet blev:
    `adb server version (41) doesn't match this client (40)`
11. Rätt ADB valdes med:
    `export ADB=/Users/paul/Library/Android/sdk/platform-tools/adb`
12. Godot startades från samma Terminal: `open -a Godot`
13. Deploy fungerade.

Den viktigaste lärdomen är därför:

> När Godot, Android Studio/SDK, Homebrew, scrcpy och äldre
> Android-verktyg finns på samma Mac måste man kontrollera att de
> faktiskt använder **samma ADB-installation**.

------------------------------------------------------------------------

# 38. Slutlig checklista

Innan ett Quest-projekt felsöks på högre nivå bör följande vara sant:

-   [ ] Godot-version och export templates matchar
-   [ ] JDK 17 fungerar
-   [ ] Android SDK Path är korrekt
-   [ ] Android Build Template finns
-   [ ] Android export preset finns
-   [ ] `Runnable` är aktiverat
-   [ ] `Use Gradle Build` är aktiverat
-   [ ] `XR Mode = OpenXR`
-   [ ] ETC2/ASTC är korrekt konfigurerat
-   [ ] Quest syns i `adb devices`
-   [ ] status är `device`, inte `unauthorized`
-   [ ] Godot och scrcpy använder samma ADB
-   [ ] `scrcpy`-sökvägen är korrekt
-   [ ] APK:n installeras
-   [ ] paketet syns med `pm list packages`
-   [ ] appen kan startas manuellt
-   [ ] logcat är fri från parse errors
-   [ ] huvudscenen kan laddas
-   [ ] XR Tools-resurser finns
-   [ ] OpenXR-sessionen startar
-   [ ] controllers/hands testas först efter att grundscenen fungerar

------------------------------------------------------------------------

## Referenser

Godot 4.7 -- Deploying to Android / XR:
https://docs.godotengine.org/en/4.7/tutorials/xr/deploying_to_android.html

Godot -- One-click deploy:
https://docs.godotengine.org/en/latest/tutorials/export/one-click_deploy.html

Godot OpenXR Vendors: https://godotvr.github.io/godot_openxr_vendors/
