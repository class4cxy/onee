/**
 * module layerscroller
 * use for
 * design by Jdo.
 * 13-12-17
 * more ? http://jdoi.net
 */


onee.define(function () {

    'use stick';
    // is exist
    if ( onee.layerscroller ) return;

    // new a onee's log
    var log         = onee.log("layerscroller");
    var GG          = onee.dom.find;
    var interface   = onee.interface;
    var setCss      = onee.dom.css;
    var append      = onee.dom.append;
    var onEvt       = onee.dom.on;
    var getAttr     = onee.dom.getAttr;
    var addClass    = onee.dom.addClass;
    var delClsss    = onee.dom.delClass
    var stopDefault = onee.dom.stopDefault;

    var each = _.each;
    var extend = _.extend;

    var cm_duration = 1e3;
    // mousewheel 兼容
    // var _MouseWheel = onee.browser.firefox ? 'DOMMouseScroll' : 'mousewheel';

    //遍历内部运动节点
    function _findAnimationNode (module) {

        //缓存所有运动节点
        var animationnodes = [];
        var len = module.scenes.length;
        var scene, tmp;

        while (len--) {

            scene = module.scenes[len];
            tmp = animationnodes[len] = [];
            // console.log(GG("*[animation-offset]", scene))
            each( GG("*[animation-offset]", scene), function(node, k) {
//console.log(node)
                tmp.push(new _TweenNode({

                    node : node,
                    offset : _attr_string2object(getAttr(node, "animation-offset")),
                    easing : _splitInOut(getAttr(node, "animation-easing") || "Cubic,Cubic"),
                    rate : _splitInOut(getAttr(node, "animation-rate") || '1,1', parseFloat),
                    // "1000,500" => [1000, 500]
                    delay : _splitInOut(getAttr(node, "animation-delay") || '0,0', parseInt)

                }));

            })

        }
        return animationnodes;
    };

    function _splitInOut ( str, totype ) {

        var re = str.split(",");
        totype = typeof totype == "function" ? totype : function(i) {return i}; //默认无处理
        var IN = re[0] = totype(re[0]);
//        re[0] = totype(re[0]);
        re.length === 1 && (re[1] = IN);
        return re;

    }

    //function

    // 兼容transform格式
    var supportTransform = function () {
        var div = document.createElement("div");
        var divStyle = div.style;
        var prefixs = ["O","ms","Webkit","Moz"];
        var l = 4, _tmp, _support = "Transform";

        while (l--) {
            if ( (_tmp=prefixs[l]+_support) in divStyle ) {
                return _tmp;
            }
        }
        div = null;
        return _support;
    }();
    //解析属性值
    // "margin-top:20px; margin-bottom:100%" => {marginTop:{val : 20, unit : "px"}, marginBottom:{val : 100, unit : "%"}}
    var _attr_string2object = function () {
//var t1 = +new Date;
        var rValue = /([\d\.\-]+)(px|%|deg)?/;
        var rTranValue = /([\w]+)\(([\d\.\-]+)(px|%|deg)?\)/;
        var rSpace = /\s/g;
        var rStyleToJS = /\-(\w)/gi;

        return function (attrs) {
            var _re = {};
            var _attri;
            var _prop;
            var _value;
            // console.log(attrs)

            each( attrs.replace(rSpace, "").split(";"), function (item, index) {

                // console.log(item);
                _attri = item.split(":");
                _prop = _attri[0];
                _value = _attri[1];

                if ( _prop === "transform" ) {
                    if ( _value = rTranValue.exec(_value) ) {
                        _re[supportTransform] = {type : _value[1]+"(", val : parseFloat(_value[2]), unit : (_value[3]||"")+")"};
                    }
                    // _re2[_prop] = [_value.slice(0,sp1), _value.slice(sp1+1,sp1)]
                } else {
                    if ( _value = rValue.exec(_value) ) {
                        _re[_prop.replace(rStyleToJS, function (a,b) {return b.toUpperCase()})] = {type : "", val : parseFloat(_value[1]), unit : _value[2]||"px"};
                    }
                }

            });

            return _re
        }
    } ();

    //包装TWEEN
    // node, delay, easing, offset, rate
    function _TweenNode ( options ) {
        interface(this, options, {
            tween : new TWEEN.Tween({})
        })
        /*this.node = node;
        this.duration = duration;
        this.tween = new TWEEN.Tween({}).easing( TWEEN.Easing.Quadratic.Out );*/
    }
    extend(_TweenNode.prototype, {
        to : function ( start, stop ) {
            var self  = this;
            var rate  = stop ? self.rate[1] : self.rate[0];
            var easing= stop ? self.easing[1] : self.easing[0];

            self.tween
                    .init(function () {
                        var startPosition = _getPosition.call(self, start, rate)
                        //初始化界面
                        _render.call(self, startPosition);
                        //初始化TWEEN的初始值
                        extend(this, startPosition)
                    })
                    .easing( TWEEN.Easing[easing].InOut )
                    .delay(stop ? self.delay[1] : self.delay[0])
                    .to(_getPosition.call(self, stop, rate), cm_duration)
                    .onUpdate(function () {

//                        console.log(this)
                        _render.call(self, this)

                    })
                    .start();
        }
    });

    function _getPosition ( axle, rate ) {
        var self = this;
        var positions = {};
        each( self.offset, function (param, name) {
            // console.log(param)
            if ( param.val !== undefined ) {
                positions[name] = axle*rate+param.val; //主轴基数*比率+偏移量
                /*if ( name === "transform" ) {

                    positions[name] = axle*rate+param.val; // transform 偏移量存在组数中的第三个

                } else positions[name] = axle*rate+param[1]; //主轴基数*比率+偏移量*/
            }
        });
        // console.log(positions)
        return positions;
    }

    function _render ( points ) {
        var node = this.node;
        var offset = this.offset;
        // var type = offset[name].type;
        // var unit = offset[name].unit;
        // var _value
        // console.log(points)
        each( points, function (val, name) {
// console.log(val)
            setCss(node, name, offset[name].type+val+offset[name].unit); // value+unit

        });
    }
    function _scroller ( module ) {
        // console.log(module)
        // if ( "onscroll" in module.banner ) {
        onEvt(module.banner, "MouseWheel", function (e) {
            stopDefault(e);
            if ( module.enable ) {
                // direction -> "up" false | "down" true
                (-e.wheelDelta || e.detail) > 0 ? module.nex() : module.pre();
            }
            // console.log(module)
        });
    }

    onee.layerscroller = function (id, options) {

        (options = options || {}).onStart = function (index) {
            var scrollin = animateNode[index];
            var scrollout = animateNode[this.currentScene];

            var inStart = this._staticSize_, inStop = 0, outStart = 0, outStop = this._staticSize_;
            /*if ( index > this.currentScene ) {
                inStart = this._staticSize_;
                outStop = -this._staticSize_;
            } else {
                inStart = -this._staticSize_;
                outStop = this._staticSize_;
            }*/


//            console.log("inStart:"+inStart)
//            console.log("outStop:"+inStart)

            each(scrollin, function ( item, k ) {
                item.to(inStart, inStop);
            });

            each(scrollout, function ( item, k ) {
                item.to(outStart, outStop);
            });

        }
        var scroller = onee.scrollitem(id, options);
        //var scenesScrollSize = scroller.scenesScrollSize;
        var animateNode = _findAnimationNode(scroller);
        // console.log(animateNode)
        options.enableWheel && _scroller(scroller);

        return scroller;

    }

}, ["onee.scroller"]);