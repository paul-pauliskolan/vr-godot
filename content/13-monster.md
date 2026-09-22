<div class="callout"><strong>Från mål till motståndare.</strong><p>Nu återanvänder vi projektilens skadegränssnitt i en lila kapsel som söker upp spelaren och gör skada vid kontakt.</p></div>

## Vad vi bygger {#vad-vi-bygger}

Det första monstret hålls avsiktligt enkelt. Det använder ingen navigationsyta och försöker inte gå runt hinder. Det går bara långsamt och rakt mot spelarens fysikkropp.

| Del | Ansvar |
| --- | --- |
| `SimpleMonster` | Rörelse, tre träffpoäng och träffrespons. |
| `ContactArea` | Upptäcker när monstret når spelaren. |
| `PlayerHealth` | Lagrar spelarens hälsa och tar emot skada. |
| Projektil | Anropar fortfarande bara `take_damage()`. |

## Skapa spelarens hälsa {#spelarhalsa}

Skapa `Blueprints/player_health.gd`:

```gdscript
class_name PlayerHealth
extends Node

signal health_changed(current_health: int, max_health: int)
signal defeated

@export_range(1, 100, 1) var max_health: int = 5
var current_health: int

func _ready() -> void:
	current_health = max_health
	health_changed.emit(current_health, max_health)

func take_damage(amount: int = 1) -> void:
	if amount <= 0 or current_health <= 0:
		return

	current_health = maxi(current_health - amount, 0)
	health_changed.emit(current_health, max_health)
	print("Spelaren tog %d skada. Hälsa: %d/%d" % [amount, current_health, max_health])

	if current_health == 0:
		defeated.emit()
```

Lägg en vanlig `Node` med namnet `Health` under både `DesktopPlayer` och `XROrigin3D`. Fäst skriptet på båda noderna. Lägg också desktopspelarens `CharacterBody3D` i gruppen `player_body`. XR Tools gör redan detta för `PlayerBody` i XR-scenen.

Genom att använda samma komponent får desktop- och XR-läget samma hälsoregler.

## Skapa monsterscenen {#monsterscen}

Skapa `Blueprints/simple_monster.tscn` med följande struktur:

```text
SimpleMonster (CharacterBody3D)
├── MeshInstance3D
├── CollisionShape3D
├── ContactArea (Area3D)
│   └── CollisionShape3D
├── HitFlashTimer
└── ContactDamageTimer
```

Använd en `CapsuleMesh` och en `CapsuleShape3D` med radien `0.35` och höjden `1.4`. Flytta båda `0.7` meter uppåt så att kapselns nederkant står på marken. Ge meshen ett lila material.

Gör kontaktytan lite större: radie `0.48` och höjd `1.5`. Sätt dess `Collision Layer` till `0` och dess `Collision Mask` till spelarens lager, lager 20. Då reagerar området på spelarens kropp utan att bli ett nytt fysiskt hinder.

Sätt `HitFlashTimer` till `One Shot` med `0.12` sekunder. Sätt `ContactDamageTimer` till `1.0` sekund.

## Gå mot spelaren {#rorelse}

Monstret hämtar spelarkroppen ur gruppen `player_body`. Varje fysikbildruta räknas riktningen på markplanet ut:

```gdscript
func _find_player() -> void:
	_player_body = get_tree().get_first_node_in_group("player_body") as Node3D

func _physics_process(delta: float) -> void:
	if not is_instance_valid(_player_body):
		_find_player()

	var direction := Vector3.ZERO
	if is_instance_valid(_player_body):
		direction = _player_body.global_position - global_position
		direction.y = 0.0
		direction = direction.normalized()

	velocity.x = direction.x * move_speed
	velocity.z = direction.z * move_speed
	if is_on_floor():
		velocity.y = 0.0
	else:
		velocity.y -= _gravity * delta
	move_and_slide()
```

Ett lämpligt första värde för `move_speed` är `0.7`. Det ger spelaren tid att se monstret, greppa pistolen och sikta.

## Återanvänd take_damage {#take-damage}

Monstret erbjuder samma publika metod som målet:

```gdscript
func take_damage(amount: int = 1) -> void:
	if _is_destroyed or amount <= 0:
		return

	current_health = maxi(current_health - amount, 0)
	damaged.emit(current_health, max_health)
	_material.albedo_color = hit_color
	hit_flash_timer.start()

	if current_health == 0:
		_is_destroyed = true
		velocity = Vector3.ZERO
		collision_shape.set_deferred("disabled", true)
		contact_area.set_deferred("monitoring", false)
		contact_damage_timer.stop()
		destroyed.emit()
```

Efter tre projektilträffar stannar monstret, dess kollision och kontaktskada stängs av och det tas bort när den sista röda blinkningen är klar. `bullet.gd` behöver inte ändras.

## Gör kontaktskada {#kontaktskada}

Anslut `ContactArea.body_entered`, `body_exited` och `ContactDamageTimer.timeout`. När en kropp i gruppen `player_body` går in i området gör monstret en skada direkt. Timern begränsar fortsatt skada till en gång per sekund.

```gdscript
func _apply_contact_damage() -> void:
	if not is_instance_valid(_contact_body):
		contact_damage_timer.stop()
		return

	var health := _contact_body.get_node_or_null("Health")
	if not health and _contact_body.get_parent():
		health = _contact_body.get_parent().get_node_or_null("Health")
	if health and health.has_method("take_damage"):
		health.call("take_damage", contact_damage)
```

Den andra sökvägen behövs i XR-läget eftersom `PlayerBody` ligger under `XROrigin3D`, bredvid noden `Health`.

## Placera monstret {#placera}

Dra `Blueprints/simple_monster.tscn` till `Main.tscn`, döp instansen till `SimpleMonster` och använd startpositionen:

```text
X: 2.5
Y: 0.05
Z: -4
```

Monstret börjar då till höger om det stillastående målet och får en tydlig väg mot spelaren.

## Testa i desktopläget {#testa-desktop}

1. Starta projektet utan ett aktivt OpenXR-headset.
2. Kontrollera att den lila kapseln går mot spelaren.
3. Låt kapseln nå fram och kontrollera i Godots **Output** att hälsan minskar.
4. Plocka upp pistolen med höger musknapp och skjut med vänster musknapp.
5. Kontrollera att kapseln blinkar rött vid träff och försvinner efter det tredje skottet.

## Testa i Quest {#testa-quest}

1. Kör projektet på Quest 3.
2. Kontrollera att den lila kapseln följer headsetets spelarkropp på markplanet.
3. Låt monstret nå fram och bekräfta kontaktskadan i Godots **Output** eller Meta Quest Developer Hub.
4. Greppa pistolen, sikta och skjut kapseln tre gånger.
5. Bekräfta röd träffrespons och att monstret försvinner.

<div class="checkpoint" data-checklist="monster"><h3>Kontrollera det första monstret</h3><label><input type="checkbox"> Den lila kapseln rör sig långsamt mot spelaren.</label><label><input type="checkbox"> Kontakt minskar spelarens hälsa högst en gång per sekund.</label><label><input type="checkbox"> Varje projektilträff ger en kort röd blinkning.</label><label><input type="checkbox"> Monstret försvinner efter exakt tre träffar.</label><label><input type="checkbox"> Det stillastående målet fungerar fortfarande.</label><label><input type="checkbox"> Samma beteende har verifierats i Quest 3.</label></div>

## Nästa steg {#nasta-steg}

Nu finns den första kompletta kedjan mellan spelare och motståndare. Nästa fas kan lägga till flera vapentyper utan att ändra monstrets skadegränssnitt.
