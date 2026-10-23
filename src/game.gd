extends Node2D
## Game orchestration; physics, cannon, hazards and liquid have separate owners.

const STAGE_NAMES = ["POC", "UNDERGROUND", "MOON", "ALLEY", "VOLCANO", "ROOFTOPS", "HOME", "PIRATE SHIP", "NINJA", "BOWLING", "RIVER", "WASHBASIN", "GAS STOVE", "IMPERIAL CASTLE", "SANDBOX", "ICE FLOOR", "HOLLOW DAIS", "OLD SUBWAY", "AQUEDUCT", "RUINED CASTLE"]
const LESSONS = [
	"LAND THE WHOLE OBJECT INSIDE THE CYAN ZONE.",
	"FILL THE REAL UNDERGROUND CAVITY. STACK UPWARDS.",
	"LOW GRAVITY. REDUCE POWER BEFORE YOU FIRE.",
	"BURN THE TRASH. THEN USE WATER ON THE BURNING FLOOR.",
	"PAPER BURNS AWAY. WATER AND ICE PUT OUT THE FIRE.",
	"THE GAPS ARE ABYSSES. FALLEN ITEMS ARE LOST.",
	"THE WASHER BLOCKS YOUR SHOT. KEEP THE EXISTING POINTS.",
	"HIT THE CRATE PILE WITH ALL THREE BOMBS.",
	"BELLS AND SHURIKEN HAVE ROUND COLLISION SHAPES.",
	"KNOCK THE PINS OVER. KEEP YOUR ITEMS IN THE ZONE.",
	"WATER SLOWS AND CARRIES ITEMS. TABLES RESIST THE FLOW.",
	"THE TAP FILLS THE BASIN. THE WHOLE UMBRELLA REPELS WATER.",
	"NO WATER. METAL PANS BLOCK HEAT FROM THE BURNERS.",
	"FIRE WATER ICE WHEELS AND A HOLLOW CASTLE PLATFORM.",
	"CHOOSE ANY OF THE 117 ITEMS. YOU STILL GET 15 SHOTS.",
	"ALL ITEMS SLIDE. BOOT SOLES GRIP ICE. UPSIDE DOWN THEY SLIP.",
	"MAP PREVIEW. THIS STAGE HAS NO GAME RULES YET.",
	"MAP PREVIEW. THIS STAGE HAS NO GAME RULES YET.",
	"MAP PREVIEW. THIS STAGE HAS NO GAME RULES YET.",
	"MAP PREVIEW. THIS STAGE HAS NO GAME RULES YET."
]

var catalog = GameCatalog.new()
var rng = RandomNumberGenerator.new()
var seed_text: String = ""
var stage_index: int = 0
var current_stage: Dictionary = {}
var actors: Array[ThrowBody] = []
var gravity_value: float = 980.0
var shots_fired: int = 0
var score_value: int = 0
var score_zone = Rect2()
var playable: bool = true
var result_shown: bool = false
var simulation_paused: bool = false
var cooldown: float = 0.0
var end_clock: float = 0.0
var settle_clock: float = 0.0
var hud_clock: float = 0.0
var elapsed: float = 0.0
var selected_catalog_id: String = ""
var best_scores: Dictionary = {}
var stage_root: Node2D
var effects_root: Node2D
var cannon: AimCannon
var liquid: LiquidField
var hazards: HazardSystem
var ui: CanvasLayer
var ui_root: Control
var modal: Control
var theme: Theme
var score_label: Label
var remaining_label: Label
var stage_label: Label
var lesson_label: Label
var aim_label: Label
var next_name: Label
var next_icon: TextureRect
var catalog_button: Button
var power_slider: HSlider
var angle_slider: HSlider
var updating_sliders: bool = false
var destroyed_counts: Dictionary = {}
var save_progress_enabled: bool = true
var _web_document: JavaScriptObject
var _visibility_callback: JavaScriptObject

func _ready() -> void:
	seed_text = "%08X%08X" % [randi(), randi()]
	if FileAccess.file_exists("user://progress.json"):
		var data = JSON.parse_string(FileAccess.get_file_as_string("user://progress.json"))
		if data is Dictionary:
			best_scores = data
	_build_ui()
	load_stage(0)
	if OS.has_feature("web"):
		_web_document = JavaScriptBridge.get_interface("document")
		_visibility_callback = JavaScriptBridge.create_callback(_on_web_visibility_changed)
		_web_document.addEventListener("visibilitychange", _visibility_callback)

func _exit_tree() -> void:
	if _web_document != null and _visibility_callback != null:
		_web_document.removeEventListener("visibilitychange", _visibility_callback)

func _on_web_visibility_changed(_arguments: Array) -> void:
	if _web_document != null and bool(_web_document.hidden):
		_pause_for_visibility()

func _pause_for_visibility() -> void:
	if simulation_paused or result_shown or not playable:
		return
	_open_modal("PAUSED", Vector2(440, 202))
	_label("THE GAME WAS PAUSED WHILE HIDDEN.", Vector2(35, 68), 14, Color("b3dbea"), modal)
	_button("RESUME", Vector2(130, 130), Vector2(180, 44), func(): _close_modal(), modal)

func load_stage(index: int) -> void:
	_close_modal(false)
	if is_instance_valid(stage_root):
		remove_child(stage_root)
		stage_root.queue_free()
	actors.clear()
	stage_index = clampi(index, 0, catalog.stages.size() - 1)
	current_stage = catalog.stages[stage_index].duplicate(true)
	playable = current_stage.get("status", "") == "specified"
	gravity_value = float(current_stage.get("gravity", 980.0))
	PhysicsServer2D.area_set_param(get_world_2d().space, PhysicsServer2D.AREA_PARAM_GRAVITY, gravity_value)
	var hash_context = HashingContext.new()
	hash_context.start(HashingContext.HASH_SHA256)
	hash_context.update((seed_text + ":" + str(stage_index)).to_utf8_buffer())
	rng.seed = hash_context.finish().decode_s64(0)
	shots_fired = 0
	score_value = 0
	cooldown = 0.0
	end_clock = 0.0
	settle_clock = 0.0
	elapsed = 0.0
	result_shown = false
	simulation_paused = false
	selected_catalog_id = ""
	destroyed_counts.clear()
	score_zone = GameCatalog.rectangle(current_stage.get("scoreZone", [70, 70, 400, 350]))
	stage_root = Node2D.new()
	stage_root.name = "Stage"
	add_child(stage_root)
	var background = Sprite2D.new()
	background.texture = load("res://assets/maps/" + str(current_stage.map) + ".png")
	background.centered = false
	background.z_index = -20
	background.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	background.scale = Vector2(960, 540) / background.texture.get_size()
	stage_root.add_child(background)
	var terrain_root = Node2D.new()
	terrain_root.name = "StaticTerrain"
	stage_root.add_child(terrain_root)
	catalog.make_terrain(terrain_root, current_stage)
	liquid = LiquidField.new()
	stage_root.add_child(liquid)
	liquid.configure(self, current_stage)
	hazards = HazardSystem.new()
	stage_root.add_child(hazards)
	hazards.configure(self, current_stage)
	effects_root = Node2D.new()
	stage_root.add_child(effects_root)
	cannon = AimCannon.new()
	stage_root.add_child(cannon)
	var ground = GameCatalog.vector(current_stage.get("cannon", [810, 420]))
	cannon.configure(ground)
	cannon.fired.connect(_on_fired)
	cannon.aim_changed.connect(_on_aim_changed)
	# The light tutorial consumables otherwise overshoot their intended first target.
	var initial_power = 0.22 if stage_index == 2 else (0.34 if stage_index in [3, 4] else 0.65)
	cannon.set_aim(25.0 if stage_index == 2 else 35.0, initial_power)
	cannon.set_enabled(playable)
	_add_cannon_base_collider(ground)
	for entry in current_stage.get("preplaced", []):
		var record: Dictionary = catalog.items[entry.id].duplicate(true)
		if entry.has("width"):
			var factor = float(entry.width) / float(record.worldWidth)
			record.worldWidth = float(entry.width)
			record.worldHeight *= factor
			record.worldScale *= factor
		var actor = _create_actor(record, Vector2(float(entry.x), 0.0))
		actor.position.y = float(entry.groundY) - actor.get_world_bounds().end.y - 1.0
		actor.can_score = bool(entry.get("scoring", false))
		if entry.has("tutorialFractureHits"):
			actor.set_meta("tutorial_required", int(entry.tutorialFractureHits))
			# Ordinary contact cannot bypass the three-explosion tutorial rule.
			actor.spec["impactSpeed"] = 100000.0
			actor.spec["loadForceThreshold"] = 100000000.0
	stage_label.text = "%02d / %s" % [stage_index + 1, STAGE_NAMES[stage_index]]
	lesson_label.text = LESSONS[stage_index]
	catalog_button.visible = stage_index == 14
	_update_hud()
	queue_redraw()

func _add_cannon_base_collider(ground: Vector2) -> void:
	var base = StaticBody2D.new()
	base.collision_layer = 1
	base.collision_mask = 2
	base.position = ground + Vector2(0, -22)
	var shape = RectangleShape2D.new()
	shape.size = Vector2(110, 42)
	var collision = CollisionShape2D.new()
	collision.shape = shape
	base.add_child(collision)
	stage_root.add_child(base)

func _create_actor(record: Dictionary, at: Vector2) -> ThrowBody:
	var actor = ThrowBody.new()
	actor.configure(record, self)
	actor.position = at
	stage_root.add_child(actor)
	actors.append(actor)
	return actor

func next_item_id() -> String:
	if not playable or shots_fired >= 15:
		return ""
	if stage_index == 14 and not selected_catalog_id.is_empty():
		return selected_catalog_id
	return str(current_stage.queue[shots_fired])

func launch_speed(record: Dictionary, power: float) -> float:
	var mass_factor = clampf(pow(8.0 / float(record.mass), 0.2), 0.7, 1.35)
	return (180.0 + power * 720.0) * mass_factor

func _on_fired(direction: Vector2, power: float, origin: Vector2) -> void:
	if simulation_paused or result_shown or cooldown > 0.0 or next_item_id().is_empty():
		return
	var record: Dictionary = catalog.items[next_item_id()]
	var actor = _create_actor(record, origin)
	# The backmost fixture starts just outside the actual muzzle, even for large items.
	var clearance: float = 0.0
	for point in actor.get_world_outline():
		clearance = maxf(clearance, -(point - actor.global_position).dot(direction))
	actor.position += direction * (clearance + 3.0)
	actor.is_launched = true
	actor.linear_velocity = direction * launch_speed(record, power)
	actor.angular_velocity = rng.randf_range(-0.35, 0.35)
	actor.can_score = not actor.behavior in ["water_release", "ignite_on_break", "explosion", "cold_release"]
	hazards.on_launch(actor)
	shots_fired += 1
	cooldown = 0.65
	cannon.set_enabled(false)
	spawn_effect("splash", origin, 0.3, Color(1.0, 0.9, 0.6))
	_update_hud()
	queue_redraw()

func _physics_process(delta: float) -> void:
	if simulation_paused or result_shown or not is_instance_valid(stage_root):
		return
	elapsed += delta
	cooldown = maxf(0.0, cooldown - delta)
	cannon.set_enabled(playable and shots_fired < 15 and cooldown <= 0.0)
	liquid.tick(delta)
	hazards.tick(delta)
	for effect in effects_root.get_children():
		if effect is EffectSprite:
			effect.tick(delta)
	for actor in actors.duplicate():
		if not is_instance_valid(actor):
			actors.erase(actor)
			continue
		if actor.position.y > 580.0 or actor.position.x < -180.0 or actor.position.x > 1140.0:
			destroy_actor(actor, "abyss")
			continue
		for rect in current_stage.get("abyss", []):
			if GameCatalog.rectangle(rect).has_point(actor.global_position):
				destroy_actor(actor, "abyss")
				break
	hud_clock += delta
	if hud_clock >= 0.1:
		hud_clock = 0.0
		_update_hud()
	if playable and shots_fired == 15:
		end_clock += delta
		var resting = true
		for actor in actors:
			if actor.alive and (actor.linear_velocity.length() > 5.0 or absf(actor.angular_velocity) > 0.08 or actor.burning or actor.fuel_seconds > 0.0):
				resting = false
				break
		settle_clock = settle_clock + delta if resting else 0.0
		if settle_clock >= 1.5 or end_clock >= 12.0:
			_finish_stage(end_clock >= 12.0)
	queue_redraw()

func destroy_actor(actor: ThrowBody, reason: String) -> void:
	if not is_instance_valid(actor) or not actor.alive:
		return
	actor.alive = false
	actor.collision_layer = 0
	actor.collision_mask = 0
	actor.set_deferred("freeze", true)
	if reason in ["impact", "load", "explosion", "broken"]:
		spawn_effect("shatter", actor.global_position, maxf(0.6, actor.get_world_bounds().size.length() / 80.0))
	elif reason == "burned":
		spawn_effect("shatter", actor.global_position, 0.6, Color(0.25, 0.25, 0.25))
	destroyed_counts[reason] = int(destroyed_counts.get(reason, 0)) + 1
	actors.erase(actor)
	actor.queue_free()

func on_actor_impact(actor: ThrowBody, point: Vector2, normal_speed: float, energy: float) -> void:
	if not simulation_paused and is_instance_valid(hazards):
		hazards.impact(actor, point, normal_speed, energy)

func surface_friction_at(point: Vector2) -> float:
	if stage_index == 15 and point.y >= 375.0:
		return 0.025
	return liquid.ice_friction(point) if is_instance_valid(liquid) else -1.0

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

func spawn_effect(animation: String, at: Vector2, size_scale: float = 1.0, tint: Color = Color.WHITE) -> void:
	if not is_instance_valid(effects_root) or effects_root.get_child_count() >= 80:
		return
	var effect = EffectSprite.new()
	effect.configure(catalog.animations[animation], at, size_scale)
	effect.modulate = tint
	effects_root.add_child(effect)

func calculate_score() -> int:
	var total: int = 0
	for actor in actors:
		if not is_instance_valid(actor) or not actor.alive or not actor.can_score:
			continue
		var contained = true
		for point in actor.get_world_outline():
			if not score_zone.grow(1.5).has_point(point):
				contained = false
				break
		if contained:
			total += int(actor.record.score)
	return total

func _update_hud() -> void:
	score_value = calculate_score()
	score_label.text = "仮得点 %04d" % score_value
	remaining_label.text = "残り %02d/15" % maxi(0, 15 - shots_fired)
	var next = next_item_id()
	next_icon.texture = load("res://assets/" + str(catalog.items[next].svg)) if not next.is_empty() else null
	next_name.text = next.replace("-", " ").to_upper() if not next.is_empty() else ("SETTLING" if not result_shown and playable else "")
	_on_aim_changed(cannon.elevation_degrees, cannon.power)

func _on_aim_changed(angle: float, power: float) -> void:
	if not is_instance_valid(aim_label):
		return
	aim_label.text = "角度 %02d°   火力 %02d%%" % [roundi(angle), roundi(power * 100)]
	updating_sliders = true
	angle_slider.value = angle
	power_slider.value = power * 100.0
	updating_sliders = false
	queue_redraw()

func _finish_stage(timed_out: bool) -> void:
	if result_shown:
		return
	score_value = calculate_score()
	result_shown = true
	var previous = int(best_scores.get(str(stage_index + 1), 0))
	best_scores[str(stage_index + 1)] = maxi(previous, score_value)
	if save_progress_enabled:
		var file = FileAccess.open("user://progress.json", FileAccess.WRITE)
		if file != null:
			file.store_string(JSON.stringify(best_scores))
	_open_modal("RESULT", Vector2(520, 314))
	var score = _label("%04d" % score_value, Vector2(52, 64), 54, Color("ffd36c"), modal)
	score.size.x = 416
	score.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label("BEST %04d" % int(best_scores[str(stage_index + 1)]), Vector2(168, 134), 20, Color("b3dbea"), modal)
	_label("MOVING ITEMS SNAPSHOT" if timed_out else "STACK SETTLED", Vector2(104, 171), 16, Color("edebd5"), modal)
	_label("SEED " + seed_text, Vector2(90, 205), 14, Color("9fc4d2"), modal)
	_button("RETRY", Vector2(40, 250), Vector2(130, 42), func(): load_stage(stage_index), modal)
	_button("MAPS", Vector2(195, 250), Vector2(130, 42), _show_maps, modal)
	var next = _button("NEXT", Vector2(350, 250), Vector2(130, 42), func(): load_stage(mini(15, stage_index + 1)), modal)
	next.disabled = stage_index >= 15

func _pause(value: bool) -> void:
	simulation_paused = value
	for actor in actors:
		if is_instance_valid(actor) and actor.alive:
			actor.freeze = value
	if is_instance_valid(cannon):
		cannon.set_enabled(not value and playable and not result_shown and shots_fired < 15)

func _open_modal(title: String, size_value: Vector2 = Vector2(864, 430)) -> void:
	_close_modal(false)
	_pause(true)
	var shade = ColorRect.new()
	shade.name = "Shade"
	shade.color = Color(0.025, 0.055, 0.08, 0.82)
	shade.position = Vector2.ZERO
	shade.size = Vector2(960, 540)
	shade.mouse_filter = Control.MOUSE_FILTER_STOP
	ui_root.add_child(shade)
	modal = Panel.new()
	modal.name = "Modal"
	modal.theme = theme
	modal.size = size_value
	modal.position = (Vector2(960, 540) - size_value) * 0.5
	shade.add_child(modal)
	_label(title, Vector2(22, 14), 22, Color("ffd36c"), modal)
	if not result_shown:
		_button("X", Vector2(size_value.x - 52, 9), Vector2(36, 32), func(): _close_modal(), modal)

func _close_modal(resume: bool = true) -> void:
	if is_instance_valid(modal):
		var shade = modal.get_parent()
		shade.get_parent().remove_child(shade)
		shade.queue_free()
		modal = null
	if resume and not result_shown:
		_pause(false)

func _show_maps() -> void:
	_open_modal("MAPS / 16 STAGES + 4 PREVIEWS")
	for index in range(20):
		var col = index % 5
		var row = index / 5
		var at = Vector2(22 + col * 166, 54 + row * 86)
		var button = _button("", at, Vector2(156, 78), func(): load_stage(index), modal)
		button.set_meta("stage_index", index)
		var preview = TextureRect.new()
		preview.texture = load("res://assets/maps/" + str(catalog.stages[index].map) + ".png")
		preview.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		preview.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		preview.position = Vector2(4, 4)
		preview.size = Vector2(148, 48)
		preview.mouse_filter = Control.MOUSE_FILTER_IGNORE
		button.add_child(preview)
		var text = "%02d %s" % [index + 1, STAGE_NAMES[index]]
		var caption = _label(text, Vector2(5, 55), 10, Color("fff0b5") if index < 16 else Color("9ab6c5"), button)
		caption.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_label("17-20 ARE MAP PREVIEWS. RULES ARE NOT SET.", Vector2(23, 403), 12, Color("b5cad2"), modal)

func _show_catalog(page: int = 0) -> void:
	if stage_index != 14:
		return
	_open_modal("CHOOSE NEXT ITEM / %03d" % catalog.ordered_items.size())
	for slot in range(24):
		var index = page * 24 + slot
		if index >= catalog.ordered_items.size():
			break
		var item: Dictionary = catalog.ordered_items[index]
		var at = Vector2(22 + (slot % 6) * 138, 54 + (slot / 6) * 78)
		var button = _button("", at, Vector2(130, 70), func():
			selected_catalog_id = str(item.id)
			_close_modal()
			_update_hud(), modal)
		button.set_meta("item_id", str(item.id))
		var icon = TextureRect.new()
		icon.texture = load("res://assets/" + str(item.svg))
		icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon.position = Vector2(42, 3)
		icon.size = Vector2(46, 43)
		icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
		button.add_child(icon)
		var caption = _label(str(item.id).replace("-", " ").to_upper(), Vector2(3, 50), 10, Color("f7e9ba"), button)
		caption.size = Vector2(124, 18)
		caption.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_button("PREV", Vector2(22, 374), Vector2(104, 34), func(): _show_catalog(maxi(0, page - 1)), modal).disabled = page == 0
	_label("PAGE %d / 5" % (page + 1), Vector2(359, 382), 14, Color("b3dbea"), modal)
	_button("NEXT", Vector2(738, 374), Vector2(104, 34), func(): _show_catalog(mini(4, page + 1)), modal).disabled = page == 4

func _show_seed() -> void:
	_open_modal("SEED", Vector2(530, 235))
	_label("SAME SEED REPEATS THE RANDOM DRAWS.", Vector2(30, 60), 14, Color("b3dbea"), modal)
	var edit = LineEdit.new()
	edit.position = Vector2(54, 100)
	edit.size = Vector2(422, 40)
	edit.text = seed_text
	edit.max_length = 16
	edit.theme = theme
	edit.add_theme_font_size_override("font_size", 24)
	modal.add_child(edit)
	_button("APPLY + RETRY", Vector2(130, 166), Vector2(270, 44), func():
		var cleaned = ""
		for character in edit.text.to_upper():
			if "0123456789ABCDEF".contains(character):
				cleaned += character
		seed_text = cleaned.lpad(16, "0").left(16)
		load_stage(stage_index), modal)

func _build_ui() -> void:
	theme = Theme.new()
	theme.default_font = load("res://assets/font/fuhotoki-pixel.fnt")
	theme.default_font_size = 16
	for state in ["normal", "hover", "pressed", "disabled", "focus"]:
		var style = StyleBoxFlat.new()
		style.bg_color = Color("193346") if state != "pressed" else Color("6a5631")
		style.border_color = Color("ffd36c") if state in ["hover", "focus"] else Color("080f18")
		style.set_border_width_all(2)
		style.content_margin_left = 7
		style.content_margin_right = 7
		theme.set_stylebox(state, "Button", style)
	var panel = StyleBoxFlat.new()
	panel.bg_color = Color("142c3e")
	panel.border_color = Color("080f18")
	panel.set_border_width_all(4)
	theme.set_stylebox("panel", "Panel", panel)
	theme.set_color("font_color", "Button", Color("f7e9ba"))
	theme.set_color("font_hover_color", "Button", Color("ffd36c"))
	theme.set_color("font_disabled_color", "Button", Color("668091"))
	ui = CanvasLayer.new()
	add_child(ui)
	ui_root = Control.new()
	ui_root.size = Vector2(960, 540)
	ui_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui_root.theme = theme
	ui.add_child(ui_root)
	_label("なんでもキャノン", Vector2(14, 9), 24, Color("ffd36c"))
	score_label = _label("仮得点 0000", Vector2(280, 12), 20)
	remaining_label = _label("残り 15/15", Vector2(455, 12), 20)
	_label("次", Vector2(614, 12), 20)
	next_icon = TextureRect.new()
	next_icon.position = Vector2(646, 4)
	next_icon.size = Vector2(42, 42)
	next_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	next_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	next_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui_root.add_child(next_icon)
	next_name = _label("", Vector2(618, 48), 10, Color("fff0b5"))
	_button("MAP", Vector2(713, 8), Vector2(70, 33), _show_maps)
	_button("RETRY", Vector2(790, 8), Vector2(83, 33), func(): load_stage(stage_index))
	_button("SEED", Vector2(880, 8), Vector2(68, 33), _show_seed)
	stage_label = _label("", Vector2(16, 48), 13, Color("c8e5ed"))
	lesson_label = _label("", Vector2(16, 515), 13, Color("fff0b5"))
	aim_label = _label("", Vector2(708, 116), 16, Color("fff0b5"))
	angle_slider = _slider(Vector2(716, 151), 5.0, 85.0, 35.0, func(value):
		if not updating_sliders and is_instance_valid(cannon):
			cannon.set_aim(value, cannon.power))
	power_slider = _slider(Vector2(716, 185), 15.0, 100.0, 65.0, func(value):
		if not updating_sliders and is_instance_valid(cannon):
			cannon.set_aim(cannon.elevation_degrees, value / 100.0))
	_label("ドラッグで調整", Vector2(720, 224), 13, Color("c8e5ed"))
	_label("クリックで発射", Vector2(720, 245), 13, Color("c8e5ed"))
	catalog_button = _button("ITEM", Vector2(846, 282), Vector2(94, 34), func(): _show_catalog())

func _slider(at: Vector2, minimum: float, maximum: float, initial: float, callback: Callable) -> HSlider:
	var slider = HSlider.new()
	slider.position = at
	slider.size = Vector2(220, 24)
	slider.min_value = minimum
	slider.max_value = maximum
	slider.value = initial
	slider.step = 1.0
	slider.theme = theme
	slider.value_changed.connect(callback)
	ui_root.add_child(slider)
	return slider

func _label(text_value: String, at: Vector2, font_size: int, color_value: Color = Color("fff0c8"), parent: Node = null) -> Label:
	var label = Label.new()
	label.text = text_value
	label.position = at
	label.theme = theme
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color_value)
	label.add_theme_color_override("font_outline_color", Color("081421"))
	label.add_theme_constant_override("outline_size", 2 if font_size >= 20 else 1)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	(parent if parent != null else ui_root).add_child(label)
	return label

func _button(text_value: String, at: Vector2, size_value: Vector2, callback: Callable, parent: Node = null) -> Button:
	var button = Button.new()
	button.text = text_value
	button.position = at
	button.size = size_value
	button.theme = theme
	button.focus_mode = Control.FOCUS_NONE
	button.pressed.connect(callback)
	(parent if parent != null else ui_root).add_child(button)
	return button

func _unhandled_key_input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed:
		return
	if is_instance_valid(modal):
		if event.keycode == KEY_ESCAPE and not result_shown:
			_close_modal()
		return
	match event.keycode:
		KEY_UP:
			cannon.set_aim(cannon.elevation_degrees + 2.0, cannon.power)
		KEY_DOWN:
			cannon.set_aim(cannon.elevation_degrees - 2.0, cannon.power)
		KEY_LEFT:
			cannon.set_aim(cannon.elevation_degrees, cannon.power - 0.02)
		KEY_RIGHT:
			cannon.set_aim(cannon.elevation_degrees, cannon.power + 0.02)
		KEY_SPACE:
			cannon.fire()
		KEY_R:
			load_stage(stage_index)
		KEY_M, KEY_ESCAPE:
			_show_maps()

func _draw() -> void:
	if not is_instance_valid(cannon) or not playable:
		return
	draw_rect(score_zone, Color(0.1, 0.95, 0.9, 0.045))
	var corners = [score_zone.position, Vector2(score_zone.end.x, score_zone.position.y), score_zone.end, Vector2(score_zone.position.x, score_zone.end.y)]
	for index in range(4):
		var a: Vector2 = corners[index]
		var b: Vector2 = corners[(index + 1) % 4]
		var length = a.distance_to(b)
		var direction = (b - a).normalized()
		for start in range(0, int(length), 18):
			draw_line(a + direction * start, a + direction * minf(start + 10, length), Color("44f4e9"), 3.0, false)
	var next = next_item_id()
	if next.is_empty() or simulation_paused:
		return
	var record: Dictionary = catalog.items[next]
	var direction = cannon.get_launch_direction()
	var position_start = cannon.get_muzzle() + direction * (float(record.worldWidth) * 0.5 + 3.0)
	var velocity = direction * launch_speed(record, cannon.power)
	for step in range(1, 11):
		var t = step * 0.06
		var point = position_start + velocity * t + Vector2(0, gravity_value * t * t * 0.5)
		if point.y > 500.0 or point.x < 0.0:
			break
		draw_rect(Rect2(point - Vector2(2, 2), Vector2(4, 4)), Color(1.0, 0.92, 0.65, 1.0 - float(step) * 0.06))

func debug_snapshot() -> Dictionary:
	var entries: Array = []
	for actor in actors:
		if not is_instance_valid(actor) or not actor.alive:
			continue
		entries.append({"id": actor.item_id, "x": actor.position.x, "y": actor.position.y, "rotation": actor.rotation, "record": actor.record, "burning": actor.burning, "frozen": actor.frozen_seconds, "fuel": actor.fuel_seconds, "texture": actor.visual.texture.resource_path, "visualPosition": [actor.visual.position.x, actor.visual.position.y], "visualScale": [actor.visual.scale.x, actor.visual.scale.y], "tint": actor.visual.modulate.to_html(), "canScore": actor.can_score})
	var controls: Array = []
	_snapshot_controls(ui_root, controls)
	var patches: Array = []
	for patch in hazards.patches:
		patches.append({"x": patch.point.x, "y": patch.point.y, "radius": patch.radius, "source": patch.source})
	var water_regions: Array = []
	for region in liquid.regions:
		var r: Rect2 = region.rect
		water_regions.append([r.position.x, r.position.y, r.size.x, r.size.y])
	var water_cells: Array = []
	for key in liquid.cells.keys():
		water_cells.append({"x": key.x * 16, "y": key.y * 16, "amount": liquid.cells[key].amount, "frozen": liquid.cells[key].frozen})
	var drops: Array = []
	for drop in liquid.droplets:
		drops.append([drop.point.x, drop.point.y])
	var trajectory: Array = []
	var next = next_item_id()
	if not next.is_empty() and not simulation_paused:
		var item: Dictionary = catalog.items[next]
		var direction = cannon.get_launch_direction()
		var origin = cannon.get_muzzle() + direction * (float(item.worldWidth) * 0.5 + 3)
		var velocity = direction * launch_speed(item, cannon.power)
		for step in range(1, 11):
			var t = step * 0.06
			var point = origin + velocity * t + Vector2(0, gravity_value * t * t * 0.5)
			if point.y > 500 or point.x < 0:
				break
			trajectory.append([point.x, point.y, 1.0 - step * 0.06])
	return {"stage": stage_index + 1, "map": current_stage.map, "scoreZone": [score_zone.position.x, score_zone.position.y, score_zone.size.x, score_zone.size.y], "score": calculate_score(), "shots": shots_fired, "actors": entries, "seed": seed_text, "angle": cannon.elevation_degrees, "power": cannon.power, "cannon": current_stage.get("cannon", [810, 420]), "recoil": cannon._recoil, "playable": playable, "elapsed": elapsed, "controls": controls, "firePatches": patches, "waterRegions": water_regions, "waterCells": water_cells, "droplets": drops, "trajectory": trajectory, "result": result_shown, "destroyedCounts": destroyed_counts.duplicate()}

func _snapshot_controls(node: Node, output: Array) -> void:
	if node is Control and not node.is_visible_in_tree():
		return
	if node is Control:
		var rectangle = node.get_global_rect()
		var entry: Dictionary = {"rect": [rectangle.position.x, rectangle.position.y, rectangle.size.x, rectangle.size.y]}
		if node is Label:
			entry.merge({"type": "label", "text": node.text, "fontSize": node.get_theme_font_size("font_size"), "color": node.get_theme_color("font_color").to_html(), "outline": node.get_theme_color("font_outline_color").to_html(), "outlineSize": node.get_theme_constant("outline_size"), "align": node.horizontal_alignment})
		elif node is Button:
			entry.merge({"type": "button", "text": node.text, "fontSize": node.get_theme_font_size("font_size"), "disabled": node.disabled})
		elif node is HSlider:
			entry.merge({"type": "slider", "value": node.value, "minimum": node.min_value, "maximum": node.max_value})
		elif node is TextureRect and node.texture != null:
			entry.merge({"type": "texture", "texture": node.texture.resource_path})
		elif node is ColorRect:
			entry.merge({"type": "rect", "color": node.color.to_html()})
		elif node is Panel:
			entry.merge({"type": "panel"})
		if entry.has("type"):
			output.append(entry)
	for child in node.get_children():
		_snapshot_controls(child, output)
