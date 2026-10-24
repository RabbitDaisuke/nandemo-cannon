extends Node2D
## Game orchestration; physics, cannon, hazards and liquid have separate owners.

const SCORE_FLOOR_SLOP = 1.5
const MAPS_PER_PAGE = 15
const TRAJECTORY_COLOR = Color("ff67db")
const ItemSearchScript = preload("res://src/item_search.gd")

var catalog = GameCatalog.new()
var item_search = ItemSearchScript.new(catalog.ordered_items)
var ui_text: Dictionary = {}
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
var score_caption: Label
var remaining_label: Label
var stage_label: Label
var lesson_label: Label
var aim_label: Label
var power_label: Label
var next_name: Label
var next_icon: TextureRect
var loaded_icon: Sprite2D
var loaded_label: Label
var catalog_button: Button
var map_button: Button
var bgm_button: Button
var bgm_volume_slider: HSlider
var bgm_volume_label: Label
var power_slider: HSlider
var angle_slider: HSlider
var updating_sliders: bool = false
var destroyed_counts: Dictionary = {}
var save_progress_enabled: bool = true
var _web_document: JavaScriptObject
var _visibility_callback: JavaScriptObject
var shot_audio: AudioStreamPlayer
var result_jpeg: PackedByteArray = PackedByteArray()
var result_stage_name: String = ""
var result_capture_status: String = "none"
var _capture_generation: int = 0
var _share_bridge: JavaScriptObject
var _bgm_bridge: JavaScriptObject
var _bgm_state: Dictionary = {"enabled": true, "volume": 0.025, "blocked": false, "unavailable": false}
var _updating_bgm: bool = false
var tutorial_label: Label
var tutorial_active: bool = false
var tutorial_completed: bool = false
var _base_physics_ticks: int = int(ProjectSettings.get_setting("physics/common/physics_ticks_per_second", 120))
var _launched_count: int = 0
var _landed_count: int = 0
var touch_zoom: GameTouchZoom
var map_page: int = 0
var catalog_page: int = 0
var catalog_search_edit: LineEdit
var catalog_search_count: Label
var catalog_search_notice: Label
var catalog_recent_buttons: Array[Button] = []
var catalog_recent_searches: Array[String] = []
var catalog_query: String = ""
var catalog_result_page: int = 0
var catalog_results: Array = []

func _ready() -> void:
	var localized = JSON.parse_string(FileAccess.get_file_as_string("res://data/ui-ja.json"))
	if localized is Dictionary:
		ui_text = localized
	if OS.has_feature("web"):
		_share_bridge = JavaScriptBridge.get_interface("NandemoShare")
		_bgm_bridge = JavaScriptBridge.get_interface("NandemoBGM")
	seed_text = "%08X%08X" % [randi(), randi()]
	if FileAccess.file_exists("user://progress.json"):
		var data = JSON.parse_string(FileAccess.get_file_as_string("user://progress.json"))
		if data is Dictionary:
			best_scores = data
	_build_ui()
	shot_audio = AudioStreamPlayer.new()
	shot_audio.name = "CannonShotAudio"
	shot_audio.volume_db = linear_to_db(0.25)
	shot_audio.max_polyphony = 3
	if ResourceLoader.exists("res://assets/audio/Onoma-Impact01-1.mp3"):
		shot_audio.stream = load("res://assets/audio/Onoma-Impact01-1.mp3")
	add_child(shot_audio)
	load_stage(0)
	touch_zoom = GameTouchZoom.new()
	touch_zoom.game = self
	add_child(touch_zoom)
	if OS.has_feature("web"):
		_web_document = JavaScriptBridge.get_interface("document")
		_visibility_callback = JavaScriptBridge.create_callback(_on_web_visibility_changed)
		_web_document.addEventListener("visibilitychange", _visibility_callback)

func _exit_tree() -> void:
	_set_wait_speed(1.0)
	get_tree().paused = false
	if _bgm_bridge != null:
		_bgm_bridge.stopGameplay()
	if _web_document != null and _visibility_callback != null:
		_web_document.removeEventListener("visibilitychange", _visibility_callback)

func _on_web_visibility_changed(_arguments: Array) -> void:
	if _web_document != null and bool(_web_document.hidden):
		_pause_for_visibility()

func _pause_for_visibility() -> void:
	if simulation_paused or result_shown or not playable:
		return
	_open_modal("いちじていし", Vector2(440, 202), true)
	_label("がめんを はなれたので とめています。", Vector2(35, 68), 14, Color("b3dbea"), modal)
	_button("つづける", Vector2(130, 130), Vector2(180, 44), func(): _close_modal(), modal)

func load_stage(index: int) -> void:
	_set_wait_speed(1.0)
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
	current_stage.queue = catalog.build_queue(current_stage, rng)
	_launched_count = 0
	_landed_count = 0
	shots_fired = 0
	score_value = 0
	cooldown = 0.0
	end_clock = 0.0
	settle_clock = 0.0
	elapsed = 0.0
	hud_clock = 0.0
	result_shown = false
	simulation_paused = false
	_resume_tree_at_idle()
	selected_catalog_id = ""
	catalog_page = 0
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
	cannon.configure_controls(current_stage.get("cannonControls", {}), rng.seed)
	power_label.visible = cannon.is_power_adjustable()
	power_slider.visible = cannon.is_power_adjustable()
	power_slider.editable = cannon.is_power_adjustable()
	if is_instance_valid(touch_zoom):
		# Input is dispatched in reverse tree order: pinch cancellation must run first.
		move_child(touch_zoom, -1)
		touch_zoom.reset_view()
		cannon.set_input_suspended(touch_zoom.gesture_active)
	loaded_icon = Sprite2D.new()
	loaded_icon.name = "LoadedItemPreview"
	loaded_icon.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	loaded_icon.position = ground + Vector2(65, -94)
	loaded_icon.z_index = 1
	stage_root.add_child(loaded_icon)
	loaded_label.position = Vector2(clampf(ground.x + 65.0 - 98.0, 18.0, 746.0), maxf(126.0, ground.y - 152.0))
	cannon.fired.connect(_on_fired)
	cannon.aim_changed.connect(_on_aim_changed)
	cannon.aim_dragged.connect(_dismiss_tutorial)
	cannon.pointer_blocked = _pointer_over_ui
	# The light tutorial consumables otherwise overshoot their intended first target.
	var initial_power = 0.22 if stage_index == 2 else (0.34 if stage_index in [3, 4] else 0.65)
	cannon.set_aim(25.0 if stage_index == 2 else 35.0, initial_power)
	cannon.set_enabled(playable)
	_add_cannon_base_collider(ground)
	for entry in current_stage.get("preplaced", []):
		_create_preplaced_actor(entry)
	stage_label.text = "%02d / %s" % [stage_index + 1, _stage_display_name(stage_index)]
	var lessons: Array = ui_text.get("lessons", [])
	_layout_lesson(str(lessons[stage_index]) if stage_index < lessons.size() else "わくのなかに ものをなげよう。")
	catalog_button.visible = bool(current_stage.get("selectAnyCatalogItem", false))
	tutorial_active = stage_index == 0 and not tutorial_completed
	tutorial_label.position = ground + Vector2(-300, -72)
	tutorial_label.visible = tutorial_active
	score_value = calculate_score()
	_update_hud()
	queue_redraw()

func _create_preplaced_actor(entry: Dictionary) -> ThrowBody:
	var record: Dictionary = catalog.items[entry.id].duplicate(true)
	if entry.has("width"):
		var factor = float(entry.width) / float(record.worldWidth)
		record.worldWidth = float(entry.width)
		record.worldHeight *= factor
		record.worldScale *= factor
	var actor = _create_actor(record, Vector2(float(entry.x), 0.0), float(entry.groundY))
	# Any stage may opt a placed prop into the same containment/height scoring
	# used by thrown objects. Unmarked scenery stays neutral; penalties stay fixed.
	actor.can_score = bool(entry.get("scoring", false))
	if entry.has("scorePenalty"):
		actor.can_score = true
		actor.set_meta("score_penalty", -absi(int(entry.scorePenalty)))
	if entry.has("tutorialFractureHits"):
		actor.set_meta("tutorial_required", int(entry.tutorialFractureHits))
		# Ordinary contact cannot bypass the three-explosion tutorial rule.
		actor.spec["impactSpeed"] = 100000.0
		actor.spec["loadForceThreshold"] = 100000000.0
	return actor

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

func _create_actor(record: Dictionary, at: Vector2, ground_y: float = NAN) -> ThrowBody:
	var actor = ThrowBody.new()
	actor.configure(record, self)
	actor.position = at
	if is_finite(ground_y):
		# Settle the authored starting pose before CCD sees the body. Otherwise
		# placement below a shelf can be swept down from y=0 onto the shelf top.
		actor.position.y += ground_y - actor.get_world_bounds().end.y - 1.0
	stage_root.add_child(actor)
	actors.append(actor)
	return actor

func next_item_id() -> String:
	# Kept as the gameplay API for the currently loaded object.
	return _queued_item_id(0)

func following_item_id() -> String:
	return _queued_item_id(1)

func _queued_item_id(offset: int) -> String:
	if not playable or shots_fired + offset >= 15:
		return ""
	if bool(current_stage.get("selectAnyCatalogItem", false)) and catalog.is_catalog_selectable(selected_catalog_id):
		return selected_catalog_id
	return str(current_stage.queue[shots_fired + offset])

func _stage_display_name(index: int) -> String:
	var names: Array = ui_text.get("stages", [])
	return str(names[index]) if index < names.size() else "ステージ %d" % (index + 1)

func _item_display_name(id: String) -> String:
	return str(ui_text.get("items", {}).get(id, "もの"))

func launch_speed(record: Dictionary, power: float) -> float:
	var mass_factor = clampf(pow(8.0 / float(record.mass), 0.2), 0.7, 1.35)
	return (180.0 + power * 720.0) * mass_factor

func _on_fired(direction: Vector2, power: float, origin: Vector2) -> void:
	if simulation_paused or result_shown or is_instance_valid(modal) or (is_instance_valid(touch_zoom) and touch_zoom.gesture_active) or cooldown > 0.0 or next_item_id().is_empty():
		return
	_dismiss_tutorial()
	var record: Dictionary = catalog.items[next_item_id()]
	var actor = _create_actor(record, origin)
	# The backmost fixture starts just outside the actual muzzle, even for large items.
	var clearance: float = 0.0
	for point in actor.get_world_outline():
		clearance = maxf(clearance, -(point - actor.global_position).dot(direction))
	actor.position += direction * (clearance + 3.0)
	actor.is_launched = true
	_launched_count += 1
	actor.linear_velocity = direction * launch_speed(record, power)
	actor.angular_velocity = rng.randf_range(-0.35, 0.35)
	actor.can_score = not actor.behavior in ["water_release", "ignite_on_break", "explosion", "cold_release", "firework", "lightning"]
	hazards.on_launch(actor)
	shots_fired += 1
	if shot_audio.stream != null:
		shot_audio.play()
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
	cannon.set_enabled(playable and not is_instance_valid(modal) and shots_fired < 15 and cooldown <= 0.0)
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
	hud_clock += delta / Engine.time_scale
	if hud_clock >= 0.5:
		hud_clock = fmod(hud_clock, 0.5)
		score_value = calculate_score()
		_update_hud()
	if playable and shots_fired == 15:
		_set_wait_speed(1.5 if _launched_count == 15 and _landed_count == _launched_count else 1.0)
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
	if reason in ["impact", "load", "explosion", "broken", "frozen-impact", "water"]:
		spawn_effect("shatter", actor.global_position, maxf(0.6, actor.get_world_bounds().size.length() / 80.0))
	elif reason == "burned":
		spawn_effect("shatter", actor.global_position, 0.6, Color(0.25, 0.25, 0.25))
	destroyed_counts[reason] = int(destroyed_counts.get(reason, 0)) + 1
	actors.erase(actor)
	actor.queue_free()

func on_actor_impact(actor: ThrowBody, point: Vector2, normal_speed: float, energy: float) -> void:
	if actor.is_launched and not actor.get_meta("has_landed", false):
		actor.set_meta("has_landed", true)
		_landed_count += 1
	if not simulation_paused and is_instance_valid(hazards):
		hazards.impact(actor, point, normal_speed, energy)

func surface_friction_at(point: Vector2) -> float:
	if bool(current_stage.get("iceFloor", false)) and point.y >= 375.0:
		return 0.025
	if is_instance_valid(hazards):
		for zone in hazards.surface_zones:
			if str(zone.get("state", "")) == "ice" and Rect2(zone.bounds).has_point(point):
				return clampf(float(zone.get("friction", 0.025)), 0.0, 1.0)
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
	var ground_y = float(current_stage.get("scoreGroundY", score_zone.end.y))
	for actor in actors:
		if not is_instance_valid(actor) or not actor.alive or not actor.can_score:
			continue
		var contained = true
		for point in actor.get_world_outline():
			if point.x < score_zone.position.x or point.y < score_zone.position.y or point.x > score_zone.end.x:
				contained = false
				break
			if point.y > score_zone.end.y:
				# The physics solver permits a subpixel overlap with the floor.
				# Only the bottom edge gets tolerance, and only over static support.
				if point.y > score_zone.end.y + SCORE_FLOOR_SLOP or cast_solid(Vector2(point.x, score_zone.end.y - 2.0), Vector2(point.x, score_zone.end.y + SCORE_FLOOR_SLOP + 2.0), [actor.get_rid()], 1).is_empty():
					contained = false
					break
		if contained:
			if actor.has_meta("score_penalty"):
				total += int(actor.get_meta("score_penalty"))
			else:
				var height = maxf(0.0, ground_y - actor.get_world_bounds().get_center().y)
				total += int(actor.record.score) + 10 * floori(height / 16.0)
	return total

func _update_hud() -> void:
	score_caption.text = "とくてん"
	catalog_button.disabled = shots_fired >= 15 or result_shown
	map_button.disabled = shots_fired >= 15
	score_label.text = "%04d" % score_value
	remaining_label.text = "%02d/15" % maxi(0, 15 - shots_fired)
	var next = following_item_id()
	next_icon.texture = load("res://assets/" + str(catalog.items[next].svg)) if not next.is_empty() else null
	next_name.text = _item_display_name(next) if not next.is_empty() else "おわり"
	var loaded = next_item_id()
	loaded_icon.visible = not loaded.is_empty()
	loaded_label.visible = loaded_icon.visible
	if loaded_icon.visible:
		loaded_label.text = _item_display_name(loaded)
		_fit_label_width(loaded_label, 196.0, 14, 9)
		var record: Dictionary = catalog.items[loaded]
		loaded_icon.texture = load("res://assets/" + str(record.svg))
		var texture_size = loaded_icon.texture.get_size()
		var viewbox: Array = record.get("viewBox", [0, 0, 128, 128])
		if texture_size == Vector2(128, 128):
			viewbox = [0, 0, 128, 128]
		loaded_icon.scale = Vector2(float(viewbox[2]), float(viewbox[3])) * float(record.worldScale) / texture_size
	_on_aim_changed(cannon.elevation_degrees, cannon.power)
	_refresh_bgm_ui()

func _fit_label_width(label: Label, width: float, initial_size: int, minimum_size: int) -> void:
	var font_size = initial_size
	while font_size > minimum_size and theme.default_font.get_string_size(label.text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x > width:
		font_size -= 1
	label.add_theme_font_size_override("font_size", font_size)
	label.size = Vector2(width, theme.default_font.get_height(font_size))

func _wrap_hud_text(value: String, width: float, font_size: int) -> String:
	# An authored line break is a boundary, not an oversized word to reflow.
	if value.contains("\n"):
		var paragraphs: Array[String] = []
		for paragraph in value.split("\n"):
			paragraphs.append(_wrap_hud_text(paragraph, width, font_size))
		return "\n".join(paragraphs)
	var lines: Array[String] = []
	var words: Array[String] = []
	var word = ""
	for character in value:
		word += character
		if character in [" ", "。", "、", "\n"]:
			words.append(word)
			word = ""
	if not word.is_empty():
		words.append(word)
	var line = ""
	for chunk in words:
		if not line.is_empty() and theme.default_font.get_string_size((line + chunk).strip_edges(), HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x > width:
			lines.append(line.strip_edges())
			line = ""
		# Only hard-wrap a single phrase longer than the available column.
		for character in chunk:
			if character == "\n":
				lines.append(line.strip_edges())
				line = ""
				continue
			if not line.is_empty() and theme.default_font.get_string_size(line + character, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x > width:
				lines.append(line.strip_edges())
				line = ""
			line += character
	lines.append(line.strip_edges())
	return "\n".join(lines)

func _layout_lesson(value: String) -> void:
	var narrow = _wrap_hud_text(value, 304.0, 12)
	var wide = narrow.split("\n").size() > 3 or (value.contains("\n") and narrow != value)
	lesson_label.text = _wrap_hud_text(value, 924.0, 12) if wide else narrow
	# Longer stories use the row below the stage name and NEXT caption. Font
	# size stays readable and the central aiming region still begins at y=128.
	lesson_label.position = Vector2(18, 96) if wide else Vector2(302, 77)
	if wide:
		lesson_label.add_theme_constant_override("line_spacing", 0)
	else:
		lesson_label.remove_theme_constant_override("line_spacing")
	lesson_label.size = Vector2(924, 30) if wide else Vector2(304, 44)
	lesson_label.set_meta("wide_lesson", wide)

func _refresh_bgm_ui() -> void:
	if not is_instance_valid(bgm_button):
		return
	if _bgm_bridge != null:
		_bgm_bridge.setGameplayPaused(simulation_paused or result_shown or get_tree().paused or Engine.time_scale <= 0.0)
		var state = JSON.parse_string(str(_bgm_bridge.getStateJSON()))
		if state is Dictionary:
			_bgm_state = state
	bgm_button.disabled = _bgm_bridge == null or bool(_bgm_state.get("unavailable", false))
	bgm_button.text = "BGM エラー" if bool(_bgm_state.get("errored", false)) else ("BGM さいせい" if bool(_bgm_state.get("blocked", false)) else ("BGM オン" if bool(_bgm_state.get("enabled", true)) else "BGM オフ"))
	var percent = clampf(float(_bgm_state.get("volume", 0.025)), 0.0, 1.0) * 100.0
	bgm_volume_label.text = "おと %04.1f%%" % percent
	_updating_bgm = true
	bgm_volume_slider.value = percent
	bgm_volume_slider.editable = not bgm_button.disabled
	_updating_bgm = false

func _toggle_bgm() -> void:
	if _bgm_bridge != null:
		_bgm_bridge.toggle()
	_refresh_bgm_ui()

func _set_bgm_volume(percent: float) -> void:
	if _updating_bgm:
		return
	if _bgm_bridge != null:
		_bgm_bridge.setVolume(clampf(percent / 100.0, 0.0, 1.0))
	_refresh_bgm_ui()

func _on_aim_changed(angle: float, power: float) -> void:
	if not is_instance_valid(aim_label):
		return
	aim_label.text = "角度 %02d°" % roundi(angle)
	power_label.text = "火力 %02d%%" % roundi(power * 100)
	updating_sliders = true
	angle_slider.value = angle
	power_slider.value = power * 100.0
	updating_sliders = false
	queue_redraw()

func _finish_stage(timed_out: bool) -> void:
	if result_shown:
		return
	# A running stage may finish while a picker is open. Remove it before the
	# final game frame is captured, and include the entire field and score.
	_close_modal(false)
	touch_zoom.reset_view()
	score_value = calculate_score()
	result_shown = true
	catalog_page = 0
	_pause(true)
	_update_hud()
	result_jpeg = PackedByteArray()
	result_stage_name = str(current_stage.get("nameJa", _stage_display_name(stage_index)))
	_capture_generation += 1
	var capture_generation = _capture_generation
	var previous = int(best_scores.get(str(stage_index + 1), 0))
	best_scores[str(stage_index + 1)] = maxi(previous, score_value)
	if save_progress_enabled:
		var file = FileAccess.open("user://progress.json", FileAccess.WRITE)
		if file != null:
			file.store_string(JSON.stringify(best_scores))
	# Capture the final-score game frame before any result overlay is created.
	# Headless has no rendered framebuffer and must never await frame_post_draw.
	result_capture_status = "headless" if DisplayServer.get_name() == "headless" else "pending"
	if result_capture_status != "headless":
		await RenderingServer.frame_post_draw
		if capture_generation != _capture_generation or not is_inside_tree() or not result_shown:
			return
		var image = get_viewport().get_texture().get_image()
		if image != null and not image.is_empty():
			image.convert(Image.FORMAT_RGB8)
			result_jpeg = image.save_jpg_to_buffer(0.85)
		result_capture_status = "captured" if not result_jpeg.is_empty() else "unavailable"
	_open_modal("けっか", Vector2(660, 450))
	if _share_bridge != null:
		_share_bridge.setResult(result_stage_name, score_value, Marshalls.raw_to_base64(result_jpeg))
	var score = _label("%04d" % score_value, Vector2(52, 53), 54, Color("ffd36c"), modal)
	score.size.x = 556
	score.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var best = _label("ベスト %04d" % int(best_scores[str(stage_index + 1)]), Vector2(50, 120), 20, Color("b3dbea"), modal)
	best.size.x = 560
	best.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var status = _label("じかんぎれで 得点をかくてい" if timed_out else "すべてのものが おちつきました", Vector2(35, 153), 16, Color("edebd5"), modal)
	status.size.x = 590
	status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var seed = _label("シード " + seed_text, Vector2(50, 183), 14, Color("9fc4d2"), modal)
	seed.size.x = 560
	seed.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var post = _button("X でポスト", Vector2(50, 221), Vector2(560, 44), func():
		if _share_bridge != null:
			_share_bridge.tweet(), modal)
	post.set_meta("share_action", "tweet")
	post.add_theme_font_size_override("font_size", 24)
	post.disabled = _share_bridge == null
	for state in ["normal", "hover", "pressed", "disabled", "focus"]:
		var black = StyleBoxFlat.new()
		black.bg_color = Color("181818") if state in ["hover", "pressed"] else Color("080808")
		black.border_color = Color("fff0c8") if state == "focus" else Color("000000")
		black.set_border_width_all(2)
		post.add_theme_stylebox_override(state, black)
	var image_share = _share_bridge != null and bool(_share_bridge.canShareImage())
	var save = _button("がぞうをほぞん", Vector2(50, 278), Vector2(270 if image_share else 560, 36), func():
		if _share_bridge != null:
			_share_bridge.download(), modal)
	save.set_meta("share_action", "download")
	save.disabled = _share_bridge == null or result_jpeg.is_empty()
	if image_share:
		_button("がぞうつきでシェア", Vector2(340, 278), Vector2(270, 36), func(): _share_bridge.shareImage(), modal)
	_label("がぞうは ほぞんして X にそえてください。", Vector2(50, 326), 13, Color("b3dbea"), modal)
	_button("やりなおす", Vector2(45, 385), Vector2(180, 42), func(): load_stage(stage_index), modal)
	_button("マップ", Vector2(240, 385), Vector2(180, 42), _show_maps, modal).set_meta("result_navigation", "maps")
	var next = _button("つぎへ", Vector2(435, 385), Vector2(180, 42), func(): load_stage(mini(catalog.stages.size() - 1, stage_index + 1)), modal)
	next.disabled = stage_index >= catalog.stages.size() - 1

func _pause(value: bool) -> void:
	_set_wait_speed(1.0)
	simulation_paused = value
	# Only hidden-tab suspension and the completed result stop the simulation.
	# Hand-opened menus never call this or mutate rigid-body motion.
	if value:
		get_tree().paused = true
		if _bgm_bridge != null:
			_bgm_bridge.setGameplayPaused(true)
	else:
		_resume_tree_at_idle()
	if is_instance_valid(tutorial_label):
		tutorial_label.visible = tutorial_active and not value
	if is_instance_valid(cannon):
		cannon.set_enabled(not value and playable and not result_shown and not is_instance_valid(modal) and shots_fired < 15 and cooldown <= 0.0)

func _resume_tree_at_idle() -> void:
	if not get_tree().paused:
		if _bgm_bridge != null:
			_bgm_bridge.setGameplayPaused(false)
		return
	# Resume between complete physics ticks, never from a deferred/physics callback.
	# Godot issue #122378: otherwise a step can run before pending queries flush.
	await get_tree().process_frame
	if is_inside_tree() and not simulation_paused:
		get_tree().paused = false
		if _bgm_bridge != null:
			_bgm_bridge.setGameplayPaused(false)

func _set_wait_speed(multiplier: float) -> void:
	Engine.time_scale = multiplier
	Engine.physics_ticks_per_second = roundi(_base_physics_ticks * multiplier)

func _open_modal(title: String, size_value: Vector2 = Vector2(864, 430), pause_simulation: bool = false) -> void:
	_close_modal(false)
	if pause_simulation:
		_pause(true)
	cannon.set_enabled(false)
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
		_button("とじる", Vector2(size_value.x - 92, 9), Vector2(76, 32), func(): _close_modal(), modal)

func _close_modal(resume: bool = true) -> void:
	if _is_catalog_open():
		_remember_catalog_search()
		catalog_search_edit = null
		catalog_search_count = null
		catalog_search_notice = null
		catalog_recent_buttons.clear()
		catalog_query = ""
		catalog_results.clear()
	_capture_generation += 1
	if result_capture_status == "pending":
		result_capture_status = "cancelled"
	if _share_bridge != null:
		_share_bridge.hideResult()
	if is_instance_valid(modal):
		var shade = modal.get_parent()
		shade.get_parent().remove_child(shade)
		shade.queue_free()
		modal = null
	if resume and not result_shown:
		if simulation_paused:
			_pause(false)
		else:
			cannon.set_enabled(playable and shots_fired < 15 and cooldown <= 0.0)

func _show_maps(page: int = -1) -> void:
	if shots_fired >= 15 and not result_shown:
		return
	var pages = ceili(catalog.stages.size() / float(MAPS_PER_PAGE))
	map_page = clampi(stage_index / MAPS_PER_PAGE if page < 0 else page, 0, pages - 1)
	_open_modal("ステージをえらぶ / %d" % catalog.stages.size())
	for slot in range(MAPS_PER_PAGE):
		var index = map_page * MAPS_PER_PAGE + slot
		if index >= catalog.stages.size():
			break
		var col = slot % 5
		var row = slot / 5
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
		var text = "%02d %s" % [index + 1, _stage_display_name(index)]
		var caption = _label(text, Vector2(5, 55), 10, Color("fff0b5"), button)
		caption.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var previous = _button("まえのページ", Vector2(22, 348), Vector2(200, 40), func(): _show_maps(map_page - 1), modal)
	previous.disabled = map_page == 0
	previous.set_meta("map_page", map_page - 1)
	_label("%d / %d ページ" % [map_page + 1, pages], Vector2(346, 360), 17, Color("fff0b5"), modal)
	var next = _button("つぎのページ", Vector2(642, 348), Vector2(200, 40), func(): _show_maps(map_page + 1), modal)
	next.disabled = map_page == pages - 1
	next.set_meta("map_page", map_page + 1)
	_label("1ステージに なげられるのは15こ。", Vector2(23, 403), 12, Color("b5cad2"), modal)

func _show_catalog(page: int = -1) -> void:
	if shots_fired >= 15 or result_shown or not bool(current_stage.get("selectAnyCatalogItem", false)):
		return
	if _is_catalog_open():
		_render_catalog_page(catalog_result_page if page < 0 else page)
		return
	_open_modal("なげるもの")
	modal.set_meta("catalog_picker", true)
	catalog_query = ""
	catalog_results = _find_catalog_items("")
	catalog_search_edit = LineEdit.new()
	catalog_search_edit.name = "ItemSearch"
	catalog_search_edit.position = Vector2(178, 10)
	catalog_search_edit.size = Vector2(244, 32)
	catalog_search_edit.theme = theme
	catalog_search_edit.add_theme_font_size_override("font_size", 14)
	var search_style = StyleBoxFlat.new()
	search_style.bg_color = Color("0e2232")
	search_style.border_color = Color("668091")
	search_style.set_border_width_all(2)
	search_style.content_margin_left = 7
	search_style.content_margin_right = 7
	catalog_search_edit.add_theme_stylebox_override("normal", search_style)
	var search_focus = search_style.duplicate() as StyleBoxFlat
	search_focus.border_color = Color("ffd36c")
	catalog_search_edit.add_theme_stylebox_override("focus", search_focus)
	catalog_search_edit.add_theme_color_override("font_color", Color("f7e9ba"))
	catalog_search_edit.add_theme_color_override("font_placeholder_color", Color("a5b8c2"))
	catalog_search_edit.add_theme_color_override("caret_color", Color("ffd36c"))
	catalog_search_edit.placeholder_text = "かなで さがす"
	catalog_search_edit.max_length = 24
	catalog_search_edit.clear_button_enabled = true
	catalog_search_edit.context_menu_enabled = false
	catalog_search_edit.text_changed.connect(_catalog_search_changed)
	catalog_search_edit.text_submitted.connect(func(_text): _remember_catalog_search())
	modal.add_child(catalog_search_edit)
	catalog_search_count = _label("", Vector2(22, 43), 10, Color("b3dbea"), modal)
	catalog_search_notice = _label("かな・カナ・すうじでさがす", Vector2(178, 45), 9, Color("b3dbea"), modal)
	_label("さいきんのけんさく", Vector2(430, 45), 9, Color("b3dbea"), modal)
	for index in range(2):
		var recent = _button("", Vector2(430 + index * 168, 10), Vector2(160, 32), func(): _restore_catalog_search(index), modal)
		recent.set_meta("recent_search", index)
		recent.add_theme_font_size_override("font_size", 12)
		catalog_recent_buttons.append(recent)
	_refresh_recent_search_buttons()
	_render_catalog_page(catalog_page if page < 0 else page)
	# Do not force focus here: opening the list on mobile must not immediately
	# cover the choices with a software keyboard. A tap activates the input.

func _is_catalog_open() -> bool:
	return is_instance_valid(modal) and modal.has_meta("catalog_picker")

func _find_catalog_items(query: String) -> Array:
	# Keep the complete independent search index; only this picker hides entries.
	return item_search.find_items(query).filter(func(item): return catalog.is_catalog_selectable(str(item.id)))

func _select_catalog_item(id: String) -> void:
	if not _is_catalog_open() or shots_fired >= 15 or result_shown or not bool(current_stage.get("selectAnyCatalogItem", false)) or not catalog.is_catalog_selectable(id):
		return
	selected_catalog_id = id
	_close_modal()
	_update_hud()

func _catalog_search_changed(raw: String) -> void:
	if not _is_catalog_open():
		return
	var cleaned: String = ItemSearchScript.sanitize_input(raw)
	if cleaned != raw:
		var caret = ItemSearchScript.sanitize_input(raw.left(catalog_search_edit.caret_column)).length()
		catalog_search_edit.set_block_signals(true)
		catalog_search_edit.text = cleaned
		catalog_search_edit.caret_column = mini(caret, cleaned.length())
		catalog_search_edit.set_block_signals(false)
	catalog_search_notice.text = "つかえないもじを はずしました" if cleaned != raw else "かな・カナ・すうじでさがす"
	catalog_query = cleaned.strip_edges()
	catalog_results = _find_catalog_items(catalog_query)
	_render_catalog_page(catalog_page if catalog_query.is_empty() else 0)

func _remember_catalog_search() -> void:
	if catalog_query.is_empty():
		return
	var normalized: String = ItemSearchScript.normalize(catalog_query)
	for index in range(catalog_recent_searches.size() - 1, -1, -1):
		if ItemSearchScript.normalize(catalog_recent_searches[index]) == normalized:
			catalog_recent_searches.remove_at(index)
	catalog_recent_searches.push_front(catalog_query)
	if catalog_recent_searches.size() > 2:
		catalog_recent_searches.resize(2)
	_refresh_recent_search_buttons()

func _refresh_recent_search_buttons() -> void:
	for index in range(catalog_recent_buttons.size()):
		var button = catalog_recent_buttons[index]
		if not is_instance_valid(button):
			continue
		button.disabled = index >= catalog_recent_searches.size()
		var query = catalog_recent_searches[index] if not button.disabled else "りれきなし"
		button.text = query if query.length() <= 11 else query.left(10) + "..."

func _restore_catalog_search(index: int) -> void:
	if not _is_catalog_open() or index >= catalog_recent_searches.size():
		return
	var query = catalog_recent_searches[index]
	_remember_catalog_search()
	catalog_search_edit.text = query
	catalog_search_edit.caret_column = query.length()
	_catalog_search_changed(query)
	_remember_catalog_search()

func _render_catalog_page(page: int) -> void:
	# Keep the input alive while refreshing results, preserving IME/focus/caret.
	for child in modal.get_children():
		if child.has_meta("catalog_grid"):
			modal.remove_child(child)
			child.queue_free()
	var pages = maxi(1, ceili(catalog_results.size() / 24.0))
	page = clampi(page, 0, pages - 1)
	catalog_result_page = page
	if catalog_query.is_empty():
		catalog_page = page
	catalog_search_count.text = "%03d / %03dしゅるい" % [catalog_results.size(), catalog.selectable_items().size()]
	if catalog_results.is_empty():
		var empty = _label("みつかりませんでした\nことばをかえるか けしてください", Vector2(122, 164), 20, Color("fff0b5"), modal)
		empty.size.x = 620
		empty.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		empty.set_meta("catalog_grid", true)
	for slot in range(24):
		var index = page * 24 + slot
		if index >= catalog_results.size():
			break
		var item: Dictionary = catalog_results[index]
		var at = Vector2(22 + (slot % 6) * 138, 60 + (slot / 6) * 78)
		var button = _button("", at, Vector2(130, 70), func(): _select_catalog_item(str(item.id)), modal)
		button.set_meta("item_id", str(item.id))
		button.set_meta("catalog_grid", true)
		var icon = TextureRect.new()
		icon.texture = load("res://assets/" + str(item.svg))
		icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon.position = Vector2(42, 3)
		icon.size = Vector2(46, 43)
		icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
		button.add_child(icon)
		var caption = _label(_item_display_name(str(item.id)), Vector2(3, 50), 10, Color("f7e9ba"), button)
		caption.size = Vector2(124, 18)
		caption.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var previous = _button("まえへ", Vector2(22, 374), Vector2(104, 34), func(): _show_catalog(maxi(0, page - 1)), modal)
	previous.disabled = page == 0
	previous.set_meta("catalog_grid", true)
	previous.set_meta("catalog_previous", true)
	_label("%d / %d ページ" % [page + 1, pages], Vector2(346, 382), 14, Color("b3dbea"), modal).set_meta("catalog_grid", true)
	var next = _button("つぎへ", Vector2(738, 374), Vector2(104, 34), func(): _show_catalog(mini(pages - 1, page + 1)), modal)
	next.disabled = page == pages - 1
	next.set_meta("catalog_grid", true)
	next.set_meta("catalog_next", true)

func _show_seed() -> void:
	_open_modal("シード", Vector2(700, 235))
	_label("おなじシードで もういちどためせます。", Vector2(30, 60), 14, Color("b3dbea"), modal)
	var edit = LineEdit.new()
	edit.position = Vector2(54, 100)
	edit.size = Vector2(592, 40)
	edit.text = seed_text
	edit.max_length = 16
	edit.theme = theme
	edit.add_theme_font_size_override("font_size", 24)
	modal.add_child(edit)
	var repeat = _button("このシードで やりなおす", Vector2(30, 166), Vector2(300, 44), func():
		var cleaned = ""
		for character in edit.text.to_upper():
			if "0123456789ABCDEF".contains(character):
				cleaned += character
		seed_text = cleaned.lpad(16, "0").left(16)
		load_stage(stage_index), modal)
	repeat.set_meta("seed_action", "repeat")
	var different = _button("べつのしーどにする", Vector2(370, 166), Vector2(300, 44), _restart_with_new_seed, modal)
	different.set_meta("seed_action", "different")

func _restart_with_new_seed() -> void:
	var previous = seed_text
	while seed_text == previous:
		seed_text = "%08X%08X" % [randi(), randi()]
	load_stage(stage_index)

func _build_ui() -> void:
	theme = Theme.new()
	var generated_font = "res://assets/font/arcade-generated.fnt"
	theme.default_font = load(generated_font if ResourceLoader.exists(generated_font) else "res://assets/font/fuhotoki-pixel.fnt")
	theme.default_font_size = 16
	for state in ["normal", "hover", "pressed", "disabled", "focus"]:
		var style = StyleBoxFlat.new()
		style.bg_color = Color("293039") if state == "disabled" else (Color("193346") if state != "pressed" else Color("6a5631"))
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
	for kind in ["slider", "grabber_area", "grabber_area_highlight"]:
		var track = StyleBoxFlat.new()
		track.bg_color = Color("273944") if kind == "slider" else Color("e8af45")
		track.border_color = Color("080d14")
		track.set_border_width_all(3)
		track.content_margin_top = 5
		track.content_margin_bottom = 5
		theme.set_stylebox(kind, "HSlider", track)
	var knob_image = Image.create(16, 26, false, Image.FORMAT_RGBA8)
	knob_image.fill(Color("080d14"))
	knob_image.fill_rect(Rect2i(3, 3, 10, 20), Color("ffe09a"))
	var knob = ImageTexture.create_from_image(knob_image)
	for kind in ["grabber", "grabber_highlight", "grabber_disabled"]:
		theme.set_icon(kind, "HSlider", knob)
	ui = CanvasLayer.new()
	ui.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(ui)
	ui_root = Control.new()
	ui_root.size = Vector2(960, 540)
	ui_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui_root.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	ui_root.theme = theme
	ui.add_child(ui_root)
	if ResourceLoader.exists("res://assets/ui/logo.webp"):
		var logo = TextureRect.new()
		logo.name = "GameLogo"
		logo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		logo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		logo.texture = load("res://assets/ui/logo.webp")
		logo.position = Vector2(14, 10)
		logo.size = Vector2(260, 60)
		logo.mouse_filter = Control.MOUSE_FILTER_IGNORE
		ui_root.add_child(logo)
	else:
		_label("なんでもキャノン", Vector2(14, 18), 28, Color("ffd36c"))
	score_caption = _label("とくてん", Vector2(302, 8), 20)
	score_label = _label("0000", Vector2(302, 30), 36, Color("ffd36c"))
	_label("残り", Vector2(462, 8), 20)
	remaining_label = _label("15/15", Vector2(462, 33), 32)
	_label("つぎ", Vector2(624, 12), 20)
	next_icon = TextureRect.new()
	next_icon.position = Vector2(704, 7)
	next_icon.size = Vector2(62, 62)
	next_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	next_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	next_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui_root.add_child(next_icon)
	next_name = _label("", Vector2(620, 75), 10, Color("fff0b5"))
	next_name.size.x = 172
	next_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	map_button = _button("マップ", Vector2(804, 10), Vector2(64, 32), _show_maps)
	_button("シード", Vector2(876, 10), Vector2(72, 32), _show_seed)
	_button("やりなおす", Vector2(804, 50), Vector2(144, 32), func(): load_stage(stage_index))
	stage_label = _label("", Vector2(18, 77), 15, Color("fff0b5"))
	lesson_label = _label("", Vector2(302, 77), 12, Color("fff0b5"))
	lesson_label.size = Vector2(304, 44)
	aim_label = _label("", Vector2(506, 476), 16)
	angle_slider = _slider(Vector2(506, 501), 5.0, 85.0, 35.0, func(value):
		if not updating_sliders and is_instance_valid(cannon):
			_dismiss_tutorial()
			cannon.set_aim(value, cannon.power))
	power_label = _label("", Vector2(738, 476), 16, Color("ffd36c"))
	power_slider = _slider(Vector2(738, 501), 15.0, 100.0, 65.0, func(value):
		if not updating_sliders and is_instance_valid(cannon):
			_dismiss_tutorial()
			cannon.set_aim(cannon.elevation_degrees, value / 100.0))
	loaded_label = _label("", Vector2.ZERO, 14, Color("ffd36c"))
	loaded_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label("ドラッグで調整・クリックで発射", Vector2(18, 477), 16)
	bgm_button = _button("BGM オン", Vector2(18, 502), Vector2(144, 30), _toggle_bgm)
	bgm_button.add_theme_font_size_override("font_size", 14)
	bgm_volume_label = _label("おと 02.5%", Vector2(176, 510), 12)
	bgm_volume_slider = _slider(Vector2(268, 508), 0.0, 100.0, 2.5, _set_bgm_volume)
	bgm_volume_slider.size = Vector2(180, 18)
	bgm_volume_slider.step = 0.5
	var bgm_refresh = Timer.new()
	bgm_refresh.wait_time = 0.5
	bgm_refresh.ignore_time_scale = true
	bgm_refresh.timeout.connect(_refresh_bgm_ui)
	ui.add_child(bgm_refresh)
	bgm_refresh.start()
	catalog_button = _button("もの", Vector2(846, 435), Vector2(94, 34), func(): _show_catalog())
	tutorial_label = _label("たてドラッグで角度\nよこドラッグで火力\nクリックで発射", Vector2.ZERO, 16, Color("ffd36c"))
	tutorial_label.visible = false

func _slider(at: Vector2, minimum: float, maximum: float, initial: float, callback: Callable) -> HSlider:
	var slider = HSlider.new()
	slider.position = at
	slider.size = Vector2(204, 22)
	slider.min_value = minimum
	slider.max_value = maximum
	slider.value = initial
	slider.step = 1.0
	slider.theme = theme
	slider.value_changed.connect(callback)
	# Mouse emulation is disabled for pinch gestures; native Slider only handles
	# mouse input. GUI touch events already carry this control's local position.
	slider.gui_input.connect(_slider_touch.bind(slider))
	ui_root.add_child(slider)
	return slider

func _slider_touch(event: InputEvent, slider: HSlider) -> void:
	if not slider.editable or (is_instance_valid(touch_zoom) and touch_zoom.gesture_active):
		return
	if event is InputEventScreenDrag or (event is InputEventScreenTouch and event.pressed and not event.canceled):
		var ratio = clampf(event.position.x / maxf(1.0, slider.size.x), 0.0, 1.0)
		slider.value = lerpf(slider.min_value, slider.max_value, ratio)
		slider.accept_event()

func _label(text_value: String, at: Vector2, font_size: int, color_value: Color = Color("fff0c8"), parent: Node = null) -> Label:
	var label = Label.new()
	label.text = text_value
	label.position = at
	label.theme = theme
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color_value)
	label.add_theme_color_override("font_outline_color", Color("081421"))
	# Generated glyphs already include the bold black outline.
	label.add_theme_constant_override("outline_size", 0 if theme.default_font.resource_path.ends_with("arcade-generated.fnt") else (2 if font_size >= 20 else 1))
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
	if is_instance_valid(touch_zoom) and touch_zoom.gesture_active:
		return
	if not event is InputEventKey or not event.pressed:
		return
	if is_instance_valid(modal):
		if event.keycode == KEY_ESCAPE and not result_shown:
			_close_modal()
		return
	if event.keycode in [KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT]:
		_dismiss_tutorial()
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

func _pointer_over_ui(world_point: Vector2) -> bool:
	# Starts already pass through Godot GUI handling. Check releases too, since
	# cannon pointer capture intentionally receives them before GUI controls.
	var screen_point = cannon.get_canvas_transform() * world_point
	for child in ui_root.get_children():
		if child is Control and child.is_visible_in_tree() and child.mouse_filter != Control.MOUSE_FILTER_IGNORE:
			var local_point = child.get_global_transform_with_canvas().affine_inverse() * screen_point
			if Rect2(Vector2.ZERO, child.size).has_point(local_point):
				return true
	return false

func _draw() -> void:
	if not is_instance_valid(cannon) or not playable:
		return
	var corners = _score_marker()
	draw_colored_polygon(corners, Color(0.1, 0.95, 0.9, 0.14))
	for index in range(4):
		var a: Vector2 = corners[index]
		var b: Vector2 = corners[(index + 1) % 4]
		var length = a.distance_to(b)
		var direction = (b - a).normalized()
		for start in range(0, int(length), 18):
			draw_line(a + direction * start, a + direction * minf(start + 10, length), Color("44f4e9"), 3.0, false)
	for arrow in _tutorial_arrows():
		draw_colored_polygon(arrow, Color("ffd36c"))
		var border: PackedVector2Array = arrow.duplicate()
		border.append(arrow[0])
		draw_polyline(border, Color("080d14"), 3.0)
	var next = next_item_id()
	if next.is_empty() or simulation_paused:
		return
	var record: Dictionary = catalog.items[next]
	var direction = cannon.get_launch_direction()
	var position_start = cannon.get_muzzle() + direction * (float(record.worldWidth) * 0.5 + 3.0)
	var velocity = direction * launch_speed(record, cannon.power)
	for step in range(1, roundi(10.0 * cannon.trajectory_fraction) + 1):
		var t = step * 0.06
		var point = position_start + velocity * t + Vector2(0, gravity_value * t * t * 0.5)
		if point.y > 500.0 or point.x < 0.0:
			break
		var alpha = 1.0 - float(step) * 0.04
		draw_rect(Rect2(point - Vector2(4, 4), Vector2(8, 8)), Color(0.025, 0.04, 0.08, alpha))
		draw_rect(Rect2(point - Vector2(2, 2), Vector2(4, 4)), Color(TRAJECTORY_COLOR, alpha))

func _score_marker() -> PackedVector2Array:
	var left = score_zone.position.x
	var right = score_zone.end.x
	var floor_y = score_zone.end.y
	return PackedVector2Array([Vector2(left + 18, floor_y - 14), Vector2(right - 18, floor_y - 14), Vector2(right, floor_y + 8), Vector2(left, floor_y + 8)])

func _dismiss_tutorial() -> void:
	if not tutorial_active:
		return
	tutorial_completed = true
	tutorial_active = false
	tutorial_label.hide()
	queue_redraw()

func _tutorial_arrows() -> Array:
	var arrows: Array = []
	if not tutorial_active or simulation_paused or not is_instance_valid(cannon):
		return arrows
	var center = cannon.position + Vector2(10, -30)
	for direction in [Vector2.UP, Vector2.DOWN, Vector2.LEFT, Vector2.RIGHT]:
		var side = Vector2(-direction.y, direction.x)
		var start = center + direction * 40.0
		var tip = center + direction * (80.0 if direction == Vector2.DOWN else 110.0)
		var neck = tip - direction * 16.0
		arrows.append(PackedVector2Array([tip, neck + side * 10.0, neck + side * 4.0, start + side * 4.0, start - side * 4.0, neck - side * 4.0, neck - side * 10.0]))
	return arrows

func debug_snapshot(include_modal: bool = true) -> Dictionary:
	var tutorial_arrows: Array = []
	for arrow in _tutorial_arrows():
		var points: Array = []
		for point in arrow:
			points.append([point.x, point.y])
		tutorial_arrows.append(points)
	var marker: Array = []
	for point in _score_marker():
		marker.append([point.x, point.y])
	var loaded: Dictionary = {}
	if loaded_icon.visible:
		loaded = {"id": next_item_id(), "texture": loaded_icon.texture.resource_path, "position": [loaded_icon.position.x, loaded_icon.position.y], "scale": [loaded_icon.scale.x, loaded_icon.scale.y]}
	var entries: Array = []
	for actor in actors:
		if not is_instance_valid(actor) or not actor.alive:
			continue
		entries.append({"id": actor.item_id, "x": actor.position.x, "y": actor.position.y, "rotation": actor.rotation, "record": actor.record, "burning": actor.burning, "frozen": actor.frozen_seconds, "fuel": actor.fuel_seconds, "texture": actor.visual.texture.resource_path, "visualPosition": [actor.visual.position.x, actor.visual.position.y], "visualScale": [actor.visual.scale.x, actor.visual.scale.y], "tint": actor.visual.modulate.to_html(), "canScore": actor.can_score})
	var controls: Array = []
	_snapshot_controls(ui_root, controls, include_modal)
	var moving_terrain: Array = []
	for body in stage_root.get_node("StaticTerrain").get_children():
		if body is MovingTerrain:
			moving_terrain.append({"position": [body.position.x, body.position.y], "rotation": body.rotation, "size": [body.body_size.x, body.body_size.y], "hanging": body.hanging, "length": float(body.settings.get("length", 0.0))})
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
		for step in range(1, roundi(10.0 * cannon.trajectory_fraction) + 1):
			var t = step * 0.06
			var point = origin + velocity * t + Vector2(0, gravity_value * t * t * 0.5)
			if point.y > 500 or point.x < 0:
				break
			trajectory.append([point.x, point.y, 1.0 - step * 0.04, TRAJECTORY_COLOR.to_html()])
	return {"stage": stage_index + 1, "map": current_stage.map, "scoreZone": [score_zone.position.x, score_zone.position.y, score_zone.size.x, score_zone.size.y], "scoreMarker": marker, "score": score_value, "shots": shots_fired, "actors": entries, "seed": seed_text, "angle": cannon.elevation_degrees, "power": cannon.power, "cannon": current_stage.get("cannon", [810, 420]), "cannonVisuals": cannon.visual_snapshot(), "cannonSelected": cannon.enabled and (cannon._hovered or cannon._grabbed), "loadedItem": loaded, "followingItem": following_item_id(), "font": theme.default_font.resource_path, "recoil": cannon._recoil, "playable": playable, "elapsed": elapsed, "controls": controls, "tutorialArrows": tutorial_arrows, "firePatches": patches, "waterRegions": water_regions, "waterCells": water_cells, "droplets": drops, "trajectory": trajectory, "result": result_shown, "destroyedCounts": destroyed_counts.duplicate(), "movingTerrain": moving_terrain}

func _snapshot_controls(node: Node, output: Array, include_modal: bool = true) -> void:
	if not include_modal and is_instance_valid(modal) and node == modal.get_parent():
		return
	if node is Control and not node.is_visible_in_tree():
		return
	if node is Control:
		var rectangle = node.get_global_rect()
		var entry: Dictionary = {"rect": [rectangle.position.x, rectangle.position.y, rectangle.size.x, rectangle.size.y]}
		if node is Label:
			entry.merge({"type": "label", "text": node.text, "fontSize": node.get_theme_font_size("font_size"), "color": node.get_theme_color("font_color").to_html(), "outline": node.get_theme_color("font_outline_color").to_html(), "outlineSize": node.get_theme_constant("outline_size"), "align": node.horizontal_alignment})
		elif node is Button:
			var style = node.get_theme_stylebox("disabled" if node.disabled else "normal") as StyleBoxFlat
			entry.merge({"type": "button", "text": node.text, "fontSize": node.get_theme_font_size("font_size"), "disabled": node.disabled, "background": style.bg_color.to_html() if style != null else "193346ff", "border": style.border_color.to_html() if style != null else "080f18ff"})
		elif node is LineEdit:
			entry.merge({"type": "line_edit", "text": node.text, "placeholder": node.placeholder_text, "fontSize": node.get_theme_font_size("font_size"), "focused": node.has_focus(), "clearEnabled": node.clear_button_enabled})
		elif node is HSlider:
			entry.merge({"type": "slider", "value": node.value, "minimum": node.min_value, "maximum": node.max_value, "editable": node.editable})
		elif node is TextureRect and node.texture != null:
			entry.merge({"type": "texture", "texture": node.texture.resource_path})
		elif node is ColorRect:
			entry.merge({"type": "rect", "color": node.color.to_html()})
		elif node is Panel:
			entry.merge({"type": "panel"})
		if entry.has("type"):
			output.append(entry)
	for child in node.get_children():
		_snapshot_controls(child, output, include_modal)
