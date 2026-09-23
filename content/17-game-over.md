<div class="callout"><strong>Ge spelomgången ett slut.</strong><p>När spelarens hälsa når noll stannar striden. Resultatet visas, och spelaren kan starta en ny omgång utan att lämna spelet.</p></div>

## Vad vi bygger {#vad-vi-bygger}

Kapitel 14 gav spelaren hälsa och kapitel 16 fyller på monster. Nu kopplar vi ihop dessa system till en enkel spel-loop:

1. `PlayerHealth` skickar signalen `defeated` vid noll hälsa.
2. `main.gd` stoppar rörelse, monster och spawners.
3. En Game over-panel visar antal besegrade monster.
4. R på datorn eller B på höger Quest-kontroll laddar om huvudscenen.

Det här steget lägger inte till någon vinst eller poängtabell ännu. Vi bygger först ett tydligt och testbart förlustläge.

## Fånga spelarens förlust {#fanga-forlust}

I `PlayerHealth` finns redan signalen `defeated`. När `main.gd` skapar spelaren kopplar den signalen till en metod:

```gdscript
var player_health := player.get_node_or_null("Health") as PlayerHealth
if player_health:
	game_state.track_player_health(player_health)
	player_health.defeated.connect(_on_player_defeated)
```

`_on_player_defeated()` sätter en flagga, stoppar spelandet och väljer rätt presentation för desktop eller XR. Flaggan hindrar att samma förlust hanteras två gånger:

```gdscript
func _on_player_defeated() -> void:
	if _game_over:
		return
	_game_over = true
	game_state.is_game_over = true
	_stop_gameplay()
	if _player is DesktopPlayer:
		_show_desktop_game_over()
	else:
		_show_xr_game_over()
```

## Stoppa striden {#stoppa-striden}

`_stop_gameplay()` stoppar båda spawn-timrarna och de befintliga monstrens rörelse och kontaktskada. Aktiva kulor tas bort och vapnet kan inte skjuta fler skott. Hälsopower-ups kan inte återuppliva en spelare med noll hälsa. På datorn stoppas spelarens rörelse och muspekaren släpps. I Quest stängs XR Tools-funktionerna för rörelse och grepp av, medan kameran och höger kontroll fortsätter att fungera. Därför kan spelaren fortfarande se panelen och trycka B för omstart.

Vi pausar inte hela scen-trädet: då skulle även kamerans och kontrollens uppdatering kunna påverkas i headsetet.

## Visa resultatet {#visa-resultatet}

Desktopläget skapar en centrerad `CanvasLayer` med texten **GAME OVER**, antal besegrade monster som **MONSTERS KILLED** och knappen **Play again (R)**. Quest använder i stället en enkel 3D-panel 1,2 meter framför `XRCamera3D`, med samma resultat och instruktionen **Press B to play again**. Panelen är fäst vid kameran så att den är synlig oavsett var spelaren tittar när hälsan tar slut.

Resultatet hämtas från `GameState.monsters_killed` innan räknaren nollställs.

## Starta en ny omgång {#starta-om}

Båda kontrollerna anropar samma metod:

```gdscript
func _restart_run() -> void:
	get_tree().reload_current_scene()
```

När huvudscenen laddas om skapas en ny spelare med full hälsa. `GameState.reset_run()` nollställer monsterräknaren och förlustflaggan, och spawnernas timrar startar på nytt.

På desktop kan spelaren klicka knappen eller trycka R. På Quest används `by_button` på höger `XRController3D`, vilket motsvarar B på Quest-kontrollen.

## Testa i desktopläget {#testa-desktop}

1. Starta med Godots vanliga Play-knapp och låt monstren sänka hälsan till noll.
2. Kontrollera att Game over-panelen visar rätt antal besegrade monster.
3. Kontrollera att monster och spawners stannar och att muspekaren syns.
4. Klicka **Play again (R)** eller tryck R.
5. Kontrollera att hälsan är full, räknaren är noll och nya monster börjar dyka upp.

Det automatiska testet `tests/phase48_game_over_test.gd` kontrollerar förlust, stopp och omstart i desktopläget.

## Testa i Quest {#testa-quest}

Quest-visningen behöver också provas i headsetet:

1. Låt hälsan gå till noll och kontrollera att panelen är läsbar och bekvämt placerad.
2. Kontrollera att du kan titta omkring utan att spelet fortsätter röra spelaren.
3. Tryck B på höger kontroll och kontrollera att en ny omgång startar med full hälsa.

<div class="checkpoint" data-checklist="game-over"><h3>Kontrollera förlustläget</h3><label><input type="checkbox"> Förlust visas vid noll hälsa.</label><label><input type="checkbox"> Monster och spawners stannar.</label><label><input type="checkbox"> Antalet besegrade monster visas.</label><label><input type="checkbox"> Omstart återställer hälsa och räknare.</label><label><input type="checkbox"> Panel och B-knapp fungerar i Quest.</label></div>

## Nästa steg {#nasta-steg}

Nu går det att spela en hel omgång. I [kapitel 18](18-environment.html) bygger vi en större, sliten stadsmiljö och ett trovärdigare arbetsbord. Därefter kan vi lägga till en andra vapentyp.
