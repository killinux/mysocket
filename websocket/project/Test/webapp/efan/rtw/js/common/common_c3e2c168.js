(function(window) {
    /* 一些公用变量设置 */
    var PAGE_SIZE = 30;
    var HOST_API = '';
//    var HOST_API = 'http://192.168.136.241';
    // 维护的按键映射表
    var key_map = {
        'normal' : {
            13 : 'OK',
            37 : 'LEFT',
            38 : 'UP',
            39 : 'RIGHT',
            40 : 'DOWN',
            93 : 'MENU'
        }
    };
    // 上报
    var reportToKernel = {
        move       : reportKeyMove,
        click      : reportOk,
        redirect   : reportRedirect,
        pageLoaded : reportPageLoaded
    };

    function _report(behavior) {
        if (window.JSUtil && JSUtil.reportUserBehavior) {
            JSUtil.reportUserBehavior(behavior);
        } else {
            console.log(behavior);
        }
    }

    // 页面跳转
    function reportRedirect($current) {
        var href = $current.attr('href');
        if (!href || (href == 'javascript:;')) { return; }
        var behavior = '';
        if (href.indexOf('fsp://') == 0) {
            if ($current.attr(settingsMap.item) == 'play') {
                // 播放按钮
                behavior = 'play=' + encodeURIComponent(href) + '&st=' + (+new Date);
            } else {
                // 点击分集
                behavior = 'episode=' + encodeURIComponent(href) + '&st=' + (+new Date);
            }
        } else {
            // 点击跳转页面
            behavior = 'url=' + encodeURIComponent(href) + '&st=' + (+new Date);
        }
        _report(behavior);
    }

    // 页面加载完成
    function reportPageLoaded() {
        var href = window.location.pathname + window.location.search;
        var behavior = 'url=' + encodeURIComponent(href) + '&ft=' + (+new Date);
        _report(behavior);
    }

    // 上报上下左右移动
    function reportKeyMove(eventType, keyMove, pos) {
        var behavior = 'ent=' + eventType + '&km=' + keyMove + '&pos=' + encodeURIComponent(pos) + '&nt=' + (+new Date);
        _report(behavior);
    }

    // 上报确认
    function reportOk(url) {
        var behavior = 'ent=keyup&km=OK&url=' + encodeURIComponent(url);
        _report(behavior);
    }

    function bindPageLoaded() {
        $(window).on('load', function() {
            OTT.reportToKernel.pageLoaded();
        });
    }

    //================================== 按键适配 - start ==================================
    /* 按键适配 Android调用 */
    function jsKeyEventInject(type, keyCode) {
        if (!OTT.mapKeyCode(keyCode)) {
            return false;
        }
        var evt = document.createEvent('KeyboardEvent');
        Object.defineProperty(evt, 'keyCode', { get : function() {
            return this.keyCodeHack;
        }});
        Object.defineProperty(evt, 'which', { get : function() {
            return this.keyCodeHack;
        }});
        Object.defineProperty(evt, 'metaKey', { get : function() {
            return false;
        }});
        Object.defineProperty(evt, 'shiftKey', { get : function() {
            return false;
        }});
        if (evt.initKeyboardEvent) {
            evt.initKeyboardEvent(type, true, true, document.defaultView, false, false, false, false, keyCode, keyCode);
        } else {
            evt.initKeyEvent(type, true, true, document.defaultView, false, false, false, false, keyCode, 0);
        }
        evt.keyCodeHack = keyCode;
        if (evt.keyCode !== keyCode) {
            console.log("keyCode mismatch " + evt.keyCode + "(" + evt.which + ")");
        }
        var stTime__ = new Date();
        var $current = $(document.activeElement);
        OTT.log("get $(document.activeElement) use " + (new Date() - stTime__) + "ms");
        var toDispa = document;
        if ($current[0].nodeName != 'BODY') {
            toDispa = $current[0];
            //FIXME can toDispa can dispatch?
        }
        OTT.log("toDispa " + toDispa);
        toDispa.dispatchEvent(evt);
        OTT.log("dispatched " + toDispa);
    }

    // 按键处理
    var _fjs_use_default_enter_key_function = true;
    // 确定键打开链接
    function redirectLink() {
        $(document).on('keyup click', '[' + settingsMap.item + ']', function(e) {
            // APAD检测
            if (window.JSUtil && (e.type == 'click')) {
                showCheckingTips('pad');
                return false;
            }
            if (_fjs_use_default_enter_key_function) {
                if (e.keyCode == 13) {
                    var $current = $(document.activeElement);
                    if ($current.length && ($current[0].nodeName == 'A')) {
                        var href = $current.attr('href');
                        if (href) {
                            OTT.reportToKernel.click(href);
                            // 如果定义了跳转前的处理逻辑，则使用~
                            if (!OTT.okHandler || !OTT.okHandler()) {
                                OTT.showOkLoading && $('#tip_loading').show();
                                // 页面跳转
                                if (window.location.href.indexOf("live_epl_schedule") == -1 && href != 'javascript:;') {
                                    OTT.reportToKernel.redirect($current);
                                    location.href = href;
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    // 阻止keyup事件，如有需要可以在页面重写
    function blockKeyup() {
        OTT.log('SETTING blocked keyup event by Javascript ');
        $(document).on('keyup', function(ev) {
            if (OTT.mapKeyCode(ev.keyCode) != 'OK') {
                OTT.log('blocked keyup event by Javascript. Current keycode is ' + ev.keyCode);
                return false;
            }
        });
        // block掉keydown触发的行为
        $(document).on('keydown', function(ev) {
            if (OTT.mapKeyCode(ev.keyCode) == 'OK') {
                return false;
            }
        });
    }

    //================================== 按键适配 - end ==================================
    // 缓存页面DOM元素
    var cacheDOM = {};
    // 映射keyCode对应的动作
    function mapKeyCode(keyCode, manufacture) {
        manufacture = manufacture || 'normal';
        return key_map[manufacture][keyCode];
    }

    // 按键范围
    function restrictKey(keyCode, restrictArr, replace) {
        var defaultArr = ['LEFT', 'RIGHT', 'UP', 'DOWN'];
        if (restrictArr) {
            if (replace) {
                defaultArr = restrictArr;
            } else {
                defaultArr = defaultArr.concat(restrictArr);
            }
        }
        if ($.inArray(mapKeyCode(keyCode), defaultArr) !== -1) {
            return true;
        }
        return false;
    }

    /* 检测是否支持event事件 */
    function hasEvent(event) {
        return (('on' + event) in document);
    }

    /**
     * join数组中，对象属性为key的所有值
     * @param arr
     * @param key
     * @param sep
     * @returns {string}
     */
    function keyJoin(arr, key, sep) {
        var newArr = [];
        for (var i = 0; i < arr.length; i++) {
            newArr.push(arr[i][key]);
        }
        return newArr.join(sep);
    }

    // 按时间分组，按优先级排序
    function groupSort(list, options) {
        var settings = { group : 'start_time', sort : 'priority' };
        settings = $.extend(settings, options);
        var group = settings.group, sort = settings.sort;
        // 先按开始时间排序
        list.sort(function(a, b) {
            var ga = a[group], gb = b[group];
            return ga - gb;
        });
        var i = 0, total = list.length, tc, tn, array = [], count = 0;
        // 按开始时间分组
        for (; i < total; i++) {
            tc = list[i];
            tn = list[i + 1];
            array[count] = array[count] || [];
            array[count].push(tc);
            if (!tn || (tc[group] != tn[group])) {
                count++;
            }
        }
        // 分组按优先级排序
        var tmp = [], arr = [];
        for (var j = 0; j < array.length; j++) {
            arr = array[j];
            arr.sort(function(a, b) {
                var sa = a[sort], sb = b[sort];
                return sb - sa;
            });
            tmp = tmp.concat(arr);
        }
        return tmp;
    }

    /**
     * 简单的模板，用于循环输出数据
     * 需要在页面添加textarea，里面添加模板内容
     * 设置其为隐藏和disabled，防止低版本monkey测试，程序崩溃
     * */
    function template(data, tpl, des) {
        var $tpl = $(tpl), val = $tpl.length && $.isArray(data) && $tpl.val() || '';
        if ($.isArray(data) && !val) {
            return;
        }
        if ($.isArray(data)) {
            //获取模版的内容，如  "<table><!-- <p>{id}</p><span>{name}</span> --></table>"
            var tplArr = val.match(/<!--([\s\S]+)-->/), strTpl = tplArr[1], resArr = [], html = '';
            //例如：tplArr[0]="<!-- <p>{id}</p><span>{name}</span> -->"; tplArr[1]="<p>{id}</p><span>{name}</span>"
            //存储数组showArray里每个元素经过模版替换后的数组，如eachArr[0]='<p>123</p><span>aaa</span>'; eachArr[1]='<p>456</p><span>bbb</span>'
            $.each(data, function(i, e) {
                resArr.push(strTpl.replace(/###(\w+)###/g, function(g, f) {
                    return e[f] !== undefined ? e[f] : g;
                }));
            });
            html = resArr.join('');
            //替换到填充的位置上
            $(des) && $(des).html(html);
        } else {
            for (var k in data) {
                var $items = $tpl.find('[data-tpl-key="' + k + '"]'), val = data[k];
                if (!$items.length) {
                    continue;
                }
                $items.each(function() {
                    var $this = $(this);
                    switch ($this[0].nodeName) {
                        case 'INPUT':
                            var type = $this.attr('type');
                            if (type == 'checkbox') {
                                $this.prop('checked', val);
                            } else if (type == 'radio') {
                                break;
                            } else {
                                $this.val(val);
                            }
                            break;
                        case 'TEXTAREA':
                        case 'SELECT':
                            $this.val(val);
                            break;
                        case 'IMG':
                        case 'IFRAME':
                            $this.attr('src', val);
                            break;
                        default :
                            $this.html(val);
                            break;
                    }
                });
            }
        }
        return html;
    }

    /**
     * 获取用户的数据信息
     * */

    function getUserInfo() {
        var uinfo = JSON.parse(OTT.storage.getItem("account_info") || '{"account_id":"0","account_name":"","sso_token":""}');
        return uinfo;
    }

    /**
     * 获取URL中特定参数
     * @name 要获取的参数
     *
     * */
    function getParam(name) {
        var r = new RegExp('[?&]' + name + '=([^&]*)'), s = window.location.search, m = s.match(r) || [], v = m[1];
        if (typeof v === 'undefined') {
            return '';
        }
        try {
            v = decodeURIComponent(v);
        } catch (e) {
        }
        return v;
    }

    /* show android toast or js alert */
    function showTip(tip) {
        if (typeof tip === 'string' && !tip) {
            return;
        }
        if (window.JSUtil && JSUtil.jsToast) {
            JSUtil.jsToast(tip);
        } else {
            alert(tip)
        }
    }

    /**
     * 时间格式化函数
     * @param date 时间对象
     * @param format 想要的格式，如：yyyy-MM-dd hh:mm:ss
     * @returns {*}
     */
    function dateFormat(date, format) {
        if (!date) { return; }
        var map = {
            'M+' : date.getMonth() + 1, //month
            'd+' : date.getDate(),      //day
            'w+' : date.getDay(),       //week
            'h+' : date.getHours(),     //hour
            'm+' : date.getMinutes(),   //minute
            's+' : date.getSeconds(),   //second
            'q+' : Math.floor((date.getMonth() + 3) / 3),  //quarter
            'S'  : date.getMilliseconds() //millisecond
        };
        var week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        // 年
        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
        // 星期
        if (/(w+)/.test(format)) {
            format = format.replace(RegExp.$1, week[map['w+']]);
        }
        for (var k in map) {
            if (new RegExp('(' + k + ')').test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? map[k] : ('00' + map[k]).substr(('' + map[k]).length));
            }
        }
        return format;
    }

    /* AJAX封装 */
    function sendRequest(url, params, options) {
        var settings = {
            timeout     : 10000,
            dataType    : 'json',
            showLoading : true,
            // 默认超时处理
            fail        : function(xhr, status, err) {
                if (status == 'timeout') {
                    showTip('请求超时，请检查网络情况后重试！');
                }
            }
        };
        // 兼容sendRequest(url, function() {}, options)写法~
        if (typeof params == 'function') {
            options = options || {};
            options.done = params;
            params = {};
        }
        $.extend(settings, options);
        if (HOST_API && (url.indexOf(window.location.hostname) < 0)) {
            settings.dataType = 'jsonp';
        }
        // 设置离线参数
        if (window.location.pathname.indexOf('/rtw/') == 0) {
            params.offline = 1;
        }
        settings.showLoading && $('#tip_loading').show();
        var request = $.ajax({
            url      : url,
            data     : $.param(params),
            dataType : settings.dataType,
            timeout  : settings.timeout
        }).done(function(json) {
            settings.done && settings.done(json);
            OTT.hideLoading();
        }).fail(function(xhr, status, err) {
            settings.fail && settings.fail(xhr, status, err);
            OTT.hideLoading();
        });
        return request;
    }

    /* 调整滚动条宽度 */
    function updateWidth($list, item, width) {
        item = item || '[data-list-item]';
        $.each($list, function() {
            var $this = $(this);
            var $item = $this.find(item), length = $item.length;
            // 更新宽度，媒体页面
            width && $item.width(width);
            var offset = $item.outerWidth(true);
            $this.width(offset * length);
        });
    }

    // 兼容web和APP存储
    var storage = (function() {
        return window.JSUtil ? JSUtil : localStorage;
    })();
    // 获取选中元素
    function getCurrent($list) {
        $list = $list || $(document);
        if (!cacheDOM.current) {
            cacheDOM.current = $list.find('.' + settingsMap.current);
        }
        return cacheDOM.current;
    }

    // 获取url
    function getHref($current) {
        if (!$current || !$current.length) { return ''; }
        return ($current[0].nodeName == 'A') ? $current.attr('href') : $current.find('a').attr('href');
    }

    // 设置选中样式
    function setCurrent($current, $list, isMultiple) {
        // 是否页面中有多个选中元素
        isMultiple = isMultiple || false;
        var $prev = cacheDOM.current || $list.find('.' + settingsMap.current);
        if (!isMultiple && $prev) {
            $prev.removeClass(settingsMap.current);
        }
        // 清除上一个滚动
        if (cacheDOM.current) {
            cacheDOM.current.find('.invisible').hide();
            cacheDOM.current.find('.visible').show();
        }
        // 更新current元素
        cacheDOM.current = $current;
        $current.addClass(settingsMap.current);
        // 当前current文字滚动
        var $marquee = $current.find('.invisible'), limit = parseInt($marquee.attr('data-scroll-limit')) || 0;
        if ($marquee.length && limit && $marquee.text().length > limit) {
            $marquee.show();
            $marquee.parent().find('.visible').hide();
        }
    }

// 生成收藏图片路径
    /**
     * 生成图片路径
     * @param mediaid 媒体id
     * @param size 图片尺寸，200_100或者200_280
     * @param suffix poster or still，竖图或横图
     * @param timestamp 时间戳
     * @returns {string}
     */
    function genPicPath(mediaid, size, suffix, timestamp) {
        if (typeof mediaid === 'undefined' || !size) {
            return '';
        }
        var picArr = ['http://img.funshion.com/pictures/media/list'];
        // 设置目录结构
        var regexp = /\d{3}|\d+$/g;
        var pathArr = ('' + mediaid).match(regexp);
        if (pathArr.length) {
            picArr = picArr.concat(pathArr);
        }
        // 添加图片名及时间戳
        timestamp = timestamp ? ('?' + timestamp) : '';
        picArr.push(mediaid + '_' + size + '_ott_' + suffix + '.jpg' + timestamp);
        return picArr.join('/');
    }

    /**
     * 获取页面最大展示个数
     */
    function getMaxView($ele, container) {
        if (typeof $ele == 'string') {
            $ele = $($ele);
        }
        var $container = $(container);
        if (!$container.length) {
            $container = $(window);
        }
        var maxMap = {};
        // 最大可见列数
        maxMap.maxCol = Math.floor($container.width() / $ele.outerWidth(true));
        // 最大可见行数
        maxMap.maxRow = Math.floor($container.height() / $ele.outerHeight(true));
        // 如果是搜索栏目
        // TODO: 如果改成等宽可去掉
        var $list = $ele.parent(), $search = $list.find('[data-list-search]');
        if ($search.length) {
            // 最大可见列数
            maxMap.maxCol = Math.floor(($container.width() - $search.outerWidth(true)) / $ele.outerWidth(true));
        }
        return maxMap;
    }

    // 检测是否有悬浮层或者loading圈，用于阻止按键触发
    function hasOverlay() {
        // TODO: 添加对应的悬浮层判断逻辑
        return $('#tip_loading').is(':visible') || $('#spinner').is(':visible') || $('#download-tips').is(':visible');
    }

    // 显示页面loading
    function showLoading(type) {
        type = type || 'tip';
        if (type == 'tip') {
            $('#tip_loading').show();
        } else {
            $('#spinner').show();
        }
    }

    // 关闭客户端loading圈
    function hideLoading() {
        $('#tip_loading, #spinner').hide();
    }

    // 容器设置
    var settingsMap = {
        dw      : 'data-wrapper',
        tl      : 'data-t-list',
        // 水平滚动容器
        hl      : 'data-h-list',
        // 垂直滚动容器或tab
        vl      : 'data-v-list',
        // 视频
        item    : 'data-list-item',
        current : 'current',
        // 左侧导航类型
        vt      : 'data-v-type',
        // 左侧导航名称
        vn      : 'data-v-name',
        // 导航名称容器
        bt      : 'data-bar-title',
        // 滚动position为absolute的元素
        abs     : 'data-list-abs',
        // 当前位置%每行最大个数
        pos     : 'data-list-pos',
        // 当前位置索引
        idx     : 'data-list-idx'
    };
    /* 高亮选中 */
    function focus($list, index) {
        var settings = $.extend({}, settingsMap);
        // 不传参处理
        index = index || 0;
        $list = $list || $(document);
        var $current = $list.find('[' + settings.item + ']').eq(index);
        if (!$current.length) {
            $current = $list.find('[' + settings.item + ']').last();
        }
        // 需要聚焦的元素，a或者input
        var $active = (($current.attr(settings.item) != 1 && $current.attr(settings.item) != 0) ? $current : $current.find('a, input'));
        setCurrent($current, $list, false);
        $active.focus();
//    $browse.attr('data-list-index', index);
    }

    // 保存首页状态
    function saveState($abs, $list, idx) {
        var type = $list.attr(settingsMap.hl);
        // 保存移动状态
        try {
            JSUtil.setPageProperty(type + '_left', $abs.css('left'));
            JSUtil.setPageProperty(type + '_idx', idx);
            JSUtil.setPageProperty(type + '_pos', $list.attr(settingsMap.pos));
//        OTT.log(type + '_left: ' + $abs.css('left') + '***' + type + '_idx: ' + idx + '***' + type + '_pos: ' + $list.attr(settingsMap.pos), true);
        } catch (e) {
            console.log('error invoking JSUtil.setPageProperty~');
        }
    }

    /**
     * 列表左滚动
     * @param $list 容器
     * @param idx 当前选中元素索引
     */
    function moveLeft($list, idx) {
        var d1 = +new Date();
        var $current = getCurrent($list);
        var width = $current.outerWidth(true), maxCol = getMaxView($current).maxCol;
        var $abs = !$list.attr(settingsMap.abs) ? $list.find('[' + settingsMap.abs + ']') : $list;
        --idx;
        // 高亮框位置0~maxView-1
        var pos = (parseInt($list.attr(settingsMap.pos)) || 0);
        // 设置高亮框位置
        $list.attr(settingsMap.pos, (pos - 1) < 0 ? maxCol - 1 : pos - 1);
        jsLog('moveLeft params: ' + (+new Date() - d1));
        var d2 = +new Date();
        // 高亮位置不在最左边，则不需要移动
        if (pos == 0) {
            var left = 0;
            // 高亮位置在最最左边，则尝试向左移动maxView个位置
            if (idx - maxCol >= 0) {
                // 位置合法，则移动
                left = (parseInt($abs.css('left')) || 0) + width * maxCol;
                $list.attr(settingsMap.pos, maxCol - 1);
            } else {
                // 否则直接移动到首位
                $list.attr(settingsMap.pos, idx);
            }
            $abs.css('left', left);
        }
        jsLog('moveLeft move: ' + (+new Date() - d2));
        var d3 = +new Date();
        focus($list, idx);
        jsLog('moveLeft focus: ' + (+new Date() - d3));
        saveState($abs, $list, idx);
    }

    /**
     * 列表右滚动
     * @param $list 容器
     * @param idx 当前选中元素索引
     * @param callback 加载更多回调
     */
    function moveRight($list, idx, callback) {
        var d1 = +new Date();
        var $current = getCurrent($list);
        var width = $current.outerWidth(true), maxCol = getMaxView($current).maxCol;
        var $abs = !$list.attr(settingsMap.abs) ? $list.find('[' + settingsMap.abs + ']') : $list;
        var $items = $abs.children(), total = $items.length;
        // 加载更多
        callback && callback($list, idx, total);
        // 移动规则
        ++idx;
        // 高亮框位置0~maxView-1
        var pos = (parseInt($list.attr(settingsMap.pos)) || 0);
        // 设置高亮框位置
        $list.attr(settingsMap.pos, (pos + 1) % maxCol);
        jsLog('moveRight params: ' + (+new Date() - d1));
        var d2 = +new Date();
        // 高亮位置不在最右边，则不需要移动
        if (pos == maxCol - 1) {
            // 高亮位置在最右边，则尝试向右移动maxView个位置
            var left = 0, $search = $list.find('[data-list-search]'), isSearch = !!$search.length;
            if (total - idx >= maxCol) {
                // 位置合法，则移动
                left = (parseInt($abs.css('left')) || 0) - width * maxCol;
            } else {
                // 否则直接移动到末尾
                // TODO: 如果改成等宽可去掉
                if (isSearch) {
                    left = -width * (total - maxCol) + ($search.width() - width);
                } else {
                    left = -width * (total - maxCol);
                }
                // 设置高亮框位置
                $list.attr(settingsMap.pos, maxCol - 1);
            }
            $abs.css('left', left);
        }
        jsLog('moveRight move: ' + (+new Date() - d2));
        var d3 = +new Date();
        focus($list, idx);
        jsLog('moveRight focus: ' + (+new Date() - d3));
        saveState($abs, $list, idx);
    }

// 显示图片
//var lazyTimer = null;
    function lazyload($list) {
//    lazyTimer && clearTimeout(lazyTimer);
//    var $images = $list.find('[data-original]');
//    lazyTimer = setTimeout(function() {
//        $images.css('background-image', function(idx) {
//            return 'url(' + $images.eq(idx).attr('data-original') + ')';
//        });
//    }, 300);
    }

// 获取更多内容
    var resMap = { medias : [], start : 0, offset : 0, end : 0, page : 1, reachEnd : false, maxCol : 5, maxRow : 0, totalRow : 2, lineHeight : 0, list : 'list', tpl : 'list', cls : 'public-ui list-ordinary' };

    function updateList(idx, keyMove, callback) {
        var row = Math.floor(idx / resMap.maxCol) + 1, start = resMap.start, end = resMap.end, list = resMap.list, tpl = resMap.tpl, cls = resMap.cls, res = [];
        var maxTotal = resMap.maxCol * resMap.totalRow, maxViewTotal = resMap.maxCol * resMap.maxRow;
        callback && callback();
        switch (keyMove) {
            case 'UP':
            case 'LEFT':
                if (row <= resMap.maxRow) {
                    if (resMap.start > 0) {
                        start -= maxViewTotal;
                        end = start + maxTotal;
                        if (start < 0) {
                            start = 0;
                            end = start + maxTotal;
                        }
                        res = resMap.medias.slice(start, end);
                        resMap.start = start;
                        resMap.end = end;
                        var html = template(res, '#tpl_' + tpl);
                        $('#' + list).replaceWith('<ul class="' + cls + '" style="top: 0;" id="' + list + '">' + html + '</ul>');
                        lazyload($('#' + list));
                        resMap.offset = idx % resMap.maxCol + resMap.maxCol;
                        focus($('#' + list), resMap.offset);
                    } else {
                        focus($('#' + list), idx);
                    }
                }
                break;
            case 'DOWN':
            case 'RIGHT':
                if (row > resMap.maxRow) {
                    start += maxViewTotal;
                    end = start + maxTotal;
                    res = resMap.medias.slice(start, end);
                    if (res.length) {
                        resMap.start = start;
                        if (resMap.medias.length >= end) {
                            resMap.end = end;
                        } else {
                            resMap.end = resMap.medias.length;
                            resMap.reachEnd = true;
                        }
                        var html = template(res, '#tpl_' + tpl);
                        $('#' + list).replaceWith('<ul class="' + cls + '" style="top: 0;" id="' + list + '">' + html + '</ul>');
                        lazyload($('#' + list));
                        resMap.offset = idx % resMap.maxCol;
                        focus($('#' + list), resMap.offset);
                    } else {
                        resMap.reachEnd = true;
                    }
                } else {
                    focus($('#' + list), idx);
                }
                break;
            default :
                break;
        }
//    console.log(resMap)
    }

    /**
     * 选中行居中
     * @param idx
     * @param direction
     */
    function makeMiddle(idx, direction) {
        var $list = $('#' + resMap.list);
        var row = Math.floor(idx / resMap.maxCol) + 1;
        var top = Math.abs(parseInt($list.css('top')) || 0);
        if (direction == 'UP') {
            if (resMap.start >= 0 && idx > resMap.totalRow) {
                $list.css('top', -resMap.lineHeight * 2);
            } else {
                // 第一行处理
                $list.css('top', 0);
            }
        } else {
            // 从第三行开始，选中停留在中间
            if (row > resMap.maxRow) {
                if (resMap.reachEnd) {
                    // 最后一行处理
                    var currentTotal = getMaxView(getCurrent($list)).maxRow;
                    if (currentTotal < 3) {
                        $list.css('top', 0);
                    } else if (currentTotal == 3) {
                        $list.css('top', -resMap.lineHeight * 0.5);
                    } else {
                        $list.css('top', -resMap.lineHeight * 1.5);
                    }
                } else {
                    $list.css('top', -resMap.lineHeight * 2);
                }
            }
        }
    }

// 列表页面DOM缓存逻辑
    function listKeyLogic(keyMove, idx, options) {
        var settings = { maxViewTotal : resMap.maxCol * resMap.totalRow, updateFunc : updateList };
        $.extend(settings, options);
        var maxViewTotal = settings.maxViewTotal, total = settings.total, $list = settings.list;
        var updateFunc = settings.updateFunc || updateList, boundJump = settings.boundJump;
        switch (keyMove) {
            case 'LEFT':
                --idx;
                if (resMap.start == 0 && idx < 0) {
                    resMap.offset = 0;
                    boundJump && boundJump(keyMove);
                    return false;
                }
                if (idx < 0) {
                    resMap.offset = 0;
                    updateFunc(maxViewTotal - 1, keyMove);
                } else {
                    resMap.offset = idx % maxViewTotal;
                    focus($list, idx);
                }
                break;
            case 'RIGHT':
                ++idx;
                if (resMap.start + resMap.offset >= resMap.total - 1) {
                    return false;
                }
                resMap.offset = idx % maxViewTotal;
                if (idx == maxViewTotal) {
                    updateFunc(idx, keyMove);
                } else {
                    focus($list, idx);
                }
                break;
            case 'UP':
                if (resMap.start <= 0 && idx < resMap.maxCol) {
                    resMap.offset = 0;
                    boundJump && boundJump(keyMove);
                    return false;
                }
                if (resMap.start == 0) {
                    idx = idx - resMap.maxCol;
                }
                resMap.offset = idx % resMap.maxCol;
                if (idx >= resMap.maxCol) {
                    focus($list, idx - resMap.maxCol);
                } else {
                    if (resMap.start == 0) {
                        focus($list, idx % resMap.maxCol);
                    } else {
                        updateFunc(idx, keyMove);
                    }
                }
                break;
            case 'DOWN':
                idx += resMap.maxCol;
                if ((resMap.start + resMap.offset == resMap.medias.length)) {
                    focus($list, total - 1);
                    return false;
                }
                resMap.offset = idx % maxViewTotal;
                updateFunc(idx, keyMove);
                break;
            default :
                break;
        }
    }

    // 格式化日期显示
    function formatOptTime(optTime) {
        var MIN = 60, HOUR = MIN * 60, DAY = HOUR * 24, YEAR = DAY * 365;
        var now = new Date(), d = parseInt(+now / 1000, 10) - (parseInt(optTime, 10) || 0);
        if (d < 0) {
            return;
        }
        if (d / YEAR > 1) {
            return now.getFullYear() + '年';
        } else if (d / DAY > 7) {
            return (now.getMonth() + 1) + '月' + now.getDate() + '日';
        } else if (d / DAY > 1) {
            return Math.floor(d / DAY) + '天前';
        } else if (d / HOUR > 24) {
            return '昨天';
        } else if (d / HOUR > 1) {
            return Math.floor(d / HOUR) + '小时前';
        } else if (d / MIN > 1) {
            return Math.floor(d / MIN) + '分钟前';
        } else {
            return d + '秒前';
        }
    }

    // 公用log方法
    function jsLog(tip, show) {
        if (!show) {
            if (window.JSUtil) {
                JSUtil.log(tip);
            } else {
                console.log(tip);
            }
        } else {
            showTip(tip);
        }
    }

    // 设置开发环境
    function envSetup() {
        if (!window.JSUtil) {
            var $html = $('html');
            if (!$html.attr('class')) {
                $html.addClass('bg-web');
            }
        }
    }

    function showCheckingTips(type) {
        type = type || 'update';
        var $div = null;
        switch (type) {
            case 'update':
                $div = $('<div class="checking-tips"><p class="title">服务暂不可用</p><p class="desc">您使用的版本较低，需要升级才能继续使用！</p><p class="desc">请退出应用重新打开进行升级！</p></div>');
                break;
            case 'timeout':
                $div = $('<div class="checking-tips"><p class="title">网络不给力哦，亲~</p><p class="desc">检查网络再试一下吧~</p></div>');
                break;
            case 'pad':
                var $pad = $('#download-pad'), apkUrl = 'http://neirong.funshion.com/android/apad/2/FunshionApad_SID_2_zipalign.apk';
                if ($pad.length) {
                    $pad.show();
                } else {
                    $div = $('<div class="download-tips" id="download-tips"><div class="wrap-pad"><span class="icon-pad"></span><p class="tip">该版本不兼容此Pad，请下载风行视频Pad版！</p><a href="' + apkUrl + '" class="btn">下载风行视频Pad版</a><p>安装成功后请卸载TV应用</p></div></div>').show();
                }
                break;
            default :
                break;
        }
        $div && $div.appendTo('body');
        if (type == 'pad') {
            $('#download-tips').find('a').focus();
        }
    }

    // 升级检测
    function checkUpdate(callback) {
        if (!window.JSUtil) {
            callback && callback();
            return false;
        }
        if (!JSUtil.getVersion) {
            showCheckingTips();
            return true;
        } else {
            callback && callback();
            return false;
        }
    }

    /**
     * 比较版本号
     * @param vera
     * @param verb
     * @returns {number} 如果vera大于verb则返回1，反之返回-1，相等返回0
     */
    function compareVersion(vera, verb) {
        if (typeof verb == 'undefined') {
            if (window.JSUtil) {
                if (JSUtil.getVersion) {
                    verb = JSUtil.getVersion() || '';
                } else {
                    verb = '';
                }
            } else {
                // 这里标识为WEB访问
                verb = '';
            }
        }
        var ret = 0, va, vb;
        var veraArr = vera.split('.'), verbArr = verb.split('.'), maxLen = Math.max(veraArr.length, verbArr.length);
        for (var i = 0; i < maxLen && !ret; i++) {
            va = +veraArr[i] || 0;
            vb = +verbArr[i] || 0;
            if (va > vb) {
                ret = 1;
            }
            if (va < vb) {
                ret = -1;
            }
        }
        return ret;
    }

    // 页面状态操作方法
    var pageProperty = {
        getItem    : function(key) {
            OTT.log("pageProperty.getItem:" + key);
            if (window.JSUtil) {
                return JSUtil.getPageProperty(key);
            }
        },
        setItem    : function(key, value) {
            OTT.log("pageProperty.setItem:" + key + "-->" + value);
            if (window.JSUtil) {
                return JSUtil.setPageProperty(key, value);
            }
        },
        removeItem : function(key) {
            OTT.log("pageProperty.removeItem:" + key);
            if (window.JSUtil) {
                return JSUtil.removePageProperty(key);
            }
        }
    };
    // 播放器退出隐藏loading
    function toggleLoading(opt) {
        opt = opt || '';
        var $loading = $('#tip_loading');
        if (opt == 'show') {
            $loading.show();
        } else {
            $loading.hide();
        }
    }

    function bindAppcacheEvent() {
        var appCache = window.applicationCache, useDebug = false;
        if (!appCache) { return; }
        $(appCache).on('checking', function(ev) {
            OTT.log('Checking updates for page: ' + window.location.href, useDebug);
        });
        $(appCache).on('error', function(ev) {
            OTT.log('Error occurred when downloading resources.', useDebug)
        });
        // 缓存资源有更改
        $(appCache).on('updateready', function(ev) {
            if (appCache.status == appCache.UPDATEREADY) {
                appCache.swapCache();
                window.location.reload();
            }
        });
        $(appCache).on('progress', function(e) {
            var message = 'Downloading offline resources...', ev = e.originalEvent;
            if (ev.lengthComputable) {
                message = message + Math.round(ev.loaded / ev.total * 100) + '%';
            }
            OTT.log(message, useDebug);
        });
    }

    // 离线和非离线版本URL设置
    function setupUrl(type) {
        var isOffline = (window.location.pathname.indexOf('/rtw/') == 0), path = '';
        switch (type) {
            case 'staff':
                if (isOffline) {
                    path = '/rtw/p/staff.html?sid=';
                } else {
                    path = '/staff/';
                }
                break;
            case 'subject':
                if (isOffline) {
                    path = '/rtw/p/subject.html?mid=';
                } else {
                    path = '/subject/';
                }
                break;
            case 'retrieval':
                if (isOffline) {
                    path = '/rtw/p/retrieval.html';
                } else {
                    path = '/list/index';
                }
                break;
            case 'search':
                if (isOffline) {
                    path = '/rtw/p/search.html';
                } else {
                    path = '/search/media';
                }
                break;
            case 'history':
                if (isOffline) {
                    path = '/rtw/p/history.html';
                } else {
                    path = '/history';
                }
                break;
            case 'epl':
                if (isOffline) {
                    path = '/rtw/p/epl.html?rid=';
                } else {
                    path = '/live_epl_schedule/';
                }
                break;
            case 'concert':
                path = '/rtw/p/concert.html?mid=';
                break;
            default :
                break;
        }
        return path;
    }

    /* 抛出接口 */
    var OTT = {
        init           : function() {
            envSetup();
            blockKeyup();
            redirectLink();
            bindPageLoaded();
            bindAppcacheEvent();
            jsLog("_fjs_use_default_enter_key_function : " + _fjs_use_default_enter_key_function);
        },
        api            : HOST_API,
        settings       : settingsMap,
        resMap         : resMap,
        storage        : storage,
        cacheDOM       : cacheDOM,
        PAGE_SIZE      : PAGE_SIZE,
        log            : jsLog,
        focus          : focus,
        template       : template,
        getUserInfo    : getUserInfo,
        getParam       : getParam,
        mapKeyCode     : mapKeyCode,
        updateWidth    : updateWidth,
        restrictKey    : restrictKey,
        formatOptTime  : formatOptTime,
        getCurrent     : getCurrent,
        setCurrent     : setCurrent,
        genPicPath     : genPicPath,
        sendRequest    : sendRequest,
        getMaxView     : getMaxView,
        hasEvent       : hasEvent,
        lazyload       : lazyload,
        makeMiddle     : makeMiddle,
        updateList     : updateList,
        hasOverlay     : hasOverlay,
        listKeyLogic   : listKeyLogic,
        moveLeft       : moveLeft,
        moveRight      : moveRight,
        keyJoin        : keyJoin,
        pageProperty   : pageProperty,
        checkUpdate    : checkUpdate,
        dateFormat     : dateFormat,
        okHandler      : null,
        getHref        : getHref,
        exportsToApp   : { jsKeyEventInject : jsKeyEventInject, loadingFun : toggleLoading },
        reportToKernel : reportToKernel,
        showOkLoading  : true,
        compareVersion : compareVersion,
        showErrorTip   : showCheckingTips,
        setupUrl       : setupUrl,
        groupSort      : groupSort,
        showLoading    : showLoading,
        hideLoading    : hideLoading
    };
    window.OTT = OTT;
    OTT.init();
})(window);
/* 兼容旧版本APP调用 */
function jsKeyEventInject(type, keyCode) {
    OTT.exportsToApp.jsKeyEventInject(type, keyCode);
}
function goBackByJs(keyType) {
    OTT.exportsToApp.goBackByJs(keyType);
}
function loadingFun(opt) {
    OTT.exportsToApp.loadingFun(opt);
}
OTT.updatePlayStatus = function() {
    OTT.exportsToApp.updatePlayStatus();
};