(function(){
    var showClass = 'js-show';
    // why event without namespace? Zepto do not support trigger custom event with namespace like foo.bar .
    var showEvent = 'show:dialog';
    var shownEvent = 'shown:dialog';
    var hideEvent = 'hide:dialog';
    var hiddenEvent = 'hidden:dialog';

    var tapEvent = 'tap';
    // Why not use tap event? We know click event has a 300+ delay, on iOS 5- this will trigger click event on backdrop.
    /*if($.os.ios < 5){
        tapEvent = "click";
    }*/

    var tapDialogEventName = tapEvent + '.dialog';

    function Dialog($element, options) {
        this.$element  = $element;
        this.options   = options;
       
        this.role = this.$element.attr("role");

        this.$backdrop = null;
        this.isShown   = false;

        this.originTop = this.$element.css("top");
        this.originBottom = this.$element.css("bottom");

        // $('[data-spinner]', this.$element).spinner('show');     //初始化dialog里面的loading
    }

    Dialog.DEFAULTS = {
        backdrop: true,     // 值为static表示点击遮罩不隐藏
        show: true,
        expires: 0,
        title: "提示",
        enterText: "确定",
        cancelText: "取消"
    };

    Dialog.prototype.toggle = function (_relatedTarget) {
        this[!this.isShown ? 'show' : 'hide'](_relatedTarget);
    };

    Dialog.prototype.render = function () {
        this.options.content && $('.content', this.$element).html(this.options.content);

        if(this.role == "alert"){
            $('.title', this.$element).text(this.options.title || Dialog.DEFAULTS.title);
            $('[cmd="enter"]', this.$element).text(this.options.enterText || Dialog.DEFAULTS.enterText);
            $('[cmd="cancel"]', this.$element).text(this.options.cancelText || Dialog.DEFAULTS.cancelText);
        }

        if(this.options.success){
            this.$element.addClass("js-success");
        }else{
            this.$element.removeClass("js-success");
        }

        if(this.options.hideCancel){
            this.$element.addClass("hide-cancel");
        }else{
            this.$element.removeClass("hide-cancel");
        }
    };

    Dialog.prototype.show = function (_relatedTarget) {
        var that = this;

        var e    = $.Event(showEvent, { relatedTarget: _relatedTarget });

        this.$element.trigger(e);

        if (this.isShown || e.isDefaultPrevented()) return;

        this.isShown = true;

        this.render();

        // killing the scroll on body
        if(this.role != "notify" || $.isPoorDevice){
            $(document).on('touchmove.dialog', function(e){
                e.preventDefault();
            });
        }

        this.backdrop(function () {
            // if (!that.$element.parent().length) {
            //     that.$element.appendTo(document.body); // don't move dialogs dom position
            // }

            if($.isPoorDevice && !that.options.pdnf){
                var top = that.originTop;
                if(top.indexOf("%") != -1){
                    that.$element.css("top", window.innerHeight*parseInt(top)/100 + document.body.scrollTop);
                }else{
                    top = parseInt(top);
                    if(!isNaN(top)){
                        that.$element.css("top", top + document.body.scrollTop);
                    }
                }

                var bottom = that.originBottom;
                if(bottom.indexOf("%") != -1){
                    that.$element.css("bottom", window.innerHeight*parseInt(bottom)/100 - document.body.scrollTop);
                }else{
                    bottom = parseInt(bottom);
                    if(!isNaN(bottom)){
                        that.$element.css("bottom", bottom - document.body.scrollTop);
                    }
                }
            }

            if ($.support.transition && that.options.effect) {
                that.$element.show();
                that.$element.addClass('js-effect-' + that.options.effect);
                that.$element[0].offsetWidth; // force reflow
            }

            that.$element
                .addClass(showClass)
                .attr('aria-hidden', false)
                .on( tapDialogEventName, '[cmd]', function(e){
                    var $target = $(e.currentTarget);

                    if($target.data("dismiss")) that.hide();

                    var cmd = $target.attr("cmd");
                    typeof that.options[cmd] == "function" && that.options[cmd]();
                });

            var e = $.Event(shownEvent, { relatedTarget: _relatedTarget });

            that.$element.trigger(e);
        })

        // auto expires
        if(Number(that.options.expires) > 0){
            setTimeout($.proxy(that.hide, that), that.options.expires);
        }
    };

    Dialog.prototype.hide = function (_relatedTarget) {
        var that = this;

        if(that.options.noDismiss){
            return;
        }

        var e = $.Event(hideEvent, { relatedTarget: _relatedTarget });

        this.$element.trigger(e);

        if (!this.isShown || e.isDefaultPrevented()) return;

        this.isShown = false;

        $(document).off('touchmove.dialog');

        this.$element
            .removeClass(showClass)
            .attr('aria-hidden', true)
            .off(tapDialogEventName);

        if ($.support.transition && this.options.effect) {
            this.$element[0].offsetWidth; // force reflow
        }

        $.support.transition && (this.options.effect) ?
                this.$element
                    .one($.support.transition.end, function(){
                        if(!that.$element.hasClass(showClass)){
                            that.$element.removeClass('js-effect-' + that.options.effect).hide();
                        }
                    }).emulateTransitionEnd(300) : this.$element.removeClass('js-effect-' + that.options.effect).hide();

        this.backdrop(function () {
            that.$backdrop && that.$backdrop.remove();
            that.$backdrop = null;

            var e = $.Event(hiddenEvent, { relatedTarget: _relatedTarget });
            that.$element.trigger(e);
        })
    };

    Dialog.prototype.backdrop = function (callback) {
        var that = this;

        if (this.isShown && this.options.backdrop) {
            this.$backdrop = $('<div class="js-backdrop" />')
                .appendTo(this.$element.parent());

            this.$backdrop.on(tapEvent, function (e) {
                that.options.backdrop == 'static'
                    ? that.$element.focus()
                    : that.hide()
            });

            // if ($.support.transition) this.$backdrop[0].offsetWidth; // force reflow

            this.$backdrop.show();
        } else if (!this.isShown && this.$backdrop) {
            this.$backdrop.hide();
        }

        callback && callback();
    };

    $.Dialog = Dialog;

    $.fn.dialog = function (option, _relatedTarget) {
        return this.each(function () {
            var $this   = $(this);
            var data    = $this.data('dialog');

            option.success = option.success || false;
            if (!data) {
                var options = $.extend({}, Dialog.DEFAULTS, $this.data(), typeof option == 'object' && option);
                data = new Dialog($this, options);
                $this.data('dialog', data);
            }else{
                typeof option == 'object' && $.extend(data.options, option);
            }

            if (typeof option == 'string') {
                data[option](_relatedTarget);
            }else if (option.show) {
                data.show(_relatedTarget);
            }
        })
    }

    $(document).on(tapEvent + '.dialog.data-api', '[data-toggle="dialog"]', function (e) {

        var $this   = $(this);
        var $target = $($this.attr('data-target'));
        var option  = $target.data('dialog') ? 'toggle' : $this.data();

        if ($this.is('a')) e.preventDefault();
        $target.dialog(option, this);
    })

}());
