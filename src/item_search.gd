class_name ItemSearch
extends RefCounted
## Search-only names and authored aliases. Never used by gameplay rules.

const SEARCH_FONT = preload("res://assets/font/arcade-generated.fnt")
var _items: Array = []
var _terms: Dictionary = {}

func _init(records: Array) -> void:
	_items = records.duplicate()
	var index = _read_json("res://data/item-search-index.json")
	var display_names = _read_json("res://data/ui-ja.json").get("items", {})
	for item in _items:
		var id = str(item.id)
		# Automatic name matching reads only identity and names. The separate JSON
		# is hand-authored; material, behavior, physics and stage never supply tags.
		var terms: Array = [normalize(str(item.get("nameJa", ""))), normalize(str(display_names.get(id, "")))]
		for tag in index.get("items", {}).get(id, []):
			terms.append(normalize(str(tag)))
		_terms[id] = terms

static func _read_json(path: String) -> Dictionary:
	var parser = JSON.new()
	var status = parser.parse(FileAccess.get_file_as_string(path))
	assert(status == OK and parser.data is Dictionary, "Invalid search input: " + path)
	return parser.data

static func normalize(value: String) -> String:
	var result = ""
	for character in value.to_upper():
		var code = character.unicode_at(0)
		# The paired kana block maps exactly, including small kana and voiced kana.
		if code >= 0x30A1 and code <= 0x30F6:
			result += String.chr(code - 0x60)
		else:
			result += character
	return " ".join(result.strip_edges().split(" ", false))

static func sanitize_input(value: String) -> String:
	var result = ""
	for character in value.to_upper():
		var code = character.unicode_at(0)
		# Even the few kanji present in the HUD font are forbidden in this field.
		if (code >= 0x3400 and code <= 0x9FFF) or (code >= 0xF900 and code <= 0xFAFF) or (code >= 0x20000 and code <= 0x323AF) or code in [0x3005, 0x3007, 0x303B]:
			continue
		if SEARCH_FONT.has_char(code):
			result += character
	return result

func find_items(query: String) -> Array:
	var tokens = normalize(query).split(" ", false)
	if tokens.is_empty():
		return _items.duplicate()
	var matches: Array = []
	for item in _items:
		var all_match = true
		for token in tokens:
			var token_match = false
			for term in _terms[str(item.id)]:
				if str(term).contains(token):
					token_match = true
					break
			if not token_match:
				all_match = false
				break
		if all_match:
			matches.append(item)
	return matches
