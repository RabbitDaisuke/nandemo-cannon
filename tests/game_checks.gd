extends SceneTree
## Exercises real scenes, signals, rigid bodies and progression without a browser.

const GameScript = preload("res://src/game.gd")
var game: Node2D
var failures: Array[String] = []
var checks: int = 0
var observations: Dictionary = {}


func _initialize() -> void:
	_run.call_deferred()


func _check(condition: bool, description: String) -> void:
	checks += 1
	if not condition:
		failures.append(description)


func _frames(count: int) -> void:
	for _index in range(count):
		await physics_frame


func _snapshot(name: String, include_modal: bool = true) -> void:
	game._update_hud()
	await process_frame
	DirAccess.make_dir_recursive_absolute("res://previews")
	var file = FileAccess.open("res://previews/game-state-" + name + ".json", FileAccess.WRITE)
	file.store_string(JSON.stringify(game.debug_snapshot(include_modal), "\t"))


func _check_visible_glyphs(context: String) -> void:
	var missing: Dictionary = {}
	for control in game.debug_snapshot().controls:
		if control.type in ["label", "button"]:
			for character in str(control.text):
				if character == "\n":
					continue
				if not game.theme.default_font.has_char(character.unicode_at(0)):
					missing[character] = true
	_check(missing.is_empty(), context + " contains missing font glyphs: " + str(missing.keys()))


func _button_with_meta(key: String, value: Variant) -> Button:
	for child in game.modal.get_children():
		if child is Button and child.has_meta(key) and child.get_meta(key) == value:
			return child
	return null


func _run() -> void:
	root.size = Vector2i(960, 540)
	game = GameScript.new()
	game.save_progress_enabled = false
	root.add_child(game)
	game.seed_text = "0123456789ABCDEF"
	await _frames(2)
	# All specified stages instantiate real terrain and a fifteen-item queue.
	for index in range(game.catalog.stages.size()):
		game.load_stage(index)
		await _frames(2)
		_check(is_instance_valid(game.stage_root) and game.stage_root.get_child_count() > 3, "Stage %d failed to instantiate its scene" % (index + 1))
		_check(game.playable and game.current_stage.queue.size() == 15, "Stage is not playable with fifteen throws")
		_check(game.shots_fired == 0 and not game.next_item_id().is_empty(), "Playable stage has no first item")
		_check_visible_glyphs("Stage %d HUD" % (index + 1))
	game.load_stage(0)
	await _frames(2)
	await _snapshot("01-initial")
	_check(game.tutorial_active and game.tutorial_label.visible and game.debug_snapshot().tutorialArrows.size() == 4, "First stage is missing its four-direction aiming tutorial")
	var logo = game.ui_root.get_node_or_null("GameLogo") as TextureRect
	_check(logo != null and logo.size.x <= 260.0 and logo.size.y <= 60.0 and logo.get_global_rect().end.x < game.score_label.position.x, "Logo texture minimum size overlaps the score HUD")
	var loaded_size = game.loaded_icon.texture.get_size() * game.loaded_icon.scale
	_check(loaded_size.x <= 58.01 and loaded_size.y <= 58.01 and game.loaded_icon.position.y + loaded_size.y * 0.5 < game.cannon.position.y - 60.0, "Loaded preview obscures the cannon carriage")
	_check(game.next_item_id() == game.current_stage.queue[0] and game.following_item_id() == game.current_stage.queue[1], "Loaded and NEXT previews do not represent successive items")
	_check(game.loaded_icon.visible and game.next_icon.texture.resource_path.ends_with(str(game.catalog.items[game.following_item_id()].svg)), "NEXT icon displays the loaded item instead of the following object")
	var drag_origin = game.cannon.position + Vector2(-10, -20)
	var press = InputEventMouseButton.new()
	press.button_index = MOUSE_BUTTON_LEFT
	press.position = drag_origin
	press.pressed = true
	root.push_input(press)
	var motion = InputEventMouseMotion.new()
	motion.position = drag_origin + Vector2(-22, -20)
	motion.button_mask = MOUSE_BUTTON_MASK_LEFT
	root.push_input(motion)
	var release = InputEventMouseButton.new()
	release.button_index = MOUSE_BUTTON_LEFT
	release.position = motion.position
	root.push_input(release)
	await process_frame
	_check(game.cannon.power > 0.65 and game.cannon.elevation_degrees > 35.0 and game.shots_fired == 0, "Drag did not adjust both axes without firing")
	_check(not game.tutorial_active and not game.tutorial_label.visible and game.debug_snapshot().tutorialArrows.is_empty(), "Aiming tutorial remained after an actual drag")
	game.load_stage(0)
	await _frames(2)
	_check(not game.tutorial_active and not game.tutorial_label.visible, "A completed aiming tutorial returned on retry")
	game.power_slider.value = 57
	_check(is_equal_approx(game.cannon.power, 0.57), "Power slider did not set cannon power")
	var key = InputEventKey.new()
	key.pressed = true
	key.keycode = KEY_RIGHT
	game._unhandled_key_input(key)
	_check(is_equal_approx(game.cannon.power, 0.59), "Power key did not increment the selected power")
	game.power_slider.value = 65
	game.cannon.fire()
	_check(game.shots_fired == 1 and game.actors.size() == 1, "Cannon signal did not create exactly one first item")
	_check(game.shot_audio.stream != null and game.shot_audio.playing and is_equal_approx(db_to_linear(game.shot_audio.volume_db), 0.25), "Successful cannon shot did not play its sound at quarter volume")
	var first_spin = game.actors[0].angular_velocity
	await _frames(480)
	_check(is_equal_approx(game.cannon.power, 0.65) and is_equal_approx(game.power_slider.value, 65), "Firing or elapsed simulation changed the selected power")
	_check(game.next_item_id() == game.current_stage.queue[1] and game.following_item_id() == game.current_stage.queue[2], "Loaded and NEXT previews did not advance together after firing")
	observations.first_shot_score = game.calculate_score()
	observations.first_shot_bodies = game.actors.size()
	_check(game.calculate_score() == 300, "Default stage 1 first shot did not land the refrigerator inside the target")
	# The seed repeats the launch draw. The test does not claim cross-platform bit-exact physics.
	game.load_stage(0)
	await _frames(2)
	game.cannon.fire()
	_check(is_equal_approx(game.actors[0].angular_velocity, first_spin), "Same seed did not repeat the launch random draw")
	await _frames(360)
	for settings in [[35.0, 0.51], [42.0, 0.40], [40.0, 0.36], [38.0, 0.32]]:
		game.cannon.set_aim(settings[0], settings[1])
		game.cannon.fire()
		await _frames(360)
	_check(game.shots_fired == 5, "Five deliberate cannon shots were not counted")
	await _snapshot("01-after-five")
	# Pausing must hold physical bodies as well as gameplay timers, then resume input.
	var before_pause = game.elapsed
	game._pause_for_visibility()
	# Allow the already submitted physics step to synchronize to its Node2D once.
	await _frames(2)
	var positions: Array = []
	for actor in game.actors:
		positions.append(actor.position)
	await _frames(40)
	_check(game.simulation_paused and is_equal_approx(game.elapsed, before_pause), "Hidden-tab pause advanced the game clock")
	for index in range(game.actors.size()):
		_check(game.actors[index].position.is_equal_approx(positions[index]), "Paused physical item continued moving")
	game._close_modal()
	await _frames(3)
	_check(not game.simulation_paused and game.elapsed > before_pause, "Resume did not restart the simulation")
	# Map callbacks must capture the selected tile, not the final loop index.
	game._show_maps()
	_check_visible_glyphs("Map picker")
	var map_button = _button_with_meta("stage_index", 17)
	_check(map_button != null, "Map picker did not expose stage 18")
	if map_button != null:
		map_button.pressed.emit()
	await _frames(2)
	_check(game.stage_index == 17 and game.playable and game.current_stage.get("iceFloor", false), "Map tile callback did not load playable ice stage 18")
	# Preplaced scoring props count; the large obstructing washer does not.
	game.load_stage(6)
	await _frames(240)
	observations.home_initial_score = game.calculate_score()
	_check(game.calculate_score() > 0, "Home stage's existing score props do not score")
	var washer_checked = false
	for actor in game.actors:
		if actor.item_id == "washing-machine":
			washer_checked = true
			_check(not actor.can_score, "Obstructing washer was incorrectly scored")
	_check(washer_checked, "Home stage lost its obstructing washer")
	# A real falling rigid body enters a roof gap and is removed by the abyss rule.
	game.load_stage(5)
	await _frames(2)
	var fallen = game._create_actor(game.catalog.items["soccer-ball"], Vector2(370, 495))
	fallen.linear_velocity = Vector2(0, 220)
	await _frames(80)
	_check(not is_instance_valid(fallen) and game.destroyed_counts.get("abyss", 0) > 0, "Falling item survived a rooftop abyss")
	# The last catalog page must be reachable and choose the item that was clicked.
	game.load_stage(14)
	await _frames(2)
	var seen: Dictionary = {}
	for page in range(ceili(game.catalog.ordered_items.size() / 24.0)):
		game._show_catalog(page)
		_check_visible_glyphs("Catalog page %d" % (page + 1))
		for child in game.modal.get_children():
			if child is Button and child.has_meta("item_id"):
				seen[child.get_meta("item_id")] = true
	_check(seen.size() == game.catalog.ordered_items.size(), "Sandbox picker did not expose every catalog object")
	for index in range(game.catalog.ordered_items.size()):
		if game.catalog.ordered_items[index].id == "camera":
			game._show_catalog(index / 24)
			break
	var camera_button = _button_with_meta("item_id", "camera")
	_check(camera_button != null, "Sandbox camera page has no camera")
	if camera_button != null:
		camera_button.pressed.emit()
	_check(game.next_item_id() == "camera", "Catalog callback chose a different item")
	game.cannon.fire()
	_check(game.shots_fired == 1 and game.actors[0].item_id == "camera", "Selected sandbox item was not actually fired")
	# Visual samples come from the actual physical scene, not hand-placed mockups.
	game.load_stage(3)
	await _frames(180)
	game.cannon.fire()
	await _frames(170)
	var burning_trash = false
	for actor in game.actors:
		if actor.item_id in ["trash-bag", "newspaper"] and actor.burning:
			burning_trash = true
	_check(burning_trash, "Default alley molotov shot missed the flammable trash")
	await _snapshot("04-alley")
	# The volcano's first paper bundle must demonstrate ignition and consumption.
	game.load_stage(4)
	await _frames(2)
	game.cannon.fire()
	await _frames(180)
	_check(game.actors.size() == 1 and game.actors[0].burning, "Default volcano paper shot did not ignite on the floor")
	await _frames(480)
	_check(game.destroyed_counts.get("burned", 0) == 1, "Volcano paper did not disappear after burning")
	game.load_stage(17)
	await _frames(2)
	game.cannon.set_aim(40.0, 0.37)
	game.cannon.fire()
	await _frames(320)
	game.cannon.set_aim(38.0, 0.42)
	game.cannon.fire()
	await _frames(320)
	await _snapshot("18-ice")
	# Run all fifteen actual cannon signals. Keep the last item rotating to exercise
	# the bounded-settle fallback instead of waiting forever for a permanently moving item.
	game.load_stage(0)
	await _frames(2)
	for shot in range(15):
		if shot == 14:
			_check(not game.next_item_id().is_empty() and game.following_item_id().is_empty(), "Final loaded item should have no following NEXT item")
		game.cannon.set_aim(35.0, 0.45)
		game.cannon.fire()
		_check(game.shots_fired == shot + 1, "Shot queue did not advance exactly once")
		if shot < 14:
			await _frames(84)
	_check(game.next_item_id().is_empty(), "Fifteen-shot queue still has a next item")
	var last = game.actors.back()
	last.gravity_scale = 0.0
	last.position = Vector2(530, 190)
	last.linear_velocity = Vector2.ZERO
	last.angular_velocity = 8.0
	last.constant_torque = 100.0
	last.collision_layer = 0
	last.collision_mask = 0
	await _frames(1500)
	_check(game.result_shown and game.simulation_paused, "Fifteen shots did not enter the frozen result screen")
	_check(game.end_clock >= 12.0 and game.end_clock < 12.1, "Perpetual motion did not finalize at the 12-second bound")
	_check(game.score_caption.text == "さいしゅう得点" and game.score_label.text == "%04d" % game.score_value, "Result HUD does not show the final score")
	_check(game.result_capture_status == "headless" and game.result_jpeg.is_empty() and is_instance_valid(game.modal), "Headless result capture waited for an unavailable framebuffer")
	_check(game.result_stage_name == game.current_stage.nameJa, "Share result lost the formal Japanese stage name")
	var post = _button_with_meta("share_action", "tweet")
	_check(post != null and post.text == "X でポスト" and post.size.x >= 500.0, "Result is missing its wide X post action")
	_check_visible_glyphs("Result panel")
	await _snapshot("01-final-score", false)
	await _snapshot("01-result")
	observations.final_score = game.score_value
	observations.finalize_seconds = game.end_clock
	game.cannon.set_enabled(true)
	game.cannon.fire()
	_check(game.shots_fired == 15, "Result state admitted a sixteenth shot")
	var report = {"suite": "game", "engine": Engine.get_version_info().string, "checks": checks, "failures": failures, "observations": observations, "status": "passed" if failures.is_empty() else "failed", "verification": "Godot headless scene integration; no browser or rendered engine screenshot"}
	var file = FileAccess.open("res://previews/game-checks.json", FileAccess.WRITE)
	file.store_string(JSON.stringify(report, "\t"))
	print(JSON.stringify(report))
	quit(0 if failures.is_empty() else 1)
