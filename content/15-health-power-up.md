<div class="callout"><strong>Den första positiva spelresursen.</strong><p>Den gröna power-upen återställer hälsa och visar direkt att HUD:en reagerar åt båda håll – inte bara när spelaren skadas.</p></div>

## Vad vi bygger {#vad-vi-bygger}

Power-upen är en grön, självlysande kristall som svävar och roterar. När en skadad spelare går in i den:

- återställs två hälsopoäng,
- hälsan begränsas till maxvärdet fem,
- HUD:ens text och stapel uppdateras,
- power-upen försvinner.

Om spelaren redan har full hälsa ligger power-upen kvar för senare användning.

## Lägg till läkning i PlayerHealth {#heal}

Öppna `Blueprints/player_health.gd` och lägg till en metod som kompletterar `take_damage()`:

```gdscript
func heal(amount: int = 1) -> int:
	if amount <= 0 or current_health >= max_health:
		return 0

	var previous_health := current_health
	current_health = mini(current_health + amount, max_health)
	var restored_health := current_health - previous_health
	health_changed.emit(current_health, max_health)
	return restored_health
```

Metoden returnerar den verkliga läkningen. Om spelaren har fyra av fem och begär två blir resultatet ett, inte två. Vid full hälsa returneras noll.

Samma `health_changed`-signal används för skada och läkning. Därför behöver varken desktop-HUD:en eller handledspanelen någon särskild power-up-kod.

## Skapa power-up-scenen {#power-up-scen}

Skapa `Blueprints/health_power_up.tscn`:

```text
HealthPowerUp (Area3D)
├── Crystal (MeshInstance3D)
├── Ring (MeshInstance3D)
└── CollisionShape3D
```

Sätt rotens `Collision Layer` till `0` och dess `Collision Mask` till spelarens lager, lager 20. Använd en `SphereShape3D` med radien `0.3`.

Kristallen kan byggas med en `PrismMesh` på ungefär `0.3 × 0.48 × 0.3` meter. Ge den ett grönt, oskuggat material med emission. Lägg en halvtransparent grön `TorusMesh` under kristallen för en tydlig silhuett.

## Rotera och låt kristallen sväva {#animation}

Fäst `health_power_up.gd` på `Area3D`-roten. Spara starthöjden i `_ready()` och animera sedan hela power-upen:

```gdscript
func _process(delta: float) -> void:
	_elapsed += delta
	rotate_y(rotation_speed * delta)
	position.y = _start_height + sin(_elapsed * bob_speed) * bob_height
```

Projektet använder rotationshastigheten `1.8`, svävhöjden `0.08` meter och svävhastigheten `2.2`.

## Känn igen båda spelarna {#spelarkontakt}

Anslut `body_entered` och acceptera bara fysikkroppar i gruppen `player_body`. Desktopspelarens `Health` är barn till kroppen. I XR är `PlayerBody` barn till `XROrigin3D`, och `Health` ligger bredvid kroppen. Därför kontrolleras båda placeringarna:

```gdscript
func _on_body_entered(body: Node3D) -> void:
	if _is_consumed or not body.is_in_group("player_body"):
		return

	var health := body.get_node_or_null("Health")
	if not health and body.get_parent():
		health = body.get_parent().get_node_or_null("Health")
	if not health or not health.has_method("heal"):
		return

	var restored_health: int = health.call("heal", heal_amount)
	if restored_health <= 0:
		return

	_is_consumed = true
	monitoring = false
	$CollisionShape3D.set_deferred("disabled", true)
	queue_free()
```

Power-upen markeras som förbrukad innan den tas bort. Det hindrar två samtidiga fysikhändelser från att ge dubbel läkning.

## Placera power-upen {#placera}

Instansiera `health_power_up.tscn` i `Main.tscn` med positionen:

```text
X: -2
Y: 0.55
Z: -2.5
```

Den hamnar till vänster framför startpositionen, tydligt skild från monstret till höger.

## Testa i desktopläget {#testa-desktop}

1. Tryck på Godots vanliga Play-knapp.
2. Gå först in i power-upen med full hälsa. Den ska ligga kvar.
3. Låt monstret göra minst en kontaktskada.
4. Gå in i den gröna kristallen.
5. Kontrollera att hälsan ökar med två, men aldrig över fem.
6. Kontrollera att healthbaren uppdateras och att kristallen försvinner.

## Testa i Quest {#testa-quest}

1. Starta spelet med Android/Quest-knappen.
2. Ta kontaktskada från monstret och läs värdet på vänster handled.
3. Gå fysiskt eller med styrspaken till den gröna kristallen.
4. Kontrollera att handledens healthbar ökar direkt.
5. Bekräfta att power-upen försvinner efter användning.

<div class="checkpoint" data-checklist="health-power-up"><h3>Kontrollera hälsopower-upen</h3><label><input type="checkbox"> Kristallen är tydligt grön, roterar och svävar.</label><label><input type="checkbox"> Power-upen ligger kvar vid full hälsa.</label><label><input type="checkbox"> Skadad spelare återfår två hälsopoäng.</label><label><input type="checkbox"> Hälsan går aldrig över fem.</label><label><input type="checkbox"> HUD:en uppdateras omedelbart.</label><label><input type="checkbox"> Power-upen försvinner efter lyckad läkning.</label></div>

## Nästa steg {#nasta-steg}

Nu finns skada, läkning och synlig spelarstatus. Nästa lämpliga steg är flera monster eller en enkel spawner, så att monsterräknaren får en större roll i spelomgången.
