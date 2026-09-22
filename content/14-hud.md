<div class="callout"><strong>Gör spelreglerna synliga.</strong><p>Spelaren ska inte behöva läsa Godots Output för att förstå skada eller framsteg. Nu bygger vi en healthbar och en räknare för besegrade monster.</p></div>

## Vad vi bygger {#vad-vi-bygger}

HUD-systemet består av gemensam speldata och två presentationer:

| Del | Ansvar |
| --- | --- |
| `GameState` | Lagrar aktuell hälsa och antal besegrade monster. |
| Desktop-HUD | Visar informationen i skärmens övre vänstra hörn. |
| XR-HUD | Visar samma information på vänster handled. |

Spelreglerna är gemensamma. Endast presentationen skiljer sig eftersom en platt skärm och ett XR-headset har olika ergonomiska behov.

## Skapa gemensam GameState {#game-state}

Skapa `Blueprints/game_state.gd`:

```gdscript
extends Node

signal health_changed(current_health: int, max_health: int)
signal monsters_killed_changed(monsters_killed: int)

var current_health: int = 1
var max_health: int = 1
var monsters_killed: int = 0

func reset_run() -> void:
	monsters_killed = 0
	monsters_killed_changed.emit(monsters_killed)

func track_player_health(player_health: PlayerHealth) -> void:
	var callback := Callable(self, "_on_player_health_changed")
	if not player_health.health_changed.is_connected(callback):
		player_health.health_changed.connect(callback)
	_on_player_health_changed(player_health.current_health, player_health.max_health)

func track_monster(monster: SimpleMonster) -> void:
	var callback := Callable(self, "_on_monster_destroyed")
	if not monster.destroyed.is_connected(callback):
		monster.destroyed.connect(callback)
```

Lägg skriptet under **Project → Project Settings → Globals → Autoload** med namnet `GameState`. I projektfilen motsvarar det:

```ini
[autoload]

GameState="*res://Blueprints/game_state.gd"
```

När spelarhälsan ändras kopierar `GameState` värdena och skickar sin egen signal. När ett bevakat monster skickar `destroyed` höjs `monsters_killed` med ett.

## Koppla spelaren och monstret {#koppla-speldata}

Lägg `SimpleMonster` i gruppen `monsters`. När `main.gd` startar återställer det spelomgången, kopplar alla monster och kopplar rätt spelares `Health`-nod.

```gdscript
func _track_monsters() -> void:
	for monster in get_tree().get_nodes_in_group("monsters"):
		if monster is SimpleMonster:
			game_state.track_monster(monster)
```

Det ger ett tydligt signalflöde:

```text
PlayerHealth.health_changed ──> GameState ──> healthbar och text
SimpleMonster.destroyed ──────> GameState ──> MONSTERS KILLED
```

## Bygg desktop-HUD:en {#desktop-hud}

Skapa `Blueprints/hud_panel.tscn` med en `PanelContainer` som rot. Lägg till en `VBoxContainer` med:

```text
HUDPanel (PanelContainer)
└── Rows (VBoxContainer)
    ├── HealthLabel
    ├── HealthBar (ProgressBar)
    └── KillsLabel
```

Använd starttexterna `HEALTH: 5 / 5` och `MONSTERS KILLED: 0`. Sätt `HealthBar.max_value` och `value` till `5` och dölj standardprocenten. En mörk panel, grön stapel och gul monsterräknare gör informationen lätt att skilja åt.

Fäst `hud_panel.gd` och anslut till båda signalerna från `GameState`:

```gdscript
func _on_health_changed(current_health: int, max_health: int) -> void:
	health_bar.max_value = max_health
	health_bar.value = current_health
	health_label.text = "HEALTH: %d / %d" % [current_health, max_health]

func _on_monsters_killed_changed(monsters_killed: int) -> void:
	kills_label.text = "MONSTERS KILLED: %d" % monsters_killed
```

Instansiera panelen under desktopspelarens befintliga `CanvasLayer` och placera den i övre vänstra hörnet, under kontrollinstruktionerna.

## Bygg en XR-anpassad handledspanel {#xr-hud}

En skärmfast HUD framför ögonen kan bli störande i VR. Skapa därför `Blueprints/xr_wrist_hud.tscn` som en liten 3D-panel med två `Label3D` och två tunna `QuadMesh` för healthbarens bakgrund och fyllning.

```text
XRWristHUD (Node3D)
├── Panel
├── HealthLabel
├── HealthBackground
├── HealthFill
└── KillsLabel
```

Instansiera scenen under `Controller_left` i `xr_player.tscn`. En lämplig första lokal position är `(0, 0.08, 0.06)` och rotationen är `-90` grader runt X-axeln. Då fungerar panelen ungefär som en klocka: lyft och vrid vänster hand mot ansiktet för att läsa den.

Den gröna stapeln skalas efter andelen återstående hälsa och flyttas samtidigt så att dess vänsterkant står still:

```gdscript
var ratio := clampf(float(current_health) / float(maxi(max_health, 1)), 0.0, 1.0)
health_fill.scale.x = ratio
health_fill.position.x = -HEALTH_BAR_WIDTH * (1.0 - ratio) * 0.5
```

## Testa i desktopläget {#testa-desktop}

1. Tryck på Godots vanliga Play-knapp.
2. Kontrollera att HUD:en visar `HEALTH: 5 / 5` och `MONSTERS KILLED: 0`.
3. Låt monstret nå spelaren och kontrollera att texten och den gröna stapeln minskar.
4. Skjut monstret tre gånger och kontrollera att räknaren blir 1.

## Testa i Quest {#testa-quest}

1. Starta spelet med Android/Quest-knappen.
2. Lyft vänster handled och vrid panelen mot ansiktet.
3. Kontrollera att text och healthbar är skarpa och läsbara.
4. Kontrollera att panelen inte stör greppet eller skymmer världen när handen hålls normalt.
5. Ta kontaktskada och besegra monstret. Båda värdena ska uppdateras direkt.

Handledens position och vinkel kan behöva finjusteras efter det verkliga headsettestet. Det är en presentationsjustering; speldata och signalerna påverkas inte.

<div class="checkpoint" data-checklist="hud"><h3>Kontrollera spelarstatusen</h3><label><input type="checkbox"> Desktop-HUD:en visar fem hälsopoäng vid start.</label><label><input type="checkbox"> Kontaktskada minskar text och healthbar.</label><label><input type="checkbox"> Ett besegrat monster höjer räknaren till 1.</label><label><input type="checkbox"> XR-panelen sitter på vänster handled.</label><label><input type="checkbox"> Texten är läsbar i Quest 3.</label><label><input type="checkbox"> Panelen stör inte grepp eller rörelse.</label></div>

## Nästa steg {#nasta-steg}

Nu kan spelet visa förändringar i hälsa. Nästa steg blir därför en grön hälsopower-up som återställer två poäng och omedelbart uppdaterar healthbaren.
