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
	_expect(boots.sole_supported, "upright boots recognize sole support")
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
	_expect(no_grip_distance > grip_distance + 20.0, "sole friction limits sliding on ice without fixing the body")
	print("Boot displacement: sole=", grip_distance, " upside-down=", no_grip_distance)
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


