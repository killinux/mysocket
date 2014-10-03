import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.net.ServerSocket;
import java.net.Socket;
public class Server {
	public static final int PORT = 5000;
	public static void main(String[] args) {
		System.out.println("服务器...\n");
		Server ser = new Server();
		ser.sock();
	}
	public void sock() {
		try {
			ServerSocket server = new ServerSocket(PORT);
			while (true) {
				// 一旦有堵塞, 则表示服务器与客户端获得了连接
				Socket client = server.accept();
				System.out.println("server accept");
				// 处理这次连接
				new PServer(client);
			}
		} catch (Exception e) {
			System.out.println("服务器异常: " + e.getMessage());
		}
	}

	private class PServer implements Runnable {
		private Socket socket;
		public PServer(Socket sock) {
			socket = sock;
			new Thread(this).start();
		}
		public void run() {
			System.out.println("一个客户端连接ip:" + socket.getInetAddress());
			try {
				// 读取客户端数据
				DataInputStream input = new DataInputStream(
						socket.getInputStream());
				// 向客户端发送数据
				DataOutputStream out = new DataOutputStream(
						socket.getOutputStream());
				// 读取客户端数据
				//System.out.println("客户端发过来的内容: " + input.readUTF());
				byte[] bt = new byte[1024];
				int leng = input.read(bt);
				System.out.println(new String(bt, 0, leng));
				// 发送键盘输入的一行
				// String s = new BufferedReader(new
				// InputStreamReader(System.in)).readLine();
				String s = "server d shu ru";
				out.write(s.getBytes());
				out.flush();
				input.close();
				out.close();
				socket.close();
			} catch (Exception e) {
				System.out.println("服务器 run 异常: " + e.getMessage());
			}
		}

	}

}