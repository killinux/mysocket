package com.efan.dao;


/**
 * 获取DBEngin实例的工厂类.
 * @author stonexie
 */
public class DBFactory 
{   
    /**
     * 获取普通的DBEngine，可直接使用，无需手动释放连接
     * @param connName  配置的名字
     * @return  该配置的DBEngine
     */
    public static DBEngine getDBEngine(String connName)
    {
        DBEngine dbengine = new DBEngine(connName, false);
        return dbengine;
    }
    
    /**
     * 获取保持连接的DBEngine，在使用之后，需要设用DBEngine的close方法手动释放连接，用于在同一时刻需要
     * 执行多句SQL语句的时候，以提高效率
     * @param connName  配置的名字
     * @return  该配置的DBEngine（保持连接的）
     */
    public static DBEngine getKeepConnDBEngine(String connName)
    {
        DBEngine dbengine = new DBEngine(connName, true);
        return dbengine;
    }
}
