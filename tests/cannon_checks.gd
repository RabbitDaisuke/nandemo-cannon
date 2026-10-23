extends SceneTree

const CannonScript = preload("res://src/cannon.gd")
var failures: Array[String] = []
var checks: int = 0
var shots: Array[Dictionary] = []
var aim_updates: int = 0


func _initialize() -> void:
	_run.call_deferred()


func _check(condition: bool, message: String) -> void:
	checks += 1
	if not condition:
		failures.append(message)


func _mouse(point: Vector2, pressed: bool) -> void:
	var event = InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.position = point
	event.global_position = point
	event.pressed = pressed
	root.push_input(event)


func _motion(point: Vector2) -> void:
	var event = InputEventMouseMotion.new()
	event.position = point
	event.global_position = point
	event.button_mask = MOUSE_BUTTON_MASK_LEFT
	root.push_input(event)


func _touch(point: Vector2, pressed: bool) -> void:
	var event = InputEventScreenTouch.new()
	event.position = point
	event.index = 0
	event.pressed = pressed
	root.push_input(event)


func _run() -> void:
	root.size = Vector2i(960, 540)
	var cannon = CannonScript.new()
	root.add_child(cannon)
	var ground = Vector2(810, 420)
	cannon.configure(ground)
	cannon.fired.connect(func(direction: Vector2, charge: float, origin: Vector2) -> void:
		shots.append({"direction": direction, "power": charge, "origin": origin})
	)
	cannon.aim_changed.connect(func(_angle: float, _charge: float) -> void:
		aim_updates += 1
	)
	await process_frame
	for angle in [5.0, 35.0, 85.0]:
		cannon.set_aim(angle, 0.65)
		var expected_direction = Vector2(-cos(deg_to_rad(angle)), -sin(deg_to_rad(angle)))
		_check(cannon.global_position.is_equal_approx(ground), "Changing elevation moved the carriage")
		_check(cannon.pivot_global().is_equal_approx(ground + Vector2(0, -55)), "Changing elevation moved the joint")
		_check(cannon.get_launch_direction().is_equal_approx(expected_direction), "Barrel direction differs from elevation")
		_check(cannon.get_muzzle().is_equal_approx(cannon.pivot_global() + expected_direction * 104), "Muzzle does not follow barrel rotation")
	_check(aim_updates == 3, "HUD aim signal did not follow set_aim")
	cannon.set_aim(200, 3.0)
	_check(is_equal_approx(cannon.elevation_degrees, 85.0) and is_equal_approx(cannon.power, 1.0), "Upper aim limits failed")
	cannon.set_aim(-200, -3.0)
	_check(is_equal_approx(cannon.elevation_degrees, 5.0) and is_equal_approx(cannon.power, 0.15), "Lower aim limits failed")
	cannon.set_aim(35.0, 0.65)
	var muzzle_before_shot = cannon.get_muzzle()
	var direction_before_shot = cannon.get_launch_direction()
	cannon.fire()
	_check(shots.size() == 1, "Enabled cannon did not fire")
	if shots.size() == 1:
		_check(shots[0].origin.is_equal_approx(muzzle_before_shot), "Shot origin used the wrong recoil frame")
		_check(shots[0].direction.is_equal_approx(direction_before_shot), "Shot direction differs from visible barrel")
	cannon.fire()
	_check(shots.size() == 1, "Debounce allowed a duplicate immediate shot")
	await create_timer(0.5).timeout
	cannon.set_enabled(false)
	cannon.fire()
	_check(shots.size() == 1, "Disabled cannon fired")
	cannon.set_enabled(true)
	var point = ground + Vector2(-10, -20)
	var moved = point + Vector2(-80, -60)
	_mouse(point, true)
	_motion(moved)
	_mouse(moved, false)
	await process_frame
	_check(shots.size() == 1, "Aiming drag fired on release")
	_check(cannon.elevation_degrees > 35.0 and cannon.power > 0.65, "Diagonal drag did not raise angle and power")
	var drag_angle = cannon.elevation_degrees
	var drag_power = cannon.power
	_mouse(point, true)
	_motion(point + Vector2(100, 0))
	_mouse(point + Vector2(100, 0), false)
	await process_frame
	_check(is_equal_approx(cannon.elevation_degrees, drag_angle) and cannon.power < drag_power, "Rightward drag did not reduce power while retaining angle")
	_check(shots.size() == 1, "Horizontal aiming drag fired on release")
	var adjusted_power = cannon.power
	_mouse(point, true)
	_mouse(point, false)
	await process_frame
	_check(shots.size() == 2, "Stationary mouse click did not fire")
	await create_timer(0.5).timeout
	_touch(point, true)
	_touch(point, false)
	_mouse(point, true)
	_mouse(point, false)
	await process_frame
	_check(shots.size() == 3, "Touch plus emulated mouse did not produce exactly one shot")
	_check(is_equal_approx(cannon.power, adjusted_power), "Firing or recoil altered the adjusted power")
	# A drag started on the cannon must end even when a GUI control consumes release.
	await create_timer(0.8).timeout
	var blocker = Button.new()
	blocker.position = Vector2(650, 120)
	blocker.size = Vector2(230, 100)
	root.add_child(blocker)
	_mouse(point, true)
	_motion(Vector2(720, 160))
	_mouse(Vector2(720, 160), false)
	await process_frame
	_check(not cannon._grabbed, "Drag remained captured after release over HUD")
	_check(shots.size() == 3, "Release over HUD fired an aiming drag")
	_check(cannon.power > adjusted_power, "Leftward drag over the HUD did not finish adjusting power")
	blocker.queue_free()
	var result = {"suite": "cannon", "checks": checks, "failures": failures, "status": "passed" if failures.is_empty() else "failed"}
	result["engine"] = Engine.get_version_info().string
	var output = FileAccess.open("res://previews/cannon-checks.json", FileAccess.WRITE)
	output.store_string(JSON.stringify(result, "\t"))
	output.close()
	print(JSON.stringify(result))
	quit(0 if failures.is_empty() else 1)
