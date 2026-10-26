extends SceneTree
## Local friction, real bath/stool colliders and finite water absorption.
const GameScript = preload("res://src/game.gd")
const BodyScript = preload("res://src/throw_body.gd")
var checks: Array[String] = []
var failures: Array[String] = []
var catalog: GameCatalog

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
	var stage: Dictionary = catalog.stages.filter(func(s): return int(s.id) == 51)[0]
	_expect(stage.queue.size() == 20 and stage.queue.all(func(id): return catalog.items.has(id)), "the bathroom has twenty valid authored candidate entries")
	var rng = RandomNumberGenerator.new()
	var seen: Dictionary = {}
	for seed_value in [1, 51, 123, 410, 997]:
		rng.seed = seed_value
		var queue = catalog.build_queue(stage, rng)
		rng.seed = seed_value
		_expect(queue == catalog.build_queue(stage, rng), "bathroom queue reproduces seed %d" % seed_value)
		_expect(queue.size() == 15 and queue.count("sponge") == 2, "seed %d keeps fifteen throws with two sponges" % seed_value)
		var other_ids: Dictionary = {}
		for id in queue:
			seen[id] = true
			if id != "sponge":
				other_ids[id] = true
		_expect(other_ids.size() == 13 and queue.all(func(id): return stage.queue.has(id)), "seed %d selects thirteen different other bath props" % seed_value)
	_expect(stage.queue.all(func(id): return seen.has(id)), "sampled bath queues include every authored candidate")
	var game = GameScript.new()
	root.add_child(game)
	await process_frame
	game.load_stage(catalog.stages.find(stage))
	await physics_frame
	await physics_frame
	var space = game.get_world_2d().direct_space_state
	for sample in [[170.0, 486.0], [340.0, 450.0], [405.0, 402.0], [560.0, 382.0], [680.0, 450.0]]:
		var ray = PhysicsRayQueryParameters2D.create(Vector2(sample[0], 350), Vector2(sample[0], 510), 1)
		var hit = space.intersect_ray(ray)
		_expect(not hit.is_empty() and absf(float(hit.position.y) - sample[1]) < 1.0, "bathroom surface at x=%d matches visible height %d" % [int(sample[0]), int(sample[1])])
	_expect(not space.intersect_ray(PhysicsRayQueryParameters2D.create(Vector2(30, 250), Vector2(0, 250), 1)).is_empty(), "the indoor left wall has physical collision")
	for point in [Vector2(42, 435), Vector2(306, 435), Vector2(170, 492), Vector2(382, 440)]:
		_expect(game.point_in_solid(point), "bath sides, bottom and stool legs contain their visible solid points")
	for point in [Vector2(170, 430), Vector2(410, 439), Vector2(560, 430)]:
		_expect(not game.point_in_solid(point), "bath cavity and spaces below the seats stay physically open")
	var wet_hit = space.intersect_ray(PhysicsRayQueryParameters2D.create(Vector2(340, 440), Vector2(340, 460), 1))
	var dry_hit = space.intersect_ray(PhysicsRayQueryParameters2D.create(Vector2(680, 440), Vector2(680, 460), 1))
	_expect(is_equal_approx(float(wet_hit.collider.get_meta("surface_slip_factor")), 1.3) and is_equal_approx(float(dry_hit.collider.get_meta("surface_slip_factor")), 1.0), "only the authored glossy floor section gets the 1.3 slip factor")
	_expect(is_equal_approx(wet_hit.collider.physics_material_override.friction, 0.6 / 1.3), "wet floor friction is the normal terrain friction divided by 1.3")
	var water = game.liquid.regions[0]
	var initial_volume = float(water.remaining)
	_expect(bool(water.finite) and Vector2(water.velocity).is_zero_approx() and initial_volume > 48.0, "the bathtub begins with finite still water for both sponges")
	_expect(game.liquid.submerged_point(Vector2(170, 450)) and not game.liquid.submerged_point(Vector2(340, 450)), "initial water occupies the bath cavity only")
	game._update_hud()
	await process_frame
	FileAccess.open("res://previews/game-state-51-bathroom.json", FileAccess.WRITE).store_string(JSON.stringify(game.debug_snapshot(), "\t") + "\n")
	game.set_physics_process(false)
	var first = game._create_actor(catalog.items["sponge"], Vector2(110, 0), 486.0)
	var second = game._create_actor(catalog.items["sponge"], Vector2(225, 0), 486.0)
	first.freeze = true
	second.freeze = true
	for tick in range(100):
		game.liquid.tick(0.05)
	_expect(is_equal_approx(float(first.get_meta("absorbed", 0)), 24.0) and is_equal_approx(float(second.get_meta("absorbed", 0)), 24.0), "both sponges absorb their real capacity while touching bath water")
	_expect(is_equal_approx(float(water.remaining), initial_volume - 48.0) and float(water.rect.position.y) > 418.0, "absorbing forty-eight units lowers the finite bath surface")
	var unchanged_volume = float(water.remaining)
	for tick in range(20):
		game.liquid.tick(0.05)
	_expect(is_equal_approx(float(water.remaining), unchanged_volume), "full sponges neither over-absorb nor refill the bathtub")
	game.queue_free()
	await process_frame
	await _bath_prop_capacity(stage)
	var dry = await _slide(1.0)
	var glossy = await _slide(1.3)
	_expect(is_equal_approx(float(glossy.friction), float(dry.friction) / 1.3), "a supported body's friction follows the same local factor")
	_expect(float(glossy.distance) > float(dry.distance) * 1.2 and float(glossy.distance) < float(dry.distance) * 1.4, "real contact sliding travels about 1.3 times the dry-floor distance")
	_expect(float(glossy.max_speed) <= 200.1 and float(glossy.end_speed) < 1.0, "the slippery floor adds no acceleration and still lets the object stop")
	var result = {"suite":"bathroom", "checks":checks, "failures":failures, "measurements":{"dry":dry, "glossy":glossy}, "status":"passed" if failures.is_empty() else "failed"}
	FileAccess.open("res://previews/bathroom-checks.json", FileAccess.WRITE).store_string(JSON.stringify(result, "\t") + "\n")
	print(JSON.stringify(result))
	quit(0 if failures.is_empty() else 1)

func _bath_prop_capacity(stage: Dictionary) -> void:
	var game = GameScript.new()
	root.add_child(game)
	await process_frame
	game.load_stage(catalog.stages.find(stage))
	game.set_physics_process(false)
	await physics_frame
	var initial_volume = game.liquid.current_volume()
	var mat = game._create_actor(catalog.items["bath-mat"], Vector2(170, 0), 486.0)
	mat.freeze = true
	for tick in range(100):
		game.liquid.tick(0.05)
	_expect(is_equal_approx(float(mat.get_meta("absorbed", 0)), 16.0), "a bath mat touching the pool absorbs exactly its sixteen-unit capacity")
	_expect(is_equal_approx(game.liquid.current_volume(), initial_volume - 16.0), "bath-mat absorption removes the same finite volume from the pool")
	for tick in range(40):
		game.liquid.tick(0.05)
	_expect(is_equal_approx(float(mat.get_meta("absorbed", 0)), 16.0) and is_equal_approx(game.liquid.current_volume(), initial_volume - 16.0), "a saturated bath mat stops removing water")
	var introduced_before = float(game.liquid.introduced_volume)
	var shower = game._create_actor(catalog.items["shower-head"], Vector2(700, 200))
	shower.freeze = true
	for tick in range(200):
		game.liquid.tick(0.05)
	_expect(is_zero_approx(float(shower.get_meta("source_remaining", -1))) and is_equal_approx(float(game.liquid.introduced_volume) - introduced_before, 12.0), "the shower releases exactly twelve units before its reservoir empties")
	var introduced_after = float(game.liquid.introduced_volume)
	for tick in range(200):
		game.liquid.tick(0.05)
	_expect(is_equal_approx(float(game.liquid.introduced_volume), introduced_after), "an exhausted shower does not refill or introduce more water")
	game.queue_free()
	await process_frame

func _slide(slip_factor: float) -> Dictionary:
	var fixture = Node2D.new()
	root.add_child(fixture)
	catalog.make_terrain(fixture, {"terrain":[{"rect":[0,300,2000,30], "slipFactor":slip_factor}]})
	var actor = BodyScript.new()
	var record: Dictionary = catalog.items["sponge"].duplicate(true)
	record.merge({"id":"friction-probe", "behavior":"solid", "mass":1.0, "worldScale":1.0, "pivotSource":[0,0], "fixtures":[{"rect":[-10,-10,20,20]}], "physics":{"friction":0.55,"restitution":0.0}}, true)
	actor.configure(record, fixture)
	actor.position = Vector2(100, 289.5)
	actor.lock_rotation = true
	actor.linear_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	actor.linear_damp = 0.0
	fixture.add_child(actor)
	for tick in range(30):
		await physics_frame
	var start = actor.position.x
	actor.sleeping = false
	actor.linear_velocity = Vector2(200, 0)
	var maximum_speed = 0.0
	for tick in range(120):
		await physics_frame
		maximum_speed = maxf(maximum_speed, actor.linear_velocity.length())
	var result = {"distance":actor.position.x-start, "friction":actor.physics_material_override.friction, "max_speed":maximum_speed, "end_speed":actor.linear_velocity.length()}
	fixture.queue_free()
	await process_frame
	return result
