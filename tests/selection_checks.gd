extends SceneTree
## Free-choice expansion: live catalog/search, unchanged seeded queues and real bodies.

const GameScript = preload("res://src/game.gd")
const Search = preload("res://src/item_search.gd")
var checks: Array[String] = []
var failures: Array[String] = []

func _initialize() -> void:
	_run.call_deferred()

func _expect(condition: bool, description: String) -> void:
	checks.append(description)
	if not condition:
		failures.append(description)
		push_error(description)

func _run() -> void:
	var catalog = GameCatalog.new()
	var additions = catalog.ordered_items.filter(func(item): return bool(item.get("selectionOnly", false)))
	var originals = catalog.ordered_items.filter(func(item): return not bool(item.get("selectionOnly", false)))
	_expect(additions.size() == 65, "the reviewed expansion contains sixty-five selection-only objects")
	var search = Search.new(catalog.ordered_items)
	var kana = RegEx.new()
	kana.compile("^[ぁ-ゖァ-ヺー]+$")
	var ui = GameCatalog.read_json("res://data/ui-ja.json").items
	var rows = GameCatalog.read_json("res://data/catalog.json").items
	var shapes = GameCatalog.read_json("res://data/colliders.json").templates
	for item in additions:
		var id = str(item.id)
		_expect(kana.search(item.nameJa) != null and ui[id] == item.nameJa and Search.sanitize_input(item.nameJa) == item.nameJa, id + " has a supported kana name in both catalogs")
		_expect(catalog.is_catalog_selectable(id) and search.find_items(item.nameJa).any(func(found): return found.id == id), id + " is selectable and searchable by its displayed name")
		_expect(rows.any(func(row): return row[0] == id and row[1] == item.nameJa) and shapes[id] == item.fixtures, id + " keeps catalog and physical shape sources synchronized")
		_expect(item.worldWidth > 0 and item.worldWidth <= 115 and item.worldHeight > 0 and item.worldHeight <= 180, id + " uses a bounded throwable size without transparent-margin scaling")
	for query in ["ティラミス", "てぃらみす", "タピオカ", "つりざお", "いりょう", "でんしぶひん", "ちょうみりょう"]:
		_expect(not search.find_items(query).is_empty(), "new names and independent manual aliases match: " + query)
	_expect(search.find_items("カミナリ").map(func(item): return item.id) == ["lightning-orb"], "electrical additions do not pollute the lightning alias")
	_expect(search.find_items("はちビット").map(func(item): return item.id) == ["eight-bit-cpu"], "the clarified vintage processor is searchable separately from the existing CPU")
	for entry in [["ぎょうむようバター", "boxed-butter"], ["はこのバター", "boxed-butter"], ["つりばり", "fishing-rod-tip"], ["カフ", "blood-pressure-monitor"], ["といし", "bench-grinder"], ["てんたい", "telescope"], ["はけい", "oscilloscope"], ["さつまいも", "roasted-sweet-potato"], ["ロボットそうじき", "robot-vacuum"]]:
		_expect(search.find_items(entry[0]).any(func(item): return item.id == entry[1]), "retaken and new items match their reviewed name or manual alias: " + entry[0])
	_expect(catalog.items["boxed-butter"].nameJa == "ぎょうむようバター", "the butter keeps its stable ID and uses the requested new name")
	_expect(search.find_items("りょうり").map(func(item): return item.id) == search.find_items("ごはん").map(func(item): return item.id), "meal and gohan aliases remain identical after the expansion")
	var water_ids = search.find_items("みず").map(func(item): return item.id)
	_expect(["coconut-drink", "rice-vinegar", "bubble-tea", "mango-lassi", "iceberg", "torpedo"].all(func(id): return id in water_ids) and not water_ids.has("canola-oil"), "handwritten water aliases include the new water tools without presenting oil as water")
	_expect(search.find_items("ちゅうしゃき").is_empty() and search.find_items("ちゅうしきゃき").is_empty(), "the withdrawn syringe was not added")
	var baseline = GameCatalog.new()
	baseline.ordered_items = originals
	for stage in catalog.stages:
		for seed_value in [1, 51, 1039]:
			var rng = RandomNumberGenerator.new()
			rng.seed = seed_value
			var actual = catalog.build_queue(stage, rng)
			rng.seed = seed_value
			var expected: Array = []
			if stage.get("queuePolicy", "") == "randomCatalog":
				for index in range(15):
					expected.append(str(originals[rng.randi_range(0, originals.size() - 1)].id))
			else:
				expected = baseline.build_queue(stage, rng)
			_expect(actual == expected and actual.size() == 15 and actual.all(func(id): return not bool(catalog.items[id].get("selectionOnly", false))), "stage %d seed %d retains its original fifteen-item queue" % [int(stage.id), seed_value])
	# The flag belongs to data, not a hardcoded ID list, and is independent of visibility.
	var before = catalog.random_items().size()
	catalog.items["camera"].selectionOnly = true
	_expect(catalog.random_items().size() == before - 1 and catalog.is_catalog_selectable("camera"), "selectionOnly applies to arbitrary items without hiding them")
	_expect(catalog.random_items().any(func(item): return item.id == "counter"), "picker-hidden stage objects remain in ordinary random pools")
	catalog.items["camera"].erase("selectionOnly")
	var game = GameScript.new()
	root.add_child(game)
	await process_frame
	game.load_stage(14)
	await process_frame
	for item in additions:
		var actor: ThrowBody = game._create_actor(item, Vector2(400, 160))
		actor.freeze = true
		var physical_parts = actor.get_children().filter(func(child): return child is CollisionShape2D and child.shape != null)
		_expect(not physical_parts.is_empty() and actor.visual.texture != null and actor.get_world_bounds().size.length() > 0, str(item.id) + " loads its real Godot texture and decomposed collision pieces")
		game.destroy_actor(actor, "test")
	await process_frame
	for probe in [
		["barrel-mug", Vector2(97, 68), Vector2(112, 68)],
		["doria", Vector2(12, 72), Vector2(4, 72)],
		["doria", Vector2(115, 72), Vector2(124, 72)],
		["gratin", Vector2(13, 70), Vector2(3, 70)],
		["gratin", Vector2(115, 70), Vector2(124, 70)],
		["roasted-sweet-potato", Vector2(58, 23), Vector2(63, 68)],
		["mini-soccer-goal", Vector2(55, 76), Vector2(65, 76)],
		["fishing-rod-tip", Vector2(60, 80), Vector2(98, 30)],
		["blood-pressure-monitor", Vector2(35, 60), Vector2(12, 60)],
		["stethoscope", Vector2(57, 42), Vector2(31, 36)],
		["scissors", Vector2(23, 98), Vector2(11, 97)],
		["eight-bit-cpu", Vector2(20.5, 23), Vector2(18, 23)]
	]:
		var actor: ThrowBody = game._create_actor(catalog.items[probe[0]], Vector2(400, 180))
		actor.freeze = true
		await physics_frame
		await physics_frame
		var empty: Vector2 = actor.to_global(actor._source_point(probe[1]))
		var solid: Vector2 = actor.to_global(actor._source_point(probe[2]))
		var query = PhysicsPointQueryParameters2D.new()
		query.collision_mask = 2
		query.position = empty
		var space = actor.get_world_2d().direct_space_state
		_expect(not actor.contains_world_point(empty) and space.intersect_point(query).is_empty(), str(probe[0]) + " leaves the intended non-solid area empty in actual physics")
		query.position = solid
		_expect(actor.contains_world_point(solid) and not space.intersect_point(query).is_empty(), str(probe[0]) + " keeps its modeled surface physically solid")
		game.destroy_actor(actor, "test")
		await process_frame
	game._show_catalog()
	game._catalog_search_changed("いりょう")
	FileAccess.open("res://previews/game-state-selection-search.json", FileAccess.WRITE).store_string(JSON.stringify(game.debug_snapshot(), "\t") + "\n")
	game._close_modal()
	for id in ["tiramisu", "fishing-rod", "torpedo", "iceberg", "telescope", "oscilloscope", "roasted-sweet-potato", "robot-vacuum"]:
		game.load_stage(14)
		await process_frame
		game._show_catalog()
		game._catalog_search_changed(str(ui[id]))
		_expect(game.catalog_results.any(func(item): return item.id == id), id + " is visible in the real picker search")
		game._select_catalog_item(id)
		var shots_before: int = game.shots_fired
		_expect(game.next_item_id() == id and not is_instance_valid(game.modal), id + " can be loaded by the selection callback")
		game._on_fired(Vector2.LEFT, 0.5, Vector2(800, 180))
		_expect(game.shots_fired == shots_before + 1 and game.actors.any(func(actor): return is_instance_valid(actor) and actor.item_id == id and actor.is_launched), id + " launches as a real physical shot")
	# Match the game integration suite: drain the final shot's audio before exit.
	game.shot_audio.stop()
	await create_timer(0.25, true, false, true).timeout
	game.queue_free()
	await process_frame
	await process_frame
	var result = {"suite": "selection", "checks": checks, "failures": failures, "status": "passed" if failures.is_empty() else "failed"}
	FileAccess.open("res://previews/selection-checks.json", FileAccess.WRITE).store_string(JSON.stringify(result, "\t") + "\n")
	print(JSON.stringify({"suite": "selection", "checks": checks.size(), "failures": failures, "status": result.status}))
	quit(0 if failures.is_empty() else 1)
