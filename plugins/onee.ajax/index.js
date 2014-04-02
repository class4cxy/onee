!function (global, undefined) {


if ( !onee || !_ ) return;
// base function
var log         = onee.log("ajax");
var interface   = onee.Util.interface;
var isObject    = onee.isObject;
var each        = _.each;
var extend      = _.extend;


// static variable
var rEnd = /[&\?]$/;

// JSON RegExp - quoted from jquery
var rvalidchars = /^[\],:{}\s]*$/;
var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;




// an empty function use for common quote
function _empty_ () {}

/**
 * Function 异步请求
 * 20110612
 * @param {String} url 请求文件
 * @param [String] options.type 返回数据类型
 * @param [String] options.method 请求方式，默认GET
 * @param [Boolean] options.cache 是否支持缓存，默认支持
 * @param [Number] options.time 超时，默认不限时
 * @param [String] options.data 发送数据包
 * @param [Function] options.done 请求成功回调函数
 * @param [Function] options.err 请求失败回调函数
 * @param [Function] options.timeout 请求超时回调函数
 * How to use :
	_ajax('dat.json', {
		type : 'json',
		method : 'GET',
		cache : !!1,
		err : function() {
			
			throw 'unknow type error'
		},
		done : function( dat ) {
			
			alert( dat.username )
		}
	});
 */
function _callback (X, type) {

	var ct = X.getResponseHeader( 'content-type' ),
		dat = !type && ct && ct.indexOf( 'xml' ) >= 0;

	dat = type == 'xml' || dat ? X.responseXML : X.responseText;
	if ( type == 'json' ) {
		
		if ( window.JSON && window.JSON.parse ) {
			return window.JSON.parse( dat );
		}
		
		// 格式处理
		if ( rvalidchars.test( dat.replace( rvalidescape, "@" )
			.replace( rvalidtokens, "]" )
			.replace( rvalidbraces, "")) ) {

			return ( new Function( "return " + dat ) )();

		}
		log("Invalid JSON: "+dat)
	}
	return dat
}

function _ajax ( url, options ) {
	// check url is legal
	if ( !url || typeof url != 'string' ) return log( 'Wrong URL.' );
	// new XMLHttpRequest
	var xhr = null;
	var timeouthandle;
	
	if ( window.XMLHttpRequest ) {

		xhr = new XMLHttpRequest()
	} else {

		try {
			xhr = new ActiveXObject( 'Msxml2.XMLHTTP' )
		}
		catch( e ) {
			try{
				xhr = new ActiveXObject( 'Microsoft.XMLHTTP' )
			} catch( e ) {}
		}
		
	}
	if ( !xhr ) return log( "can't new a XMLHttpRequest object." )
	
	// 初始化接口
	interface(options||(options={}), {
		method : "GET",
		cache  : !!1,
		type   : "json",
		done   : _empty_,
		err    : _empty_,
		timeout: _empty_
	});

	var params = "";

	isObject(options.data) && each(options.data, function (val, index) {
		
		params += index +'='+ encodeURIComponent(val) +'&'
		
	});

	if ( options.method == 'GET' && params ) {
		
		url += url.indexOf( '?' ) >= 0 ? '&' : '?' + params;
		// clear postd when use GET method
		params = null
	}
	// 清除缓存
	!options.cache && ( url += (url.indexOf( '?' ) >= 0 ? rEnd.test(url) ? "" : "&" : '?') + 'f='+ Math.random() );
	
	xhr.open( options.method, url, true );
	// 在open之后再进行http请求头设定 
	if (options.method === 'POST') {
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
	}

	options.time && (timeouthandle = setTimeout(function(){ xhr.abort(); options.timeout() }, options.time));

	xhr.onreadystatechange = function(){

		if ( xhr.readyState == 4 ) {
			
			timeouthandle && clearTimeout(timeouthandle);
			// 在请求时，如果网络中断，Firefox会无法取得status
			// come from baidu's tangram
			try {
				
				var stat = xhr.status
			} catch(e) {

				return log( 'Unknow Error!' )
			}
			// IE error sometimes returns 1223 when it 
			// should be 204, so treat it as success
			// come from baidu's tangram
			if ( (stat >= 200 && stat < 300) || stat == 304 || stat == 1223 ) {
				
				options.done( _callback( xhr, options.type ) );
				
			} else {
				
				options.err( stat );
				stat == 404 && log( 'Not Found The File!' );
				
			}

			// come from baidu's tangram
			setTimeout(
				function(){
					
					xhr.onreadystatechange = new Function();
					xhr = null
				}, 0)
		}
	}
	xhr.send( params );

}

/**
 * @param url {String}
 * @param done [Function]
 * @param err [Function]
 * @param data [Object]
 */
function _params_ ( done, err, data ) {
	// 一个回调都不存
	if( isObject(done) ) {
		data = done;
		done = err = _empty_;
	
	// 不存在err回调
	} else if ( isObject(err) ) {
		data = err;
		err = _empty_;
	}
	
	return {
		done : done,
		err  : err,
		data : data
	}
}

// export
extend(onee, {
	
	ajax : _ajax,
	
	getJSON : function ( url, done, err, data ) {
		_ajax(url, _params_(done, err, data));
	},
	
	getXML  : function ( url, done, err, data ) {
		_ajax(url, extend({
			
			type : "xml"
			
		}, _params_(done, err, data)));
	},
	
	post   : function ( url, done, err, data ) {
		_ajax(url, extend({
			
			method : "POST"
			
		}, _params_(done, err, data)));
	},
	
	get    : function ( url, done, err, data ) {
		_ajax(url, extend({
			
			type : "html"
		
		}, _params_(done, err, data)));
	},
	
	/**
	 * jsonp package -- use for ajax request data with padding
	 * Copyright (c) desidn by cxy
	 * Version 1.0
	 * Create time : 2011-09-05 17:08
	 * How to use :
	 *
	 * C.jsonp('http://class4cxy.sinaapp.com/jsonp.php', function( d ){alert( d.sex )})
	 *@fix : 更换命名空间 - 20120904
	*/
	jsonp : function ( url, callback, dat ) {
		var fn = 'jsonp' + new Date(),
		
			cleaned = !1,

			js = C.dom.create( 'script', {
				type : 'text/javascript',
				charset : 'utf-8'
			});

		url = url + ( url.indexOf('?') >= 0 ? '&callback=' + fn : '?callback=' + fn );
		
		dat && each( dat,
			
			function ( key, val ) {
				
				url += '&'+ key +'='+ val;
			})
		
		js.src = url;
		function clean() {
			try{
				delete window[ fn ];
				js.parentNode.removeChild( js );
				js = null
			}catch(e){}
			cleaned = !0
		}
		window[ fn ] = function(){
			clean();
			callback.apply( this, arguments )
		}
		js.onload = js.onreadystatechange = function(){			//For IE

			var rs = this.readyState;
			!cleaned && (!rs || rs === 'loaded' || rs === 'complete') && clean()
		}
		dHead.appendChild( js )
	}

});

}(this);