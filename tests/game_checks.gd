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

func _click(point: Vector2, button_index: MouseButton) -> void:
	for pressed in [true, false]:
		var event = InputEventMouseButton.new()
		event.button_index = button_index
		event.position = point
		event.pressed = pressed
		root.push_input(event)

func _touch(index: int, point: Vector2, pressed: bool) -> void:
	var event = InputEventScreenTouch.new()
	event.index = index
	event.position = point
	event.pressed = pressed
	root.push_input(event, true)

func _touch_move(index: int, point: Vector2) -> void:
	var event = InputEventScreenDrag.new()
	event.index = index
	event.position = point
	root.push_input(event, true)

func _modal_motion_checks() -> void:
	game.load_stage(19)
	# This helper follows a frozen result. Stage load resumes at the next idle
	# boundary; physics_frame can emit several catch-up ticks before that boundary.
	await process_frame
	await _frames(2)
	_check(not paused and not game.simulation_paused, "A loaded stage did not resume after leaving the frozen result")
	var actor = game._create_actor(game.catalog.items["refrigerator"], Vector2(520, 180))
	actor.linear_velocity = Vector2(-35, -40)
	actor.angular_velocity = 0.7
	actor.constant_force = Vector2(8, -4)
	actor.constant_torque = 2.0
	var burner = game._create_actor(game.catalog.items["flamethrower"], Vector2(120, 180))
	burner.freeze = true
	game.hazards.on_launch(burner)
	await _frames(3)
	for kind in ["catalog", "maps", "seed"]:
		var expected_velocity = actor.linear_velocity
		var expected_spin = actor.angular_velocity
		var at = actor.position
		var elapsed = game.elapsed
		var fuel = burner.fuel_seconds
		if kind == "catalog":
			game._show_catalog()
		elif kind == "maps":
			game._show_maps()
		else:
			game._show_seed()
		_check(not paused and not game.simulation_paused and actor.linear_velocity.is_equal_approx(expected_velocity) and is_equal_approx(actor.angular_velocity, expected_spin), kind + " opening paused or altered momentum")
		await _frames(12)
		_check(actor.position != at and actor.linear_velocity.y > expected_velocity.y and game.elapsed > elapsed and burner.fuel_seconds < fuel, kind + " modal stopped flight, gravity, fuel, or the game clock")
		_check(not game.cannon.enabled, kind + " modal allowed cannon input behind the UI")
		var velocity = actor.linear_velocity
		var spin = actor.angular_velocity
		var sleeping = actor.sleeping
		game._close_modal()
		_check(not paused and actor.linear_velocity.is_equal_approx(velocity) and is_equal_approx(actor.angular_velocity, spin), kind + " modal erased linear or angular momentum")
		_check(actor.constant_force == Vector2(8, -4) and is_equal_approx(actor.constant_torque, 2.0) and actor.sleeping == sleeping and not actor.freeze, kind + " modal altered force, sleep, or freeze state")
	# Already frozen/sleeping objects retain their own state as well.
	actor.freeze = true
	actor.sleeping = true
	game._show_catalog()
	game._close_modal()
	_check(actor.freeze and actor.sleeping, "Modal resume unconditionally woke or unfroze an object")
	game.shots_fired = 15
	game._update_hud()
	game._show_catalog()
	_check(game.catalog_button.disabled and not is_instance_valid(game.modal) and not paused, "Empty queue still opened the item picker")

func _pinch_checks() -> void:
	game.load_stage(0)
	await _frames(2)
	var actor = game._create_actor(game.catalog.items["soccer-ball"], Vector2(500, 180))
	actor.linear_velocity = Vector2(-20, -30)
	var at = actor.position
	var elapsed = game.elapsed
	var aim = Vector2(game.cannon.elevation_degrees, game.cannon.power)
	var first = game.cannon.position + Vector2(-10, -20)
	_touch(0, first, true)
	_check(game.cannon._grabbed, "First touch did not begin cannon capture")
	_touch(1, first - Vector2(160, 0), true)
	var anchor = game.touch_zoom.view_transform.affine_inverse() * (first - Vector2(80, 0))
	_touch_move(0, first + Vector2(40, 20))
	_touch_move(1, first - Vector2(200, -20))
	var center = first - Vector2(80, -20)
	_check(game.touch_zoom.gesture_active and not game.cannon._grabbed and game.cannon.input_suspended, "Second touch failed to cancel the pending cannon tap")
	_check(is_equal_approx(game.touch_zoom.zoom, 1.5) and (game.touch_zoom.view_transform * anchor).distance_to(center) < 0.01, "Pinch did not keep the touched world anchor under the moving center")
	_check(game.ui.transform == game.touch_zoom.view_transform and root.canvas_transform == game.touch_zoom.view_transform, "HUD and world zoom transforms differ")
	_check(Vector2(game.cannon.elevation_degrees, game.cannon.power) == aim and game.shots_fired == 0, "Pinch changed aim or fired")
	await _frames(12)
	_check(not paused and game.elapsed > elapsed and actor.position != at and is_equal_approx(Engine.time_scale, 1.0), "Pinch paused or changed the running physics simulation")
	_touch(2, Vector2(500, 250), true)
	var before_membership = game.touch_zoom.view_transform
	_touch(2, Vector2(500, 250), false)
	_check(game.touch_zoom.view_transform == before_membership, "Adding or removing a third finger jumped the view")
	_touch(1, first - Vector2(200, -20), false)
	_touch_move(0, first + Vector2(120, -90))
	_check(game.touch_zoom.gesture_active and game.shots_fired == 0 and Vector2(game.cannon.elevation_degrees, game.cannon.power) == aim, "Remaining finger resumed gameplay before all fingers lifted")
	_touch(0, first + Vector2(120, -90), false)
	_check(not game.touch_zoom.gesture_active and not game.cannon.input_suspended and game.shots_fired == 0, "Final pinch release fired or retained the input lock")
	# Fresh single-finger input is inverse-transformed through the zoom.
	var screen_cannon = game.touch_zoom.view_transform * first
	_touch(0, screen_cannon, true)
	_touch(0, screen_cannon, false)
	_check(game.shots_fired == 1, "Cannon tap after zoom used unscaled hit coordinates")
	# Pinching from a pressed GUI button must cancel its pending action.
	game.touch_zoom.reset_view()
	_touch(0, Vector2(832, 26), true)
	_touch(1, Vector2(630, 26), true)
	_touch(1, Vector2(630, 26), false)
	_touch(0, Vector2(832, 26), false)
	_check(not is_instance_valid(game.modal), "Pinch release activated the initially pressed map button")
	# Clamp both ends and return to an exact unzoomed origin.
	_touch(0, Vector2(400, 270), true)
	_touch(1, Vector2(560, 270), true)
	_touch_move(0, Vector2(-400, 270))
	_touch_move(1, Vector2(1360, 270))
	_check(is_equal_approx(game.touch_zoom.zoom, 2.5), "Pinch exceeded the maximum zoom")
	_touch_move(0, Vector2(479, 270))
	_touch_move(1, Vector2(481, 270))
	_check(game.touch_zoom.view_transform.is_equal_approx(Transform2D.IDENTITY), "Zooming below one left an offset or undersized game")
	_touch(0, Vector2(479, 270), false)
	_touch(1, Vector2(481, 270), false)
	# Godot GUI hit testing follows the same CanvasLayer transform as the world.
	_touch(0, Vector2(792, 26), true)
	_touch(1, Vector2(872, 26), true)
	_touch_move(0, Vector2(752, 26))
	_touch_move(1, Vector2(912, 26))
	_touch(0, Vector2(752, 26), false)
	_touch(1, Vector2(912, 26), false)
	var map_at = game.touch_zoom.view_transform * Vector2(832, 26)
	_touch(0, map_at, true)
	_touch(0, map_at, false)
	_check(is_instance_valid(game.modal) and not paused, "Zoomed GUI map button did not receive its transformed touch without pausing")
	game._close_modal()
	game.touch_zoom.reset_view()
	# Sliders receive native touch because mouse emulation is disabled for pinch.
	var slider_at = game.power_slider.get_global_rect().position
	_touch(0, slider_at + Vector2(game.power_slider.size.x * 0.5, 10), true)
	_touch_move(0, slider_at + Vector2(game.power_slider.size.x * 0.6, 10))
	_touch(0, slider_at + Vector2(game.power_slider.size.x * 0.6, 10), false)
	_check(is_equal_approx(game.cannon.power, 0.66), "Native single-finger slider drag did not update power without mouse emulation")

func _score_and_wait_checks() -> void:
	game.load_stage(0)
	await _frames(2)
	var actor = game._create_actor(game.catalog.items["refrigerator"], Vector2(220, 300))
	actor.freeze = true
	var ground_y = float(game.current_stage.get("scoreGroundY", game.score_zone.end.y))
	actor.position.y += ground_y - 80.5 - actor.get_world_bounds().get_center().y
	var base_score = int(actor.record.score)
	_check(game.calculate_score() == base_score + 50, "Height score is not five 16px rows above the scoring floor")
	actor.position.y -= 16
	_check(game.calculate_score() == base_score + 60, "Raising a valid object one row did not add ten points")
	actor.position.x += 24
	_check(game.calculate_score() == base_score + 60, "Horizontal distance changed the height bonus")
	_check(game.score_value == 0, "Score refreshed before the half-second update")
	await _frames(64)
	_check(game.score_value == base_score + 60, "HUD did not recompute the current score after half a second")
	await _frames(64)
	_check(game.score_value == base_score + 60, "Score accumulated repeatedly instead of replacing the current total")
	var valid_position = actor.position
	actor.position.y += game.score_zone.end.y + 0.3 - actor.get_world_bounds().end.y
	_check(game.calculate_score() >= base_score, "Subpixel contact with the real floor incorrectly excludes a valid item")
	actor.position.y += 2.0
	_check(game.calculate_score() == 0, "An item beyond the floor-contact tolerance still scores")
	actor.position = valid_position
	actor.position.x += game.score_zone.position.x - 0.1 - actor.get_world_bounds().position.x
	_check(game.calculate_score() == 0, "Floor tolerance leaked into the left boundary")
	actor.position = valid_position
	actor.position.x += game.score_zone.end.x + 0.1 - actor.get_world_bounds().end.x
	_check(game.calculate_score() == 0, "An outside tower gained points through right-boundary tolerance")
	actor.position = valid_position
	actor.position.y += game.score_zone.position.y - 0.1 - actor.get_world_bounds().position.y
	_check(game.calculate_score() == 0, "Floor tolerance leaked into the top boundary")
	actor.position = valid_position
	actor.can_score = false
	_check(game.calculate_score() == 0, "A non-scoring item received height points")
	actor.can_score = true
	actor.alive = false
	_check(game.calculate_score() == 0, "A destroyed item received height points")
	actor.alive = true
	actor.set_meta("score_penalty", -100)
	_check(game.calculate_score() == -100, "Fixed obstacle penalty received a height bonus")
	actor.position.y -= 16
	_check(game.calculate_score() == -100, "Moving a penalty object vertically changed its fixed penalty")
	actor.position.x = game.score_zone.end.x + 100
	_check(game.calculate_score() == 0, "An out-of-zone penalty object still subtracts points")
	game.destroy_actor(actor, "test")
	_check(game.calculate_score() == 0, "Destroyed penalty still affects the total")
	# Exercise the waiting flow with a real launched body and impact callback.
	game.load_stage(0)
	await _frames(2)
	game.cannon.fire()
	var waiting = game.actors[0]
	waiting.freeze = true
	waiting.is_launched = true
	waiting.set_meta("has_landed", false)
	game.shots_fired = 15
	game._launched_count = 15
	game._landed_count = 14
	await _frames(2)
	_check(is_equal_approx(Engine.time_scale, 1.0), "Waiting accelerated before the final projectile landed")
	game.on_actor_impact(waiting, waiting.position, 0.0, 0.0)
	await _frames(2)
	_check(is_equal_approx(Engine.time_scale, 1.5) and Engine.physics_ticks_per_second == game._base_physics_ticks * 3 / 2, "Landed waiting flow did not preserve physics step size at 1.5x")
	game._update_hud()
	game._show_maps()
	_check(game.map_button.disabled and not is_instance_valid(game.modal), "Empty queue admitted a gameplay map picker")
	game._show_seed()
	_check(is_equal_approx(Engine.time_scale, 1.5) and Engine.physics_ticks_per_second == game._base_physics_ticks * 3 / 2 and not paused, "Opening a manual modal changed waiting physics speed")
	game._close_modal()
	_check(is_equal_approx(Engine.time_scale, 1.5), "Closing a manual modal changed waiting physics speed")
	game.load_stage(1)
	_check(is_equal_approx(Engine.time_scale, 1.0), "Changing stage retained accelerated simulation")


func _water_dud_score_checks() -> void:
	game.load_stage(14)
	await _frames(2)
	game.selected_catalog_id = "bomb"
	game._update_hud()
	game.cannon.fire()
	var bomb = game.actors.back()
	bomb.freeze = true
	bomb.position = game.score_zone.get_center()
	_check(bomb.item_id == "bomb" and not bomb.can_score and game.calculate_score() == 0, "A live ordinary bomb scored before submersion")
	game.liquid.regions = [{"rect": bomb.get_world_bounds().grow(12.0), "velocity": Vector2.ZERO}]
	_check(game.liquid.submerged_fraction(bomb) >= 0.5, "Wet-bomb scoring fixture does not submerge half of the actual collider")
	game.hazards.tick(0.01)
	var ground_y = float(game.current_stage.get("scoreGroundY", game.score_zone.end.y))
	var expected = 100 + 10 * int(floor(maxf(0.0, ground_y - bomb.get_world_bounds().get_center().y) / 16.0))
	_check(bool(bomb.get_meta("water_dud", false)) and bomb.can_score and int(bomb.record.score) == 100 and game.calculate_score() == expected, "A submerged ordinary bomb did not become a 100-point object with the normal height bonus")
	bomb.position.x = game.score_zone.end.x + 100.0
	_check(game.calculate_score() == 0, "A disarmed bomb outside the score zone still scored")


func _snapshot(name: String, include_modal: bool = true) -> void:
	game._update_hud()
	await process_frame
	DirAccess.make_dir_recursive_absolute("res://previews")
	var file = FileAccess.open("res://previews/game-state-" + name + ".json", FileAccess.WRITE)
	file.store_string(JSON.stringify(game.debug_snapshot(include_modal), "\t"))


func _check_visible_glyphs(context: String) -> void:
	var missing: Dictionary = {}
	for control in game.debug_snapshot().controls:
		if control.type in ["label", "button", "line_edit"]:
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

func _type_catalog_query(value: String) -> void:
	# LineEdit emits this signal after committed input/paste, not IME preedit.
	game.catalog_search_edit.text = value
	game.catalog_search_edit.caret_column = value.length()
	game.catalog_search_edit.text_changed.emit(value)

func _catalog_search_checks() -> void:
	game.load_stage(37)
	await _frames(2)
	game._show_catalog(2)
	var edit: LineEdit = game.catalog_search_edit
	var editor_id = edit.get_instance_id()
	_check(edit.text.is_empty() and game.catalog_query.is_empty() and game.catalog_results.size() == game.catalog.ordered_items.size(), "Opening the catalog did not start with an empty unfiltered search")
	_check(not edit.has_focus(), "Opening the mobile item list forced a software keyboard focus")
	edit.grab_focus()
	_type_catalog_query("かみなり")
	_check(game.catalog_results.size() == 1 and game.catalog_results[0].id == "lightning-orb" and _button_with_meta("item_id", "lightning-orb") != null, "Lightning query did not show only its named magic item")
	_check(game.catalog_search_edit.get_instance_id() == editor_id and edit.has_focus() and edit.caret_column == 4, "Refreshing search replaced the input or lost its focus/caret")
	edit.text_submitted.emit(edit.text)
	_check(game.catalog_recent_searches == ["かみなり"], "Submitting a query did not add one completed search to recent history")
	_check_visible_glyphs("Filtered lightning catalog")
	await _snapshot("catalog-search")
	_type_catalog_query("たべもの")
	_check(game.catalog_results.size() > 24 and game.catalog_result_page == 0, "Food query has no second result page or did not reset filtered paging")
	var next = _button_with_meta("catalog_next", true)
	if next != null:
		next.pressed.emit()
	_check(game.catalog_query == "たべもの" and game.catalog_result_page == 1 and edit.get_instance_id() == editor_id and edit.has_focus(), "Paging filtered results discarded the query or recreated its focused input")
	_check(game.catalog_page == 2, "Filtered page navigation overwrote the remembered unfiltered page")
	game._close_modal()
	_check(game.catalog_query.is_empty() and game.catalog_recent_searches == ["たべもの", "かみなり"], "Closing search retained a hidden filter or failed to keep the last two queries")
	game._show_catalog()
	_check(game.catalog_search_edit.text.is_empty() and game.catalog_results.size() == game.catalog.ordered_items.size() and game.catalog_page == 2, "Reopening catalog silently reused the last filter or lost its unfiltered page")
	for button in game.catalog_recent_buttons:
		_check(button.position.x >= game.catalog_search_edit.position.x + game.catalog_search_edit.size.x and button.position.x + button.size.x <= 772, "Recent searches are not entirely to the right of the input and before Close")
	await _snapshot("catalog-search-history")
	_button_with_meta("recent_search", 1).pressed.emit()
	_check(game.catalog_query == "かみなり" and game.catalog_results.size() == 1, "Clicking the second recent query failed to restore its results")
	_type_catalog_query("カミナリ")
	game.catalog_search_edit.text_submitted.emit("カミナリ")
	_check(game.catalog_recent_searches == ["カミナリ", "たべもの"], "Kana-equivalent recent searches were duplicated instead of moving one entry to the front")
	_type_catalog_query("み水ず漢😀")
	_check(game.catalog_search_edit.text == "みず" and game.catalog_query == "みず" and game.catalog_search_notice.text == "つかえないもじを はずしました", "Committed kanji or unsupported glyphs remained in the input or were rejected without feedback")
	_type_catalog_query("ぬぬぬぬぬ")
	_check(game.catalog_results.is_empty() and _button_with_meta("catalog_next", true).disabled and _button_with_meta("catalog_previous", true).disabled, "No-match results displayed stale items or enabled invalid page navigation")
	_type_catalog_query("みず")
	game.catalog_search_edit.grab_focus()
	var before_stage = game.stage_index
	var before_shots = game.shots_fired
	var before_angle = game.cannon.elevation_degrees
	for code in [KEY_SPACE, KEY_R, KEY_M, KEY_UP, KEY_DOWN]:
		var key = InputEventKey.new()
		key.pressed = true
		key.keycode = code
		root.push_input(key)
	_check(game.stage_index == before_stage and game.shots_fired == before_shots and is_equal_approx(game.cannon.elevation_degrees, before_angle) and game._is_catalog_open(), "Typing in search leaked gameplay fire, reset, map, or aiming shortcuts")
	_type_catalog_query("カミナリ")
	var lightning = _button_with_meta("item_id", "lightning-orb")
	if lightning != null:
		lightning.pressed.emit()
	_check(game.selected_catalog_id == "lightning-orb" and not is_instance_valid(game.modal), "Choosing a filtered result selected a different object or left the picker open")
	game.load_stage(19)
	await _frames(2)
	game._show_catalog()
	_check(game.catalog_query.is_empty() and game.catalog_page == 0 and game.catalog_recent_searches.size() == 2, "Changing stages leaked a search/page or cleared the in-memory recent searches")
	_check_visible_glyphs("Search header and recent buttons")
	game._close_modal()


func _late_stage_checks() -> void:
	game.load_stage(35)
	await _frames(2)
	_check(not game.power_slider.visible and not game.power_label.visible and game.angle_slider.visible, "Random cannon did not hide only its power controls")
	game.cannon.set_aim(40, 0.15)
	_check(is_equal_approx(game.cannon.elevation_degrees, 40) and is_equal_approx(game.cannon.power, 0.65), "Random stage allowed manual power changes or blocked angle changes")
	_check(game.debug_snapshot().trajectory.size() <= 5, "Random stage trajectory was not shortened to half")
	var first_queue = game.current_stage.queue.duplicate()
	game.cannon.fire()
	_check(game.shots_fired == 1 and game.actors.size() == 1, "Random cannon did not create a real thrown body")
	var first_power = game.cannon.power
	game.load_stage(35)
	await _frames(2)
	game.cannon.fire()
	_check(game.current_stage.queue == first_queue and is_equal_approx(game.cannon.power, first_power), "Random stage seed did not reproduce items and shot strength")
	game.load_stage(36)
	await _frames(2)
	_check(game.power_slider.visible and game.power_label.visible and game.cannon.is_power_adjustable(), "Leaving random cannon did not restore normal power controls")
	var faller = game._create_actor(game.catalog.items["rice-bowl"], Vector2(655, 470))
	await _frames(90)
	_check(not is_instance_valid(faller) or not faller.alive, "Restaurant2 gap did not remove fallen objects")
	game.load_stage(37)
	await _frames(2)
	_check(game.catalog_button.visible and game.liquid.regions.size() > 0, "Beach did not start with water and free item choice")
	if not game.liquid.regions.is_empty():
		var beach_pool: Dictionary = game.liquid.regions[0]
		_check(bool(beach_pool.get("finite", false)) and float(beach_pool.get("remaining", 0.0)) > 0.0 and Vector2(beach_pool.velocity).is_zero_approx(), "Beach pool was infinite, empty or applied an artificial sideways current")
	_check(float(game.catalog.items["sponge"].physics.capacity) == 24.0 and float(game.catalog.items["towel"].physics.capacity) == 12.0, "Absorbent item capacities do not counter a jug and a balloon respectively")
	game._show_catalog(2)
	game._close_modal()
	game._show_catalog()
	_check(game.catalog_page == 2, "Reopening the item picker forgot this stage's page")
	var choice = _button_with_meta("item_id", str(game.catalog.ordered_items[48].id))
	_check(choice != null, "Remembered picker page did not show the corresponding items")
	if choice != null:
		choice.pressed.emit()
	game._show_catalog()
	_check(game.catalog_page == 2, "Selecting an item reset the remembered picker page")
	game._finish_stage(false)
	_check(game.catalog_page == 0, "Completing a stage retained the previous picker page")
	game.load_stage(37)
	await process_frame
	await _frames(2)
	game._show_catalog()
	_check(game.catalog_page == 0, "A new stage attempt inherited a previous picker page")
	game._close_modal()
	game.load_stage(38)
	await _frames(2)
	_check(game.current_stage.queue.size() == 15 and game.playable, "Cafe failed to load a playable fifteen-shot queue")

func _preplaced_scoring_checks() -> void:
	# The same data contract applies to every stage, including future additions.
	game.load_stage(0)
	await _frames(2)
	var neutral = game._create_preplaced_actor({"id": "desktop-pc", "x": 200, "groundY": 380})
	neutral.freeze = true
	_check(not neutral.can_score and game.calculate_score() == 0, "A placement without scoring opted neutral scenery into points")
	game.destroy_actor(neutral, "test")
	var disabled = game._create_preplaced_actor({"id": "desktop-pc", "x": 200, "groundY": 380, "scoring": false})
	disabled.freeze = true
	_check(not disabled.can_score and game.calculate_score() == 0, "Explicitly neutral placement still awarded points")
	game.destroy_actor(disabled, "test")
	var scored = game._create_preplaced_actor({"id": "desktop-pc", "x": 200, "groundY": 380, "scoring": true})
	scored.freeze = true
	var initial = game.calculate_score()
	_check(scored.can_score and not scored.is_launched and initial > int(scored.record.score), "Scoring placement did not receive ordinary base and vertical height points without a shot")
	scored.position.y -= 32.0
	_check(game.calculate_score() == initial + 20, "Placed scoring object does not share the 16px height-bonus rule")
	scored.position.x += 24.0
	_check(game.calculate_score() == initial + 20, "Horizontal movement changed a placed object's height bonus")
	var valid_position = scored.position
	scored.position.x = game.score_zone.end.x + 100.0
	_check(game.calculate_score() == 0, "Placed scoring object retained points outside the target")
	scored.position = valid_position
	game.destroy_actor(scored, "test")
	_check(game.calculate_score() == 0, "Destroyed placed scoring object retained its points")
	var penalty = game._create_preplaced_actor({"id": "bowling-pin", "x": 200, "groundY": 380, "scoring": true, "scorePenalty": 90})
	penalty.freeze = true
	_check(penalty.can_score and game.calculate_score() == -90, "Placement penalty did not override ordinary positive scoring")
	penalty.position.y -= 32.0
	_check(game.calculate_score() == -90, "Placement penalty incorrectly gained a height bonus")
	game.destroy_actor(penalty, "test")

func _office_stage_checks() -> void:
	game.load_stage(39)
	await _frames(240)
	var office_queue: Array = game.current_stage.queue
	_check(game.stage_index == 39 and game.playable and office_queue.size() == 15, "Office did not load as stage 40 with fifteen throws")
	_check(office_queue.count("blast-bomb") == 2 and office_queue.count("flamethrower") == 1 and office_queue[4] == "blast-bomb" and office_queue[7] == "flamethrower" and office_queue[10] == "blast-bomb", "Office lost its two interleaved strong bombs or one flamethrower")
	var initial_ids: Array[String] = []
	var monitor: ThrowBody = null
	var all_scoring = true
	for actor in game.actors:
		initial_ids.append(actor.item_id)
		all_scoring = all_scoring and actor.can_score and not actor.is_launched and not actor.freeze
		if actor.item_id == "monitor":
			monitor = actor
	_check(initial_ids.has("desktop-pc") and initial_ids.has("keyboard") and initial_ids.has("wired-mouse") and initial_ids.has("monitor"), "Office is missing physical default computer equipment")
	_check(all_scoring and game.shots_fired == 0, "Office default equipment is neutral, frozen, or consumes a throw")
	var initial_score = game.calculate_score()
	observations.office_initial_score = initial_score
	observations.office_initial_items = initial_ids
	_check(initial_score >= initial_ids.size() * 100 and game.score_value == initial_score, "Office equipment did not begin with a visible positive score after settling")
	await _snapshot("40-office")
	# Physically moving or destroying a default prop must remove its contribution.
	# Freeze only in this isolated test so unrelated falling bodies cannot mask it.
	for actor in game.actors:
		actor.freeze = true
	if monitor != null:
		var valid_position = monitor.position
		monitor.position.x = game.score_zone.end.x + 100.0
		var outside_score = game.calculate_score()
		_check(outside_score <= initial_score - int(monitor.record.score), "An office monitor outside the target kept its initial points")
		monitor.position = valid_position
		_check(game.calculate_score() == initial_score, "Returning the office monitor did not restore its ordinary score")
		game.destroy_actor(monitor, "test")
		_check(game.calculate_score() == outside_score, "Destroying office equipment failed to remove its base and height points")

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
		_check(game.loaded_label.text == game._item_display_name(game.next_item_id()) and game.loaded_label.get_global_rect().end.x <= 948, "Loaded item name is missing or extends outside the HUD")
		_check(game.lesson_label.position.x == game.score_label.position.x and game.lesson_label.position.y >= game.score_label.get_global_rect().end.y and game.lesson_label.get_global_rect().end.x < game.next_name.position.x, "Lesson is not below the score or overlaps the NEXT label")
		_check(game.lesson_label.get_line_count() <= 3 and game.lesson_label.get_global_rect().end.y <= 127.0, "Lesson extends beyond the upper HUD")
		if index in [32, 34]:
			var lesson_lines = game.lesson_label.text.split("\n")
			_check(lesson_lines[-1].length() > 2 and not game.lesson_label.text.contains("えらんで\nも") and not game.lesson_label.text.contains("かた\nち"), "Lesson split a short phrase or left an isolated ending")
		_check_visible_glyphs("Stage %d HUD" % (index + 1))
		if index >= 20:
			await _snapshot(str(game.current_stage.map))
	await _late_stage_checks()
	await _preplaced_scoring_checks()
	await _office_stage_checks()
	await _catalog_search_checks()
	game.load_stage(0)
	await _frames(2)
	await _snapshot("01-initial")
	_check(game.tutorial_active and game.tutorial_label.visible and game.debug_snapshot().tutorialArrows.size() == 4, "First stage is missing its four-direction aiming tutorial")
	var logo = game.ui_root.get_node_or_null("GameLogo") as TextureRect
	_check(logo != null and logo.size.x <= 260.0 and logo.size.y <= 60.0 and logo.get_global_rect().end.x < game.score_label.position.x, "Logo texture minimum size overlaps the score HUD")
	var preview_probe = game._create_actor(game.catalog.items[game.next_item_id()], Vector2(600, 180))
	_check(game.loaded_icon.texture == preview_probe.visual.texture and game.loaded_icon.scale.is_equal_approx(preview_probe.visual.scale), "Loaded preview is not 1:1 with its real projectile")
	game.actors.erase(preview_probe)
	preview_probe.free()
	_check(game.next_item_id() == game.current_stage.queue[0] and game.following_item_id() == game.current_stage.queue[1], "Loaded and NEXT previews do not represent successive items")
	_check(game.loaded_icon.visible and game.next_icon.texture.resource_path.ends_with(str(game.catalog.items[game.following_item_id()].svg)), "NEXT icon displays the loaded item instead of the following object")
	_check(game.bgm_button != null and game.bgm_volume_slider != null and is_equal_approx(game.bgm_volume_slider.value, 2.5), "Gameplay music controls are missing or default volume is too high")
	var trajectory = game.debug_snapshot().trajectory
	_check(not trajectory.is_empty() and str(trajectory[0][3]) == "ff67dbff", "Trajectory does not record its distinct high-contrast color")
	var drag_origin = Vector2(480, 270)
	var press = InputEventMouseButton.new()
	press.button_index = MOUSE_BUTTON_LEFT
	press.position = drag_origin
	press.pressed = true
	root.push_input(press)
	_check(game.cannon._grabbed and game.shots_fired == 0, "Open playfield press fired immediately instead of waiting for a drag or release")
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
	# Capture owns release before GUI dispatch: a tiny movement onto a button
	# must not fire, even when it is below the normal drag slop.
	var input_blocker = Button.new()
	input_blocker.position = Vector2(600, 250)
	input_blocker.size = Vector2(80, 36)
	game.ui_root.add_child(input_blocker)
	press.position = Vector2(598, 265)
	root.push_input(press)
	release.position = Vector2(602, 265)
	root.push_input(release)
	_check(not game.cannon._grabbed and game.shots_fired == 0, "Small release into a GUI button fired the cannon")
	press.position = Vector2(620, 265)
	root.push_input(press)
	_check(not game.cannon._grabbed, "GUI button press started aiming")
	release.position = press.position
	root.push_input(release)
	input_blocker.free()
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
	_click(Vector2(600, 170), MOUSE_BUTTON_MIDDLE)
	_check(game.shots_fired == 1 and game.actors.size() == 1, "Cannon signal did not create exactly one first item")
	_click(Vector2(600, 170), MOUSE_BUTTON_MIDDLE)
	_check(game.shots_fired == 1, "Middle-click bypassed shot cooldown")
	_check(game.shot_audio.stream != null and game.shot_audio.playing and is_equal_approx(db_to_linear(game.shot_audio.volume_db), 0.25), "Successful cannon shot did not play its sound at quarter volume")
	var first_spin = game.actors[0].angular_velocity
	await _frames(480)
	_check(is_equal_approx(game.cannon.power, 0.65) and is_equal_approx(game.power_slider.value, 65), "Firing or elapsed simulation changed the selected power")
	_check(game.next_item_id() == game.current_stage.queue[1] and game.following_item_id() == game.current_stage.queue[2], "Loaded and NEXT previews did not advance together after firing")
	observations.first_shot_score = game.calculate_score()
	observations.first_shot_bodies = game.actors.size()
	observations.first_shot_floor_overlap = game.actors[0].get_world_bounds().end.y - game.score_zone.end.y
	_check(game.calculate_score() >= 300, "Default stage 1 first shot did not land the refrigerator inside the target")
	_click(game.power_slider.position + Vector2(80, 10), MOUSE_BUTTON_MIDDLE)
	_check(game.shots_fired == 1, "Middle-click on a HUD control fired into the game")
	_click(Vector2(600, 170), MOUSE_BUTTON_LEFT)
	_check(game.shots_fired == 2, "Left-click on open game space did not fire")
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
	var reached: Dictionary = {}
	var map_pages = ceili(game.catalog.stages.size() / float(game.MAPS_PER_PAGE))
	for page in range(map_pages):
		_check(game.map_page == page, "Map page navigation selected the wrong page")
		_check_visible_glyphs("Map picker page %d" % (page + 1))
		await _snapshot("maps-page-%d" % (page + 1))
		for child in game.modal.get_children():
			if child is Button and child.has_meta("stage_index"):
				reached[child.get_meta("stage_index")] = true
				_check(child.position.y + child.size.y < 348, "Map tile overlaps page navigation")
		if page + 1 < map_pages:
			var next_page = _button_with_meta("map_page", page + 1)
			_check(next_page != null and not next_page.disabled, "Map picker has no next page action")
			if next_page != null:
				next_page.pressed.emit()
	var last_stage = game.catalog.stages.size() - 1
	_check(reached.size() == game.catalog.stages.size() and reached.has(last_stage), "Map pages did not expose every stage")
	var last_map = _button_with_meta("stage_index", last_stage)
	if last_map != null:
		last_map.pressed.emit()
	_check(game.stage_index == last_stage and not paused, "Last map tile did not load the final stage and resume")
	game._show_maps(1)
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
	observations.home_scoring_floor_overlaps = []
	for actor in game.actors:
		if actor.can_score:
			observations.home_scoring_floor_overlaps.append(actor.get_world_bounds().end.y - game.score_zone.end.y)
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
	var camera_page: int = 0
	for index in range(game.catalog.ordered_items.size()):
		if game.catalog.ordered_items[index].id == "camera":
			camera_page = index / 24
			game._show_catalog(camera_page)
			break
	var camera_button = _button_with_meta("item_id", "camera")
	_check(camera_button != null, "Sandbox camera page has no camera")
	if camera_button != null:
		camera_button.pressed.emit()
	_check(game.next_item_id() == "camera", "Catalog callback chose a different item")
	_check(game.loaded_label.text == game._item_display_name("camera"), "Selecting an item did not update its loaded name")
	game.cannon.fire()
	_check(game.shots_fired == 1 and game.actors[0].item_id == "camera", "Selected sandbox item was not actually fired")
	game.load_stage(19)
	await _frames(2)
	_check(game.current_stage.queue == game.catalog.stages[19].queue and game.next_item_id() == str(game.catalog.stages[19].queue[0]), "Laboratory without a selection lost its original queue")
	game._show_catalog(camera_page)
	camera_button = _button_with_meta("item_id", "camera")
	if camera_button != null:
		camera_button.pressed.emit()
	game.cannon.fire()
	_check(camera_button != null and game.next_item_id() == "camera" and game.actors.back().item_id == "camera", "Laboratory did not launch its freely selected item")
	for index in range(20, game.catalog.stages.size()):
		if not bool(game.catalog.stages[index].get("selectAnyCatalogItem", false)):
			continue
		game.load_stage(index)
		await _frames(2)
		_check(game.next_item_id() == str(game.current_stage.queue[0]) and game.current_stage.queue.size() == 15, "New free-choice stage lost its default fifteen-item queue")
		game._show_catalog(camera_page)
		var extra_choice = _button_with_meta("item_id", "camera")
		if extra_choice != null:
			extra_choice.pressed.emit()
		game.cannon.fire()
		_check(extra_choice != null and game.shots_fired == 1 and game.actors.back().item_id == "camera", "New free-choice stage did not use the catalog flag")
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
	var velocity_before_map = last.linear_velocity
	var spin_before_map = last.angular_velocity
	_click(game.map_button.position + Vector2(12, 12), MOUSE_BUTTON_LEFT)
	game._show_maps()
	_check(game.map_button.disabled and not is_instance_valid(game.modal) and last.linear_velocity == velocity_before_map and last.angular_velocity == spin_before_map, "Empty gameplay map action was not a disabled no-op")
	game._show_seed()
	var waiting_modal_id = game.modal.get_instance_id()
	await _frames(1500)
	_check(game.result_shown and game.simulation_paused, "Fifteen shots did not enter the frozen result screen")
	_check(is_instance_valid(game.modal) and game.modal.get_instance_id() != waiting_modal_id, "Final score did not replace the open seed picker")
	_check(game.end_clock >= 12.0 and game.end_clock < 12.1, "Perpetual motion did not finalize at the 12-second bound")
	_check(game.score_caption.text == "とくてん" and game.score_label.text == "%04d" % game.score_value, "Result HUD does not show the final score")
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
	var result_maps = _button_with_meta("result_navigation", "maps")
	_check(result_maps != null and not result_maps.disabled, "Result map navigation was disabled with the empty gameplay map button")
	if result_maps != null:
		result_maps.pressed.emit()
	_check(_button_with_meta("stage_index", 0) != null, "Result map navigation did not open the map picker")
	await _modal_motion_checks()
	await _pinch_checks()
	await _water_dud_score_checks()
	await _score_and_wait_checks()
	var report = {"suite": "game", "engine": Engine.get_version_info().string, "checks": checks, "failures": failures, "observations": observations, "status": "passed" if failures.is_empty() else "failed", "verification": "Godot headless scene integration; no browser or rendered engine screenshot"}
	var file = FileAccess.open("res://previews/game-checks.json", FileAccess.WRITE)
	file.store_string(JSON.stringify(report, "\t"))
	file.close()
	print(JSON.stringify(report))
	# The final waiting-speed check fires a shot immediately before shutdown.
	# Let the audio thread consume its queued stop before releasing the scene.
	game.shot_audio.stop()
	await create_timer(0.25, true, false, true).timeout
	game.queue_free()
	await process_frame
	await process_frame
	quit(0 if failures.is_empty() else 1)
