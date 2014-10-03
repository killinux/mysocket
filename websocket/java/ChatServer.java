package com.hao.websocket;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.util.Set;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

public class ChatServer extends WebSocketServer {

    public ChatServer( int port ) throws UnknownHostException {
        super( new InetSocketAddress( InetAddress.getByName( "192.168.0.102" ), port ) );
    }

    public ChatServer( InetSocketAddress address ) {
        super( address );
    }

    @Override
    public void onOpen( WebSocket conn, ClientHandshake handshake ) {
        try {
            this.sendToAll( "new" );
        } catch ( InterruptedException ex ) {
            ex.printStackTrace();
        }
        System.out.println( conn + " entered the room!" );
    }

    @Override
    public void onClose( WebSocket conn, int code, String reason, boolean remote ) {
        try {
            this.sendToAll( conn + " has left the room!" );
        } catch ( InterruptedException ex ) {
            ex.printStackTrace();
        }
        System.out.println( conn + " has left the room!" );
    }

    @Override
    public void onMessage( WebSocket conn, String message ) {
        try {
            this.sendToAll( message );
        } catch ( InterruptedException ex ) {
            ex.printStackTrace();
        }
        System.out.println( conn + ": " + message );
    }


    @Override
    public void onError( WebSocket conn, Exception ex ) {
        ex.printStackTrace();
    }

    public void sendToAll( String text ) throws InterruptedException {
        Set<WebSocket> con = (Set<WebSocket>) connections();
        synchronized ( con ) {
            for( WebSocket c : con ) {
                c.send( text );
            }
        }
    }
    
    ///////////////////////////////////////////////////////////////////////////////////////
    public static void main( String[] args ) throws InterruptedException , IOException {
        //连接部份
        //WebSocket.DEBUG = true;
        int port = 8887;
        try {
            port = Integer.parseInt( args[ 0 ] );
        } catch ( Exception ex ) { }
        ChatServer s = new ChatServer( port );
        s.start();
        System.out.println( "ChatServer started on port: " + s.getPort() );

        //服务端 发送消息处理部份
        BufferedReader sysin = new BufferedReader( new InputStreamReader( System.in ) );
        while ( true ) {
            String in = sysin.readLine();
            s.sendToAll( in );
        }
    }

}


