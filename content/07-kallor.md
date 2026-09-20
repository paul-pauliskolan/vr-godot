## Underlag och kontroll {#underlag}

Senast granskad: **20 september 2026**. Kursen riktar sig till **Godot 4.7-serien**, Meta Quest 3 och macOS med Apple Silicon. Dokumentation med `/en/4.7/` prioriteras framför `latest`, som kan beskriva nästa utvecklingsversion.

Pedagogiskt underlag är Virtual Rooks [Getting Started With XR in Godot 4.3 Tutorial!](https://www.youtube.com/watch?v=gbTUNg99lrg), den tillhandahållna svenska transkriptionen och det lokala felsökningsdokumentet **Godot_4.7.2_Meta_Quest_3_felsokningsguide.md**. Videons detaljer har bearbetats genom transkriptionen; varje bildruta i videon har inte verifierats på nytt. Egna exempelvärden används för scenens mått och placeringar.

Design och läsupplägg följer [Pauliskolans Programmering nivå 1 med Python](https://paul-pauliskolan.github.io/prog1-python/index.html): ljus bakgrund, tydliga kort, numrerade kapitel, smal lästext och en meny som kan stängas.

## Vad flera källor bekräftar {#kontroll}

| Uppgift | Källor som jämförts | Slutsats i kursen |
| --- | --- | --- |
| Quest måste tillåta utveckling och USB-debuggning. | [Meta Device Setup](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/) + [Android ADB](https://developer.android.com/tools/adb) + [Godot deploy](https://docs.godotengine.org/en/4.7/tutorials/export/one-click_deploy.html) | Kontrollera `device` före exportfelsökning. |
| JDK och SDK måste finnas på byggdatorn. | [Godot Android-export](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_android.html) + [Godot Android-XR](https://docs.godotengine.org/en/4.7/tutorials/xr/deploying_to_android.html) + [Android Studio](https://developer.android.com/studio/install) | Använd Godots versionsspecifika paketkrav; Google beskriver installationen. |
| Vendors lägger till leverantörsspecifika funktioner. | [Godot Android-XR](https://docs.godotengine.org/en/4.7/tutorials/xr/deploying_to_android.html) + [Vendors-projektet](https://godotvr.github.io/godot_openxr_vendors/) | Grundtestet kan börja utan tillägget. Godot anger valfrihet från 4.6. |
| Grepp kräver både en pickup-funktion och ett pickable-objekt. | [Pickup Function](https://godotvr.github.io/godot-xr-tools/docs/pickup/) + [Pickable Objects](https://godotvr.github.io/godot-xr-tools/docs/pickable/) + [Physics Layers](https://godotvr.github.io/godot-xr-tools/docs/physics_layers/) | Lägg funktioner på kontrollerna och matcha kollisionslagren. |
| Olika ADB-versioner kan störa varandra. | Lokalt felsökningsfall + [scrcpy FAQ](https://github.com/Genymobile/scrcpy/blob/master/FAQ.md) | Kontrollera faktiska sökvägar och välj samma ADB. |

Flera sidor från samma projekt är kompletterande dokumentation, inte oberoende bevis. Google fastställer inte Godots exakta NDK-version och Vendors-introduktionen lovar inte stöd för varje Godot-utgåva. Där versionskrav har en enda primärkälla anges den direkt.

## Skillnader och rättelser {#skillnader}

### OpenXR-start: använd 4.7-exemplet

Den äldre granskningskommentaren i transkriptionen föreslog `initialize()`. Godots **4.7 Setting up XR** visar `is_initialized()` och förklarar att OpenXR startar före projektets scen. Därför använder kursen kontrollen och aktiverar `use_xr` därefter. Samma sida säger att OpenXR sköter bildtimingen; den gamla manuella VSync-raden har utelämnats. [Läs förklaringen](https://docs.godotengine.org/en/4.7/tutorials/xr/setting_up_xr.html)

### Renderer: källorna är inte samstämmiga

[Setting up XR](https://docs.godotengine.org/en/4.7/tutorials/xr/setting_up_xr.html) rekommenderar **Mobile**, uttryckligen även för Quest 3. [Deploying to Android](https://docs.godotengine.org/en/4.7/tutorials/xr/deploying_to_android.html) har samtidigt en varning som rekommenderar **Compatibility/OpenGL**. Kursens praktiska val är Mobile för huvudspåret och Compatibility som jämförelse vid isolerade grafikfel. Det är ett redaktionellt val, inte ett påstående om att dokumentationen är enig.

### XR Tools: följ aktuell komponentbeskrivning

Videon lägger till Player Body manuellt. Nuvarande [Player Body](https://godotvr.github.io/godot-xr-tools/docs/player_body/) och [Direct Movement](https://godotvr.github.io/godot-xr-tools/docs/direct/) beskriver automatisk tilläggning. Kursen undviker därför en dubbel kropp.

XR Tools äldre generella [Setup-sida](https://godotvr.github.io/godot-xr-tools/docs/setup/) innehåller fortfarande API-namn som `get_viewport().arvr` och `OS.vsync_enabled`. De används **inte** i kursens Godot 4.7-kod. För startkoden prioriteras Godots versionsspecifika dokumentation.

### Lokalt felsökningsfall är inte en universell lösning

Originalunderlagets användarsökväg och paketnamn är ersatta med allmänna exempel. Dess `open -a Godot` är beskrivet som en observation från det fallet. Guiden använder i stället appens körbara fil direkt när en kontrollerad shell-miljö behöver ärvas. `ADB` väljer ADB för scrcpy; Godots SDK-fält behöver också vara rätt inställt.

## Officiell dokumentation att ha nära {#lankar}

### Godot och OpenXR

- [Godot 4.7.2 och exportmallar](https://godotengine.org/download/archive/4.7.2-stable/)
- [Setting up XR, Godot 4.7](https://docs.godotengine.org/en/4.7/tutorials/xr/setting_up_xr.html)
- [OpenXR Settings](https://docs.godotengine.org/en/4.7/tutorials/xr/openxr_settings.html)
- [OpenXR action map](https://docs.godotengine.org/en/4.7/tutorials/xr/xr_action_map.html)
- [Exporting for Android](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_android.html)
- [Deploying to Android för XR](https://docs.godotengine.org/en/4.7/tutorials/xr/deploying_to_android.html)
- [One-click deploy](https://docs.godotengine.org/en/4.7/tutorials/export/one-click_deploy.html)

### Meta, Android och Java

- [Meta: förbered headsetet för utveckling](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/)
- [Meta: OpenXR-stöd](https://developers.meta.com/horizon/documentation/native/android/mobile-openxr/)
- [Android Studio för din dator](https://developer.android.com/studio/install)
- [SDK Manager och paket](https://developer.android.com/studio/intro/update#sdk-manager)
- [Android Debug Bridge](https://developer.android.com/tools/adb)
- [Logcat](https://developer.android.com/tools/logcat)
- [Temurin JDK 17](https://adoptium.net/temurin/releases/?version=17)

### Tillägg och skärmspegling

- [Godot XR Tools: installation](https://godotvr.github.io/godot-xr-tools/docs/installation/)
- [XR Tools: releases och kompatibilitet](https://github.com/GodotVR/godot-xr-tools/releases)
- [OpenXR Vendors](https://godotvr.github.io/godot_openxr_vendors/)
- [scrcpy: installation på macOS](https://github.com/Genymobile/scrcpy/blob/master/doc/macos.md)
- [scrcpy: fel och ADB-konflikter](https://github.com/Genymobile/scrcpy/blob/master/FAQ.md)

## När du uppdaterar kursen {#uppdatering}

Kontrollera Godot och exportmallar som ett par. Kontrollera sedan pluginversionerna, Android-paketkraven och ändrade Meta-menyer. Gör ett nytt minimalt headsettest innan du lovar att en ny kombination fungerar.

Källkontroll och praktiskt test är olika saker. Innehållet är granskat mot dokumentationen och underlagen; någon fullständig hårdvaruverifiering av webbplatsens exempelprojekt har inte gjorts här. Menytexter och tillgång till utvecklarläge kan också variera mellan konton och OS-utgåvor.
