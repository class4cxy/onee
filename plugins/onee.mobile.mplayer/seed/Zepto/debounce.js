/**
 * Debounces a function by the given threshold.
 * 高频执行事件(方法)的防抖
 * @method debounce(fn, wait, [ immediate || true ])
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`true`)
 * @example
 *
 * window.onresize = debounce(resize, 200);
 * function resize(e) {
 *  console.log('height', window.innerHeight);
 *  console.log('width', window.innerWidth);
 * }
 *
 */
;(function($){
    $.debounce = function (func, threshold, execAsap){
        var timeout;
        if (false !== execAsap) execAsap = true;

        return function debounced(){
            var obj = this, args = arguments;

            function delayed () {
                if (!execAsap) {
                    func.apply(obj, args);
                }
                timeout = null;
            }

            if (timeout) {
                clearTimeout(timeout);
            } else if (execAsap) {
                func.apply(obj, args);
            }

            timeout = setTimeout(delayed, threshold || 100);
        };
    }
})(Zepto);
