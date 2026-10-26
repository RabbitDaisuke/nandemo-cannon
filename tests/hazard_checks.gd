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
	await _mobile_source_checks()
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
	await _physics_steps(4)
	_expect(absf(desk.linear_velocity.x) < 0.01 and barrel.linear_velocity.x > 1.0, "water current moves a barrel while a flow-immune table stays unpushed")
	barrel.linear_velocity = Vector2(200, 0)
	fixture_world.liquid._affect_bodies()
	await _physics_steps(4)
	_expect(barrel.linear_velocity.x < 199.0, "water drag reduces a fast body's velocity")
	await _reset()
	var accepted = fixture_world.liquid.add_cell(Vector2(200, 200), 9.75)
	_expect(is_equal_approx(accepted, 9.75) and is_equal_approx(fixture_world.liquid.current_volume(), 9.75), "cell overflow is distributed without silently deleting water")
	for i in range(45):
		fixture_world.liquid._step_cells(0.05)
	_expect(absf(fixture_world.liquid.current_volume() + fixture_world.liquid.drained_volume + fixture_world.liquid.evaporated_volume - 9.75) < 0.0001, "flow accounts for volume including explicit drainage and evaporation")
	await _reset({"sources": [{"position": [100, 100], "rateUnitsPerSecond": 1000, "maxUnits": 3}]})
	fixture_world.liquid.tick(1.0)
	_expect(fixture_world.liquid.sources[0].remaining == 0.0 and fixture_world.liquid.introduced_volume == 3.0, "a source never emits beyond its remaining budget")
	await _reset()
	for y in range(16):
		for x in range(16):
			fixture_world.liquid.cells[Vector2i(x, y)] = {"amount": 4.0, "frozen": 0.0}
	fixture_world.liquid.release(Vector2(400, 300), 512)
	_expect(fixture_world.liquid.cells.size() <= 256 and fixture_world.liquid.droplets.size() <= 96, "liquid allocations stay within both finite caps")
	_expect(is_equal_approx(fixture_world.liquid.current_volume() + fixture_world.liquid.rejected_volume + fixture_world.liquid.evaporated_volume, 1536.0), "capacity overflow is reported as rejection rather than hidden loss")
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
	var iceberg = _spawn("iceberg", Vector2(300, 200))
	iceberg.wet_seconds = 100.0
	fixture_world.hazards.heat_actor(iceberg, 1.0)
	_expect(not iceberg.alive and is_equal_approx(fixture_world.liquid.current_volume(), 12.0), "the selection-only iceberg melts once into twelve water units")
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
	cell_sponge.spec.capacity = 6.0
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
	river_sponge.spec.capacity = 6.0
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
	await _reset()
	var stove = _spawn("tabletop-stove", Vector2(400, 300))
	var emitter = fixture_world.hazards._stove_emitter(stove)
	var upper_log = _spawn("log", emitter + Vector2(0, -20))
	var lower_log = _spawn("log", Vector2(400, 400))
	await _physics_steps(2)
	fixture_world.hazards._heat_contacts()
	_expect(upper_log.burning and not lower_log.burning, "tabletop stove heats its upper burner surface rather than its underside")
	for i in range(800):
		fixture_world.hazards.tick(1.0 / 120.0)
	_expect(stove.alive and fixture_world.hazards._stove_active(stove), "tabletop stove keeps its burner active beyond a flamethrower fuel lifetime")
	fixture_world.hazards.wet_actor(stove, 2.0)
	_expect(not stove.break_requested and not fixture_world.hazards._stove_active(stove), "a splash suppresses stove heat without falsely treating it as submerged")
	await _reset({"water": [{"rect": [300, 200, 200, 160], "direction": [0, 0], "speed": 0}]})
	var submerged_stove = _spawn("tabletop-stove", Vector2(400, 250))
	fixture_world.liquid._affect_bodies()
	await process_frame
	_expect(fixture_world.actors.is_empty() and fixture_world.destroyed[-1].reason == "water", "submerging a tabletop stove permanently destroys it")
	await _reset()
	var lightning_floor = StaticBody2D.new()
	lightning_floor.collision_layer = 1
	var lightning_shape = RectangleShape2D.new()
	lightning_shape.size = Vector2(900, 40)
	var lightning_collider = CollisionShape2D.new()
	lightning_collider.shape = lightning_shape
	lightning_floor.position = Vector2(450, 420)
	lightning_floor.add_child(lightning_collider)
	fixture_world.add_child(lightning_floor)
	var magic = _spawn("lightning-orb", Vector2(400, 200))
	fixture_world.hazards.on_launch(magic)
	await _physics_steps(2)
	fixture_world.hazards.impact(magic, magic.position, 200, 30)
	_expect(magic.alive and not magic.release_triggered, "lightning magic remains a colliding object before its fuse ends")
	fixture_world.hazards.tick(float(magic.spec.fuseSeconds) + 0.01)
	_expect(fixture_world.hazards.explosion_serial == 1 and fixture_world.hazards.lightning_bolts.size() == 1, "lightning creates one localized bolt and one explosion")
	_expect(fixture_world.hazards.patches.size() > 0 and absf(float(fixture_world.hazards.patches[0].point.y) - 397.0) < 1.0, "lightning fire is placed on real terrain below the projectile")
	fixture_world.hazards.tick(3.5)
	_expect(fixture_world.hazards.patches.is_empty() and fixture_world.hazards.lightning_bolts.is_empty(), "lightning visuals and ground fire expire without a permanent heat source")
	await _reset()
	var film_shell = _spawn("bomb", Vector2(400, 250))
	fixture_world.hazards.on_launch(film_shell)
	var shell_bounds = film_shell.get_world_bounds()
	for y in range(floori(shell_bounds.position.y / 16.0), ceili(shell_bounds.end.y / 16.0)):
		for x in range(floori(shell_bounds.position.x / 16.0), ceili(shell_bounds.end.x / 16.0)):
			fixture_world.liquid.cells[Vector2i(x, y)] = {"amount": 1.0 / 16.0, "frozen": 0.0}
	_expect(fixture_world.liquid.submerged_fraction(film_shell) < 0.2, "one-pixel films intersecting a shell occupy only their visible depth, not entire grid cells")
	fixture_world.hazards.tick(0.01)
	_expect(not bool(film_shell.get_meta("water_dud", false)), "thin cell films do not falsely disarm a shell as half submerged")
	fixture_world.liquid.cells.clear()
	var water_surface = shell_bounds.get_center().y - 2.0
	for y in range(floori(water_surface / 16.0), ceili(shell_bounds.end.y / 16.0)):
		for x in range(floori(shell_bounds.position.x / 16.0), ceili(shell_bounds.end.x / 16.0)):
			fixture_world.liquid.cells[Vector2i(x, y)] = {"amount": clampf((float(y + 1) * 16.0 - water_surface) / 16.0, 0.0, 1.0), "frozen": 0.0}
	var half_depth = fixture_world.liquid.submerged_fraction(film_shell)
	_expect(half_depth >= 0.5 and half_depth < 0.7, "a finite-cell water surface just above the shell center covers approximately half its real collider")
	fixture_world.hazards.tick(0.01)
	_expect(bool(film_shell.get_meta("water_dud", false)), "real half-depth cell immersion disarms the ordinary bomb")
	await _reset({"water": [{"rect": [0, 200, 960, 340], "direction": [0, 0], "speed": 0}]})
	fixture_world.liquid.cells[Vector2i(25, 16)] = {"amount": 1.0, "frozen": 2.0}
	_expect(not fixture_world.liquid.submerged_point(Vector2(408, 264)), "frozen cell water overrides the underlying river for immersion coverage")
	var partial = _spawn("bomb", Vector2(150, 178))
	fixture_world.hazards.on_launch(partial)
	_expect(fixture_world.liquid.submerged_fraction(partial) < 0.5, "less than half immersion stays below the dud threshold")
	fixture_world.hazards.tick(0.01)
	_expect(not bool(partial.get_meta("water_dud", false)) and partial.has_meta("fuse"), "a light splash or shallow immersion does not disarm a bomb")
	for id in ["bomb", "blast-bomb", "gunpowder-barrel", "firework-rocket"]:
		var submerged = _spawn(id, Vector2(300, 260))
		fixture_world.hazards.on_launch(submerged)
		fixture_world.hazards.impact(submerged, submerged.position, 150.0, 100.0)
		fixture_world.hazards.tick(0.01)
		_expect(submerged.alive and bool(submerged.get_meta("water_dud", false)) and not submerged.has_meta("fuse"), "%s becomes an intact dud underwater before impact/fuse detonation" % id)
		_expect(submerged.can_score and int(submerged.record.score) >= 100, "%s dud becomes a scoring object" % id)
		submerged.position = Vector2(300, 80)
		submerged.wet_seconds = 0.0
		fixture_world.hazards.heat_actor(submerged, 1.0)
		fixture_world.hazards.on_launch(submerged)
		fixture_world.hazards.detonate(submerged)
		_expect(submerged.alive and not submerged.has_meta("fuse"), "%s stays disarmed after drying, heat and re-launch" % id)
	_expect(fixture_world.hazards.explosion_serial == 0, "ordinary submerged explosives produce no blast")
	for id in ["waterproof-bomb", "strong-waterproof-bomb", "torpedo"]:
		await _reset({"water": [{"rect": [0, 150, 960, 390], "direction": [0, 0], "speed": 0}]})
		var waterproof = _spawn(id, Vector2(300, 260))
		fixture_world.hazards.on_launch(waterproof)
		fixture_world.hazards.tick(0.01)
		_expect(not bool(waterproof.get_meta("water_dud", false)) and not waterproof.can_score, "%s keeps its fuse and does not become a scoring dud" % id)
		fixture_world.hazards.detonate(waterproof)
		_expect(not waterproof.alive and fixture_world.hazards.explosion_serial == 1, "%s explodes underwater" % id)
	await _reset()
	_add_static_rect(Rect2(0, 400, 960, 140))
	await _physics_steps(2)
	var film_key = Vector2i(25, 24)
	fixture_world.liquid.cells[film_key] = {"amount": 0.05, "frozen": 0.0}
	for i in range(13):
		fixture_world.liquid._step_cells(0.05)
	_expect(fixture_world.liquid.current_volume() > 0.049 and is_zero_approx(fixture_world.liquid.evaporated_volume), "a subpixel floor film remains for its short grace period")
	for i in range(7):
		fixture_world.liquid._step_cells(0.05)
	_expect(fixture_world.liquid.current_volume() < 0.0001 and fixture_world.liquid.evaporated_volume > 0.049, "thin water spread across newly created floor cells evaporates without resetting its age")
	_expect(absf(fixture_world.liquid.current_volume() + fixture_world.liquid.evaporated_volume + fixture_world.liquid.drained_volume - 0.05) < 0.0001, "evaporated film volume remains in the water balance")
	await _reset()
	_add_static_rect(Rect2(0, 400, 960, 140))
	_add_static_rect(Rect2(384, 360, 16, 40))
	_add_static_rect(Rect2(416, 360, 16, 40))
	await _physics_steps(2)
	fixture_world.liquid.cells[film_key] = {"amount": 0.5, "frozen": 0.0}
	for i in range(20):
		fixture_world.liquid._step_cells(0.05)
	_expect(is_equal_approx(fixture_world.liquid.current_volume(), 0.5) and is_zero_approx(fixture_world.liquid.evaporated_volume), "thick supported water does not evaporate under the thin-film rule")
	fixture_world.liquid.cells[film_key] = {"amount": 0.05, "frozen": 2.0}
	for i in range(20):
		fixture_world.liquid._step_cells(0.05)
	_expect(is_equal_approx(fixture_world.liquid.current_volume(), 0.05) and is_zero_approx(fixture_world.liquid.evaporated_volume), "a frozen thin cell keeps its water volume")
	fixture_world.liquid.cells[film_key] = {"amount": 0.04, "frozen": 0.0}
	for i in range(13):
		fixture_world.liquid._step_cells(0.05)
	fixture_world.liquid.add_cell(fixture_world.liquid.center_for(film_key), 0.1)
	fixture_world.liquid._step_cells(0.2)
	fixture_world.liquid.cells[film_key].amount = 0.04
	fixture_world.liquid._step_cells(0.2)
	_expect(is_equal_approx(fixture_world.liquid.current_volume(), 0.04) and is_zero_approx(fixture_world.liquid.evaporated_volume), "fresh supply that thickens a film resets its evaporation delay")
	fixture_world.liquid._step_cells(0.6)
	_expect(is_zero_approx(fixture_world.liquid.current_volume()) and is_equal_approx(fixture_world.liquid.evaporated_volume, 0.04), "the renewed film evaporates only after its new thin interval")
	await _reset()
	fixture_world.liquid.cells[Vector2i(25, 4)] = {"amount": 0.05, "frozen": 0.0}
	var falling_film = _drop(Vector2(550, 60), Vector2(0, 90))
	falling_film.volume = 0.03
	fixture_world.liquid.droplets.append(falling_film)
	for i in range(20):
		fixture_world.liquid.tick(0.05)
	_expect(is_equal_approx(fixture_world.liquid.current_volume(), 0.08) and is_zero_approx(fixture_world.liquid.evaporated_volume) and fixture_world.liquid.droplets.size() == 1, "falling thin cells and airborne droplets are retained")
	await _reset({"water": [{"rect": [300, 350, 200, 50], "direction": [1, 0], "speed": 40}]})
	_add_static_rect(Rect2(0, 400, 960, 140))
	_add_static_rect(Rect2(384, 360, 16, 40))
	_add_static_rect(Rect2(416, 360, 16, 40))
	await _physics_steps(2)
	fixture_world.liquid.cells[film_key] = {"amount": 0.05, "frozen": 0.0}
	for i in range(20):
		fixture_world.liquid._step_cells(0.05)
	_expect(is_equal_approx(fixture_world.liquid.current_volume(), 0.05) and fixture_world.liquid.sample(Vector2(408, 392)).wet and is_zero_approx(fixture_world.liquid.evaporated_volume), "river water is excluded from thin-film evaporation")
	await _check_water_balance()
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

func _check_water_balance() -> void:
	_expect(float(records.sponge.physics.capacity) == 24.0 and float(records.towel.physics.capacity) == 12.0, "sponge and towel capacities counter one large jug and one water balloon respectively")
	for id in ["sponge", "towel"]:
		await _reset()
		var absorber = _spawn(id, Vector2(400, 250))
		absorber.rotation = PI / 4.0
		var bounds = absorber.get_world_bounds()
		# A corner lies inside the rotated AABB but outside the actual cloth.
		var dry_corner = Rect2(bounds.position, Vector2(1, 1))
		fixture_world.liquid.regions = [{"rect": dry_corner, "velocity": Vector2.ZERO}]
		fixture_world.liquid._affect_bodies()
		_expect(is_zero_approx(float(absorber.get_meta("absorbed", 0.0))), "%s cannot absorb water through the empty corner of its rotated bounding box" % id)
		fixture_world.liquid.regions = [{"rect": Rect2(300, 200, 200, 150), "velocity": Vector2.ZERO}]
		for i in range(100):
			fixture_world.liquid._affect_bodies()
		var capacity = float(absorber.spec.capacity)
		_expect(is_equal_approx(float(absorber.get_meta("absorbed", 0.0)), capacity), "%s absorbs contacting water until its own capacity and then stops" % id)
		_expect(is_equal_approx(fixture_world.liquid.region_drawn_volume, capacity) and is_equal_approx(fixture_world.liquid.absorbed_volume, capacity), "%s absorption records exactly the volume removed" % id)
		_expect(is_equal_approx(absorber.mass, float(absorber.record.mass) * 2.0), "%s saturates at twice its dry mass" % id)
		await _reset()
		var almost_full = _spawn(id, Vector2(400, 250))
		fixture_world.liquid._absorb(almost_full, capacity - 0.25)
		await _physics_steps(2)
		fixture_world.liquid.droplets.append(_drop(Vector2(350, 250), Vector2(1000, 0)))
		fixture_world.liquid.tick(0.07)
		_expect(is_equal_approx(float(almost_full.get_meta("absorbed", 0.0)), capacity) and is_equal_approx(fixture_world.liquid.current_volume(), 0.75), "%s absorbs only its remaining capacity from a real contacting droplet and preserves the excess" % id)
	await _reset({"water": [{"rect": [300, 200, 200, 150], "finite": true}]})
	var pool = fixture_world.liquid.regions[0]
	var initial_volume = fixture_world.liquid.current_volume()
	var sponge = _spawn("sponge", Vector2(400, 300))
	for i in range(100):
		fixture_world.liquid._affect_bodies()
	_expect(is_equal_approx(initial_volume - fixture_world.liquid.current_volume(), 24.0) and Rect2(pool.rect).position.y > 200.0, "a finite pool loses the sponge's absorbed volume and visibly lowers its water surface")
	_expect(is_equal_approx(fixture_world.liquid.current_volume() + fixture_world.liquid.absorbed_volume, fixture_world.liquid.introduced_volume) and is_zero_approx(fixture_world.liquid.region_drawn_volume), "finite pool absorption conserves water without an imaginary replenishing supply")
	fixture_world.liquid.freeze_near(Rect2(pool.rect).position + Vector2(40, 0), 30.0)
	_expect(is_equal_approx(fixture_world.liquid.current_volume() + fixture_world.liquid.absorbed_volume, initial_volume), "freezing a finite pool transfers its volume into ice without creating extra water")
	await _reset({"water": [{"rect": [390, 245, 16, 16], "finite": true}]})
	_spawn("sponge", Vector2(400, 250))
	for i in range(10):
		fixture_world.liquid._affect_bodies()
	_expect(is_zero_approx(fixture_world.liquid.current_volume()) and not fixture_world.liquid.sample(Vector2(400, 250)).wet, "a fully absorbed finite pool has no invisible remaining water")
	await _reset()
	var thin_barrel = _spawn("barrel", Vector2(400, 220))
	var thin_bounds = thin_barrel.get_world_bounds()
	var key = fixture_world.liquid.key_for(Vector2(400, thin_bounds.end.y - 2.0))
	fixture_world.liquid.cells[key] = {"amount": 0.05, "frozen": 0.0}
	fixture_world.liquid._affect_bodies()
	_expect(thin_barrel.water_fraction < 0.02, "a thin water film does not turn one bounding-box point into 25 percent immersion")
	await _reset({"water": [{"rect": [0, 0, 960, 400], "direction": [0, 0], "speed": 0}]})
	fixture_world.gravity_value = 980.0
	PhysicsServer2D.area_set_param(fixture_world.get_world_2d().space, PhysicsServer2D.AREA_PARAM_GRAVITY, 980.0)
	_add_static_rect(Rect2(0, 400, 960, 30))
	var resting = _spawn("barrel", Vector2(400, 350), false)
	for i in range(420):
		if i % 6 == 0:
			fixture_world.liquid._affect_bodies()
		await _physics_steps(1)
	var settled_at = resting.position
	var settled_impacts = fixture_world.impacts.size()
	for i in range(120):
		if i % 6 == 0:
			fixture_world.liquid._affect_bodies()
		await _physics_steps(1)
	_expect(resting.sleeping and resting.position.distance_to(settled_at) < 0.05, "a heavy body settles and sleeps in still water without slow contact-induced drift")
	_expect(fixture_world.impacts.size() == settled_impacts and absf(resting.linear_velocity.x) < 0.01, "still water does not repeatedly create impact events or horizontal movement")
	fixture_world.liquid.regions[0].velocity = Vector2(65, 0)
	fixture_world.liquid._affect_bodies()
	_expect(not resting.sleeping, "a real current can wake a submerged body after still water allowed it to settle")
	fixture_world.liquid.regions.clear()
	fixture_world.liquid._affect_bodies()
	_expect(is_zero_approx(resting.water_fraction) and resting.water_velocity == Vector2.ZERO, "leaving the water clears its drag and flow state")
	_expect(is_equal_approx(resting.gravity_scale, 1.0) and is_equal_approx(resting.linear_damp, 0.06), "leaving water restores the original gravity and damping without wet paralysis")

func _mobile_source_checks() -> void:
	await _reset()
	var fountain = _spawn("stone-fountain", Vector2(400, 240))
	var source: Dictionary = fountain.spec.waterSource
	var interval = 1.0 / float(source.rateUnitsPerSecond)
	var liquid = fixture_world.liquid
	liquid._tick_actor_sources(interval + 0.001)
	var outlet = fountain.to_global(fountain._source_point(GameCatalog.vector(source.position)))
	_expect(liquid.droplets.size() == 1 and Vector2(liquid.droplets[0].point).is_equal_approx(outlet) and not fountain.contains_world_point(outlet), "the fountain emits real water outside its solid nozzle")
	var remaining = float(fountain.get_meta("source_remaining"))
	fountain.frozen_seconds = 2.0
	liquid._tick_actor_sources(interval * 2.0)
	_expect(float(fountain.get_meta("source_remaining")) == remaining and liquid.droplets.size() == 1, "freezing the fountain stops its finite supply without consuming or refilling it")
	fountain.frozen_seconds = 0.0
	fountain.position += Vector2(60, 0)
	fountain.rotation = PI / 2.0
	liquid._tick_actor_sources(interval)
	var moved_outlet = fountain.to_global(fountain._source_point(GameCatalog.vector(source.position)))
	_expect(liquid.droplets.size() == 2 and Vector2(liquid.droplets[-1].point).is_equal_approx(moved_outlet) and Vector2(liquid.droplets[-1].velocity).x > 0.0, "the source follows the moving and rotating body's actual outlet")
	liquid._tick_actor_sources(float(source.maxUnits) * interval)
	liquid._tick_actor_sources(10.0)
	_expect(is_equal_approx(liquid.introduced_volume, float(source.maxUnits)) and is_zero_approx(float(fountain.get_meta("source_remaining"))), "the fountain stops at its reservoir cap and cannot create unlimited water")
	var removed = _spawn("stone-fountain", Vector2(600, 240))
	fixture_world.destroy_actor(removed, "test")
	liquid._tick_actor_sources(10.0)
	_expect(is_equal_approx(liquid.introduced_volume, float(source.maxUnits)), "a destroyed fountain cannot continue producing water")
	var matches = _spawn("burning-matchbox", Vector2(200, 200))
	fixture_world.hazards.on_launch(matches)
	_expect(matches.fuel_seconds > 0.0, "the burning matchbox uses the existing animated finite flame")
	fixture_world.hazards.wet_actor(matches, 3.0)
	_expect(matches.alive and matches.fuel_seconds == 0.0 and matches.visual.texture.resource_path.ends_with("burning-matchbox-depleted.svg"), "water leaves an extinguished matchbox with its own depleted texture")
	fixture_world.hazards.on_launch(matches)
	_expect(matches.fuel_seconds == 0.0, "extinguished matches cannot regain fuel")

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

func _add_static_rect(bounds: Rect2) -> void:
	var body = StaticBody2D.new()
	body.collision_layer = 1
	body.position = bounds.get_center()
	var shape = RectangleShape2D.new()
	shape.size = bounds.size
	var collider = CollisionShape2D.new()
	collider.shape = shape
	body.add_child(collider)
	fixture_world.add_child(body)

func _physics_steps(count: int) -> void:
	for i in range(count):
		await physics_frame

func _expect(condition: bool, description: String) -> void:
	checks.append(description)
	if not condition:
		failures.append(description)
		push_error(description)
