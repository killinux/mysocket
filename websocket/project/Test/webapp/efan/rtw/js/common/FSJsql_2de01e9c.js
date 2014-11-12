(function(window) {
    //FUNCTIONS for js
    function wrapFavorite(jsonResult) {
        this.totalRecords = jsonResult.length - 1;
        this.getRecord = function(index) {
            var record = jsonResult[index + 1];
            return {
                dataType       : "favorite",
                media_id       : record[0],
                virtual_user   : record[1],
                user_id        : record[2],
                operation_time : record[3],
                name_cn        : record[4],
                display_type   : record[5],
                ucs_status     : record[6],
                max_index      : record[7]
            };
        };
        this.wrapAll = function() {
            var len = this.totalRecords, newRet = [];
            for (var i = 0; i < len; i++) {
                newRet.push(this.getRecord(i));
            }
            return newRet;
        };
//    this.innerCursor = 0;
//    this.hasNext = function() {
//        return this.innerCursor < this.totalRecords;
//    }
//    this.next = function() {
//        var ret = this.getRecord(this.innerCursor);
//        this.innerCursor++;
//        return ret;
//    }
    }

    function wrapHistory(jsonResult) {
        this.totalRecords = jsonResult.length - 1;
        this.getRecord = function(index) {
            //check index TODO
            var record = jsonResult[index + 1];
            return {
                dataType             : "history",
                media_id             : record[0],
                name_cn              : record[1],
                display_type         : record[2],
                max_index            : record[3],
                virtual_user         : record[4],
                user_id              : record[5],
                serial_id            : record[6],
                serial_index         : record[7],
                serial_title         : record[8],
                serial_clarity       : record[9],
                serial_language      : record[10],
                play_time_in_seconds : record[11],
                operation_time       : record[12]
            };
        };
        this.wrapAll = function() {
            var len = jsonResult.length, newRet = [];
            for (var i = 1; i < len; i++) {
                newRet.push(this.getRecord(i));
            }
            return newRet;
        };
//    this.innerCursor = 0;
//    this.hasNext = function() {
//        return this.innerCursor < this.totalRecords;
//    }
//    this.next = function() {
//        var ret = this.getRecord(this.innerCursor);
//        this.innerCursor++;
//        return ret;
//    }
    }

    /**
     * 将一条记录封装成key-value形式，数据库返回的是一个数组
     * @param type
     * @param record
     * @returns {*}
     */
    function wrapRecord(type, record) {
        switch (type) {
            case 'favorite':
                return {
                    dataType       : type,
                    media_id       : record[0],
                    virtual_user   : record[1],
                    user_id        : record[2],
                    operation_time : record[3],
                    name_cn        : record[4],
                    display_type   : record[5],
                    ucs_status     : record[6],
                    max_index      : record[7]
                };
                break;
            case 'history':
                return {
                    dataType             : type,
                    media_id             : record[0],
                    name_cn              : record[1],
                    display_type         : record[2],
                    max_index            : record[3],
                    virtual_user         : record[4],
                    user_id              : record[5],
                    serial_id            : record[6],
                    serial_index         : record[7],
                    serial_title         : record[8],
                    serial_clarity       : record[9],
                    serial_language      : record[10],
                    play_time_in_seconds : record[11],
                    operation_time       : record[12]
                };
                break;
            default :
                return null;
                break;
        }
    }

    /**
     * 对于一系列的观看历史或者收藏记录，遍历封装成key-value形式
     * @param type
     * @param ret
     * @returns {Array}
     */
    function convertToKV(type, ret) {
        var len = ret.length, newRet = [];
        // 忽略第一个元素(title)
        for (var i = 1; i < len; i++) {
            newRet.push(wrapRecord(type, ret[i]));
        }
        return newRet;
    }

    // 兼容旧版本
    function getInterface() {
        return window.FsJsql || window.JSUtil;
    }

    /**
     * 从SQL中获取数据
     * @param sql
     * @returns {*}
     */
    function fsQuery(sql) {
        var UTIL = getInterface();
        if (!UTIL) {
            return [];
        }
        var ret = UTIL.query(sql, JSON.stringify(Array.prototype.slice.call(arguments, 1)));
        var parsed = JSON.parse(ret);
        return parsed;
    }

    function fsExecute(sql, params) {
        var UTIL = getInterface();
        if (!UTIL) {
            return [];
        }
        return UTIL.execute(sql, JSON.stringify(params));
    }

    /**
     * 获取所有记录数目
     * @returns {*}
     */
    function getTotalCount() {
        var sql_favorite = 'select count(*) from fsc_favorite', ret_favorite = fsQuery(sql_favorite), count_favorite = parseInt(ret_favorite[1][0]) || 0;
        var sql_history = 'select count(*) from fsc_history', ret_history = fsQuery(sql_history), count_history = parseInt(ret_history[1][0]) || 0;
        return count_favorite + count_history;
    }

    /**
     * 从sqlite中加载favorite
     * @param offset 从哪一条开始取
     * @param len 取多少个
     */
    var loadFavorites = function(offset, len) {
        var sql = 'select media_id, virtual_user, user_id, operation_time, name_cn, display_type, ucs_status, max_index from fsc_favorite order by operation_time desc limit ?, ?';
        var ret = fsQuery(sql, offset, len);
        return convertToKV('favorite', ret);
    }
    var loadFavoriteMovie = function(offset, len) {
        var sql = "select media_id, virtual_user, user_id, operation_time, name_cn, display_type, ucs_status, max_index from fsc_favorite where display_type='movie' order by operation_time desc limit ?, ?";
        var ret = fsQuery(sql, offset, len);
        return convertToKV('favorite', ret);
    }
    var getFavoriteMovieCount = function() {
        var sql = "select count(*) from fsc_favorite where display_type='movie'";
        var ret = fsQuery(sql);
        return parseInt(ret[1][0]) || 0;
    }
    var loadFavoritNotMovie = function(offset, len) {
        var sql = "select media_id, virtual_user, user_id, operation_time, name_cn, display_type, ucs_status, max_index from fsc_favorite where display_type!='movie' order by operation_time desc limit ?, ?";
        var ret = fsQuery(sql, offset, len);
        return convertToKV('favorite', ret);
    }
    var getFavoriteNotMovieCount = function() {
        var sql = "select count(*) from fsc_favorite where display_type<>'movie'";
        var ret = fsQuery(sql);
        return parseInt(ret[1][0]) || 0;
    }
    var getFavStatus = function(media_id) {
        var sql = 'select media_id, virtual_user, user_id, operation_time, name_cn, display_type, ucs_status, max_index from fsc_favorite where media_id=?';
        var ret = fsQuery(sql, media_id);
        return convertToKV('favorite', ret);
    }
    var unsetFavorite = function(media_id) {
        var sql = 'delete from fsc_favorite where media_id = ?';
        var param = [media_id];
        return fsExecute(sql, param);
    }
    var setFavorite = function(media_id, name_cn, display_type, options) {
        var max_index = options && options.max_index || 0;
        var virtual_user = options && options.virtual_user || 0;
        var user_id = options && options.user_id || 0;
        var ucs_status = options && options.ucs_status || 0;
        //FIXME check media_id/name_cn/display_type/max_index is valid value
        var sql = "insert or replace into fsc_favorite(media_id, virtual_user, user_id, operation_time, name_cn, display_type, ucs_status, max_index)values(?, ?, ?, ?, ?, ?, ?, ?)";
        var param = [
            media_id + "", virtual_user + "", user_id + "", Math.floor(new Date().getTime() / 1000) + "", name_cn + "", display_type + "", ucs_status + "", max_index + ""
        ];
        return fsExecute(sql, param);
    };
    var loadHistorys = function(offset, len) {
        var sql = "select media_id, name_cn, display_type, max_index, virtual_user, user_id, " + "serial_id, serial_index, serial_title, serial_clarity, serial_language, " + "play_time_in_seconds, operation_time from fsc_history order by operation_time desc limit ?, ?";
        var ret = fsQuery(sql, offset, len);
        return convertToKV('history', ret);
    };
    var getHistory = function(media_id) {
        var sql = "select media_id, name_cn, display_type, max_index, virtual_user, user_id, serial_id, serial_index, serial_title, serial_clarity, serial_language, play_time_in_seconds, operation_time from fsc_history where media_id=" + media_id;
        var ret = fsQuery(sql);
        return convertToKV('history', ret);
    }
    var getHistoryCount = function() {
        var sql = "select count(*) from fsc_history";
        var ret = fsQuery(sql);
        return parseInt(ret[1][0]) || 0;
    }
    var mergeTopN = function(topN) {
    var history = loadHistorys(0, topN);
        var favorite = loadFavorites(0, topN);
        var ret = [], historyCursor = 0, favoriteCursor = 0;
        for (var merged = 0; merged < topN; merged++) {
            if (historyCursor < history.length) {
                if (favoriteCursor < favorite.length) {
                    var historyValue = history[historyCursor], favoriteValue = favorite[favoriteCursor];
                    if (historyValue.operation_time > favoriteValue.operation_time) {
                        ret.push(historyValue);
                        historyCursor++;
                    } else {
                        ret.push(favoriteValue);
                        favoriteCursor++;
                    }
                } else {
                    ret.push(history[historyCursor]);
                    historyCursor++;
                }
            } else {
                if (favoriteCursor < favorite.length) {
                    ret.push(favorite[favoriteCursor]);
                    favoriteCursor++;
                } else {
                    return ret;
                }
            }
        }
        return ret;
    }
    /* 抛出接口 */
    window.OTTsql = {
        getTotalCount            : getTotalCount,
        loadFavorites            : loadFavorites,
        loadFavoriteMovie        : loadFavoriteMovie,
        getFavoriteMovieCount    : getFavoriteMovieCount,
        loadFavoritNotMovie      : loadFavoritNotMovie,
        getFavoriteNotMovieCount : getFavoriteNotMovieCount,
        getFavStatus             : getFavStatus,
        unsetFavorite            : unsetFavorite,
        setFavorite              : setFavorite,
        loadHistorys             : loadHistorys,
        getHistory               : getHistory,
        getHistoryCount          : getHistoryCount,
        mergeTopN                : mergeTopN
    };
})(window);