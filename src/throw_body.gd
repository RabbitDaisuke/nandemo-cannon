class_name ThrowBody
extends RigidBody2D
## One physical item. Artwork and all collision fixtures share the same SVG origin.
## Hazard lifetimes belong to the world; this node owns contact mechanics only.

var record: Dictionary = {}
var spec: Dictionary = {}
var behavior: String = "solid"
var item_id: String = ""
var world: Node
var alive: bool = true
var visual: Sprite2D
var wet_seconds: float = 0.0
var frozen_seconds: float = 0.0
var burn_seconds: float = 0.0
var burning: bool = false
var fuel_seconds: float = -1.0
var release_triggered: bool = false
var is_launched: bool = false
var tutorial_hits: int = 0
var can_score: bool = true
var age: float = 0.0
var wheel_supported: bool = false
var sole_supported: bool = false
var break_requested: bool = false
var load_force: float = 0.0
var load_seconds: float = 0.0
var water_fraction: float = 0.0
var water_velocity: Vector2 = Vector2.ZERO
var _dry_gravity_scale: float = 1.0
var _dry_linear_damp: float = 0.06

var _source_pivot: Vector2 = Vector2(64.0, 64.0)
var _source_scale: float = 1.0
var _fixture_shapes: Array[Dictionary] = []
var _shape_to_fixture: Array[int] = []
var _wheel_fixtures = PackedInt32Array()
var _sole_fixtures = PackedInt32Array()
var _material: PhysicsMaterial
var _base_friction: float = 0.55
var _previous_velocity: Vector2 = Vector2.ZERO
var _previous_angular_velocity: float = 0.0
var _previous_position: Vector2 = Vector2.ZERO
var _previous_valid: bool = false
var _impact_times: Dictionary = {}
var _contact_last_seen: Dictionary = {}
var _physics_tick: int = 0


func configure(item_record: Dictionary, owner_world: Node) -> void:
	record = item_record.duplicate(true)
	spec = record.get("physics", {}).duplicate(true)
	world = owner_world
	item_id = str(record.get("id", ""))
	behavior = str(record.get("behavior", "solid"))
	name = item_id.replace("-", "_")
	_source_scale = float(record.get("worldScale", 1.0))
	var pivot: Array = record.get("pivotSource", [64.0, 64.0])
	_source_pivot = Vector2(float(pivot[0]), float(pivot[1]))
	mass = maxf(0.1, float(record.get("mass", 1.0)))
	can_score = int(record.get("score", 0)) > 0
	collision_layer = 2
	collision_mask = 3
	contact_monitor = true
	max_contacts_reported = 24
	continuous_cd = RigidBody2D.CCD_MODE_CAST_SHAPE
	linear_damp = 0.06
	angular_damp = 0.12
	_material = PhysicsMaterial.new()
	_base_friction = float(spec.get("friction", 0.55))
	_material.friction = _base_friction
	_material.bounce = float(spec.get("restitution", 0.08))
	_material.rough = false
	physics_material_override = _material
	for child in get_children():
		remove_child(child)
		child.queue_free()
	_fixture_shapes.clear()
	_shape_to_fixture.clear()
	_wheel_fixtures.clear()
	_sole_fixtures.clear()
	for index in spec.get("wheelFixtures", []):
		_wheel_fixtures.append(int(index))
	for index in spec.get("soleFixtures", []):
		_sole_fixtures.append(int(index))
	var fixtures: Array = record.get("fixtures", [])
	for fixture_index in range(fixtures.size()):
		_add_fixture(fixtures[fixture_index], fixture_index)
	visual = Sprite2D.new()
	visual.name = "Artwork"
	visual.centered = false
	visual.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	add_child(visual)
	set_texture_path("res://assets/" + str(record.get("svg", "")))


func _add_fixture(fixture: Dictionary, fixture_index: int) -> void:
	if fixture.has("circle"):
		var circle: Array = fixture["circle"]
		var center = _source_point(Vector2(float(circle[0]), float(circle[1])))
		var radius = float(circle[2]) * _source_scale
		var shape = CircleShape2D.new()
		shape.radius = radius
		_add_shape(shape, center, fixture_index)
		_fixture_shapes.append({"kind": "circle", "center": center, "radius": radius})
		return
	var points = PackedVector2Array()
	if fixture.has("rect"):
		var r: Array = fixture["rect"]
		var x = float(r[0])
		var y = float(r[1])
		var w = float(r[2])
		var h = float(r[3])
		points = PackedVector2Array([
			_source_point(Vector2(x, y)), _source_point(Vector2(x + w, y)),
			_source_point(Vector2(x + w, y + h)), _source_point(Vector2(x, y + h))
		])
	elif fixture.has("polygon"):
		for p in fixture["polygon"]:
			points.append(_source_point(Vector2(float(p[0]), float(p[1]))))
	if points.size() < 3:
		push_error("Invalid fixture in " + item_id)
		return
	_fixture_shapes.append({"kind": "polygon", "points": points})
	var convex_pieces = Geometry2D.decompose_polygon_in_convex(points)
	for piece in convex_pieces:
		var shape = ConvexPolygonShape2D.new()
		shape.points = piece
		_add_shape(shape, Vector2.ZERO, fixture_index)


func _add_shape(shape: Shape2D, shape_position: Vector2, fixture_index: int) -> void:
	var collider = CollisionShape2D.new()
	collider.name = "Fixture_%d_Part_%d" % [fixture_index, _shape_to_fixture.size()]
	collider.shape = shape
	collider.position = shape_position
	add_child(collider)
	_shape_to_fixture.append(fixture_index)


func _source_point(point: Vector2) -> Vector2:
	return (point - _source_pivot) * _source_scale


func set_texture_path(resource_path: String, source_viewbox: Array = []) -> void:
	if not is_instance_valid(visual):
		return
	var texture = load(resource_path) as Texture2D
	if texture == null:
		push_error("Missing item texture: " + resource_path)
		return
	visual.texture = texture
	var viewbox: Array = source_viewbox
	if viewbox.is_empty():
		viewbox = record.get("viewBox", [0.0, 0.0, 128.0, 128.0])
		# Current variants keep the source crop. A full-grid replacement is also safe.
		if texture.get_width() == 128 and texture.get_height() == 128:
			viewbox = [0.0, 0.0, 128.0, 128.0]
	visual.position = _source_point(Vector2(float(viewbox[0]), float(viewbox[1])))
	visual.scale = Vector2(float(viewbox[2]), float(viewbox[3])) * _source_scale / texture.get_size()


func set_visual_state(resource_path: String) -> void:
	set_texture_path(resource_path)


func apply_cooling(seconds: float) -> void:
	frozen_seconds = maxf(frozen_seconds, seconds)
	burning = false
	sleeping = false


func apply_wetting(seconds: float) -> void:
	if behavior == "repel_water" or bool(spec.get("repelWater", false)):
		return
	wet_seconds = maxf(wet_seconds, seconds)
	burning = false
	# Wetting is a material state, not a collision. Repeated contact with still
	# water must not keep settled bodies awake or manufacture motion.


func set_water_state(fraction: float, velocity: Vector2) -> void:
	var previously_wet = water_fraction > 0.0
	water_fraction = clampf(fraction, 0.0, 1.0)
	water_velocity = velocity
	if water_fraction > 0.0 and not previously_wet:
		_dry_gravity_scale = gravity_scale
		_dry_linear_damp = linear_damp
	if water_fraction > 0.0 or previously_wet:
		# Native gravity/damping cooperate with the contact solver and sleeping;
		# an apply_force every tick would continually wake a supported body.
		var gravity = _dry_gravity_scale * (1.0 - float(spec.get("buoyancy", 0.45)) * water_fraction)
		var damping = _dry_linear_damp + 1.2 * water_fraction
		if not is_equal_approx(gravity_scale, gravity):
			gravity_scale = gravity
		if not is_equal_approx(linear_damp, damping):
			linear_damp = damping
	var response = maxf(0.0, float(spec.get("flowResponse", 1.0)))
	# Actual current and buoyant lift can wake a sleeper; still water around a
	# heavy supported object cannot. Forces themselves run at the physics rate.
	if water_fraction > 0.0 and (velocity.length_squared() * response > 1.0 or float(spec.get("buoyancy", 0.45)) * water_fraction > 1.0):
		sleeping = false


func request_break(reason: String) -> void:
	if not alive or break_requested:
		return
	break_requested = true
	# Finish outside the physics callback so contents can be released before removal.
	call_deferred("_complete_break", reason)


func _complete_break(reason: String) -> void:
	if not alive or not is_instance_valid(world):
		return
	if "hazards" in world:
		var hazards = world.get("hazards")
		if is_instance_valid(hazards) and hazards.has_method("on_actor_break"):
			hazards.on_actor_break(self, reason)
	if alive and world.has_method("destroy_actor"):
		world.destroy_actor(self, reason)


func _supports_load_break() -> bool:
	return behavior in ["breakable", "water_release"] or is_frozen_rubber()

func is_frozen_rubber() -> bool:
	return frozen_seconds > 0.0 and bool(spec.get("coldBrittle", str(record.get("material", "")) == "rubber"))


func _physics_process(delta: float) -> void:
	age += delta
	if _supports_load_break() and load_seconds > 0.0 and not break_requested:
		# A body may otherwise sleep before a sustained-load timer reaches its limit.
		sleeping = false
	if not is_instance_valid(visual):
		return
	if frozen_seconds > 0.0:
		visual.modulate = Color(0.66, 0.9, 1.0, 1.0)
	elif burning:
		visual.modulate = Color(1.0, 0.76, 0.57, 1.0)
	elif wet_seconds > 0.0:
		visual.modulate = Color(0.78, 0.88, 0.98, 1.0)
	else:
		visual.modulate = Color.WHITE


func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
	if not alive or break_requested:
		return
	if water_fraction > 0.0 and not water_velocity.is_zero_approx():
		var response = maxf(0.0, float(spec.get("flowResponse", 1.0)))
		state.linear_velocity += water_velocity * response * (1.0 - exp(-1.2 * water_fraction * state.step))
	_physics_tick += 1
	var upper_load: float = 0.0
	var special_friction: float = -1.0
	var grip_contacts: Array[Dictionary] = []
	var local_up = -state.transform.y.normalized()
	var gravity_dir = Vector2.DOWN
	if state.total_gravity.length_squared() > 0.01:
		gravity_dir = state.total_gravity.normalized()
	wheel_supported = false
	sole_supported = false
	for i in range(state.get_contact_count()):
		var shape_index = state.get_contact_local_shape(i)
		var fixture_index = _shape_to_fixture[shape_index] if shape_index >= 0 and shape_index < _shape_to_fixture.size() else -1
		# Godot stores these contact positions and normals in world coordinates.
		var point = state.get_contact_local_position(i)
		var normal = state.get_contact_local_normal(i).normalized()
		var normal_impulse = absf(state.get_contact_impulse(i).dot(normal))
		var collider = state.get_contact_collider_object(i)
		var other_velocity = state.get_contact_collider_velocity_at_position(i)
		var own_velocity = state.get_contact_local_velocity_at_position(i)
		var normal_speed = maxf(0.0, -(own_velocity - other_velocity).dot(normal))
		var key = "%s:%s:%s" % [state.get_contact_collider_id(i), state.get_contact_collider_shape(i), fixture_index]
		var new_contact = int(_contact_last_seen.get(key, -100)) < _physics_tick - 1
		_contact_last_seen[key] = _physics_tick
		if new_contact and _previous_valid:
			var offset_before = point - _previous_position
			var own_before = _previous_velocity + Vector2(-offset_before.y, offset_before.x) * _previous_angular_velocity
			normal_speed = maxf(normal_speed, -(own_before - other_velocity).dot(normal))
		var inverse_effective_mass = _inverse_effective_mass(state, point, normal, collider)
		var impact_energy = 0.5 * pow(normal_speed / 100.0, 2.0) / maxf(inverse_effective_mass, 0.0001)
		if age >= 0.15 and normal_speed >= 35.0 and age - float(_impact_times.get(key, -10.0)) > 0.16:
			_impact_times[key] = age
			if is_instance_valid(world) and world.has_method("on_actor_impact"):
				world.call_deferred("on_actor_impact", self, point, normal_speed, impact_energy)
			if is_frozen_rubber():
				if normal_speed >= float(spec.get("frozenImpactSpeed", 100.0)) and impact_energy >= float(spec.get("frozenImpactEnergy", 2.0)):
					request_break("frozen-impact")
			elif behavior == "breakable" and normal_speed >= float(spec.get("impactSpeed", 180.0)) and impact_energy >= float(spec.get("minImpactEnergy", 12.0)):
				request_break("impact")
		# Only pressure from above is counted; the floor's opposing support is excluded.
		upper_load += normal_impulse * maxf(0.0, normal.dot(gravity_dir)) / maxf(state.step, 0.0001)
		var surface_friction: float = -1.0
		if is_instance_valid(world) and world.has_method("surface_friction_at"):
			surface_friction = float(world.call("surface_friction_at", point))
		if normal.dot(-gravity_dir) > 0.1:
			if surface_friction >= 0.0:
				special_friction = surface_friction if special_friction < 0.0 else minf(special_friction, surface_friction)
			if behavior == "wheeled" and _wheel_fixtures.has(fixture_index) and normal.dot(local_up) >= float(spec.get("normalMinDot", 0.55)):
				wheel_supported = true
			if behavior == "grip_sole" and _sole_fixtures.has(fixture_index) and normal.dot(local_up) >= float(spec.get("soleNormalMinDot", 0.6)):
				sole_supported = true
				if surface_friction >= 0.0 and surface_friction <= 0.05:
					grip_contacts.append({"point": point, "normal": normal, "impulse": normal_impulse, "other": collider, "other_velocity": other_velocity, "surface_friction": surface_friction})
	var friction = _base_friction
	if behavior == "wheeled":
		friction = float(spec.get("rollingFriction", 0.025)) if wheel_supported else float(spec.get("invertedFriction", _base_friction))
	if special_friction >= 0.0:
		friction = minf(friction, special_friction)
	if frozen_seconds > 0.0 or (behavior == "slippery" and wet_seconds > 0.0):
		friction = minf(friction, 0.025)
	_material.friction = friction
	_material.bounce = 0.0 if is_frozen_rubber() else float(spec.get("restitution", 0.08))
	for grip in grip_contacts:
		_apply_sole_grip(state, grip)
	var smoothing = 1.0 - exp(-state.step / 0.055)
	load_force = lerpf(load_force, upper_load, smoothing)
	if _supports_load_break() and age >= 0.15:
		var threshold = float(spec.get("frozenLoadThreshold", 3000.0)) if is_frozen_rubber() else float(spec.get("loadForceThreshold", 7840.0))
		if load_force >= threshold:
			load_seconds += state.step
		elif load_force < threshold * float(spec.get("loadReleaseRatio", 0.8)):
			load_seconds = 0.0
		if load_seconds >= float(spec.get("loadHoldSeconds", 0.4)):
			request_break("load")
	_previous_velocity = state.linear_velocity
	_previous_angular_velocity = state.angular_velocity
	_previous_position = state.transform.origin
	_previous_valid = true
	# Remove expired keys so repeated stage play cannot grow contact bookkeeping.
	if _physics_tick % 120 == 0:
		for key in _contact_last_seen.keys():
			if _physics_tick - int(_contact_last_seen[key]) > 120:
				_contact_last_seen.erase(key)
				_impact_times.erase(key)


func _inverse_effective_mass(state: PhysicsDirectBodyState2D, point: Vector2, axis: Vector2, collider: Object) -> float:
	var offset = point - state.transform.origin - state.center_of_mass
	var own_cross = offset.cross(axis)
	var inverse: float = state.inverse_mass + own_cross * own_cross * state.inverse_inertia
	if collider is RigidBody2D and not collider.freeze:
		var other_state = PhysicsServer2D.body_get_direct_state(collider.get_rid())
		if other_state != null:
			var other_cross = (point - other_state.transform.origin - other_state.center_of_mass).cross(axis)
			inverse += other_state.inverse_mass + other_cross * other_cross * other_state.inverse_inertia
		else:
			inverse += 1.0 / maxf(collider.mass, 0.1)
	return inverse


func _apply_sole_grip(state: PhysicsDirectBodyState2D, contact: Dictionary) -> void:
	var normal: Vector2 = contact["normal"]
	var point: Vector2 = contact["point"]
	var tangent = Vector2(-normal.y, normal.x)
	var offset = point - state.transform.origin
	var own_velocity = state.linear_velocity + Vector2(-offset.y, offset.x) * state.angular_velocity
	var other_velocity: Vector2 = contact["other_velocity"]
	var relative_tangent_speed = (own_velocity - other_velocity).dot(tangent)
	var inverse = _inverse_effective_mass(state, point, tangent, contact["other"])
	if inverse <= 0.0:
		return
	var additional_friction = maxf(0.0, float(spec.get("soleIceFriction", 0.95)) - float(contact["surface_friction"]))
	var impulse_limit = additional_friction * float(contact["impulse"])
	var tangent_impulse = clampf(-relative_tangent_speed / inverse, -impulse_limit, impulse_limit)
	var impulse = tangent * tangent_impulse
	state.apply_impulse(impulse, offset)
	var other: Object = contact["other"]
	if other is RigidBody2D and not other.freeze:
		other.apply_impulse(-impulse, point - other.global_position)


func get_world_outline() -> PackedVector2Array:
	var result = PackedVector2Array()
	for fixture in _fixture_shapes:
		if fixture["kind"] == "circle":
			var center = to_global(fixture["center"])
			var radius: float = fixture["radius"]
			# Extrema in world axes keep scoring exact even when the circle is rotated.
			result.append(center + Vector2(radius, 0.0))
			result.append(center + Vector2(-radius, 0.0))
			result.append(center + Vector2(0.0, radius))
			result.append(center + Vector2(0.0, -radius))
		else:
			for point in fixture["points"]:
				result.append(to_global(point))
	return result


func get_world_bounds() -> Rect2:
	var outline = get_world_outline()
	if outline.is_empty():
		return Rect2(global_position, Vector2.ZERO)
	var bounds = Rect2(outline[0], Vector2.ZERO)
	for point in outline:
		bounds = bounds.expand(point)
	return bounds


func contains_world_point(point: Vector2) -> bool:
	var local_point = to_local(point)
	for fixture in _fixture_shapes:
		if fixture["kind"] == "circle":
			if local_point.distance_squared_to(fixture["center"]) <= pow(float(fixture["radius"]), 2.0):
				return true
		elif Geometry2D.is_point_in_polygon(local_point, fixture["points"]):
			return true
	return false


func touches_world_rect(rect: Rect2) -> bool:
	# Contact tests use the real rotated fixtures, including holes and handles.
	# A small numerical tolerance catches an adjoining surface without granting
	# absorbers an invisible suction radius around their bounding box.
	var contact_rect = rect.grow(0.15)
	if not get_world_bounds().intersects(contact_rect, true):
		return false
	var corners = PackedVector2Array([contact_rect.position, Vector2(contact_rect.end.x, contact_rect.position.y), contact_rect.end, Vector2(contact_rect.position.x, contact_rect.end.y)])
	for fixture in _fixture_shapes:
		if fixture["kind"] == "circle":
			var center = to_global(fixture["center"])
			var nearest = Vector2(clampf(center.x, contact_rect.position.x, contact_rect.end.x), clampf(center.y, contact_rect.position.y, contact_rect.end.y))
			if center.distance_squared_to(nearest) <= pow(float(fixture["radius"]), 2.0):
				return true
		else:
			var polygon = PackedVector2Array()
			for point in fixture["points"]:
				polygon.append(to_global(point))
			if not Geometry2D.intersect_polygons(polygon, corners).is_empty():
				return true
	return false
