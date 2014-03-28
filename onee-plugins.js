;!function () {

	if ( !onee ) return console && console.log && console.log("Base on onee.js");
	
	// is exist
	if ( onee.plugins ) return;
	
	// 内置驱动/组件
	// 说明：
	// 基础目录 - Base/
	// 组件目录 - Plugins/
	// 键 - 目录名
	// 值 - 需要加载的文件，具体与onee.inc接口一致


    var ws = onee.workspace;
    // var base = ws + "Base/";
    var plugins = ws + "plugins/";
    var sizzle = ws + "Sizzle/Sizzle.js";
    var jquery = ws + "jquery/jquery.js";
    var Tween = ws + "Tween/Tween.js";
    var RequestAnimationFrame = ws + "Tween/RequestAnimationFrame.js";
    var dom = ws + "onee-dom.js";
    var ajax = ws + "onee-ajax.js";
	
	onee.plugins = {

		// Driver
		"sizzle" : {
			deps : [sizzle]
		},
		"jquery" : {
			deps : [jquery]
		},
        "Tween" : {
        	deps : [RequestAnimationFrame,Tween]
        },
		"onee.dom" : {
			deps : [sizzle,dom]
		},
		"onee.ajax" : {
			deps : [ajax]
		},

		// Plugin
		"onee.TmplM" : {
			deps : [ajax, plugins + "onee.TmplM/index.js"]
		},
		"onee.form" : {
			deps : [[sizzle, ajax], plugins + "onee.form/index.js"]
		},
		"onee.Powin" : {
			deps : [
				sizzle,
				dom,
				ajax,
				[
	                plugins + "onee.Powin/index.js",
	                plugins + "onee.Powin/powin-style.css"
	            ]
			]
		},
		"onee.swf" : {
			deps : [
				sizzle,
				dom,
				plugins + "onee.swf/index.js"
			]
		},
        "onee.scrollpx" : {
        	deps : [
	            sizzle,
	            dom,
	            plugins + "onee.scrollpx/index.js"
	        ]
        },
        "onee.scrollitem" : {
        	deps : [
	            [
	                RequestAnimationFrame,
	                Tween,
	                sizzle
	            ],
	            dom,
	            plugins + "onee.scrollitem/index.js"
	        ]
        },
        "onee.scrollanimation" : {
        	deps : [
	            [
	                RequestAnimationFrame,
	                Tween,
	                sizzle
	            ],
	            dom,
	            plugins + "onee.scrollitem/index.js",
	            plugins + "onee.scrollanimation/index.js"
	        ]
        },
		"jquery.tab" : {
			deps : [
				jquery,
				plugins + "jquery.tab/index.js"
			]
		},
        "slipjs" : {
        	deps : [
	            sizzle,
	            dom,
	            plugins + "onee.mobile.slipjs/index.js"
	        ]
        }

	};

} ();
