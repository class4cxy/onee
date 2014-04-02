/**
 * demo - 
 * onee.dom 节点操作方法
 * 20130929
 * design by J.do
 * for more ? http://jdoi.net/
 */

;!function (global, undefined) {

	if ( !onee || !_ || !Sizzle ) return console && console.log && console.log("Base on onee.js & underscode.js & Sizzle.js");

	// is exist
	if ( onee.dom ) return;

	// new a onee's log
	var log     = onee.log("dom");
	var docHead = document.getElementsByTagName("head")[0];
	
	// base method
	var extend  = _.extend;
	var isArray = _.isArray;
	var indexOf = _.indexOf;
	var isEmpty = _.isEmpty;
	var each    = _.each;
	var browser = onee.browser;
	var toString= Object.prototype.toString;
	
	
/*	var G = function (selector) {

		var doms = isArray( selector ) ? selector : selector.nodeType || selector === window ? [selector] : Sizzle(selector);
		
		!doms.length && log("Can't find elements through :" + selector);
		
		return doms
	
	};*/
	
	/**
	 * @function 收录不同浏览器下的特殊属性，不断更新
	 * @create time : 20110930
	 * @nameSpace : C
	 */
	var _diff = (function(){
	
		var isIe = browser.ie,
			isFx = browser.firefox,
			ver  = parseInt(isIe);
	
		return {
			"class"      : isIe && ver < 8 ? "className" : "class",
			"doi"        : isIe ? "readystatechange" : "DOMContentLoaded",
			"innerText"  : isIe ? "innerText" : "textContent",
			"mouseenter" : isIe ? "mouseenter" : "mouseover",
			"mouseleave" : isIe ? "mouseleave" : "mouseout",
			"MouseWheel" : isFx ? 'DOMMouseScroll' : 'mousewheel',
            "float"       : isIe ? "styleFloat" : "cssFloat"
		}
	
	})();
	
	function _contain (parent, son) {
	
		return parent.contains ? 
	
			parent != son && parent.contains( son )
		:
			!!(parent.compareDocumentPosition( son ) & 16);
	
	}
	// remove the listener and distroy it
	function _clear ( element, eventType ) {

		var realFN = element.Event[eventType].realFn;

		document.detachEvent ?
			
			element.detachEvent( 'on'+eventType, realFN )
		:
			element.removeEventListener( eventType, realFN, false );
			
		delete element.Event[eventType];
	}
	
	// NameSpace - fine | 节点查找
	
	extend(onee.dom = {}, (function () {
	
		return {
		
			find : function (selector, context) {
			
				var doms = isArray( selector ) ? selector : selector.nodeType || selector === window ? [selector] : Sizzle.call(null, selector, context);
		
				!doms.length && log("Can't find elements through :" + selector);
				
				return doms
			
			}
		
		}
	
	})());
	// 引用
	var GG = onee.dom.find;
	
	// NameSpace - Event | 事件系列操作
	extend(onee.dom, {
		/**
		 * Function 阻止冒泡
		 * @param {object event} e event对象
		 * 20140227
		 */
		stopBubble : function (e) {
			if (e && e.stopPropagation)  
		        e.stopPropagation();
		    else 
		        window.event.cancelBubble=true
		},
		/**
		 * Function 阻止浏览器默认行为
		 * @param {object event} e event对象
		 * 20140227
		 */
		stopDefault : function (e) {
			if (e && e.preventDefault)  
		        e.preventDefault();
		    else 
		        window.event.returnValue=false
		},
		/**
		 * Function 给指定DOM节点绑定事件监听器
		 * @param {object dom} selector 节点
		 * @param {string} eventType 监听类型
		 * @param {function} eventCallback 监听器
		 * @param [object dom] agentSelector 代理节点（使用代理方式绑定）
		 * 20130210
		 * Node : 
		 *  不支持foucs & blur代理
		 *  不支持 同时 代理方式&普通绑定 在同一节点
		 */
		on : function ( selector, eventType, eventCallback, agentSelector ) {
		
			var Selector = GG(selector);
			var realType = _diff[eventType] || eventType;
			// 检查监听节点是否存在
			if ( !Selector.length ) return;
			// 检查回掉类型是否符合
			if ( !eventCallback || typeof eventCallback !== "function" ) return log("Unknow typeof eventCallback.");

			each( Selector, function (element, index) {

				// comm callback listener
				function _callback_ ( evt ) {

					evt = evt || window.event;
					var obj = evt.target || evt.srcElement, //from
						index,
						// 代理节点
						AgentSelector = agentSelector ? GG(agentSelector, element) : [];
						
					
					if ( ( eventType == "mouseenter" || eventType == "mouseleave" ) && !browser.ie ) {
						
						var related = evt.relatedTarget, //to
							current = AgentSelector.length ? AgentSelector : [evt.currentTarget];
						
						//console.log( related )
						// check, come from baidu's tangram
						if (
							// 如果current和related都是body，contains函数会返回false
							//related == current ||
							// Firefox有时会把XUL元素作为relatedTarget
							// 这些元素不能访问parentNode属性
							// thanks jquery & mootools
							// 如果current包含related，说明没有经过current的边界
							related &&

							(function () {
							
								var __ = !!0;
								//console.log("d")
								each(current, function (ag, k) {
									if ( _contain( ag, related ) || related == ag ) return __ = !!1;
								});
								return __
							
							}() ||
							
							related.prefix == 'xul')
	
						) return;
					}
					// on live
					if ( agentSelector || AgentSelector.length ) {

						var index = -1;
						//console.log(obj)

						each(AgentSelector, function ( agent, key ) {
						// 检查代理节点是否被包含
						// 检查代理节点是否为本身
						//console.log(_contain(agent, obj))
							if ( _contain(agent, obj) || agent === obj ) return index = key;

						});

						index > -1 && eventCallback && eventCallback.call( AgentSelector[index], evt );

					// on bind
					} else {
						
						each( element.Event[realType].fns, function ( fn, key ) {
					
							fn.call( element, evt );
			
						});
						
					}
				};
				
				if ( !element.Event ) element.Event = {};
	
				var item = element.Event[realType];
				
				if ( !item ) {
					
					item = element.Event[realType] = {};
					item.fns = [];
					
					document.attachEvent ?
				
						element.attachEvent( 'on'+realType, item.realFn = _callback_ )
					:
						element.addEventListener( realType, item.realFn = _callback_, false );
				
				}
		
				item.fns.push( eventCallback );
			
			});
			
			return Selector;
		
		},
		/**
		 * Function 给指定DOM节点解除事件监听
		 * @param {object dom} selector 节点
		 * @param {string} eventType 监听类型
		 * @param [function] eventCallback 监听器
		 * 20130210
		 */
		un : function ( selector, eventType, eventCallback ) {
			
			var Selector = GG(selector);
			var realType = _diff[eventType] || eventType;
			var fns;
			// 检查监听节点是否存在
			if ( !Selector.length ) return;
			
			each(Selector, function ( element, index ) {
			
				if ( element.Event && (fns = element.Event[realType].fns) && !!fns.length ) {
					// no EventListener
					if ( !eventCallback ) return _clear( element, realType );
		
					var index = indexOf( fns, eventCallback );
					
					// can find the listener 
					index > -1 && 
					// remove in the queue of Fns
					fns.splice(index, 1) && 
					// then, check the Fns.length
					!fns.length && 
					// when Fns.length == 0, goto _clear
					_clear( element, realType );
					
				}
			
			});
			
			return Selector;
		},
		
		/**
		 * Function key.on 支持 组合键 (ctrl,shift,alt)；
		 * 支持 同一按键上绑定不同方法，会按照绑定先后顺序而执行；
		 * @param expression{string} 按键表达式
		 * @param callback{function} 回调
		 * 不允许单独绑定 组合键
		 * ps: 不支持 主要是由于 目前没有这变态的需求；
		 *     减少逻辑代码量
		 * use: C.Event.key.on("ctrl + delete", function (){console.log("do it")});
		 * date: 20130115
		 * design by J.do 
		 */
		 /**
		 * Function key.un 卸载整个键盘监听事件
		 * 卸载指定按键的指定事件
		 * 卸载指定按键的所有监听事件
		 * @param [string]  arguments[0] 按键表达式
		 * @param [function]arguments[1] 监听器
		 * use: C.Event.key.un("a", listener);
		 *      C.Event.key.un("a");
		 *      C.Event.key.un();
		 * 20130218
		 * design by J.do 
		 */
		key : (function () {
	
			var _FnKey = {
		
					CTRL  : "ctrlKey",
					ALT   : "altKey",
					SHIFT : "shiftKey"
		
				},
		
				_CodeMap = {
		
					"ESC"      : 27,
					"ENTER"    : 13,
					"SPACE"    : 32,
					"DELETE"   : 46,
					"PAGEUP"   : 33,
					"PAGEDOWN" : 34,
					"UP"       : 38,
					"DOWN"     : 40,
					"LEFT"     : 37,
					"RIGHT"    : 39
		
				},
		
				_isPressFnKey = function (e) {
		
					for ( var i in _FnKey )
		
						if ( e[_FnKey[i]] ) return !0;
		
					return !1;
		
				},

				_Condition = function ( exps ) {
		
					// Fn + ~
					if ( /\+/g.test(exps) ) {
		
						return exps
							.replace( "+", "&&")
							.replace( /(\w+)/g, function ( a ) {
		
								if ( a ) {
						
									if ( _FnKey[a] ) return "e." + _FnKey[a];
									
									return _CodeMap[a] ?
									
										"e.keyCode === " + _CodeMap[a]
									:
										"String.fromCharCode(e.keyCode) === '" + a + "'";
									
								}
		
							});
						
					} else {
						
						return _CodeMap[exps] ?
							
							// other word key
							"e.keyCode === " + _CodeMap[exps] + " && !_isPressFnKey(e)"
						:
							// A-Z0-9
							"String.fromCharCode(e.keyCode) === '" + exps + "'";
					}
					
				},
				
				_listener = function ( e ) {
					
					each( document.keyEvents, function ( v, k ) {
		
						if ( eval(v.exp) ) {
							
							each( v.listener, function ( n, m ) {
								
								n.call( v, e );
								
							})
							
						}
						
					});
					
				},
				// remove all the events
				_unAll = function () {
					
					eventUN( document, "keydown", _listener );
					delete document.keyEvents;
					
				},
				// remove all the "key"'s events
				_unType = function ( type ) {
		
					delete document.keyEvents[type];
					// when global key event is empty, remove all the events
					isEmpty(document.keyEvents) && _unAll();
					
				};
		
			return {
	
				on : function ( expression, listener ) {
		
					var exps   = expression.replace(/\s/g, "").toUpperCase().split(','),
						events = document.keyEvents;
					
					if ( !events ) events = document.keyEvents = {};
		
					// listen global keydown event
					isEmpty(events) && eventON( document, "keydown", _listener );
					
					each( exps, function ( v, k ) {
						
						if ( !_FnKey[v] ) {
			
							var item = events[v];
		
							// create for first time
							if ( !item ) {
								
								item          = events[v] = {};
								item.exp      = _Condition( v );
								item.self     = v;
								item.listener = [];
		
							}
							
							item.listener.push( listener || function () {} );
			
						} else log("You can't add event listener only on the following key : Ctrl,Shift,Alt");
					
					});
				},
	
				un : function () {
					
					var events = document.keyEvents;
			
					if ( events || !isEmpty(events) ) {
						
						var len = arguments.length;
						
						// remove all the events
						if ( len == 0 ) {
							
							_unAll();
							
						} else {
							
							var exps = arguments[0].replace(/\s/g, "").toUpperCase().split(','),
								item,
								arg1 = arguments[1],
								index,
								listener;
		
							each( exps, function ( v, k ) {
		
								if ( (item=events[v]) !== undefined ) {
									
									// remove all the key's events
									if ( len === 1 ) {
										
										_unType( v );
										
									} else {
		
										//console.log(  )
										// when arg1 in item.listener, goto remove it
										(index = indexOf( (listener = item.listener), arg1 )) > -1 && 
										// when remove success, check the listener is empty ?
										!!listener.splice( index, 1 ) && 
										// if empty then goto remove all the "key"'s events
										!listener.length && _unType( v );
		
									}
									
								}
		
							});
		
						}
						
					}
					
				}
			}
			
		})()
		
	});
	// 引用
	var eventON = onee.dom.on;
	var eventUN = onee.dom.un;
	var keyON   = onee.dom.key.on;
	var keyUN   = onee.dom.key.un;
	
	// NameSpace - css | 样式系列工具
	extend(onee.dom, (function () {

		//var rHasUnit = /(?:px|%|em)$/i;

		function _setCss ( elem, map ) {

			each( map, function ( value, name ) {
				
				if ( name === 'opacity' ) {
				
					if ( browser.ie ) {
						
						name  = 'filter';
						value = 'alpha(opacity='+value+')';
	
					} else 
	
						value = parseInt(value)/100;
				}
                //console.log(name, value)
				//console.log(name)
				//elem.style[ name ] = rHasUnit.test(value) ? value : value+"px";
				elem.style[ _diff[name]||name ] = value;
				
			});
		}
	
		function _getCss ( elem, name ) {
		
			var val;
			//for IE filter	
			if ( elem.currentStyle && name === 'opacity' ) {
				
				val = /opacity=([^)]*)/.test( elem.currentStyle.filter || '' ) ? ( parseFloat( RegExp.$1 ) / 100 ) + '' : '';
				return val === '' ? 1 : val;
			}
			//for inline style
			if ( elem.style[ name ] ) {
				
				val = elem.style[ name ];
			
			//for IE
			} else if ( elem.currentStyle ) {
		
				val = elem.currentStyle[ name ];
	
			//for W3C
			} else if ( getComputedStyle ) {
		
				name = name.replace( /([A-Z])/g, '-$1' ).toLowerCase();
				var defaultView = elem.ownerDocument.defaultView;
		
				if ( !defaultView ) {
					return null;
				}
		
				var computedStyle = defaultView.getComputedStyle( elem, null );
		
				if ( computedStyle ) {
		
					val = computedStyle.getPropertyValue( name );
				}
			}
			return val;
		}
		
		return {
			css : function ( selector, props, value ) {
				
				var Selector = GG(selector);
				// 检查监听节点是否存在
				if ( !Selector.length ) return;
				
				var map  = {},
					arg1 = arguments[1],
					len  = arguments.length;
	
				if ( len == 2 && "string" === typeof arg1 ) {
					
					return _getCss( Selector[0], props );
					
				}
				if ( len == 3 ) {
				
					map[ arg1 ] = arguments[2];
		
				} else if ( toString.call(arg1) === "[object Object]" ) {
					
					map = arg1;
				
				}
				!isEmpty(map) && each( Selector, function ( elem, index ) {
	
					_setCss( elem, map );
				
				});

				return Selector;
			}
		}

	})());
	
	
	// NameSpace - html,text | 节点相关操作
	extend(onee.dom, (function (){
		
		var rTagStyle = /<style.*?>([^<]*)<\/style>/ig;
		
		// 碎片节点
		var fragment = document.createDocumentFragment();
		
		return {
			
			/**
			 * Function 为dom节点插入HTML代码或者返回innerHTML
			 * 20111002
			 * @parma html{string|null}
			 * fix : 20120629 - 在IE8以下的浏览器增加了对style标签插入的渲染
			 */
			// 使用该方式填充节点，务必
			// 确保填充节点内部所有事件
			// 绑定都已经解除，否则将导
			// 致内存泄漏！
			html : function ( selector, html ) {
			
				var Selector = GG(selector);
				// 检查监听节点是否存在
				if ( !Selector.length ) return;
				
				if ( typeof html == "string" ) {
				
					var styleText = "";
					var ver = browser.ie ? parseInt(browser.ie) : 9;
					
					// 处理style节点
					if ( ver < 9 && !!html ) {
						
						html = html.replace( rTagStyle, function( k, b, f, g ){
								
							if ( b ) styleText += b;
							if ( k ) return '';
							
						});
			
						if ( styleText ) {
							var style = document.createElement("style");
								style.type = "text/css";
							
							try{ style.styleSheet.cssText = styleText }catch(e){};
							docHead.appendChild( style );
						}
					}
				
				} else {
				
					return Selector[0].nodeType == 1 ? Selector[0].innerHTML : null;
				
				}
				
				each( Selector, function ( element, k ) {
					
					element.innerHTML = html;
					
				});
				
				return Selector;
			
			},
			
			/**
			 * Function 为dom节点插入文本或者返回节点中文本
			 * 20111002
			 * @parma text{string|null}
			 */
			text : function( selector, text ) {

				var Selector = GG(selector);
				// 检查监听节点是否存在
				if ( !Selector.length ) return;

				var innerText = _diff.innerText;
				
				if ( text !== undefined ) {
		
					each( Selector, function ( element, k ) {
						
						element[ innerText ] = text;
						
					});
		
				} else return Selector[innerText];
				
				return Selector;
			},
			/**
			 * Function 插入节点
			 * 20131015
			 * @parma text{object|string}
			 * 支持插入dom, innerHTML
			 * return 被插入的节点
			 */
			append : function ( selector, element ) {
			
				var Selector = GG(selector);
				var tmpFragments = isArray(element) ? element : [element];
				var tmpFragment;
				
				var retFragment = [];
				//var tmpFragmentDiv;
				// 检查监听节点是否存在
				if ( !Selector.length ) return;

				if ( typeof element === "string" ) tmpFragments = onee.dom.create(element);
				
				while( tmpFragments.length ) {
				//console.log(tmpFragment)
					tmpFragment = tmpFragments.shift();
					var f, tt;
					each( Selector, function ( item, k ) {
						//console.log(tmpFragment)
						tt = item.appendChild(tmpFragment);
						if ( !f ) {
							f = !!1;
							retFragment[retFragment.length] = tt;
						}
					
					});
				
				}
				
				
				// 还原div节点
				//fragment.appendChild(tmpFragmentDiv);
				
				return retFragment;
			
			},
			/**
			 * Function 新建节点
			 * 20131018
			 * @parma elementString{string}
			 * 支持innerHTML方式新建
			 */
			create : function (elementString, flag) {
			
				var fragmentDiv = fragment.appendChild(document.createElement("div"));
				var tmpElements = [];
			
				if ( typeof elementString === "string" ) {
				
					fragmentDiv.innerHTML = elementString;
					
					// 转移div中的子节点
					while( fragmentDiv.children.length ) {
					
						//tmpElements[tmpElements.length] = fragment.appendChild(fragmentDiv.children[0]);
						tmpElements[tmpElements.length] = fragmentDiv.removeChild(fragmentDiv.children[0]);
					
					}

					// 移除的 div 节点，释放缓存
					var ttt = fragment.removeChild(fragmentDiv);
					ttt = null;
				
				}
				
				return tmpElements;
			
			}
		}
		
	})());
	
	
	// NameSpace - Attribute | 属性系列操作
	extend(onee.dom, (function() {
	
		// add or get attribute
		function _attr ( elem, types, method ) {
			
			// get attribute
			// string
			if ( 'string' === typeof types ) {
				
				return elem[method]( _diff[types] || types );
			
			// del or set attribute
			// object
			} else {
	
				each( types, function ( v, k ) {
	
					elem[method]( _diff[k] || k, v );
	
				});
				
			}
		}
		
		return {
		
			/**
			 * Function 给DOM节点添加属性
			 * 20110930
			 * @parma arguments[0]{string|object Object}
			 * @parma arguments[1]{string|null}
			 * tips : 不兼容style属性设置，请用css方法替换
			 */
			setAttr : function( selector, prop, value ) {

				var Selector = GG(selector);
				// 检查监听节点是否存在
				if ( !Selector.length ) return;
				
				var map = {};
	
				if ( typeof prop !== "object" ) {
				
					map[ prop ] = value;
		
				} else map = prop;
				
				each( Selector, function ( element, k ) {
				
					_attr( element, map, "setAttribute" );
				
				});
		
				return Selector
			},
			/**
			 * Function 删除指定节点属性
			 * 20111114
			 * @parma type{string} 指定属性 type1 type2 type3 ...
			 * tips : 不兼容删除style属性值
			 */
			delAttr : function( selector, type ) {
		
				var Selector = GG(selector);
				// 检查监听节点是否存在
				if ( !Selector.length ) return;
				
				var types = {};
	
				// 处理参数格式，保持与_attr 一致
				each( type.split(' '), function ( val, key ) {
	
					types[val] = !!0;
	
				});
				
				each( Selector, function ( element, k ) {
					
					_attr( element, types, "removeAttribute" );
					
				});
		
				return Selector
			},
			/**
			 * Function 获取DOM节点属性
			 * 20111001
			 * @parma type{string}
			 * tips : 不兼容获取style属性值
			 */
			getAttr : function( selector, type ) {
	
				var Selector = GG(selector);
				// 检查监听节点是否存在
				if ( !Selector.length ) return;
				
				return _attr( Selector[0], type, "getAttribute" );
	
			},
			/**
			 * Function 添加CLASS
			 * 20120817
			 * @parma val{string} class1 class2 class3 ...
			 * @tips : 支持添加多个CLASS值，若有相同名，则跳过
			 */
			addClass : function ( selector, val ) {
				
				var Selector = GG(selector);
				// 检查监听节点是否存在
				if ( !Selector.length ) return;
				// val is undefined
				if ( val !== undefined ) {
					
					var oldClass,
						queue = val.split(' '),
						cReg;
	
					each( Selector, function ( element, key ) {
	
						oldClass = _attr( element, "class", "getAttribute" );
							
						if ( !oldClass ) return _attr(element, {"class" : val}, "setAttribute");
						// if class had exist will not be add again
						each( queue, function ( v, k ) {
	
							cReg = new RegExp( '\\b'+v+'\\b', 'ig' );
							if ( !cReg.test(oldClass) ) oldClass += ' ' + v;
							// clear
							cReg = null;
	
						});
						
						_attr(element, {"class" : oldClass}, "setAttribute");
					});
	
				}
				return Selector;
			},
			/**
			 * Function 设置CLASS值
			 * 20120822
			 * @parma val[string]
			 * @tips : 重写CLASS值，区分开 addClass方法
			 */
			setClass : function ( selector, val ) {
				
				var Selector = GG(selector);
				// 检查监听节点是否存在
				if ( !Selector.length ) return;
			
				each( Selector, function ( element, index ) {
				
					_attr( element, {"class" : val}, "setAttribute" );
				
				});
	
				return Selector;
			},
			/**
			 * @function 删除CLASS值
			 * @create time : 20120817
			 * @parma val[string]
			 * @tips : 支持删除多个CLASS值，若为空，则删除全部
			 */
			delClass : function ( selector, val ) {

				var Selector = GG(selector);
				// 检查监听节点是否存在
				if ( !Selector.length ) return;
				
				var oldClass,
					newQueue = val.split(' '),
					cReg;
	
				if ( val !== undefined ) {
	
					each( Selector, function ( element, index ) {
		
						oldClass = _attr( element, "class", "getAttribute" );
						// not class
						if ( !oldClass ) return;
						each( newQueue, function ( v, k ) {
		
							cReg = new RegExp( '\\b'+v+'\\b', 'ig' );
							oldClass = oldClass.replace( cReg, '' );
							// clear
							cReg = null;
		
						});
		
						_attr( element, {"class" : oldClass}, "setAttribute" );
		
					});
	
				} else {
					// delete all class
					each( Selector, function ( element, index ) {
						
						_attr( element, {"class" : !!0}, "removeAttribute" );
						
					});
					
				}
				
				return Selector;
			}
		
		}
	
	})());


}(this);