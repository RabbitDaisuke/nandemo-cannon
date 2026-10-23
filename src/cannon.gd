class_name AimCannon
extends Node2D
## A fixed carriage and independent elevation joint, with separate artwork pieces.

signal fired(direction: Vector2, power: float, origin: Vector2)
signal aim_changed(elevation: float, power: float)
signal aim_dragged

const PIVOT_OFFSET = Vector2(0.0, -55.0)
const MUZZLE_LOCAL = Vector2(-104.0, 0.0)
const MIN_ELEVATION = 5.0
const MAX_ELEVATION = 85.0
const MIN_POWER = 0.15
const CLICK_SLOP = 7.0
const SHOT_INTERVAL = 0.45

var elevation_degrees: float = 35.0
var power: float = 0.65
var enabled: bool = true
var _joint: Node2D
var _barrel: Sprite2D
var _parts: Array[Sprite2D] = []
var _hover_material: ShaderMaterial
var _art_group: CanvasGroup
var _grabbed: bool = false
var _dragged: bool = false
var _pointer_id: int = -1
var _press_position: Vector2
var _press_elevation: float = 35.0
var _press_power: float = 0.65
var _last_touch_msec: int = -10000
var _cooldown: float = 0.0
var _recoil: float = 0.0
var _hovered: bool = false


func _ready() -> void:
	_ensure_visuals()
	_update_pose()


func configure(ground_position: Vector2) -> void:
	position = ground_position
	_ensure_visuals()
	_update_pose()


func _part(file_name: String, at: Vector2, parent: Node) -> Sprite2D:
	var part = Sprite2D.new()
	var source = "res://assets/cannon/" + file_name
	var generated = source.get_basename() + ".webp"
	part.texture = load(generated if ResourceLoader.exists(generated) else source) as Texture2D
	part.centered = false
	part.position = at
	part.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	parent.add_child(part)
	_parts.append(part)
	return part


func _ensure_visuals() -> void:
	if is_instance_valid(_joint):
		return
	var shader = Shader.new()
	# CanvasGroup composites first, so the outline never follows part seams.
	# https://docs.godotengine.org/en/stable/classes/class_canvasgroup.html
	shader.code = """shader_type canvas_item;
render_mode unshaded;
uniform sampler2D screen_texture : hint_screen_texture, repeat_disable, filter_nearest;
uniform bool selected = false;
void fragment() {
	vec4 pixel = textureLod(screen_texture, SCREEN_UV, 0.0);
	if (pixel.a > 0.0001) pixel.rgb /= pixel.a;
	vec2 step_uv = SCREEN_PIXEL_SIZE * 2.0;
	float edge = max(max(textureLod(screen_texture, SCREEN_UV + vec2(step_uv.x, 0.0), 0.0).a,
		textureLod(screen_texture, SCREEN_UV - vec2(step_uv.x, 0.0), 0.0).a),
		max(textureLod(screen_texture, SCREEN_UV + vec2(0.0, step_uv.y), 0.0).a,
		textureLod(screen_texture, SCREEN_UV - vec2(0.0, step_uv.y), 0.0).a));
	if (selected && pixel.a < 0.1 && edge > 0.1) pixel = vec4(1.0, 0.83, 0.32, edge);
	COLOR *= pixel;
}"""
	_hover_material = ShaderMaterial.new()
	_hover_material.shader = shader
	_art_group = CanvasGroup.new()
	_art_group.name = "AssembledCannon"
	_art_group.fit_margin = 4.0
	_art_group.clear_margin = 4.0
	_art_group.material = _hover_material
	add_child(_art_group)
	_part("base.svg", Vector2(-51.0, -78.0), _art_group)
	_joint = Node2D.new()
	_joint.name = "ElevationJoint"
	_joint.position = PIVOT_OFFSET
	_art_group.add_child(_joint)
	_barrel = _part("barrel.svg", Vector2(-104.0, -25.0), _joint)
	_part("trunnion.svg", PIVOT_OFFSET - Vector2(13.0, 13.0), _art_group)


func set_enabled(value: bool) -> void:
	enabled = value
	if not value:
		_grabbed = false
		_dragged = false
		_pointer_id = -1
		_hovered = false
	_update_highlight()


func set_aim(new_elevation: float, new_power: float) -> void:
	elevation_degrees = clampf(new_elevation, MIN_ELEVATION, MAX_ELEVATION)
	power = clampf(new_power, MIN_POWER, 1.0)
	_update_pose()
	aim_changed.emit(elevation_degrees, power)


func _update_pose() -> void:
	if not is_instance_valid(_joint):
		return
	_joint.rotation = deg_to_rad(elevation_degrees)
	_barrel.position = Vector2(-104.0 + _recoil, -25.0)


func visual_snapshot() -> Array:
	var result: Array = []
	for part in _parts:
		result.append({"texture": part.texture.resource_path, "position": [part.global_position.x, part.global_position.y], "rotation": part.global_rotation, "scale": [part.global_scale.x, part.global_scale.y]})
	return result


func pivot_global() -> Vector2:
	return to_global(PIVOT_OFFSET)


func get_launch_direction() -> Vector2:
	if is_instance_valid(_joint):
		return (_joint.global_transform.basis_xform(Vector2.LEFT)).normalized()
	return Vector2.LEFT.rotated(global_rotation + deg_to_rad(elevation_degrees))


func get_muzzle() -> Vector2:
	if is_instance_valid(_joint):
		return _joint.to_global(MUZZLE_LOCAL + Vector2(_recoil, 0.0))
	return pivot_global() + get_launch_direction() * 104.0


func fire() -> void:
	if not enabled or _cooldown > 0.0:
		return
	# Resolve the origin before recoil: it is the same visible muzzle as this frame.
	var origin = get_muzzle()
	var direction = get_launch_direction()
	_cooldown = SHOT_INTERVAL
	fired.emit(direction, power, origin)
	_recoil = 10.0
	_update_pose()


func _process(delta: float) -> void:
	_cooldown = maxf(0.0, _cooldown - delta)
	_recoil = move_toward(_recoil, 0.0, delta * 45.0)
	_update_pose()
	if not _grabbed:
		_hovered = enabled and _hit_test(get_global_mouse_position())
	_update_highlight()


func _hit_test(world_position: Vector2) -> bool:
	var p = to_local(world_position)
	# Deliberately restricted to the carriage and independently rotated barrel.
	if Rect2(-51.0, -57.0, 150.0, 57.0).has_point(p):
		return true
	if is_instance_valid(_joint):
		return Rect2(-104.0 + _recoil, -25.0, 144.0, 50.0).has_point(_joint.to_local(world_position))
	return false


func _update_highlight() -> void:
	if _hover_material != null:
		_hover_material.set_shader_parameter("selected", enabled and (_hovered or _grabbed))


func _screen_to_world(screen_position: Vector2) -> Vector2:
	return get_canvas_transform().affine_inverse() * screen_position


func _begin_pointer(point: Vector2, pointer: int) -> bool:
	if not enabled or _grabbed or not _hit_test(point):
		return false
	_grabbed = true
	_dragged = false
	_pointer_id = pointer
	_press_position = point
	_press_elevation = elevation_degrees
	_press_power = power
	_update_highlight()
	return true


func _move_pointer(point: Vector2) -> void:
	var delta = point - _press_position
	if not _dragged and delta.length() > CLICK_SLOP:
		_dragged = true
		aim_dragged.emit()
	if _dragged:
		# Original controls: drag up raises elevation; drag left adds power.
		set_aim(_press_elevation - delta.y * 0.35, _press_power - delta.x / 220.0)


func _end_pointer(point: Vector2) -> void:
	_move_pointer(point)
	var click = not _dragged
	_grabbed = false
	_pointer_id = -1
	_update_highlight()
	if click:
		fire()


func _input(event: InputEvent) -> void:
	# Start capture only in _unhandled_input, but finish an existing drag even
	# when the pointer moves over a HUD Control that consumes GUI events.
	if not enabled or not _grabbed:
		return
	if event is InputEventScreenDrag:
		var drag = event as InputEventScreenDrag
		if _pointer_id == drag.index:
			_move_pointer(_screen_to_world(drag.position))
			get_viewport().set_input_as_handled()
	elif event is InputEventScreenTouch:
		var touch = event as InputEventScreenTouch
		if _pointer_id == touch.index and not touch.pressed:
			_end_pointer(_screen_to_world(touch.position))
			get_viewport().set_input_as_handled()
	elif event is InputEventMouseMotion and _pointer_id == -2:
		_move_pointer(_screen_to_world((event as InputEventMouseMotion).position))
		get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton and _pointer_id == -2:
		var button = event as InputEventMouseButton
		if button.button_index == MOUSE_BUTTON_LEFT and not button.pressed:
			_end_pointer(_screen_to_world(button.position))
			get_viewport().set_input_as_handled()


func _unhandled_input(event: InputEvent) -> void:
	if not enabled:
		return
	if event is InputEventScreenTouch:
		_last_touch_msec = Time.get_ticks_msec()
		var touch = event as InputEventScreenTouch
		var point = _screen_to_world(touch.position)
		if touch.pressed:
			if _begin_pointer(point, touch.index):
				get_viewport().set_input_as_handled()
		elif _grabbed and _pointer_id == touch.index:
			_end_pointer(point)
			get_viewport().set_input_as_handled()
	elif event is InputEventScreenDrag:
		var drag = event as InputEventScreenDrag
		if _grabbed and _pointer_id == drag.index:
			_move_pointer(_screen_to_world(drag.position))
			get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton:
		# Prevent a touchscreen tap and its emulated mouse event from firing twice.
		if Time.get_ticks_msec() - _last_touch_msec < 750:
			return
		var button = event as InputEventMouseButton
		if button.button_index != MOUSE_BUTTON_LEFT:
			return
		var point = _screen_to_world(button.position)
		if button.pressed:
			if _begin_pointer(point, -2):
				get_viewport().set_input_as_handled()
		elif _grabbed and _pointer_id == -2:
			_end_pointer(point)
			get_viewport().set_input_as_handled()
	elif event is InputEventMouseMotion:
		if _grabbed and _pointer_id == -2:
			_move_pointer(_screen_to_world((event as InputEventMouseMotion).position))
			get_viewport().set_input_as_handled()
