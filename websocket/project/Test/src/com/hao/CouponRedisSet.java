package com.hao;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.sql.rowset.CachedRowSet;

import redis.clients.jedis.Jedis;

import com.efan.dao.DBEngine;

public class CouponRedisSet  extends HttpServlet {
	public void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		//response.setContentType("text/html;charset=GB2312"); // 这条语句指明了向客户端发送的内容格式和采用的字符编码．
		Jedis jedis = new Jedis("haoning.net",6379); //连接池略
		System.out.println("---------/coupon/check");
		try {   
			String machine_product_id = request.getParameter("machine_product_id"); 
			String user_id = request.getParameter("user_id"); 
			String coupon_id = request.getParameter("coupon_id"); 
			System.out.println("machine_product_id:"+machine_product_id);
			System.out.println("user_id:"+user_id);
			System.out.println("coupon_id:"+coupon_id);
			
			String result =null;
			if(machine_product_id==null){
				 result="0";
			}else{
				 //修改数据库 -1 操作
				 result=jedis.get(machine_product_id); 
				 if("1".equals(result)){//已经买过
					 result="-2";
				 }else{
					 result=jedis.set(machine_product_id,"1"); 
					 setCoupon(coupon_id,user_id);//todo 如果没成功的出错处理
				 }
				
				 System.out.println(result);
			}
		    try {
				response.getWriter().write(result);
				response.getWriter().flush();
			} catch (IOException e) {
				e.printStackTrace();
			}
		    
		} catch (Exception e) {  
		    e.printStackTrace();  
		} finally {  
			
		}  
	}
	private int setCoupon(String coupon_id,String user_id){
		int result=-1;
		try{
			DBEngine dbe = new DBEngine("efan",false);
			String sql="update ott_channel_app_rel set app_weight = (app_weight - 1) where app_id='"+coupon_id+"' and channel_id ='"+user_id+"'";
			System.out.println("setCoupon:"+sql);
			result = dbe.executeUpdate(sql);
			
		}
		catch (Exception e)
		{
			e.printStackTrace();
		}
		return result;
	}
	// 用于处理客户端发送的POST请求
	public void doPost(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		doGet(request, response); // 这条语句的作用是，当客户端发送POST请求时，调用doGet()方法进行处理
	}
	public static void main(String[] args) {
		Jedis jedis = new Jedis("haoning.net",6379); 
		try {   
		    String cc=jedis.set("abc", "1");  
		    System.out.println(cc);
		    String ss = jedis.get("abc");  
		    System.out.println(ss);
		} catch (Exception e) {  
		    e.printStackTrace();  
		} finally {  
			
		}  
	}

}
