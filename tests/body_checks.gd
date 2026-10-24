extends SceneTree
## Focused engine tests. Run after asset import with --headless --script.

const BodyScript = preload("res://src/throw_body.gd")
var records: Dictionary = {}
var failures: Array[String] = []
var checks: Array[String] = []
var fixture_world: TestWorld

class TestWorld:
	extends Node2D
	var gravity_value: float = 980.0
	var ice: bool = false
	var broken: Array[Dictionary] = []
	var impacts: Array[Dictionary] = []
	func surface_friction_at(_point: Vector2) -> float:
		return 0.025 if ice else -1.0
	func destroy_actor(actor: Node, reason: String) -> void:
		broken.append({"id": actor.item_id, "reason": reason})
		actor.alive = false
		actor.queue_free()
	func on_actor_impact(actor: Node, _point: Vector2, speed: float, energy: float) -> void:
		if is_instance_valid(actor):
			impacts.append({"id": actor.item_id, "speed": speed, "energy": energy})


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	Engine.physics_ticks_per_second = 120
	var manifest = JSON.parse_string(FileAccess.get_file_as_string("res://data/objects-manifest.json"))
	for record in manifest.items:
		records[record.id] = record
	await _reset(false)
	var umbrella = _spawn("umbrella", Vector2(200.0, 200.0))
	umbrella.freeze = true
	var scale_value: float = records.umbrella.worldScale
	_expect(umbrella.contains_world_point(umbrella.to_global(Vector2(0.0, 30.0) * scale_value)), "umbrella shaft participates in water containment")
	_expect(umbrella.contains_world_point(umbrella.to_global(Vector2(-18.0, 52.0) * scale_value)), "umbrella hook participates in water containment")
	_expect(not umbrella.contains_world_point(umbrella.to_global(Vector2(40.0, 30.0) * scale_value)), "umbrella empty space stays empty")
	await _reset(false)
	var skateboard = _spawn("skateboard", Vector2(200.0, 345.0))
	await _steps(180)
	_expect(skateboard.wheel_supported, "upright skateboard recognizes wheel support")
	skateboard.linear_velocity = Vector2(220.0, 0.0)
	skateboard.sleeping = false
	var start_x = skateboard.position.x
	await _steps(90)
	var upright_distance = skateboard.position.x - start_x
	await _reset(false)
	var flipped = _spawn("skateboard", Vector2(200.0, 345.0), PI)
	await _steps(180)
	_expect(not flipped.wheel_supported, "flipped skateboard uses a solid body surface")
	flipped.linear_velocity = Vector2(220.0, 0.0)
	flipped.sleeping = false
	start_x = flipped.position.x
	await _steps(90)
	var flipped_distance = flipped.position.x - start_x
	_expect(upright_distance > flipped_distance + 30.0, "wheel contact slides farther than the flipped deck")
	print("Wheel displacement: upright=", upright_distance, " flipped=", flipped_distance)
	await _reset(true)
	var boots = _spawn("grip-boots", Vector2(200.0, 345.0))
	await _steps(300)
	_expect(not boots.sole_supported and boots.behavior == "solid", "boots use an ordinary rigid body without sole braking")
	_expect(is_equal_approx(boots._base_friction, float(records.refrigerator.physics.friction)) and is_equal_approx(boots.physics_material_override.bounce, float(records.refrigerator.physics.restitution)), "boots use refrigerator friction and low restitution")
	boots.linear_velocity = Vector2(180.0, 0.0)
	boots.sleeping = false
	start_x = boots.position.x
	await _steps(90)
	var grip_distance = boots.position.x - start_x
	await _reset(true)
	var upside_down = _spawn("grip-boots", Vector2(200.0, 345.0), PI)
	await _steps(300)
	_expect(not upside_down.sole_supported, "upside-down boots do not activate the soles")
	upside_down.linear_velocity = Vector2(180.0, 0.0)
	upside_down.sleeping = false
	start_x = upside_down.position.x
	await _steps(90)
	var no_grip_distance = upside_down.position.x - start_x
	_expect(grip_distance > 80.0 and no_grip_distance > 80.0, "both boot orientations slide on ice without hidden extra braking")
	print("Boot displacement: sole=", grip_distance, " upside-down=", no_grip_distance)
	await _reset(false)
	var rubber_records: Array[Dictionary] = []
	for id in ["rubber-warm", "rubber-cold", "rubber-thawed"]:
		var rubber: Dictionary = records.basketball.duplicate(true)
		rubber.id = id
		rubber_records.append(rubber)
	var warm = _spawn_record(rubber_records[0], Vector2(100, 150))
	var cold = _spawn_record(rubber_records[1], Vector2(350, 150))
	var thawed = _spawn_record(rubber_records[2], Vector2(600, 150))
	for rubber in [warm, cold, thawed]:
		rubber.age = 1.0
		rubber.linear_velocity = Vector2(0, 450)
	cold.apply_cooling(8.0)
	thawed.apply_cooling(8.0)
	thawed.frozen_seconds = 0.0
	var bounced = false
	for frame in range(100):
		await physics_frame
		bounced = bounced or warm.linear_velocity.y < -100.0
	_expect(warm.alive and bounced, "warm rubber survives a hard floor impact and rebounds")
	_expect(_has_break("rubber-cold", "frozen-impact"), "the same floor impact shatters frozen rubber")
	_expect(thawed.alive and not thawed.is_frozen_rubber(), "thawing rubber restores its normal impact durability")
	await _reset(false)
	var impact_record: Dictionary = _block_record("impact-test", 2.0)
	impact_record.behavior = "breakable"
	impact_record.physics.merge({"impactSpeed": 150.0, "minImpactEnergy": 8.0, "loadForceThreshold": 1.0e9, "loadHoldSeconds": 0.4})
	var fragile = _spawn_record(impact_record, Vector2(200.0, 160.0))
	fragile.linear_velocity = Vector2(0.0, 450.0)
	fragile.age = 1.0
	await _steps(90)
	_expect(_has_break("impact-test", "impact"), "a strong normal impact breaks and removes a fragile body")
	await _reset(false)
	var load_record: Dictionary = _block_record("load-test", 2.0)
	load_record.behavior = "breakable"
	load_record.physics.merge({"impactSpeed": 1.0e8, "minImpactEnergy": 1.0e8, "loadForceThreshold": 3000.0, "loadHoldSeconds": 0.4, "loadReleaseRatio": 0.8})
	var load_body = _spawn_record(load_record, Vector2(200.0, 380.0))
	await _steps(150)
	_expect(is_instance_valid(load_body) and not load_body.break_requested, "the floor support alone does not count as upper load")
	_spawn_record(_block_record("load-weight", 12.0), Vector2(200.0, 339.0))
	await _steps(150)
	_expect(_has_break("load-test", "load"), "sustained upper load breaks after its hold duration")
	await _reset(false)
	var donut = _spawn("donut", Vector2(500, 200))
	donut.freeze = true
	await _steps(2)
	var hole_query = PhysicsPointQueryParameters2D.new()
	hole_query.collision_mask = 2
	hole_query.position = donut.to_global(Vector2.ZERO)
	_expect(fixture_world.get_world_2d().direct_space_state.intersect_point(hole_query).is_empty(), "the donut's visible center hole is also empty in the real physics collider")
	hole_query.position = donut.to_global(Vector2(40, 0) * float(donut.record.worldScale))
	_expect(not fixture_world.get_world_2d().direct_space_state.intersect_point(hole_query).is_empty(), "the donut ring remains physically solid around its hole")
	await _reset(false)
	for child in fixture_world.get_children():
		if child is StaticBody2D:
			child.queue_free()
	await process_frame
	var catalog = GameCatalog.new()
	var restaurant: Dictionary = catalog.stages[15]
	catalog.make_terrain(fixture_world, restaurant)
	await _steps(2)
	var point_query = PhysicsPointQueryParameters2D.new()
	point_query.collision_mask = 1
	point_query.position = Vector2(300, 400)
	_expect(fixture_world.get_world_2d().direct_space_state.intersect_point(point_query).is_empty(), "the restaurant plate interior is empty collision space")
	point_query.position = Vector2(300, 450)
	_expect(not fixture_world.get_world_2d().direct_space_state.intersect_point(point_query).is_empty(), "the concave restaurant plate has a solid bottom")
	point_query.position = Vector2(126, 420)
	_expect(not fixture_world.get_world_2d().direct_space_state.intersect_point(point_query).is_empty(), "the restaurant plate has a real sloped side wall")
	var food = _spawn("hamburger", Vector2(300, 330))
	await _steps(240)
	_expect(is_instance_valid(food) and food.get_world_bounds().end.y > 436.0 and food.get_world_bounds().end.y < 442.0, "food falls into the concave plate and rests on its lower interior")
	var ice_terrain = Node2D.new()
	fixture_world.add_child(ice_terrain)
	catalog.make_terrain(ice_terrain, catalog.stages[17])
	_expect(bool(catalog.stages[17].get("iceFloor", false)) and not bool(restaurant.get("iceFloor", false)) and is_equal_approx(ice_terrain.get_child(0).physics_material_override.friction, 0.025), "ice terrain follows its stage flag after reassignment to stage18")
	var queue_rng = RandomNumberGenerator.new()
	var varied: bool = false
	for stage in catalog.stages:
		queue_rng.seed = 1234
		var first_queue = catalog.build_queue(stage, queue_rng)
		queue_rng.seed = 1234
		var repeated = catalog.build_queue(stage, queue_rng)
		queue_rng.seed = 9876
		var alternate = catalog.build_queue(stage, queue_rng)
		_expect(first_queue.size() == 15 and first_queue == repeated, "stage %d queue has fifteen reproducible seeded throws" % int(stage.id))
		varied = varied or first_queue != alternate
		if int(stage.id) == 10:
			_expect(first_queue[0] == "bowling-ball" and first_queue[1] == "blast-bomb", "bowling always begins with its ball and strong bomb")
		if int(stage.id) == 11:
			_expect(first_queue.count("sponge") == 2, "river queue always keeps two sponges")
	_expect(varied, "different seeds change ordinary queue selections")
	var future_item: Dictionary = records.refrigerator.duplicate(true)
	future_item.id = "future-catalog-item"
	var random_catalog = GameCatalog.new()
	random_catalog.ordered_items = [future_item]
	var laboratory_rng = RandomNumberGenerator.new()
	laboratory_rng.seed = 91
	var future_queue = random_catalog.build_queue({"queuePolicy": "randomCatalog", "queue": ["refrigerator"]}, laboratory_rng)
	_expect(future_queue.size() == 15 and future_queue.count("future-catalog-item") == 15, "random laboratory samples the live catalog including later additions")
	await _reset(false)
	var mover = preload("res://src/moving_terrain.gd").new()
	fixture_world.add_child(mover)
	mover.configure({"center": [300, 250], "size": [120, 20], "axis": [1, 0], "travel": 80, "period": 4}, false)
	await _steps(120)
	_expect(mover.position.x > 370.0 and is_equal_approx(mover.position.y, 250.0), "moving terrain advances its physical collider along its configured path")
	point_query.position = mover.global_position
	_expect(not fixture_world.get_world_2d().direct_space_state.intersect_point(point_query).is_empty(), "moving platform remains a solid collision surface at its current location")
	var lamp = preload("res://src/moving_terrain.gd").new()
	fixture_world.add_child(lamp)
	lamp.configure({"anchor": [600, 80], "length": 170, "size": [64, 34], "amplitude": 16, "period": 4}, true)
	await _steps(120)
	_expect(absf(lamp.rotation) > 0.2 and absf(lamp.position.distance_to(Vector2(600, 80)) - 170.0) < 0.01, "hanging lamp swings around its anchor with constant cable length")
	await _reset(false)
	for child in fixture_world.get_children():
		if child is StaticBody2D:
			child.queue_free()
	await process_frame
	catalog.make_terrain(fixture_world, catalog.stages[0])
	await _steps(2)
	point_query.position = Vector2(970, 300)
	_expect(not fixture_world.get_world_2d().direct_space_state.intersect_point(point_query).is_empty(), "stage one has a physical wall just beyond its right screen edge")
	point_query.position = Vector2(-10, 300)
	_expect(not fixture_world.get_world_2d().direct_space_state.intersect_point(point_query).is_empty(), "stage one also closes the marked left screen edge")
	await _reset(false)
	for child in fixture_world.get_children():
		if child is StaticBody2D:
			child.queue_free()
	await process_frame
	catalog.make_terrain(fixture_world, catalog.stages[4])
	await _steps(2)
	point_query.position = Vector2(250, 330)
	_expect(not fixture_world.get_world_2d().direct_space_state.intersect_point(point_query).is_empty(), "volcano summit is real collision terrain at y320")
	point_query.position = Vector2(320, 330)
	_expect(fixture_world.get_world_2d().direct_space_state.intersect_point(point_query).is_empty(), "the volcano crater retains its concave open center")
	var result = {"engine": Engine.get_version_info().string, "passed": failures.is_empty(), "checks": checks, "failures": failures, "measurements": {"skateboard_upright_px": upright_distance, "skateboard_flipped_px": flipped_distance, "boots_sole_px": grip_distance, "boots_inverted_px": no_grip_distance}}
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://previews"))
	var report = FileAccess.open("res://previews/body-checks.json", FileAccess.WRITE)
	if report != null:
		report.store_string(JSON.stringify(result, "\t") + "\n")
	else:
		_expect(false, "body test report can be written")
	print(JSON.stringify(result))
	if is_instance_valid(fixture_world):
		fixture_world.queue_free()
	await process_frame
	quit(0 if failures.is_empty() else 1)


func _block_record(id: String, block_mass: float) -> Dictionary:
	var block: Dictionary = records["wooden-crate"].duplicate(true)
	block.id = id
	block.mass = block_mass
	block.worldScale = 0.5
	block.worldWidth = 40.0
	block.worldHeight = 40.0
	block.fixtures = [{"rect": [24.0, 24.0, 80.0, 80.0]}]
	block.physics = {"friction": 0.6, "restitution": 0.0}
	return block


func _has_break(id: String, reason: String) -> bool:
	for result in fixture_world.broken:
		if result.id == id and result.reason == reason:
			return true
	return false


func _reset(ice: bool) -> void:
	if is_instance_valid(fixture_world):
		fixture_world.queue_free()
		await process_frame
	fixture_world = TestWorld.new()
	fixture_world.ice = ice
	root.add_child(fixture_world)
	var ground = StaticBody2D.new()
	ground.position = Vector2(480.0, 440.0)
	ground.collision_layer = 1
	var material = PhysicsMaterial.new()
	material.friction = 0.025 if ice else 0.6
	ground.physics_material_override = material
	var collider = CollisionShape2D.new()
	var shape = RectangleShape2D.new()
	shape.size = Vector2(3000.0, 80.0)
	collider.shape = shape
	ground.add_child(collider)
	fixture_world.add_child(ground)
	await _steps(2)


func _spawn(id: String, point: Vector2, rotation_value: float = 0.0) -> RigidBody2D:
	return _spawn_record(records[id], point, rotation_value)


func _spawn_record(record: Dictionary, point: Vector2, rotation_value: float = 0.0) -> RigidBody2D:
	var body = BodyScript.new()
	body.configure(record, fixture_world)
	body.position = point
	body.rotation = rotation_value
	fixture_world.add_child(body)
	return body


func _steps(count: int) -> void:
	for i in range(count):
		await physics_frame


func _expect(condition: bool, description: String) -> void:
	checks.append(description)
	if not condition:
		failures.append(description)
		push_error(description)


