/**
 * demo - 
 * onee 组件开发模板
 * 20130922
 * design by J.do
 * for more ? http://jdoi.net/
 */


/**
 * Function 一体化表单数据提交
 * @param {String} form 表单节点
 * @method error   错误时回调：分ajax错误，表单格式错误
 * @method check   表单提交前执行，可用于额外检测
 * @method done    表单提交后执行，并返回请求数据
 * @method process 表单提交中
 
 * version : 2.0
 * 20120529
 * detial : 表单须设置action与method属性，若method为空，则默认为post，项目需求目前仅支持post & jsonp
 * 			需要提交的字段 需设置 field="字段名" 的属性
 *          格式匹配 需设置 format="RegExp" RegExp为你自己的正则
 * fix : 20120824 - 完善对radio 于 checkbox的兼容
 *       20130212 - 加入自定义正则匹配
 *       20130212 - 处理字段的查找放到 field 函数中处理，可以使用Sizzle遍历
 *       20140311 - 增加_toggleFormStatus_，控制表单提交状态
 *       20140311 - 增加对<select type="Multipleselect" .. 控件的取值支持
 */
;!function (undefined) {

	if (
		!onee ||
		!_ ||
		!Sizzle ||
		!onee.ajax
	) return console && console.log && console.log(

			"Base on "+
			"onee.js /"+
			"underscode.js /"+
			"Sizzle.js /"+
			"ajax.js"

		);
	
	// is exist
	if ( onee.form ) return;

	// new a onee's log
	var log = onee.log("form");
	
	// base method
	var extend = _.extend;
	var each   = _.each;
	// var getAttr= onee.dom
	// get value of checkbox & radio;
	// checkbox -> "value1,value2,value3.."
	function _getvalueofradio ( radio ) {
		if ( !radio.length ) return "";
		
		var val = "",
			tag = radio[0].type;

		if ( tag == "checkbox" ) {
			each( radio,
				function ( v, k ) {
					if ( v.checked ) val += v.value + ',';
				});
		} else if ( tag == "radio" ) {
			each( radio,
				function ( v, k ) {
					if ( v.checked ) val = v.value;
				});
		}
		return val;
	}

	// get selectbox & multiple;
	// multiple -> "select1,select2,select2.."
	function _getSelect ( elem ) {
		// var isMultiple = elem.multiple;
		var options = elem.options;
		var len = options.length;
		var ret = [];
		var item;

		while(len--) {
			item = options[len];
			item.selected && ret.push(item.value);
		}
		
		return ret.join(',')
	}
	
	function _empty_ () {return !!1};

	function _toggleFormStatus_ () {
		this.onSending = !this.onSending;
	}
	
	function _form ( formid ) {
	
		this.form = document.getElementById(formid) || null;
		
		if ( !this.form ) return log("Can't find the form through " + formid);
		
		this.action = this.form.action;
		// 交互标示
		//TODO 
		this.onSending = !!0;
		this.method = (this.form.method || "post").toUpperCase();
		
		this.checkCallback = _empty_;
		this.errorCallback = _empty_;
		this.processCallback = _empty_;
		this.doneCallback = _empty_;
		
		if ( !this.action ) return log('Form must set attribute "action".');
		
		
		var _self_ = this;

		this.form.onsubmit = function (e) {

			if ( _self_.onSending ) return false;
			_toggleFormStatus_.call(_self_);
			var evt = e || window.event;
			evt.preventDefault ? evt.preventDefault() : evt.returnValue = !1;
			
			// 触发提交前的检测
			if ( !_self_.checkCallback() ) return;
			
			var fields = Sizzle("*[field]", _self_.form);
			var map = {};
			var errField = [];
			var subField = {};
			var field, format, value;
			
			
			// 进程中...
			_self_.processCallback.call(_self_, fields);
			
			// 重组字段
			each( fields, function ( element, k ) {
				
				field = element.getAttribute('field');
				format= element.getAttribute('format');
				
				if ( !map[ field ] ) {
					
					map[ field ] = {};
					map[ field ].dom = [];
					
				}
				//console.log(element)
				map[ field ].dom.push( element );
				format && !map[ field ].format && (map[ field ].format = format);
	
			});

			each( map, function ( item, k ) {
				
				value = item.dom.length > 1 ? _getvalueofradio(item.dom) : item.dom[0].tagName==="SELECT" ? _getSelect(item.dom[0]) : item.dom[0].value;

				if ( item.format && !(new RegExp(item.format)).test(value) ) {
					
					errField.push( item.dom )
					
				}
				subField[k] = value || "";
			});

			if ( errField.length ) {
				
				_self_.errorCallback.call(_self_, {"type" : "format", "errField" : errField});
				_toggleFormStatus_.call(_self_);
				
			} else {
				
				_self_.method != 'JSONP' ?
					// post|get
					onee.ajax(_self_.action, {
						method : _self_.method,
						type   : "json",
						data   : subField,
						err    : function (code) {
							_toggleFormStatus_.call(_self_);
							_self_.errorCallback.call(_self_, {"type" : "ajax", "code" : code});
						},
						done   : function (J) {
							_toggleFormStatus_.call(_self_);
							_self_.doneCallback.call( _self_, J );
						}
					})
				:
					onee.jsonp( _self_.action, function( J ) {
						_toggleFormStatus_.call(_self_);
						_self_.doneCallback.call( _self_, J )
					}, subField );
				
			}
		
		}
	
	}
	
	_form.version = "2.0";
	
	extend(_form.prototype, {
		
		check : function (callback) {
		
			callback && (this.checkCallback = callback)
			return this
		
		},

		error : function (callback) {
		
			callback && (this.errorCallback = callback)
			return this
		
		},
		
		process : function (callback) {
		
			callback && (this.processCallback = callback)
			return this
		
		},
		
		done : function (callback) {
		
			callback && (this.doneCallback = callback)
			return this
		
		}
	});
	
	
	onee.Form = function (id) {
		return new _form(id);
	}
	
}();