(function (global) {
    //set cat_source等参数的url
    var SERVER_INIT_URL = "http://catio.infinitus.com.cn/cat-log-web/source";
    //set userId 的url
    var SERVER_USER_ID_URL = "http://catio.infinitus.com.cn/cat-log-web/user";
    //打点请求url
    var SERVER_LOG_URL = "http://catio.infinitus.com.cn/cat-log-web/web";


    //域名自动映射到cat_source
    var sourceMap = {
        "www.tengxun.com": "tx"
    };

    //url参数自动解析到cookie
    var URL_COOKIE = ["cat_campaign", "cat_source", "cat_media", "cat_creative"];

    //params
    var URL_PARAMS = {};
    for (var i = 0; i < URL_COOKIE.length; i++) {
        URL_PARAMS[URL_COOKIE[i]] = "";
    }

    (function () {
        //预处理主逻辑
        var relog = false; //是否url有新参数,如果有,重新发
        //1.document.referrer域名隐射到cat_source
        var refer = document.referrer;
        if (refer) {
            var referHost = refer.match(/\/\/([^/$]+)/);
            if (referHost && referHost[1]) {
                referHost = referHost[1];
                for (var domain in sourceMap) {
                    if (sourceMap.hasOwnProperty(domain) && ~referHost.indexOf(domain)) {
                        URL_PARAMS["cat_source"] = sourceMap[domain];
                        relog = true;
                    }
                }
            }
        }

        //2.解析url 参数
        var urlParams = getQuery();
        for (var i = 0; i < URL_COOKIE.length; i++) {
            var name = URL_COOKIE[i];
            if (name in urlParams) {
                URL_PARAMS[name] = urlParams[name];
                relog = true;
            }
        }
        //3.发送请求
        if (relog) {
            request(SERVER_INIT_URL, URL_PARAMS);
        }

    })();

    //API
    (function () {
        var globalConfig = {};

        global.CatLog = {
            /**
             * 预设全局值,
             * 目前支持userId
             * */
            setConfig: function (key, value) {
                globalConfig[key] = value;
                //userId 特殊处理
                if (key === "UserID") {
                    request(SERVER_USER_ID_URL, {
                        userId: value
                    });
                }

            },
            /**
             * @param options{Object}
             * {
             *  EventScreen:"", //URL或App屏幕名称 , 可不传, 默认当前URL
             *  EventAction:"", //例如“浏览”, “点击”, “焦点”(on-focus)等
             *  EventLabel:"",  //按钮和控件的名称(只适于“点击”或“焦点”事件)
             *  EventValue:""   //显示不同的内容值
             * }
             * */
            log: function (options) {
                if (!options) {
                    return;
                }
                var params = mix(globalConfig, options);
                request(SERVER_LOG_URL, params);
            },

            /**
             *  EventScreen:"",  //URL或App屏幕名称 , 可不传, 默认当前URL
             *  EventAction:"",  //例如“浏览”, “点击”, “焦点”(on-focus)等
             *  EventLabel:"",   //按钮和控件的名称(只适于“点击”或“焦点”事件)
             *  EventValue:""    //显示不同的内容值
             * }
             * */
            trace: function (EventScreen, EventAction, EventLabel, EventValue) {
                this.log({
                    EventScreen:EventScreen,
                    EventAction:EventAction,
                    EventLabel:EventLabel,
                    EventValue:EventValue
                });
            }

        };
    })();

    /**
     * 辅助工具函数
     * */
    //request
    function request(url, data) {
        //var Xhr = window.XMLHttpRequest ?
        //    function () {
        //        return new XMLHttpRequest();
        //    } :
        //
        //    // fallback
        //    function () {
        //        try {
        //            return new window.ActiveXObject('Microsoft.XMLHTTP');
        //        } catch (e) {
        //        }
        //    };

        //var xhr = Xhr();
        //xhr.open("POST", url, false);
        data = data || {};
        var dataQuery = [];
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                dataQuery.push(key + "=" + encodeURIComponent(data[key]));
            }
        }
        var script = document.createElement("script");
        script.src = url + "?" + dataQuery.join("&");
        document.getElementsByTagName("head")[0].appendChild(script);
        //xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        //xhr.send(dataQuery.join("&"));
    }

    //url param
    function getQuery() {
        var params = {};
        var query = location.search;
        if (query) {
            query = query.substr(1);
        } else {
            return params;
        }
        query = query.split("&");
        for (var i = 0; i < query.length; i++) {
            var pair = query[i];
            pair = pair.split("=");
            params[pair[0]] = decodeURIComponent(pair[1] || "");
        }
        return params;
    }

    //mix
    function mix() {
        var objects = Array.prototype.slice.call(arguments, 0);
        var result = {};
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (!obj) {
                continue;
            }
            for (var o in obj) {
                if (obj.hasOwnProperty(o)) {
                    result[o] = obj[o];
                }
            }
        }

        return result;
    }

})(window);