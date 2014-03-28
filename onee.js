/*
 * ONEE JavaScript Library
 * Create time 2011-05-15 9:28
 * aim at build my F2E tree / use when need / less code, more done
 * Copyright (c) 2013-2099 design by J.do.
 * for more -> http://www.jdoi.net/
 */

/**
 * fix list
 * 20131217 相同文件名，不同路径加载有问题 [修复]
 * 20131217-20131217 CACHE索引存在问题，已改回以加载路径为索引，取代之前的以文件名为索引
 * 20131222 样式加载在android原生浏览器报错 [修复]
 * 20131222-20131222 样式加载逻辑出错！高级浏览器已经支持onload加载css，所以并没有报错
 */

!function (global, undefined) {

// check is exist
if ( global.onee ) return;

// set object/version
var onee = global.onee = {
	version : "1.0"
}

/*
 * <script src="../onee/Base/onee.js" type="text/javascript"></script>
 * onee.js的工作目录workspace 三种情况：
 * workspace 值为空， src属性为onee.js的绝对路径
 * workspace 值为空， onee文件默认存放在根目录，例如：目录默认为 http://www.xxx.com/onee/
 * workspace 值不为空，根据个人需求配置好改属性
 */

var workspace = onee.workspace = (function(){
	
	var scripts = document.getElementsByTagName("script");
	var scriptSelf = scripts[scripts.length-1];
	var scriptSelfSrc = scriptSelf.src;
	var rHTTP = /^https?\:\/\//;
	var workspace = scriptSelf.getAttribute("workspace");
	var docUrl = document.location.href;
	!workspace && (workspace = rHTTP.test(scriptSelfSrc) ? scriptSelfSrc.substring(0, scriptSelfSrc.indexOf("/onee/")+6) : "/onee/");

//    console.log(workspace)
	return workspace;
	
})();

onee.log = function ( module ) {
	return function ( msg ) {
		!!console && !!console.log && console.log.call(null, +new Date + ' : ' + module + ' -> ', msg);
	}
}

// new a onee's log
var log = onee.log("onee");

// base underscorejs
if ( !global._ ) return log("Base on underscorejs.js");

// base tool
var extend    = _.extend,
	each      = _.each,
	indexOf   = _.indexOf,
	isEmpty   = _.isEmpty,
	isArray   = _.isArray;


// static variable
var slice     = Array.prototype.slice,
	toString  = Object.prototype.toString,
	// match style tag
	rTagStyle = /<style.*?>([^<]*)<\/style>/ig,
	// match of url
	rQuery    = /[\?|&](.*?)=([^&#\\$]*)/g,
	// document head
	dHead     = document.getElementsByTagName("head")[0],
	// document body
	dBody     = document.body;
	

/**
 * NameSpace 工具集
 * 20130130
 * .versionComparison
 * .isArray
 * .each
 * .copy
 * .queryMap
 * .isEmptyObject
 */
var Util = onee.Util = {
	
	/**
	 * Function 版本号对比
	 * @param {string} v1
	 * @param {string} v2
	 * v1 > v2 return -1
	 * v1 = v2 return  0
	 * v1 < v2 return  1
	 * 20130213
	 */
	versionComparison : function ( v1, v2 ) {
		
		var firstArr = v1.split('.'),
			lastArr  = v2.split('.'),
			i = 0,
			len = Math.min( firstArr.length, lastArr.length ),
			item1,
			item2;
		
		for ( ; i < len; i++ ) {

			item1 = parseInt(firstArr[i]);
			item2 = parseInt(lastArr[i]);
			if ( item1 > item2 ) return -1;
			if ( item1 < item2 ) return  1;

		}
		return 0;
		
	},
	/**
	 * Function query to map
	 * @param [string] url
	 * 20121113
	 */
	queryMap : function ( url ) {
		
		var realUrl = url || document.location.href,
			map = {};

		realUrl.replace( rQuery, function ( a, b, c ) {

			b && c && ( map[b] = c );

		});

		return map;		
	},
    
	// 接口初始化
	// 默认扩展到第一个参数
	// 仅仅属性为 undefined 时进行赋值
	interface : function () {
		
		var extender = arguments[0];
	
		each( slice.call(arguments, 1), function (obj, k) {
			
			each( obj, function (val, name) {
				
				extender[name] === undefined && (extender[name] = val);
				
			});
			
		});
		
		return extender;
		
	},
	
	// 类型判断
	isType : function isType( type ) {
	
		return function( obj ) {
	
			return Object.prototype.toString.call( obj ) === "[object " + type + "]"
		}
	}
}
// 初始化/引用
var isType = Util.isType;
var isArray = Array.isArry || isType("Array");
var isObject = onee.isObject = isType("Object");
var isString  = onee.isString  = isType("String");
var isFunction = onee.isFunction = isType("Function");
var isUndefined = onee.isUndefined = isType("Undefined");


/**
 * Object 浏览器属性检测
 * 返回主流浏览器
 * 返回渲染核心
 * 返回版本号
 * 201301
 */
var browser = onee.browser = (function () {

	var _ua = navigator.userAgent,
	
		_browser = {
			
			ie      : /msie\s(\d+\.\d)/gi,
			
			firefox : /firefox\/(\d+\.\d)/gi,
			
			safari  : /version\/(\d+\.\d\.\d).*safari/gi,
			
			opera   : /opera.*version\/(\d+\.\d+)/gi,
			
			chrome  : /chrome\/([^\s]+)/gi
		},
		
		_render = {
			
			ie     : /msie/gi,
			
			webkit : /webkit/gi,
			
			gecko  : /gecko/gi,
			
			opera  : /opera/gi
		},
		
		_checkUrl = "Browser.json",
		
		_result = {};
		
	
	for ( var i in _browser ) 
	
		if ( _browser[i].test( _ua ) ) {
			
			_result[i] = RegExp['$1'];
			break;
		}
	
	for ( var j in _render ) 
	
		if ( _render[j].test( _ua ) ) {
			
			_result.render = j;
			break;
		}

	return _result;
	
})();


// define queue
var queue = onee.queue = function () {
	var _queue = [];
	return {
		// 插入元素
		add : function (item) {
			_queue[_queue.length] = item
		},
		// 执行下一元素
		// options传递参数
		nex : function (options) {
			if ( _queue.length ) {
				var current = _queue.shift();
				return isFunction(current) ? current.call(null, options) : current;
			}
		}
	}
}
// define event


/**
 * inc - js/css loader
 * 支持同步，异步方式加载
 * 20130916
 * design by J.do
 * for more ? http://jdoi.net/
 * fixlist - 20131014 缓存情况需延时执行，以应对队列式回调
 * inc(file[, file[, file[, file]...]]);
 * @prama file{String|Array}
 * @method done(callback)
 */
var inc = onee.inc = (function () {


	var interface = Util.interface;
	var baseHead = document.getElementsByTagName("head")[0] || document.documentElement;
	// ref: #185 & http://dev.jquery.com/ticket/2709
	var baseElement = baseHead.getElementsByTagName("base")[0];
	
	
	var CACHE = {};
	var CACHE_INDEX_TYPE = /(?:^|\/)((?:[\w\.\-]+)\.(js|css))[?#]*/;
	var isHTTP = /^https?\:\/\//;
    var risCSS = /\.css(?:\?|$)/;
	// ref : seajs
	// `onload` event is not supported in WebKit < 535.23 and Firefox < 9.0
	// ref:
	//  - https://bugs.webkit.org/show_activity.cgi?id=38995
	//  - https://bugzilla.mozilla.org/show_bug.cgi?id=185236
	//  - https://developer.mozilla.org/en/HTML/Element/link#Stylesheet_load_events
	var isOldWebKit = (navigator.userAgent.replace(/.*AppleWebKit\/(\d+)\..*/, "$1")) * 1 < 536;
	var READY_STATE_RE = /^(?:loaded|complete|undefined)$/

	
	/* status:
	 * 1 -> initialize
	 * 2 -> loading
	 * 3 -> complete
	 */
	function _file (index) {
//console.log(index)
		// initialize arguments
		interface(this, {
			index : index,
			// initialize file
			status: 1,
			// triggle callback list
			events: [],
			// typeof file
			isCSS : risCSS.test(index)
		});

	}
	_file.realCallback = function () {
		
		//log(this.events.length)

		var events = this.events;
		// complete
		this.status = 3;
		// triggle callbacks
		for ( var i = 0, len = events.length; i < len; i++ ) {
			//alert(events[i].toString())
			events[i]();
			
		}

	}
	_file.prototype.done = function ( callback ) {
	
		if ( this.status == 3 ) {
		
			return callback()
		
		}
		
		this.events.push(callback)
	
	}
	_file.prototype.load = function () {
		// loading
		this.status = 2;

		var node = document.createElement(this.isCSS ? "link" : "script"),
			ts = this;

        if (this.isCSS) {
            node.rel = "stylesheet";
            node.href = this.index;
        }
        else {
            node.async = true;
            node.src = this.index;
        }

        var missingOnload = this.isCSS && (isOldWebKit || !("onload" in node));

        // 低版本浏览器使用传统css检测方案
        if (missingOnload) {
            setTimeout(function() {
                _handcss.call( ts, node )
            }, 1) // Begin after node insertion
        } else {
            node.onload = node.onerror = node.onreadystatechange = function () {

                if (READY_STATE_RE.test(node.readyState)) {
                    // Ensure only run once and handle memory leak in IE
                    node.onload = node.onerror = node.onreadystatechange = null;
                    // Remove the script to reduce memory leak
                    !ts.isCSS && baseHead.removeChild(node);
                    // Dereference the node
                    node = null;
                    //callback(index);
                    _file.realCallback.call(ts);

                }

            }
        }
        // ref: #185 & http://dev.jquery.com/ticket/2709
		baseElement ?
			baseHead.insertBefore(node, baseElement) :
			baseHead.appendChild(node)
		
		return this
		
	}
	
	// loading css file
	// ref : seajs
	function _handcss ( node ) {
		var sheet = node.sheet;
		var isLoaded;
		var ts = this;

		// for WebKit < 536
		if (isOldWebKit) {
			if (sheet) {
				isLoaded = true
			}
        // for Firefox < 9.0
		} else if (sheet) {

			try {
                //alert(sheet.cssRules)
				if (sheet.cssRules) {
					isLoaded = true;
				}
			} catch (ex) {
				// The value of `ex.name` is changed from "NS_ERROR_DOM_SECURITY_ERR"
				// to "SecurityError" since Firefox 13.0. But Firefox is less than 9.0
				// in here, So it is ok to just rely on "NS_ERROR_DOM_SECURITY_ERR"
				if (ex.name === "NS_ERROR_DOM_SECURITY_ERR") {
					isLoaded = true;
				}
			}
		}
		setTimeout(function() {
			if (isLoaded) {
				// Place callback here to give time for style rendering
				_file.realCallback.call(ts);
			}
			else {
				_handcss.call(ts, node);
			}
		}, 20);
		
	}


	// 异步加载
	// 内部方法，不想做接口检测了
	function _synchronous () {
		
		var arg = arguments;
		var len = arg.length;
		//log(arg[0])
		if ( len == 1 ) {
			// 存在缓存情况需延迟
			// 等待done装载callback
			//console.log(arg[0].toString())
			setTimeout(function () {
				try{arg[0]()}catch(e){log(e)}
			}, 10);
			
		} else if ( len > 1 ) {
			
			var files = Array.prototype.shift.call(arg);
//			console.log(files)
			// 数组，将跳入同步加载处理
			if ( isArray(files) ) {
			
				_asynchronous( files, function () { _synchronous.apply( null, arg )});

			} else {
			
			    //var isCSS = _reIndexType(files);
				
				//if ( re = _reIndexType(files) ) {
					
					//var isCache = CACHE[re.index];
                    var isCache = CACHE[files];

					if ( !!isCache ) {

						isCache.status == 3 ?
							_synchronous.apply( null, arg )
						:
							isCache.events.push(
								function () {
									_synchronous.apply( null, arg )
								}
							);
						
					} else (CACHE[files] = new _file(files)).load().done(function () { _synchronous.apply( null, arg ) });

				//}
			
			}
			
		}

	}
	
	// 同步加载
	function _asynchronous ( files, callback ) {
		
		//_loadedFile
		var len = files.length,
			done = function () {
				// 存在缓存情况需延迟
				// 等待done装载callback
				!--len && setTimeout(function () {
					try{callback && callback()}catch(e){log(e)}
				}, 10);
			},
			isCache,
			re;

		each ( files, function ( file, k ) {

			// plugin/scroll/scroll.js?ver=2.0 => scroll.js
			//if ( re = _reIndexType(file) ) {
				// index = rre[1];
				// isCss = rre[2] == "css" ? !!1 : !!0;
				// if object has been CACHE
				if ( !!(isCache=CACHE[file]) ) {
					// if status is complete
					isCache.status == 3 ?
						done()
					:
						isCache.events.push( done );
	
				} else (CACHE[file] = new _file(file)).load().done(done);
			//}

		});

	}
	
	// Common callback
	function _cmcallback (callbacks) {

		each(callbacks, function (callback, k) {

			typeof callback === "function" && callback();
			
		});
	}
	
	function _inc_ ( files ) {
		
		var callbacks = this.callbacks = [];

		// 无需加载，即可执行
		if ( !files.length ) {
//            alert("ddd")
			// 延迟等待done装载callback
			return setTimeout(function () {
				_cmcallback( callbacks );
			}, 10);
		}
		// 异步处理参数
		Array.prototype.push.call(
			files,
			function () {
				_cmcallback( callbacks );
			}
		)
		_synchronous.apply( null, files );
		
	}
	
	_inc_.prototype.done = function ( callback ) {
		this.callbacks.push( callback );
		return this
	}
	
	return function () {
		//console.log(arguments.length)
		return new _inc_(arguments);
	}


})();


/*function GUID () {
	var d = new Date().getTime(), r;

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
        r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);

        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
}*/
var getURI = function () {

	var href = document.location.href;
	var rCurrPath = /^\.\//;
	return function (uri) {
		var ret;
		if ( uri ) {
			ret = href.substring(0, href.lastIndexOf("/")+1) + uri.replace(rCurrPath, "");
		} else {
			var scripts = document.head.getElementsByTagName("script");
			var scriptSelf = scripts[scripts.length-1];
			ret = scriptSelf.src;
			console.log(scripts)
		}
		return ret
	}

}();
/**
 * filepath string 模块路径
 * factory function 模块定义函数
 * [deps] array 依赖模块
 */

var define = onee.define = function ( name, factory, deps ) {

	// if ( !onee.plugins ) return log("Missing onee-plugins.js");
	if (!onee.plugins) onee.plugins = {};

	if ( isFunction(name) ) {
		deps = factory;
		factory = name;
		// name = GUID();
	}
	if ( !isString(name) ) {
		name = getURI();
	}

	var module = onee.plugins[name];
	// log(name)

	// if ( module && (module.deps || module.factory) ) return log("name of `"+ name +"` had been define.");
	if ( !module ) module = onee.plugins[name] = {};

	// rewrite factory
	module.factory = function () {
		// exec self factory
		(!module.waitting || !--module.waitting) && factory();

		var tops = module.top||[];
		// exec top's factory
		while(tops.length) tops.shift()(); 
		// console.log(module.waitting)
	}

	// deps = deps || [];
	// var _module_ = onee.plugins[name] = {};
	var _thatdeps_ = [], _depsmodule_;

	if (deps && (module.waitting = deps.length)) {

		each(deps, function (dep, k) {
			// onee.plugins[dep]
			dep = getURI(dep);
			_depsmodule_ = onee.plugins[dep];

			if ( !_depsmodule_ ) _depsmodule_ = onee.plugins[dep] = {top : []};

			if ( _depsmodule_.deps && _depsmodule_.deps.length ) _thatdeps_ = _thatdeps_.concat(_depsmodule_.deps);
			else _thatdeps_.push(dep);

			_depsmodule_.top.push(module.factory)
		});

		module.deps = _thatdeps_;
		use(name);

	// exec
	} else module.factory();

}

// use - 内置模板的引用
var use = onee.use = function ( index ) {

	if ( !onee.plugins ) return log("Missing onee-plugins.js");

//    var filewrap = [];
//    console.log(slice.call(arguments, 0))
//    each( slice.call(arguments, 0), function ( index, k ) {
        var files = onee.plugins[index];
//        console.log(isArray(files))
//        if ( isArray(files) ) filewrap[filewrap.length] = files;
//        console.log(files)
//    });

//    console.log(filewrap);
	return files && files.deps && files.deps.length ? inc.apply(null, files.deps) : inc(index);
	// if ( files && files.deps && files.deps.length ) return inc.apply(null, files.deps);

};

}( this );