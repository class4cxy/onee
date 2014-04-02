;!function () {

	if ( !onee ) return console && console.log && console.log("Base on onee.js");
	
	// 内置驱动/组件
	// 说明：
	// 基础目录 - Base/
	// 组件目录 - Plugins/
	// 键 - 目录名
	// 值 - 需要加载的文件，具体与onee.inc接口一致


    var ws = onee.workspace;
    var plu = ws+"plugins/";
    var plugins = onee.plugins;

    _.extend(onee.plugins, {
    	"sizzle" : ws + "Sizzle/sizzle.js",
    	"jquery" : ws + "jquery/jquery.js",
    	"RequestAnimationFrame" : ws + "Tween/RequestAnimationFrame.js",
    	"Tween" : ws + "Tween/Tween.js"
    });

    _.each(("onee.dom onee.ajax onee.tmplm "+
    	"onee.form onee.powin onee.swf "+
    	"onee.scrollitem onee.LayerScroll").split(" "), function (index, k) {
    		plugins[index] = plu + index + "/index.js"
    	});

} ();
