/**
 * demo - 
 * onee 组件开发模板
 * 20130922
 * design by J.do
 * for more ? http://www.jdoi.net/?p=382
 */


/**
 * Function 创建一个flash对象，并插入相应的DOM
 * 20111024
 * @param {object dom} options.filler 填装节点
 * @param {string} options.ver 播放所需要的flash版本号
 * @param {string} options.id  要创建的flash的标识，默认为随机ID
 * @param {string} options.url  flash文件的url 
 * @param {string} options.vars  传递给flash的参数
 * @param {string} options.process  flash加载进度回调
 * @param {string} options.done  flash加载完毕回调函数
 * @param {string} options.width  flash的宽度 
 * @param {string} options.height  flash的高度 
 * @param {string} options.base  设置用于解析swf文件中的所有相对路径语句的基本目录或URL 
 * @param {string} options.bgcolor  swf文件的背景色 
 * @param {string} options.salign  设置缩放的swf文件在由width和height设置定义的区域内的位置。允许值：l/r/t/b/tl/tr/bl/br 
 * @param {boolean} options.menu  是否显示右键菜单，允许值：true/false 
 * @param {boolean} options.loop  播放到最后一帧时是否重新播放，允许值： true/false 
 * @param {boolean} options.play  flash是否在浏览器加载时就开始播放。允许值：true/false 
 * @param {string} options.quality  设置flash播放的画质，允许值：low/medium/high/autolow/autohigh/best 
 * @param {string} options.scale  设置flash内容如何缩放来适应设置的宽高。允许值：showall/noborder/exactfit 
 * @param {string} options.wmode  设置flash的显示模式。允许值：window/opaque/transparent 
 * @param {string} options.allowscriptaccess  设置flash与页面的通信权限。允许值：always/never/sameDomain 
 * @param {string} options.allownetworking  设置swf文件中允许使用的网络API。允许值：all/internal/none 
 * @param {boolean} options.allowfullscreen  是否允许flash全屏。允许值：true/false 
 * @param {boolean} options.seamlesstabbing  允许设置执行无缝跳格，从而使用户能跳出flash应用程序。该参数只能在安装Flash7及更高版本的Windows中使用。允许值：true/false 
 * @param {boolean} options.devicefont  设置静态文本对象是否以设备字体呈现。允许值：true/false 
 * @param {boolean} options.swliveconnect  第一次加载flash时浏览器是否应启动Java。允许值：true/false 
 */
;!function (undefined) {

	if (
		!onee ||
		!_ ||
		!onee.dom
	) return console && console.log && console.log(

			"Base on "+
			"onee.js /"+
			"underscode.js /"+
			"dom.js"

		);
	
	// is exist
	if ( onee.swf ) return;

	// new a onee's log
	var log = onee.log("swf");
	var browser = onee.browser;
	// var versionComparison = onee.Util.versionComparison;
	var find = onee.dom.find;
	
	// base method
	var extend = _.extend;
	var each   = _.each;

	function _versionComparison ( v1, v2 ) {
		
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
		
	}
	
	function _getFlashVersion () {
	
		var p = navigator.plugins, fl;
		if ( p && p.length ) {
			
			fl = p['Shockwave Flash'];
			if ( fl && fl.description ) {
				
				return fl.description.replace( /([a-zA-Z]|\s)+/, '' ).replace( /(\s)+r/, '.' ) + '.0';
			}
		} else if ( window.ActiveXObject ) {

			for ( var i = 11; i >= 6; i-- ) {
				
				try{
					
					fl = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.' + i);

					if( fl ) {
						
						return fl.GetVariable('$version').replace(/WIN(\s)+/g,'').replace(/,/g,'.');
					}
				} catch (e){}
			}
		}
	
	}
	
	function _swf ( options ) {
	
		var context = find(options.context);
		
		if ( !(context = context[0]) ) return;
		
		var _self_ = this;
		
		var ver   = _getFlashVersion(),
			need  = options.ver || '9.0.0.0',
			error = '<p stlye="width:100%;text-align:center">您还没安装flash播放器或者版本过低，请点击击<a href="http://www.adobe.com/go/getflash" target="_blank">这里</a>安装</p>';
		
		//需要更高版本 || 没有安装flash播放器
		if ( !ver || _versionComparison( ver, need ) === 1 ) {

			return onee.dom.html( context, error );

		}
		//add default attribute
		browser.ie ?
			(
				options.codebase		= 'http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,0,0',
				options.classid			= 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000',
				options.movie			= options.url || ''
			)
		:
			(
				options.pluginspage		= 'http://www.macromedia.com/go/getflashplayer',
				options.type			= 'application/x-shockwave-flash',
				options.data			= options.url || ''
			)
		options.allowscriptaccess	= options.allowscriptaccess || 'always';
		options.wmode				= options.wmode || 'transparent';
		options.id					= options.id || 'flash-' + Math.random();

		options.vars && ( options.flashvars = options.vars, delete options.vars );

		delete options.url;
		// 定义object default attribute
		var objAttr = {
				id					: 1,
				height				: 1,
				width				: 1,
				codebase			: 1,
				classid				: 1,
				name				: 1,
				data				: 1,
				type				: 1
			},
			param = {
				wmode				: 1,
				scale				: 1,
				quality				: 1,
				play				: 1,
				loop				: 1,
				menu				: 1,
				salign				: 1,
				bgcolor				: 1,
				base				: 1,
				allowscriptaccess	: 1,
				allownetworking		: 1,
				allowfullscreen		: 1,
				seamlesstabbing		: 1,
				devicefont			: 1,
				swliveconnect		: 1,
				flashvars			: 1,
				movie				: 1,
				pluginspage			: 1
			},
			obj = '<object',
			par = '',
			j, flash = '';

		for ( j in options ) {

			j = j.toLowerCase();
			if ( options[ j ] ) {
				
				objAttr[ j ] && ( obj += ' '+ j +'="'+ options[j] +'"' );
				param[ j ] && ( par += '<param name="'+ j +'" value="'+ options[j] +'">' );

			}
		}
		obj += '>';
		flash += obj + par + '</object>';
		// append
		this.swfObject = onee.dom.append( context, flash )[0];

		// handle process...
		//_process( this );
		
		this.processCallback;

		// 延时等待 process 初始化
		setTimeout(
			function () {
				//console.log(_self_.processCallback)
				if ( _self_.processCallback ) {
					var p, ph = setInterval(function() {
						try{
							_self_.processCallback(
								p = _self_.swfObject.PercentLoaded(),
								(function () {
								
									var status = "process";
									if ( p == 100 ) {
										clearInterval(ph);
										status = "done";
									}
									return status
								
								})()
							)
						} catch (e){}
					}, 50)
				}
			}
		, 13);
	
	}
	
	extend(_swf.prototype, {
	
		process : function (callback) {
		
			this.processCallback = callback;
		
		}
	
	})
	
	
	onee.swf = function (options) {
		return new _swf(options);
	}
	onee.swf.version = "2.0.0";
	
}();