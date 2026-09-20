## Så fungerar vägen från Mac till Quest {#oversikt}

**Godot på Mac → Android-app → USB/ADB → Quest 3 → VR.** Du behöver ingen separat Windows-dator för det här arbetssättet. Du bygger appen på din Mac med M-chip och låter headsetet köra den. Vanlig F5 på Mac testar datorversionen; använd Android-knappen för test i Quest.

**Innan du börjar:** Godot är installerat enligt [kapitel 1](01-start.html#installera-godot), och du har sparat grundscenen, xr_player.tscn och main.gd enligt [kapitel 2](02-forsta-scenen.html). Ha projektet öppet i editorn. Det behöver ännu inte fungera i headsetet – det testar du i detta kapitel.

<div class="callout"><strong>Första gången och nästa gång</strong><p>Steg 1–7 är grundinstallation. Vid senare test räcker normalt: anslut Quest, spara projektet och välj One-click deploy. Första bygget kan ta längre tid eftersom Gradle hämtar byggberoenden.</p></div>

## 1. Installera exportmallarna {#godot}

Godot installerade du i kapitel 1. Nu lägger du till de **exportmallar** som behövs för att bygga Android-appen.

1. Öppna projektet från kapitel 2 och kontrollera hela versionsnumret via **About / Om Godot**.
2. Öppna **Manage Export Templates** från editorns meny. På macOS kan editorfunktionerna ligga i menyn **Godot**.
3. Installera mallarna för **exakt samma utgåva** som editorn. Mallar för 4.7.1 ska inte användas till 4.7.2.

**Kontroll:** Exportmallshanteraren ska visa att mallarna för den aktuella versionen är installerade. [Godot 4.7.2 och exportmallar](https://godotengine.org/download/archive/4.7.2-stable/)

## 2. Installera Java 17 för Apple Silicon {#java}

Hämta **Temurin OpenJDK 17** från Adoptium. Välj **macOS**, **aarch64/ARM64**, **JDK**, version **17**, och installera paketet. Välj JDK, inte bara JRE. [Adoptiums nedladdning](https://adoptium.net/temurin/releases/?version=17)

Öppna macOS **Terminal**. Kör följande två kommandon var för sig:

```bash
/usr/libexec/java_home -V
/usr/libexec/java_home -v 17
```

Det andra skriver ut mappen som Godot ska använda, exempelvis:

```text
/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
```

Kontrollera den valda versionen direkt, även om din dator har flera Java-versioner:

```bash
"$(/usr/libexec/java_home -v 17)/bin/java" -version
```

**Kontroll:** Utdata ska visa Java **17**. Om `java_home` inte hittar den, kontrollera att JDK-installationen är färdig. Godots Android-exportguide rekommenderar JDK 17; att Android Studio har en egen Java-runtime betyder inte automatiskt att Godot pekar på rätt JDK. [Godot: Java och Android SDK](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_android.html)

## 3. Installera Android SDK {#sdk}

Installera **Android Studio för Mac med Apple chip** och kör installationsguiden. Du behöver inget nytt Android Studio-projekt och ingen Android-emulator för den här kursen: Quest är testenheten. [Googles installation för macOS](https://developer.android.com/studio/install)

Öppna **SDK Manager** från välkomstfönstrets **More Actions**, eller via Android Studios inställningar. Notera **Android SDK Location**. Standard är:

```text
/Users/ditt-anvandarnamn/Library/Android/sdk
```

Installera följande paket. Tabellen återger Godot **4.7-dokumentationen kontrollerad 20 september 2026**; använd versionsväljaren i dokumentationen om du senare byter Godot-serie.

| Flik i SDK Manager | Paket | Version |
| --- | --- | --- |
| SDK Platforms | Android SDK Platform | 35 (Android 15) |
| SDK Tools | Android SDK Platform-Tools | 35.0.0 eller senare |
| SDK Tools | Android SDK Build-Tools | 35.0.1 |
| SDK Tools | Android SDK Command-line Tools | latest |
| SDK Tools | NDK (Side by side) | 28.1.13356709 / r28b |
| SDK Tools | CMake | 3.10.2.4988404 |

Kryssa i **Show Package Details** för att välja exakta äldre versioner. Klicka **Apply**, läs och godkänn licenserna och vänta på färdig installation. Nyare paket kan ligga kvar bredvid dessa. Ändra inte kursens versionsnummer enbart för att SDK Manager erbjuder en högre version. [Godots paketlista](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_android.html) · [Android SDK Manager](https://developer.android.com/studio/intro/update#sdk-manager)

Prova sedan ADB. Kommandot nedan utgår från standardplatsen och använder ditt eget hemkatalogsnamn automatiskt:

```bash
"$HOME/Library/Android/sdk/platform-tools/adb" version
```

**Kontroll:** ADB skriver ut version och sökväg. `No such file or directory` betyder att SDK ligger någon annanstans eller att Platform-Tools saknas. Använd då SDK Location från Android Studio.

## 4. Tala om för Godot var verktygen finns {#sokvagar}

Öppna **Godot → Editor Settings → Export → Android**. Sök efter Android om kategorin är svår att hitta.

| Fält | Vad du anger |
| --- | --- |
| Java SDK Path | Hela mappsökvägen från `java_home -v 17`, inklusive `Contents/Home`. |
| Android SDK Path | Android SDK Location, exempelvis `/Users/anna/Library/Android/sdk`. |

Här ska du använda **riktiga absoluta sökvägar**. Klistra inte in `$HOME`, ett exempelanvändarnamn eller hela sökvägen till `adb` i SDK-fältet. SDK-fältet ska peka på mappen som innehåller `platform-tools`.

Inställningarna gäller datorns editor. Projektets OpenXR-inställningar ligger däremot i **Project Settings**. De två fönstren har olika uppgifter. [Godots sökvägsinställningar](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_android.html)

## 5. Förbered Meta Quest 3 {#quest}

1. Använd Meta-kontot som är kopplat till ditt headset. Följ Metas guide för att **skapa eller ansluta till en utvecklarorganisation** och genomföra kontoverifieringen.
2. Öppna **Meta Horizon-appen** på mobilen. Välj ditt Quest 3 och headsetets inställningar. Aktivera **Developer Mode / Utvecklarläge**. Om valet saknas, kontrollera organisation, verifiering och att rätt konto används.
3. Starta headsetet och anslut det till Macen med en **USB-datakabel**.
4. Ta på headsetet. Godkänn **Allow USB debugging** för din dator. Välj **Always allow from this computer** om det är din egen betrodda utvecklingsdator.
5. Om du bara får en fråga om filåtkomst är det inte samma sak som USB-debuggning. Kör `adb devices -l` i nästa steg och titta efter behörighetsdialogen igen.

Exakt menyplacering kan ändras med Horizon OS och mobilappen. Följ den aktuella [Meta-guiden för Device Setup](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/). Metas särskilda Oculus ADB-drivrutin gäller **Windows**; den ska inte installeras på Mac.

## 6. Kontrollera USB innan du bygger {#adb}

Kör i Terminal:

```bash
"$HOME/Library/Android/sdk/platform-tools/adb" devices -l
```

Ett förenklat lyckat resultat:

```text
List of devices attached
QUEST_SERIENUMMER    device
```

| Resultat | Nästa steg |
| --- | --- |
| `device` | Anslutningen är klar. Fortsätt till exporten. |
| `unauthorized` | Godkänn USB-debuggning inne i Quest. |
| Tom lista | Kontrollera datakabel, utvecklarläge, USB-port och att headsetet är vaket. |
| `offline` | Återanslut och prova att starta om ADB. |
| Flera enheter | Koppla från andra Android-enheter eller välj rätt Quest vid deploy. |

Att Quest laddas bevisar inte att datakabeln fungerar. Godot kan inte hitta en enhet som ADB inte ser. Metas installationsguide och Androids ADB-dokumentation beskriver samma krav på behörighet. [Android: enhetsanslutning](https://developer.android.com/tools/adb) · [Felsök USB](06-felsokning.html#usb)

## 7. Skapa Android-exporten {#export}

Öppna ditt Godot-projekt. Kontrollera **OpenXR Enabled**, **XR Shaders Enabled** och att `main.tscn` är huvudscen. Spara allt.

Välj **Project → Install Android Build Template** och installera för din editorversion. Öppna därefter **Project → Export → Add → Android**. Döp exportprofilen till **Meta Quest**.

| Exportinställning | Värde för kursen |
| --- | --- |
| Runnable | På |
| Gradle Build → Use Gradle Build | På |
| Export Format | APK |
| Architectures → arm64-v8a | På (Quest använder ARM64) |
| XR Features → XR Mode | OpenXR |
| Package → Unique Name | `com.example.vrstart` |
| Package → Name | VR Start |
| Version → Code | Börja med 1; höj när det behövs vid uppdatering. |

För denna övning räcker ARM64; andra arkitekturer kan stängas av. Exportfönstret visar saknade beroenden längst ner. Åtgärda dessa innan du försöker starta appen. Använd debug-export för utveckling, och låt projektets vanliga resursberoenden följa med. [Godots Android-XR-export](https://docs.godotengine.org/en/4.7/tutorials/xr/deploying_to_android.html)

**Behövs OpenXR Vendors?** Inte för kursens grundtest. Från 4.6 är tillägget valfritt för många Android-XR-enheter. Behöver du Meta-specifika funktioner installerar du en kompatibel utgåva och aktiverar rätt vendor i exportprofilen. Börja med standard-OpenXR och lägg till Vendors först när grundtestet fungerar. [Vendors-projektet](https://godotvr.github.io/godot_openxr_vendors/)

**Texturvarning om ETC2/ASTC?** Följ Godots exportvarning och aktivera den efterfrågade importinställningen i **Project Settings → Rendering → Textures → VRAM Compression**. Sök efter `ETC2` med Advanced Settings på. Låt importen bli färdig före nästa bygge. Se [texturfelsökningen](06-felsokning.html#resurser).

## 8. Kör med One-click deploy {#kor}

1. Låt Quest vara anslutet, vaket och godkänt för USB-debuggning.
2. Spara scener och script i Godot.
3. Använd **Android-/Remote Deploy-knappen uppe till höger** och välj Quest 3. Den dyker upp när Android-exportprofilen är Runnable och enheten känns igen.
4. Vänta medan Godot bygger, installerar och startar appen. Första Gradle-bygget behöver internet för beroenden.
5. Ta på headsetet och kontrollera att du ser ditt golv. Vrid huvudet: perspektivet ska följa med.

Om Godot erbjuder **skärmspegling / scrcpy / embedded device view**, lämna den avstängd för första testet. Spelet kan köras på Quest även om en speglingsprocess på Mac inte startar. [One-click deploy](https://docs.godotengine.org/en/4.7/tutorials/export/one-click_deploy.html)

**Förväntat resultat:** Appen startar i headsetet, scenen syns och huvudspårningen fungerar. Fungerar detta kan du fortsätta med [händer och rörelse](04-spelaren.html).

## 9. Alternativ: exportera APK och installera manuellt {#manuellt}

Det här är användbart för att skilja ett exportfel från ett fel i Godots automatiska start. I **Project → Export**, välj Meta Quest och **Export Project**. Behåll **Export With Debug** och spara som **vr-start.apk** i Hämtade filer (Downloads).

Installera och ersätt en tidigare installation med samma signering:

```bash
"$HOME/Library/Android/sdk/platform-tools/adb" install -r "$HOME/Downloads/vr-start.apk"
```

Resultatet ska sluta med **Success**. Byt filsökväg om du sparade någon annanstans. Kontrollera paketet:

```bash
"$HOME/Library/Android/sdk/platform-tools/adb" shell pm list packages com.example.vrstart
```

Starta appen:

```bash
"$HOME/Library/Android/sdk/platform-tools/adb" shell monkey -p com.example.vrstart -c android.intent.category.LAUNCHER 1
```

Paketnamnet måste vara samma som i exportprofilen. `Events injected: 1` betyder att startförsöket skickades, inte att VR-spelet säkert fortsätter fungera. Vid omedelbar stängning: läs [logcat](06-felsokning.html#logcat). Installerade utvecklingsappar kan också hittas i headsetets appbibliotek under **Unknown Sources / Okända källor**, beroende på OS-version. [Android ADB](https://developer.android.com/tools/adb) · [Android Monkey](https://developer.android.com/studio/test/other-testing-tools/monkey)

## 10. Valfri skärmspegling med scrcpy {#scrcpy}

Börja med detta först när appen fungerar inne i headsetet. Installera scrcpy från dess [officiella macOS-guide](https://github.com/Genymobile/scrcpy/blob/master/doc/macos.md). Om du redan använder Homebrew:

```bash
brew install scrcpy
command -v scrcpy
scrcpy --version
```

På Apple Silicon är sökvägen ofta `/opt/homebrew/bin/scrcpy`; använd det verkliga svaret från `command -v`. Om Godot ber om **scrcpy Path** anger du den fullständiga sökvägen där.

Låt scrcpy använda samma ADB som Godots Android SDK:

```bash
ADB="$HOME/Library/Android/sdk/platform-tools/adb" scrcpy --no-audio
```

Installera inte ytterligare ADB-versioner för att lösa ett rent scrcpy-fel. Ett svart speglingsfönster betyder inte automatiskt att bilden i headsetet är svart. [scrcpy: ADB-konflikter](https://github.com/Genymobile/scrcpy/blob/master/FAQ.md)

## 11. Nästa arbetspass {#nasta-gang}

Anslut Quest, kontrollera att det känns igen, spara och gör One-click deploy igen. Testa varje ny funktion separat. Du behöver inte installera om Android Studio, Java eller exportmallar varje gång.

Om du vill testa utan kabel efter installationen: starta appen direkt från headsetets bibliotek. USB behövs för den här guidens installation och felsökning, inte för att en fristående app ska köras. Trådlös ADB är en senare möjlighet när USB-flödet redan är stabilt. [Androids trådlösa debuganslutning](https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi)

<div class="checkpoint" data-checklist="mac"><h3>Min installation är klar</h3><label><input type="checkbox"> Godot och exportmallarna har samma fullständiga versionsnummer.</label><label><input type="checkbox"> Java 17 och alla SDK-paket är installerade.</label><label><input type="checkbox"> Godot har rätt Java SDK Path och Android SDK Path.</label><label><input type="checkbox"> Quest visas som device i ADB.</label><label><input type="checkbox"> APK:n byggs och installeras.</label><label><input type="checkbox"> Min scen fungerar inne i headsetet.</label></div>
