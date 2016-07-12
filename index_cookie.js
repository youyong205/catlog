(function (global) {

    //打点请求url
    var SERVER_LOG_URL = "http://hello.dianping.com:2282/cat-log-web/web";

    //根域名
    var ROOT_DOMAIN = ".infinitus.com.cn";
    //cookie domain
    var COOKIE_DOMAIN = "";
    //cookie time
    var COOKIE_EXPIRE = 3650; //3650d

    //域名自动映射到cat_source
    var sourceMap = {
        "www.tengxun.com": "tx"
    };

    //url参数自动解析到cookie
    var URL_COOKIE = ["cat_campaign", "cat_source", "cat_media", "cat_creative"];
    var CAT_SESSION_ID = 'cat_session_id';
    var CAT_USER_ID = 'cat_user_id';

    //params
    var URL_PARAMS = {};
    for (var i = 0; i < URL_COOKIE.length; i++) {
        URL_PARAMS[URL_COOKIE[i]] = cookie(URL_COOKIE[i]) || "";
    }
    function clearParams() {
        for (var i = 0; i < URL_COOKIE.length; i++) {
            URL_PARAMS[URL_COOKIE[i]] = "";
        }
    }


    (function () {
        //cookie domain
        if (~location.hostname.indexOf(ROOT_DOMAIN)) {
            COOKIE_DOMAIN = ROOT_DOMAIN;
        } else {
            //当前域名
            COOKIE_DOMAIN = location.hostname;
        }

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
                        clearParams();
                        URL_PARAMS["cat_source"] = sourceMap[domain];
                        relog = true;
                    }
                }
            }
        }

        //2.解析url 参数
        var urlParams = getQuery();
        var _cleared = false;
        for (var i = 0; i < URL_COOKIE.length; i++) {
            var name = URL_COOKIE[i];
            if (name in urlParams) {
                if (!_cleared) {
                    clearParams();
                    _cleared = true;
                }
                URL_PARAMS[name] = urlParams[name];
                relog = true;
            }
        }
        //3.重置cookie
        if (relog) {
            for (var name in URL_PARAMS) {
                if (URL_PARAMS.hasOwnProperty(name)) {
                    cookie(name, URL_PARAMS[name], {
                        expires: COOKIE_EXPIRE,
                        domain: COOKIE_DOMAIN
                    });
                }
            }
        }

    })();

    //API
    (function () {
        var globalConfig = {};

        globalConfig[CAT_USER_ID] = cookie(CAT_USER_ID) || "";

        global.CatLog = {
        	
            /**
             * 预设全局值,
             * 目前支持userId
             * */
            setConfig: function (key, value) {
                globalConfig[key] = value;
                //userId 特殊处理
                if (key === "UserID") {
                    cookie(CAT_USER_ID, value, {
                        expires: COOKIE_EXPIRE,
                        domain: COOKIE_DOMAIN
                    });
                }
            },
            
            setUserId:function(value){
            	cookie(CAT_USER_ID, value, {
                    expires: COOKIE_EXPIRE,
                    domain: COOKIE_DOMAIN
                });
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

                //读取cookie ,6个拼接
                request(SERVER_LOG_URL, mix(globalConfig, options, URL_PARAMS));
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
                    EventScreen: EventScreen,
                    EventAction: EventAction,
                    EventLabel: EventLabel,
                    EventValue: EventValue
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

        var currentSessionId = cookie(CAT_SESSION_ID);
        
        if (!currentSessionId) {
            currentSessionId = sessionId();
        }
        cookie(CAT_SESSION_ID, currentSessionId, {
            expires: 0.5 / 24,
            domain: COOKIE_DOMAIN
        });

        dataQuery.push(CAT_SESSION_ID + "=" + currentSessionId);

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

    /**
     * 辅助工具函数
     * */
    //cookie
    function cookie(key, value, options) {
        function parseCookieValue(s) {
            if (s.indexOf('"') === 0) {
                // This is a quoted cookie as according to RFC2068, unescape...
                s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            }

            try {
                // Replace server-side written pluses with spaces.
                // If we can't decode the cookie, ignore it, it's unusable.
                // If we can't parse the cookie, ignore it, it's unusable.
                s = decodeURIComponent(s.replace(/\+/g, ' '));
                return s;
            } catch (e) {
            }
        }

        // Write
        if (value !== undefined && !isFunction(value)) {
            options = mix({}, options);

            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setTime(+t + days * 864e+5);
            }

            return (document.cookie = [
                encodeURIComponent(key), '=', encodeURIComponent(value),
                options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                options.path ? '; path=' + options.path : '',
                options.domain ? '; domain=' + options.domain : '',
                options.secure ? '; secure' : ''
            ].join(''));
        }

        // Read

        var result = key ? undefined : {};

        // To prevent the for loop in the first place assign an empty array
        // in case there are no cookies at all. Also prevents odd result when
        // calling $.cookie().
        var cookies = document.cookie ? document.cookie.split('; ') : [];

        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            var name = decodeURIComponent(parts.shift());
            var cookie = parts.join('=');

            if (key && key === name) {
                result = parseCookieValue(cookie);
                break;
            }
        }

        return result;
    }

    //sessionId
    function sessionId() {
        // Unique ID creation requires a high quality random # generator.  We feature
        // detect to determine the best RNG source, normalizing to a function that
        // returns 128-bits of randomness, since that's what's usually required
        var _rng, _mathRNG, _nodeRNG, _whatwgRNG, _previousRoot;

        function setupBrowser() {
            // Math.random()-based (RNG)
            //
            // If all else fails, use Math.random().  It's fast, but is of unspecified
            // quality.
            var _rnds = new Array(16);
            _mathRNG = _rng = function () {
                for (var i = 0, r; i < 16; i++) {
                    if ((i & 0x03) === 0) {
                        r = Math.random() * 0x100000000;
                    }
                    _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
                }

                return _rnds;
            };

        }

        setupBrowser();

        // Buffer class to use
        var BufferClass = ('function' === typeof Buffer) ? Buffer : Array;

        // Maps for number <-> hex string conversion
        var _byteToHex = [];
        var _hexToByte = {};
        for (var i = 0; i < 256; i++) {
            _byteToHex[i] = (i + 0x100).toString(16).substr(1);
            _hexToByte[_byteToHex[i]] = i;
        }

        // **`parse()` - Parse a UUID into it's component bytes**
        function parse(s, buf, offset) {
            var i = (buf && offset) || 0, ii = 0;

            buf = buf || [];
            s.toLowerCase().replace(/[0-9a-f]{2}/g, function (oct) {
                if (ii < 16) { // Don't overflow!
                    buf[i + ii++] = _hexToByte[oct];
                }
            });

            // Zero out remaining bytes if string was short
            while (ii < 16) {
                buf[i + ii++] = 0;
            }

            return buf;
        }

        // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
        function unparse(buf, offset) {
            var i = offset || 0, bth = _byteToHex;
            return bth[buf[i++]] + bth[buf[i++]] +
                bth[buf[i++]] + bth[buf[i++]] + '-' +
                bth[buf[i++]] + bth[buf[i++]] + '-' +
                bth[buf[i++]] + bth[buf[i++]] + '-' +
                bth[buf[i++]] + bth[buf[i++]] + '-' +
                bth[buf[i++]] + bth[buf[i++]] +
                bth[buf[i++]] + bth[buf[i++]] +
                bth[buf[i++]] + bth[buf[i++]];
        }

        // **`v1()` - Generate time-based UUID**
        //
        // Inspired by https://github.com/LiosK/UUID.js
        // and http://docs.python.org/library/uuid.html

        // random #'s we need to init node and clockseq
        var _seedBytes = _rng();

        // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
        var _nodeId = [
            _seedBytes[0] | 0x01,
            _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
        ];

        // Per 4.2.2, randomize (14 bit) clockseq
        var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

        // Previous uuid creation time
        var _lastMSecs = 0, _lastNSecs = 0;

        // See https://github.com/broofa/node-uuid for API details
        function v1(options, buf, offset) {
            var i = buf && offset || 0;
            var b = buf || [];

            options = options || {};

            var clockseq = (options.clockseq != null) ? options.clockseq : _clockseq;

            // UUID timestamps are 100 nano-second units since the Gregorian epoch,
            // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
            // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
            // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
            var msecs = (options.msecs != null) ? options.msecs : new Date().getTime();

            // Per 4.2.1.2, use count of uuid's generated during the current clock
            // cycle to simulate higher resolution clock
            var nsecs = (options.nsecs != null) ? options.nsecs : _lastNSecs + 1;

            // Time since last uuid creation (in msecs)
            var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs) / 10000;

            // Per 4.2.1.2, Bump clockseq on clock regression
            if (dt < 0 && options.clockseq == null) {
                clockseq = clockseq + 1 & 0x3fff;
            }

            // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
            // time interval
            if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
                nsecs = 0;
            }

            // Per 4.2.1.2 Throw error if too many uuids are requested
            if (nsecs >= 10000) {
                throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
            }

            _lastMSecs = msecs;
            _lastNSecs = nsecs;
            _clockseq = clockseq;

            // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
            msecs += 12219292800000;

            // `time_low`
            var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
            b[i++] = tl >>> 24 & 0xff;
            b[i++] = tl >>> 16 & 0xff;
            b[i++] = tl >>> 8 & 0xff;
            b[i++] = tl & 0xff;

            // `time_mid`
            var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
            b[i++] = tmh >>> 8 & 0xff;
            b[i++] = tmh & 0xff;

            // `time_high_and_version`
            b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
            b[i++] = tmh >>> 16 & 0xff;

            // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
            b[i++] = clockseq >>> 8 | 0x80;

            // `clock_seq_low`
            b[i++] = clockseq & 0xff;

            // `node`
            var node = options.node || _nodeId;
            for (var n = 0; n < 6; n++) {
                b[i + n] = node[n];
            }

            return buf ? buf : unparse(b);
        }

        // **`v4()` - Generate random UUID**

        // See https://github.com/broofa/node-uuid for API details
        function v4(options, buf, offset) {
            // Deprecated - 'format' argument, as supported in v1.2
            var i = buf && offset || 0;

            if (typeof(options) === 'string') {
                buf = (options === 'binary') ? new BufferClass(16) : null;
                options = null;
            }
            options = options || {};

            var rnds = options.random || (options.rng || _rng)();

            // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
            rnds[6] = (rnds[6] & 0x0f) | 0x40;
            rnds[8] = (rnds[8] & 0x3f) | 0x80;

            // Copy bytes to buffer, if provided
            if (buf) {
                for (var ii = 0; ii < 16; ii++) {
                    buf[i + ii] = rnds[ii];
                }
            }

            return buf || unparse(rnds);
        }

        return v4();

    }

    function isFunction(obj) {
        return Object.prototype.toString.call(obj) == '[object Function]';
    }

})(window);