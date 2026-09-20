<div class="callout"><strong>Obegränsad ammunition i första versionen.</strong><p>Vi bygger projektilens rörelse och träff först. Magasin, omladdning, rekyl och ljud läggs till först när grundmekaniken är stabil.</p></div>

## Vad vi bygger {#vad-vi-bygger}

Pistolen ska skapa en liten kopparfärgad projektil vid `MuzzlePoint`. Kulan rör sig med `320 m/s`, påverkas av gravitation och överför sin rörelsemängd till ett fysiskt objekt som den träffar.

De tre blå testkuberna är redan `RigidBody3D`. När en kula träffar dem kan de därför flyttas och rotera beroende på träffpunkten.

## Realistiska värden i liten skala {#varden}

| Egenskap | Värde i projektet |
| --- | ---: |
| Projektilens diameter | 9 mm |
| Projektilens längd | 18 mm |
| Projektilens massa | 8 gram |
| Mynninghastighet | 320 m/s |
| Tid mellan skott | 0,12 sekunder |
| Projektilens livstid | 2 sekunder |

Värdena ligger i ett rimligt område för en pistolprojektil. En riktig kula är så snabb att den nästan inte syns på de korta avstånden i testscenen.

Pistolen visar därför en mycket kort orange mynningsflamma när `fire()` anropas. Flamman bekräftar att klicket registrerades utan att projektilens realistiska hastighet behöver sänkas.

## Problemet med mycket snabba objekt {#tunnling}

Vid 60 fysiksteg per sekund hinner en kula i `320 m/s` färdas mer än fem meter mellan två fysikuppdateringar. Om vi bara använder en liten vanlig fysikkropp kan den befinna sig framför kuben i ett steg och bakom kuben i nästa. Motorn ser då aldrig någon kontakt. Detta kallas **tunnling**.

Projektet använder en vanlig spelteknisk hybrid:

```text
synlig projektil
      +
rörelse och gravitation
      +
stråltest över hela sträckan varje fysiksteg
      =
snabb projektil utan missade träffar
```

Många skjutspel använder enbart ett omedelbart stråltest, ofta kallat *hitscan*. Vår lösning behåller i stället en riktig projektilposition och kulbana men använder strålen för säker kollisionskontroll.

## Skapa projektilscenen {#projektilscen}

Skapa `Blueprints/bullet.tscn` med följande struktur:

```text
Bullet (Node3D)
└── MeshInstance3D
```

Använd en `CapsuleMesh` med:

- `Radius`: `0.0045`
- `Height`: `0.018`
- X-rotation: `90°`
- ett kopparfärgat `StandardMaterial3D`

Kapseln roteras så att dess längdriktning följer pistolens negativa Z-axel.

## Projektilens GDScript {#bullet-script}

Skapa `Blueprints/bullet.gd` och fäst skriptet på `Bullet`:

```gdscript
class_name Bullet
extends Node3D

@export var speed: float = 320.0
@export var mass_kg: float = 0.008
@export var gravity_multiplier: float = 1.0
@export var lifetime_seconds: float = 2.0
@export_flags_3d_physics var collision_mask: int = 5

var velocity: Vector3
var shooter: CollisionObject3D

func launch(direction: Vector3, source: CollisionObject3D = null) -> void:
	velocity = direction.normalized() * speed
	shooter = source

func _physics_process(delta: float) -> void:
	var start_position := global_position
	var gravity: float = ProjectSettings.get_setting(
		"physics/3d/default_gravity", 9.8
	)
	velocity += Vector3.DOWN * gravity * gravity_multiplier * delta
	var end_position := start_position + velocity * delta

	var query := PhysicsRayQueryParameters3D.create(
		start_position, end_position, collision_mask
	)
	query.collide_with_areas = false
	query.collide_with_bodies = true
	if is_instance_valid(shooter):
		query.exclude = [shooter.get_rid()]

	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	if hit:
		global_position = hit.position
		_apply_hit(hit)
		return

	global_position = end_position
	lifetime_seconds -= delta
	if lifetime_seconds <= 0.0:
		queue_free()

func _apply_hit(hit: Dictionary) -> void:
	var body := hit.get("collider") as RigidBody3D
	if body:
		var impulse := velocity.normalized() * mass_kg * velocity.length()
		var contact_offset := Vector3(hit.position) - body.global_position
		body.apply_impulse(impulse, contact_offset)

	queue_free()
```

Kollisionsmasken `5` betyder att strålen testar lager 1 och 3. Det omfattar testmiljön och de greppbara kuberna i detta projekt. Pistolen undantas uttryckligen så att kulan inte träffar vapnet som skapade den.

## Varför kuben flyttar sig {#impuls}

Rörelsemängden beräknas med:

```text
impuls = massa × hastighet
impuls = 0,008 kg × 320 m/s
impuls = 2,56 kg·m/s
```

`apply_impulse()` använder både impulsens riktning och träffpunktens avstånd från kubens centrum. En träff mitt på kuben flyttar den huvudsakligen bakåt. En träff nära kanten kan också få den att rotera.

## Skapa vapenlogiken {#weapon-script}

Skapa `Blueprints/weapon.gd`:

```gdscript
class_name Weapon
extends Node

const BULLET_SCENE := preload("res://Blueprints/bullet.tscn")

@export var seconds_between_shots: float = 0.12

@onready var pistol: XRToolsPickable = get_parent() as XRToolsPickable
@onready var muzzle_point: Marker3D = pistol.get_node("MuzzlePoint")
@onready var muzzle_flash: MeshInstance3D = pistol.get_node("MuzzlePoint/MuzzleFlash")
@onready var cooldown: Timer = $Cooldown

func _ready() -> void:
	pistol.action_pressed.connect(_on_action_pressed)

func fire() -> void:
	if not cooldown.is_stopped():
		return

	var bullet := BULLET_SCENE.instantiate() as Bullet
	get_tree().current_scene.add_child(bullet)
	bullet.global_transform = muzzle_point.global_transform
	bullet.launch(-muzzle_point.global_basis.z, pistol)
	cooldown.start(seconds_between_shots)
	_show_muzzle_flash()

func _show_muzzle_flash() -> void:
	muzzle_flash.visible = true
	await get_tree().create_timer(0.04).timeout
	if is_instance_valid(muzzle_flash):
		muzzle_flash.visible = false

func _on_action_pressed(_pickable: XRToolsPickable) -> void:
	fire()
```

Lägg till följande under pistolens rotnod:

```text
Pistol
└── Weapon (Node, weapon.gd)
    └── Cooldown (Timer)
```

Sätt `Cooldown` till `One Shot` och `Wait Time` till `0.12`. Timern hindrar ett enda knapptryck från att skapa orimligt många projektiler, men någon ammunition förbrukas inte.

Lägg också en liten orange, normalt dold `MeshInstance3D` med namnet `MuzzleFlash` under `MuzzlePoint`. Den visas i `0,04` sekunder vid varje godkänt skott.

## Desktop och XR använder samma fire {#gemensam-fire}

XR Tools skickar `action_pressed` när avtryckaren används medan pistolen hålls. Signalen anropar `Weapon.fire()`.

Desktopspelaren letar efter barnnoden `Weapon` på det hållna föremålet. Vänster musknapp anropar samma metod:

```gdscript
func _fire_held_object() -> void:
	var weapon := _held_object.get_node_or_null("Weapon")
	if weapon and weapon.has_method("fire"):
		weapon.fire()
```

Detta är ett exempel på hur vi undviker dubbelkodning. Inmatningen är olika, men vapnet och projektilen är gemensamma.

## Testa med de blå kuberna {#testa}

1. Starta projektet utan headset.
2. Rikta siktet mot pistolen och högerklicka för att plocka upp den.
3. Rikta pistolen mot en av de tre blå kuberna.
4. Vänsterklicka för att skjuta.
5. Kontrollera att kuben flyttas i skottriktningen.
6. Träffa kuben nära en kant och observera om den också roterar.

Kulan är mycket liten och snabb. Det är normalt att du tydligare ser kubens reaktion än själva kulan.

<div class="checkpoint" data-checklist="projektiler"><h3>Kontrollera skjutmekaniken</h3><label><input type="checkbox"> Pistolen kan plockas upp med högerklick.</label><label><input type="checkbox"> Vänsterklick skapar en projektil vid MuzzlePoint.</label><label><input type="checkbox"> Projektilen färdas i pistolens riktning.</label><label><input type="checkbox"> En blå kub flyttas när den träffas.</label><label><input type="checkbox"> En träff utanför centrum kan få kuben att rotera.</label><label><input type="checkbox"> Flera skott kan avfyras utan omladdning.</label><label><input type="checkbox"> XR-avtryckaren har verifierats i headsetet.</label></div>

## Nästa steg {#nasta-steg}

De blå kuberna visar att projektilens fysik fungerar. Nästa steg är ett särskilt mål med ett litet skript som upptäcker träffen och försvinner. Projektilsystemet ska inte behöva skrivas om för detta.
