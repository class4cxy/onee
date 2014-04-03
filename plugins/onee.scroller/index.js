/**
 * design by J.DO
 * create 13-12-8
 * more ? http://jdoi.net/
 * a banner animation for each son element
 *
 */
onee.define(function () {

    'use stick';
    // is exist
    if ( onee.scroller ) return;

    var typeOfDiration = {

        x : ["scrollLeft", "clientWidth", "width", "left"],
        y : ["scrollTop", "clientHeight", "height", "top"]

    }

    function _empty_ () {}

    // new a onee's log
    var log = onee.log("bannerAnimation");
    var GG = onee.dom.find;
    var interface = onee.interface;
    var setCss = onee.dom.css;
    var append = onee.dom.append;
    var onEvt = onee.dom.on;
    var getAttr = onee.dom.getAttr;
    var addClass = onee.dom.addClass;
    var delClsss = onee.dom.delClass

    var extend = _.extend;
    var each = _.each;
    var isFunction = _.isFunction;

    // listenning onresize
    var _autoUpdateSize = function () {

        var AutoList = [];
        onee.dom.on(window, "resize", function () {

            each( AutoList, function ( module, k ) {

                module._staticSize_ = module.banner[module._fields_[1]];

            })

        });

        return function ( module ) {

            AutoList[AutoList.length] = module;

        }

    } ();

    // auto play handle
    var _autoPlay = function () {

        var AutoList = [];

        return {
            run : function () {

                var len = AutoList.length;
                if ( len ) {

                    while ( len -- ) {AutoList[len]()}

                }
            },
            add : function ( factory ) {
                if ( isFunction(factory) ) AutoList[AutoList.length] = factory;
            }
        }

    }();

    // enable requestAnimationFrame
    !function _auto_ () {

        requestAnimationFrame( _auto_ );
        TWEEN.update();
        _autoPlay.run()

    }();


    function _scroller ( id, options ) {

        //检查初始化节点存在性
        if ( !(this.banner = GG(id)[0]) ) return log("unknow element with id "+id);

        //检查是否存在场景节点
        if ( (this.scenes = GG("[animation-elem=scene]", this.banner)).length < 1 ) return;

        if ( !(this.wrap = GG("[animation-elem=wrap]", this.banner)[0]) ) return log("you need an element to wrap up the scenes");

        // initialize options
        interface(
            this,
            options || {},
            {
                // 启动标志
                enable : !!1,
                // 当前场景索引
                currentScene : 0,
                // 场景节点数量
                scenesNumber : this.scenes.length,
                // 场景当前滚动值
                scenesScrollSize : [],
                // 场景节点活动时回调
                onSceneActive : [],
                // on start scroll
                onStart : function () {},
                // 当前zindex
                currentZindex : 10000,
                // Tween组件句柄
                tweenHandle : new TWEEN.Tween( {} ).easing( TWEEN.Easing.Quadratic.Out ),

                scrollDiration : "x", //方向
                enableNavigator : !!1, //启动导航控件
                autoPlay : !!0, //自动播放
                playDuration : 500, //运动时间
                autoPlayDuration : 5e3 //播放间隔
            }
        );

        this._fields_ = typeOfDiration[this.scrollDiration.toLowerCase()];
        this._staticSize_ = this.banner[this._fields_[1]];
        var field2 = this._fields_[2];

        // check the way of size which define by style,
        // if '%' will enable auto updata size,
        // if 'px' will not enable
        // console.log(setCss( this.banner, this._fields_[2]))
        setCss( this.banner, field2).indexOf("%") >= 0 && _autoUpdateSize(this);

        // initialize UI
        setCss(this.wrap, field2, "200%");
        setCss(this.scenes, field2, "50%");
        this.banner[this._fields_[0]] = 0;
        setCss(this.scenes[this.currentScene], "zIndex", ++this.currentZindex);
        // intialize navigator
        this.dots = this.enableNavigator ? _initNaviCtrl(this) : [];
        addClass(this.dots[this.currentScene], "active");
        // 启动自动播放
        var self = this;
        var _lastPlayTime = Date.now();
        var _currTime = 0;
        if ( this.autoPlay ) _autoPlay.add(function () {
            // not support ie6
            if ( (_currTime=Date.now())-_lastPlayTime > self.autoPlayDuration ) {
                self.nex();
                _lastPlayTime = _currTime;
            }

        })

    }

    extend(_scroller.prototype, {

        to : function ( index, _callback_ ) {

            // prepare for UI
            if ( (index=parseInt(index)) < 0 || index > this.scenesNumber-1 || index === this.currentScene || !this.enable ) return;

            // 滑动到-
            var scrollValue = 0;
            // 入场校正输出值
            var inAdjustValue = 0;
            // 出场校正输出值
            var outAdjustValue = 0;

            if ( index > this.currentScene ) {
                _prepareForUI(this, index, !!1);
                scrollValue = this._staticSize_;
            } else {
                _prepareForUI(this, index);
            }

            var self = this;
            var $banner = this.banner;
            var scrollType = this._fields_[0];
            // 入场回调
            var onInActive = this.onSceneActive[index] || _empty_;
            //出场回调
            var onOutActive = this.onSceneActive[this.currentScene] || _empty_;
            this.tweenHandle
                .init(function () {

                    inAdjustValue = self._staticSize_ - ( outAdjustValue = this.s = index > self.currentScene ? 0 : self._staticSize_ );

                })
                .onStart(function () {
                    self.enable = !!0;
                    // inStart inStop outStart outStop
                    self.onStart.call(self, index);
                })
                .to({s : scrollValue}, this.playDuration)
                .onUpdate(function () {
                    //$banner[scrollType] = this.s
                    onInActive(self.scenesScrollSize[index] = inAdjustValue - ($banner[scrollType] = this.s));
                    onOutActive(self.scenesScrollSize[self.currentScene] = outAdjustValue-this.s);

                })
                .start()
                .onComplete(function () {
                    self.enable = !!1
                    addClass(delClsss(self.dots, "active")[self.currentScene = index], "active");
                    //self.currentScene = index;
                    _callback_ && _callback_()
                });

        },

        nex : function () {
            this.to(this.currentScene >= this.scenesNumber-1 ? 0 : this.currentScene+1)
        },

        pre : function () {
            this.to(this.currentScene <= 0 ? this.scenesNumber-1 : this.currentScene-1)
        }

    });

    // prepare for UI when on scorll
    // module:object of animation
    // index:to which scene
    // isPre:diration of scroll [pre - right|bottom] [nex - left|top]
    function _prepareForUI ( module, index, isPre ) {

        var scrollType = module._fields_[0];
        var scrollValue = module.banner[scrollType];
        var zIndex = ++module.currentZindex;
        var position = module._fields_[3];
        var cssObj = {"zIndex" : zIndex};

        if ( scrollValue && isPre ) {

            // set scrollType to 0 if it had value
            // set current scene to left=0
            module.banner[scrollType] = 0;
            cssObj[position] = "0";
            setCss(module.scenes[module.currentScene], cssObj);

        } else if ( !scrollValue && !isPre ) {

            // set scrollType to 50% if it had not value
            // set current scene to left=0
            module.banner[scrollType] = module._staticSize_;
            cssObj[position] = "50%";
            setCss(module.scenes[module.currentScene], cssObj);

        }
        cssObj[position] = isPre ? "50%" : "0";
        setCss(module.scenes[index], cssObj);
    }

    // 公用的导航控件初始化
    function _initNaviCtrl ( module ) {
        var dotstmpl = '<p class="bannerAnimation-dots">';
        var diratmpl = '<p class="bannerAniamtion-dira"><a href="javascript:;" rel="pre">上一张</a><a href="javascript:;" rel="nex">下一张</a></p>'
        var dots;
        var insetNode = module.banner.parentNode;
        var len = module.scenes.length, i = 0;
        for ( ; i < len; i++ ) {
            dotstmpl += '<a href="javascript:;" rel="'+ i +'">'+ (i+1) +'</a>'
        }
        dotstmpl += '</p>';

        // create diration navigator
        onEvt(append(insetNode, diratmpl), "click", function () {

            var _dira_ = getAttr(this, "rel");
            module[_dira_]();

        }, "a");
        // append to parentnode
        // addeventlistener to dots
        // find the dots and return them
        return dots = GG("a", onEvt(append(insetNode, dotstmpl), "click", function () {

            var index = getAttr(this, "rel");
            module.to(index, function () {
                delClsss(dots, "active");
                addClass(dots[index], "active");
            });

        }, "a")[0]);
    }


    onee.scroller = function (id, options) {

        return new _scroller(id, options);

    }

}, ["onee.dom", "Tween", "RequestAnimationFrame"]);