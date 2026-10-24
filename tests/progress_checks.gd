extends SceneTree
## Storage routing only: never enter the scene tree or touch real user files.

const GameScript = preload("res://src/game.gd")

class BridgeStub:
	extends RefCounted
	var local_storage: bool = true
	var stored: String = "{}"
	var read_count: int = 0
	var write_count: int = 0
	var allow_write: bool = true
	func isLocalStorage() -> bool:
		return local_storage
	func loadJSON() -> String:
		read_count += 1
		return stored
	func saveJSON(value: String) -> bool:
		write_count += 1
		stored = value
		return allow_write

class ProbeGame:
	extends GameScript
	var file_reads: int = 0
	var file_writes: int = 0
	var file_data: Variant = {"1": 450}
	var file_json: String = ""
	var allow_file_write: bool = true
	func _read_progress_file() -> Variant:
		file_reads += 1
		return file_data
	func _write_progress_file(value: String) -> bool:
		file_writes += 1
		file_json = value
		return allow_file_write

var failures: Array[String] = []
var checks: int = 0

func _initialize() -> void:
	_run.call_deferred()

func _check(condition: bool, description: String) -> void:
	checks += 1
	if not condition:
		failures.append(description)

func _run() -> void:
	var game = ProbeGame.new()
	var bridge = BridgeStub.new()
	game._progress_bridge = bridge
	bridge.stored = '{"1":120,"45":9999,"500":12345}'
	game._load_progress()
	_check(game.best_scores.size() == 3 and int(game.best_scores["500"]) == 12345, "Local storage restores all stage records, including future IDs")
	_check(bridge.read_count == 1 and game.file_reads == 0, "PLiCy load never reads the IndexedDB-backed file")
	game.best_scores = {"1": 240, "45": 15000, "500": 18000}
	_check(game._save_progress(), "Successful local storage writes report success")
	var saved: Variant = JSON.parse_string(bridge.stored)
	_check(saved is Dictionary and saved.size() == 3 and int(saved["45"]) == 15000 and int(saved["500"]) == 18000, "All score records cross the bridge as JSON")
	_check(bridge.write_count == 1 and game.file_writes == 0, "PLiCy save never writes the IndexedDB-backed file")
	game.best_scores = {}
	game._load_progress()
	_check(int(game.best_scores.get("1", 0)) == 240 and int(game.best_scores.get("500", 0)) == 18000, "Local storage JSON round-trips through the Godot game")
	bridge.allow_write = false
	game.best_scores["1"] = 360
	_check(not game._save_progress(), "Quota or permission failure is reported without false success")
	_check(game.file_writes == 0 and int(game.best_scores["1"]) == 360, "Denied local storage retains session scores without file fallback")
	bridge.stored = "[]"
	game._load_progress()
	_check(int(game.best_scores["1"]) == 360 and game.file_reads == 0, "Invalid local score shape does not replace records or fall back to disk")
	bridge.stored = "{}"
	game._load_progress()
	_check(game.best_scores.is_empty() and game.file_reads == 0, "A missing local save starts empty without loading another host's file")
	game.save_progress_enabled = false
	var writes_before = bridge.write_count
	_check(not game._save_progress() and bridge.write_count == writes_before and game.file_writes == 0, "The save-progress switch suppresses both persistence routes")
	game.save_progress_enabled = true
	bridge.local_storage = false
	var reads_before = bridge.read_count
	game._load_progress()
	_check(int(game.best_scores["1"]) == 450 and game.file_reads == 1 and bridge.read_count == reads_before, "Other Web hosts preserve their existing user file records")
	game.best_scores["45"] = 2000
	_check(game._save_progress() and game.file_writes == 1 and bridge.write_count == writes_before, "Other Web hosts still save through the file path")
	_check(int(JSON.parse_string(game.file_json).get("45", 0)) == 2000, "The legacy route receives the complete score dictionary")
	game._progress_bridge = null
	game._load_progress()
	_check(game.file_reads == 2, "Native builds without a JavaScript bridge retain file loading")
	game.allow_file_write = false
	_check(not game._save_progress() and game.file_writes == 2, "Native file failures are reported")
	game.free()
	print(JSON.stringify({"suite":"progress", "checks":checks, "failures":failures, "status":"passed" if failures.is_empty() else "failed", "verification":"Godot bridge fixtures; no browser or user-file writes"}))
	quit(0 if failures.is_empty() else 1)
