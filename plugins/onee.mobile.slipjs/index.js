/**
 * design by J.DO
 * create 14-1-18
 * more ? http://jdoi.net/
 * slide banner of img on moblie & pad
 */
;!function (global, undefined) {

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

    // is exist
    if ( onee.mslider ) return;

    var moduleName = "mslider";
    // new a onee's log
    var log = onee.log( moduleName );
    var interface = onee.Util.interface;
    var GG = onee.dom.find;
    var setCSS = onee.dom.css;
    var append = onee.dom.append;
    var delClass = onee.dom.delClass;
    var setClass = onee.dom.setClass;

    var extend = _.extend;
    var each   = _.each;

    function _slider ( selector, options ) {

        if ( !(this.dom = GG(selector)[0]) ) return log("Can't find the dom through "+selector);
        interface( this, options, {

            // son item
            frames : GG(">*", this.dom),
            width : this.dom.parentNode.clientWidth,
            time : 400,
            dots : [],
            current : 0

        });

        // initialize ui
        _prepareForUI(this);
        // initialize event
        _prepareForEvt(this);
//console.log('d')
    }
    extend(_slider.prototype, {
        to : function ( index ) {
            if ( index >= 0 && index < this.frames.length ) {
                setCSS(this.dom, {
                    "webkitTransitionDuration" : this.time+"ms",
                    "webkitTransform" : 'translate3d(-'+(this.width*index)+'px, 0px, 0px)'
                });
                this.current = index;
            }
        }
    })

    function _prepareForEvt ( that ) {

        var startpos,
            starttime,
            touchstartpos,
            currentpos = 0,
            speed = .4,
            framesLen = that.frames.length,
            max = that.width*(framesLen-1);

//console.log(max)
        /*function _setPosi (x) {
            that.dom.style['webkitTransform'] = 'translate3d('+x+'px, 0px, 0px)';
        }*/

        that.dom.addEventListener("touchstart", function (evt) {

            var e = evt.touches[0];
            touchstartpos = startpos = e.pageX;
            starttime = +new Date;
            //console.log(e)
//            _start_y = e.pageY;

        }, !!1);
        that.dom.addEventListener("touchmove", function (evt) {

            var e = evt.touches[0];
            evt.preventDefault();
//console.log(currentpos)
            currentpos += (e.pageX - startpos)/(currentpos > 0 || currentpos < -max ? 3 : 1);
            startpos = e.pageX;
//console.log(currentpos)
            setCSS(that.dom, {
                "webkitTransform" : 'translate3d('+currentpos+'px, 0px, 0px)'
            });
//            _setPosi(currentpos);

        }, !!1);
        that.dom.addEventListener("touchend", function (evt) {

            // 时间间隔
            ///var duration = +new Date + starttime;
            // 距离
            var distance = evt.changedTouches[0].pageX-touchstartpos;
            // 距离绝对值
            var absdistance = Math.abs(distance);
            // 方向
            var diration = distance/absdistance;
            // 滑动范围[0,lenght-1]
            var isInRange = diration > 0 ? that.current > 0 : that.current < framesLen-1;
            // 是否滚动过半
             var isHalf = absdistance >= Math.floor(that.width/2);
            // 手指滑动速度
            var ss = absdistance / (+new Date-starttime);

//            log(isHalf)
//            console.log(distance)
            that.to(function(){
                var index = that.current - ((speed < ss || isHalf) && isInRange ? diration : 0);
                currentpos = -index * that.width;
                return index
            }());
            //console.log(currentpos)

        }, !!1);
        that.dom.addEventListener("webkitTransitionEnd", function (evt) {

            evt.stopPropagation();
            setCSS(that.dom, {"webkitTransitionDuration" : '0'});
            // change navigator style
            setClass(delClass(that.dots, "curr")[that.current], "curr");

        }, !!1);

        that.dom.addEventListener("resize", function (evt) {
            //that.width = that.dom.parentNode.clientWidth;
            setCSS(that.dom, {"webkitTransform" : 'translate3d(-'+((that.width = that.dom.parentNode.clientWidth)*that.current)+'px, 0px, 0px)'});
            //that.to(that.current)
        })

    }

    // initialize ui
    function _prepareForUI ( that ) {

        var itemsLeng = that.frames.length;
        var dotsHolderClassName = moduleName + '-dots';
        setCSS(that.dom, {
            overflow : "hidden",
            zoom : "1",
            position : "relative",
            width : 100*itemsLeng+'%'
        });
        setCSS(that.frames, {
            float : "left",
            width: Math.floor((100/itemsLeng)*100)/100+"%"
        });

        // create navigator
        var dotstmpl = '<p class="'+ dotsHolderClassName +'">';
        var insetNode = that.dom.parentNode;

        for ( var i = 0; i < itemsLeng; i++ ) {
            dotstmpl += '<a>'+ (i+1) +'</a>'
        }
        dotstmpl += '</p>';

        // insert navigator node
        append(insetNode, dotstmpl);
        // collection dots node
        setClass((that.dots = GG("."+dotsHolderClassName+" a", insetNode))[that.current], "curr");
    }

    onee.mslider = function ( selector, options ) {
        return new _slider(  selector, options  )
    }

}(this);