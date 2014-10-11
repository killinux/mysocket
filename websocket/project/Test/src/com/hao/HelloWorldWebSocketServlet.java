package com.hao;

import java.io.DataInputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.Socket;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import javax.servlet.http.HttpServletRequest;

import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.StreamInbound;
import org.apache.catalina.websocket.WebSocketServlet;
import org.apache.catalina.websocket.WsOutbound;

public class HelloWorldWebSocketServlet extends WebSocketServlet {
	private static Map<String,MyMessageInbound> mmiList  = new HashMap<String,MyMessageInbound>();

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
				//mmiList.add(this);
				//Random random = new Random(100);//指定种子数100
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
			//mmiList.remove(this);
			mmiList.remove(mykey);
		}

		@Override
		protected void onBinaryMessage(ByteBuffer arg0) throws IOException {

		}

		@Override
		protected void onTextMessage(CharBuffer message) throws IOException {
			// TODO Auto-generated method stub
			System.out.println("onText--->" + message.toString());
//			for (int i=0;i< mmiList.size();i++ ) {
//				MyMessageInbound mmib = (MyMessageInbound) mmiList.get(i);
//                CharBuffer buffer = CharBuffer.wrap(message);
//                mmib.myoutbound.writeTextMessage(buffer);
//                mmib.myoutbound.flush();
//            }
			for (Map.Entry<String, MyMessageInbound> entry : mmiList.entrySet()) {
				  //System.out.println("key= " + entry.getKey() + " and value= " + entry.getValue());
				  MyMessageInbound mmib = (MyMessageInbound) entry.getValue();
				 // String str = entry.getKey()+message.toString()
	              CharBuffer buffer = CharBuffer.wrap(message);
	              mmib.myoutbound.writeTextMessage(buffer);
	              mmib.myoutbound.flush();
			}
			
			/*Socket socket;
			String msg = "";
			try {
				// 向服务器利用Socket发送信息
				socket = new Socket("192.168.0.102", 5000);
				// socket = new Socket("127.0.0.1",5000);
				PrintWriter output = new PrintWriter(socket.getOutputStream());

				output.write(message.toString());
				output.flush();

				// 这里是接收到Server的信息
				DataInputStream input = new DataInputStream(
						socket.getInputStream());
				byte[] b = new byte[1024];
				input.read(b);
				// Server返回的信息
				msg = new String(b).trim();

				output.close();
				input.close();
				socket.close();
			} catch (UnknownHostException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();
			}
			// 往浏览器发送信息
			CharBuffer cb = CharBuffer.wrap(new StringBuilder(msg));
			getWsOutbound().writeTextMessage(cb);*/
		}
	}

	public static void main(String[] args) {
		Socket socket;
		String message = "haoning";
		String msg = "";
		try {
			// 向服务器利用Socket发送信息
			socket = new Socket("192.168.0.102", 5000);
			// socket = new Socket("127.0.0.1",5000);
			PrintWriter output = new PrintWriter(socket.getOutputStream());

			output.write(message.toString());
			output.flush();

			// 这里是接收到Server的信息
			DataInputStream input = new DataInputStream(socket.getInputStream());
			byte[] b = new byte[1024];
			input.read(b);
			// Server返回的信息
			msg = new String(b).trim();

			output.close();
			input.close();
			socket.close();
		} catch (UnknownHostException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
