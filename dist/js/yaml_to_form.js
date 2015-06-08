(function() {
  var BuildFormUtil, SerializeArrayToYaml, YamlToForm, YamlUtil;

  YamlUtil = {
    get_type: function(obj) {
      if (typeof obj === "string") {
        return "string";
      }
      if (typeof obj === "object" && typeof obj.__proto__.length !== 'undefined') {
        return "array";
      }
      if (typeof obj === "object" && typeof obj.__proto__.length === 'undefined') {
        return "hash";
      }
    }
  };

  BuildFormUtil = {
    build_dom_by_integer: function(scope, value) {
      var default_value_str, format_str, key, label, presence_str, regex_str;
      key = scope.join(".");
      label = value.label ? value.label : key;
      presence_str = value.presence ? "data-presence='true'" : "";
      default_value_str = value.default_value ? "value='" + value.default_value + "'" : "";
      regex_str = value.regex ? "data-regex='" + value.regex + "'" : "";
      format_str = "data-format='integer'";
      return "<div class='form-group'> <label class='control-label'>" + label + "</label> <input type='text' class='form-control' name='" + key + "' " + regex_str + " " + presence_str + " " + default_value_str + " " + format_str + " /> </div>";
    },
    build_dom_by_string: function(scope, value) {
      var default_value_str, format_str, key, label, presence_str, regex_str;
      key = scope.join(".");
      label = value.label ? value.label : key;
      presence_str = value.presence ? "data-presence='true'" : "";
      default_value_str = value.default_value ? "value='" + value.default_value + "'" : "";
      regex_str = value.regex ? "data-regex='" + value.regex + "'" : "";
      format_str = "data-format='string'";
      return "<div class='form-group'> <label class='control-label'>" + label + "</label> <input type='text' class='form-control' name='" + key + "' " + regex_str + " " + presence_str + " " + default_value_str + " " + format_str + "/> </div>";
    },
    build_dom_by_boolean: function(scope, value) {
      var default_value_str, key, label;
      key = scope.join(".");
      label = value.label ? value.label : key;
      default_value_str = value.default_value ? "checked='checked'" : "";
      return "<div class='checkbox'> <input name='" + key + "' type='hidden' value='false' /> <label> <input name='" + key + "' type='checkbox' value='true' " + default_value_str + "> " + label + " </label> </div>";
    },
    build_dom_by_time: function(scope, value) {
      var default_value_str, format_str, key, label, presence_str, regex_str;
      key = scope.join(".");
      label = value.label ? value.label : key;
      presence_str = value.presence ? "data-presence='true'" : "";
      default_value_str = value.default_value ? "value='" + value.default_value + "'" : "";
      regex_str = value.regex ? "data-regex='" + value.regex + "'" : "";
      format_str = "data-format='time'";
      return "<div class='form-group'> <label class='control-label'>" + label + "</label> <input type='text' class='form-control' name='" + key + "' " + regex_str + " " + presence_str + " " + default_value_str + " " + format_str + "/> </div>";
    },
    build_dom_by_text: function(scope, value) {
      var default_value_str, key, label, presence_str, regex_str;
      key = scope.join(".");
      label = value.label ? value.label : key;
      presence_str = value.presence ? "data-presence='true'" : "";
      default_value_str = value.default_value ? value.default_value : "";
      regex_str = value.regex ? "data-regex='" + value.regex + "'" : "";
      return "<div class='form-group'> <label class='control-label'>" + label + "</label> <textarea class='form-control' rows='4' name='" + key + "' " + presence_str + " " + regex_str + ">" + default_value_str + "</textarea> </div>";
    }
  };

  SerializeArrayToYaml = (function() {
    function SerializeArrayToYaml(array) {
      this.hash = this._array_to_hash(array);
      this.yaml = YAML.stringify(this.hash);
    }

    SerializeArrayToYaml.prototype._array_to_hash = function(array) {
      var hash, i, item, len, name, names;
      hash = {};
      for (i = 0, len = array.length; i < len; i++) {
        item = array[i];
        name = item.name;
        names = name.split(".");
        if (names.length === 1) {
          hash[name] = item.value;
        } else {
          this._set_value_to_hash(hash, names, item.value);
        }
      }
      return hash;
    };

    SerializeArrayToYaml.prototype._set_value_to_hash = function(hash, names, value) {
      var arr, data, index, name;
      data = hash;
      while (names.length > 1) {
        name = names.shift();
        arr = name.match(/([^\[]*)(\[.*\])?/);
        if (arr[2]) {
          index = arr[2].match(/\[(.*)\]/)[1];
          if (data[arr[1]] === void 0) {
            data[arr[1]] = [];
          }
          if (data[arr[1]][index] === void 0) {
            data[arr[1]][index] = {};
          }
          data = data[arr[1]][index];
        } else {
          if (data[name] === void 0) {
            data[name] = {};
          }
          data = data[name];
        }
      }
      return data[names[0]] = value;
    };

    return SerializeArrayToYaml;

  })();

  YamlToForm = (function() {
    function YamlToForm(config) {
      this.config = this._init_config(config);
      console.log("@config");
      console.log(this.config);
      this.form_dom = this._init_form_dom();
    }

    YamlToForm.prototype._init_config = function(config) {
      return this._init_config_nested(config);
    };

    YamlToForm.prototype._init_config_nested = function(hash) {
      var key, new_value, value;
      for (key in hash) {
        value = hash[key];
        switch (YamlUtil.get_type(value)) {
          case "string":
            new_value = this._parse_string_value(value);
            hash[key] = new_value;
            break;
          case "array":
            new_value = this._init_config_nested(value[0]);
            hash[key] = {
              format: "array",
              value: new_value
            };
            break;
          case "hash":
            new_value = this._init_config_nested(value);
            hash[key] = {
              format: "hash",
              value: new_value
            };
        }
      }
      return hash;
    };

    YamlToForm.prototype._parse_string_value = function(value) {
      var new_value, res;
      res = value.match(/(integer|string|text|boolean|time)(\(\*\))?(\[[^\]]*\])?(\<[^\>]*\>)?(\/.*\/)?/);
      if (res === null) {
        throw value + " 不是有效的格式";
      }
      return new_value = {
        format: res[1] ? res[1] : void 0,
        presence: res[2] ? res[2] === "(*)" : void 0,
        label: res[3] ? res[3].match(/\[(.*)\]/)[1] : void 0,
        default_value: res[4] ? res[4].match(/\<(.*)\>/)[1] : void 0,
        regex: res[4] ? res[5] : void 0
      };
    };

    YamlToForm.prototype._init_form_dom = function() {
      return this.form_dom = jQuery("<form action='javascript:;'> " + (this._generate_init_form_input_dom()) + " </form>");
    };

    YamlToForm.prototype._generate_init_form_input_dom = function() {
      return this._generate_init_form_input_dom_nested([], this.config);
    };

    YamlToForm.prototype._generate_init_form_input_dom_nested = function(scope, config_hash) {
      var dom_str, dom_str_arr, key, new_scope, value;
      dom_str_arr = [];
      for (key in config_hash) {
        value = config_hash[key];
        new_scope = scope.slice();
        dom_str = (function() {
          switch (value.format) {
            case "array":
              key = key + "[0]";
              new_scope.push(key);
              dom_str = this._generate_init_form_input_dom_nested(new_scope, value.value);
              return "<div class='form-group-array' data-index='0'> <div class='form-template'> " + dom_str + " </div> <a class='btn btn-default' href='javascript:;'>增加</a> <ul> <li>" + dom_str + "</li> </ul> </div>";
            case "hash":
              new_scope.push(key);
              dom_str = this._generate_init_form_input_dom_nested(new_scope, value.value);
              return "<div class='form-group-hash'> " + dom_str + " </div>";
            case "integer":
              new_scope.push(key);
              return BuildFormUtil.build_dom_by_integer(new_scope, value);
            case "string":
              new_scope.push(key);
              return BuildFormUtil.build_dom_by_string(new_scope, value);
            case "text":
              new_scope.push(key);
              return BuildFormUtil.build_dom_by_text(new_scope, value);
            case "boolean":
              new_scope.push(key);
              return BuildFormUtil.build_dom_by_boolean(new_scope, value);
            case "time":
              new_scope.push(key);
              return BuildFormUtil.build_dom_by_time(new_scope, value);
          }
        }).call(this);
        dom_str_arr.push(dom_str);
      }
      return dom_str_arr.join(" ");
    };

    YamlToForm.prototype.render_to = function($ele) {
      jQuery(this.form_dom).appendTo($ele);
      return this;
    };

    YamlToForm.prototype.get_string = function() {
      var sat;
      sat = new SerializeArrayToYaml(this.form_dom.serializeArray());
      return sat.yaml;
    };

    return YamlToForm;

  })();

  YamlToForm.load_config = function(yaml_url, fun) {
    var config, ytf;
    config = YAML.load(yaml_url);
    ytf = new YamlToForm(config);
    return fun(ytf);
  };

  window.YamlToForm = YamlToForm;

}).call(this);
