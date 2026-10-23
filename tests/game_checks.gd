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


func _snapshot(name: String) -> void:
	game._update_hud()
	await process_frame
	DirAccess.make_dir_recursive_absolute("res://previews")
	var file = FileAccess.open("res://previews/game-state-" + name + ".json", FileAccess.WRITE)
	file.store_string(JSON.stringify(game.debug_snapshot(), "\t"))


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
	# Load every real terrain and texture; the last four remain non-playable previews.
	for index in range(20):
		game.load_stage(index)
		await _frames(2)
		_check(is_instance_valid(game.stage_root) and game.stage_root.get_child_count() > 3, "Stage %d failed to instantiate its scene" % (index + 1))
		_check(game.playable == (index < 16), "Preview map was turned into an invented playable stage")
		if index < 16:
			_check(game.shots_fired == 0 and not game.next_item_id().is_empty(), "Playable stage has no first item")
		else:
			_check(not game.cannon.enabled and game.next_item_id().is_empty(), "Unspecified map allows firing")
	game.load_stage(0)
	await _frames(2)
	await _snapshot("01-initial")
	game.cannon.fire()
	_check(game.shots_fired == 1 and game.actors.size() == 1, "Cannon signal did not create exactly one first item")
	var first_spin = game.actors[0].angular_velocity
	await _frames(480)
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
	var map_button = _button_with_meta("stage_index", 17)
	_check(map_button != null, "Map picker did not expose stage 18")
	if map_button != null:
		map_button.pressed.emit()
	await _frames(2)
	_check(game.stage_index == 17 and not game.playable, "Map tile callback loaded the wrong stage")
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
	for page in range(5):
		game._show_catalog(page)
		for child in game.modal.get_children():
			if child is Button and child.has_meta("item_id"):
				seen[child.get_meta("item_id")] = true
	_check(seen.size() == 117, "Sandbox picker did not expose all 117 distinct objects")
	var camera_button = _button_with_meta("item_id", "camera")
	_check(camera_button != null, "Sandbox last page has no camera")
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
	game.load_stage(15)
	await _frames(2)
	game.cannon.set_aim(40.0, 0.37)
	game.cannon.fire()
	await _frames(320)
	game.cannon.set_aim(38.0, 0.42)
	game.cannon.fire()
	await _frames(320)
	await _snapshot("16-ice")
	# Run all fifteen actual cannon signals. Keep the last item rotating to exercise
	# the bounded-settle fallback instead of waiting forever for a permanently moving item.
	game.load_stage(0)
	await _frames(2)
	for shot in range(15):
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
