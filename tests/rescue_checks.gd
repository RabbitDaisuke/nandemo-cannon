extends SceneTree
## Ordered stage navigation, forced random slots and pressure-only explosions.
## Blast checks use the real Godot bodies, liquid sampling and terrain raycasts.

const BodyScript = preload("res://src/throw_body.gd")
const HazardsScript = preload("res://src/hazard_system.gd")
const LiquidScript = preload("res://src/liquid_field.gd")
var checks: Array[String] = []
var failures: Array[String] = []
var catalog: GameCatalog
var fixture_world: BlastWorld

class BlastWorld:
	extends Node2D
	var gravity_value: float = 0.0
	var shots_fired: int = 1
	var actors: Array[ThrowBody] = []
	var rng = RandomNumberGenerator.new()
	var liquid: LiquidField
	var hazards: HazardSystem
	var destroyed: Array[Dictionary] = []
	var effects: Array[String] = []
	func surface_friction_at(point: Vector2) -> float:
		return liquid.ice_friction(point)
	func cast_solid(start: Vector2, end: Vector2, exclude: Array[RID] = [], mask: int = 3) -> Dictionary:
		if start.is_equal_approx(end):
			return {}
		var query = PhysicsRayQueryParameters2D.create(start, end, mask, exclude)
		query.hit_from_inside = true
		return get_world_2d().direct_space_state.intersect_ray(query)
	func point_in_solid(point: Vector2) -> bool:
		var query = PhysicsPointQueryParameters2D.new()
		query.position = point
		query.collision_mask = 3
		return not get_world_2d().direct_space_state.intersect_point(query, 1).is_empty()
	func destroy_actor(actor: ThrowBody, reason: String) -> void:
		if not is_instance_valid(actor) or not actor.alive:
			return
		actor.alive = false
		actor.collision_layer = 0
		actor.collision_mask = 0
		destroyed.append({"id": actor.item_id, "reason": reason})
		actors.erase(actor)
		actor.queue_free()
	func on_actor_impact(actor: ThrowBody, point: Vector2, speed: float, energy: float) -> void:
		hazards.impact(actor, point, speed, energy)
	func spawn_effect(kind: String, _point: Vector2, _scale: float = 1.0, _tint: Color = Color.WHITE) -> void:
		effects.append(kind)

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
	_navigation_checks()
	_queue_checks()
	var ordinary = await _blast_trial("blast-wave-bomb")
	var strong = await _blast_trial("strong-blast-wave-bomb")
	_expect(float(strong.near_speed) > float(ordinary.near_speed) * 1.5, "the strong airflow charge gives a larger real impulse at the same distance")
	_expect(absf(float(ordinary.far_speed)) < 0.01 and float(strong.far_speed) > 10.0, "the strong airflow charge reaches a body outside the ordinary charge's radius")
	# A nonzero destruction strength deliberately catches implementations that only
	# happen to spare targets because the two authored items have strength zero.
	await _blast_trial("bomb", true)
	await _ordinary_bomb_checks()
	await _submerged_blast_checks()
	for charge in ["blast-wave-bomb", "strong-blast-wave-bomb"]:
		await _blast_collision_checks(charge)
	if is_instance_valid(fixture_world):
		fixture_world.queue_free()
		await process_frame
	var result = {"suite": "rescue", "checks": checks, "failures": failures, "measurements": {"ordinary": ordinary, "strong": strong}, "status": "passed" if failures.is_empty() else "failed"}
	FileAccess.open("res://previews/rescue-checks.json", FileAccess.WRITE).store_string(JSON.stringify(result, "\t") + "\n")
	print(JSON.stringify({"suite": "rescue", "checks": checks.size(), "failures": failures, "status": result.status}))
	quit(0 if failures.is_empty() else 1)

func _navigation_checks() -> void:
	_expect(catalog.items.size() == 514 and catalog.stages.size() == 51, "the complete expansion loads 514 objects and 51 stable-ID stages")
	var order = catalog.stage_order()
	var ids = order.map(func(index): return int(catalog.stages[index].id))
	var saved_order: Array = GameCatalog.read_json("res://data/stage-order.json").order.map(func(id): return int(id))
	for stage in catalog.stages:
		_expect(int(stage.get("sequenceOrder", -1)) == saved_order.find(int(stage.id)) + 1, "JSON stage ID resolves to its saved presentation rank")
	_expect(order.size() == catalog.stages.size(), "navigation includes every configured stage")
	var fixed_positions = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 10: 20, 13: 28, 15: 15, 20: 21, 25: 33, 45: 47}
	for position in fixed_positions:
		_expect(ids[position - 1] == fixed_positions[position], "requested fixed position %d is preserved" % position)
	var unique_ids: Dictionary = {}
	for id in ids:
		unique_ids[id] = true
	_expect(unique_ids.size() == catalog.stages.size(), "the saved shuffle contains every stage exactly once")
	var navigates_all = true
	for position in range(order.size()):
		var index = int(order[position])
		var expected_next = int(order[position + 1]) if position + 1 < order.size() else -1
		navigates_all = navigates_all and catalog.stage_position(index) == position and catalog.next_stage_index(index) == expected_next
	_expect(navigates_all and catalog.next_stage_index(-1) == -1, "position and next-stage navigation traverse the same complete order and stop after its last entry")
	var future = GameCatalog.new()
	# Test the general group/rank ordering on synthetic data only.
	future.stages = [{"id": 901, "sequenceGroup": 200}, {"id": 41}, {"id": 70, "sequenceOrder": 1}, {"id": 902, "sequenceGroup": 100}]
	_expect(future.stage_order() == [2, 1, 3, 0] and future.next_stage_index(1) == 3 and future.next_stage_index(0) == -1, "sequence groups and explicit ranks work for arbitrary IDs in arbitrary source order")

func _queue_checks() -> void:
	var hospital: Dictionary = catalog.stages.filter(func(stage): return int(stage.id) == 46)[0]
	var crane: Dictionary = catalog.stages.filter(func(stage): return int(stage.id) == 47)[0]
	var school: Dictionary = catalog.stages.filter(func(stage): return int(stage.id) == 48)[0]
	var school_items: Array = ["drafting-compass", "pencil", "school-desk", "randoseru", "hardcover-book", "open-book", "book-stack", "counter", "school-uniform", "bookshelf", "pencil-sharpener", "scissors", "backpack", "stool", "alarm-clock"]
	var rng = RandomNumberGenerator.new()
	_expect(hospital.queue.size() == 20, "the rescue stage provides twenty authored candidates for fifteen throws")
	_expect(school.queue == school_items and school_items.all(func(id): return catalog.items.has(id)), "the school stage has its exact fifteen authored objects including the four new school items")
	_expect(not catalog.is_catalog_selectable("counter") and school.queue.has("counter"), "an explicitly authored school counter remains usable without reopening it in free selection")
	for seed_value in [1, 51, 1039]:
		rng.seed = seed_value
		_expect(catalog.build_queue(school, rng) == school_items, "the school stage keeps its fixed fifteen-item teaching order for seed %d" % seed_value)
		rng.seed = seed_value
		var hospital_queue = catalog.build_queue(hospital, rng)
		rng.seed = seed_value
		var same_hospital = catalog.build_queue(hospital, rng)
		var distinct: Dictionary = {}
		for id in hospital_queue:
			distinct[id] = true
		_expect(hospital_queue == same_hospital and hospital_queue.size() == 15 and distinct.size() == 15 and hospital_queue.all(func(id): return id in hospital.queue), "the rescue stage samples fifteen distinct authored kinds reproducibly for seed %d" % seed_value)
		rng.seed = seed_value
		var crane_queue = catalog.build_queue(crane, rng)
		rng.seed = seed_value
		var same_crane = catalog.build_queue(crane, rng)
		_expect(crane_queue == same_crane and crane_queue.size() == 15 and crane_queue[5] == "strong-blast-wave-bomb" and crane_queue[10] == "strong-blast-wave-bomb", "the crane stage keeps exactly fifteen throws and its sixth/eleventh strong airflow charges for seed %d" % seed_value)
		_expect(crane_queue.all(func(id): return catalog.is_catalog_selectable(id)), "the crane stage only draws picker-visible objects for seed %d" % seed_value)
	_expect(crane.get("queuePolicy", "") == "randomCatalog" and crane.get("randomCatalogScope", "") == "selectable", "the crane queue explicitly opts into the live selectable catalog")
	rng.seed = 91
	var first = catalog.build_queue(crane, rng)
	rng.seed = 5728
	_expect(catalog.build_queue(crane, rng) != first, "different crane seeds vary the remaining random throws")
	var synthetic = GameCatalog.new()
	var selectable: Dictionary = catalog.items["spaghetti"].duplicate(true)
	selectable.id = "future-visible-selection-item"
	selectable.selectionOnly = true
	var hidden: Dictionary = catalog.items["counter"].duplicate(true)
	hidden.id = "future-hidden-ordinary-item"
	hidden.catalogSelectable = false
	hidden.erase("selectionOnly")
	synthetic.items = {selectable.id: selectable, hidden.id: hidden}
	synthetic.ordered_items = [selectable, hidden]
	var visible_queue = synthetic.build_queue({"queuePolicy": "randomCatalog", "randomCatalogScope": "selectable"}, rng)
	var ordinary_queue = synthetic.build_queue({"queuePolicy": "randomCatalog"}, rng)
	_expect(visible_queue.size() == 15 and visible_queue.count(selectable.id) == 15, "selectable random scope includes later selection-only additions while excluding invisible objects")
	_expect(ordinary_queue.size() == 15 and ordinary_queue.count(hidden.id) == 15, "omitting the random scope preserves the old selection-only exclusion and hidden-item eligibility")
	var candidates: Array = catalog.ordered_items.slice(0, 20).map(func(item): return str(item.id))
	var fixed: Array = []
	fixed.resize(15)
	fixed.fill("camera")
	var modes: Array = [
		{"queue": fixed},
		{"queue": candidates, "shuffleQueue": true},
		{"queueSlots": [{"count": 15, "candidates": candidates}], "shuffleQueue": true},
		{"queuePolicy": "randomCatalog", "randomCatalogScope": "selectable"}
	]
	for mode_index in range(modes.size()):
		var stage: Dictionary = modes[mode_index]
		rng.seed = 1234
		var baseline = catalog.build_queue(stage, rng)
		var baseline_state = rng.state
		var forced = stage.duplicate(true)
		forced.queueOverrides = [{"shot": 1, "item": "refrigerator"}, {"shot": 8, "item": "fork"}, {"shot": 15, "item": "blast-wave-bomb"}]
		rng.seed = 1234
		var actual = catalog.build_queue(forced, rng)
		var expected = baseline.duplicate()
		expected[0] = "refrigerator"
		expected[7] = "fork"
		expected[14] = "blast-wave-bomb"
		_expect(actual == expected and actual.size() == 15 and rng.state == baseline_state, "slot overrides work at arbitrary positions after sampling without extra throws or RNG draws in queue mode %d" % mode_index)

func _reset(stage: Dictionary = {}) -> void:
	if is_instance_valid(fixture_world):
		fixture_world.queue_free()
		await process_frame
	fixture_world = BlastWorld.new()
	fixture_world.rng.seed = 6839
	root.add_child(fixture_world)
	PhysicsServer2D.area_set_param(fixture_world.get_world_2d().space, PhysicsServer2D.AREA_PARAM_GRAVITY, 0.0)
	fixture_world.liquid = LiquidScript.new()
	fixture_world.add_child(fixture_world.liquid)
	fixture_world.liquid.configure(fixture_world, stage)
	fixture_world.hazards = HazardsScript.new()
	fixture_world.add_child(fixture_world.hazards)
	fixture_world.hazards.configure(fixture_world, stage)
	await _steps(2)

func _spawn(id: String, point: Vector2) -> ThrowBody:
	var actor = BodyScript.new()
	actor.configure(catalog.items[id], fixture_world)
	actor.position = point
	actor.gravity_scale = 0.0
	actor.can_sleep = false
	fixture_world.add_child(actor)
	fixture_world.actors.append(actor)
	return actor

func _wall(bounds: Rect2) -> void:
	var wall = StaticBody2D.new()
	wall.position = bounds.get_center()
	wall.collision_layer = 1
	wall.collision_mask = 2
	var collider = CollisionShape2D.new()
	var shape = RectangleShape2D.new()
	shape.size = bounds.size
	collider.shape = shape
	wall.add_child(collider)
	fixture_world.add_child(wall)

func _blast_trial(id: String, explicit_flag: bool = false) -> Dictionary:
	await _reset()
	var fragile = _spawn("vase", Vector2(400, 220))
	fragile.spec.explosionResistance = 0.0
	var tutorial = _spawn("wooden-crate", Vector2(240, 220))
	tutorial.spec.explosionResistance = 0.0
	tutorial.set_meta("tutorial_required", 1)
	var far = _spawn("wooden-crate", Vector2(510, 220))
	var outside = _spawn("wooden-crate", Vector2(660, 220))
	var shielded = _spawn("wooden-crate", Vector2(320, 350))
	_wall(Rect2(280, 290, 80, 10))
	var bomb = _spawn(id, Vector2(320, 220))
	if explicit_flag:
		bomb.spec.blastOnly = true
		bomb.spec.radius = 145.0
		bomb.spec.strength = 100.0
		bomb.spec.impulseMultiplier = 1.5
	await _steps(2)
	var rng_before = fixture_world.rng.state
	fixture_world.hazards.detonate(bomb)
	fixture_world.hazards.detonate(bomb)
	_expect(not bomb.alive and bomb.release_triggered and fixture_world.effects.count("explosion") == 1, id + " is consumed and emits its blast only once")
	_expect(fragile.alive and not fragile.break_requested and tutorial.alive and not tutorial.break_requested and tutorial.tutorial_hits == 0, id + " never directly breaks a fragile object or advances the three-hit tutorial counter")
	_expect(fixture_world.rng.state == rng_before, id + " does not consume destruction randomness")
	_expect(fixture_world.hazards.patches.is_empty() and not fragile.burning and not tutorial.burning, id + " does not introduce fire while pushing objects")
	await _steps(3)
	_expect(is_instance_valid(fragile) and fragile.alive and fragile.linear_velocity.x > 10.0 and tutorial.linear_velocity.x < -10.0, id + " sends real surviving rigid bodies outward on both sides")
	_expect(outside.linear_velocity.length() < 0.01 and shielded.linear_velocity.length() < 0.01, id + " respects finite reach and a solid terrain wall")
	return {"near_speed": fragile.linear_velocity.x, "far_speed": far.linear_velocity.x, "tutorial_speed": tutorial.linear_velocity.x}

func _ordinary_bomb_checks() -> void:
	await _reset()
	var fragile = _spawn("wooden-crate", Vector2(400, 220))
	fragile.spec.explosionResistance = 0.0
	var tutorial = _spawn("wooden-crate", Vector2(240, 220))
	tutorial.set_meta("tutorial_required", 1)
	var bomb = _spawn("bomb", Vector2(320, 220))
	bomb.spec.strength = 100.0
	await _steps(2)
	var rng_before = fixture_world.rng.state
	fixture_world.hazards.detonate(bomb)
	_expect(fragile.break_requested and tutorial.break_requested and tutorial.tutorial_hits == 1 and fixture_world.rng.state != rng_before, "ordinary bombs retain probabilistic destruction and tutorial damage")
	await process_frame

func _blast_collision_checks(id: String) -> void:
	# Exercise actual moving bodies against an eight-pixel barrier, including
	# the game's accelerated settling rate. Do not replace the body with a ray
	# or freeze it: both shape CCD and the contact solver must handle the blast.
	for direction in [Vector2.RIGHT, Vector2.DOWN]:
		await _reset()
		Engine.time_scale = 2.0
		var start = Vector2(400, 200)
		var wall_rect = Rect2(480, 80, 8, 240) if direction == Vector2.RIGHT else Rect2(280, 280, 240, 8)
		_wall(wall_rect)
		var target = _spawn("bowling-ball", start)
		var bomb = _spawn(id, start - direction * 80.0)
		await _steps(2)
		fixture_world.hazards.detonate(bomb)
		var reached_barrier = false
		var penetrated = false
		var crossed = false
		for tick in range(120):
			await physics_frame
			var progress = (target.global_position - start).dot(direction)
			reached_barrier = reached_barrier or progress > 30.0
			crossed = crossed or progress > 80.0
			# Two pixels are reserved for the solver's contact tolerance; any
			# fixture entering the inner four-pixel core is a real penetration.
			penetrated = penetrated or target.touches_world_rect(wall_rect.grow(-2.0))
		_expect(reached_barrier and target.alive, id + " accelerates a surviving body into the thin barrier along " + str(direction))
		_expect(not crossed and not penetrated, id + " never tunnels through or embeds in the thin barrier at double-speed settling along " + str(direction))
		Engine.time_scale = 1.0

func _submerged_blast_checks() -> void:
	await _reset({"water": [{"rect": [280, 180, 80, 80], "type": "pool", "direction": [0, 0], "speed": 0}]})
	var bomb = _spawn("blast-wave-bomb", Vector2(320, 220))
	var nearby = _spawn("wooden-crate", Vector2(410, 220))
	await _steps(2)
	fixture_world.hazards.detonate(bomb)
	_expect(bomb.alive and bool(bomb.get_meta("water_dud", false)) and bomb.can_score and not bomb.release_triggered and fixture_world.effects.is_empty(), "pressure-only charges still become scoring duds when submerged")
	await _steps(2)
	_expect(nearby.linear_velocity.length() < 0.01, "a submerged dud cannot push a nearby dry body")

func _steps(count: int) -> void:
	for step in range(count):
		await physics_frame
