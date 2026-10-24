class_name LiquidField
extends Node2D

const CELL: float = 16.0
const MAX_CELLS: int = 256
const MAX_DROPS: int = 96
const CELL_CAPACITY: float = 4.0
const VOLUME_EPSILON: float = 0.000001
const THIN_FILM_UNITS: float = 1.0 / CELL
const THIN_FILM_SECONDS: float = 0.75
var world: Node2D
var regions: Array = []
var sources: Array = []
var cells: Dictionary = {}
var droplets: Array = []
var ice_bodies: Dictionary = {}
var clock: float = 0.0
var step_accumulator: float = 0.0
var wave_textures: Array[Texture2D] = []
var drop_texture: Texture2D
var ice_texture: Texture2D
var introduced_volume: float = 0.0
var rejected_volume: float = 0.0
var drained_volume: float = 0.0
var absorbed_volume: float = 0.0
var evaporated_volume: float = 0.0
var region_drawn_volume: float = 0.0

func configure(owner_world: Node2D, stage: Dictionary) -> void:
	world = owner_world
	z_index = 5
	for entry in stage.get("water", []):
		regions.append({"rect": GameCatalog.rectangle(entry.rect), "velocity": GameCatalog.vector(entry.get("direction", [0, 0])) * float(entry.get("speed", 0))})
	for entry in stage.get("sources", []):
		sources.append({"point": GameCatalog.vector(entry.position), "rate": float(entry.rateUnitsPerSecond), "remaining": float(entry.maxUnits), "accumulator": 0.0, "stopped": false, "stop_at": float(entry.get("stopAtStoredUnits", -1.0)), "stored_region": GameCatalog.rectangle(entry.get("storedRegion", [0, 0, 960, 540]))})
	wave_textures = [load("res://assets/effects/water-flow-0.svg"), load("res://assets/effects/water-flow-1.svg")]
	drop_texture = load("res://assets/ui/water-drop.svg")
	ice_texture = load("res://assets/effects/ice-tile.svg")

func release(at: Vector2, units: int, spread: float = 1.0) -> void:
	introduced_volume += maxi(units, 0)
	for index in range(units):
		if droplets.size() >= MAX_DROPS:
			# Capacity rejection is explicit; never silently clamp away fluid.
			rejected_volume += 1.0 - add_cell(at, 1.0)
			continue
		var phase = float(index) / maxf(1.0, float(units - 1))
		var angle = lerpf(-PI + 0.16, -0.16, phase)
		var speed = (130.0 + world.rng.randf() * 90.0) * spread
		droplets.append({"point": at, "velocity": Vector2(cos(angle), sin(angle)) * speed, "age": 0.0, "volume": 1.0})
	queue_redraw()

func tick(delta: float) -> void:
	clock += delta
	for source in sources:
		if float(source.stop_at) >= 0.0 and stored_volume(source.stored_region) >= float(source.stop_at):
			source.stopped = true
		if bool(source.stopped) or float(source.remaining) <= 0.0:
			continue
		source.accumulator = minf(float(source.remaining), float(source.accumulator) + delta * float(source.rate))
		while float(source.accumulator) >= 1.0 and float(source.remaining) >= 1.0 and droplets.size() < MAX_DROPS:
			source.accumulator -= 1.0
			source.remaining -= 1.0
			introduced_volume += 1.0
			droplets.append({"point": source.point, "velocity": Vector2(0, 90), "age": 0.0, "volume": 1.0})
	for i in range(droplets.size() - 1, -1, -1):
		var drop: Dictionary = droplets[i]
		drop.age += delta
		drop.velocity.y += world.gravity_value * 0.55 * delta
		var start: Vector2 = drop.point
		var end: Vector2 = start + Vector2(drop.velocity) * delta
		var hit: Dictionary = world.cast_solid(start, end)
		if not hit.is_empty():
			var collider = hit.collider
			var normal: Vector2 = hit.normal
			if normal.length_squared() < 0.01:
				normal = Vector2.UP
			if collider is ThrowBody and collider.behavior == "repel_water":
				drop.velocity = Vector2(drop.velocity).bounce(normal) * float(collider.spec.get("dropletNormalRestitution", 0.65))
				drop.point = Vector2(hit.position) + normal * 3.0
				if float(drop.age) > 8.0:
					if _deposit_drop(drop, drop.point):
						droplets.remove_at(i)
				continue
			if collider is ThrowBody:
				world.hazards.wet_actor(collider, 3.0)
				if collider.behavior == "absorb":
					var absorbed = _absorb(collider, float(drop.volume))
					drop.volume -= absorbed
					if float(drop.volume) <= VOLUME_EPSILON:
						droplets.remove_at(i)
						continue
			world.hazards.extinguish_at(hit.position, 24.0)
			var deposit_at = Vector2(hit.position) + normal * 3.0
			if _deposit_drop(drop, deposit_at):
				droplets.remove_at(i)
			else:
				# Keep unplaced volume in the bounded droplet pool until room opens.
				drop.point = deposit_at
				drop.velocity = Vector2.ZERO
		else:
			drop.point = end
			if end.y > 570.0 or end.x < -40.0 or end.x > 1000.0:
				drained_volume += float(drop.volume)
				droplets.remove_at(i)
			elif float(drop.age) > 8.0:
				if _deposit_drop(drop, end):
					droplets.remove_at(i)
	step_accumulator += delta
	while step_accumulator >= 0.05:
		step_accumulator -= 0.05
		_step_cells(0.05)
		_affect_bodies()
	queue_redraw()

func key_for(point: Vector2) -> Vector2i:
	return Vector2i(floori(point.x / CELL), floori(point.y / CELL))

func center_for(key: Vector2i) -> Vector2:
	return Vector2(key) * CELL + Vector2.ONE * CELL * 0.5

func _deposit_drop(drop: Dictionary, point: Vector2) -> bool:
	if clock < float(drop.get("deposit_retry", 0.0)):
		return false
	drop.volume = maxf(0.0, float(drop.volume) - add_cell(point, float(drop.volume)))
	if float(drop.volume) > VOLUME_EPSILON:
		drop.deposit_retry = clock + 0.1
	return float(drop.volume) <= VOLUME_EPSILON

func add_cell(point: Vector2, amount: float) -> float:
	# Return accepted volume. The caller retains or explicitly rejects the rest.
	var origin = key_for(point)
	var remaining = maxf(0.0, amount)
	var candidates: Array[Vector2i] = [origin]
	for distance in range(1, 4):
		candidates.append(origin + Vector2i(0, -distance))
		for dx in range(-distance, distance + 1):
			for dy in range(-distance, distance + 1):
				if maxi(absi(dx), absi(dy)) == distance and not (dx == 0 and dy == -distance):
					candidates.append(origin + Vector2i(dx, dy))
	for key in candidates:
		if remaining <= VOLUME_EPSILON:
			break
		if key.y < 0 or key.y > 34 or key.x < -1 or key.x > 61:
			continue
		if cells.has(key) and float(cells[key].frozen) > 0.0:
			continue
		if cells.has(key) and float(cells[key].amount) >= CELL_CAPACITY - VOLUME_EPSILON:
			continue
		if not cells.has(key) and cells.size() >= MAX_CELLS:
			continue
		var center = center_for(key)
		# The segment prevents placement through a thin umbrella shaft or hook.
		if world.point_in_solid(center) or not world.cast_solid(point, center).is_empty():
			continue
		if not cells.has(key):
			cells[key] = {"amount": 0.0, "frozen": 0.0}
		var accepted = minf(remaining, maxf(0.0, CELL_CAPACITY - float(cells[key].amount)))
		cells[key].amount += accepted
		if float(cells[key].amount) > THIN_FILM_UNITS:
			cells[key].thin_age = 0.0
		remaining -= accepted
	return maxf(0.0, amount) - remaining

func _can_flow(from: Vector2i, to: Vector2i) -> bool:
	if to.y > 35 or to.x < -2 or to.x > 62:
		return true
	if cells.has(to) and float(cells[to].frozen) > 0.0:
		return false
	var a = center_for(from)
	var b = center_for(to)
	# Segment tests retain thin umbrella shafts and hooks that are narrower than a cell.
	return not world.point_in_solid(b) and world.cast_solid(a, b).is_empty()

func _step_cells(delta: float) -> void:
	for key in cells.keys():
		if not cells.has(key):
			continue
		var cell: Dictionary = cells[key]
		if float(cell.frozen) > 0.0:
			cell.thin_age = 0.0
			cell.frozen -= delta
			if float(cell.frozen) <= 0.0:
				_remove_ice(key)
			continue
		if key.y > 34 or key.x < -1 or key.x > 61:
			drained_volume += float(cell.amount)
			cells.erase(key)
			continue
		if float(cell.amount) > THIN_FILM_UNITS:
			cell.thin_age = 0.0
		var neighbors: Array[Vector2i] = [key + Vector2i.DOWN]
		if (key.x + int(clock * 20.0)) % 2 == 0:
			neighbors.append_array([key + Vector2i.LEFT, key + Vector2i.RIGHT])
		else:
			neighbors.append_array([key + Vector2i.RIGHT, key + Vector2i.LEFT])
		for destination in neighbors:
			if not _can_flow(key, destination):
				continue
			var existing = float(cells.get(destination, {"amount": 0.0}).amount)
			var transfer = minf(float(cell.amount), maxf(0.0, 1.0 - existing))
			if destination.y == key.y:
				transfer = minf(transfer, maxf(0.0, (float(cell.amount) - existing) * 0.25))
			if transfer <= VOLUME_EPSILON or (not cells.has(destination) and cells.size() >= MAX_CELLS):
				continue
			if not cells.has(destination):
				cells[destination] = {"amount": 0.0, "frozen": 0.0}
			cells[destination].amount += transfer
			# Carry the film's age with lateral transport, including newly created
			# cells; otherwise redistribution would keep tiny puddles alive forever.
			if float(cells[destination].amount) <= THIN_FILM_UNITS:
				cells[destination].thin_age = maxf(float(cells[destination].get("thin_age", 0.0)), float(cell.get("thin_age", 0.0)))
			else:
				cells[destination].thin_age = 0.0
			cell.amount -= transfer
		if float(cell.amount) <= VOLUME_EPSILON:
			drained_volume += maxf(0.0, float(cell.amount))
			cells.erase(key)
		else:
			world.hazards.extinguish_at(center_for(key), 18.0)
	_evaporate_thin_films(delta)

func _evaporate_thin_films(delta: float) -> void:
	for key in cells.keys():
		var cell: Dictionary = cells[key]
		var in_river: bool = false
		for region in regions:
			if Rect2(region.rect).has_point(center_for(key)):
				in_river = true
				break
		if float(cell.frozen) > 0.0 or float(cell.amount) > THIN_FILM_UNITS or in_river or _can_flow(key, key + Vector2i.DOWN):
			cell.thin_age = 0.0
			continue
		cell.thin_age = float(cell.get("thin_age", 0.0)) + delta
		if float(cell.thin_age) + VOLUME_EPSILON >= THIN_FILM_SECONDS:
			evaporated_volume += maxf(0.0, float(cell.amount))
			cells.erase(key)

func sample(point: Vector2) -> Dictionary:
	var key = key_for(point)
	if cells.has(key) and float(cells[key].frozen) > 0.0:
		return {"wet": false, "velocity": Vector2.ZERO}
	if cells.has(key) and float(cells[key].frozen) <= 0.0 and float(cells[key].amount) > 0.02:
		return {"wet": true, "velocity": Vector2.ZERO}
	for region in regions:
		if Rect2(region.rect).has_point(point):
			return {"wet": true, "velocity": region.velocity}
	return {"wet": false, "velocity": Vector2.ZERO}

func submerged_point(point: Vector2) -> bool:
	var key = key_for(point)
	if cells.has(key):
		var cell: Dictionary = cells[key]
		if float(cell.frozen) > 0.0:
			return false
		var depth = clampf(float(cell.amount), 0.0, 1.0) * CELL
		var bottom = float(key.y + 1) * CELL
		if depth > 0.0 and point.y >= bottom - depth:
			return true
	for region in regions:
		if Rect2(region.rect).has_point(point):
			return true
	return false

func submerged_fraction(actor: ThrowBody) -> float:
	if regions.is_empty() and cells.is_empty():
		return 0.0
	# Sample the actual rotated collider, excluding empty handles/holes. Equal
	# area samples make half-submerged shells independent of orientation/size.
	var bounds = actor.get_world_bounds()
	var solid_samples: int = 0
	var wet_samples: int = 0
	for row in range(12):
		for column in range(12):
			var point = bounds.position + bounds.size * Vector2((float(column) + 0.5) / 12.0, (float(row) + 0.5) / 12.0)
			if actor.contains_world_point(point):
				solid_samples += 1
				if submerged_point(point):
					wet_samples += 1
	return float(wet_samples) / float(maxi(1, solid_samples))

func _affect_bodies() -> void:
	for actor in world.actors.duplicate():
		if not is_instance_valid(actor) or not actor.alive or actor.behavior == "repel_water":
			continue
		var bounds: Rect2 = actor.get_world_bounds()
		if actor.behavior == "absorb":
			_absorb_surrounding(actor, bounds)
		var points = [actor.global_position, Vector2(bounds.get_center().x, bounds.end.y - 2.0), bounds.position + bounds.size * 0.25, bounds.position + bounds.size * 0.75]
		var fraction: float = 0.0
		var flow = Vector2.ZERO
		for point in points:
			var result = sample(point)
			if result.wet:
				fraction += 0.25
				flow += Vector2(result.velocity) * 0.25
		if fraction <= 0.0:
			continue
		world.hazards.wet_actor(actor, 2.0)
		if bool(actor.spec.get("immersionBreak", false)):
			actor.request_break("water")
			continue
		var response = float(actor.spec.get("flowResponse", 1.0))
		var buoyancy = float(actor.spec.get("buoyancy", 0.45))
		actor.apply_central_impulse((-actor.linear_velocity * 1.2 + Vector2.UP * world.gravity_value * buoyancy) * actor.mass * fraction * 0.05)
		actor.apply_central_impulse(flow * response * actor.mass * 1.4 * 0.05)

func _absorb(actor: ThrowBody, amount: float) -> float:
	var capacity = float(actor.spec.get("capacity", 6.0))
	var held = float(actor.get_meta("absorbed", 0.0))
	var accepted = minf(maxf(amount, 0.0), maxf(0.0, capacity - held))
	if accepted <= VOLUME_EPSILON:
		return 0.0
	actor.set_meta("absorbed", held + accepted)
	absorbed_volume += accepted
	var multiplier = float(actor.spec.get("wetMassMultiplier", 2.0))
	actor.mass = float(actor.record.mass) * (1.0 + maxf(0.0, multiplier - 1.0) * (held + accepted) / maxf(capacity, VOLUME_EPSILON))
	world.hazards.wet_actor(actor, 2.0)
	return accepted

func _absorb_surrounding(actor: ThrowBody, bounds: Rect2) -> void:
	var budget: float = 0.25
	var reach = bounds.grow(CELL * 0.5)
	for key in cells.keys():
		if budget <= VOLUME_EPSILON:
			break
		var cell: Dictionary = cells[key]
		if float(cell.frozen) > 0.0 or not reach.has_point(center_for(key)):
			continue
		var accepted = _absorb(actor, minf(budget, float(cell.amount)))
		cell.amount -= accepted
		budget -= accepted
		if float(cell.amount) <= VOLUME_EPSILON:
			cells.erase(key)
	if budget <= VOLUME_EPSILON:
		return
	# Regions represent persistent river water; account for the finite amount drawn
	# into the sponge without removing the river's flow field.
	for region in regions:
		if bounds.intersects(Rect2(region.rect)):
			var accepted = _absorb(actor, budget)
			region_drawn_volume += accepted
			break

func stored_volume(region: Rect2) -> float:
	var amount: float = 0.0
	for key in cells:
		if region.has_point(center_for(key)):
			amount += float(cells[key].amount)
	return amount

func freeze_near(point: Vector2, radius: float) -> void:
	for key in cells.keys():
		if center_for(key).distance_to(point) <= radius:
			cells[key].frozen = 8.0
			_make_ice(key)
	# Persistent rivers can also form a finite sheet on their surface.
	for region in regions:
		var r: Rect2 = region.rect
		for x in range(floori(r.position.x / CELL), ceili(r.end.x / CELL)):
			var key = Vector2i(x, floori(r.position.y / CELL))
			if center_for(key).distance_to(point) <= radius:
				if cells.has(key):
					cells[key].frozen = 8.0
				elif cells.size() < MAX_CELLS and not world.point_in_solid(center_for(key)):
					cells[key] = {"amount": 1.0, "frozen": 8.0}
					region_drawn_volume += 1.0
				else:
					continue
				_make_ice(key)

func melt_near(point: Vector2, radius: float) -> void:
	for key in cells.keys():
		if float(cells[key].frozen) > 0.0 and center_for(key).distance_to(point) < radius:
			cells[key].frozen = 0.0
			_remove_ice(key)

func ice_friction(point: Vector2) -> float:
	var key = key_for(point)
	for nearby in [key, key + Vector2i.DOWN, key + Vector2i.UP]:
		if cells.has(nearby) and float(cells[nearby].frozen) > 0.0:
			return 0.025
	return -1.0

func _make_ice(key: Vector2i) -> void:
	if ice_bodies.has(key):
		return
	var body = StaticBody2D.new()
	body.position = center_for(key)
	body.collision_layer = 1
	body.collision_mask = 2
	var material = PhysicsMaterial.new()
	material.friction = 0.025
	body.physics_material_override = material
	var shape = RectangleShape2D.new()
	shape.size = Vector2(CELL, CELL)
	var collision = CollisionShape2D.new()
	collision.shape = shape
	body.add_child(collision)
	add_child(body)
	ice_bodies[key] = body

func _remove_ice(key: Vector2i) -> void:
	if ice_bodies.has(key):
		ice_bodies[key].collision_layer = 0
		ice_bodies[key].queue_free()
		ice_bodies.erase(key)

func current_volume() -> float:
	var amount: float = 0.0
	for cell in cells.values():
		amount += float(cell.amount)
	for drop in droplets:
		amount += float(drop.volume)
	return amount

func _draw() -> void:
	if wave_textures.is_empty():
		return
	var wave = wave_textures[int(clock * 6.0) % 2]
	for region in regions:
		var r: Rect2 = region.rect
		draw_rect(r, Color(0.18, 0.63, 0.8, 0.48))
		for x in range(int(r.position.x), int(r.end.x), 32):
			draw_texture_rect(wave, Rect2(x, r.position.y - 4.0, minf(32, r.end.x - x), 22), false, Color(0.7, 0.95, 1.0, 0.8))
	for key in cells:
		var cell: Dictionary = cells[key]
		var p = Vector2(key) * CELL
		var height = clampf(float(cell.amount), 0.0, 1.0) * CELL
		if float(cell.frozen) > 0.0:
			draw_texture_rect(ice_texture, Rect2(p, Vector2.ONE * CELL), false)
		else:
			draw_texture_rect(wave, Rect2(p + Vector2(0, CELL - height), Vector2(CELL, height)), false, Color(0.7, 0.95, 1.0, 0.7))
	for drop in droplets:
		draw_texture_rect(drop_texture, Rect2(Vector2(drop.point) - Vector2(3, 4), Vector2(6, 8)), false)
