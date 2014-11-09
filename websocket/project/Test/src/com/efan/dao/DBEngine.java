package com.efan.dao;

import com.qq.jutil.string.StringUtil;
//import com.qq.jutil.j4log.Logger;
import com.qq.jutil.common.CongfigResource;

import java.sql.*;
import java.util.*;

import java.util.logging.Logger;
import java.util.regex.*;
import javax.sql.DataSource;
import javax.sql.rowset.CachedRowSet;
import javax.naming.Context;
import javax.naming.InitialContext;
import com.sun.rowset.CachedRowSetImpl;
import javax.xml.parsers.*;
import org.w3c.dom.*;
import java.io.InputStream;

/**
 * 数据库操作类
 * 所有连接必须在classpath下的dbconfig.xml里配置才可使用
 * <p>
 * dbconfig.xml配置例子：<br/>
 *&lt;dbconfig&gt;<br/>
 *&lt;connection name="db_wrp"&gt;&nbsp;&nbsp;//连接名<br/>
 *&nbsp;&lt;type value="DataSource" /&gt;&nbsp;&nbsp;//连接类型:通过数据源连接<br/>
 *&nbsp;&lt;data-source-name value="jdbc/db_wrp" /&gt;&nbsp;&nbsp;//数据源名<br/>
 *&lt;/connection&gt;<br/><br/>
 *&lt;connection name="db_wrp_local"&gt;//连接名<br/>
 *&nbsp;&lt;type value="DirectConnect" /&gt;&nbsp;&nbsp;//连接类型:每次直接连接<br/>
 *&nbsp;&lt;host value="172.18.xx.xx" /&gt;&nbsp;&nbsp;//数据库服务器ip<br/>
 *&nbsp;&lt;user value="stone" /&gt;&nbsp;&nbsp;//用户名<br/>
 *&nbsp;&lt;password value="769394" /&gt;&nbsp;&nbsp;//密码<br/>
 *&nbsp;&lt;db value="db_wrp" /&gt;&nbsp;&nbsp;//默认连接数据库<br/>
 *&lt;/connection&gt;<br/><br/>
 *&lt;connection name="db_wrp_proxool"&gt;&nbsp;&nbsp;//连接名<br/>
 *&nbsp;&lt;type value="Proxool" /&gt;&nbsp;&nbsp;//连接类型:通过Proxool连接池连接<br/>
 *&nbsp;&lt;host value="172.18.xx.xx" /&gt;<br/>
 *&nbsp;&lt;user value="stone" /&gt;<br/>
 *&nbsp;&lt;password value="769394" /&gt;<br/>
 *&nbsp;&lt;db value="db_wrp" /&gt;<br/>
 *&nbsp;&lt;maximum-connection-count value="500" /&gt;&nbsp;&nbsp;//连接池最大连接数<br/>
 *&nbsp;&lt;maximum-connection-lifetime value="3600000" /&gt;&nbsp;&nbsp;//连接生存最长时间，单位为秒<br/>
 *&nbsp;&lt;minimum-connection-count value="100" /&gt;&nbsp;&nbsp;//最小连接数<br/>
 *&lt;/connection&gt;<br/>
 *<br/>
 *&lt;connection&nbsp;name="conn_mobile"&gt;<br/>
 *&nbsp;&lt;type&nbsp;value="mapping"&nbsp;/&gt;<br/>
 *&nbsp;&lt;map&nbsp;value="db_wrp"&nbsp;/&gt;//映射到连接名为db_wrp的连接<br/>
 *&nbsp;&lt;db&nbsp;value="test"&nbsp;/&gt;//默认使用的db<br/>
 *&lt;/connection&gt;<br/>
 *&lt;/dbconfig&gt;<br/> 
 * </p>
 * @author stonexie
 *
 */
public class DBEngine 
{
	public static final String CONN_BY_DIRECTCONNECT = "DirectConnect";
	public static final String CONN_BY_DATASOURCE = "DataSource";
	public static final String CONN_BY_PROXOOL = "Proxool";
	public static final String CONN_BY_MAPPING = "mapping";
	
	private static final long SLOW_TIME = 1000;
    
	private static Logger dbLogger = Logger.getLogger("jutil_db");
   	private static HashMap<String,DataSource> DS_MAP = new HashMap<String,DataSource>();;
    private static HashMap<String,Properties> DB_CONFIG_MAP = new HashMap<String,Properties>();
    private static HashMap<String,Properties> PROXOOL_CONFIG_MAP = new HashMap<String,Properties>();
    private static final String DB_CONFIG_FILE = "dbconfig.xml";
    
    /** 数据库连接 */
    private Connection connection = null;
    private boolean isKeepConn = false;
    private String connName = null;
    
    static
    {     
    	init(); 
    }    
    
    /**
     * 构造函数
     * 如果isKeepConn为true必须在使用完后调用close方法释放Connection对像
     * @param connName 数据库连接名
     * @throws SQLException
     */
    public DBEngine(String connName, boolean isKeepConn)
    {
        this.isKeepConn = isKeepConn;
        this.connName = connName;
        if(isKeepConn)       //在类中保持连接，需手动关闭
        {
            try
            {
                this.connection = getConnection(connName);
            }
            catch(Exception e){}
        }
    }
    
    
    //------------- executeQuery 
    /**
     * 执行查询操作并返回结果集
     * @param sql 要执行的查询SQL
     * @return CachedRowSet 结果集
     * @throws SQLException
     */
    public CachedRowSet executeQuery(String sql) throws SQLException
    {
        Connection conn = null;
        Statement stmt = null;
        ResultSet rs = null;
        if(this.isKeepConn)     //保持连接，直接取类中的
        {
            conn = this.connection;
        }
        else    //每次重新去取一个
        {
            conn = DBEngine.getConnection(this.connName);
        }
        
        try
        {
            long tt = System.currentTimeMillis();
        	stmt = conn.createStatement();
            rs = stmt.executeQuery(sql);
            CachedRowSetImpl crs = new CachedRowSetImpl();
            crs.populate(rs);
            if(System.currentTimeMillis() - tt > SLOW_TIME)
            {
            	dbLogger.info("Slow executeQuery:"+ sql +"\t"+ (System.currentTimeMillis() - tt));
            }
            else if(true)
            {
            	dbLogger.info("executeQuery:" + sql);
            }
            return crs;
        }
        catch(SQLException e)
        {
            throw e;
        }
        finally
        {
            try
            {
                if(rs != null) rs.close(); 
                if(stmt != null) stmt.close();
            }
            catch(SQLException e)
            {
            	throw e;
            }
            finally
            {
                //若不是在类中keep着连接，则关闭
                if(!this.isKeepConn)
                {
                    if(conn != null) conn.close();
                }
            }
        }
    }
    
    //------------- executeUpdate
    /**
     * 执行更新数据库操作
     * @param sql 要执行的更新数据库SQL
     * @return int 执行后影响的记录数
     * @throws SQLException
     */
    public int executeUpdate(String sql) throws SQLException
    {
        Connection conn = null;
        Statement stmt = null;
        if(this.isKeepConn)     //保持连接，直接取类中的
        {
            conn = this.connection;
        }
        else    //每次重新去取一个
        {
            conn = DBEngine.getConnection(this.connName);
        }
        
        try
        {
        	long tt = System.currentTimeMillis();
        	stmt = conn.createStatement();
            if(System.currentTimeMillis() - tt > SLOW_TIME)
            {
            	dbLogger.info("Slow executeUpdate:"+ sql +"\t"+ (System.currentTimeMillis() - tt));
            }        	
            return stmt.executeUpdate(sql);
        }
        catch(SQLException e)
        {
            throw e;
        }
        finally
        {
            try
            {
                if(stmt != null) stmt.close();
            }
            catch(SQLException e)
            {
            	throw e;
            }
            finally
            {
                //若不是在类中keep着连接，则关闭
                if(!this.isKeepConn)
                {
                    if(conn != null) conn.close();
                }
            }
        }
    }
    
    //  ------------- insertFetchId    
    /**
     * 执行insert操作并返回,insert进去记录的id
     * 数据表必须要有auto-increment字段作为id
     * @param sql 要执行的insert SQL
     * @return int insert后记录的id
     * @throws SQLException
     */
    public int insertFetchId(String sql) throws SQLException
    {
        Connection conn = null;
        Statement stmt = null;
        ResultSet rs = null;
        
        if(this.isKeepConn)     //保持连接，直接取类中的
        {
            conn = this.connection;
        }
        else    //每次重新去取一个
        {
            conn = DBEngine.getConnection(this.connName);
        }
        
        try
        {
        	long tt = System.currentTimeMillis();
        	stmt = conn.createStatement();
            int result = stmt.executeUpdate(sql);
            int id = -1;
            if(result > 0)
            {
                String sqlStr = "select last_insert_id() as id";
                rs = stmt.executeQuery(sqlStr);
                if(rs.next())
                {
                    id = rs.getInt("id");
                }
            }
            if(System.currentTimeMillis() - tt > SLOW_TIME)
            {
            	dbLogger.info("Slow insertFetchId:"+ sql +"\t"+ (System.currentTimeMillis() - tt));
            }              
            return id;
        }
        catch(SQLException e)
        {
            throw e;
        }
        finally
        {
            try
            {
                if(rs != null) rs.close();
                if(stmt != null) stmt.close();
            }
            catch(SQLException e)
            {
            	throw e;
            }
            finally
            {
                //若不是在类中keep着连接，则关闭
                if(!this.isKeepConn)
                {
                    if(conn != null) conn.close();
                }
            }
        }
    }
    
    /**
     * 执行查询操作并返回分页结果集
     * @param sql 要执行的查询SQL
     * @param pageSize 结果集每页大小
     * @param pageNo 结果集页码
     * @return ResultPage
     * @throws SQLException     * 
     */    
    public ResultPage queryPage(String sql,int pageSize,int pageNo) throws SQLException
    {
        Connection conn = null;
        Statement stmt = null;
        ResultSet rs = null;
        
        if(this.isKeepConn)     //保持连接，直接取类中的
        {
            conn = this.connection;
        }
        else    //每次重新去取一个
        {
            conn = DBEngine.getConnection(this.connName);
        }
        
    	ResultPage rsPage = null; 
		pageNo = pageNo > 0 ? pageNo : 1;
		try
	    {		   				
			long tt = System.currentTimeMillis();
			int oBegin,oEnd;
			String regEx = ".*\\s+limit\\s+(\\d+)\\s*,?\\s*(\\d*).*";
			Pattern pt = Pattern.compile(regEx,Pattern.CASE_INSENSITIVE);
			Matcher mc = pt.matcher(sql);
			boolean isContainLimit = false;
			if(mc.find())
		    {
		    	isContainLimit = true;	
		    }
			if(isContainLimit)
			{
				if(!mc.group(2).equals(""))
				{
					oBegin = Integer.parseInt(mc.group(1));
					oEnd = oBegin + Integer.parseInt(mc.group(2));
				}
				else
				{
					oBegin = 0;
					oEnd = Integer.parseInt(mc.group(1));	
				}													
			}
			else
			{
					oBegin = 0;
					oEnd = Integer.MAX_VALUE;	
			}   
			int begin = (oBegin + (pageNo - 1) * pageSize) > oEnd ? oEnd : (oBegin + (pageNo - 1) * pageSize);
			int distinct = oEnd - (oBegin + pageNo * pageSize);
			int offset = (distinct >= 0 ? pageSize : (oEnd - begin));	 		
			
			regEx = "^\\s*select\\s+";
			pt = Pattern.compile(regEx,Pattern.CASE_INSENSITIVE);
			mc = pt.matcher(sql);
			sql = mc.replaceFirst("select SQL_CALC_FOUND_ROWS ");
			
			//sql = sql.replaceFirst("^\\s*select\\s+","select SQL_CALC_FOUND_ROWS ");
			if(isContainLimit)
		    {
				regEx = "(.*)\\s+limit\\s+(\\d+)\\s*,?\\s*(\\d*)$";
				pt = Pattern.compile(regEx,Pattern.CASE_INSENSITIVE);
				mc = pt.matcher(sql);	
				sql = mc.replaceAll("$1 limit " + begin + "," + offset);
		    	//sql = sql.replaceAll("(.*)\\s+limit\\s+(\\d+)\\s*,?\\s*(\\d*)$","$1 limit " + begin + "," + offset);
		    }
		    else
		    {
		    	sql = sql + " limit " + begin + "," + offset;	
		    }
			if(offset > 0)
			{//如果offset=0,就不查数据了
		    	stmt = conn.createStatement();
		    	rs = stmt.executeQuery(sql);
				CachedRowSetImpl record = new CachedRowSetImpl();
				record.populate(rs);
				rs = stmt.executeQuery("select found_rows() as ct");
				int totalRecord = 0;
				if(rs.next())
				{
					totalRecord = rs.getInt("ct");
				}
				rsPage = new ResultPage(record,totalRecord,pageSize,pageNo);
			}
            if(System.currentTimeMillis() - tt > SLOW_TIME)
            {
            	dbLogger.info("Slow queryPage:"+ sql +"\t"+ (System.currentTimeMillis() - tt));
            }  			
            return rsPage;
	    }
	    catch (SQLException e) 
	    {
	    	dbLogger.info("DBEngine.queryPage error: "+e);
	    	throw new SQLException("An error occur when queryPage.Error:"+ e.toString());
        }
        finally
        {
            try
            {
                if(rs != null) 
                	rs.close();
                if(stmt != null) 
                	stmt.close();
            }
            finally
            {
                //若不是在类中keep着连接，则关闭
                if(!this.isKeepConn)
                {
                    if(conn != null) 
                    	conn.close();
                }
            }
        }
    	
    }    

    public int[] executeBatch(String[] sql) throws SQLException
    {
        if(sql == null) 
        {
        	return null;
        }
        int[] result = new int[sql.length];
    	Connection conn = null;
        Statement stmt = null;
        
        if(this.isKeepConn)     //保持连接，直接取类中的
        {
            conn = this.connection;
        }
        else    //每次重新去取一个
        {
            conn = DBEngine.getConnection(this.connName);
        }   
		try
	    {	        
			stmt = conn.createStatement();
			for (int i = 0; i < sql.length; i++) 
	        {
	        	stmt.addBatch(sql[i]);
			}
	        result = stmt.executeBatch();
	    }
	    catch (SQLException e) 
	    {
	    	dbLogger.info("DBEngine.executeBatch error: "+ e);
	    	throw new SQLException("An error occur when executeBatch.Error:"+ e.toString());
        }
        finally
        {
            try
            {
                if(stmt != null) stmt.close();
            }
            catch(SQLException e)
            {
            	throw e;
            }
            finally
            {
                //若不是在类中keep着连接，则关闭
                if(!this.isKeepConn)
                {
                    if(conn != null) conn.close();
                }
            }
        }	
        return result;
    }
    
    /**
     * 关闭数据库连接
     * 如果isKeepConn为true必须在最后调用此方法释放Connection
     */
    public void close()
    {
    	if(this.connection != null)
    	{
    		try
			{
    			this.connection.close();
			}
    		catch (SQLException e)
			{
    			dbLogger.info(e.toString());
			}
    	}
    }
    
    /**
     * 获取数据库连接
     * @param name
     * @return Connection
     * @throws SQLException
     */
    public static Connection getConnection(String name) throws SQLException
    {
        try
        {
            long t1 = System.currentTimeMillis();
            Connection conn = null;
            String type = "unknow";
            if(!DB_CONFIG_MAP.containsKey(name))
		    {
		    	dbLogger.info("No connection named:"+ name);
		    	throw new SQLException("No connection named:"+ name);
		    }
		    else
		    {    	
		    	Properties pro = DB_CONFIG_MAP.get(name);
	            type = (String)pro.get("type");		
	            //System.out.println(type);
		    	if(CONN_BY_DATASOURCE.equalsIgnoreCase(type))
			    {
			    	conn = getConnectionByDataSource(pro);	
			    }
			    else if(CONN_BY_DIRECTCONNECT.equalsIgnoreCase(type))
				{
			    	conn = directGetConnect(pro);						 	
				}
			    else if(CONN_BY_PROXOOL.equalsIgnoreCase(type))
				{
			    	conn = getConnectionByProxool(pro);					 	
				}	
			    else if(CONN_BY_MAPPING.equalsIgnoreCase(type))
				{
			    	conn = getConnectionByMapping(pro);					 	
				}			    	
				else
				{
					conn = null;	
				}
		    }
            long t2 = System.currentTimeMillis();
            String remark = (t2 - t1) > SLOW_TIME ? "\t Slow getConnection" : "";
            dbLogger.info(type + "\t"+ name +"\t"+ (t2 - t1) +"\t"+ remark);
            return conn;
        }
        catch(SQLException sqle)
        {
        	throw sqle;
        }
        catch(Exception e)
        {
            dbLogger.info("GetConn error"+e);
            return null;
        }
    }
	
    private static Connection getConnectionByDataSource(Properties pro) throws SQLException
    {
    	try 
	    {
	    	String ds_name = (String)pro.get("data-source-name");
	    	if(DS_MAP.containsKey(ds_name))
		    {
		    	DataSource ds = DS_MAP.get(ds_name);
		    	return ds.getConnection();
		    }
		    else
		    {
				Context env = (Context) new InitialContext().lookup("java:comp/env");
				DataSource ds = (DataSource) env.lookup(ds_name);	    	
				if(ds == null)
				{
					dbLogger.info("Get connection by DataSource.DataSource is null!");
					return null;
				}
				else
				{
					DS_MAP.put(ds_name,ds);
				}
				return ds.getConnection();	    	 
		    }	    	
	    }
	    catch(SQLException sqlE) 
	    {
	    	dbLogger.info("DBEngine.getConnectionByDataSource error: "+ sqlE);
	    	throw sqlE;
	    }
	    catch(javax.naming.NamingException nameE)
	    {
	    	dbLogger.info("DBEngine.getConnectionByDataSource error: "+nameE);
	    	throw new SQLException("Cant not find datesource!");
	    }
    }
    
    private static Connection directGetConnect(Properties pro) throws SQLException
    {
    	try 
	    {
			String dbURL = (String) pro.get("url");	
			//System.out.println(dbURL);
			return DriverManager.getConnection(dbURL);	    		    	
	    }
	    catch (SQLException e)
	    {
	    	dbLogger.info("DBEngine.directGetConnect error: "+ e);
	    	throw new SQLException("Direct get connection fail!");
	    }
    }	
    
    private static Connection getConnectionByProxool(Properties pro) throws SQLException
    {
    	String dbUrl = pro.getProperty("url");
    	Properties info = new Properties();
    	String name = pro.getProperty("name");
    	if(PROXOOL_CONFIG_MAP.containsKey(name))
    	{
    		info = PROXOOL_CONFIG_MAP.get(name);
    	}
    	else
    	{
	      	info.setProperty("proxool.maximum-connection-count", pro.getProperty("maximum-connection-count"));
			info.setProperty("proxool.maximum-connection-lifetime", pro.getProperty("maximum-connection-lifetime"));
			info.setProperty("proxool.minimum-connection-count",pro.getProperty("minimum-connection-count"));
			info.setProperty("proxool.house-keeping-test-sql", "select CURRENT_DATE");
			PROXOOL_CONFIG_MAP.put(name,info);
    	}
		Connection conn = DriverManager.getConnection(dbUrl,info);		
    	return conn;
    }
    
    private static Connection getConnectionByMapping(Properties pro) throws SQLException
    {
    	try 
	    {//System.out.println("getConnectionByMapping");
        	String mapDest = pro.getProperty("map");		
        	String db = pro.getProperty("db");
        	Connection conn = DBEngine.getConnection(mapDest);
        	//conn.createStatement().execute("use "+ db);
        	conn.setCatalog(db);
        	return conn;	    		    	
	    }
	    catch (SQLException e) 
	    {
	    	dbLogger.info("DBEngine.getConnectionByMapping error: "+e);
	    	throw new SQLException("Get connection by mapping fail!");
	    } 
    }    
    
    private static void init()
    {
    	try
    	{
    	  	//System.out.println("init DBEngine...");
    	  	boolean hasDirectConnect = false;
    	  	boolean hasProxool = false;

    		DocumentBuilderFactory docBuilderFactory = DocumentBuilderFactory.newInstance();
    		DocumentBuilder builder = docBuilderFactory.newDocumentBuilder(); 
    		InputStream in = CongfigResource.loadConfigFile(DB_CONFIG_FILE, DBEngine.class);
    		Document doc = builder.parse(in);
    		Element root = doc.getDocumentElement();
    		NodeList nodeList = root.getElementsByTagName("connection");
    		for (int i = 0; i < nodeList.getLength(); i++)
    		{//System.out.println("cc");
    			Element node = (Element) nodeList.item(i);
    			String name = node.getAttribute("name");
    			//System.out.println(name);
    			String type = getChildAttr(node,"type");
    			if(name == null)
    			{
    				dbLogger.info("DB confige name is null");
    				continue;
    			}
    			if(CONN_BY_DATASOURCE.equalsIgnoreCase(type))
    			{
	    	    	Properties pro = new Properties();
	    			String data_source_name = getChildAttr(node,"data-source-name");
	    			if(data_source_name == null || data_source_name.length() == 0)
	    			{
	    				dbLogger.info("DataSource confige \""+ name +"\":DataSource name is null.");
	    				continue;        	    				
	    			}
	    			else
	    			{
	    				data_source_name = data_source_name.trim();
	    				pro.put("name",name);
	    				pro.put("type",CONN_BY_DATASOURCE);        	    				
	    				pro.put("data-source-name",data_source_name);
	    				DB_CONFIG_MAP.put(name,pro);
	    				//System.out.println("DB confige name:"+ name + "\nType:"+ CONN_BY_DATASOURCE +"\nData source name:"+ data_source_name);
	    				dbLogger.info("DB confige name:"+ name + "\nType:"+ CONN_BY_DATASOURCE +"\nData source name:"+ data_source_name);
	    			}
    			}
    			else if(CONN_BY_DIRECTCONNECT.equalsIgnoreCase(type))
    			{   
	    	    	Properties pro = new Properties();
	    	    	String dburl = getChildAttr(node, "dburl");
	    	    	if (dburl == null) {
		    			String host = StringUtil.convertString(getChildAttr(node,"host"),"localhost");
		    			int port = StringUtil.convertInt(getChildAttr(node,"port"),3306);
		    			String db = StringUtil.convertString(getChildAttr(node,"db"),"test");
		    			String user = StringUtil.convertString(getChildAttr(node,"user"),"root");
		    			String password = StringUtil.convertString(getChildAttr(node,"password"),"");
		    			String characterEncoding = StringUtil.convertString(getChildAttr(node,"characterEncoding"),"GBK");
		    			dburl = "jdbc:mysql://"+ host +":"+ port +"/"+ db+"?user="+ user +"&password="+ password +"&useUnicode=true&characterEncoding="+ characterEncoding;
	    	    	}
	    			//System.out.println(dburl);
    				dburl = dburl.trim();
    				pro.put("name",name);
    				pro.put("type",CONN_BY_DIRECTCONNECT);        	    				
    				pro.put("url",dburl);
    				DB_CONFIG_MAP.put(name,pro);  
    				//System.out.println("DB confige name:"+ name + "\nType:"+ CONN_BY_DIRECTCONNECT +"\nDB connection url:"+ dburl);
    				dbLogger.info("DB confige name:"+ name + "\nType:"+ CONN_BY_DIRECTCONNECT +"\nDB connection url:"+ dburl);
    				hasDirectConnect = true;    	    				    	    			
    			}
    			else if(CONN_BY_PROXOOL.equalsIgnoreCase(type))
    			{   
	    	    	Properties pro = new Properties();
	    			String host = StringUtil.convertString(getChildAttr(node,"host"),"localhost");
	    			int port = StringUtil.convertInt(getChildAttr(node,"port"),3306);
	    			String db = StringUtil.convertString(getChildAttr(node,"db"),"test");
	    			String user = StringUtil.convertString(getChildAttr(node,"user"),"root");
	    			String password = StringUtil.convertString(getChildAttr(node,"password"),"");
	    			String characterEncoding = StringUtil.convertString(getChildAttr(node,"characterEncoding"),"GBK");
	    			String dburl = "proxool."+ name +":org.gjt.mm.mysql.Driver:jdbc:mysql://"+ host +":"+ port +"/"+ db+"?user="+ user +"&password="+ password +"&useUnicode=true&characterEncoding="+ characterEncoding;
    				dburl = dburl.trim();
    				pro.put("name",name);
    				pro.put("type",CONN_BY_PROXOOL);        	    				
    				pro.put("url",dburl);
    				pro.put("maximum-connection-count",StringUtil.convertInt(getChildAttr(node,"maximum-connection-count"),300) + "");
    				//dafaul 1 hour
    				pro.put("maximum-connection-lifetime",StringUtil.convertInt(getChildAttr(node,"maximum-connection-lifetime"),3600) + "");
    				pro.put("minimum-connection-count",StringUtil.convertInt(getChildAttr(node,"minimum-connection-count"),100) + "");
    				DB_CONFIG_MAP.put(name,pro);  
    				//System.out.println("DB confige name:"+ name + "\nType:"+ CONN_BY_DIRECTCONNECT +"\nDB connection url:"+ dburl);
    				dbLogger.info("DB confige name:"+ name + "\nType:"+ CONN_BY_PROXOOL +"\nDB connection url:"+ dburl);
    				hasProxool = true;        	    			  	    				    	    			
    			}
    			else if(CONN_BY_MAPPING.equalsIgnoreCase(type))
    			{
    				Properties pro = new Properties();
    				String db = StringUtil.convertString(getChildAttr(node,"db"),"test");
    				String map = StringUtil.convertString(getChildAttr(node,"map"),"localhost");
    				pro.put("type",CONN_BY_MAPPING);
    				pro.put("map",map);
    				pro.put("db",db);
    				DB_CONFIG_MAP.put(name,pro);
    				//System.out.println("DB confige name:"+ name + "\nType:"+ CONN_BY_MAPPING +"\nMapping dest:"+ map);
    				dbLogger.info("DB confige name:"+ name + "\nType:"+ CONN_BY_MAPPING +"\nMapping dest:"+ map);    				
    			}
    			else
    			{
    				dbLogger.info("Wrong dbconfig type:"+ type +".All config type:DataSource/DirectConnect/");
    				continue;	
    			}	
    		}
    	  	
			if(hasDirectConnect)
			{
	    	  	try 
	    	    {
	    	  		Class.forName("org.gjt.mm.mysql.Driver");
	    	    }
	        	catch(ClassNotFoundException ce)
	        	{
	        		throw new SQLException("Can not find org.gjt.mm.mysql.Driver!");
	        	}		
			}
			if(hasProxool)
			{
	    	  	try 
	    	    {
	    	  		Class.forName("org.logicalcobwebs.proxool.ProxoolDriver");
	    	    }
	        	catch(ClassNotFoundException ce)
	        	{
	        		throw new SQLException("Can not find org.logicalcobwebs.proxool.ProxoolDriver!");
	        	}		
			}			
        	
		}
    	catch (Exception e)
    	{
    		dbLogger.info("Init DBEnine erro:"+ e.toString());
		}	
    }
    
    private static String getChildAttr(Element node, String attrName)
    {
		NodeList paraList = node.getElementsByTagName(attrName);
		if(paraList.getLength() > 0)
		{
			return ((Element) paraList.item(0)).getAttribute("value");
		}
		return null;
    }    
    
    public static void main(String[] args) 
    {
    	try 
    	{
        	DBEngine dbe = new DBEngine("efan",false);
        	CachedRowSet rs = dbe.executeQuery("select * from user");
        	while (rs.next())
        	{
        		System.out.println(rs.getString("login_name"));
			}
		}
    	catch (Exception e)
    	{
			e.printStackTrace();
		}
    	
	}
}
