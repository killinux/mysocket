package com.efan.dao;

import javax.sql.rowset.CachedRowSet;
import java.io.Serializable;

/**
 * 分页后的结果集,包括结果集总记录数，总页数等信息.
 * @author stonexie
 */
@SuppressWarnings("serial")
public class ResultPage implements Serializable 
{
	/** 数据集当页记录 */
	protected CachedRowSet record;
	/** 原始数据集总记录数 */
	protected int totalRecord;
	/** 每页大小 */
	protected int pageSize;
	/** 当前页码,页码从1开始 */
	protected int pageNo;
	
	/**
	 * 无参构造函数 
	 */
	public ResultPage()
	{
		this.record = null;
		this.totalRecord = 0;
		this.pageSize = 1;
		this.pageNo = 1;
	}	
	
	/**
	 * 构造函数
	 * @param _record
	 * @param _totalRecord
	 * @param _pageSize
	 * @param _pageNo
	 */
	public ResultPage(CachedRowSet _record,int _totalRecord,int _pageSize,int _pageNo)
	{
		this.record = _record;
		this.totalRecord = _totalRecord;
		this.pageSize = _pageSize;
		this.pageNo = _pageNo;
	}
	
	/**
	 * 取得当前页结果集
	 * @return CachedRowSet
	 */
	public CachedRowSet getRecord()
	{
		return this.record;
	}
	
	/**
	 * 每页大小
	 * @return int
	 */
	public int getPageSize()
	{
		return this.pageSize;
	}
	
	/**
	 * 当前页码
	 * @return int  
	 */
	public int getPageNo()
	{
		return this.pageNo;
	}
	
	/**
	 * 取得原始结果集总页数
	 * @return int
	 */
	public int getPageCount()
	{
		return (int) Math.ceil(this.totalRecord * 1.000 / this.pageSize);	
	}
	
	/**
	 * 当前页结果集总记录数
	 * @return int 
	 */
	public int getRecordCount()
	{
		return this.record.size();	
	}
	
	/**
	 * 原始结果集总记录数
	 * @return int
	 */
	public int getTotalRecordCount()
	{
		return this.totalRecord;	
	}	
	
	/**
	 * 当前页是否有下一页
	 * @return boolean
	 */
	public boolean hasNextPage()
	{
		if(this.pageNo < getPageCount())
	    {
	    	return true;
	    }
	    else
	    {
	    	return false;
	    }
	}
	
	/**
	 * 当前页是否有上一页
	 * @return boolean
	 */
	public boolean hasPrevPage()
	{
		if(this.pageNo > 1)
	    {
	    	return true;
	    }
	    else
	    {
	    	return false;
	    }		
	}
}