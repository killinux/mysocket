package com.hao;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.StreamInbound;
import org.apache.catalina.websocket.WebSocketServlet;
import org.apache.catalina.websocket.WsOutbound;

public class LineWebSocketServlet extends WebSocketServlet {
	public static Map<String,MyMessageInbound> mmiList  = new HashMap<String,MyMessageInbound>();

	protected StreamInbound createWebSocketInbound(String subProtocol,
			HttpServletRequest arg1) {
		return new MyMessageInbound();
	}

	private class MyMessageInbound extends MessageInbound {
		WsOutbound myoutbound;
		String mykey;
		@Override
		public void onOpen(WsOutbound outbound) {
			try {
				System.out.println("Open Client.");
				this.myoutbound = outbound;
				mykey ="open "+System.currentTimeMillis();;
				mmiList.put(mykey, this);
				System.out.println("mmiList size:"+mmiList.size());
				outbound.writeTextMessage(CharBuffer.wrap(mykey));
			} catch (IOException e) {
				e.printStackTrace();
			}
		}

		@Override
		public void onClose(int status) {
			System.out.println("Close Client.");
			mmiList.remove(mykey);
		}

		@Override
		protected void onBinaryMessage(ByteBuffer arg0) throws IOException {

		}

		@Override
		protected void onTextMessage(CharBuffer message) throws IOException {
			System.out.println("LineWebSocketServlet.onTextMessage--->" + message.toString());
			for (Map.Entry<String, MyMessageInbound> entry : mmiList.entrySet()) {
				  MyMessageInbound mmib = (MyMessageInbound) entry.getValue();
	              CharBuffer buffer = CharBuffer.wrap(message);
	              mmib.myoutbound.writeTextMessage(buffer);
	              mmib.myoutbound.flush();
			}
			
		}
	}
}
