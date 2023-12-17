/**
 * OpenWebRx+ Plugin loader
 *
 * You should load your plugins in "plugins/{type}/init.js",
 * where {type} is 'receiver' or 'map'.
 * See the init.js.sample.
 * And check the "plugins/{type}/example" folder for example plugin.
 */

// Wait for the page to load, then load the plugins.
$(document).ready(function () {
  // detect which plugins to load
  if ($('.openwebrx-waterfall-container').length) Plugins._type = "receiver";
  if ($('.openwebrx-map').length) Plugins._type = "map";
  Plugins.init();
});

// Initialize the Plugins class and some defaults
function Plugins () {}
Plugins._initialized = false;
Plugins._version = 0.1; // version of the plugin sub-system (keep it float)
Plugins._enable_debug = false; // print debug to the console


// Load plugin
Plugins.load = async function (name) {
  var path = 'static/plugins/' + Plugins._type + "/" + name + "/";
  var remote = false;

  // check if we are loading an url
  if (name.toLowerCase().startsWith('https://') || name.toLowerCase().startsWith('http://')) {
    path = name;
    name = path.split('/').pop().split('.').slice(0, -1);
    path = path.split('/').slice(0, -1).join('/') + '/';
    remote = true;
  }

  // ignore plugins with same name as our methods
  if (name === "load" || name === "init" || name === "isLoaded") {
    console.error('PLUGINS: Cannot load plugin named "load", "isLoaded" or "init".');
    return;
  }

  if (name in Plugins) {
    console.warn(`PLUGINS: '${name}' is already loaded from ${Plugins[name]._script_loaded}`);
    return;
  }

  Plugins._debug(`PLUGINS: ${remote ? '[remote]' : '[local]'} '${name}' loading.`);

  var script_src = path + name + ".js";
  var style_src = path + name + '.css';

  // init plugin object with defaults
  Plugins[name] = {
    _version: 0,
    _script_loaded: false,
    _style_loaded: false,
    _remote: remote,
  };


  // try to load the plugin
  await Plugins._load_script(script_src)
    .then(function () {
      // plugin script loaded successfully
      Plugins[name]._script_loaded = script_src;

      // check if the plugin has init() method and execute it
      if (typeof Plugins[name].init === 'function') {
        if (!Plugins[name].init()) {
          console.error(`PLUGINS: ${remote ? '[remote]' : '[local]'} '${name}' cannot initialize.`);
          return;
        }
      }

      // check if plugin has set the 'no_css', otherwise, load the plugin css style
      if (!('no_css' in Plugins[name])) {
        Plugins._load_style(style_src)
          .then(function () {
            Plugins[name]._style_loaded = style_src;
            Plugins._debug(`PLUGINS: ${remote ? '[remote]' : '[local]'} '${name}' loaded.`);
          }).catch(function () {
            console.warn(`PLUGINS: ${remote ? '[remote]' : '[local]'} '${name}' script loaded, but css not found.`);
          });
      } else {
        // plugin has no_css
        Plugins._debug(`PLUGINS: ${remote ? '[remote]' : '[local]'} '${name}' loaded.`);
      }

    }).catch(function () {
      // plugin cannot be loaded
      Plugins._debug(`PLUGINS: ${remote ? '[remote]' : '[local]'} '${name}' cannot be loaded (does not exist or has errors).`);
    });
}

// Check if plugin is loaded
Plugins.isLoaded = function (name, version = 0) {
  if (typeof Plugins[name] === 'object')
    return (Plugins[name]._script_loaded && Plugins[name]._version >= version);
  return false;
}

// Initialize plugin loading. We should load the init.js for the {type}. This init() is called onDomReady.
Plugins.init = function () {
  Plugins._debug("PLUGINS: Loading " + Plugins._type + " plugins.");
  // load the init.js for the {type}... user should load their plugins there.
  Plugins._load_script('static/plugins/' + Plugins._type + "/init.js").then(function () {
    Plugins._initialized = true;
  }).catch(function () {
    Plugins._debug('PLUGINS: no plugins to load.');
  })
}

// ---------------------------------------------------------------------------

// internal utility methods
Plugins._load_script = function (src) {
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    script.onload = resolve;
    script.onerror = reject;
    script.src = src;
    document.head.appendChild(script);
  });
}
Plugins._load_style = function (src) {
  return new Promise(function (resolve, reject) {
    var style = document.createElement('link');
    style.onload = resolve;
    style.onerror = reject;
    style.href = src;
    style.type = 'text/css';
    style.rel = 'stylesheet';
    document.head.appendChild(style);
  });
}
Plugins._debug = function (msg) {
  if (Plugins._enable_debug) console.debug(msg);
}

