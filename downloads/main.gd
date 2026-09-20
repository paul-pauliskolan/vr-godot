extends Node3D

# Sparar en referens till Godots OpenXR-interface.
var xr_interface: XRInterface

# Körs när scenens noder är redo.
func _ready() -> void:
    xr_interface = XRServer.find_interface("OpenXR")

    # OpenXR startas av motorn när det är aktiverat i projektet.
    if xr_interface and xr_interface.is_initialized():
        # Skicka denna viewports bild till headsetets båda ögon.
        get_viewport().use_xr = true
        print("OpenXR är redo – VR-bilden är aktiverad.")
    else:
        # På Mac kan detta bero på att projektet körs lokalt med F5.
        push_warning("OpenXR är inte redo. Kör Android-exporten på Quest.")
