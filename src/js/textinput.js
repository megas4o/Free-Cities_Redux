Macro.add("textinput", {
    // Signifies that the macro is a container macro.
    tags: null,

    handler: function() {
        if (this.args.length < 2) {
            var errors = [];
            if (this.args.length < 1) { errors.push("variable name"); }
            if (this.args.length < 2) { errors.push("default value"); }
            return this.error("no " + errors.join(" or ") + " specified");
        }

        // Ensure that the variable name argument is a string.
        if (typeof this.args[0] !== "string") {
            return this.error("variable name argument is not a string");
        }

        var varName = this.args[0].trim();

        // Try to ensure that we receive the variable's name (incl. sigil), not its value.
        if (varName[0] !== "$" && varName[0] !== "_") {
            return this.error("variable name '" + varName + "' is missing its sigil ($ or _)");
        }

        var that = this;
        var defaultValue = this.args[1];
        var el = document.createElement("textarea");

        // Setup and append the textarea element to the output buffer.
        jQuery(el)
            .attr({
                rows: 4,
                // cols: 68, // instead of setting "cols" we set the `min-width` in CSS
                tabindex: 0 // for accessiblity
            })
            .addClass("macro-textarea")  // "hijack" the .macro-textarea class
            .on("input", function() {
                Wikifier.setValue(varName, this.value);
                if (that.payload[0].contents !== "")
                    Wikifier.wikifyEval(that.payload[0].contents.trim());
            })
            .appendTo(this.output);

        // Set the story variable and textarea element to the default value.
        Wikifier.setValue(varName, defaultValue);

        // Ideally, we should be setting `.defaultValue` here, but IE doesn't support it,
        // so we have to use `.textContent`, which is equivalent.
        el.textContent = defaultValue;
    }
});
