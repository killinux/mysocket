package com.hao;

import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.Writer;
import java.net.Socket;

public class Client {
	public static void main(String args[]) throws Exception {
		String host = "127.0.0.1";//"182.254.155.153";
		int port = 8080;
		Socket client = new Socket(host, port);
		Writer writer = new OutputStreamWriter(client.getOutputStream());
		writer.write("Hello Server hah.");
		writer.write("eof");
		writer.flush();
		Reader reader = new InputStreamReader(client.getInputStream());
		char chars[] = new char[64];
		int len;
		StringBuffer sb = new StringBuffer();
		String temp;
		int index;
		while ((len = reader.read(chars)) != -1) {
			temp = new String(chars, 0, len);
			if ((index = temp.indexOf("eof")) != -1) {
				sb.append(temp.substring(0, index));
				break;
			}
			sb.append(new String(chars, 0, len));
		}
		System.out.println("from server: " + sb);
		writer.close();
		reader.close();
		client.close();
	}
	/*public static void main(String args[]) throws Exception {
		System.out.println("Start client");
		String host = "127.0.0.1"; 
		int port = 8899; 
		Socket client = new Socket(host, port);
		Writer writer = new OutputStreamWriter(client.getOutputStream());
		writer.write("Hello Server.");
		writer.flush();
		Reader reader = new InputStreamReader(client.getInputStream());
		char chars[] = new char[64];
		int len;
		StringBuffer sb = new StringBuffer();
		while ((len = reader.read(chars)) != -1) {
			sb.append(new String(chars, 0, len));
		}
		System.out.println("from server: " + sb);
		writer.close();
		reader.close();
		client.close();
	}*/
/*public static void main(String args[]) throws Exception {
	String host = "127.0.0.1"; 
	int port = 8899; 
	Socket client = new Socket(host, port);
	Writer writer = new OutputStreamWriter(client.getOutputStream());
	writer.write("Hello Server.");
	writer.flush();
	writer.close();
	client.close();
}*/
}
