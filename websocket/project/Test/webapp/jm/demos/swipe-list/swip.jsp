<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<%@ page contentType="text/html;charset=UTF-8" %>
<%@ page import="java.io.*"%>
<%@ page import="java.util.*"%>
<%@ page import="javax.sql.rowset.*"%>
<%@ page import="com.efan.dao.*"%>

<%
String user_id=request.getParameter("u");//用户id
String mechine_id=request.getParameter("m");//机器id，机器随机生成，相当于token
/* if(mechine_id==null){
response.sendRedirect("/webs/error.html");
} */
/* if(user_id==null){
	response.sendRedirect("/webs/login.html");
} */

List list = new ArrayList();
try{
	DBEngine dbe = new DBEngine("efan",false);
	String sql="select ott_app.*,ott_channel_app_rel.app_weight " +
			"from ott_app ,ott_channel_app_rel " +
			"where " +
			" ott_app.pub_status = 'P' " +
			"  and ott_app.id = ott_channel_app_rel.app_id" +
			" and ott_channel_app_rel.channel_id = '"+user_id+"'";
	CachedRowSet rs = dbe.executeQuery(sql);
	while (rs.next())
	{
		Map sub_map = new HashMap();
		sub_map.put("id", rs.getString("id"));
		sub_map.put("name", rs.getString("name"));
		sub_map.put("poster_url", rs.getString("poster_url"));
		int count = Integer.valueOf(rs.getString("app_weight")).intValue();
		sub_map.put("app_weight", count);
		//System.out.println(sub_map.get("name"));
		if(count!=0){
			list.add(sub_map);
		}	
	}
}
catch (Exception e)
{
	e.printStackTrace();
}
%>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="shortcut icon" href="../favicon.ico">
<link rel="stylesheet" href="googleaps.css">
<link rel="stylesheet" href="../css/themes/default/jquery.mobile-1.4.5.min.css">
<link rel="stylesheet" href="../_assets/css/jqm-demos.css">
<script src="../js/jquery.js"></script>
<script src="../_assets/js/index.js"></script>
<script src="../js/jquery.mobile-1.4.5.min.js"></script>
<script  type="text/javascript">

$( document ).on( "pagecreate", "#demo-page", function() {

	// Swipe to remove list item
	 $( document ).on( "swipeleft swiperight", "#list li", function( event ) {
		var listitem = $( this ),
			// These are the classnames used for the CSS transition
			dir = event.type === "swipeleft" ? "left" : "right",
			// Check if the browser supports the transform (3D) CSS transition
			transition = $.support.cssTransform3d ? dir : false;
			//alert(listitem.children("input")[0].value);
			confirmAndDelete( listitem, transition ,listitem.children("input")[0].value);
	}); 

	// If it's not a touch device...
	if ( ! $.mobile.support.touch ) {

		// Remove the class that is used to hide the delete button on touch devices
		$( "#list" ).removeClass( "touch" );

		// Click delete split-button to remove list item
		$( ".delete" ).on( "click", function() {
			var listitem = $( this ).parent( "li" );

			confirmAndDelete( listitem );
		});
	}
	function confirmAndDelete( listitem, transition ,coupon_id) {
		// Highlight the list item that will be removed
		listitem.children( ".ui-btn" ).addClass( "ui-btn-active" );
		// Inject topic in confirmation popup after removing any previous injected topics
		$( "#confirm .topic" ).remove();
		listitem.find( ".topic" ).clone().insertAfter( "#question" );
		// Show the confirmation popup
		$( "#confirm" ).popup( "open" );
		// Proceed when the user confirms
		$( "#confirm #yes" ).on( "click", function() {
			// Remove with a transition
			if ( transition ) {
				$.post(
			        '/webs/coupon/checkset',
			        {	
			        	machine_product_id : "<%=mechine_id%>",
			        	user_id :"<%=user_id%>",
			        	coupon_id : coupon_id
			        },
			        function(data) {
			        	console.log("/webs/coupon/checkset-->>>");
			        	console.log(data);
			        	if(data=="OK"){//返回成功,
			        		//调用出货接口
			        		alert("已经出货请在机器口等待");
			        		//window.location.reload();
			        		window.location.href="/webs/success.html"; 
			        		return false;
			        		// window.location.href="success.html"; 
			        	}else if(data=="-2"){
			        		alert("已经出货.");//，如果出现问题，请给二维码拍照，以便退款
			        	}else{
			        		alert("网络问题，请稍后重试");
			        	}
			        }
			     );
				listitem
					// Add the class for the transition direction
					.addClass( transition )
					// When the transition is done...
					.on( "webkitTransitionEnd transitionend otransitionend", function() {
						// ...the list item will be removed
						listitem.remove();
						// ...the list will be refreshed and the temporary class for border styling removed
						$( "#list" ).listview( "refresh" ).find( ".border-bottom" ).removeClass( "border-bottom" );
					})
					// During the transition the previous button gets bottom border
					.prev( "li" ).children( "a" ).addClass( "border-bottom" )
					// Remove the highlight
					.end().end().children( ".ui-btn" ).removeClass( "ui-btn-active" );
			}
			// If it's not a touch device or the CSS transition isn't supported just remove the list item and refresh the list
			else {
				listitem.remove();
				$( "#list" ).listview( "refresh" );
			}
		});
		// Remove active state and unbind when the cancel button is clicked
		$( "#confirm #cancel" ).on( "click", function() {
			listitem.children( ".ui-btn" ).removeClass( "ui-btn-active" );
			$( "#confirm #yes" ).off();
		});
	}
});

</script>
</head>
<body>
<div data-role="page" id="demo-page" data-title="向左滑动使用优惠券" data-url="demo-page">
    <div data-role="header" data-position="fixed" data-theme="b">
        <h1>向左滑动使用优惠券</h1>
        <a href="#demo-intro" data-rel="back" data-icon="carat-l" data-iconpos="notext">Back</a>
        <a href="#" onclick="window.location.reload()" data-icon="back" data-iconpos="notext">Refresh</a>
    </div><!-- /header -->
    <div role="main" class="ui-content">
        <ul id="list" class="touch" data-role="listview" data-icon="false" data-split-icon="add">
        	<%if(list.size()==0) {%>
            <li>
                <a href="#demo-mail">
                    <h3>您还没有优惠券哦</h3>
                    <p class="topic"><strong></strong></p>
                    <p></p>
                    <p class="ui-li-aside"><strong>4:48</strong>PM</p>
                </a>
                <a href="#" class="delete">Delete</a>
            </li>  
	        <%
        	}
	        for(int i=0;i<list.size();i++){
	        	Map thisMap=(Map)list.get(i);
	        %>
	        <li id='<%=thisMap.get("id") %>'>
	        	<input type="hidden" value="<%=thisMap.get("id") %>" />
	        	<a href="#demo-mail">
                    <h3>优惠券</h3>
                    <p class="topic"><strong><%=thisMap.get("name") %></strong></p>
                    <p> 数量：<%=thisMap.get("app_weight") %></p>
                    <p class="ui-li-aside"><strong>优惠券ID:</strong><%=thisMap.get("id") %></p>
                </a>
                <a href="#" class="delete">Delete</a>
	        </li>
	        <%
	        }
	        %>
        </ul>
        
    </div><!-- /content -->
    <div id="confirm" class="ui-content" data-role="popup" data-theme="a">
        <p id="question">您想使用这张优惠券么:</p>
        <div class="ui-grid-a">
            <div class="ui-block-a">
                <a id="yes" class="ui-btn ui-corner-all ui-mini ui-btn-a" data-rel="back">使用</a>
            </div>
            <div class="ui-block-b">
                <a id="cancel" class="ui-btn ui-corner-all ui-mini ui-btn-a" data-rel="back">不</a>
            </div>
        </div>
    </div><!-- /popup -->
</div>
</body>
</html>