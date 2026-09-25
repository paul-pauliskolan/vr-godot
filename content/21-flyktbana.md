<div class="callout"><strong>Från överlevnadstest till en spelbar flykt.</strong><p>Nu finns två nycklar, två låsta dörrar och en utgång till dagsljus. Spelaren måste leta, överleva och hantera ammunition. Spelet visar tid, besegrade monster, poäng och sparat rekord när flykten lyckas.</p></div>

## Spelordning och nivåns delar {#spelordning}

Starta med **Start game** på desktop eller höger **B** i Quest. Monstren börjar inte spawnas förrän omgången startar. Bordet och pistolen står kvar i första området. Där finns även den första nyckeln, dold under en greppbar hink. **Greppa och lyft hinken; gå inte upp på den.** En gyllene nyckel med ljusring och texten **KEY 1** visas direkt när hinken lyfts i Quest, eller när den flyttats/tippats i desktopläget. Nyckeln förblir synlig i minst två sekunder innan den kan plockas upp genom att du går nära den. När HUD:en visar **KEYS 1/2** kan du närma dig **DOOR 1**, som öppnas automatiskt.

Det andra området innehåller ytterligare en hink och **KEY 2**. Efter **DOOR 2** öppnas en större utomhusgård med kvällshimmel, varmare ljus, en stenlagd väg och grönska mellan ruinerna. Följ vägen till den upplysta portalen **YOU MADE IT OUT / SAFE ZONE** för att avsluta omgången. Dörrar går inte att passera utan rätt nyckel och monster kan inte navigera genom den första låsta porten. Utegården har sammanhängande golv och kolliderande sidoväggar; skulle spelaren ändå hamna under banan flyttas den tillbaka till senaste säkra plats.

I projektet ligger detta i `Main.tscn`: `Bucket1`, `Key1`, `Door1`, `Bucket2`, `Key2`, `Door2`, `ExitZone` och tre `AmmoCache`-instanser. `hidden_key.gd` visar nyckeln vid XR-grepp eller när hinken flyttats minst 0,38 meter eller tippats ungefär 32 grader. En kort väntan hindrar nyckeln från att försvinna samma ögonblick som den visas. `bucket_behavior.gd` gör att hinkarna inte kan kasta spelaren uppåt genom fysisk kollision, men de går fortfarande att plocka upp. `locked_door.gd` kontrollerar rätt nyckel och **svänger dörrbladet på ett sidogångjärn** under drygt en sekund. Kollisionen följer dörrbladet; det är inte en panel som försvinner. När första dörren är öppen är passagen faktiskt fri: dörrkollisionen ligger åt sidan och innerväggen står längre bort. `urban_arena.gd` uppdaterar fiendernas enkla vägval när första porten öppnats. Den äldre övningens mål och kuber finns kvar i de tidigare kapitlen; de ingår inte i den färdiga flyktbanan.

## Nya modeller till sökandet och dörrarna {#nya-modeller}

De tre nya visuella modellerna är nedladdade, anpassade och ligger som GLB-filer i `assets/escape_props/`. Källsidorna anger **CC0**:

| Del | Källa | Så används den |
| --- | --- | --- |
| Rostig hink | [Bucket 3 av plaggy](https://opengameart.org/content/bucket-3) | Modell med rostig yta ovanpå en greppbar fysikkropp. Du kan lyfta eller tippa den. |
| Nyckel | [Key - low poly av codeinfernogames](https://opengameart.org/content/key-low-poly) | Guldtonad 3D-modell som visas när hinken flyttas. |
| Dörr | [Door av NotionHD](https://opengameart.org/content/door-1) | 3D-dörr med handtag, sidogångjärn och ett separat kolliderande dörrblad. Dörrbladet får [Rusty Metal Sheet från Poly Haven](https://polyhaven.com/a/rusty_metal_sheet) som rostig CC0-textur. |

Skriptet `tools/prepare_escape_props.py` visar konverteringen från källfilerna. Enkla kollisionsformer behålls separat från modellernas geometri så att grepp och gångvägar blir stabila i Quest.

## Spider av br-n518 {#spider}

Den tidigare större fienden är ersatt av [Spider av br-n518 på OpenGameArt](https://opengameart.org/content/spider-2). Källsidan anger **CC0**. Den importerade `assets/monsters/spider.glb` har idle-, gång- och attackklipp. Källfilen har inget färdigt hopp. `simple_monster.gd` ger därför spindeln ett eget fysikbaserat språng när spelaren är ungefär 0,8–2,8 meter bort: kort förvarning, attackanimation, fart framåt och uppåt, gravitation och fyra sekunders nedkylning. Den kan skadas med samma `take_damage()` som Horror Game Monster och besegras efter tre träffar. Bara en spindel åt gången skapas för att hålla Quest-belastningen rimlig.

## Hälsokit och magasin {#resurser}

Den gamla gröna geometriska power-upen visar nu en lågpoly-[First Aid Kit av GGBotNet](https://opengameart.org/content/first-aid-kit-3d), också märkt **CC0** på källsidan. Modellen ligger som `assets/medkit.glb` i `health_power_up.tscn`. Funktionen är densamma: gå in i objektet för att läka, om du saknar hälsa. Fler kit kan dyka upp från spawnern.

Pistolen startar med **åtta patroner**. Varje skott drar en patron och tom pistol kan inte skjuta. Tre ammunitionsgömmor i nivån ger varsitt reservmagasin med åtta patroner. Magasin behöver alltså hittas; de skapas inte gratis av omladdningsknappen. HUD:en visar **AMMO** och antal reservmagasin. Åtta patroner är ett medvetet spelval för att göra sökandet viktigt, inte en regel för alla riktiga pistoler.

### Så sätter du i magasinet i Quest {#satt-i-magasin}

1. **Håll pistolen i höger hand.** Om den är tom står **EMPTY - PRESS B TO EJECT** vid vapnet. Tryck **B på höger kontroll** medan pistolen är i handen. Det gamla magasinet faller ut och en turkos markering med texten **INSERT MAG HERE** syns **under pistolgreppet**.
2. **Hitta ammunition i banan.** Gå in i ett förråd märkt **8 ROUNDS**. Då läggs ett reservmagasin till i din inventering, och ett fysiskt magasin visas vid **vänster höft** med skylten **SPARE MAG**. Saknas den skylten har du inget reservmagasin ännu.
3. **Ta magasinet med vänster hands greppknapp och fortsätt hålla det.** För vänster hand till den turkosa markeringen under pistolgreppet. Du behöver inte trycka avtryckaren eller passa in det millimeterexakt: när magasinet är inom cirka 23 cm från uttaget snäpper det i automatiskt och markeringen slocknar.
4. Kontrollera att handledens **AMMO** visar patroner och skjut igen. Ett utmatat magasin som hade patroner kvar behåller dem om du plockar upp det från marken och sätter tillbaka det.

På desktop plockar du upp pistolen med högerklick och trycker **R** för att förbruka ett hittat reservmagasin och ladda åtta patroner. Omladdningen är förenklad där eftersom du inte har två VR-händer.

## HUD, poäng och sparat rekord {#resultat}

Quest-spelaren får ett verktyg på vänster handled som visar hälsobar, ammunition, reservmagasin, nycklar och besegrade monster. Desktop-HUD:en visar samma information. När du når utgången visas **TIME**, **MONSTERS KILLED**, **SCORE** och **BEST**. Snabbare flykt ger högre grundpoäng; monster ger 100 poäng vardera upp till 20 monster. Formeln i `game_state.gd` är `round(6000 / (1 + sekunder / 120)) + min(monster, 20) * 100`. Rekordet sparas lokalt i Godots `user://highscore.cfg` och visas även i nästa omgångs startmeny. Det är ett **lokalt rekord på samma enhet**, inte en nätbaserad topplista.

## Kontroller i detta kapitel {#kontroller}

All synlig speltext är på engelska, även om den här manualen är på svenska. Startskärmen har SFX och Music **ON** som standard.

| Funktion | Desktop | Quest 3 |
| --- | --- | --- |
| Starta omgång | Klicka **Start game** | Höger **B** |
| Rörelse och sprint | **WASD**/piltangenter, håll **Shift** | Vänster styrspak, håll dess klick för sprint |
| Hoppa och huka | **Space**, **Ctrl/C** | Höger **A**, höger styrspaks klick |
| Plocka upp/släpp | Högerklick | Handens greppknapp |
| Skjut | Vänsterklick med hållen pistol | Avtryckaren på handen som håller pistolen |
| Magasin | **R** laddar med ett hittat reservmagasin | Höger **B** matar ut; ta reservmagasin vid vänster höft och sätt i pistolen |
| Starta om efter vinst/förlust | **R** eller knappen på skärmen | Höger **B** |

Höger **B** används alltså i olika lägen: start i menyn, magasinutmatning under spelet och omstart efter resultatet. **A** är redan upptagen av hopp, och höger styrspaks klick av huka. Därför används inte de knapparna för magasin.

## Verifiera först på desktop, sedan i Quest {#testa}

1. Starta spelet och se att inget monster skapas före **Start game**. Kontrollera att SFX och Music börjar på **ON**.
2. Skjut åtta gånger och bekräfta att pistolen slutar avfyra. Hitta ett magasin och ladda om. På Quest: prova också att mata ut ett halvfullt magasin och sätta i det igen.
3. Greppa och lyft första hinken. Se att den lysande **KEY 1** faktiskt syns innan den samlas in. Gå nära och kontrollera **KEYS 1/2** på HUD:en. Att gå på hinken ska inte ge ett högt hopp. Kontrollera att dörren **svänger på gångjärnet** och att du inte kan gå genom den innan den öppnats. Gå sedan rakt genom öppningen. Med **1/2 nycklar** kan du gå vidare till andra området, men inte genom den andra låsta dörren. Gör likadant med nästa nyckel och dörr.
4. Låt en spindel komma nära. Bedöm om förvarning, hoppavstånd och träffyta känns rätt i headsetet. Monstret ska inte dyka upp direkt intill spelaren vid start.
5. Ta skada, plocka upp hälsokitet och kontrollera vänster handled/desktop-HUD. Gå hela vägen ut längs den upplysta vägen. Försök gå mot gårdens ytterkanter: väggarna ska stoppa dig. Läs tid, kills, score och best vid portalen. Starta en ny omgång och kontrollera att rekordet finns kvar.

`tests/phase54_escape_test.gd` testar att nycklarna förblir synliga en stund efter avslöjandet, att hinkarna inte kolliderar med spelaren, dörrsving, **fri fysisk passage genom den första öppna dörren**, utomhusgränser, fallräddning, ammunition, poäng och sparning automatiskt. Det är inte ett bevis för att fysiskt grepp, magasinsinsättning, visuellt läsbar HUD eller prestanda känns bra i Quest. De momenten måste speltestas i headsetet innan kapitlet är helt godkänt.

<div class="checkpoint" data-checklist="escape-level"><h3>Kontrollera kapitel 21</h3><label><input type="checkbox"> Båda 3D-nycklarna hittas under greppbara hinkmodeller och öppnar rätt svängdörr.</label><label><input type="checkbox"> Spindeln går och hoppar, kan skjutas och blir inte synlig direkt vid start.</label><label><input type="checkbox"> Åtta skott, ammunitionsgömmor och magasinets fyra laddningssteg fungerar.</label><label><input type="checkbox"> Hälsokit och vänster handleds HUD fungerar i Quest.</label><label><input type="checkbox"> Utegården har inga öppna fallkanter och utgången visar ett sparat rekord.</label></div>
