/**
 * Created by zhengxc on 14-9-1.
 */
$(function(){
    var goodType, $historyCurrent, userCancel = false, currentDialog, openedDialogArr = [], GETPAYRESTOTALNO = 150, payPanel = {}, $shadeEle, uinfo, btnInfo = {}, buyPanelInfo = {},
        goodDialogTpl = ['<script id="tpl_good_panel" type="text/html">',
            '<div class="pay-panel" id="good-panel" tabindex="1">',
            '<div class="good-con">',
            '<p class="title">{{timeDur}}好，亲爱的{{accountName}}，',
            '{{if goodType=="vip" }}',
            '购买VIP免费观看此片</p>',
            '<div id="good-list">',
            '{{each msg as value i}}',
            '<a class="list-item" data-list-item="{{value.id}}" days="{{value.availableTime}}" price="{{value.realPrice}}" tabindex="2">',
            '<span class="date">{{value.availableTime}}天</span>',
            '<span class="origin-price">原价{{value.originalPrice}}元</span>',
            '<span class="curr-price">现价{{value.realPrice}}元</span>',
            '</a>',
            '{{/each}}',
            '</div>',
            '{{else}}',
            '购买英超付费包同步看直播</p>',
            '<div id="buy-list">',
            '{{each msg as value i}}',
            '<a class="list-item" data-list-item="{{value.commodityId}}" days="{{value.name}}" price="{{value.retailPrice}}" tabindex="2">',
            '<span class="date">{{value.name}}</span>',
            '<span class="origin-price">原价{{value.originalPrice}}元</span>',
            '<span class="curr-price">现价{{value.retailPrice}}元</span>',
            '</a>',
            '{{/each}}',
            '</div>',
            '{{/if}}',
            '<p class="btn-panel" id="btn-panel">',
            '<a href="javascript:;" data-list-item="pay-btn" class="btn pay-btn">支付</a>',
            '<a href="javascript:;" data-list-item="btn" class="btn">取消</a>',
            '</P>',
            '<div class="info">',
            '{{if goodType=="vip" }}',
            '<p>VIP说明：</p>',
            '<p>1、开通TV端VIP可在电视上免费观看所有VIP内容；</p>',
            '<p>2、TV端VIP包含PC版VIP服务；</p>',
            '{{else}}',
            '<p>购买说明：</p>',
            '<p>1、购买英超付费包，同步观看14-15年赛季有效期内直播内容；</p>',
            '<p>2、赛季包价格按比赛周减差价；</p>',
            '{{/if}}',
            '</div>',
            '</div>',
            '</div>',
            '</script>'
        ],
        payDialogTpl = ['<script id="tpl_pay_panel" type="text/html">',
            '<div class="pay-panel" id="pay-panel">',
            '<div class="pay-con">',
            '<p class="title pay-tit">{{accountName}}，请使用<span>支付宝钱包</span>扫描二维码完成支付</p>',
            '<div class="clearfix confirm-pay">',
            '<a href="###" class="qrcode" id="qrcode-img"><img src="{{qrCodePicUrl}}" alt="" /></a>',
            '<div class="pay-result">',
            '<p>购买商品：<span id="pay-info">',
            '{{if  goodType=="vip" }}',
            'VIP{{days}}天/{{price}}元',
            '{{else}}',
            '英超付费包{{days}}/{{price}}元',
            '{{/if}}',
            '</span></p><p id="orderId">订单编号：{{orderId}}</p>',
            '<p class="tip">下单成功，请立即支付</p>',
            '<p class="btn-panel">',
            '<a href="javascript:;" data-list-item="pay-btn"  class="btn pay-btn">上一步</a>',
            '<a href="javascript:;" data-list-item="btn"  class="btn">取消</a>',
            '</P>',
            '</div>',
            '</div>',
            '<p class="customer">如有疑问请电话联系客服：4006068884（9:00-21:00）</p>',
            '</div>',
            '</div>',
            '</script>'],
        successDialogTpl = ['<script id="tpl_success_panel" type="text/html">',
        '<div class="pay-panel" id="success-panel">',
        '<div class="res-con">',
        '<div class="title">',
        '{{if goodType=="vip" }}',
        '恭喜您，成为VIP。有效期到{{authEnd}}',
        '{{else}}',
        '恭喜您，英超{{mediaName}}付费包购买成功。',
        '{{if authEnd}}',
        '有限期到{{authEnd}}',
        '{{/if}}',
        '{{/if}}',
        '</div>',
        '<p class="btn-panel">',
        '<a href="###" data-list-item="pay-btn"  class="btn pay-btn">立即观看</a>',
        '</P>',
        '<div class="info">',
        '{{if goodType=="vip" }}',
        '<p>VIP说明：</p>',
        '<p>1、开通TV端VIP可在电视上免费观看所有VIP内容；</p>',
        '<p>2、TV端VIP包含风行网PC端VIP服务；</p>',
        '{{else}}',
        '<p>购买说明：</p>',
        '<p>1、购买英超付费包，同步观看14-15年赛季有效期内直播内容；</p>',
        '<p>2、赛季包价格按比赛周减差价；</p>',
        '{{/if}}',
        '</div>',
        '</div>',
        '</div>',
        '</script>'],
        failedDialogTpl = ['<script id="tpl_failed_panel" type="text/html">',
        '<div class="pay-panel" id="failed-panel">',
        '<div class="res-con">',
        '<div class="title">支付失败，请重新购买</div>',
        '<p class="btn-panel">',
        '<a href="javascript:;" data-list-item="pay-btn"  class="btn pay-btn">立即购买</a>',
        '<a href="javascript:;" data-list-item="btn"  class="btn">取消</a>',
        '</P>',
        '<div class="info">',
        '{{if goodType=="vip" }}',
        '<p>VIP说明：</p>',
        '<p>1、开通TV端VIP可在电视上免费观看所有VIP内容；</p>',
        '<p>2、TV端VIP包含PC版VIP服务；</p>',
        '{{else}}',
        '<p>购买说明：</p>',
        '<p>1、购买英超付费包，同步观看14-15年赛季有效期内直播内容；</p>',
        '<p>2、赛季包价格按比赛周减差价；</p>',
        '{{/if}}',
        '</div>',
        '</div>',
        '</div>',
        '</script>'],
        timeOutDialogTpl = ['<script id="tpl_timeOut_panel" type="text/html">',
            '<div class="pay-panel" id="timeOut-panel">',
            '<div class="res-con">',
            '<div class="title">获取订单状态超时,请稍后去个人中心查看记录</div>',
            '<p class="btn-panel">',
            '<a href="/user/consume_list" data-list-item="pay-btn"  class="btn pay-btn">前往个人中心</a>',
            '</P>',
            '<div class="info">',
            '{{if goodType=="vip" }}',
            '<p>VIP说明：</p>',
            '<p>1、开通TV端VIP可在电视上免费观看所有VIP内容；</p>',
            '<p>2、TV端VIP包含PC版VIP服务；</p>',
            '{{else}}',
            '<p>购买说明：</p>',
            '<p>1、购买英超付费包，同步观看14-15年赛季有效期内直播内容；</p>',
            '<p>2、赛季包价格按比赛周减差价；</p>',
            '{{/if}}',
            '</div>',
            '</div>',
            '</div>',
            '</script>'];


    function bindKeyEventGood(){
        $("#good-list").bind("keydown", function(e){
            if(OTT.hasOverlay() || !OTT.hasDialog){
                return false;
            }
            var keyMove = OTT.mapKeyCode(e.keyCode);
            if (OTT.restrictKey(e.keyCode)) {
                switch (keyMove) {
                    case 'LEFT':
                        if(buyPanelInfo.idx){
                            --buyPanelInfo.idx;
                            OTT.focus(buyPanelInfo.list, buyPanelInfo.idx);
                        }
                        break;
                    case 'RIGHT':
                        if (buyPanelInfo.idx < buyPanelInfo.len - 1) {
                            ++buyPanelInfo.idx;
                            OTT.focus(buyPanelInfo.list, buyPanelInfo.idx);
                        }
                        break;
                    case 'DOWN':
                        // 商品类型下一行
                        btnInfo['good']['idx'] = 0;
                        OTT.focus(btnInfo['good']['list']);
                        $(buyPanelInfo.eles[buyPanelInfo.idx]).addClass("current");
                        break;
                    default :
                        break;
                }
                return false;
            }
        });
    }

    function bindKeyEventBtn(currentDialog){
        var info = btnInfo[currentDialog];
        info['list'].bind("keydown", function(e){
            if(OTT.hasOverlay() || !OTT.hasDialog){
                return false;
            }
            var keyMove = OTT.mapKeyCode(e.keyCode);
            if (OTT.restrictKey(e.keyCode)) {
                switch (keyMove) {
                case 'LEFT':
                    if(info.idx){
                        --info.idx;
                        OTT.focus(info.list, info.idx);
                    }
                    if(currentDialog == "good"){
                        $(buyPanelInfo.eles[buyPanelInfo.idx]).addClass("current");
                    }
                    break;
                case 'RIGHT':
                    if (info.idx < info.len - 1) {
                        ++info.idx;
                        OTT.focus(info.list, info.len);
                    }
                    if(currentDialog == "good"){
                        $(buyPanelInfo.eles[buyPanelInfo.idx]).addClass("current");
                    }
                    break;
                case 'UP':
                    if(currentDialog == "good"){
                        // 商品类型
                        OTT.focus(buyPanelInfo.list, buyPanelInfo.idx);
                    }
                    break;
                default :
                    break;
            }
                return false;
            }
        });
        info['list'].bind("keyup", function(e){
            e.preventDefault();
            e.stopPropagation();
            if(OTT.hasOverlay() || !OTT.hasDialog){
                return false;
            }
            var keyMove = OTT.mapKeyCode(e.keyCode);
            if(keyMove != "OK") return false;
            payPanel[currentDialog]['btn'](info);
        });
    }

    function closeDialog(removeShade){
        var $ele = $("#" + currentDialog + "-panel");
        $ele.hide();
        if(removeShade){
            OTT.hasDialog = false;
            $shadeEle.removeClass("shade");
            var $parentList = $historyCurrent.parent();
            var idx = $parentList.children('[' + OTT.settings.item + ']').index($historyCurrent);
            OTT.focus($parentList, idx);
        }
    }

    function getTimeDur() {
        var time = (new Date()).getHours(), text = '您';
        if(time >= 0 && time < 12) {
            text = '早上';
        } else if (time >= 12 && time < 18) {
            text = '下午';
        } else {
            text = '晚上';
        }
        return text;
    }

    function getPayResult(orderId, getPayResTotalNo){
        if(userCancel) return;
        $.ajax({
            url: "/ajax/check_orderstate?order=" + orderId,
            type: "GET",
            dataType: "json",
            success: function(data){
                if(userCancel) return;
                if(data.status == 300 || data.status == 400){
                    getPayResTotalNo--;
                    if(!getPayResTotalNo){
                        setTimeout(function(){
                            getPayResult(orderId, getPayResTotalNo);
                        }, 300000);
                    }else if(getPayResTotalNo < 0){
                        closeDialog(false);
                        initDialog("timeOut");
                        return;
                    }else{
                        setTimeout(function(){
                            getPayResult(orderId, getPayResTotalNo);
                        }, 5000);
                    }
                }else if(data.status == 200){
                    closeDialog(false);
                    storageUserPayPrivileges();
                    initDialog("success", data.msg);
                }else if(data.status == 500 || data.status == 600){
                    closeDialog(false);
                    initDialog("failed");
                }
            }
        });
    }

    function storageUserPayPrivileges(){
        OTT.sendRequest('/ajax/check_playauth?accountId='+ uinfo.account_id, function(json) {
            if(json && json.status == 200){
                uinfo.privileges = json.msg;
            }
            OTT.storage.setItem('account_info', JSON.stringify(uinfo));
        });
    }

    function initDialog(dialogType, dialogInfo){
        currentDialog = dialogType;
        if($.inArray(currentDialog, openedDialogArr) > -1){
            payPanel[currentDialog].show(dialogInfo);
            return;
        }
        payPanel[dialogType]["init"](dialogInfo);
        openedDialogArr.push(currentDialog);
    }

    function commonInit(data){
        $("body").append(payPanel[currentDialog]["tpl"].join(""));
        var htmlStr = template("tpl_" + currentDialog + "_panel", data);
        $("body").append(htmlStr);
        btnInfo[currentDialog] = {};
        btnInfo[currentDialog]['list'] = $("#" + currentDialog + "-panel .btn-panel");
        btnInfo[currentDialog]['len'] = $("#" + currentDialog + "-panel .btn-panel a.btn").length;
        btnInfo[currentDialog]['idx'] = 0;
        OTT.focus(btnInfo[currentDialog]['list'], btnInfo[currentDialog]['idx']);
        bindKeyEventBtn(currentDialog);
    }

    function commonShow(panelInfo){
        $("#" + currentDialog +"-panel").show();
        OTT.focus(panelInfo["list"], panelInfo["idx"]);
    }

    payPanel.good = {
        'tpl' : goodDialogTpl,
        'show' : function(){
            commonShow(buyPanelInfo);
        },
        'init' : function(){
            var url =  (goodType == 'vip') ? "/ajax/get_commlist/" + uinfo.account_id : "/ajax/get_livecomm_price/1";
            OTT.sendRequest(url, function(data){
                if(data.status != 200) return;
                var len = data.msg.length;
                data.accountName = uinfo.account_name ? uinfo.account_name : "用户";
                data.timeDur = getTimeDur();
                data.goodType = goodType;
                commonInit(data);

                buyPanelInfo.list = $('#good-list');
                buyPanelInfo.eles = $('#good-list').find('[data-list-item]');
                buyPanelInfo.len = buyPanelInfo.eles.length;
                buyPanelInfo.idx = 0;
                for(var i = 0; i< len; i++){
                    if(data["msg"][i]["isDefault"])
                        buyPanelInfo.idx = i;
                }
                OTT.focus(buyPanelInfo.list, buyPanelInfo.idx);
                bindKeyEventGood();
            });
        },
        'btn' : function(btnInfo){
            if(btnInfo.idx == 0){
                var ele = $(buyPanelInfo['eles'][buyPanelInfo['idx']]), data = {};
                data.commodityId = ele.attr("data-list-item"),
                data.days = ele.attr("days"),
                data.price = ele.attr("price");
                closeDialog(false);
                initDialog('pay', data);
            }else{
                closeDialog(true);
            }
        }
    };

    payPanel.pay = {
        'tpl' : payDialogTpl,
        'show' : function(dialogInfo){
            this.getOrderInfo(dialogInfo, function(data){
                var str = (goodType == "vip" ? "VIP" + dialogInfo.days + "天" : "英超付费包" + dialogInfo.days ) + "/" + dialogInfo.price + "元";
                $("#pay-info").html(str);
                $("#orderId").html("订单编号：" + data.orderId);
                $("#qrcode-img img").attr("src", data.qrCodePicUrl);
                btnInfo['pay']['idx'] = 0;
                commonShow(btnInfo['pay']);
            });
        },
        'init' : function(dialogInfo){
            this.getOrderInfo(dialogInfo, function(data){
                data.days = dialogInfo.days;
                data.price = dialogInfo.price;
                data.accountName = uinfo.account_name ? uinfo.account_name : '用户';
                data.goodType = goodType;
                commonInit(data);
            });
        },
        'getOrderInfo' : function(dialogInfo, callback){
            $.post("/ajax/do_consume/", {
                'accountId': uinfo.account_id,
                'accountName': uinfo.account_name,
                'commodityId': dialogInfo.commodityId,
                'gatewayId': 34,
                'gatewayPara': "",
                'mac': "",
                'fck': "",
                'userAgent': navigator.userAgent,
                'autoRenewal': "",
                'payDutSign': "",
                'ticketCode': ""
            },function(data){
                if(data.status != 200) return;
                callback(data.msg);
                userCancel = false;
                getPayResult(data.msg.orderId, GETPAYRESTOTALNO);
            }, "json");
        },
        'btn' : function(btnInfo){
            userCancel = true;
            if(btnInfo.idx == 0){
                closeDialog(false);
                initDialog("good");
            }
            if(btnInfo.idx == 1){
                closeDialog(true);
            }
        }
    };

    payPanel.success = {
        'tpl' : successDialogTpl,
        'init' : function(data){
            data.goodType = goodType;
            data.authEnd = data.authEnd ? data.authEnd.split(" ")[0] : "";
            commonInit(data);
            var fspurl = $historyCurrent.attr("href") ||  $("a", $historyCurrent).attr("href");
            $("#success-panel .btn").attr("href", fspurl);
        },
        'btn' : function(){
            closeDialog(true);
            var $btn = $("#success-panel .pay-btn");
            var url = $btn.attr('href');
            OTT.reportToKernel.redirect($btn);
            if(url != 'javascript:;'){
                location.href = url;
            }
            customEventHandler.sendevent('pay-success');
        }
    };

    payPanel.failed = {
        'tpl' : failedDialogTpl,
        'show' : function(){
            btnInfo['failed'][idx] = 0;
            commonShow(btnInfo['failed']);
        },
        'init' : function(){
            var data = {};
            data.goodType = goodType;
            commonInit(data);
        },
        'btn' : function(btnInfo){
            if(btnInfo.idx == 0){
                closeDialog(false);
                initDialog("good");
            }else if(btnInfo.idx == 1){
                closeDialog(true);
            }
        }
    };
    payPanel.timeOut = {
        'tpl' : timeOutDialogTpl,
        'init' : function(){
            var data = {}, htmlStr;
            data.goodType = goodType;
            $("body").append(payPanel[currentDialog]["tpl"].join(""));
            var htmlStr = template("tpl_" + currentDialog + "_panel", data);
            $("body").append(htmlStr);
            OTT.focus($("#" + currentDialog + "-panel .btn-panel"));
        }
    };

    OTT.payPanel = function(shadeEleSeletor, curgoodType){
        goodType = curgoodType || 'vip';
        OTT.hasDialog = true;
        $historyCurrent = OTT.getCurrent();
        $shadeEle = $("shadeEleSeletor");
        $shadeEle.addClass("shade");
        uinfo = OTT.getUserInfo();
        initDialog("good");
    };
});