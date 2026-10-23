extends SceneTree

func _initialize() -> void:
	var output = FileAccess.open("res://web/third-party-licenses.txt", FileAccess.WRITE)
	output.store_string("Godot Engine " + Engine.get_version_info().string + "\n\n")
	output.store_string(Engine.get_license_text() + "\n\n")
	for entry in Engine.get_copyright_info():
		output.store_string("COMPONENT: " + str(entry.name) + "\n")
		for part in entry.parts:
			output.store_string(str(part) + "\n")
		output.store_string("\n")
	var licenses = Engine.get_license_info()
	for name in licenses:
		output.store_string("LICENSE: " + str(name) + "\n" + str(licenses[name]) + "\n\n")
	output.close()
	quit()
