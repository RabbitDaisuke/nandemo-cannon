class_name MovingTerrain
extends AnimatableBody2D
## A visible moving collider. SceneTree pause preserves its phase with the game.

var settings: Dictionary = {}
var hanging: bool = false
var elapsed: float = 0.0
var anchor = Vector2.ZERO
var body_size = Vector2(128, 24)
var cable: Line2D

func configure(entry: Dictionary, is_hanging: bool) -> void:
	settings = entry.duplicate(true)
	hanging = is_hanging
	name = "HangingLamp" if hanging else "MovingPlatform"
	collision_layer = 1
	collision_mask = 2
	set_meta("terrain", true)
	set_meta("moving_terrain", true)
	sync_to_physics = false
	anchor = _vector(settings.get("anchor" if hanging else "center", [300, 300]))
	body_size = _vector(settings.get("size", [128, 24]))
	var material = PhysicsMaterial.new()
	material.friction = 0.55
	material.bounce = 0.0
	physics_material_override = material
	var collider = CollisionShape2D.new()
	var shape = RectangleShape2D.new()
	shape.size = body_size
	collider.shape = shape
	add_child(collider)
	var sprite = Sprite2D.new()
	sprite.texture = load("res://assets/effects/pendant-lamp.svg" if hanging else "res://assets/effects/moving-platform.svg")
	sprite.scale = body_size / sprite.texture.get_size()
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	add_child(sprite)
	if hanging:
		cable = Line2D.new()
		cable.width = 4.0
		cable.default_color = Color("182733")
		cable.z_index = -1
		add_child(cable)
	_update_transform()
	sync_to_physics = true

func _physics_process(delta: float) -> void:
	elapsed += delta
	_update_transform()

func _update_transform() -> void:
	var phase = elapsed * TAU / maxf(1.0, float(settings.get("period", 5.0))) + float(settings.get("phase", 0.0))
	var angle = deg_to_rad(float(settings.get("amplitude", 12.0))) * sin(phase) if hanging else 0.0
	var point: Vector2
	if hanging:
		point = anchor + Vector2(0, float(settings.get("length", 180.0))).rotated(angle)
	else:
		point = anchor + _vector(settings.get("axis", [1, 0])).normalized() * float(settings.get("travel", 70.0)) * sin(phase)
	# One transform assignment keeps position and rotation in the same physics step.
	transform = Transform2D(angle, point)
	if is_instance_valid(cable):
		cable.points = PackedVector2Array([Vector2(0, -float(settings.get("length", 180.0))), Vector2(0, -body_size.y * 0.5)])

static func _vector(value: Array) -> Vector2:
	return Vector2(float(value[0]), float(value[1]))
