class_name HazardSystem
extends Node2D

var world: Node2D
var patches: Array = []
var surface_zones: Array = []
var visual_clock: float = 0.0
var contact_accumulator: float = 0.0
var fire_frames: Array[Texture2D] = []
var jet_frames: Array[Texture2D] = []
var ice_frames: Array[Texture2D] = []
var explosion_serial: int = 0
var lightning_frames: Array[Texture2D] = []
var lightning_bolts: Array[Dictionary] = []

func configure(owner_world: Node2D, stage: Dictionary) -> void:
	world = owner_world
	z_index = 7
	patches.clear()
	surface_zones.clear()
	fire_frames.clear()
	jet_frames.clear()
	ice_frames.clear()
	lightning_frames.clear()
	lightning_bolts.clear()
	for frame in range(6):
		fire_frames.append(load("res://assets/effects/fire-%d.svg" % frame))
		jet_frames.append(load("res://assets/effects/flame-jet-%d.svg" % frame))
	for frame in range(4):
		ice_frames.append(load("res://assets/effects/ice-burst-%d.svg" % frame))
	for frame in range(3):
		lightning_frames.append(load("res://assets/effects/lightning-%d.svg" % frame))
	for entry in stage.get("surfaceZones", []):
		var zone: Dictionary = entry.duplicate(true)
		zone["bounds"] = GameCatalog.rectangle(zone.rect)
		zone["wet_seconds"] = 0.0
		surface_zones.append(zone)
		if zone.get("initialState", "") == "burning":
			var r: Rect2 = zone.bounds
			for x in range(int(r.position.x + 12), int(r.end.x), 32):
				add_fire(Vector2(x, r.position.y - 3), 23.0, float(zone.get("burnSeconds", 4.0)), bool(zone.get("heatSource", false)), true)

func on_launch(actor: ThrowBody) -> void:
	if bool(actor.get_meta("water_dud", false)):
		return
	match actor.behavior:
		"flame_jet", "cold_jet", "fuel_light", "campfire":
			if bool(actor.get_meta("fuel_depleted", false)):
				return
			actor.fuel_seconds = float(actor.spec.get("durationSeconds", 6.0))
			if actor.behavior == "campfire":
				actor.set_texture_path("res://assets/effects/campfire-charred.svg")
		"explosion":
			if not actor.has_meta("fuse"):
				var fuse_range: Array = actor.spec.get("fuseRangeSeconds", [])
				if fuse_range.size() == 2:
					var minimum = maxf(0.0, float(fuse_range[0]))
					var maximum = maxf(minimum, float(fuse_range[1]))
					actor.set_meta("fuse", world.rng.randf_range(minimum, maximum))
				else:
					actor.set_meta("fuse", float(actor.spec.get("fuseSeconds", 2.8)))
		"firework", "lightning":
			# The shell remains a normal colliding RigidBody2D until this fuse ends.
			actor.set_meta("fuse", float(actor.spec.get("fuseSeconds", 2.2)))

func impact(actor: ThrowBody, point: Vector2, speed: float, _energy: float) -> void:
	if not is_instance_valid(actor) or not actor.alive or actor.release_triggered:
		return
	var threshold = float(actor.spec.get("breakImpactSpeed", actor.spec.get("impactSpeed", 95.0)))
	if actor.behavior == "explosion" and speed >= 35.0 and bool(actor.spec.get("detonateOnImpact", true)):
		detonate(actor)
	elif actor.behavior == "water_release" and speed >= threshold:
		_release_water(actor, point)
		world.destroy_actor(actor, "water")
	elif actor.behavior == "ignite_on_break" and speed >= threshold:
		actor.release_triggered = true
		ignite_area(point, float(actor.spec.get("fireRadius", 58.0)), actor)
		for dx in [-35.0, 0.0, 35.0]:
			add_fire(point + Vector2(dx, -8), 30.0, 4.0)
		world.destroy_actor(actor, "fire")
	elif actor.behavior == "cold_release" and speed >= threshold:
		actor.release_triggered = true
		cool_area(point, float(actor.spec.get("coldRadius", 82.0)), actor)
		world.spawn_effect("ice-burst", point, 1.6)
		world.destroy_actor(actor, "ice")
	elif actor.behavior == "extinguisher" and speed >= 35.0 and actor.fuel_seconds < 0.0:
		actor.fuel_seconds = float(actor.spec.get("durationSeconds", 4.0))

func on_actor_break(actor: ThrowBody, _reason: String) -> void:
	# Load, explosion and burning shell failure share the same one-shot contents.
	if actor.alive and actor.behavior == "water_release":
		_release_water(actor, actor.global_position)

func _release_water(actor: ThrowBody, point: Vector2) -> void:
	if actor.release_triggered:
		return
	actor.release_triggered = true
	world.liquid.release(point, int(actor.spec.get("waterUnits", actor.spec.get("releaseUnits", 12))))
	world.spawn_effect("splash", point, 1.3)

func tick(delta: float) -> void:
	visual_clock += delta
	for i in range(lightning_bolts.size() - 1, -1, -1):
		lightning_bolts[i].time -= delta
		if float(lightning_bolts[i].time) <= 0.0:
			lightning_bolts.remove_at(i)
	for zone in surface_zones:
		zone.wet_seconds = maxf(0.0, float(zone.wet_seconds) - delta)
	for i in range(patches.size() - 1, -1, -1):
		var patch: Dictionary = patches[i]
		if not patch.source and (not patch.initial or world.shots_fired > 0):
			patch.time -= delta
		if float(patch.time) <= 0.0:
			patches.remove_at(i)
	for actor in world.actors.duplicate():
		if not is_instance_valid(actor) or not actor.alive:
			continue
		actor.wet_seconds = maxf(0.0, actor.wet_seconds - delta)
		actor.frozen_seconds = maxf(0.0, actor.frozen_seconds - delta)
		_disarm_if_submerged(actor)
		if actor.frozen_seconds > 0.0:
			actor.visual.modulate = Color(0.65, 0.9, 1.0)
		elif actor.wet_seconds > 0.0:
			actor.visual.modulate = Color(0.73, 0.85, 0.92)
		elif actor.burning:
			actor.visual.modulate = Color(1.0, 0.65, 0.35)
		elif bool(actor.get_meta("water_dud", false)):
			actor.visual.modulate = Color(0.58, 0.72, 0.80)
		else:
			actor.visual.modulate = Color.WHITE
		if actor.fuel_seconds > 0.0:
			actor.fuel_seconds = maxf(0.0, actor.fuel_seconds - delta)
			if actor.fuel_seconds <= 0.00001:
				_deplete_fuel(actor)
		if actor.burning:
			actor.burn_seconds -= delta
			if actor.burn_seconds <= 0.0:
				on_actor_break(actor, "burned")
				world.destroy_actor(actor, "burned")
				continue
		if actor.has_meta("fuse") and not actor.release_triggered:
			actor.set_meta("fuse", float(actor.get_meta("fuse")) - delta)
			if float(actor.get_meta("fuse")) <= 0.0:
				detonate(actor)
		if actor.behavior == "water_release" and actor.item_id == "watering-can" and not actor.release_triggered and actor.age > 0.2 and absf(wrapf(actor.rotation, -PI, PI)) > 1.1:
			impact(actor, actor.global_position + Vector2(-24, -12).rotated(actor.rotation), 200.0, 0.0)
	contact_accumulator += delta
	if contact_accumulator >= 0.1:
		contact_accumulator -= 0.1
		_heat_contacts()
	queue_redraw()

func _heat_contacts() -> void:
	# Heat can add another floor patch. New patches participate on the next step.
	for patch in patches.duplicate():
		ignite_area(patch.point, float(patch.radius), null, 0.1)
	for actor in world.actors.duplicate():
		if not is_instance_valid(actor) or not actor.alive:
			continue
		if actor.burning:
			ignite_area(actor.global_position, maxf(32.0, actor.get_world_bounds().size.length() * 0.45), actor, 0.1)
		if actor.fuel_seconds > 0.0:
			match actor.behavior:
				"flame_jet":
					_jet(actor, false)
				"cold_jet", "extinguisher":
					_jet(actor, true)
				"campfire", "fuel_light":
					ignite_area(_fuel_fire_emitter(actor), float(actor.spec.get("fireRadius", 40)), actor, 0.1)
		if actor.behavior == "ice_mass":
			cool_area(actor.global_position, float(actor.spec.get("coldRadius", 30)), actor, false)
		if _stove_active(actor):
			var emitter = _stove_emitter(actor)
			var half_span = float(actor.spec.get("burnerWidth", 90.0)) * float(actor.record.worldScale) * 0.35
			for offset in [-half_span, 0.0, half_span]:
				var point = emitter + Vector2(offset, -8.0).rotated(actor.rotation)
				ignite_area(point, float(actor.spec.get("fireRadius", 24.0)), actor, 0.25)

func _fuel_fire_emitter(actor: ThrowBody) -> Vector2:
	if not actor.spec.has("fireSource"):
		return actor.global_position
	var source = GameCatalog.vector(actor.spec.fireSource)
	var pivot = GameCatalog.vector(actor.record.get("pivotSource", [64, 64]))
	return actor.to_global((source - pivot) * float(actor.record.worldScale))

func _fuel_fire_width(actor: ThrowBody) -> float:
	if actor.spec.has("fireVisualWidth"):
		return maxf(0.0, float(actor.spec.fireVisualWidth) * float(actor.record.worldScale))
	return clampf(actor.get_world_bounds().size.x * 0.9, 30.0, 92.0)

func _stove_active(actor: ThrowBody) -> bool:
	return actor.behavior == "stove" and actor.alive and not actor.break_requested and actor.wet_seconds <= 0.0 and actor.frozen_seconds <= 0.0

func _stove_emitter(actor: ThrowBody) -> Vector2:
	var source = GameCatalog.vector(actor.spec.get("burnerSource", [64, 24]))
	var pivot = GameCatalog.vector(actor.record.get("pivotSource", [64, 64]))
	return actor.to_global((source - pivot) * float(actor.record.worldScale))

func _line_clear(start: Vector2, end: Vector2, source: ThrowBody, target: ThrowBody = null, mask: int = 3) -> bool:
	var exclude: Array[RID] = []
	if is_instance_valid(source):
		exclude.append(source.get_rid())
	if is_instance_valid(target):
		exclude.append(target.get_rid())
	return world.cast_solid(start, end, exclude, mask).is_empty()

func heat_actor(actor: ThrowBody, heat: float) -> void:
	if not actor.alive:
		return
	# Water on an ice block must not permanently prevent that ice from melting.
	if actor.behavior == "ice_mass":
		actor.set_meta("melt_heat", float(actor.get_meta("melt_heat", 0.0)) + heat)
		if float(actor.get_meta("melt_heat")) >= 0.8 and not actor.release_triggered:
			actor.release_triggered = true
			world.liquid.release(actor.global_position, int(actor.spec.get("meltToWaterUnits", 5)), 0.35)
			world.destroy_actor(actor, "water")
		return
	if actor.frozen_seconds > 0.0:
		actor.frozen_seconds = maxf(0.0, actor.frozen_seconds - heat * 6.0)
		return
	if actor.wet_seconds > 0.0:
		actor.wet_seconds = maxf(0.0, actor.wet_seconds - heat * 2.0)
		return
	if actor.behavior in ["campfire", "fuel_light"]:
		# These use a single finite fuel supply, not a second independent burn clock.
		return
	if actor.behavior in ["explosion", "firework"] and not bool(actor.get_meta("water_dud", false)) and not actor.spec.has("fuseRangeSeconds"):
		actor.set_meta("fuse", minf(float(actor.get_meta("fuse", 0.8)), 0.8))
	if not bool(actor.spec.get("flammable", false)) or actor.burning:
		return
	actor.burning = true
	if actor.burn_seconds <= 0.0:
		actor.burn_seconds = float(actor.spec.get("burnSeconds", 4.0))

func ignite_area(at: Vector2, radius: float, source: ThrowBody = null, heat: float = 0.2) -> void:
	for actor in world.actors.duplicate():
		if not is_instance_valid(actor) or not actor.alive or actor == source:
			continue
		var bounds: Rect2 = actor.get_world_bounds()
		var nearest = Vector2(clampf(at.x, bounds.position.x, bounds.end.x), clampf(at.y, bounds.position.y, bounds.end.y))
		if nearest.distance_to(at) <= radius and _line_clear(at, actor.global_position, source, actor):
			heat_actor(actor, heat)
	world.liquid.melt_near(at, radius)
	for zone in surface_zones:
		if not bool(zone.get("flammable", false)) or float(zone.wet_seconds) > 0.0:
			continue
		var r: Rect2 = zone.bounds
		var nearest = Vector2(clampf(at.x, r.position.x, r.end.x), r.position.y - 3.0)
		if nearest.distance_to(at) <= radius and _line_clear(at, nearest, source):
			add_fire(nearest, 26.0, float(zone.get("burnSeconds", 5.0)))

func add_fire(at: Vector2, radius: float, seconds: float, persistent: bool = false, initial: bool = false) -> void:
	for patch in patches:
		if Vector2(patch.point).distance_to(at) < 25.0:
			return
	if patches.size() >= 48:
		return
	patches.append({"point": at, "radius": radius, "time": seconds, "source": persistent, "initial": initial})

func wet_actor(actor: ThrowBody, seconds: float) -> void:
	if actor.behavior == "repel_water":
		return
	actor.apply_wetting(seconds)
	_put_out_actor(actor)

func _deplete_fuel(actor: ThrowBody) -> void:
	actor.fuel_seconds = 0.0
	actor.set_meta("fuel_depleted", true)
	if actor.spec.has("depletedSprite"):
		actor.set_texture_path("res://assets/" + str(actor.spec.depletedSprite))
	elif actor.spec.has("charredSprite"):
		actor.set_texture_path("res://assets/" + str(actor.spec.charredSprite))

func _put_out_actor(actor: ThrowBody) -> void:
	actor.burning = false
	if actor.behavior == "flame_jet" or (actor.behavior in ["campfire", "fuel_light"] and actor.fuel_seconds > 0.0):
		_deplete_fuel(actor)

func extinguish_at(at: Vector2, radius: float) -> void:
	for i in range(patches.size() - 1, -1, -1):
		var patch: Dictionary = patches[i]
		if not patch.source and Vector2(patch.point).distance_to(at) < radius:
			patches.remove_at(i)
	for zone in surface_zones:
		if Rect2(zone.bounds).grow(radius).has_point(at):
			zone.wet_seconds = 3.0

func cool_area(at: Vector2, radius: float, source: ThrowBody = null, freeze_water: bool = true) -> void:
	extinguish_at(at, radius)
	for actor in world.actors.duplicate():
		if not is_instance_valid(actor) or not actor.alive or actor == source:
			continue
		if actor.global_position.distance_to(at) <= radius + actor.get_world_bounds().size.length() * 0.25 and _line_clear(at, actor.global_position, source, actor):
			actor.apply_cooling(8.0)
			_put_out_actor(actor)
	if freeze_water:
		world.liquid.freeze_near(at, radius)

func _jet(actor: ThrowBody, cold: bool) -> void:
	var length = float(actor.spec.get("range", 150.0))
	var anchor_data: Array = actor.spec.get("emissionAnchor", [6, 55])
	var origin = actor.to_global((GameCatalog.vector(anchor_data) - Vector2(64, 64)) * float(actor.record.worldScale))
	var direction = Vector2.LEFT.rotated(actor.rotation)
	var center_length = length
	for angle in [-0.14, -0.07, 0.0, 0.07, 0.14]:
		var end = origin + direction.rotated(angle) * length
		var exclude: Array[RID] = [actor.get_rid()]
		var hit: Dictionary = world.cast_solid(origin, end, exclude)
		if not hit.is_empty():
			end = hit.position
			if hit.collider is ThrowBody:
				if cold:
					if actor.behavior == "cold_jet":
						hit.collider.apply_cooling(4.0)
					_put_out_actor(hit.collider)
				else:
					heat_actor(hit.collider, 0.3)
		if angle == 0.0:
			center_length = origin.distance_to(end)
		if cold:
			extinguish_at(end, 28.0)
			if actor.behavior == "cold_jet":
				world.liquid.freeze_near(end, 20.0)
		else:
			ignite_area(end, 18.0, actor, 0.15)
	actor.set_meta("jet_length", maxf(8.0, center_length))

func _disarm_if_submerged(actor: ThrowBody) -> bool:
	if bool(actor.get_meta("water_dud", false)):
		return true
	if actor.behavior not in ["explosion", "firework", "lightning"] or bool(actor.spec.get("waterproofExplosive", false)):
		return false
	if world.liquid.submerged_fraction(actor) < 0.5:
		return false
	actor.set_meta("water_dud", true)
	if actor.has_meta("fuse"):
		actor.remove_meta("fuse")
	actor.burning = false
	actor.can_score = true
	actor.record.score = maxi(100, int(actor.record.get("score", 0)))
	actor.visual.modulate = Color(0.58, 0.72, 0.80)
	return true

func detonate(actor: ThrowBody) -> void:
	if not actor.alive or actor.release_triggered:
		return
	# Check at the actual trigger too: an impact may precede the water tick.
	if _disarm_if_submerged(actor):
		return
	actor.release_triggered = true
	var origin = actor.global_position
	if actor.behavior == "lightning":
		var strike_exclusions: Array[RID] = [actor.get_rid()]
		var ground = world.cast_solid(origin, Vector2(origin.x, 1000.0), strike_exclusions, 1)
		if not ground.is_empty():
			origin = Vector2(ground.position) + Vector2.UP * 3.0
		lightning_bolts.append({"point": origin, "variant": world.rng.randi_range(0, 2), "time": 0.24})
		ignite_area(origin, float(actor.spec.get("fireRadius", 80.0)), actor, 0.4)
		for dx in [-30.0, 0.0, 30.0]:
			var ray_start = origin + Vector2(dx, -8.0)
			var floor_hit = world.cast_solid(ray_start, ray_start + Vector2(0, 120), strike_exclusions, 1)
			if not floor_hit.is_empty():
				add_fire(Vector2(floor_hit.position) + Vector2.UP * 3.0, 26.0, float(actor.spec.get("fireSeconds", 3.0)))
	var radius = float(actor.spec.get("radius", 130.0))
	var strength = float(actor.spec.get("strength", 1.0))
	explosion_serial += 1
	world.spawn_effect("explosion", origin, radius / 34.0)
	if actor.behavior == "firework":
		ignite_area(origin, float(actor.spec.get("fireRadius", 80.0)), actor, 0.4)
		for dx in [-24.0, 0.0, 24.0]:
			add_fire(origin + Vector2(dx, -5.0), 24.0, float(actor.spec.get("fireSeconds", 1.4)))
	for target in world.actors.duplicate():
		if not is_instance_valid(target) or not target.alive or target == actor:
			continue
		var offset = target.global_position - origin
		var distance = maxf(0.0, offset.length() - target.get_world_bounds().size.length() * 0.2)
		# Blast reaches every crate in the pile; terrain still blocks it. Heat rays
		# retain full solid-body occlusion so pans and walls continue to shield fire.
		if distance > radius or not _line_clear(origin, target.global_position, actor, target, 1):
			continue
		var attenuation = clampf(1.0 - distance / radius, 0.0, 1.0)
		var tutorial_required = int(target.get_meta("tutorial_required", 0))
		if bool(actor.spec.get("blastOnly", false)):
			# Pressure-only charges push bodies without consuming destruction RNG.
			pass
		elif tutorial_required > 0:
			# The explicitly documented tutorial exception: three received blasts.
			target.tutorial_hits += 1
			target.visual.modulate = Color(1.0, 1.0 - float(target.tutorial_hits) * 0.2, 0.65)
			if target.tutorial_hits >= tutorial_required:
				target.request_break("explosion")
		else:
			var resistance = clampf(float(target.spec.get("explosionResistance", 0.0)), 0.0, 1.0)
			if target.is_frozen_rubber():
				resistance = minf(resistance, 0.1)
			var probability = clampf(strength * (1.0 - resistance) * attenuation, 0.0, 1.0)
			if world.rng.randf() < probability:
				target.request_break("explosion")
		# Explosions push all survivors. Tutorial barriers receive a smaller kick so repeated hits remain possible.
		var impulse_scale = 75.0 if tutorial_required > 0 and not bool(actor.spec.get("blastOnly", false)) else 300.0 * float(actor.spec.get("impulseMultiplier", 1.0))
		target.apply_central_impulse(offset.normalized() * (impulse_scale * attenuation * minf(target.mass, 8.0)))
	world.destroy_actor(actor, "exploded")

func _draw() -> void:
	if fire_frames.is_empty() or world == null:
		return
	var frame = int(visual_clock * 12.0) % 6
	for bolt in lightning_bolts:
		var end: Vector2 = bolt.point
		var top = minf(80.0, end.y - 12.0)
		draw_texture_rect(lightning_frames[int(bolt.variant)], Rect2(end.x - 30, top, 60, end.y - top), false)
	for patch in patches:
		draw_texture_rect(fire_frames[frame], Rect2(Vector2(patch.point) - Vector2(24, 48), Vector2(48, 52)), false)
	for actor in world.actors:
		if not is_instance_valid(actor) or not actor.alive:
			continue
		if actor.behavior == "firework" and actor.has_meta("fuse") and not actor.release_triggered:
			var fuse_point = actor.to_global(Vector2(0.0, -actor.get_world_bounds().size.y * 0.45))
			draw_texture_rect(fire_frames[frame], Rect2(fuse_point - Vector2(5, 14), Vector2(10, 16)), false)
		if _stove_active(actor):
			var emitter = _stove_emitter(actor)
			var span = float(actor.spec.get("burnerWidth", 90.0)) * float(actor.record.worldScale)
			draw_set_transform(emitter, actor.rotation)
			for offset in [-span * 0.3, 0.0, span * 0.3]:
				draw_texture_rect(fire_frames[frame], Rect2(offset - 12, -30, 24, 32), false)
			draw_set_transform(Vector2.ZERO)
		if actor.burning:
			var width = clampf(actor.get_world_bounds().size.x * 0.9, 30.0, 92.0)
			draw_texture_rect(fire_frames[frame], Rect2(actor.global_position - Vector2(width * 0.5, width), Vector2(width, width)), false)
		elif actor.fuel_seconds > 0.0 and actor.behavior in ["campfire", "fuel_light"]:
			var width = _fuel_fire_width(actor)
			var emitter = _fuel_fire_emitter(actor)
			if actor.spec.has("fireSource"):
				draw_set_transform(emitter, actor.rotation)
				draw_texture_rect(fire_frames[frame], Rect2(Vector2(-width * 0.5, -width), Vector2(width, width)), false)
				draw_set_transform(Vector2.ZERO)
			else:
				draw_texture_rect(fire_frames[frame], Rect2(emitter - Vector2(width * 0.5, width), Vector2(width, width)), false)
		if actor.fuel_seconds > 0.0 and actor.behavior in ["flame_jet", "cold_jet", "extinguisher"]:
			var anchor = GameCatalog.vector(actor.spec.get("emissionAnchor", [6, 55]))
			var origin = actor.to_global((anchor - Vector2(64, 64)) * float(actor.record.worldScale))
			var length = float(actor.get_meta("jet_length", actor.spec.get("range", 150)))
			draw_set_transform(origin, actor.rotation)
			var tint = Color.WHITE if actor.behavior == "flame_jet" else Color(0.48, 0.88, 1.0)
			var texture = jet_frames[frame] if actor.behavior == "flame_jet" else ice_frames[frame % 4]
			draw_texture_rect(texture, Rect2(-length, -21, length, 42), false, tint)
			draw_set_transform(Vector2.ZERO)
