class_name GameCatalog
extends RefCounted

var items: Dictionary = {}
var ordered_items: Array = []
var stages: Array = []
var rules: Dictionary = {}
var animations: Dictionary = {}

func _init() -> void:
	var manifest = read_json("res://data/objects-manifest.json")
	for item in manifest.items:
		assert(item.bodyKind != "undecided", "Undecided objects cannot enter a game")
		items[item.id] = item
		ordered_items.append(item)
	stages = read_json("res://data/stages.json").stages
	rules = read_json("res://data/physics.json")
	animations = read_json("res://data/animations.json")

static func read_json(path: String) -> Dictionary:
	var parser = JSON.new()
	var error = parser.parse(FileAccess.get_file_as_string(path))
	assert(error == OK, "%s: %s" % [path, parser.get_error_message()])
	return parser.data

static func vector(value: Array) -> Vector2:
	return Vector2(float(value[0]), float(value[1]))

static func rectangle(value: Array) -> Rect2:
	return Rect2(float(value[0]), float(value[1]), float(value[2]), float(value[3]))

func build_queue(stage: Dictionary, rng: RandomNumberGenerator) -> Array:
	if not stage.has("queueSlots"):
		return stage.queue.duplicate()
	var result: Array = []
	for slot in stage.queueSlots:
		var available: Array = slot.candidates.duplicate()
		var count = int(slot.get("count", 1))
		assert(count > 0 and count <= available.size(), "Queue slot must sample without replacement")
		for index in range(count):
			var chosen = rng.randi_range(0, available.size() - 1)
			var id = str(available[chosen])
			assert(items.has(id), "Unknown queue item: " + id)
			result.append(id)
			available.remove_at(chosen)
	assert(result.size() == 15, "Every stage must contain fifteen throws")
	return result

func make_terrain(parent: Node2D, stage: Dictionary) -> void:
	for part in stage.get("terrain", []):
		var body = StaticBody2D.new()
		body.collision_layer = 1
		body.collision_mask = 2
		body.set_meta("terrain", true)
		var material = PhysicsMaterial.new()
		material.friction = 0.6
		if bool(stage.get("iceFloor", false)):
			material.friction = 0.025
		body.physics_material_override = material
		parent.add_child(body)
		if part.has("rect"):
			var r = rectangle(part.rect)
			var shape = RectangleShape2D.new()
			shape.size = r.size
			var collision = CollisionShape2D.new()
			collision.shape = shape
			collision.position = r.get_center()
			body.add_child(collision)
		else:
			var polygon = PackedVector2Array()
			for point in part.polygon:
				polygon.append(vector(point))
			for convex in Geometry2D.decompose_polygon_in_convex(polygon):
				var shape = ConvexPolygonShape2D.new()
				shape.points = convex
				var collision = CollisionShape2D.new()
				collision.shape = shape
				body.add_child(collision)
