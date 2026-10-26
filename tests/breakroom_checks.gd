extends SceneTree
## The authored office candidates use the shared sampling rule and real terrain.
const GameScript = preload("res://src/game.gd")
var checks: Array[String] = []
var failures: Array[String] = []

func _initialize() -> void:
	_run.call_deferred()

func _expect(condition: bool, description: String) -> void:
	checks.append(description)
	if not condition:
		failures.append(description)
		push_error(description)

func _run() -> void:
	var catalog = GameCatalog.new()
	var stage: Dictionary = catalog.stages.filter(func(s): return int(s.id) == 50)[0]
	_expect(stage.queue.size() == 20 and stage.queue.all(func(id): return catalog.items.has(id)), "the office lounge has twenty available authored candidates")
	var seen: Dictionary = {}
	var rng = RandomNumberGenerator.new()
	for seed_value in [1, 50, 123, 410, 997]:
		rng.seed = seed_value
		var queue = catalog.build_queue(stage, rng)
		rng.seed = seed_value
		_expect(queue == catalog.build_queue(stage, rng), "the office queue reproduces seed %d" % seed_value)
		var distinct: Dictionary = {}
		for id in queue:
			distinct[id] = true
			seen[id] = true
		_expect(queue.size() == 15 and distinct.size() == 15 and queue.all(func(id): return stage.queue.has(id)), "seed %d draws fifteen different office candidates" % seed_value)
	_expect(seen.size() == stage.queue.size(), "the sampled office queues include all authored candidates")
	var game = GameScript.new()
	root.add_child(game)
	await process_frame
	game.load_stage(catalog.stages.find(stage))
	await physics_frame
	await physics_frame
	for x in [40.0, 330.0, 620.0, 810.0]:
		var ray = PhysicsRayQueryParameters2D.create(Vector2(x, 435), Vector2(x, 465), 1)
		var hit = game.get_world_2d().direct_space_state.intersect_ray(ray)
		_expect(not hit.is_empty() and absf(float(hit.position.y) - 450.0) < 1.0, "office floor at x=%d meets the visible surface" % int(x))
	var wall_ray = PhysicsRayQueryParameters2D.create(Vector2(30, 250), Vector2(0, 250), 1)
	_expect(not game.get_world_2d().direct_space_state.intersect_ray(wall_ray).is_empty(), "the office left wall is physical")
	game._update_hud()
	await process_frame
	FileAccess.open("res://previews/game-state-50-breakroom.json", FileAccess.WRITE).store_string(JSON.stringify(game.debug_snapshot(), "\t") + "\n")
	game.queue_free()
	await process_frame
	var result = {"suite": "breakroom", "checks": checks, "failures": failures, "status": "passed" if failures.is_empty() else "failed"}
	FileAccess.open("res://previews/breakroom-checks.json", FileAccess.WRITE).store_string(JSON.stringify(result, "\t") + "\n")
	print(JSON.stringify(result))
	quit(0 if failures.is_empty() else 1)
