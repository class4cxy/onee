/*
 * onee.define JavaScript module define
 * Create time 2014-03-30 10:36
 * close to cmd
 * Copyright (c) 2014-2099 design by J.do.
 * for more -> http://www.jdoi.net/
 */

!function (global, undefined) {

// check is exist
if ( global.onee ) return;

// set object/version
var onee = global.onee = {
	version : "1.0"
}

var workspace = onee.workspace = (function(){
	
	var scripts = document.getElementsByTagName("script");
	var scriptSelf = scripts[scripts.length-1];
	var scriptSelfSrc = scriptSelf.hasAttribute ? scriptSelf.src : scriptSelf.getAttribute("src", 4);

	return scriptSelfSrc.substring(0, scriptSelfSrc.lastIndexOf("/")+1);
	
})();

onee.log = function ( module ) {
	return function ( msg ) {
		!!console && !!console.log && console.log(+new Date + ' : ' + module + ' -> ', msg);
	}
}

// new a onee's log
var log = onee.log("onee");

// base underscorejs
if ( !global._ ) return log("Base on underscorejs.js");

var extend    = _.extend,
	each      = _.each,
	map       = _.map,
	indexOf   = _.indexOf,
	isEmpty   = _.isEmpty,
	isArray   = _.isArray,
	isFunction= _.isFunction,
	slice     = Array.prototype.slice,
	debug     = !!0;


/**
 * NameSpace 工具集
 * 20130130
 * .versionComparison
 * .queryMap
 * .isEmptyObject
 */
// var Util = onee.Util = {
	
	/**
	 * Function 版本号对比
	 * @param {string} v1
	 * @param {string} v2
	 * v1 > v2 return -1
	 * v1 = v2 return  0
	 * v1 < v2 return  1
	 * 20130213
	 */
	/*versionComparison : function ( v1, v2 ) {
		
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
		
	},*/
	/**
	 * Function query to map
	 * @param [string] url
	 * 20121113
	 */
	/*queryMap : (function () {
		
		var href   = document.location.href;
		var rQuery = /[\?|&](.*?)=([^&#\\$]*)/g;

		return function ( url ) {
			var map = {};

			(url || href).replace( rQuery, function ( a, b, c ) {

				b && c && ( map[b] = c );

			});

			return map;	
		}	
	})(),*/
    
	// 接口初始化
	// 默认扩展到第一个参数
	// 仅仅属性为 undefined 时进行赋值
	/*interface : function () {
		
		var extender = arguments[0];
	
		each( slice.call(arguments, 1), function (obj, k) {
			
			each( obj, function (val, name) {
				
				extender[name] === undefined && (extender[name] = val);
				
			});
			
		});
		
		return extender;
		
	}*/
// }
// 初始化/引用
/*var isType = Util.isType;
var isArray = Array.isArry || isType("Array");
var isObject = onee.isObject = isType("Object");
var isString  = onee.isString  = isType("String");
var isFunction = onee.isFunction = isType("Function");
var isUndefined = onee.isUndefined = isType("Undefined");*/
// 接口初始化
// 默认扩展到第一个参数
// 仅仅属性为 undefined 时进行赋值
var interface = onee.interface = function () {
		
	var extender = arguments[0];

	each( slice.call(arguments, 1), function (obj, k) {
		
		each( obj, function (val, name) {
			
			extender[name] === undefined && (extender[name] = val);
			
		});
		
	});
	
	return extender;
	
}


/**
 * Object 浏览器属性检测
 * 返回主流浏览器
 * 返回渲染核心
 * 返回版本号
 * 201301
 */
/*var browser = onee.browser = (function () {

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
	
})();*/


// define queue
/*var queue = onee.queue = function () {
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
}*/

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

var inc = (function () {

	var baseHead = document.getElementsByTagName("head")[0] || document.documentElement;
	// ref: #185 & http://dev.jquery.com/ticket/2709
	var baseElement = baseHead.getElementsByTagName("base")[0];
	
    var risCSS = /\.css(?:\?|$)/;
	// ref : seajs
	// `onload` event is not supported in WebKit < 535.23 and Firefox < 9.0
	// ref:
	//  - https://bugs.webkit.org/show_activity.cgi?id=38995
	//  - https://bugzilla.mozilla.org/show_bug.cgi?id=185236
	//  - https://developer.mozilla.org/en/HTML/Element/link#Stylesheet_load_events
	var isOldWebKit = (navigator.userAgent.replace(/.*AppleWebKit\/(\d+)\..*/, "$1")) * 1 < 536;
	var READY_STATE_RE = /^(?:loaded|complete|undefined)$/;

	// loading css file
	// ref : seajs
	function _handcss ( node, callback ) {
		var sheet = node.sheet;
		var isLoaded;

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
				callback()
			}
			else {
				_handcss.call( node, callback );
			}
		}, 20);
		
	}

	return function (uri, callback) {

		var isCSS = risCSS.test(uri);

		var node = document.createElement(isCSS ? "link" : "script")

        if (isCSS) {
            node.rel = "stylesheet";
            node.href = uri;
        }
        else {
            node.async = true;
            node.src = uri;
        }

        var notSupportOnload = isCSS && (isOldWebKit || !("onload" in node));

        // 低版本浏览器使用传统css检测方案
        if (notSupportOnload) {
            setTimeout(function() {
                _handcss( node, callback )
            }, 1) // Begin after node insertion
        } else {
            node.onload = node.onerror = node.onreadystatechange = function () {

                if (READY_STATE_RE.test(node.readyState)) {

                    // Ensure only run once and handle memory leak in IE
                    node.onload = node.onerror = node.onreadystatechange = null;
                    // Remove the script to reduce memory leak
                    !isCSS && !debug && baseHead.removeChild(node);
                    // Dereference the node
                    node = null;
                    //callback(index);
                    callback();

                }

            }
        }
        // ref: #185 & http://dev.jquery.com/ticket/2709
		baseElement ?
			baseHead.insertBefore(node, baseElement) :
			baseHead.appendChild(node);
		// log("fetch")
	}

})();


var getURI = function () {

	var href = document.location.href;
	// current path
	var currPath = href.substring(0, href.lastIndexOf("/")+1);
	// match for uri current path -> ./
	var rCurrPath = /^\.\//;
	// match if is independent path
	var risHTTP = /^https?\:\/\//;
	// grobal id for anonymous module
	var guid = 0;

	return function (uri) {
		return uri ?
			risHTTP.test(uri) ? uri : currPath + uri.replace(rCurrPath, "")
			:
			currPath+'_default_'+(guid++);
	}

}();

/**
 * onee.plugins
 */
var plugins = onee.plugins = {"onee.plugins": onee.workspace+"onee.plugins.js"};

/**
 * filepath string 模块路径
 * factory function 模块定义函数
 * [deps] array 依赖模块
 */

// 当前经过define的模块
var currentDefineModule;

extend(onee, (function () {

	var moduleCache = {};

	var STATUS = {
		// 模块初始化
		INITIALIZING : 1,
		// 模块加载中
		LOADING : 2,
		// 模块保存
		SAVED : 3,
		// 加载完成回调
		LOADED : 4,
		// 执行
		EXECUTED : 5
	}

	function Module (uri, tops) {
				// log(uri)
		this.uri = uri;
		this.tops = tops ? [tops] : [];
		this.status = STATUS.INITIALIZING;
	}

	Module.onload = function (that) {

		if (currentDefineModule) {

			moduleCache[that.uri] = extend(that, currentDefineModule);

			currentDefineModule = null;

			var deps = that.deps, depmod, waitting = deps.length, factory = that.factory;

			that.factory = function () {
				that.status = STATUS.EXECUTED;

				if (!waitting || !--waitting) {
					// exec self factory
					factory();
					var tops = that.tops||[], m;
					// exec top's factory
					while((m=tops.shift())) m();
				}

			}

			if ( deps.length ) {
				// log(that.uri)
				each( deps, function (uri, k) {
					// log(uri)
					if ( !(depmod = moduleCache[uri]) ) {
// log(that.factory.toString());
						(moduleCache[uri] = new Module(uri, that.factory)).load();

					} else if ( depmod.status < 5 ) {
// log("d")
						depmod.tops.push(that.factory);

					} else {
						// log("dd")
						that.factory();
					}

				})
			} else that.factory();

		// 不经过define封装的组件
		} else {
			// console.log(that)
			that.status = STATUS.EXECUTED;
			// factory();
			var tops = that.tops||[], m;
			// exec top's factory
			while((m=tops.shift())) m();
		}

	}

	Module.prototype.load = function () {

		this.status = STATUS.LOADING;
		
		var that = this;
		
		inc(that.uri, function () {Module.onload(that)})
	}

	function define ( factory, deps ) {

		currentDefineModule = {
			status : STATUS.SAVED,
			deps : map(deps || [], function (dep) { return getURI(dep) }),
			factory : factory
		}
	}
	function use () {
		var lastArgumentIndex = arguments.length-1;
		var lastArgument = arguments[lastArgumentIndex];
		var hasFactory = isFunction(lastArgument);
		
		var factory = hasFactory ? lastArgument : function() {};

		var uri = getURI();

		currentDefineModule = {
			status : STATUS.SAVED,
			deps : map(slice.call(arguments, 0, lastArgumentIndex + (hasFactory?0:1)), function (dep) { return getURI(dep) }),
			factory : factory
		}
		Module.onload(moduleCache[uri] = new Module(uri));
	}

	// publish define api
	return {
		moduleCache : moduleCache,
		define : define,
		use : use
	}

})());


}( this );