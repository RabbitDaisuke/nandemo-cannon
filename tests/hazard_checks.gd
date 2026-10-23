extends SceneTree
## Real Godot collision queries and interaction state; no browser is used.

const BodyScript = preload("res://src/throw_body.gd")
const HazardsScript = preload("res://src/hazard_system.gd")
const LiquidScript = preload("res://src/liquid_field.gd")
var records: Dictionary = {}
var checks: Array[String] = []
var failures: Array[String] = []
var fixture_world: InteractionWorld

class InteractionWorld:
	extends Node2D
	var gravity_value: float = 0.0
	var shots_fired: int = 1
	var actors: Array[ThrowBody] = []
	var rng = RandomNumberGenerator.new()
	var liquid: LiquidField
	var hazards: HazardSystem
	var destroyed: Array[Dictionary] = []
	var effects: Array[String] = []
	var impacts: Array[Dictionary] = []
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
		impacts.append({"id": actor.item_id, "speed": speed})
		hazards.impact(actor, point, speed, energy)
	func spawn_effect(kind: String, _point: Vector2, _scale: float = 1.0, _tint: Color = Color.WHITE) -> void:
		effects.append(kind)

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	Engine.physics_ticks_per_second = 120
	var data = JSON.parse_string(FileAccess.get_file_as_string("res://data/objects-manifest.json"))
	for record in data.items:
		records[record.id] = record
	await _reset()
	var jet = _spawn("flamethrower", Vector2(800, 250))
	fixture_world.hazards.on_launch(jet)
	for i in range(719):
		fixture_world.hazards.tick(1.0 / 120.0)
	_expect(jet.fuel_seconds > 0.0, "flamethrower remains active through tick719")
	fixture_world.hazards.tick(1.0 / 120.0)
	_expect(jet.fuel_seconds == 0.0, "flamethrower stops at720ticks /6seconds")
	_expect(jet.visual.texture.resource_path.ends_with("flamethrower-empty.svg"), "fuel exhaustion swaps to the depleted texture")
	_expect(fixture_world.hazards.fire_frames.size() == 6 and fixture_world.hazards.jet_frames.size() == 6, "fire and flame jet have six loaded animation frames")
	await _reset()
	var log = _spawn("log", Vector2(150, 150))
	var fridge = _spawn("refrigerator", Vector2(700, 150))
	fixture_world.hazards.heat_actor(log, 1.0)
	fixture_world.hazards.heat_actor(fridge, 1.0)
	_expect(log.burning and not fridge.burning, "heat ignites flammable logs but not nonflammable metal")
	for i in range(650):
		fixture_world.hazards.tick(1.0 / 120.0)
	_expect(not log.alive and fridge.alive, "burned logs disappear while metal survives")
	var campfire = _spawn("campfire", Vector2(350, 150))
	fixture_world.hazards.on_launch(campfire)
	for i in range(960):
		fixture_world.hazards.tick(1.0 / 120.0)
	_expect(campfire.alive and campfire.fuel_seconds == 0.0 and campfire.visual.texture.resource_path.ends_with("campfire-charred.svg"), "campfire consumes finite fuel and leaves charred logs")
	await _reset()
	var balloon = _spawn("water-balloon", Vector2(400, 200))
	fixture_world.hazards.impact(balloon, balloon.position, 80.0, 2.0)
	fixture_world.hazards.impact(balloon, balloon.position, 80.0, 2.0)
	_expect(not balloon.alive and is_equal_approx(fixture_world.liquid.current_volume(), 12.0), "water shell breaks and releases its contents exactly once")
	var wet_log = _spawn("log", Vector2(200, 200))
	fixture_world.hazards.heat_actor(wet_log, 1.0)
	fixture_world.hazards.wet_actor(wet_log, 3.0)
	_expect(not wet_log.burning and wet_log.wet_seconds > 0.0, "water puts out a burning object")
	fixture_world.hazards.add_fire(Vector2(200, 400), 24.0, 4.0)
	fixture_world.hazards.extinguish_at(Vector2(200, 400), 30.0)
	_expect(fixture_world.hazards.patches.is_empty(), "water removes an ordinary floor flame")
	var lantern = _spawn("fuel-lantern", Vector2(700, 200))
	fixture_world.hazards.on_launch(lantern)
	fixture_world.hazards.wet_actor(lantern, 3.0)
	_expect(lantern.fuel_seconds == 0.0 and lantern.visual.texture.resource_path.ends_with("fuel-lantern-off.svg"), "water puts out a fuel lantern and changes its texture")
	await _reset()
	fixture_world.gravity_value = 980.0
	PhysicsServer2D.area_set_param(fixture_world.get_world_2d().space, PhysicsServer2D.AREA_PARAM_GRAVITY, 980.0)
	var ground = StaticBody2D.new()
	ground.position = Vector2(400, 440)
	ground.collision_layer = 1
	var ground_shape = RectangleShape2D.new()
	ground_shape.size = Vector2(900, 80)
	var ground_collider = CollisionShape2D.new()
	ground_collider.shape = ground_shape
	ground.add_child(ground_collider)
	fixture_world.add_child(ground)
	var loaded_bottle = _spawn("water-bottle", Vector2(200, 368), false)
	await _physics_steps(180)
	_expect(is_instance_valid(loaded_bottle) and loaded_bottle.alive and is_zero_approx(fixture_world.liquid.current_volume()), "a water bottle resting on the floor keeps its contents")
	var load_weight = _spawn("wooden-crate", Vector2(200, 306), false)
	load_weight.mass = 12.0
	await _physics_steps(180)
	var load_breaks: int = 0
	for entry in fixture_world.destroyed:
		if entry.id == "water-bottle" and entry.reason == "load":
			load_breaks += 1
	_expect(load_breaks == 1 and is_equal_approx(fixture_world.liquid.current_volume(), 8.0), "sustained physical load breaks a filled bottle and releases all eight water units once")
	await _reset()
	var blasted_jug = _spawn("water-jug", Vector2(450, 250))
	blasted_jug.spec.explosionResistance = 0.0
	var contents_bomb = _spawn("bomb", Vector2(400, 250))
	contents_bomb.spec.strength = 10.0
	await _physics_steps(2)
	fixture_world.hazards.detonate(contents_bomb)
	fixture_world.hazards.detonate(contents_bomb)
	await process_frame
	_expect(is_equal_approx(fixture_world.liquid.current_volume(), 24.0) and fixture_world.liquid.introduced_volume == 24.0, "explosion failure releases a water jug's contents exactly once")
	await _reset()
	var burned_bottle = _spawn("water-bottle", Vector2(400, 250))
	fixture_world.hazards.heat_actor(burned_bottle, 1.0)
	for i in range(650):
		fixture_world.hazards.tick(1.0 / 120.0)
	_expect(not burned_bottle.alive and is_equal_approx(fixture_world.liquid.current_volume(), 8.0), "a burned water container also releases its contents")
	await _reset()
	var umbrella = _spawn("umbrella", Vector2(400, 200))
	await _physics_steps(2)
	fixture_world.liquid.droplets = [_drop(Vector2(380, 218), Vector2(800, 0))]
	fixture_world.liquid.tick(0.05)
	_expect(fixture_world.liquid.droplets.size() == 1 and fixture_world.liquid.droplets[0].velocity.x < 0.0, "a swept water drop reflects from the umbrella shaft")
	fixture_world.liquid.droplets = [_drop(Vector2(390, 250), Vector2(0, -800))]
	fixture_world.liquid.tick(0.05)
	_expect(fixture_world.liquid.droplets.size() == 1 and fixture_world.liquid.droplets[0].velocity.y > 0.0, "a swept water drop reflects from the umbrella hook")
	fixture_world.liquid.droplets = [_drop(Vector2(380, 145), Vector2(0, 1000))]
	fixture_world.liquid.tick(0.05)
	_expect(fixture_world.liquid.droplets.size() == 1 and fixture_world.liquid.droplets[0].velocity.y < 0.0, "a swept water drop reflects from the canopy")
	_expect(umbrella.wet_seconds == 0.0, "the water-repelling umbrella is not marked wet")
	_expect(not fixture_world.liquid._can_flow(Vector2i(24, 13), Vector2i(25, 13)), "cell transfer cannot cross a shaft thinner than one water cell")
	await _reset({"water": [{"rect": [0, 0, 960, 540], "direction": [1, 0], "speed": 65}]})
	var desk = _spawn("desk", Vector2(200, 200), false)
	var barrel = _spawn("barrel", Vector2(600, 200), false)
	await _physics_steps(2)
	desk.linear_velocity = Vector2.ZERO
	barrel.linear_velocity = Vector2.ZERO
	fixture_world.liquid._affect_bodies()
	await _physics_steps(1)
	_expect(absf(desk.linear_velocity.x) < 0.01 and barrel.linear_velocity.x > 1.0, "water current moves a barrel while a flow-immune table stays unpushed")
	barrel.linear_velocity = Vector2(200, 0)
	fixture_world.liquid._affect_bodies()
	await _physics_steps(1)
	_expect(barrel.linear_velocity.x < 199.0, "water drag reduces a fast body's velocity")
	await _reset()
	var accepted = fixture_world.liquid.add_cell(Vector2(200, 200), 9.75)
	_expect(is_equal_approx(accepted, 9.75) and is_equal_approx(fixture_world.liquid.current_volume(), 9.75), "cell overflow is distributed without silently deleting water")
	for i in range(45):
		fixture_world.liquid._step_cells(0.05)
	_expect(absf(fixture_world.liquid.current_volume() + fixture_world.liquid.drained_volume - 9.75) < 0.0001, "flow preserves volume including explicitly drained boundary water")
	await _reset({"sources": [{"position": [100, 100], "rateUnitsPerSecond": 1000, "maxUnits": 3}]})
	fixture_world.liquid.tick(1.0)
	_expect(fixture_world.liquid.sources[0].remaining == 0.0 and fixture_world.liquid.introduced_volume == 3.0, "a source never emits beyond its remaining budget")
	await _reset()
	for y in range(16):
		for x in range(16):
			fixture_world.liquid.cells[Vector2i(x, y)] = {"amount": 4.0, "frozen": 0.0}
	fixture_world.liquid.release(Vector2(400, 300), 512)
	_expect(fixture_world.liquid.cells.size() <= 256 and fixture_world.liquid.droplets.size() <= 96, "liquid allocations stay within both finite caps")
	_expect(is_equal_approx(fixture_world.liquid.current_volume() + fixture_world.liquid.rejected_volume, 1536.0), "capacity overflow is reported as rejection rather than hidden loss")
	await _reset({"water": [{"rect": [160, 160, 160, 100], "direction": [1, 0], "speed": 40}]})
	var frozen_key = Vector2i(10, 10)
	var frozen_point = fixture_world.liquid.center_for(frozen_key)
	fixture_world.liquid.cells[frozen_key] = {"amount": 3.2, "frozen": 0.0}
	fixture_world.liquid.freeze_near(frozen_point, 1.0)
	_expect(is_equal_approx(float(fixture_world.liquid.cells[frozen_key].amount), 3.2), "freezing an existing river cell preserves its water amount")
	_expect(fixture_world.liquid.ice_bodies.has(frozen_key) and not fixture_world.liquid.sample(frozen_point).wet, "a frozen river cell is solid ice and no longer applies liquid drag")
	fixture_world.liquid.melt_near(frozen_point, 2.0)
	_expect(not fixture_world.liquid.ice_bodies.has(frozen_key) and fixture_world.liquid.sample(frozen_point).wet and is_equal_approx(float(fixture_world.liquid.cells[frozen_key].amount), 3.2), "heat melts the ice collider back to the same water volume")
	await _reset()
	var ice = _spawn("ice-block", Vector2(300, 200))
	ice.wet_seconds = 100.0
	fixture_world.hazards.heat_actor(ice, 1.0)
	_expect(not ice.alive and is_equal_approx(fixture_world.liquid.current_volume(), 5.0), "even wet ice melts into its configured water amount")
	await _reset()
	var launcher = _spawn("flamethrower", Vector2(800, 250))
	_spawn("metal-drum", Vector2(690, 250))
	var shielded_log = _spawn("log", Vector2(600, 250))
	await _physics_steps(2)
	fixture_world.hazards._jet(launcher, false)
	_expect(not shielded_log.burning, "a solid metal shield blocks flame rays")
	await _reset()
	var immune = _spawn("wooden-crate", Vector2(450, 250))
	immune.spec.explosionResistance = 1.0
	var fragile = _spawn("wooden-crate", Vector2(350, 250))
	fragile.spec.explosionResistance = 0.0
	var bomb = _spawn("bomb", Vector2(400, 250))
	bomb.spec.strength = 10.0
	await _physics_steps(2)
	fixture_world.hazards.detonate(bomb)
	_expect(not immune.break_requested and fragile.break_requested, "explosion resistance1 survives and resistance0 obeys a certain blast probability")
	await process_frame
	await _reset()
	var tutorial_crates: Array[ThrowBody] = []
	for p in [Vector2(170, 382), Vector2(228, 382), Vector2(286, 382), Vector2(200, 326), Vector2(258, 326), Vector2(228, 270)]:
		var crate = _spawn("wooden-crate", p)
		crate.set_meta("tutorial_required", 3)
		tutorial_crates.append(crate)
	await _physics_steps(2)
	for hit_index in range(3):
		var tutorial_bomb = _spawn("bomb", Vector2(228, 330))
		await _physics_steps(1)
		fixture_world.hazards.detonate(tutorial_bomb)
		fixture_world.hazards.detonate(tutorial_bomb)
		var all_received = true
		for crate in tutorial_crates:
			all_received = all_received and crate.tutorial_hits == hit_index + 1
		_expect(all_received, "tutorial blast%d reaches every stacked crate only once" % [hit_index + 1])
	await process_frame
	var broken_crates: int = 0
	for item in fixture_world.destroyed:
		if item.id == "wooden-crate" and item.reason == "explosion":
			broken_crates += 1
	_expect(broken_crates == 6, "all six tutorial crates are removed after their third received blast")
	await _reset()
	var firework_floor = StaticBody2D.new()
	firework_floor.collision_layer = 1
	var floor_shape = RectangleShape2D.new()
	floor_shape.size = Vector2(600, 30)
	var floor_collision = CollisionShape2D.new()
	floor_collision.shape = floor_shape
	floor_collision.position = Vector2(400, 345)
	firework_floor.add_child(floor_collision)
	fixture_world.add_child(firework_floor)
	var shell = _spawn("firework-shell", Vector2(400, 240), false)
	shell.age = 1.0
	shell.linear_velocity = Vector2(0, 300)
	fixture_world.hazards.on_launch(shell)
	for i in range(60):
		await physics_frame
		fixture_world.hazards.tick(1.0 / 120.0)
	var shell_impacts = 0
	for entry in fixture_world.impacts:
		if entry.id == "firework-shell":
			shell_impacts += 1
	_expect(shell_impacts > 0 and shell.alive and shell.collision_layer == 2 and not shell.release_triggered, "a launched firework physically hits the floor and remains solid before its fuse expires")
	var surviving_part = _spawn("metal-drum", shell.position + Vector2(70, -35), false)
	surviving_part.spec.explosionResistance = 1.0
	var festival_log = _spawn("log", shell.position + Vector2(-65, -35))
	festival_log.spec.explosionResistance = 1.0
	await _physics_steps(2)
	fixture_world.hazards.tick(float(shell.get_meta("fuse")) - 0.01)
	_expect(shell.alive and not shell.release_triggered, "the firework fuse does not burst early")
	fixture_world.hazards.tick(0.02)
	fixture_world.hazards.detonate(shell)
	_expect(not shell.alive and fixture_world.hazards.explosion_serial == 1 and fixture_world.effects.count("explosion") == 1, "a timed firework creates exactly one explosion after the fuse")
	_expect(festival_log.burning and not fixture_world.hazards.patches.is_empty(), "fireworks reuse flammable-object ignition and finite animated fire patches")
	await _physics_steps(2)
	_expect(is_instance_valid(surviving_part) and surviving_part.linear_velocity.length() > 5.0, "the timed blast pushes a surviving physical garage part")
	for firework_id in ["firework-rocket", "firework-fountain"]:
		await _reset()
		var timed_item = _spawn(firework_id, Vector2(400, 250), false)
		fixture_world.hazards.on_launch(timed_item)
		fixture_world.hazards.impact(timed_item, timed_item.position, 800.0, 100.0)
		_expect(timed_item.alive and not timed_item.release_triggered, "%s survives impact until its own fuse ends" % firework_id)
		fixture_world.hazards.tick(float(timed_item.spec.fuseSeconds) + 0.01)
		_expect(not timed_item.alive and fixture_world.hazards.explosion_serial == 1, "%s bursts on its configured timer" % firework_id)
	await _reset()
	var cell_sponge = _spawn("sponge", Vector2(400, 250))
	var near_key = fixture_world.liquid.key_for(Vector2(400, 250))
	fixture_world.liquid.cells[near_key] = {"amount": 4.0, "frozen": 0.0}
	for i in range(20):
		fixture_world.liquid._affect_bodies()
	_expect(is_equal_approx(float(cell_sponge.get_meta("absorbed", 0.0)), 4.0) and is_zero_approx(fixture_world.liquid.current_volume()), "a sponge absorbs existing finite cells and accounts for their volume")
	fixture_world.liquid.cells[near_key] = {"amount": 4.0, "frozen": 0.0}
	for i in range(40):
		fixture_world.liquid._affect_bodies()
	_expect(is_equal_approx(float(cell_sponge.get_meta("absorbed", 0.0)), 6.0) and is_equal_approx(fixture_world.liquid.current_volume(), 2.0), "a saturated sponge leaves excess cell water intact")
	_expect(is_equal_approx(cell_sponge.mass, float(cell_sponge.record.mass) * 2.0), "a saturated sponge reaches its configured wet mass")
	await _reset({"water": [{"rect": [300, 200, 200, 150], "direction": [1, 0], "speed": 65}]})
	var river_sponge = _spawn("sponge", Vector2(400, 250))
	for i in range(60):
		fixture_world.liquid._affect_bodies()
	_expect(is_equal_approx(float(river_sponge.get_meta("absorbed", 0.0)), 6.0) and is_equal_approx(fixture_world.liquid.region_drawn_volume, 6.0), "river absorption stops at sponge capacity and records the finite amount drawn")
	await _reset({"sources": [{"position": [100, 100], "rateUnitsPerSecond": 2, "maxUnits": 96, "stopAtStoredUnits": 4, "storedRegion": [300, 200, 200, 150]}]})
	fixture_world.liquid.droplets.append(_drop(Vector2(100, 100), Vector2.ZERO))
	fixture_world.liquid.cells[Vector2i(25, 15)] = {"amount": 3.0, "frozen": 0.0}
	fixture_world.liquid.tick(0.0)
	_expect(not fixture_world.liquid.sources[0].stopped, "source threshold excludes falling droplets")
	fixture_world.liquid.cells[Vector2i(25, 15)].amount = 4.0
	fixture_world.liquid.tick(0.0)
	fixture_world.liquid.cells.clear()
	fixture_world.liquid.tick(0.0)
	_expect(fixture_world.liquid.sources[0].stopped and fixture_world.liquid.sources[0].remaining == 96.0, "a filled basin latches its source off even after stored water is removed")
	_expect(float(records["blast-bomb"].physics.radius) > float(records["bomb"].physics.radius) and float(records["blast-bomb"].physics.impulseMultiplier) > 1.0 and not records["bomb"].physics.has("impulseMultiplier"), "the bowling blast bomb has stronger reach and push without modifying ordinary bombs")
	await _reset({"water": [{"rect": [300, 200, 200, 150], "direction": [1, 0], "speed": 65}]})
	var drowned_jet = _spawn("flamethrower", Vector2(400, 250))
	fixture_world.hazards.on_launch(drowned_jet)
	fixture_world.liquid._affect_bodies()
	_expect(drowned_jet.fuel_seconds == 0.0 and drowned_jet.visual.texture.resource_path.ends_with("flamethrower-empty.svg"), "river immersion stops a flamethrower and changes it to its empty texture")
	fixture_world.hazards.on_launch(drowned_jet)
	fixture_world.hazards.heat_actor(drowned_jet, 20.0)
	_expect(drowned_jet.fuel_seconds == 0.0, "an extinguished flamethrower cannot restart from heat or another launch callback")
	await _reset()
	var pooled_jet = _spawn("flamethrower", Vector2(400, 250))
	fixture_world.hazards.on_launch(pooled_jet)
	fixture_world.liquid.cells[fixture_world.liquid.key_for(pooled_jet.position)] = {"amount": 1.0, "frozen": 0.0}
	fixture_world.liquid._affect_bodies()
	_expect(pooled_jet.fuel_seconds == 0.0, "finite pooled water also extinguishes the flame jet")
	var splashed_jet = _spawn("flamethrower", Vector2(700, 250))
	fixture_world.hazards.on_launch(splashed_jet)
	fixture_world.hazards.wet_actor(splashed_jet, 3.0)
	_expect(splashed_jet.fuel_seconds == 0.0, "droplet wetting uses the same permanent flame-jet shutdown path")
	var result = {"engine": Engine.get_version_info().string, "passed": failures.is_empty(), "checks": checks, "failures": failures}
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://previews"))
	var report = FileAccess.open("res://previews/hazard-checks.json", FileAccess.WRITE)
	if report != null:
		report.store_string(JSON.stringify(result, "\t") + "\n")
	else:
		_expect(false, "hazard test report can be written")
	print(JSON.stringify(result))
	fixture_world.queue_free()
	await process_frame
	quit(0 if failures.is_empty() else 1)

func _reset(stage: Dictionary = {}) -> void:
	if is_instance_valid(fixture_world):
		fixture_world.queue_free()
		await process_frame
	fixture_world = InteractionWorld.new()
	fixture_world.rng.seed = 123456
	root.add_child(fixture_world)
	PhysicsServer2D.area_set_param(fixture_world.get_world_2d().space, PhysicsServer2D.AREA_PARAM_GRAVITY, 0.0)
	fixture_world.liquid = LiquidScript.new()
	fixture_world.add_child(fixture_world.liquid)
	fixture_world.liquid.configure(fixture_world, stage)
	fixture_world.hazards = HazardsScript.new()
	fixture_world.add_child(fixture_world.hazards)
	fixture_world.hazards.configure(fixture_world, stage)
	await _physics_steps(2)

func _spawn(id: String, point: Vector2, frozen: bool = true) -> ThrowBody:
	var actor = BodyScript.new()
	actor.configure(records[id], fixture_world)
	actor.position = point
	actor.freeze = frozen
	fixture_world.add_child(actor)
	fixture_world.actors.append(actor)
	return actor

func _drop(point: Vector2, velocity: Vector2) -> Dictionary:
	return {"point": point, "velocity": velocity, "age": 0.0, "volume": 1.0}

func _physics_steps(count: int) -> void:
	for i in range(count):
		await physics_frame

func _expect(condition: bool, description: String) -> void:
	checks.append(description)
	if not condition:
		failures.append(description)
		push_error(description)
