extends SceneTree
## Validate the hand-written index and the exact player-facing search examples.

const Search = preload("res://src/item_search.gd")
var checks: Array[String] = []
var failures: Array[String] = []

func _initialize() -> void:
	call_deferred("_run")

func _expect(condition: bool, description: String) -> void:
	checks.append(description)
	if not condition:
		failures.append(description)
		push_error(description)

func _ids(records: Array) -> Array:
	return records.map(func(record): return str(record.id))

func _run() -> void:
	var records: Array = GameCatalog.read_json("res://data/objects-manifest.json").items
	var index = GameCatalog.read_json("res://data/item-search-index.json")
	var tags: Dictionary = index.items
	var ids = _ids(records)
	_expect(index.version == 1 and tags.size() == records.size(), "the authored index has exactly one entry per current item")
	var complete = true
	var valid = true
	for id in ids:
		complete = complete and tags.has(id)
		var item_tags = tags.get(id, null)
		if not item_tags is Array or item_tags.is_empty():
			valid = false
			continue
		var seen: Array = []
		for tag in item_tags:
			if not tag is String or str(tag).strip_edges().is_empty() or Search.sanitize_input(str(tag)) != tag or Search.normalize(str(tag)) in seen:
				valid = false
			seen.append(Search.normalize(str(tag)))
	_expect(complete and tags.keys().all(func(id): return id in ids), "new or renamed objects cannot silently omit manual tags or leave stale entries")
	_expect(valid, "manual tags are nonempty unique supported-character strings, without kanji")
	var search = Search.new(records)
	_expect(_ids(search.find_items("かみなり")) == ["lightning-orb"], "hiragana lightning finds only lightning magic")
	_expect(_ids(search.find_items("カミナリ")) == ["lightning-orb"], "katakana lightning gives the same single result")
	_expect(_ids(search.find_items("かえんほうしゃき")) == ["flamethrower"], "the complete kana name finds the flamethrower")
	_expect(_ids(search.find_items("コーヒーミ")) == ["coffee-mill"], "partial display names match automatically without hand-writing full names")
	var meals = _ids(search.find_items("りょうり"))
	var rice = _ids(search.find_items("ごはん"))
	_expect(meals.size() > 1 and meals.has("ironplate-hamburg") and meals.has("rice-bowl") and not meals.has("fork"), "meal tags find multiple foods without returning utensils")
	_expect(rice.has("ironplate-hamburg") and rice.has("rice-bowl"), "gohan is an authored meal alias, not just a rice-name match")
	var water = _ids(search.find_items("みず"))
	_expect(water.has("water-balloon") and water.has("sponge") and not water.has("cheesecake"), "manual water tags include tools for water but not unrelated food")
	var specials = _ids(search.find_items("とくしゅ"))
	_expect(specials.has("flamethrower") and specials.has("lightning-orb"), "the independent special tag exposes authored special items")
	_expect(_ids(search.find_items("とくしゅ カミナリ")) == ["lightning-orb"], "space-separated words narrow results with AND matching")
	_expect(search.find_items("ぬぬぬぬぬ").is_empty(), "an unmatched query returns an empty result rather than all items")
	_expect(_ids(search.find_items("  ")) == ids, "an empty search restores the catalog's original order")
	_expect(Search.sanitize_input("水火氷角度カミナリ😀") == "カミナリ", "kanji are refused even when the HUD font contains them; emoji are also refused")
	_expect(Search.sanitize_input("かみなり 123 ABC") == "かみなり 123 ABC", "supported kana, numbers, Latin letters and spaces remain usable")
	_expect(Search.sanitize_input("abc") == "ABC", "Latin input is converted to the supported uppercase glyphs")
	_expect(Search.normalize("  ガス  コンロ ") == "がす こんろ", "kana normalization preserves voiced sounds and normalizes repeated spaces")
	var unrelated = records.duplicate(true)
	for record in unrelated:
		record["material"] = "かみなり"
		record["behavior"] = "みず"
		record["physics"] = {"searchTags": ["ごはん"], "flammable": true}
	var isolated = Search.new(unrelated)
	_expect(_ids(isolated.find_items("かみなり")) == ["lightning-orb"] and _ids(isolated.find_items("みず")) == water, "changing all gameplay classifications does not change search results")
	var renamed = records.duplicate(true)
	for record in renamed:
		if record.id == "camera":
			record.nameJa = "てすとよみがな"
	_expect(_ids(Search.new(renamed).find_items("てすとよみ")) == ["camera"], "canonical name edits are searchable automatically without regenerating the manual index")
	var result = {"suite": "search", "checks": checks, "failures": failures, "status": "passed" if failures.is_empty() else "failed"}
	FileAccess.open("res://previews/search-checks.json", FileAccess.WRITE).store_string(JSON.stringify(result, "\t") + "\n")
	print(JSON.stringify(result))
	quit(0 if failures.is_empty() else 1)
