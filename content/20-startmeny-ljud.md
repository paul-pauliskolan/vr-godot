<div class="callout"><strong>Starta när du är redo.</strong><p>Spelet visar nu en startmeny innan första monstret eller power-upen skapas. Välj ljud och börja sedan omgången. Skottet kommer från en riktig inspelning; musiken är en lågmäld skräck-/sci-fi-loop.</p></div>

## Vad som händer före Start {#fore-start}

I `main.gd` sätts `GameState.is_game_started` till `false` när scenen öppnas. Spawn-timrarna stoppas och deras schemalagda första spawn hoppas över. Desktopspelaren kan inte röra sig och muspekaren är fri för menyn. I Quest stängs rörelse, grepp och spelarens fotsteg av, men handkontrollernas knappsignaler är fortfarande aktiva så att menyn kan användas. Pistolen, monster-spawnern och power-up-spawnern kontrollerar starttillståndet innan de gör något.

När Start väljs tas menyn bort, spawners skapar sina första objekt och timrarna börjar. Den engelska kontrollguiden från kapitel 19 visas **efter** Start. Vid game over fungerar omstart som tidigare och den nya omgången kommer tillbaka till startmenyn.

| Val | Desktop | Quest 3 |
| --- | --- | --- |
| Starta omgången | Klicka **Start game** | Tryck höger **B** |
| SFX på/av | Kryssrutan **SFX** | Tryck vänster **X** |
| Music på/av | Kryssrutan **Music** | Tryck vänster **Y** |

Både SFX och Music är **ON** vid första starten. Valen används även när omgången spelas om. De sparas inte mellan separata appstarter. Menyns texter är på engelska i både desktop och Quest.

## Två ljudkanaler {#ljudkanaler}

`GameState` skapar ljudbussarna `SFX` och `Music` när spelet startar. Skott, fotsteg och hopp skickas till `SFX`. Bakgrundsspåret skickas till `Music`. Valen i startmenyn styr bussarnas mute-läge, så alla ljud i respektive kategori lyder samma inställning.

Musiken spelas som ett icke-rumsligt spår på låg nivå (−24 dB) och startar redan i menyn. Den loopas när filen tar slut. Den ligger avsiktligt långt under skott och spelarrörelser: monstren får fortfarande inte konstanta gång- eller andningsljud som avslöjar deras placering. Om musiken ändå maskerar viktiga ljud i headsetet, sänk `BackgroundMusic.volume_db` ytterligare i `main.gd`.

## Riktigt skott och musik med källor {#ljudkallor}

Det syntetiserade skottet från kapitel 19 har ersatts av ett **inspelat CZ-52-pistolskott**. Projektets `assets/audio/pistol_shot.wav` är det första skottet ur arkivets `sounds/cz.wav`, beskuret och konverterat till mono för en mindre fil. `Weapon` spelar det genom `ShotAudio` vid pistolmynningen. Fotsteg och hopp är fortfarande små genererade effekter.

| Ljud | Upphov och källsida | Licens |
| --- | --- | --- |
| Inspelat pistolskott | Tabasco, [Gunshot Sounds på OpenGameArt](https://opengameart.org/content/gunshot-sounds) | CC0 enligt källsidan |
| Bakgrundsmusik | congusbongus, [Lost in a bad place på OpenGameArt](https://opengameart.org/content/lost-in-a-bad-place-horror-ambience-loop) | CC0 enligt källsidan |

Originalfilerna finns på länkarna ovan. Projektets bearbetade skott och musik finns i `assets/audio/`, där `README.md` också dokumenterar ursprung och bearbetning.

## Prova båda lägena {#testa}

1. Starta på datorn. Kontrollera att båda kryssrutorna är aktiva och att inga monster eller power-ups skapas innan du klickar **Start game**.
2. Stäng av Music. Du ska fortfarande höra skott, steg och hopp efter Start. Starta om, stäng i stället av SFX och kontrollera att bara musiken hörs.
3. Kör Android-bygget i Quest. Läs VR-menyn, växla SFX med vänster X och Music med vänster Y, och tryck höger B för att börja. Bekräfta att samma ljudval fungerar i headsetet och att skottet inte är obehagligt starkt.
4. Kontrollera att kontrollguiden visas efter Start och att monster och power-ups därefter börjar skapas. Om du förlorar, tryck höger B för att gå tillbaka till menyn inför nästa omgång.

Det automatiska testet `tests/phase53_start_audio_test.gd` verifierar desktopmenyn, standardlägena, bussarnas mute-funktion och att spawn väntar på Start. Ljudbalans och Quest-knappar behöver fortfarande provlyssnas i headsetet.

<div class="checkpoint" data-checklist="start-menu-audio"><h3>Kontrollera kapitel 20</h3><label><input type="checkbox"> Spelet väntar på Start innan monster och power-ups skapas.</label><label><input type="checkbox"> SFX och Music är på som standard och kan stängas av var för sig.</label><label><input type="checkbox"> Ett inspelat skott hörs från pistolen.</label><label><input type="checkbox"> Menyn och kontrollguiden fungerar i både desktop och Quest.</label><label><input type="checkbox"> Musik- och skottvolymen har provlyssnats i Quest.</label></div>
