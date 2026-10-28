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
	_expect(additions.size() == 237, "the reviewed expansions contain 237 selection-only objects")
	var search = Search.new(catalog.ordered_items)
	_expect(is_equal_approx(float(catalog.items["chunky-red-bean-bun"].worldWidth), 69.0) and is_equal_approx(float(catalog.items["chunky-red-bean-bun"].worldHeight), 69.0 * 85.0 / 111.0), "the larger cut face keeps the bun's original physical dimensions")
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
		_expect(item.worldWidth > 0 and item.worldHeight > 0 and is_equal_approx(float(item.worldWidth), float(item.viewBox[2]) * float(item.worldScale)) and is_equal_approx(float(item.worldHeight), float(item.viewBox[3]) * float(item.worldScale)), id + " keeps its physical dimensions proportional to the cropped source artwork")
	for query in ["ティラミス", "てぃらみす", "タピオカ", "つりざお", "いりょう", "でんしぶひん", "ちょうみりょう"]:
		_expect(not search.find_items(query).is_empty(), "new names and independent manual aliases match: " + query)
	_expect(search.find_items("カミナリ").map(func(item): return item.id) == ["lightning-orb"], "electrical additions do not pollute the lightning alias")
	_expect(search.find_items("はちビット").map(func(item): return item.id) == ["eight-bit-cpu"], "the clarified vintage processor is searchable separately from the existing CPU")
	for entry in [["ぎょうむようバター", "boxed-butter"], ["はこのバター", "boxed-butter"], ["つりばり", "fishing-rod-tip"], ["カフ", "blood-pressure-monitor"], ["といし", "bench-grinder"], ["てんたい", "telescope"], ["はけい", "oscilloscope"], ["さつまいも", "roasted-sweet-potato"], ["ロボットそうじき", "robot-vacuum"]]:
		_expect(search.find_items(entry[0]).any(func(item): return item.id == entry[1]), "retaken and new items match their reviewed name or manual alias: " + entry[0])
	_expect(catalog.items["boxed-butter"].nameJa == "ぎょうむようバター", "the butter keeps its stable ID and uses the requested new name")
	_expect(search.find_items("いんさつ").any(func(item): return item.id == "white-printer"), "the small white printer is searchable by its handwritten printing alias")
	_expect(search.find_items("りょうり").map(func(item): return item.id) == search.find_items("ごはん").map(func(item): return item.id), "meal and gohan aliases remain identical after the expansion")
	for entry in [["レコード", "hand-cranked-gramophone"], ["もりつけ", "rice-paddle"], ["てぼ", "noodle-strainer"], ["ゆきり", "noodle-strainer"], ["めん", "ramen-bowl"], ["いたかまぼこ", "kamaboko-board"], ["かんきつ", "yuzu"], ["ようかん", "chestnut-yokan"], ["みつば", "oyakodon"]]:
		_expect(search.find_items(entry[0]).any(func(item): return item.id == entry[1]), "evening additions match their independent manual alias: " + entry[0])
	for entry in [["やきそば", "yakisoba-plate"], ["チューブ", "wasabi-tube"], ["スパイス", "pepper-shaker"], ["なべりょうり", "sukiyaki-pot"], ["もくたん", "charcoal-grill"], ["ねりもの", "fish-sausage"], ["てふき", "rolled-hand-towel"], ["しょうゆ", "egg-over-rice"], ["あずき", "zenzai"], ["たきこみ", "seasoned-rice"]]:
		_expect(search.find_items(entry[0]).any(func(item): return item.id == entry[1]), "Japanese meal additions match their independent manual alias: " + entry[0])
	for entry in [["けんばん", "grand-piano"], ["トイレットペーパー", "toilet-paper-pack"], ["くしやき", "hand-cranked-roast"], ["はちうえ", "bonsai"], ["ひきにく", "stuffed-peppers"], ["ゆでたまご", "quail-eggs"], ["ろくおん", "audio-interface"], ["おきどけい", "flip-clock"], ["だがっき", "timpani"], ["げんぞう", "camera-film"], ["うずまき", "chelsea-bun"], ["てにもつ", "xray-scanner"], ["ドライフルーツ", "barmbrack"], ["はかり", "bathroom-scale"], ["じゅわき", "desk-telephone"], ["にゅうせいひん", "tomme-cheese"], ["ルームランナー", "treadmill"], ["けむり", "brick-chimney"], ["アーチ", "stone-tunnel"]]:
		_expect(search.find_items(entry[0]).any(func(item): return item.id == entry[1]), "October 28 additions match their independent manual alias: " + entry[0])
	for entry in [["ロースター", "chicken-roaster"], ["キャラメル", "caramel-popcorn"], ["たんか", "stretcher"]]:
		_expect(search.find_items(entry[0]).any(func(item): return item.id == entry[1]), "the additional roaster, popcorn and stretcher match their manual aliases: " + entry[0])
	_expect(catalog.items["audio-interface"].nameJa == "オーディオアイオー" and search.find_items("オーディオアイオー").any(func(item): return item.id == "audio-interface") and search.find_items("オーディオアイエフ").any(func(item): return item.id == "audio-interface"), "the audio interface uses its corrected name while the former label stays searchable")
	_expect(search.find_items("たきび").any(func(item): return item.id == "hand-cranked-roast"), "the roast's hand-authored fire alias finds its new finite campfire")
	var water_ids = search.find_items("みず").map(func(item): return item.id)
	_expect(["yellow-washbowl", "wooden-washbowl", "toilet-paper-pack"].all(func(id): return id in water_ids), "the two small-capacity washbowls and toilet paper are discoverable as water tools")
	_expect(["coconut-drink", "rice-vinegar", "bubble-tea", "mango-lassi", "iceberg", "torpedo"].all(func(id): return id in water_ids) and not water_ids.has("canola-oil"), "handwritten water aliases include the new water tools without presenting oil as water")
	_expect(search.find_items("ちゅうしゃき").is_empty() and search.find_items("ちゅうしきゃき").is_empty(), "the withdrawn syringe was not added")
	var baseline = GameCatalog.new()
	baseline.ordered_items = originals
	for stage in catalog.stages:
		if int(stage.id) > 45:
			continue
		if int(stage.id) in [21, 33]:
			_expect(stage.get("randomCatalogScope", "") == "selectable", "both laboratories include additions but exclude banned objects")
			var eligible = catalog.selectable_items()
			_expect(eligible.size() == catalog.ordered_items.size() - 2 and not catalog.is_catalog_selectable("counter") and not catalog.is_catalog_selectable("cannon-object"), "only counter and cannon are excluded from the laboratory pool")
			var laboratory_rng = RandomNumberGenerator.new()
			var observed_addition = false
			for seed_value in range(32):
				laboratory_rng.seed = seed_value
				var actual = catalog.build_queue(stage, laboratory_rng)
				laboratory_rng.seed = seed_value
				var expected: Array = []
				for shot in range(15):
					expected.append(str(eligible[laboratory_rng.randi_range(0, eligible.size() - 1)].id))
				_expect(actual == expected and not actual.has("counter") and not actual.has("cannon-object"), "laboratory %d samples eligible items and never banned objects" % int(stage.id))
				observed_addition = observed_addition or actual.any(func(id): return bool(catalog.items[id].get("selectionOnly", false)))
			_expect(observed_addition, "laboratory %d actually draws added items" % int(stage.id))
			# Every addition, including a future item, must survive the actual stage's filter.
			var future = additions[0].duplicate(true)
			future.id = "future-selection-only-item"
			var probe = GameCatalog.new()
			for item in additions + [future]:
				probe.ordered_items = [catalog.items["counter"], item, catalog.items["cannon-object"]]
				probe.items = {item.id: item, "counter": catalog.items["counter"], "cannon-object": catalog.items["cannon-object"]}
				var queue = probe.build_queue(stage, laboratory_rng)
				_expect(queue.size() == 15 and queue.count(item.id) == 15, "laboratory %d accepts addition %s" % [int(stage.id), item.id])
			continue
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
	var plastic_coffee: ThrowBody = game._create_actor(catalog.items["bottled-coffee"], Vector2(400, 160))
	_expect(plastic_coffee.behavior == "solid" and not plastic_coffee._supports_load_break() and not plastic_coffee.spec.has("waterUnits") and not plastic_coffee.spec.has("releaseUnits"), "the plastic coffee bottle neither cracks under load nor releases water")
	game.destroy_actor(plastic_coffee, "test")
	var pepper: ThrowBody = game._create_actor(catalog.items["pepper-shaker"], Vector2(400, 160))
	_expect(pepper.behavior == "solid" and pepper.record.material == "plastic" and not pepper._supports_load_break() and not pepper.spec.has("waterUnits"), "the plastic pepper container neither shatters nor releases water")
	game.destroy_actor(pepper, "test")
	await process_frame
	for item in additions:
		var actor: ThrowBody = game._create_actor(item, Vector2(400, 160))
		actor.freeze = true
		var physical_parts = actor.get_children().filter(func(child): return child is CollisionShape2D and child.shape != null)
		_expect(not physical_parts.is_empty() and actor.visual.texture != null and actor.get_world_bounds().size.length() > 0, str(item.id) + " loads its real Godot texture and decomposed collision pieces")
		game.destroy_actor(actor, "test")
	await process_frame
	for probe in [
		["stone-tunnel", Vector2(46, 90), Vector2(16, 90)],
		["grand-piano", Vector2(61, 110), Vector2(22, 110)],
		["hand-cranked-roast", Vector2(65, 98), Vector2(64, 115)],
		["treadmill", Vector2(70, 62), Vector2(88, 65)],
		["xray-scanner", Vector2(64, 62), Vector2(35, 62)],
		["sukiyaki-pot", Vector2(13, 58), Vector2(3, 58)],
		["sukiyaki-pot", Vector2(115, 58), Vector2(125, 58)],
		["paint-palette", Vector2(91, 77), Vector2(64, 65)],
		["film-roll", Vector2(98, 61), Vector2(118, 61)],
		["metal-spatula", Vector2(37.47, 87.94), Vector2(44.40, 91.94)],
		["microscope", Vector2(78, 61), Vector2(72, 38)],
		["red-hair-comb", Vector2(19.5, 70), Vector2(15, 70)],
		["horizontal-bar", Vector2(64, 65), Vector2(20, 65)],
		["fly-swatter", Vector2(37, 18), Vector2(67, 29)],
		["shampoo-hat", Vector2(64, 60), Vector2(64, 92)],
		["bath-hose", Vector2(62, 66), Vector2(18, 66)],
		["bath-stool", Vector2(64, 90), Vector2(24, 90)],
		["mini-bathtub", Vector2(64, 64), Vector2(64, 93)],
		["yellow-washbowl", Vector2(64, 64), Vector2(64, 102)],
		["wooden-washbowl", Vector2(64, 64), Vector2(64, 102)],
		["noodle-strainer", Vector2(75, 58), Vector2(75, 72)],
		["noodle-strainer", Vector2(75, 90), Vector2(80, 90)],
		["hand-cranked-gramophone", Vector2(104, 93), Vector2(111, 93)],
		["coffee-maker", Vector2(101, 78), Vector2(117, 78)],
		["leaf-blower", Vector2(44, 29), Vector2(45, 20)],
		["timed-bomb", Vector2(56, 24), Vector2(56, 15)],
		["three-d-printer", Vector2(90, 45), Vector2(110, 45)],
		["lidded-saucepan", Vector2(15, 69), Vector2(8, 69)],
		["mini-ferris-wheel", Vector2(48, 30), Vector2(64, 30)],
		["barrel-mug", Vector2(97, 68), Vector2(112, 68)],
		["doria", Vector2(12, 72), Vector2(4, 72)],
		["doria", Vector2(115, 72), Vector2(124, 72)],
		["gratin", Vector2(13, 70), Vector2(3, 70)],
		["gratin", Vector2(115, 70), Vector2(124, 70)],
		["roasted-sweet-potato", Vector2(58, 23), Vector2(63, 68)],
		["mini-soccer-goal", Vector2(55, 76), Vector2(65, 76)],
		["fishing-rod-tip", Vector2(60, 80), Vector2(98, 30)],
		["blood-pressure-monitor", Vector2(35, 60), Vector2(12, 60)],
		["blood-pressure-monitor", Vector2(35, 60), Vector2(56, 25)],
		["blood-pressure-monitor", Vector2(35, 60), Vector2(55, 112)],
		["pancake-pair", Vector2(12, 60), Vector2(14, 92)],
		["stethoscope", Vector2(57, 42), Vector2(31, 36)],
		["scissors", Vector2(23, 98), Vector2(11, 97)],
		["chainsaw", Vector2(27, 48), Vector2(12, 48)],
		["school-uniform", Vector2(33, 100), Vector2(64, 95)],
		["school-uniform", Vector2(97, 100), Vector2(110, 95)],
		["drafting-compass", Vector2(64, 79), Vector2(42, 70)],
		["school-desk", Vector2(64, 53), Vector2(64, 67)],
		["school-desk", Vector2(64, 100), Vector2(26, 90)],
		["randoseru", Vector2(22, 75), Vector2(8, 75)],
		["randoseru", Vector2(124, 75), Vector2(105, 75)],
		["car-navigation", Vector2(63, 114), Vector2(63, 90)],
		["randoseru", Vector2(60, 17), Vector2(57, 8)],
		["bandage-roll", Vector2(40, 74), Vector2(13, 74)],
		["green-peeler", Vector2(64, 47), Vector2(64, 26)],
		["green-peeler", Vector2(64, 108), Vector2(53, 108)],
		["hojicha-latte", Vector2(90, 25), Vector2(77, 30)],
		["lollipop", Vector2(50, 110), Vector2(30, 96)],
		["fire-hose", Vector2(57, 62), Vector2(13, 62)],
		["first-aid-box", Vector2(64, 23), Vector2(44, 23)],
		["steel-ladder", Vector2(64, 42), Vector2(64, 31)],
		["rescue-ring", Vector2(64, 64), Vector2(15, 64)],
		["ladder-truck", Vector2(27, 28), Vector2(16, 28)],
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
	for id in ["tiramisu", "fishing-rod", "torpedo", "iceberg", "telescope", "oscilloscope", "roasted-sweet-potato", "robot-vacuum", "white-printer"]:
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
	var wheel_measurements: Dictionary = {}
	for id in ["care-bed", "ambulance", "fire-engine", "ladder-truck", "flatbed-dolly", "mini-forklift", "garbage-truck", "push-mower", "stretcher"]:
		wheel_measurements[id] = await _wheel_checks(catalog.items[id])
	var result = {"suite": "selection", "checks": checks, "failures": failures, "measurements": wheel_measurements, "status": "passed" if failures.is_empty() else "failed"}
	FileAccess.open("res://previews/selection-checks.json", FileAccess.WRITE).store_string(JSON.stringify(result, "\t") + "\n")
	print(JSON.stringify({"suite": "selection", "checks": checks.size(), "failures": failures, "status": result.status}))
	quit(0 if failures.is_empty() else 1)

func _wheel_checks(record: Dictionary) -> Dictionary:
	var upright = await _care_bed_trial(record, 0.0)
	var inverted = await _care_bed_trial(record, PI)
	var id = str(record.id)
	_expect(upright.grounded and upright.wheel_supported, id + " rests on its wheel fixtures when upright")
	_expect(inverted.grounded and not inverted.wheel_supported, id + " uses its solid body surface when inverted")
	_expect(upright.friction < inverted.friction, id + " activates skateboard rolling friction only on its wheels")
	_expect(upright.distance > inverted.distance + 30.0, id + " rolls farther upright under equal horizontal velocity")
	_expect(upright.dynamic and inverted.dynamic, id + " retains gravity and rotation in either orientation")
	print(id, " displacement: upright=", upright.distance, " inverted=", inverted.distance)
	return {"upright_px": upright.distance, "inverted_px": inverted.distance, "upright_friction": upright.friction, "inverted_friction": inverted.friction}

func _care_bed_trial(record: Dictionary, rotation_value: float) -> Dictionary:
	# Isolated ordinary floor: no hazards, water or stage geometry can influence
	# the upright/inverted comparison. The real ThrowBody contact path is used.
	var fixture_world = Node2D.new()
	root.add_child(fixture_world)
	var ground = StaticBody2D.new()
	ground.position = Vector2(480.0, 440.0)
	ground.collision_layer = 1
	ground.collision_mask = 2
	var floor_material = PhysicsMaterial.new()
	floor_material.friction = 0.6
	ground.physics_material_override = floor_material
	var floor_shape = RectangleShape2D.new()
	floor_shape.size = Vector2(3000.0, 80.0)
	var floor_collider = CollisionShape2D.new()
	floor_collider.shape = floor_shape
	ground.add_child(floor_collider)
	fixture_world.add_child(ground)
	var bed = ThrowBody.new()
	bed.configure(record, fixture_world)
	bed.position = Vector2(200.0, 345.0)
	bed.rotation = rotation_value
	bed.can_sleep = false
	fixture_world.add_child(bed)
	for step in range(180):
		await physics_frame
	var observed = {"grounded": bed.get_contact_count() > 0, "wheel_supported": bed.wheel_supported, "friction": bed.physics_material_override.friction, "dynamic": not bed.freeze and not bed.lock_rotation and bed.gravity_scale > 0.0}
	bed.linear_velocity = Vector2(220.0, 0.0)
	var start_x = bed.position.x
	for step in range(90):
		await physics_frame
	observed.distance = bed.position.x - start_x
	fixture_world.queue_free()
	await process_frame
	return observed
