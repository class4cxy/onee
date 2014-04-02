/**
 * TmplM 前端模版引擎管理
 * why 'M' ? No just a Tmpl engine, but a Tmpl Manager
 * var Tcomm = TmplM("comm.tpl") 引入模板文件
 * 当模板文件引入成功的监听
 * Tcomm.done(callback) callback 回调，回调内部的this指向Tcomm
 * 查找指定模板（未必在Tcomm.done触发之后才能正确查找）
 * var TUserCenter = Tcomm.find("UserCenter")
 * TUserCenter 拥有以下方法：
 * TUserCenter.render("UserCenter2", map2)
 * @param {String} 填充节点ID
 * @param {Object} 数据
 * more ? http://www.jdoi.net/2013/09/28/api-tmplm-2-0-js-%E5%89%8D%E7%AB%AF%E6%A8%A1%E6%9D%BF%E7%AE%A1%E7%90%86%E5%99%A8/
 */

;!function (global, undefined) {

	if ( !onee || !_ || !onee.ajax ) return console && console.log && console.log("Base on onee.js, underscode.js, ajax.js");
	
	// is exist
	if ( onee.TmplM ) return;

	// new a onee's log
	var log = onee.log("TmplM");
	
	var extend = _.extend;
	var each   = _.each;
	var getTmpl= onee.get;

	var // 匹配变量
		rVar = /\{@([^\}]+)\}/g,
		// 匹配转意符
		rClean = /\\(\{|\})/g,
		// 匹配script语句
		rScript = /\{\$(.*?)\$\}/,
		// 匹配注释代码
		rNode = /(\s*)\/{2,}/,
		// 匹配 行
		rline = /(\s*)([^\r\n]+)/g,
		// 解析tmpl文件
		rParseTmp = /(\/\/BEGIN\/\/)\{([\w]+)\}([^\1]*?)\/\/END\/\//g;


	// 编译模块
	function _compile ( tmpl ) {
		
		var script;

		return tmpl.replace( rline, function (a, b, c) {
					
					// 存在注释符
					if ( rNode.test(c) ) return b+c;

					// 不属于空行
					if ( !!c ) {
						// 先解析变量
						c = c.replace( rVar, "'+($1)+'" );
						//console.log(c)
						//if ( !!c ) return "";
						// 匹配到JS语句
						if ( !!(script=rScript.exec(c)) ) {
							
							return b + script[1] + "\n";
							
						} else return b +"_s += '"+ c +"';\n";
						
					} else return "";
				});
		
	}
	
	// 恶意代码转换模块
	var _encode = (function () {
		
		var badChars = /&(?!\w+;)|[<>"']/g,
			map = {
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#x27;",
				"&": "&amp;"
			},
			fn = function (s) {
				return map[s] || s;
			}
		return function (content) {
			return typeof content === 'string' ?
				content.replace(badChars, fn)
			:
				content;
		};
	})();
	
	function _tmpl ( ID, tmpl ) {
	
		if ( !ID || !tmpl ) return log("ID or tmpl was missing.");
		
		if ( !_tmpl._cache_ ) _tmpl._cache_ = {};
		
		var tmp;

		if ( tmp = _tmpl._cache_[ID] ) return tmp;
		
		_tmpl._cache_[this.ID = ID] = this;
		
		this.tmpl = "var _s = ''; "+ _compile( tmpl ) +" return _s;";
	
	}
	
	
	_tmpl.prototype.render = function ( dom, map ) {
	
		if ( dom = document.getElementById(dom) ) {
			try {
				dom.innerHTML = new Function( 'O, encode', this.tmpl )( map, _encode );
			} catch ( e ) {
				dom.innerHTML = '<p class="tpml-error">数据异常！</p>';
				log(e)
			}
		} else log("Can't find the element.");

		return this
	
	}
	
	function _manager ( file ) {
	
		if ( !file ) return log("file was missing.");
		
		if ( !_manager._cache_ ) _manager._cache_ = {};
		
		var tmp;

		if ( tmp = _manager._cache_[file] ) return tmp;
		
		_manager._cache_[this.file = file] = this;
		
		// 回调队列
		this.queue = [];
		// 加载状态
		this.status = 0;
		// 模板（未编译）
		this.tmpls = {};
		var _self_ = this;
		// 加载模板文件
		getTmpl(file, function (T) {
			// 解析模板文件
			T.replace( rParseTmp, function ( a, b, c, d ) {
				if ( !!c && !!d.replace(/[\s]*/g, "") ) _self_.tmpls[c] = d;
			});
			
			// tiggle Event
			each(_self_.queue, function ( callback, index ) {
				typeof callback === "function" && callback.call(_self_);
			});
			
			// status = 1 loaded
			_self_.status = 1;
			
		}, function (ecode) {
			_self_.fail.call(_self_, ecode)
		});
	
	}
	
	_manager.prototype.find = function ( ID ) {
	
		var tmpl;
		if ( !(tmpl = this.tmpls[ID]) ) return log("Can't find the tmpl through ID:"+ID);
		
		return new _tmpl(ID, tmpl)
	
	}
	
	_manager.prototype.done = function ( callback ) {
		
		if ( callback ) {
			// tiggle immediately when done
			if ( this.status ) return callback.call(this);
			this.queue.push( callback );
		}
		
		return this
		
	}
	
	
	// export tmplm
	onee.TmplM = function (file) {
		return new _manager(file)
	}

}(this);