<div class="callout"><strong>Tre träffar till första förstörbara målet.</strong><p>Nu kopplar vi projektilen till speldata. Vapnet ska fortfarande inte behöva veta vad det träffar.</p></div>

## Vad vi bygger {#vad-vi-bygger}

Vi skapar ett stillastående turkost mål med tre träffpoäng. Vid varje träff blinkar målet rött. Efter den tredje träffen försvinner det.

Lösningen delas upp så här:

| Del | Ansvar |
| --- | --- |
| Vapen | Skapar projektilen. |
| Projektil | Upptäcker träffen och skickar skada. |
| Mål | Håller reda på hälsa och visar träffrespons. |

Vapnet känner alltså inte till målet. Det gör att samma projektil senare kan skada ett monster, en låda eller något annat förstörbart objekt.

## Ge projektilen ett skadevärde {#projektilskada}

Öppna `Blueprints/bullet.gd` och lägg till ett exporterat skadevärde tillsammans med de övriga inställningarna:

```gdscript
@export var damage: int = 1
```

Ändra sedan början av `_apply_hit()`:

```gdscript
func _apply_hit(hit: Dictionary) -> void:
	var collider := hit.get("collider") as Node
	if collider and collider.has_method("take_damage"):
		collider.call("take_damage", damage)

	var body := hit.get("collider") as RigidBody3D
	if body:
		var impulse := velocity.normalized() * mass_kg * velocity.length()
		var contact_offset := Vector3(hit.position) - body.global_position
		body.apply_impulse(impulse, contact_offset)

	queue_free()
```

`has_method()` är ett litet kontrakt: om objektet erbjuder `take_damage()` kan projektilen skada det. De blå fysikkuberna saknar metoden och får därför fortfarande bara en fysisk impuls.

## Skapa målscenen {#mal-scen}

Skapa en ny scen med denna struktur och spara den som `Blueprints/target.tscn`:

```text
Target (StaticBody3D)
├── MeshInstance3D
├── CollisionShape3D
└── HitFlashTimer
```

Använd en enkel `BoxMesh` och motsvarande `BoxShape3D` med storleken:

```text
X: 0.9
Y: 1.2
Z: 0.2
```

Ge meshen ett turkost `StandardMaterial3D`. Sätt `HitFlashTimer` till `One Shot` och `Wait Time` till `0.12` sekunder.

## Lägg till målets skript {#target-script}

Skapa `Blueprints/target.gd` och fäst det på scenens rotnod:

```gdscript
class_name Target
extends StaticBody3D

signal damaged(current_health: int, max_health: int)
signal destroyed

@export_range(1, 100, 1) var max_health: int = 3
@export var normal_color := Color(0.15, 0.75, 0.65, 1.0)
@export var hit_color := Color(1.0, 0.2, 0.12, 1.0)

@onready var mesh_instance: MeshInstance3D = $MeshInstance3D
@onready var collision_shape: CollisionShape3D = $CollisionShape3D
@onready var hit_flash_timer: Timer = $HitFlashTimer

var current_health: int
var _material: StandardMaterial3D
var _is_destroyed := false

func _ready() -> void:
	current_health = max_health

	var source_material := mesh_instance.material_override as StandardMaterial3D
	_material = source_material.duplicate() as StandardMaterial3D
	mesh_instance.material_override = _material
	_material.albedo_color = normal_color

	hit_flash_timer.timeout.connect(_on_hit_flash_timer_timeout)

func take_damage(amount: int = 1) -> void:
	if _is_destroyed or amount <= 0:
		return

	current_health = maxi(current_health - amount, 0)
	damaged.emit(current_health, max_health)
	_material.albedo_color = hit_color
	hit_flash_timer.start()

	if current_health == 0:
		_is_destroyed = true
		collision_shape.set_deferred("disabled", true)
		destroyed.emit()

func _on_hit_flash_timer_timeout() -> void:
	if _is_destroyed:
		queue_free()
	else:
		_material.albedo_color = normal_color
```

Materialet dupliceras när målet startar. Därmed kan varje framtida mål blinka oberoende utan att alla instanser delar samma färgändring.

Kollisionsformen stängs av när hälsan når noll. Timern får ändå löpa klart så att den sista röda träffreaktionen syns innan `queue_free()` tar bort målet.

## Signaler för nästa spelsteg {#signaler}

Målet skickar två signaler:

- `damaged` efter varje giltig träff
- `destroyed` när hälsan når noll

Inget lyssnar på signalerna ännu. Senare kan en poängräknare, en ljudeffekt eller en dörr reagera utan att den logiken behöver byggas in i målet.

## Placera målet i huvudscenen {#placera}

Öppna `Main.tscn`, dra in `Blueprints/target.tscn` och döp instansen till `Target`.

Använd positionen:

```text
X: 0
Y: 1.4
Z: -4
```

Målet hamnar bakom det låga hindret men tillräckligt högt för att kunna beskjutas från spelarens startposition.

## Testa i desktopläget {#testa-desktop}

1. Starta projektet utan ett aktivt OpenXR-headset.
2. Rikta siktet mot pistolen och högerklicka för att plocka upp den.
3. Sikta på det turkosa målet bakom hindret.
4. Skjut med vänster musknapp.
5. Kontrollera att målet blinkar rött och återgår till turkost.
6. Skjut totalt tre gånger och kontrollera att målet försvinner.

Om kulan påverkar de blå kuberna men inte målet, kontrollera att skriptet sitter på samma `StaticBody3D` som projektilens stråltest träffar och att metoden heter exakt `take_damage`.

## Testa i Quest {#testa-quest}

Exportera och starta samma scen i headsetet. Plocka upp pistolen med en hand, använd avtryckaren och bekräfta att tre träffar förstör målet. Skadekoden är gemensam för desktop och XR; headsettestet kontrollerar främst grepp, siktriktning och avtryckare.

<div class="checkpoint" data-checklist="mal"><h3>Kontrollera målsystemet</h3><label><input type="checkbox"> Målet syns bakom hindret.</label><label><input type="checkbox"> Första och andra träffen ger en kort röd blinkning.</label><label><input type="checkbox"> Målet försvinner efter den tredje träffen.</label><label><input type="checkbox"> De blå kuberna kan fortfarande knuffas av projektiler.</label><label><input type="checkbox"> Vapenkoden innehåller ingen särskild referens till Target.</label><label><input type="checkbox"> Samma beteende har verifierats i headsetet.</label></div>

## Nästa steg {#nasta-steg}

Målet ger oss nu en återanvändbar gräns mellan projektil och hälsa. Nästa större steg är ett enkelt monster som rör sig långsamt mot spelaren och använder samma `take_damage()`-kontrakt.
