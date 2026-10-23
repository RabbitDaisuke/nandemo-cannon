class_name EffectSprite
extends Sprite2D

var frames: Array[Texture2D] = []
var fps: float = 12.0
var lifetime: float = 0.0
var looping: bool = false
var elapsed: float = 0.0
var owner_actor: Node2D

func configure(animation: Dictionary, at: Vector2, size_scale: float = 1.0, seconds: float = 0.0) -> void:
	for file in animation.frames:
		frames.append(load("res://assets/" + file))
	fps = float(animation.get("fps", 12.0))
	looping = bool(animation.get("loop", false))
	lifetime = seconds if seconds > 0.0 else float(frames.size()) / fps
	position = at
	scale = Vector2.ONE * size_scale
	texture = frames[0]
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	z_index = 8

func tick(delta: float) -> void:
	elapsed += delta
	if lifetime > 0.0 and elapsed >= lifetime:
		queue_free()
		return
	if not frames.is_empty():
		var frame = int(elapsed * fps)
		texture = frames[frame % frames.size() if looping else mini(frame, frames.size() - 1)]
