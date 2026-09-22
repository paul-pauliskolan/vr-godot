<div class="callout"><strong>Skapa tryck utan orättvisa starter.</strong><p>Monstren kommer nu från säkra punkter nära banans kanter. Power-ups fylls också på, men båda systemen har tydliga maxgränser.</p></div>

## Vad vi bygger {#vad-vi-bygger}

De enskilda monster- och power-up-instanserna tas bort ur `Main.tscn` och ersätts av två fristående spawners:

| Spawner | Start | Intervall | Max samtidigt |
| --- | ---: | ---: | ---: |
| Monster | 2 | 6 sekunder | 4 levande |
| Hälsopower-up | 2 | 10 sekunder | 3 tillgängliga |

Monsterspawnern kräver dessutom minst `3.5` meters avstånd mellan spelarens aktuella position och den valda spawnpunkten.

## Varför använda fasta spawnpunkter? {#fasta-punkter}

Slumpmässiga koordinater kan hamna i ett hinder, utanför golvet eller precis bakom spelaren. I den här första versionen använder vi därför `Marker3D`-noder på kontrollerade platser. Spawnern väljer slumpmässigt bland de punkter som är giltiga just nu.

Det är enklare än navigation och ger ändå variation. Senare kan samma system byta markörer när modulära rum införs.

## Skapa monsterspawnern {#monster-spawner}

Skapa `Blueprints/monster_spawner.tscn`:

```text
MonsterSpawner (Node3D)
├── SpawnPoints (Node3D)
│   ├── NorthWest
│   ├── NorthEast
│   ├── SouthWest
│   ├── SouthEast
│   └── South
└── SpawnTimer
```

Placera markörerna nära golvets kanter:

```text
NorthWest: (-4, 0.05, -4)
NorthEast: ( 4, 0.05, -4)
SouthWest: (-4, 0.05,  4)
SouthEast: ( 4, 0.05,  4)
South:     ( 0, 0.05,  4.3)
```

Lägg spawnerns rotnod i gruppen `monster_spawners` och fäst `monster_spawner.gd`.

## Filtrera bort farliga punkter {#sakerhetsavstand}

Innan ett monster skapas hämtar spawnern spelarens fysikkropp från gruppen `player_body`. Varje markör kontrolleras på markplanet:

```gdscript
if _flat_distance(marker.global_position, player.global_position) < minimum_player_distance:
	continue
if _is_point_occupied(marker.global_position):
	continue
valid_points.append(marker)
```

`_flat_distance()` använder X och Z men ignorerar höjden. Det är den horisontella spelradien som spelar roll. Standardvärdet `3.5` meter gör att inget startmonster dyker upp direkt intill spelaren.

Punkter närmare än en meter från ett redan levande monster väljs också bort. Om ingen punkt är giltig hoppar spawnern över försöket i stället för att skapa ett orättvist monster.

## Begränsa antalet monster {#max-monster}

Spawnern håller referenser till skapade monster och tar bort ogiltiga referenser innan varje försök:

```gdscript
func spawn_monster() -> SimpleMonster:
	_remove_invalid_monsters()
	if _spawned_monsters.size() >= max_alive_monsters:
		return null
```

Två monster skapas med ett uppskjutet anrop efter scenstarten. Det ger `main.gd` tid att skapa rätt spelarkropp innan säkerhetsavståndet räknas ut. Därefter försöker timern skapa ett monster var sjätte sekund tills fyra lever samtidigt.

## Koppla nya monster till räknaren {#koppla-raknare}

Varje lyckad spawn skickar signalen `monster_spawned`. `main.gd` lyssnar på alla noder i gruppen `monster_spawners` och registrerar varje nytt monster i `GameState`:

```gdscript
func _on_monster_spawned(monster: SimpleMonster) -> void:
	game_state.track_monster(monster)
```

Den befintliga texten `MONSTERS KILLED` räknar därför även dynamiskt skapade monster.

## Skapa power-up-spawnern {#power-up-spawner}

`HealthPowerUpSpawner` använder samma grundidé men behöver inget säkerhetsavstånd till spelaren. Den har fem egna markörer spridda över banan:

```text
FrontLeft:  (-2,   0.55, -2.5)
FrontRight: ( 2,   0.55, -2.5)
BackLeft:   (-3.5, 0.55,  2)
BackRight:  ( 3.5, 0.55,  2)
BackCenter: ( 0,   0.55,  4)
```

Två power-ups skapas vid start. Var tionde sekund görs ett nytt försök tills tre finns tillgängliga. En redan upptagen markör filtreras bort, så kristallerna hamnar inte ovanpå varandra.

## Uppdatera huvudscenen {#huvudscen}

Ta bort de gamla enskilda noderna `SimpleMonster` och `HealthPowerUp` ur `Main.tscn`. Instansiera i stället:

```text
MonsterSpawner
HealthPowerUpSpawner
```

Monster- och power-up-scenerna förblir självständiga. Spawnern ansvarar endast för när och var de skapas.

## Testa i desktopläget {#testa-desktop}

1. Tryck på Godots vanliga Play-knapp.
2. Kontrollera att inget monster skapas inom 3,5 meter från startpositionen.
3. Kontrollera att två monster närmar sig från banans kanter.
4. Vänta och kontrollera att högst fyra monster lever samtidigt.
5. Kontrollera att två power-ups finns vid start.
6. Använd en power-up och kontrollera att systemet senare fyller på, men aldrig över tre.
7. Besegra flera monster och kontrollera att HUD-räknaren fortsätter öka.

## Testa i Quest {#testa-quest}

1. Starta med Android/Quest-knappen och stå still de första sekunderna.
2. Bekräfta att inga monster dyker upp precis bredvid eller bakom kroppen.
3. Kontrollera att riktningen till de första monstren känns läsbar och rättvis.
4. Spela tills fyra monster finns och bedöm om tempot är bekvämt.
5. Kontrollera att flera gröna kristaller går att hitta utan att de överlappar.

<div class="checkpoint" data-checklist="spawners"><h3>Kontrollera spawnersystemen</h3><label><input type="checkbox"> Två monster skapas på säkert avstånd vid start.</label><label><input type="checkbox"> Inget monster skapas närmare än 3,5 meter.</label><label><input type="checkbox"> Högst fyra monster lever samtidigt.</label><label><input type="checkbox"> Dynamiska monster räknas i HUD:en.</label><label><input type="checkbox"> Två power-ups finns vid start.</label><label><input type="checkbox"> Högst tre power-ups finns och de överlappar inte.</label></div>

## Nästa steg {#nasta-steg}

Nu finns en enkel, pågående stridsslinga. Nästa rimliga steg är antingen en tydlig förlust och omstart när hälsan når noll, eller flera vapentyper som ger spelaren fler sätt att hantera de växande monstergrupperna.
