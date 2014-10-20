package com.hao;

import java.io.IOException;
import java.io.PrintWriter;
import java.nio.CharBuffer;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.StreamInbound;
import org.apache.catalina.websocket.WebSocketServlet;
import org.apache.catalina.websocket.WsOutbound;

public class SocketManager extends HttpServlet {
	public void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		response.setContentType("text/html;charset=GB2312"); // 这条语句指明了向客户端发送的内容格式和采用的字符编码．
		/*PrintWriter out = response.getWriter();
		out.println("HelloWorldWebSocketServlet:"+HelloWorldWebSocketServlet.mmiList.size()+" "); // 利用PrintWriter对象的方法将数据发送给客户端
		for (Map.Entry entry : HelloWorldWebSocketServlet.mmiList.entrySet()) {
			String key= (String) entry.getKey();
			out.println(key);
		}
		out.println("LineWebSocketServlet:"+LineWebSocketServlet.mmiList.size()+" "); // 利用PrintWriter对象的方法将数据发送给客户端
		for (Map.Entry entry : LineWebSocketServlet.mmiList.entrySet()) {
			String key= (String) entry.getKey();
			out.println(key);
		}
		out.close();*/
	}

	// 用于处理客户端发送的POST请求
	public void doPost(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		doGet(request, response); // 这条语句的作用是，当客户端发送POST请求时，调用doGet()方法进行处理
	}
}
