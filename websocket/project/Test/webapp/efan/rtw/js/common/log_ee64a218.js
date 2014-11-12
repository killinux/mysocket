/* 
log js
* Filename:       log.js
* Version:        1.0
* Created:        07/07/14 
* ott:        
* Copywrite:      CopyRight 2014 ott-srv.fun.tv
* Creator:            
== FILES =============================================

* Main js:       log.js (this file)

== STRUCTURE =========================================
* Page width:     all page
* Number of columns:  
* Column width:     
* Margin width:    

======================================================
*/

/* 写本地存储的方法
OTT.storage.setItem();
OTT.storage.getItem();
OTT.storage.removeItem();
*/


;(function($){
	if (!window.JSUtil) { return; }
	//数据上报字段定义
	var ottpv={rprotocol:'1',         // 前端发送，日志请求协议版本号，表明前端发送的版本号，初始为1
		firstname : 'ott',
		secondname : 'ottpv',
		protocol : [
		"rprotocol",
		"clientFlag", //www：1；fs：2；fsqq：3；移动web：4 ;tv 盒子		
		"fck",
		"mac",   	//用户Mac地址
		"userid",	//目前为空
		"fpc",		//地域策略,用以标识唯一用户
		"version",	//风行版本号
		"sid",
		"pvid",
		"config",
		"url",
		"referurl",
		"channelid",            //合作渠道id
		"vtime",                //页面请求耗时
		"ext"  ,                //目前为空
		"step",		            //用户史来pv计数器，各自维护
		"sestep", 	            //本次session的pv计数器，各自维护
		"seidcount",            //用户史来session计数器，各自维护
		"ta",
		"prop_brand",           //安卓版本
		"prop_fingerprint",     //安卓手印
		"prop_manufacturer",     //安卓电视生产商
		"prop_model",           //安卓版本
		"prop_version_release", //安卓版本 
		"prop_version_sdk",     //安卓版本
		"prop_device_id"        //安卓版本
	]};
	var protocolSplit = '*_*';

	var sid = {
		key : 'sid',
		cycle : 30*60,
		create: function(){
			var val = parseInt(+new Date/1000) + (gmp() + gmp()).substr(0, 5);
			sid.write(val);
			return val;
		},
		write : function(val){
			OTT.storage.setItem(sid.key, val);
		},
		get : function(){
			var val = OTT.storage.getItem(sid.key);
			return (val) || sid.create();
		},
		init : function(){
			// 只要页面有动静就刷新sid重写过期时间
			var sidendtime = new Date, sidwrite = sidendtime;
			$(document).bind("vmousemove",function(){sidendtime = new Date;});
			setInterval(function(){
				if (sidendtime > sidwrite){sidwrite = sidendtime; sid.write(sid.get());}
			}, sid.cycle*1000/2);

		}
	};

	sid.init();
	sid.get();

	var newGuid = function () {
		var guid = "";
		for (var i = 1; i <= 32; i++){
		  var n = Math.floor(Math.random()*16.0).toString(16);
		  guid +=   n;
		  if((i==8)||(i==12)||(i==16)||(i==20))
			guid += "-";
		}
		return guid;
	};
	var pvid = {
		get : function(){
			var guid = newGuid();
			return guid;
		}
	};
	function gmp(){return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)};

	/*
	var fck = {
		key : 'fck',
		create: function(){
			var val = parseInt(+new Date/1000) + (gmp() + gmp()).substr(0, 5);
			OTT.storage.setItem(fck.key, val);

			return val;
		},
		get: function(){
			var val =OTT.storage.getItem(fck.key);
			return val || fck.create();
		}
	};
	*/
	try{
		OTT.storage.setItem("pvid",pvid.get());
		if(!OTT.storage.getItem('fck')){
			var gmp = function(){return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)};
			var fcks = parseInt(+new Date/1000) + (gmp() + gmp()).substr(0, 5);
			OTT.storage.setItem('fck', fcks);
		}
	}catch(e){

	}

	//数据上报
	var statBaseData = function(type,pgclick_param){
		var fcks = OTT.storage.getItem('fck');
		var url= window.location.href;
		var referurl= document.referrer;
		var pvid=OTT.storage.getItem("pvid");
		var sid=OTT.storage.getItem("sid");
		if(type=="ottpv"){
			var param={
			"rprotocol" :ottpv.rprotocol,
			"clientFlag": 'ottpv',
			"fck": fcks,
			"mac": '',
			"userid":0,
			"fpc": '',
			"version": 0,
			"sid" :sid,
			"pvid" : pvid,
			"config" : '',
			"url" : url,
			"referurl" : JSUtil.getRefer() || '',
			"channelid" : JSUtil.getChannelId() || '',
			"vtime" : 0,    //页面请求耗时
			"step" : 0,		//用户史来pv计数器，各自维护
			"sestep" : 0, 	//本次session的pv计数器，各自维护
			"seidcount" : 0,//用户史来session计数器，各自维护		
			"ta" : '',
			"prop_brand" : 	JSUtil.getNativeProperty(9) || '',           //安卓版本
			"prop_fingerprint" : JSUtil.getNativeProperty(11) || '',     //安卓手印
			"prop_manufacturer" : JSUtil.getNativeProperty(12) || '',    //安卓电视生产商
			"prop_model" : JSUtil.getNativeProperty(13) || '',           //安卓采用模型
			"prop_version_release" : JSUtil.getNativeProperty(15) || '', //安卓版本标示 
			"prop_version_sdk" : JSUtil.getNativeProperty(16) || '',     //安卓版本SDK
			"prop_device_id" : JSUtil.getNativeProperty(17) || '',       //安卓版本设备			
			"ext" :''
			};
			stat.getRequest(ottpv,param);
		}
	};

	var stat = (function(){
		return {
			getRequest : function(config, data){
				data.rprotocol = config.rprotocol;
				var firstname = config.firstname || 'ott', secondname = config.secondname || 'ottpv',
					url = 'http://stat.funshion.net/'+firstname+'/'+secondname + "?";
					reportData.dispatch(url + protocolJoin(config.protocol, data).join(protocolSplit));
			}
		};
		function protocolJoin(protocol, data){
			var params = [], key, val;
			for (var i = 0; i < protocol.length; i++) {
				key = protocol[i], val = data[key];
				params.push(key + '=' + (typeof val == 'undefined' ? '' : escapeSymbol(val)));
			}
			return params;
		}
		function escapeSymbol(source){
			var map = {'#': '%23'};
			return String(source).replace(/#/ig, function(all) {
				return map[all];
			});
		}
	})();
	var reportData = {
		dispatch : function(url){
			if(!url) return;
			setTimeout(function(){
				//创建一个dom节点
				var img = document.createElement('img');
				img.src=url;
				img.onload = function(){
					img;
				}
			},200);
		}
	};

	//执行函数
	statBaseData("ottpv");
})(jQuery);