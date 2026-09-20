## Målet: ditt första rum i VR {#mal}

Du ska kunna ta på dig Meta Quest 3, se en egen värld, röra händerna, förflytta dig och plocka upp kuber från ett bord. Guiden använder **Godot 4.7**, GDScript och vanliga Quest-kontroller. Du behöver inte kunna skriva ett helt spel i förväg.

Vi bygger små delar och provar en sak i taget. Först en synlig värld med huvudspårning. Därefter händer och rörelse. Sist föremål som går att greppa. Det gör det mycket lättare att hitta fel.

<div class="callout"><strong>Du arbetar på Macen – spelet körs på Quest.</strong><p>Macen redigerar projektet och bygger en Android-app (APK). USB överför appen till headsetet. Quest kör sedan VR-spelet med sin egen processor och grafik.</p></div>

## Det du behöver {#utrustning}

- En Mac med Apple Silicon (M1 eller senare) för Mac-spåret i den här kursen.
- Meta Quest 3 med två laddade Touch Plus-kontroller.
- En USB-C-kabel som överför data. En kabel som bara laddar räcker inte.
- Godot **4.7 Standard**, inklusive exportmallar för exakt samma version.
- Internet för program, SDK-paket och första Gradle-bygget.
- Ett Meta-konto med utvecklarläge för att installera egna appar.

## Installera Godot innan du börjar {#installera-godot}

1. Öppna [Godots officiella versionsarkiv](https://godotengine.org/download/archive/) och välj **Godot 4.7 Standard för macOS**. För den här kursen använder du GDScript, så Standard räcker.
2. Välj macOS-utgåvan med stöd för **Apple Silicon/universal**, packa upp den och dra **Godot.app** till **Program / Applications**.
3. Starta Godot. Första fönstret är **Project Manager**, där du senare skapar och öppnar projekt.
4. Kontrollera hela versionsnumret via **About / Om Godot**, till exempel **4.7.2**, och skriv upp det. Det behövs när du installerar exportmallarna i kapitel 3.

**Kontroll innan du går vidare:** Godot startar och Project Manager visas. Du behöver inte skapa något Android Studio-projekt eller installera XR Tools ännu. Nästa kapitel visar hur du skapar ditt första Godot-projekt.

Den här kursen gäller 4.7-serien. [Godot 4.7.2](https://godotengine.org/download/archive/4.7.2-stable/) finns i versionsarkivet och är versionen som det lokala felsökningsunderlaget beskriver. Exportmallarna installeras när ditt projekt finns och Android-exporten ska förberedas.

<div class="checkpoint" data-checklist="installation"><h3>Redo att börja bygga</h3><label><input type="checkbox"> Godot 4.7 Standard är installerat på min Mac.</label><label><input type="checkbox"> Jag har öppnat Project Manager och noterat hela versionsnumret.</label></div>

## Följ kapitlen i nummerordning {#lasordning}

| Kapitel | Vad du gör | När du går vidare |
| --- | --- | --- |
| 1 | Installera Godot och förstå arbetsflödet. | Project Manager går att öppna. |
| 2 | [Bygg en första VR-scen](02-forsta-scenen.html). | Golv, ljus, XR-kamera och startkod finns. |
| 3 | [Förbered Mac och kör på Quest](03-macos-quest.html). | Du ser golvet inne i headsetet. |
| 4 | [Lägg till händer och rörelse](04-spelaren.html). | Händerna följer kontrollerna och förflyttningen fungerar. |
| 5 | [Bygg bord och greppbara objekt](05-objekt.html). | Du kan ta upp och släppa en kub. |
| 6 | [Felsök rätt del](06-felsokning.html) vid behov. | Du har hittat det första relevanta felet. |
| 7 | [Läs källor och versionsinformation](07-kallor.html). | Du vet vilka instruktioner som gäller din version. |

Har du redan ett fungerande Godot-projekt kan du gå direkt till kapitel 3. Första headsettestet görs där, innan XR Tools, händer och grepp läggs till.

## Några ord som återkommer {#ordlista}

| Ord | Vad det betyder här |
| --- | --- |
| **Scen** | Ett sparat träd av noder, till exempel `main.tscn`. En scen kan ingå i en annan. |
| **Nod** | En byggdel: kamera, ljus, modell eller fysikkropp. |
| **Mesh** | Formen du ser. Den stoppar inte föremål av sig själv. |
| **Collision shape** | Den osynliga form som fysiken använder för kollisioner. |
| **XR / OpenXR** | XR är ett samlingsnamn för bland annat VR. OpenXR kopplar spelet till headsetets XR-system. |
| **Godot XR Tools** | Färdiga komponenter för exempelvis rörelse, händer och grepp. |
| **OpenXR Vendors** | Ett annat tillägg, för funktioner som är särskilda för en headsettillverkare. |
| **APK** | Android-appfilen som installeras på Quest. |
| **SDK / JDK** | Verktyg för att bygga Android-appar respektive köra Java-baserade byggverktyg. |
| **ADB** | Android Debug Bridge: länken för installation, start och loggar. |
| **scrcpy** | Valfri skärmspegling till datorn. Behövs inte för att spela i VR. |

OpenXR, XR Tools och Vendors har alltså olika uppgifter. Godots dokumentation och Vendors-projektets beskrivning stödjer den uppdelningen. [Godots XR-system](https://docs.godotengine.org/en/4.7/tutorials/xr/setting_up_xr.html) · [OpenXR Vendors](https://godotvr.github.io/godot_openxr_vendors/)

## Så använder du instruktionerna {#arbetssatt}

Ha webbplatsen i ett smalt fönster bredvid Godot. Följ ett avsnitt, spara och kontrollera resultatet. Engelska menynamn används för att du ska känna igen dem i editorn. På macOS kan kortkommandon skilja sig; använd högerklicksmenyn eller knappen i scenpanelen om videons Ctrl-kombination inte fungerar.

Kodrutornas **Kopiera** kopierar bara koden. Terminalkommandon hör till macOS Terminal; GDScript hör till Godots scripteditor. Text som `com.example.vrstart` är kursens exempel och måste matcha ditt eget projekt.

Checklistorna sparas bara i din webbläsare. Inga konton behövs för webbplatsen. Pausa testet om VR-rörelse känns obehaglig och använd headsetets vanliga säkerhetsgräns i en fri yta.

## Om videon och uppdateringen {#videon}

Upplägget bygger på Virtual Rooks [Getting Started With XR in Godot 4.3 Tutorial!](https://www.youtube.com/watch?v=gbTUNg99lrg) och den svenska transkriptionen. Den nya guiden är fristående och anpassad för **4.7**, inte en ordagrann återgivning av den äldre videon.

Tekniska uppgifter kontrollerades **20 september 2026**. Där officiella källor säger olika saker redovisas det på [källsidan](07-kallor.html). Webbplatsens instruktioner är dokumentationsgranskade; de ska inte tolkas som att hela kursprojektet har provkörts på fysisk Quest-hårdvara.
