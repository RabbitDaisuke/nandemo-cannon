extends SceneTree
## Real rigid-body contacts: threshold, surface orientation, finite rebound and recoil.
const BodyScript = preload("res://src/throw_body.gd")
const GameScript = preload("res://src/game.gd")
const Search = preload("res://src/item_search.gd")
var checks: Array[String] = []
var failures: Array[String] = []
var catalog: GameCatalog
var fixture: Node2D

func _initialize() -> void:
	_run.call_deferred()

func _expect(condition: bool, description: String) -> void:
	checks.append(description)
	if not condition:
		failures.append(description)
		push_error(description)

func _run() -> void:
	Engine.physics_ticks_per_second = 120
	catalog = GameCatalog.new()
	var stage: Dictionary = catalog.stages.filter(func(s): return int(s.id) == 49)[0]
	var rng = RandomNumberGenerator.new()
	_expect(catalog.build_queue(stage, rng).size() == 15, "the playground provides fifteen throws")
	_expect(str(stage.nameJa) == "ほいくえん" and str(catalog.build_queue(stage, rng)[0]) == "trampoline", "the nursery is named hoikuen and starts by throwing a trampoline")
	var search = Search.new(catalog.items.values())
	for id in ["air-conditioner", "outdoor-ac-unit", "trampoline", "horizontal-bar", "jump-rope", "sliding-window", "sandbox-box"]:
		_expect(catalog.is_catalog_selectable(id) and search.find_items(str(catalog.items[id].nameJa)).any(func(item): return item.id == id), id + " is selectable and searchable by its displayed kana name")
	var game = GameScript.new()
	root.add_child(game)
	await process_frame
	game.load_stage(catalog.stages.find(stage))
	await physics_frame
	var placed = game.actors.filter(func(actor): return actor.item_id == "trampoline")
	_expect(placed.size() == 1 and not placed[0].freeze and not placed[0].can_score, "the trampoline starts as an unfrozen physical prop")
	var ray = PhysicsRayQueryParameters2D.create(Vector2(30, 250), Vector2(0, 250), 1)
	_expect(not game.get_world_2d().direct_space_state.intersect_ray(ray).is_empty(), "the indoor left wall has a real terrain collider")
	game.queue_free()
	await process_frame
	var strong = await _trial(400.0, true)
	var capped = await _trial(2000.0, true)
	var weak = await _trial(50.0, true)
	var underside = await _trial(400.0, true, true)
	var floating = await _trial(400.0, false)
	_expect(float(strong.up) > 300.0, "a strong impact rebounds from the upper trampoline surface")
	_expect(float(strong.up) < 400.0, "a passive rebound does not amplify the incoming speed")
	var maximum = float(catalog.items["trampoline"].physics.springSurface.maxSpeed)
	_expect(float(capped.up) <= maximum + 1.0 and float(capped.up) >= maximum * 0.95, "high-speed impacts reach the configured rebound ceiling without exceeding it")
	_expect(float(weak.up) < 10.0, "an impact below the threshold receives no spring impulse")
	_expect(float(underside.down) < 10.0, "the same deck hit from underneath gives no spring impulse")
	_expect(float(floating.up) > 150.0 and float(floating.recoil) > 10.0, "a free trampoline transfers an equal opposite impulse and the projectile rebounds")
	_expect(float(floating.energy) <= 80000.0 * 1.02, "an unanchored trampoline collision does not create kinetic energy")
	var repeated = await _repeated_bounces()
	await _resting_check()
	await _stacked_resting_check()
	if is_instance_valid(fixture):
		fixture.queue_free()
		await process_frame
	var result = {"suite": "playground", "checks": checks, "failures": failures, "measurements": {"strong": strong, "capped": capped, "weak": weak, "underside": underside, "floating": floating, "repeated": repeated}, "status": "passed" if failures.is_empty() else "failed"}
	FileAccess.open("res://previews/playground-checks.json", FileAccess.WRITE).store_string(JSON.stringify(result, "\t") + "\n")
	print(JSON.stringify(result))
	quit(0 if failures.is_empty() else 1)

func _reset() -> void:
	if is_instance_valid(fixture):
		fixture.queue_free()
		await process_frame
	fixture = Node2D.new()
	root.add_child(fixture)
	await physics_frame

func _trampoline(fixed: bool, point: Vector2 = Vector2(400, 300)) -> ThrowBody:
	var actor = BodyScript.new()
	actor.configure(catalog.items["trampoline"], fixture)
	actor.position = point
	actor.gravity_scale = 0.0
	actor.freeze = fixed
	fixture.add_child(actor)
	return actor

func _ball(point: Vector2, velocity: Vector2) -> ThrowBody:
	var actor = BodyScript.new()
	var record: Dictionary = catalog.items["bowling-ball"].duplicate(true)
	record.merge({"id": "probe", "mass": 1.0, "worldScale": 1.0, "pivotSource": [0, 0], "fixtures": [{"circle": [0, 0, 8]}], "physics": {"friction": 0.0, "restitution": 0.0}}, true)
	actor.configure(record, fixture)
	actor.position = point
	actor.gravity_scale = 0.0
	actor.linear_velocity = velocity
	fixture.add_child(actor)
	return actor

func _trial(speed: float, fixed: bool, underside: bool = false) -> Dictionary:
	await _reset()
	var pad = _trampoline(fixed)
	var upper = pad.to_global(Vector2(0, -26) * pad._source_scale).y
	var lower = pad.position.y
	var point = Vector2(400, lower + 12 if underside else upper - 12)
	var ball = _ball(point, Vector2(0, -speed if underside else speed))
	# Fixture 0 is the deck; the source can be reused without hardcoding an item ID.
	_expect(pad.spring_launch_speed(0, Vector2.UP, 100.0) == 0.0 and pad.spring_launch_speed(0, Vector2.UP, 10000.0) == float(pad.spec.springSurface.maxSpeed), "spring threshold and maximum are read from the physical surface data")
	_expect(pad.spring_launch_speed(0, Vector2.RIGHT, 400.0) == 0.0 and pad.spring_launch_speed(1, Vector2.UP, 400.0) == 0.0, "side contacts and legs do not become spring surfaces")
	var up = 0.0
	var down = 0.0
	var recoil = 0.0
	var energy = 0.0
	for tick in range(100):
		await physics_frame
		up = maxf(up, -ball.linear_velocity.y)
		down = maxf(down, ball.linear_velocity.y) if underside else down
		recoil = maxf(recoil, pad.linear_velocity.y)
		energy = maxf(energy, _kinetic_energy(ball) + _kinetic_energy(pad))
	return {"up": up, "down": down, "recoil": recoil, "energy": energy}

func _kinetic_energy(body: ThrowBody) -> float:
	if body.freeze:
		return 0.0
	var state = PhysicsServer2D.body_get_direct_state(body.get_rid())
	var spin = 0.5 * body.angular_velocity * body.angular_velocity / state.inverse_inertia if state != null and state.inverse_inertia > 0.0 else 0.0
	return 0.5 * body.mass * body.linear_velocity.length_squared() + spin

func _repeated_bounces() -> Array[float]:
	await _reset()
	var pad = _trampoline(true)
	var upper = pad.to_global(Vector2(0, -26) * pad._source_scale).y
	var ball = _ball(Vector2(400, upper - 12), Vector2(0, 400))
	ball.gravity_scale = 1.0
	var rebounds: Array[float] = []
	var previous_y = ball.linear_velocity.y
	for tick in range(1000):
		await physics_frame
		var current_y = ball.linear_velocity.y
		if previous_y > 20.0 and current_y < -100.0:
			rebounds.append(-current_y)
		previous_y = current_y
	var decreasing = rebounds.size() >= 3
	for i in range(1, rebounds.size()):
		decreasing = decreasing and rebounds[i] < rebounds[i - 1] + 2.0
	_expect(decreasing, "successive real rebounds lose speed instead of feeding energy into the body")
	_expect(absf(ball.linear_velocity.y) < 30.0, "the repeated bounce sequence eventually settles")
	return rebounds

func _resting_check() -> void:
	await _reset()
	var pad = _trampoline(true)
	var upper = pad.to_global(Vector2(0, -26) * pad._source_scale).y
	var ball = _ball(Vector2(400, upper - 8.1), Vector2.ZERO)
	ball.gravity_scale = 1.0
	var up = 0.0
	for tick in range(240):
		await physics_frame
		up = maxf(up, -ball.linear_velocity.y)
	_expect(up < 30.0 and absf(ball.position.y - (upper - 8.0)) < 4.0, "resting weight does not repeatedly trigger the spring or create jitter launches")

func _stacked_resting_check() -> void:
	await _reset()
	var base = _trampoline(true)
	var upper = base.to_global(Vector2(0, -26) * base._source_scale).y
	# Register the second CCD body at its actual start, not overlapping the
	# first and then teleported away before the first physics step.
	var top = _trampoline(false, Vector2(400, upper - (100.0 - 64.0) * base._source_scale - 0.1))
	top.gravity_scale = 1.0
	var speed = 0.0
	var initial_y = top.position.y
	var highest_y = top.position.y
	var highest_spin = 0.0
	for tick in range(480):
		await physics_frame
		speed = maxf(speed, top.linear_velocity.length())
		highest_y = minf(highest_y, top.position.y)
		highest_spin = maxf(highest_spin, absf(top.angular_velocity))
	print("Stacked trampoline diagnostic: ", {"maxSpeed": speed, "finalSpeed": top.linear_velocity.length(), "initialY": initial_y, "highestY": highest_y, "finalPosition": top.position, "maxSpin": highest_spin, "angle": top.rotation})
	_expect(speed < 50.0 and top.linear_velocity.length() < 10.0, "two resting trampoline bodies cannot act as a self-powered spring motor")
