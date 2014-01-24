var Multiselect = function() {
    var Util = {
        'hasClass': function(el, className) {
            return new RegExp("(?:^|\\s+)" + className + "(?:\\s+|$)").test(el.className);
        },
        'addClass': function(el, className) {
            if (!Util.hasClass(el, className)) {
                el.className = el.className ? [el.className, className].join(' ') : className;
            }
        },
        'removeClass': function(el, className) {
            if (Util.hasClass(el, className)) {
                var c = el.className;
                el.className = c.replace(new RegExp("(?:^|\\s+)" + className + "(?:\\s+|$)", "g"), "");
            }
        },
        'dom': {
            'text': function(text) {
                return document.createTextNode(text);
            },
            'createElement': function(el, content, params) {
                var el = document.createElement(el);
                el.innerHTML = content || '';
                for (var i in params || {})
                    el.setAttribute(i, params[i]);
                return el;
            },
            'append': function(el, append) {
                for (var i = 0; i < append.length; i++)
                    el.appendChild(append[i]);
                return el;
            }
        },
        'loop': function(o, c) {
            for (var i = 0; i < o.length; i++) {
                c.call(o[i], i);
            }
        },
        'extend': function() {
            var e = function(t, n) {
                for (var r in n) {
                    if (n.hasOwnProperty(r)) {
                        var i = n[r];
                        if (t.hasOwnProperty(r) && typeof t[r] === "object" && typeof i === "object") {
                            e(t[r], i)
                        } else {
                            t[r] = i
                        }
                    }
                }
                return t
            };
            var t = {};
            for (var n = 0; n < arguments.length; n++) {
                t = e(t, arguments[n])
            }
            return t
        },
        'error': function(message) {
            throw new Error(message);
        }
    };

    var Event = function() {

        var Cache = {
            cache: {},
            store: function(elem, type, handler) {
                if (!Cache.cache[type]) {
                    Cache.cache[type] = [];
                }
                Cache.cache[type].push([elem, type, handler]);
            },
            get: function(elem, type) {
                if (!Cache.cache[type]) {
                    return false;
                }
                for (var i = 0; i < Cache.cache[type].length; i++) {
                    if (Cache.cache[type][i][0] === elem)
                        return Cache.cache[type][i][2];
                }
            }
        };

        var Exports = {
            unbind: function() {
                if (document.removeEventListener) {
                    return function(elem, type, handler) {
                        if ((elem && elem.nodeName) || elem === window) {
                            var handler = handler || Cache.get(elem, type);
                            elem.removeEventListener(type, handler, false);
                        }
                        else if (elem && elem.length) {
                            var len = elem.length;
                            for (var i = 0; i < len; i++) {
                                Exports.unbind(elem[i], type);
                            }
                        }
                    };
                }
                else if (document.detachEvent) {
                    return function(elem, type, handler) {
                        if ((elem && elem.nodeName) || elem === window) {
                            var handler = handler || Cache.get(elem, type);
                            elem.detachEvent('on' + type, handler);
                        }
                        else if (elem && elem.length) {
                            var len = elem.length;
                            for (var i = 0; i < len; i++) {
                                Exports.unbind(elem[i], type);
                            }
                        }
                    };
                }
            }(),
            bind: function() {
                if (document.addEventListener) {
                    return function(elem, type, handler) {
                        if ((elem && elem.nodeName) || elem === window) {
                            Cache.store(elem, type, handler);
                            elem.addEventListener(type, handler, false);
                        }
                        else if (elem && elem.length) {
                            var len = elem.length;
                            for (var i = 0; i < len; i++) {
                                Exports.bind(elem[i], type, handler);
                            }
                        }
                    };
                }
                else if (document.attachEvent) {
                    return function(elem, type, handler) {
                        if ((elem && elem.nodeName) || elem === window) {
                            Cache.store(elem, type, handler);
                            elem.attachEvent('on' + type, function() {
                                return handler.call(elem, window.event)
                            });
                        }
                        else if (elem && elem.length) {
                            var len = elem.length;
                            for (var i = 0; i < len; i++) {
                                Exports.bind(elem[i], type, handler);
                            }
                        }
                    };
                }
            }(),
            trigger: function(elem, type)
            {
                var handler = Cache.get(elem, type);
                handler && handler.call(elem, window.event);
            }
        };

        var bindings = ['blur', 'change', 'click', 'dblclick', 'focus', 'keydown', 'keypress', 'keyup', 'load', 'mousedown', 'mouseenter', 'mouseleave', 'mouseover', 'mouseout', 'mouseup', 'resize', 'scroll', 'submit'];

        for (var i = 0; i < bindings.length; i++) {
            (function(i) {
                Exports[bindings[i]] = function(element, handler) {
                    return Exports.bind(element, bindings[i], handler);
                };
            })(i);
        }

        return Exports;

    }();

    /**
     * Constructor to create a new multiselect using the given select.
     * 
     * @param {jQuery} select
     * @param {Object} options
     * @returns {Multiselect}
     */
    function Multiselect(select, options) {

        this.config = this.mergeOptions(options);
        this.select = select;

        this.inputs = [];

        // Initialization.
        // We have to clone to create a new reference.
        this.options = this.select.options;
        this.query = '';
        this.searchTimeout = null;

        this.config.multiple = this.select.getAttribute('multiple') === "multiple";
        //this.config.onChange = $.proxy(this.config.onChange, this);
        //this.config.onDropdownShow = $.proxy(this.config.onDropdownShow, this);
        //this.config.onDropdownHide = $.proxy(this.config.onDropdownHide, this);

        // Build select all if enabled.
        this.buildContainer();
        this.buildButton();
        this.buildDropdown();
        this.buildDropdownOptions();

        this.updateButtonText();
    }
    ;

    Multiselect.prototype = {
        defaults: {
            /**
             * Default text function will either print 'None selected' in case no
             * option is selected or a list of the selected options up to a length of 3 selected options.
             * 
             * @param {jQuery} options
             * @param {jQuery} select
             * @returns {String}
             */
            buttonText: function(options, select) {
                if (options.length === 0) {
                    return this.nonSelectedText + ' <b class="caret"></b>';
                }
                else {
                    if (options.length > this.numberDisplayed) {
                        return options.length + ' ' + this.nSelectedText + ' <b class="caret"></b>';
                    }
                    else {
                        var selected = '';
                        Util.loop(options, function() {
                            var label = this.getAttribute('label') || this.innerHTML;

                            selected += label + ', ';
                        });
                        return selected.substr(0, selected.length - 2) + ' <b class="caret"></b>';
                    }
                }
            },
            /**
             * Updates the title of the button similar to the buttonText function.
             * @param {jQuery} options
             * @param {jQuery} select
             * @returns {@exp;selected@call;substr}
             */
            buttonTitle: function(options, select) {
                if (options.length === 0) {
                    return this.nonSelectedText;
                }
                else {
                    var selected = '';
                    Util.loop(options, function() {
                        selected += this.innerText + ', ';
                    });
                    return selected.substr(0, selected.length - 2);
                }
            },
            /**
             * Create a label.
             * 
             * @param {jQuery} element
             * @returns {String}
             */
            label: function(element) {
                return element.getAttribute('label') || element.innerHTML;
            },
            /**
             * Triggered on change of the multiselect.
             * Not triggered when selecting/deselecting options manually.
             * 
             * @param {jQuery} option
             * @param {Boolean} checked
             */
            onChange: function(option, checked) {

            },
            /**
             * Triggered when the dropdown is shown.
             * 
             * @param {jQuery} event
             */
            onDropdownShow: function(event) {

            },
            /**
             * Triggered when the dropdown is hidden.
             * 
             * @param {jQuery} event
             */
            onDropdownHide: function(event) {

            },
            buttonClass: 'btn btn-default',
            dropRight: false,
            selectedClass: 'active',
            buttonWidth: 'auto',
            buttonContainer: '<div class="btn-group" />',
            // Maximum height of the dropdown menu.
            // If maximum height is exceeded a scrollbar will be displayed.
            maxHeight: false,
            // possible options: 'text', 'value', 'both'
            preventInputChangeEvent: false,
            nonSelectedText: 'None selected',
            nSelectedText: 'selected',
            numberDisplayed: 10
        },
        templates: {
            button: '<button type="button" class="multiselect dropdown-toggle" data-toggle="dropdown"></button>',
            ul: '<ul class="multiselect-container dropdown-menu"></ul>',
            li: '<li><a href="javascript:void(0);"><label></label></a></li>',
            divider: '<li class="divider"></li>',
            liGroup: '<li><label class="multiselect-group"></label></li>'
        },
        constructor: Multiselect,
        template: function(temp)
        {
            var node = document.createElement('span');
            node.innerHTML = temp;
            return node.firstChild;
        },
        /**
         * Builds the container of the multiselect.
         */
        buildContainer: function() {
            this.container = this.template(this.config.buttonContainer);
            this.container.value = this.select.value;
            this.container.options = this.select.options;
        },
        /**
         * Builds the button of the multiselect.
         */
        buildButton: function() {
            this.button = this.template(this.templates.button);
            Util.addClass(this.button, this.config.buttonClass);

            // Adopt active state.
            if (this.select.hasAttribute('disabled')) {
                this.disable();
            }
            else {
                this.enable();
            }

            // Keep the tab index from the select.
            var tabindex = this.select.getAttribute('tabindex');
            if (tabindex) {
                this.button.setAttribute('tabindex', tabindex);
            }

            this.container.appendChild(this.button);
            var self = this;

            Event.click(self.button, function() {
                Util.hasClass(self.container, 'open') ?
                        Util.removeClass(self.container, 'open') : Util.addClass(self.container, 'open');
            });


        },
        /**
         * Builds the ul representing the dropdown menu.
         */
        buildDropdown: function() {

            // Build ul.
            this.ul = this.template(this.templates.ul);

            if (this.config.dropRight) {
                Util.addClass(this.ul, 'pull-right');
            }
            ;

            this.container.appendChild(this.ul);
        },
        /**
         * Build the dropdown options and binds all nessecary events.
         * Uses createDivider and createOptionValue to create the necessary options.
         */
        buildDropdownOptions: function() {
            var self = this;
            Util.loop(this.select.children, function(index) {
                var element = this;
                // Support optgroups and options without a group simultaneously.
                var tag = (element.tagName || '').toLowerCase();

                if (tag === 'optgroup') {
                    self.createOptgroup(this);
                }
                else if (tag === 'option') {

                    if (this.getAttribute('role') === 'divider') {
                        self.createDivider();
                    }
                    else {
                        self.createOptionValue(this);
                    }

                }

                // Other illegal tags will be ignored.
            });
            var self = this;
            // Bind the change event on the dropdown elements.
            Event.change(this.inputs, function(event) {
                var checked = event.target.checked || false;

                // Apply or unapply the configured selected class.
                if (self.config.selectedClass) {
                    if (checked) {
                        Util.addClass(event.target.parentNode, self.config.selectedClass);
                    }
                    else {

                        Util.removeClass(event.target.parentNode, self.config.selectedClass);
                    }
                }

                // Get the corresponding option.
                var value = event.target.value;
                var $option = self.getOptionByValue(value);

                if (checked) {

                    $option.setAttribute('selected', true);

                    if (!self.config.multiple) {
                        //self.value = self.select.value;
                        //self.select.value = value;
                        // Unselect all other options and corresponding checkboxes.
                        if (self.config.selectedClass) {
                            Util.loop(self.inputs, function() {
                                if (this !== event.target)
                                    Util.removeClass(this.parentNode, self.config.selectedClass);
                            });
                        }

                        Util.loop(self.inputs, function() {
                            if (this !== event.target)
                                this.checked = false;
                        });

                        Util.loop(self.select.options, function() {
                            if (this !== $option)
                                this.removeAttribute('selected');
                        });

                        // It's a single selection, so close.
                        self.button.click();
                    }
                    /*
                     if (self.config.selectedClass === "active") {
                     $optionsNotThis.parents("a").css("outline", "");
                     }*/
                }
                else {
                    // Unselect option.
                    $option.removeAttribute('selected');
                }

                // Set the basic options agains the element so it can be used as a drop in replacement
                // for a select box
                self.container.value = self.select.value;
                self.container.options = self.select.options;

                Event.trigger(self.select, 'change');

                self.config.onChange($option, checked);

                self.updateButtonText();

                if (self.config.preventInputChangeEvent) {
                    return false;
                }
            });
        },
        /**
         * Create an option using the given select option.
         * 
         * @param {jQuery} element
         */
        createOptionValue: function(element) {

            if (element.selected) {
                element.setAttribute('selected', true);
            }

            // Support the label attribute on options.
            var label = this.template(this.config.label(element));
            var value = element.value;
            var inputType = this.config.multiple ? "checkbox" : "radio";

            var li = this.template(this.templates.li);
            var labelEl = li.firstChild.firstChild;
            Util.addClass(labelEl, inputType);

            var checkbox = this.template('<input name="' + name + '" type="' + inputType + '" />');
            this.inputs.push(checkbox);
            labelEl.appendChild(checkbox);

            var selected = element.selected || false;
            checkbox.value = value;

            labelEl.appendChild(document.createTextNode(' '));
            labelEl.appendChild(label);

            this.ul.appendChild(li);

            if (element.hasAttribute('disabled')) {
                checkbox.setAttribute('disabled', 'disabled');
                Util.addClass(checkbox.parentNode, 'disabled');
            }

            selected ? checkbox.setAttribute('checked', 'checked') : checkbox.removeAttribute('selected');

            if (selected && this.config.selectedClass) {
                Util.addClass(checkbox.parentNode, this.config.selectedClass);
            }
        },
        /**
         * Creates a divider using the given select option.
         * 
         * @param {jQuery} element
         */
        createDivider: function() {
            var divider = this.template(this.templates.divider);
            this.ul.appendChild(divider);
        },
        /**
         * Creates an optgroup.
         * 
         * @param {jQuery} group
         */
        createOptgroup: function(group) {
            var groupName = group.getAttribute('label');

            // Add a header for the group.
            var li = this.template(this.templates.liGroup);
            li.firstChild.innerText = groupName;

            this.ul.appendChild(li);

            // Add the options of the group.
            Util.loop(group.children, function(index) {
                this.createOptionValue(this);
            });
        },
        /**
         * Refreshs the multiselect based on the selected options of the select.
         */
        refresh: function() {
            this.select.options.each(function(index) {
                var element = this;

                var input = this.inputs.filter(function() {
                    return this.value === element.getAttribute('value');
                });

                if (element.selected) {
                    input.setAttribute('checked', true);

                    if (this.config.selectedClass) {
                        Util.addClass(input.parentNode, this.config.selectedClass);
                    }
                }
                else {
                    input.removeAttribute('checked');

                    if (this.config.selectedClass) {
                        Util.removeClass(input.parentNode, this.config.selectedClass);
                    }
                }

                if (element.getAttribute('disabled')) {
                    input.setAttribute('disabled', 'disabled');
                    Util.addClass(input, 'disabled');
                }
                else {
                    input.removeAttribute('disabled');
                    Util.removeClass(input.parentNode, 'disabled');
                }
            });

            this.updateButtonText();
        },
        /**
         * Select all options of the given values.
         * 
         * @param {Array} selectValues
         */
        select: function(selectValues) {
            if (selectValues && !selectValues.length) {
                selectValues = [selectValues];
            }

            for (var i = 0; i < selectValues.length; i++) {
                var value = selectValues[i];

                var option = this.getOptionByValue(value);
                var checkbox = this.getInputByValue(value);

                if (this.config.selectedClass) {
                    Util.addClass(checkbox.parentNode, this.config.selectedClass);
                }

                checkbox.setAttribute('checked', true);
                option.setAttribute('selected', true);
            }

            this.updateButtonText();
        },
        /**
         * Deselects all options of the given values.
         * 
         * @param {Array} deselectValues
         */
        deselect: function(deselectValues) {
            if (deselectValues && !$.isArray(deselectValues)) {
                deselectValues = [deselectValues];
            }

            for (var i = 0; i < deselectValues.length; i++) {

                var value = deselectValues[i];

                var option = this.getOptionByValue(value);
                var checkbox = this.getInputByValue(value);

                if (this.config.selectedClass) {
                    Util.removeClass(checkbox.parentNode, this.config.selectedClass);
                }

                checkbox.removeAttribute('checked');
                option.removeAttribute('selected');
            }

            this.updateButtonText();
        },
        /**
         * Rebuild the plugin.
         * Rebuilds the dropdown, the filter and the select all option.
         */
        rebuild: function() {
            this.ul.innerHTML = '';

            // Important to distinguish between radios and checkboxes.
            this.config.multiple = this.select.getAttribute('multiple') === "multiple";

            this.buildDropdownOptions();

            this.updateButtonText();
        },
        /**
         * The provided data will be used to build the dropdown.
         * 
         * @param {Array} dataprovider
         */
        dataprovider: function(dataprovider) {
            var optionDOM = "";
            dataprovider.forEach(function(option) {
                optionDOM += '<option value="' + option.value + '">' + option.label + '</option>';
            });

            this.select.innerHTML = optionDOM;
            this.rebuild();
        },
        /**
         * Enable the multiselect.
         */
        enable: function() {
            this.select.removeAttribute('disabled');
            this.button.removeAttribute('disabled');
            Util.removeClass(this.button, 'disabled');
        },
        /**
         * Disable the multiselect.
         */
        disable: function() {
            this.select.setAttribute('disabled', 'disabled');
            this.button.setAttribute('disabled', 'disabled');
            Util.addClass(this.button, 'disabled');
        },
        /**
         * Set the options.
         * 
         * @param {Array} options
         */
        setOptions: function(options) {
            this.config = this.mergeOptions(options);
        },
        /**
         * Merges the given options with the default options.
         * 
         * @param {Array} options
         * @returns {Array}
         */
        mergeOptions: function(options) {
            return Util.extend({}, this.defaults, options);
        },
        /**
         * Update the button text and its title base don the currenty selected options.
         */
        updateButtonText: function() {
            var options = this.getSelected();
            this.button.innerHTML = this.config.buttonText(options, this.select);
            this.button.setAttribute('title', this.config.buttonTitle(options, this.select));

        },
        /**
         * Get all selected options.
         * 
         * @returns {jQUery}
         */
        getSelected: function() {
            return Array.prototype.filter.call(this.select.options, function(item) {
                return item.selected;
            });
        },
        /**
         * Gets a select option by its value.
         * 
         * @param {String} value
         * @returns {jQuery}
         */
        getOptionByValue: function(value) {
            return Array.prototype.filter.call(this.select.options, function(item) {
                return item.value === value;
            })[0];
        },
        /**
         * Get the input (radio/checkbox) by its value.
         * 
         * @param {String} value
         * @returns {jQuery}
         */
        getInputByValue: function(value) {
            return this.inputs.filter(function(item) {
                return item.value === value;
            });
        },
        /**
         * Used for knockout integration.
         */
        updateOriginalOptions: function() {
            this.options = this.select.options;
        }
    };

    return Multiselect;
}();