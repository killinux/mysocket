var customEventHandler = {
    listener : function(handle, cb) {
        if(typeof cb == 'function' && handle) {
            $(document).unbind(handle);
            $(document).bind(handle, function(){cb();});
        }
        return false;
    },
    sendevent : function(handle) {
        $(document).triggerHandler(handle);
    }
},
loginPanel = function() {
    var longPollingOff = false;

    var qrcode = '';

    var originFocus = OTT.getCurrent();

    var getCss = function() {
        var css = [
            '#loginPanel {width:100%;height:100%;position:absolute;z-index:100;left:0px;top:0px;display:none}',
            '.lp-main{width:700px;height:392px;background-color:rgba(0,0,0,0.8);color:whitesmoke;border-radius:2px;border:1px rgba(241,241,241,0.08) solid}',
            '.central {display:-webkit-box; -webkit-box-orient:horizontal; -webkit-box-pack:center; -webkit-box-align:center;}',
            '.lp-left {width:222px;margin-left:67px;float:left;}',
            '.lp-left .lp-title {font-size:18px;line-height:18px;margin:20px 0 50px 0;}',
            '.lp-title div{margin-top:27px;}',
            '.lp-title a.current{text-decoration:none;color:whitesmoke}',
            '.lp-left .qdiv {height:222px;background:white;position:relative}',
            '#qrcode {width:185px;height:185px;position:absolute;left:18px;top:19px;}',
            '.lp-left .qmdiv {font-size:14px;margin-top:7px;overflow:hidden}',
            '.lp-right {position:relative;font-size:18px;border-left-color:#2a2524;boder-left-width:2px;border-left-style:solid;height:281px;float:left;margin:55px 0 0 36px;}',
            '.lp-right label {display:block;margin:45px 0 34px 36px;width:280px;font-size:19px;line-height:27px}',
            '.lp-right p{margin-left:36px;color:#a8a6a7;font-size:17px;line-height:27px;width:280px;overflow:hidden;word-break:break-all;}',
            '.lp-right span{font-size:14px;}'
        ].join('');
        return css;
    };

    var getTpl = function() {
        var loginTpl = [
            '<div id="loginPanel" class="central">',
                '<div class="lp-main">',
                    '<div class="lp-left">',
                        '<div class="lp-title">',
                            '<i class="icon-my"></i>',
                            '<span>&nbsp;&nbsp;<a data-list-item="close" href="javascript:;">登录</a></span>',
                        '</div>',
                        '<div class="qdiv"><div id="qrcode"></div></div>',
                    '</div>',
                    '<div class="lp-right">',
                        '<label>请使用QQ、微信、支付宝等APP扫描左侧二维码，进行登录操作</label>',
                        '<p>或浏览器输入网址登录：</p>',
                        '<p><span></span>&nbsp;&nbsp;</p>',
                    '</div>',
                '</div>',
            '</div>'
        ].join('');
        return loginTpl;
    };

    var addCssSheet = function(css){
        if(!-[1,]){
            css = css.replace(/opacity:\s*(\d?\.\d+)/g,function($,$1){
                $1 = parseFloat($1) * 100;
                if($1 < 0 || $1 > 100)
                    return "";
                return "filter:alpha(opacity="+ $1 +");"
            });
        }
        css += "\n";
        var doc = document, head = doc.getElementsByTagName("head")[0],
            styles = head.getElementsByTagName("style"),style,media;
        if(styles.length === 0){
            if (doc.createStyleSheet){
                doc.createStyleSheet();
            } else {
                style = doc.createElement('style');
                style.setAttribute("type", "text/css");
                head.insertBefore(style,null)
            }
        }
        style = styles[0];
        media = style.getAttribute("media");
        if(media === null && !/screen/i.test(media)) {
            style.setAttribute("media","all");
        }
        if(style.styleSheet) {
            style.styleSheet.cssText += css;
        } else if(doc.getBoxObjectFor) {
            style.innerHTML += css;
        } else {
            style.appendChild(doc.createTextNode(css))
        }
        return false;
    };

    var generateQrCode = function(qr) {
        $('#qrcode').html('');
        setTimeout(function() {
            $("#qrcode").qrcode({
                render: "table",
                width: 185,
                height:185,
                text: qr
            });
        }, 100);
        $('.lp-right p').find('span').text(qr);
        return false;
    };

    var render = function() {
        if($('#loginPanel').get(0) == undefined) {
            addCssSheet(getCss());
            $('body').append(getTpl());
        }
        $("#loginPanel").css('display', '-webkit-box');
        OTT.focus($('#loginPanel'), 0);
        OTT.hasDialog = true;
        $.get('/ajax/get_qrcode/login', function(resp) {
            try {var json = JSON.parse(resp);} catch(e) {var json = {status:500, msg:''};};
            if(json.status == 200) {
                qrcode = json.msg.qrsrc;
                generateQrCode(json.msg.qrurl);
            }
            return false;
        });
        return false;
    };

    var closePanel = function() {
        $('#qrcode').html('');
        $("#loginPanel").hide();
        $('#loginPanel').unbind('keyup');
        OTT.hasDialog = false;
        longPollingOff = true;
        qrcode = '';
        OTT.focus(originFocus.parent(), originFocus.parent().children('[' + OTT.settings.item + ']').index(originFocus));
        return false;
    };

    var storageUinfo = function(uinfo) {
        if(typeof uinfo == 'object') {
            $.get('/ajax/check_playauth?accountId=' + uinfo.account_id, function(resp) {
                try { var json = JSON.parse(resp);} catch(e) { var json = {};}
                if(json.status == 200) {
                    uinfo.privileges = json.msg;
                }
                OTT.storage.setItem('account_info', JSON.stringify(uinfo));
                return false;
            });
        }
        return false;
    };

    var longPolling = function() {
        $.ajax({
            url: "/lpsrv/verify_mblogin?qrcode=" + qrcode,
            method: 'get',
            dataType: "jsonp",
            jsonp: "jcb",
            timeout: 5000,
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                if(textStatus == "timeout" && !longPollingOff) {
                    longPolling();
                } else {
                    return false;       //long polling 异常
                }
            },
            success: function(data, textStatus) {
                if(textStatus == "success") {
                    if(data.status == 200) {
                        storageUinfo(data.msg);
                        closePanel();
                        customEventHandler.sendevent('login');
                        return false;
                    } else {
                        if(!longPollingOff) {
                            longPolling();
                        } else {
                            return false;
                        }
                    }
                }
            }
        });
    };

    var goBackByJs = function(keyType) {
        keyType = keyType || 'keyup';
        if (keyType != 'keyup') {
            return false;
        }
        var $panel = $('#loginPanel');
        if ($panel.is(':visible')) {
           closePanel();
        } else {
            window.JSUtil && JSUtil.jsNaviGoBack();
        }
    };

    var bindKeyEvent = function() {
        $('#loginPanel').bind('keyup', function(e) {
            if(OTT.hasOverlay() || !OTT.hasDialog) {
                return false;
            }
            var keyCode = e.keyCode;
            if(OTT.mapKeyCode(keyCode) == 'OK') {
                return false;
            }
        });
        return false;
    };

    this.open = function() {
        var uinfo = JSON.parse(OTT.storage.getItem('account_info') || '{"account_name":"", "account_id":0, "sso_token":""}');
        if(!uinfo.account_id) {
            render();
            bindKeyEvent();
            longPolling();
            // 允许JS控制APP的返回
            window.JSUtil && JSUtil.jsManageGoBackEnable();
            OTT.exportsToApp.goBackByJs = goBackByJs;
        }
        return uinfo.account_id;
    };

    this.close = function() {
        closePanel();
        return false;
    };
};
