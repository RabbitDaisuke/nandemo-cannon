class_name GameTouchZoom
extends Node
## View-only pinch transform. Physics coordinates and time never change.

const MIN_ZOOM = 1.0
const MAX_ZOOM = 2.5
var game: Node2D
var touches: Dictionary = {}
var gesture_active: bool = false
var zoom: float = 1.0
var view_transform = Transform2D.IDENTITY
var _start_radius: float = 1.0
var _start_zoom: float = 1.0
var _anchor: Vector2
var _last_touch_msec: int = -10000

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func _exit_tree() -> void:
	get_viewport().canvas_transform = Transform2D.IDENTITY

func reset_view() -> void:
	zoom = 1.0
	view_transform = Transform2D.IDENTITY
	_apply_view()
	if touches.size() >= 2:
		_rebase()

func _apply_view() -> void:
	get_viewport().canvas_transform = view_transform
	game.ui.transform = view_transform

func _center() -> Vector2:
	var center = Vector2.ZERO
	for point in touches.values():
		center += point
	return center / touches.size()

func _radius(center: Vector2) -> float:
	var radius = 0.0
	for point in touches.values():
		radius += center.distance_to(point)
	return maxf(1.0, radius / touches.size())

func _rebase() -> void:
	var center = _center()
	_anchor = view_transform.affine_inverse() * center
	_start_zoom = zoom
	_start_radius = _radius(center)

func _update_view() -> void:
	var center = _center()
	zoom = clampf(_start_zoom * _radius(center) / _start_radius, MIN_ZOOM, MAX_ZOOM)
	var offset = center - _anchor * zoom
	var size = get_viewport().get_visible_rect().size
	offset.x = clampf(offset.x, size.x * (1.0 - zoom), 0.0)
	offset.y = clampf(offset.y, size.y * (1.0 - zoom), 0.0)
	view_transform = Transform2D(Vector2(zoom, 0), Vector2(0, zoom), offset)
	_apply_view()

func _cancel_controls(node: Node) -> void:
	# BaseButton clears its touch index on SCROLL_BEGIN; Slider clears grabs
	# when editable changes. No synthetic release can accidentally activate UI.
	if node is BaseButton:
		node.notification(Control.NOTIFICATION_SCROLL_BEGIN)
	elif node is Slider:
		var editable = node.editable
		node.editable = false
		node.editable = editable
	for child in node.get_children():
		_cancel_controls(child)

func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		_last_touch_msec = Time.get_ticks_msec()
		if event.pressed and not event.canceled:
			touches[event.index] = event.position
		else:
			touches.erase(event.index)
		if touches.size() >= 2:
			if not gesture_active:
				gesture_active = true
				game.cannon.set_input_suspended(true)
				get_viewport().gui_cancel_drag()
				_cancel_controls(game.ui_root)
			_rebase()
		if gesture_active:
			get_viewport().set_input_as_handled()
			if touches.is_empty():
				gesture_active = false
				game.cannon.set_input_suspended(false)
	elif event is InputEventScreenDrag:
		_last_touch_msec = Time.get_ticks_msec()
		if touches.has(event.index):
			touches[event.index] = event.position
		if gesture_active:
			if touches.size() >= 2:
				_update_view()
			get_viewport().set_input_as_handled()
	elif gesture_active or ((event is InputEventMouseButton or event is InputEventMouseMotion) and event.device == InputEvent.DEVICE_ID_EMULATION and Time.get_ticks_msec() - _last_touch_msec < 750):
		get_viewport().set_input_as_handled()

func _unhandled_key_input(event: InputEvent) -> void:
	# The game node is pausable; the modal must still accept Escape.
	if get_tree().paused and not gesture_active:
		game._unhandled_key_input(event)
		get_viewport().set_input_as_handled()
