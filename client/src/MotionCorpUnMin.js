/**
 * Copyright 2014 Motion Corporation
 *
 */
var MSV = function (_MSV_) {
    var P = 0;
    var V = 1;
    var A = 2;
    var T = 3;
    var MsvCmd = {
        CREATE: 1,
        GET: 2,
        UPDATE: 3,
        DELETE: 4,
        PING: 5,
        PONG: 6,
        UNSUB: 7
    };
    var MsgType = {
        MESSAGE: 1,
        REQUEST: 2,
        RESPONSE: 3,
        EVENT: 4
    };
    (function () {
        if ("performance" in window === false) {
            window.performance = {};
            window.performance.offset = (new Date).getTime()
        }
        if ("now" in window.performance === false) {
            window.performance.now = function now() {
                return (new Date).getTime() - window.performance.offset
            }
        }
    })();
    var client_clock = function () {
        return performance.now() / 1e3
    };
    var compute_msv = function (vector, t) {
        if (t === undefined) {
            t = client_clock()
        }
        var d = t - vector[T];
        var v = vector[V] + vector[A] * d;
        var p = vector[P] + vector[V] * d + .5 * vector[A] * d * d;
        return [p, v, vector[A], t]
    };
    var is_moving = function (vector) {
        if (vector === null) return false;
        if (vector[V] !== 0 || vector[A] !== 0) return true;
        return false
    };
    var cmp = function (a, b) {
        if (a > b) {
            return 1
        }
        if (a === b) {
            return 0
        }
        if (a < b) {
            return -1
        }
    };
    var compute_direction = function (vector, t) {
        var fresh_vector = compute_msv(vector, t);
        var direction = cmp(fresh_vector[V], 0);
        if (direction === 0) {
            direction = cmp(vector[A], 0)
        }
        return direction
    };
    var compare_vectors = function (old_vector, new_vector) {
        var p_equal = new_vector[P] === null || new_vector[P] == old_vector[P];
        var v_equal = new_vector[V] === null || new_vector[V] == old_vector[V];
        var a_equal = new_vector[A] === null || new_vector[A] == old_vector[A];
        var t_equal = new_vector[T] === null || new_vector[T] == old_vector[T];
        return [p_equal, v_equal, a_equal, t_equal]
    };
    var has_real_solution = function (p, v, a, x) {
        if (Math.pow(v, 2) - 2 * a * (p - x) >= 0) return true;
        else return false
    };
    var get_real_solutions = function (p, v, a, x) {
        if (a === 0 && v === 0) {
            if (p != x) return [];
            else return [0]
        }
        if (a === 0) return [(x - p) / v];
        if (has_real_solution(p, v, a, x) === false) return [];
        var discriminant = v * v - 2 * a * (p - x);
        if (discriminant === 0) {
            return [-v / a]
        }
        var sqrt = Math.sqrt(Math.pow(v, 2) - 2 * a * (p - x));
        var d1 = (-v + sqrt) / a;
        var d2 = (-v - sqrt) / a;
        return [Math.min(d1, d2), Math.max(d1, d2)]
    };
    var get_positive_real_solutions = function (p, v, a, x) {
        var res = get_real_solutions(p, v, a, x);
        if (res.length === 0) return [];
        else if (res.length == 1) {
            if (res[0] > 0) {
                return [res[0]]
            } else return []
        } else if (res.length == 2) {
            if (res[1] < 0) return [];
            if (res[0] > 0) return [res[0], res[1]];
            if (res[1] > 0) return [res[1]];
            return []
        } else return []
    };
    var get_min_positive_real_solution = function (p, v, a, x) {
        var res = get_positive_real_solutions(p, v, a, x);
        if (res.length === 0) return null;
        else return res[0]
    };
    var calculate_delta = function (vector, pos_before, pos_after) {
        var p = vector[P];
        var v = vector[V];
        var a = vector[A];
        var delta_before = get_min_positive_real_solution(p, v, a, pos_before);
        var delta_after = get_min_positive_real_solution(p, v, a, pos_after);
        if (delta_before !== null && delta_after !== null) {
            if (delta_before < delta_after) return [delta_before, pos_before];
            else return [delta_after, pos_after]
        } else if (delta_before !== null) return [delta_before, pos_before];
        else if (delta_after !== null) return [delta_after, pos_after];
        else return [null, null]
    };
    var sort_func = function (a, b) {
        return a[0] - b[0]
    };
    var calculate_solutions_in_interval = function (vector, d, plist) {
        var solutions = [];
        var p0 = vector[MSV.P];
        var v0 = vector[MSV.V];
        var a0 = vector[MSV.A];
        for (var i = 0; i < plist.length; i++) {
            var o = plist[i];
            var intersects = get_real_solutions(p0, v0, a0, o.point);
            for (var j = 0; j < intersects.length; j++) {
                var t = intersects[j];
                if (0 <= t && t <= d) {
                    solutions.push([t, o])
                }
            }
        }
        solutions.sort(sort_func);
        return solutions
    };
    var calculate_interval = function (vector_start, d) {
        var p0 = vector_start[MSV.P];
        var v0 = vector_start[MSV.V];
        var a0 = vector_start[MSV.A];
        var p1 = p0 + v0 * d + .5 * a0 * d * d;
        if (a0 !== 0) {
            var d_turning = -v0 / a0;
            if (0 <= d_turning && d_turning <= d) {
                var p_turning = p0 - .5 * v0 * v0 / a0;
                if (a0 > 0) {
                    return [p_turning, Math.max(p0, p1)]
                } else {
                    return [Math.min(p0, p1), p_turning]
                }
            }
        }
        return [Math.min(p0, p1), Math.max(p0, p1)]
    };
    var href_to_location = function (href) {
        var loc = document.createElement("a");
        loc.href = href;
        if (loc.origin === undefined) {
            loc.origin = loc.protocol + "//" + loc.host
        }
        return loc
    };
    var urlparse = function (url) {
        if (typeof url != "string") {
            throw "URL must be a string, was a " + typeof url
        }
        var self = {};
        var loc, local, host, msvid;
        if (url.substring(0, 6) != "msv://") {
            var e = {
                name: "MsvUrlError",
                message: "protocol not supported  " + url.substring(0, 6)
            };
            throw e
        }
        if (url.length > 6 && url.substring(0, 7) === "msv:///") {
            local = true;
            loc = href_to_location("file" + url.slice(3));
            host = ""
        } else {
            local = false;
            loc = href_to_location("http" + url.slice(3));
            host = loc.host
        }
        msvid = loc.pathname[0] === "/" ? loc.pathname.slice(1) : loc.pathname;
        if (check_msvid(msvid) === false) {
            throw "illegal msvid : [" + msvid + "]"
        }
        self.get_host = function () {
            return host
        };
        self.get_port = function () {
            return loc.port
        };
        self.get_protocol = function () {
            return "msv:"
        };
        self.is_local = function () {
            return local
        };
        self.get_url = function () {
            if (self.is_local()) {
                return "msv:///" + msvid
            } else {
                var u = "msv://" + host;
                if (host !== "") u += "/" + msvid
            }
            var url = self.is_local() ? "msv:///" : "msv://";
            url += host;
            return msvid !== "" ? url + "/" + msvid : url
        };
        self.get_msvid = function () {
            return msvid
        };
        return self
    };
    var re = /^\d+$/;
    var check_msvid = function (msvid) {
        if (typeof msvid !== "string") return false;
        if (msvid === "") return true;
        return re.test(msvid)
    };
    _MSV_.P = P;
    _MSV_.V = V;
    _MSV_.A = A;
    _MSV_.T = T;
    _MSV_.MsgType = MsgType;
    _MSV_.MsvCmd = MsvCmd;
    _MSV_.client_clock = client_clock;
    _MSV_.is_moving = is_moving;
    _MSV_.compute_msv = compute_msv;
    _MSV_.compute_direction = compute_direction;
    _MSV_.compare_vectors = compare_vectors;
    _MSV_.calculate_delta = calculate_delta;
    _MSV_.calculate_interval = calculate_interval;
    _MSV_.calculate_solutions_in_interval = calculate_solutions_in_interval;
    _MSV_.urlparse = urlparse;
    _MSV_.href_to_location = href_to_location;
    return _MSV_
}(MSV || {});
var MSV = function (_MSV_) {
    var MsvCmd = MSV.MsvCmd;
    var MsgType = MSV.MsgType;
    var Tick = {
        SWITCH_MEDIUM: 3,
        SWITCH_LARGE: 10,
        SMALL_DELTA: 20,
        MEDIUM_DELTA: 500,
        LARGE_DELTA: 1e4
    };
    var makePinger = function (ping_delay) {
        var self = {};
        var count = 0;
        var tid = null;
        var onping = null;
        if (!ping_delay) {
            ping_delay = Tick.LARGE_DELTA
        }
        var pause = function () {
            if (tid !== null) {
                clearTimeout(tid);
                tid = null
            }
        };
        var resume = function () {
            if (tid !== null) {
                clearTimeout(tid);
                tid = null
            }
            tick()
        };
        var tick = function () {
            count += 1;
            if (count < Tick.SWITCH_MEDIUM) {
                this._tid = setTimeout(tick, Tick.SMALL_DELTA)
            } else if (count < Tick.SWITCH_LARGE) {
                tid = setTimeout(tick, Tick.MEDIUM_DELTA)
            } else {
                tid = setTimeout(tick, ping_delay)
            }
            if (onping) {
                onping()
            }
        };
        self.set_onping = function (handler) {
            onping = handler
        };
        self.pause = pause;
        self.resume = resume;
        self.start = function () {
            count = 0;
            resume()
        };
        return self
    };
    var makeServerClock = function (callback) {
        var self = {};
        var log = [];
        var N = 30;
        var est_trans = 1e3;
        var est_skew = 0;
        var add_sample = function (cs, ss, cr) {
            var trans = (cr - cs) / 2;
            var skew = ss - (cr + cs) / 2;
            var entry = [cs, ss, cr, trans, skew];
            log.push(entry);
            if (log.length > N) {
                log.shift()
            }
            trans = 1e5;
            skew = 0;
            for (var i = 0; i < log.length; i++) {
                var e = log[i];
                if (e[3] < trans) {
                    trans = e[3];
                    skew = e[4]
                }
            }
            var skewchange = skew !== est_skew;
            est_trans = trans;
            est_skew = skew;
            if (skewchange) callback()
        };
        var get_server_clock = function () {
            return MSV.client_clock() + est_skew
        };
        var get_skew = function () {
            return est_skew
        };
        var get_trans = function () {
            return est_trans
        };
        self.add_sample = add_sample;
        self.get_server_clock = get_server_clock;
        self.get_skew = get_skew;
        self.get_trans = get_trans;
        return self
    };
    var HTTPRequest = function () {
        var counter = 1;
        var head_elem = document.getElementsByTagName("head").item(0);
        var pending = {};
        var handle_result = function (msg) {
            if (msg.hasOwnProperty("reqid")) {
                var reqid = msg.reqid;
                delete msg.reqid;
                if (pending.hasOwnProperty(reqid)) {
                    var request = pending[reqid];
                    delete pending[reqid];
                    request.handle_result(msg)
                }
            } else {
                throw "HTTPRequest: Missing reqid in response from server"
            }
        };
        var makeRequest = function (_options) {
            var self = {};
            var buf = [];
            var result_handler;
            var reqid = counter++;
            var script_elem;
            var ts;
            var tid = null;
            var options = _options || {};
            var send = function (url, msg) {
                if (!msg) {
                    throw "HTTPRequest: Send no message"
                }
                buf.push({
                    url: url,
                    msg: msg
                });
                _send()
            };
            var is_sending = function () {
                return pending.hasOwnProperty(reqid) || buf.length > 0
            };
            var _send = function () {
                var item, url, msg, wmsg, data;
                if (!pending.hasOwnProperty(reqid) && buf.length > 0) {
                    pending[reqid] = self;
                    script_elem = document.createElement("script");
                    script_elem.setAttribute("type", "application/javascript");
                    script_elem.setAttribute("charset", "utf-8");
                    script_elem.setAttribute("id", "JscriptId" + reqid);
                    script_elem.async = true;
                    script_elem.defer = false;
                    item = buf.shift();
                    url = item.url;
                    msg = item.msg;
                    ts = MSV.client_clock();
                    if (msg.hasOwnProperty("msg")) {
                        if (msg.cmd === MsvCmd.PING) {
                            msg.data = ts
                        }
                    }
                    msg.cb = "MSV.cb";
                    msg.reqid = reqid;
                    data = encodeURIComponent(JSON.stringify(msg));
                    url = url + "?data=" + data + "&noCacheIE=" + ts;
                    script_elem.setAttribute("src", url);
                    head_elem.appendChild(script_elem)
                }
            };
            var set_result_handler = function (handler) {
                result_handler = handler
            };
            var handle_result = function (msg) {
                head_elem.removeChild(script_elem);
                _send();
                if (result_handler) {
                    result_handler.call(self, msg)
                }
            };
            var close = function () {
                if (pending.hasOwnProperty(reqid)) {
                    delete pending[reqid]
                }
                if (script_elem) {
                    head_elem.removeChild(script_elem);
                    script_elem = null
                }
                if (tid !== null) {
                    clearTimeout(tid);
                    tid = null
                }
            };
            self.handle_result = handle_result;
            self.send = send;
            self.close = close;
            self.is_sending = is_sending;
            self.set_onresult = set_result_handler;
            return self
        };
        return {
            makeRequest: makeRequest,
            cb: handle_result
        }
    }();
    var makeHTTPConnection = function (master_url) {
        var self = {};
        var _onopen = null;
        var _onerror = null;
        var _onmessage = null;
        var lp_request;
        var op_request;
        var sid = null;
        var worker_url = null;
        var _is_open = false;
        var handle_lp = function (result) {
            longpoll();
            if (_onmessage && result.hasOwnProperty("type")) {
                _onmessage.call(self, result)
            }
        };
        var handle_op = function (result) {
            var loc;
            if (_is_open === false) {
                sid = result.sid;
                loc = MSV.href_to_location(master_url);
                loc.port = result.port;
                worker_url = loc.href;
                console.log(worker_url);
                _is_open = true;
                longpoll();
                if (_onopen) {
                    _onopen.call(self)
                }
                return
            }
            if (_onmessage && result.hasOwnProperty("type")) {
                _onmessage.call(self, result)
            }
        };
        var longpoll = function () {
            if (_is_open && !lp_request.is_sending()) {
                lp_request.send(worker_url, {
                    sid: sid,
                    op: "lp"
                })
            }
        };
        var send = function (msg) {
            if (_is_open) {
                msg.sid = sid;
                msg.op = "op";
                op_request.send(worker_url, msg);
                return true
            }
            return false
        };
        var close = function () {
            _is_open = false;
            _onopen = null;
            _onerror = null;
            _onmessage = null;
            op_request.close();
            lp_request.close()
        };
        self.send = send;
        self.close = close;
        self.set_onopen = function (handler) {
            _onopen = handler
        };
        self.set_onerror = function (handler) {
            _onerror = handler
        };
        self.set_onmessage = function (handler) {
            _onmessage = handler
        };
        lp_request = HTTPRequest.makeRequest();
        lp_request.set_onresult(handle_lp);
        op_request = HTTPRequest.makeRequest();
        op_request.set_onresult(handle_op);
        op_request.send(master_url + "/createsession", {});
        return self
    };
    var makeWSConnection = function (url) {
        var self = {};
        var conn;
        var _onmessage;
        var _onopen;
        var _onerror;
        var handle_message = function (event) {
            if (_onmessage) {
                var msg = JSON.parse(event.data);
                _onmessage.call(self, msg)
            }
        };
        var handle_open = function () {
            if (_onopen) {
                _onopen.call(self)
            }
        };
        var handle_error = function (e) {
            conn = null;
            if (_onerror) {
                _onerror.call(self, e)
            }
        };
        var send = function (msg) {
            if (!conn) return false;
            try {
                conn.send(JSON.stringify(msg))
            } catch (e) {
                console.log(e);
                return false
            }
            return true
        };
        var close = function () {
            if (conn) {
                try {
                    conn.close()
                } catch (e) { }
            }
        };
        self.send = send;
        self.close = close;
        self.set_onopen = function (handler) {
            _onopen = handler
        };
        self.set_onerror = function (handler) {
            _onerror = handler
        };
        self.set_onmessage = function (handler) {
            _onmessage = handler
        };
        conn = new WebSocket(url);
        conn.onmessage = handle_message;
        conn.onopen = handle_open;
        conn.onerror = handle_error;
        conn.onclose = handle_error;
        return self
    };
    var IOState = {
        DISCONNECTED: 0,
        CONNECTING: 1,
        CONNECTED: 2
    };
    var IORemote = function (host, options) {
        var self = {};
        options = options || {};
        var Delay = {
            CONNECT: options["to-connect"] || 5,
            RECONNECT: options["to-reconnect"] || 10,
            PING: options["to-ping"] || 10
        };
        Delay.PONG = options["to-pong"] || 2 * Delay.PING + 1;
        var _onconnect = null;
        var _onmessage = null;
        var _onskewchange = null;
        var conn = null;
        var conn_tid = null;
        var pong_tid = null;
        var reconnect_tid = null;
        var pinger = makePinger(Delay.PING * 1e3);
        var server_clock = makeServerClock(function () {
            if (_onskewchange !== null) _onskewchange()
        });
        var localStorage = function () {
            var support = function () {
                try {
                    return "localStorage" in window && window.localStorage !== null
                } catch (e) {
                    return false
                }
            }();
            var storage = support ? window.localStorage : undefined;
            return {
                getItem: function (key) {
                    if (!support) return undefined;
                    else return storage.getItem(key)
                },
                setItem: function (key, value) {
                    try {
                        if (support) storage.setItem(key, value)
                    } catch (e) { }
                }
            }
        }();
        var ws_works = localStorage.getItem("mcorp_ws_works");
        if (ws_works === undefined) {
            ws_works = false || options.insist === "ws"
        }
        var ws_attempted = options.insist === "http" ? 1 : 0;
        var http_attempted = 0;
        var state = IOState.DISCONNECTED;
        var failed_reconnects = 0;
        var set_state = function (new_state) {
            if (new_state != state) {
                var old_state = state;
                state = new_state;
                var fire = false;
                if (old_state === IOState.CONNECTING && new_state === IOState.CONNECTED) {
                    fire = true;
                    failed_reconnects = 0
                } else if (old_state === IOState.CONNECTED && new_state === IOState.DISCONNECTED) {
                    console.log(new Date + ": disconnected");
                    fire = true
                } else if (old_state === IOState.CONNECTING && new_state === IOState.DISCONNECTED) {
                    failed_reconnects++;
                    console.log(new Date + ": connect failed " + failed_reconnects);
                    if (failed_reconnects === 3) { }
                }
                if (fire && _onconnect !== null) {
                    _onconnect.call(self)
                }
            }
        };
        var connection_failed = function () {
            if (state !== IOState.DISCONNECTED) {
                if (conn !== null) {
                    conn.set_onopen(undefined);
                    conn.set_onerror(undefined);
                    conn.set_onmessage(undefined);
                    conn.close();
                    conn = null
                }
                if (conn_tid !== null) {
                    clearTimeout(conn_tid);
                    conn_tid = null
                }
                if (pong_tid !== null) {
                    clearTimeout(pong_tid);
                    pong_tid = null
                }
                pinger.pause();
                set_state(IOState.DISCONNECTED)
            }
        };
        var connect = function () {
            if (state !== IOState.DISCONNECTED) {
                return
            }
            connect_ws();
            conn.set_onopen(handle_connect_ok);
            conn.set_onerror(handle_error);
            conn.set_onmessage(handle_message);
            conn_tid = setTimeout(handle_connect_timeout, Delay.CONNECT * 1e3);
            set_state(IOState.CONNECTING)
        };
        var connect_ws = function () {
            var proto = "wss://";
            if (options.ssl === false) {
                proto = "ws://"
            }
            console.log(new Date + ": connect " + proto + host);
            conn = makeWSConnection(proto + host);
            conn.type = "ws";
            ws_attempted += 1
        };
        var connect_http = function () {
            console.log(new Date + ": connect http://" + host);
            conn = makeHTTPConnection("http://" + host);
            conn.type = "http";
            http_attempted += 1
        };
        var handle_connect_timeout = function () {
            connection_failed();
            if (ws_works === false && ws_attempted === 1 && http_attempted === 0) {
                connect()
            }
        };
        var handle_connect_ok = function () {
            clearTimeout(conn_tid);
            conn_tid = null;
            if (!ws_works && conn.type === "ws") {
                ws_works = true;
                localStorage.setItem("mcorp_ws_works", true)
            }
            send_ping();
            if (pong_tid !== null) {
                clearTimeout(pong_tid)
            }
            pong_tid = setTimeout(handle_pong_timeout, (Delay.PONG + 1) * 1e3)
        };
        var onping = function () {
            if (state === IOState.CONNECTED) {
                send_ping()
            }
        };
        var send_ping = function () {
            var msg = {
                type: MsgType.REQUEST,
                cmd: MsvCmd.PING,
                data: MSV.client_clock()
            };
            var ok = conn.send(msg);
            if (!ok) {
                connection_failed()
            }
        };
        pinger.set_onping(onping);
        var handle_error = function (e) {
            connection_failed()
        };
        var handle_pong_timeout = function () {
            connection_failed();
            connect()
        };
        var handle_message = function (msg) {
            if (state === IOState.DISCONNECTED) {
                return
            }
            if (msg.cmd === MsvCmd.PONG) {
                var ts = msg.data;
                if (pong_tid !== null) {
                    clearTimeout(pong_tid)
                }
                pong_tid = setTimeout(handle_pong_timeout, Delay.PONG * 1e3);
                server_clock.add_sample(ts[0], ts[1], MSV.client_clock());
                if (state == IOState.CONNECTING) {
                    console.log(new Date + ": connected");
                    set_state(IOState.CONNECTED);
                    pinger.start()
                }
                return
            }
            if (_onmessage !== null) {
                _onmessage.call(self, msg)
            }
        };
        var send = function (msg) {
            if (state === IOState.CONNECTED) {
                conn.send(msg);
                return true
            } else {
                return false
            }
        };
        var is_connected = function () {
            return state === IOState.CONNECTED ? true : false
        };
        var get_type = function () {
            return state === IOState.CONNECTED ? conn.type : null
        };
        var get_host = function () {
            return host
        };
        var get_url = function () {
            return "msv://" + host + "/"
        };
        connect();
        reconnect_tid = setInterval(connect, Delay.RECONNECT * 1e3);
        self.set_onconnect = function (handler) {
            _onconnect = handler
        };
        self.set_onmessage = function (handler) {
            _onmessage = handler
        };
        self.set_onskewchange = function (handler) {
            _onskewchange = handler
        };
        self.get_server_clock = server_clock.get_server_clock;
        self.get_skew = server_clock.get_skew;
        self.get_trans = server_clock.get_trans;
        self.send = send;
        self.is_connected = is_connected;
        self.get_type = get_type;
        self.get_host = get_host;
        self.get_url = get_url;
        self.connect = connect;
        return self
    };
    _MSV_.IORemote = IORemote;
    _MSV_.cb = HTTPRequest.cb;
    _MSV_.HTTPRequest = HTTPRequest.makeRequest;
    return _MSV_
}(MSV || {});
var MSV = function (_MSV_) {
    var P = MSV.P;
    var V = MSV.V;
    var A = MSV.A;
    var T = MSV.T;
    var MsvCmd = MSV.MsvCmd;
    var MsgType = MSV.MsgType;
    var makeMsvDB = function () {
        var self = {};
        var db = {};
        var msvid_counter = 0;
        var create_msvs = function (msv_data_list) {
            for (var i = 0; i < msv_data_list.length; i++) {
                var msvid = msvid_counter;
                msvid_counter += 1;
                var msv_data = {
                    msvid: msvid,
                    eventid: 0,
                    range: msv_data_list[i].range || [null, null]
                };
                msv_data_list[i].msvid = msvid;
                var r_start = msv_data.range[0];
                var p = r_start !== null ? r_start : 0;
                msv_data.vector = [p, 0, 0, MSV.client_clock()];
                db[msvid] = msv_data
            }
            var result_list = [];
            for (var j = 0; j < msv_data_list.length; j++) {
                var _msv_data = msv_data_list[j];
                var res = null;
                if (_msv_data.hasOwnProperty("vector") && _msv_data.vector !== null) {
                    res = update_msvs([_msv_data])
                } else {
                    res = get_msvs([_msv_data.msvid])
                }
                if (res !== null) {
                    result_list = result_list.concat(res)
                }
                return result_list
            }
        };
        var get_msvs = function (msvid_list) {
            var msv_data_list = [];
            for (var i = 0; i < msvid_list.length; i++) {
                var msvid = msvid_list[i];
                if (db.hasOwnProperty(msvid)) {
                    msv_data_list.push(db[msvid])
                }
            }
            return msv_data_list
        };
        var update_msvs = function (msv_data_list) {
            var res = [];
            var ts_now = MSV.client_clock();
            for (var i = 0; i < msv_data_list.length; i++) {
                var msv_data = msv_data_list[i];
                var msvid = msv_data.msvid;
                var new_vector = msv_data.vector;
                var relative = msv_data.relative || false;
                var valid = msv_data.valid || null;
                var old_msv_data = db[msvid] || null;
                if (old_msv_data === null) {
                    return
                }
                if (valid !== null && valid != old_msv_data.eventid) {
                    return
                }
                var old_vector = old_msv_data.vector;
                var now_vector = MSV.compute_msv(old_vector, ts_now);
                var p = new_vector[P];
                var v = new_vector[V];
                var a = new_vector[A];
                if (relative === true) {
                    p = p === null ? now_vector[P] : p + now_vector[P];
                    v = v === null ? now_vector[V] : v + now_vector[V];
                    a = a === null ? now_vector[A] : a + now_vector[A]
                } else {
                    if (p === null) p = now_vector[P];
                    if (v === null) v = now_vector[V];
                    if (a === null) a = now_vector[A]
                }
                var r_start = old_msv_data.range[0];
                var r_end = old_msv_data.range[1];
                if (r_end !== null && p >= r_end) {
                    p = r_end;
                    if (v > 0) v = 0;
                    if (v === 0 && a > 0) a = 0
                } else if (r_start !== null && p <= r_start) {
                    p = r_start;
                    if (v < 0) v = 0;
                    if (v === 0 && a < 0) a = 0
                }
                var new_msv_data = {
                    msvid: msvid,
                    eventid: old_msv_data.eventid + 1,
                    old_vector: old_vector,
                    now_vector: now_vector,
                    vector: [p, v, a, ts_now],
                    range: old_msv_data.range
                };
                db[msvid] = new_msv_data;
                res.push(new_msv_data)
            }
            return res
        };
        self.get_msvs = get_msvs;
        self.create_msvs = create_msvs;
        self.update_msvs = update_msvs;
        return self
    };
    var makeTimeoutManager = function () {
        var self = {};
        var map = {};
        var cancel_timeout = function (msvid) {
            if (map.hasOwnProperty(msvid)) {
                var tid = map[msvid];
                clearTimeout(tid);
                delete map[msvid]
            }
        };
        var set_timeout = function (msvid, eventid, pos, delta, handler) {
            cancel_timeout(msvid);
            var millis = delta * 1e3;
            var tid = setTimeout(function () {
                handler(msvid, eventid, pos)
            }, millis);
            map[msvid] = tid
        };
        self.cancel_timeout = cancel_timeout;
        self.set_timeout = set_timeout;
        return self
    };
    var IOLocal = function () {
        var self = {};
        var onmessage = null;
        var db = makeMsvDB();
        var msv_tm = makeTimeoutManager();
        var output = function (msg) {
            if (onmessage !== null) {
                setTimeout(function () {
                    onmessage.call(self, msg)
                }, 0)
            }
        };
        var renew_timeout = function (msv_data) {
            var moving = msv_data.mflags[0];
            var started = msv_data.mflags[1];
            var ended = msv_data.mflags[2];
            if (started) {
                reset_timeout(msv_data)
            } else if (ended) {
                msv_tm.cancel_timeout(msv_data.msvid)
            } else if (moving) {
                reset_timeout(msv_data)
            }
        };
        var reset_timeout = function (msv_data) {
            var msvid = msv_data.msvid;
            var eventid = msv_data.eventid;
            var vector = msv_data.vector;
            var r_start = msv_data.range[0];
            var r_end = msv_data.range[1];
            var res = MSV.calculate_delta(vector, r_start, r_end);
            var delta = res[0];
            var pos = res[1];
            if (delta === null) return;
            msv_tm.set_timeout(msvid, eventid, pos, delta, process_timeout)
        };
        var process_timeout = function (msvid, eventid, pos) {
            var args = [{
                msvid: msvid,
                eventid: eventid,
                vector: [pos, 0, 0]
            }];
            process_update(args)
        };
        var process_update = function (args) {
            var msv_data_list = db.update_msvs(args);
            for (var i = 0; i < msv_data_list.length; i++) {
                var msv_data = msv_data_list[i];
                var new_vector = msv_data.vector;
                var old_vector = msv_data.old_vector;
                var now_vector = msv_data.now_vector;
                var moving = MSV.is_moving(new_vector);
                var was_moving = MSV.is_moving(old_vector);
                var started = moving === true && was_moving === false;
                var ended = moving === false && was_moving === true;
                msv_data.mflags = [moving, started, ended];
                msv_data.vflags = MSV.compare_vectors(old_vector, new_vector);
                msv_data.uflags = MSV.compare_vectors(now_vector, new_vector);
                renew_timeout(msv_data)
            }
            var event = {
                type: MsgType.EVENT,
                cmd: MsvCmd.UPDATE,
                data: msv_data_list
            };
            output(event);
            return msv_data_list
        };
        var send = function (msg) {
            var response;
            if (msg.cmd == MsvCmd.UPDATE) {
                response = {
                    type: MsgType.RESPONSE,
                    cmd: MsvCmd.UPDATE,
                    tunnel: msg.tunnel || null,
                    data: process_update(msg.data)
                }
            } else if (msg.cmd == MsvCmd.GET) {
                response = {
                    type: MsgType.RESPONSE,
                    cmd: MsvCmd.GET,
                    tunnel: msg.tunnel || null,
                    data: db.get_msvs(msg.data)
                };
                output(response)
            } else if (msg.cmd == MsvCmd.CREATE) {
                response = {
                    type: MsgType.RESPONSE,
                    cmd: MsvCmd.CREATE,
                    tunnel: msg.tunnel || null,
                    data: db.create_msvs(msg.data)
                };
                output(response)
            }
            return true
        };
        var get_skew = function () {
            return 0
        };
        var get_trans = function () {
            return 0
        };
        var is_connected = function () {
            return true
        };
        var get_type = function () {
            return "local"
        };
        var get_host = function () {
            return ""
        };
        var get_url = function () {
            return "msv:///"
        };
        self.set_onmessage = function (handler) {
            onmessage = handler
        };
        self.set_onconnect = function (handler) { };
        self.get_server_clock = MSV.client_clock;
        self.get_skew = get_skew;
        self.get_trans = get_trans;
        self.send = send;
        self.is_connected = is_connected;
        self.get_type = get_type;
        self.get_host = get_host;
        self.get_url = get_url;
        return self
    };
    _MSV_.IOLocal = IOLocal;
    _MSV_.makeMsvDB = makeMsvDB;
    return _MSV_
}(MSV || {});
try {
    if (!Object.prototype.__defineGetter__ && Object.defineProperty({}, "x", {
        get: function () {
            return true
        }
    }).x) {
        Object.defineProperty(Object.prototype, "__defineGetter__", {
            enumerable: false,
            configurable: true,
            value: function (name, func) {
                Object.defineProperty(this, name, {
                    get: func,
                    enumerable: true,
                    configurable: true
                })
            }
        });
        Object.defineProperty(Object.prototype, "__defineSetter__", {
            enumerable: false,
            configurable: true,
            value: function (name, func) {
                Object.defineProperty(this, name, {
                    set: func,
                    enumerable: true,
                    configurable: true
                })
            }
        })
    }
} catch (defPropException) { }
var MSV = function (_MSV_) {
    var P = MSV.P;
    var V = MSV.V;
    var A = MSV.A;
    var T = MSV.T;
    var MsvCmd = MSV.MsvCmd;
    var MsgType = MSV.MsgType;
    var MsvError = function (message) {
        this.name = "MsvError";
        this.message = message || ""
    };
    MsvError.prototype = Error.prototype;
    var requestManager = function (msvclient, io) {
        var self = {};
        var reqid_counter = 0;
        var pending = {};
        var get_reqid = function () {
            return reqid_counter++
        };
        var do_request = function (msg) {
            var reqid = get_reqid();
            msg.tunnel = reqid;
            var tid = setTimeout(function () {
                handle_timeout(reqid)
            }, 5e5);
            var request = {
                msg: msg,
                tid: tid,
                sent: false
            };
            pending[reqid] = request;
            return send(reqid)
        };
        var send = function (reqid) {
            if (io.is_connected()) {
                if (pending.hasOwnProperty(reqid)) {
                    var request = pending[reqid];
                    if (!request.sent) {
                        try {
                            io.send(request.msg)
                        } catch (e) {
                            return false
                        }
                        request.sent = true;
                        return true
                    }
                }
            }
            return false
        };
        var handle_connect = function () {
            if (io.is_connected()) {
                for (var reqid in pending) {
                    send(reqid)
                }
            }
        };
        var handle_response = function (response_msg) {
            var request_msg;
            var reqid = response_msg.tunnel;
            delete response_msg.tunnel;
            if (pending.hasOwnProperty(reqid)) {
                request_msg = pending[reqid].msg;
                cleanup(reqid)
            }
            if (request_msg) {
                delete request_msg.tunnel
            }
            return request_msg
        };
        var handle_timeout = function (reqid) {
            if (pending.hasOwnProperty(reqid)) {
                var request_msg = pending[reqid].msg;
                cleanup(reqid);
                msvclient.ontimeout(request_msg)
            }
        };
        var cleanup = function (reqid) {
            if (pending.hasOwnProperty(reqid)) {
                var tid = pending[reqid].tid;
                if (tid !== null) {
                    clearTimeout(tid)
                }
                delete pending[reqid]
            }
        };
        self.get_reqid = get_reqid;
        self.do_request = do_request;
        self.handle_connect = handle_connect;
        self.handle_response = handle_response;
        return self
    };
    var TokenObject = function () {
        this._token = undefined;
        this._confirmed = false
    };
    TokenObject.prototype.refresh = function (token) {
        this._token = token;
        this._confirmed = false
    };
    TokenObject.prototype.confirm = function () {
        this._confirmed = true
    };
    TokenObject.prototype.isConfirmed = function () {
        return this._confirmed
    };
    TokenObject.prototype.__defineGetter__("token", function () {
        return this._token
    });
    var tokenToString = function (token) {
        if (!token.ticket) {
            console.log("Warning, serializing token without ticket")
        }
        return token.appid + "." + token.ticket
    };
    var tokenManager = function (timeoutHandler) {
        var _tokenMap = {};
        var refreshToken = function (msvidList, token) {
            if (!token || token.ticket === undefined) {
                throw new Error("refreshToken called on undefined token")
            }
            var timeleft = token.expire - new Date;
            var tid = setTimeout(function () {
                internalTimeoutHandler(msvidList, token)
            }, timeleft);
            msvidList.forEach(function (msvid) {
                if (!_tokenMap.hasOwnProperty(msvid)) {
                    _tokenMap[msvid] = new TokenObject
                }
                _tokenMap[msvid].refresh(token)
            })
        };
        var internalTimeoutHandler = function (msvidList, token) {
            var timeout_msvid_list = msvidList.filter(function (msvid) {
                return _tokenMap.hasOwnProperty(msvid) && _tokenMap[msvid].token === token
            });
            if (timeout_msvid_list.length > 0) {
                timeoutHandler(timeout_msvid_list, token)
            }
        };
        var confirmToken = function (msvidList, token_str) {
            msvidList.forEach(function (msvid) {
                if (!_tokenMap.hasOwnProperty(msvid)) throw new MsvError("not tokenObject for given msvid " + msvid);
                if (tokenToString(_tokenMap[msvid].token) === token_str) {
                    _tokenMap[msvid].confirm()
                }
            })
        };
        var getToken = function (msvid) {
            return _tokenMap.hasOwnProperty(msvid) ? _tokenMap[msvid].token : null
        };
        var getMsvidListByToken = function (token) {
            return Object.keys(_tokenMap).filter(function (msvid) {
                return _tokenMap[msvid].token === token
            })
        };
        var sortByToken = function (msvidList) {
            var token, res = {};
            msvidList.forEach(function (msvid) {
                token = tokenToString(_tokenMap[msvid].token);
                if (!res.hasOwnProperty(token)) {
                    res[token] = []
                }
                res[token].push(msvid)
            });
            return res
        };
        var isConfirmed = function (msvid) {
            return _tokenMap.hasOwnProperty(msvid) ? _tokenMap[msvid].isConfirmed() : false
        };
        return {
            refreshToken: refreshToken,
            confirmToken: confirmToken,
            getToken: getToken,
            getMsvidListByToken: getMsvidListByToken,
            isConfirmed: isConfirmed,
            sortByToken: sortByToken
        }
    };
    var msvclient = function (io, token, options) {
        var api_public = {};
        var api_proxy = {};
        var api_request = {};
        var _tokenManager;
        var _defaultToken = token;
        var req_manager;
        var msv_map = {};
        var proxy_map = {};
        var server_version;
        var parseNumber = function (n) {
            var f = parseFloat(n);
            if (!isNaN(f) && isFinite(n)) {
                return f
            }
            return null
        };
        var is_valid_event = function (msv_data) {
            if (!msv_data) return false;
            if (!msv_data.vector || msv_data.vector.length !== 4) return false;
            if (!msv_data.hasOwnProperty("eventid")) return false;
            if (!msv_data.hasOwnProperty("msvid")) return false;
            return true
        };
        var is_valid_update = function (msv_data) {
            if (!msv_data) return false;
            if (!msv_data.hasOwnProperty("msvid")) return false;
            if (!msv_data.vector) return false;
            try {
                for (var i = 0; i < 3; i++) {
                    if (msv_data.vector[i] === null || msv_data.vector[i] === undefined) continue;
                    else {
                        var f = parseNumber(msv_data.vector[i]);
                        if (f === null) {
                            return false
                        } else {
                            msv_data.vector[i] = f
                        }
                    }
                }
            } catch (e) {
                return false
            }
            return true
        };
        var is_valid_response = function (msv_data) {
            return is_valid_event(msv_data)
        };
        var has_read_access = function (msv_data) {
            var cred = msv_data.cred || [true, true, true];
            return cred[0]
        };
        var has_write_access = function (msv_data) {
            var cred = msv_data.cred || [true, true, true];
            return cred[1]
        };
        var transform_vector = function (v) {
            var server_ts = v[MSV.T];
            var client_ts = server_ts - io.get_skew();
            return [v[MSV.P], v[MSV.V], v[MSV.A], client_ts]
        };
        var transform_vector_servertime = function (v) {
            var client_ts = v[MSV.T];
            var server_ts = client_ts + io.get_skew();
            return [v[MSV.P], v[MSV.V], v[MSV.A], server_ts]
        };
        var check_all_monitored = function (msvid_list) {
            var new_list = msvid_list.filter(has_msv);
            return new_list.length === msvid_list.length ? true : false
        };
        var check_all_params = function (msv_data_list) {
            var new_list = msv_data_list.filter(is_valid_update);
            return new_list.length === msv_data_list.length ? true : false
        };
        var make_msvid_list = function (msv_data_list) {
            var res = [];
            for (var i = 0; i < msv_data_list.length; i++) {
                res.push(msv_data_list[i].msvid)
            }
            return res
        };
        var _token_refresh = function (msvidList, token) {
            _tokenManager.refreshToken(msvidList, token);
            reget(msvidList, token)
        };
        var token_refresh = function (token) {
            var msvid_list = _tokenManager.getMsvidListByToken(_defaultToken);
            _defaultToken = token;
            _token_refresh(msvid_list, token)
        };
        var proxy_token_refresh = function (msvid, token) {
            if (new Date > token.expire) {
                throw new MsvError("token expired " + msvid)
            }
            _token_refresh([msvid], token)
        };
        var token_timeout_handler = function (token, msvid_list) {
            token_notify(msvid_list)
        };
        var token_notify = function (msvid_list) {
            msvid_list.forEach(function (msvid) {
                if (proxy_map.hasOwnProperty(msvid)) {
                    proxy_map[msvid].api_msvclient.handle_token()
                }
            })
        };
        var token_is_valid = function (msvid) {
            return _tokenManager.isConfirmed(msvid)
        };
        _tokenManager = tokenManager(token_timeout_handler);
        var update_msv_data = function (new_msv_data) {
            var msvid = new_msv_data.msvid;
            var before_vector;
            if (msv_map.hasOwnProperty(msvid)) {
                var msv_data = msv_map[msvid];
                if (new_msv_data.eventid <= msv_data.eventid) {
                    return false
                }
                before_vector = MSV.compute_msv(msv_data.vector, new_msv_data.vector[T]);
                msv_data.vector = new_msv_data.vector;
                msv_data.eventid = new_msv_data.eventid;
                msv_data.before_vector = before_vector
            } else {
                new_msv_data.before_vector = new_msv_data.vector;
                msv_map[msvid] = new_msv_data
            }
            if (proxy_map.hasOwnProperty(msvid)) {
                proxy_map[msvid].api_msvclient.handle_update()
            }
            return true
        };
        var onconnect = function () {
            req_manager.handle_connect();
            var msvidList = Object.keys(msv_map);
            reget(msvidList, _defaultToken);
            for (var msvid in proxy_map) {
                if (proxy_map.hasOwnProperty(msvid)) {
                    proxy_map[msvid].api_msvclient.handle_connect()
                }
            }
        };
        var onskewchange = function () {
            for (var msvid in proxy_map) {
                if (proxy_map.hasOwnProperty(msvid)) {
                    proxy_map[msvid].api_msvclient.handle_skewchange()
                }
            }
        };
        var onmessage = function (msg) {
            if (msg.type === MsgType.RESPONSE) {
                var request_msg = req_manager.handle_response(msg);
                if (!msg.hasOwnProperty("cmd")) throw new MsvError("illegal msg, cmd missing");
                if (msg.cmd == MsvCmd.GET) {
                    if (server_version === undefined) {
                        server_version = msg.v
                    }
                }
                if (server_version === "1") {
                    msg.status = msg.data.length > 0 ? 200 : 404
                }
                if (msg.status === 200) {
                    if (msg.cmd === MsvCmd.GET) {
                        var msvidList = msg.data.map(function (msvdata) {
                            return msvdata.msvid
                        });
                        _tokenManager.confirmToken(msvidList, request_msg.token);
                        for (var i = 0; i < msg.data.length; i++) {
                            if (is_valid_response(msg.data[i])) {
                                update_msv_data(msg.data[i])
                            }
                        }
                    }
                } else {
                    setTimeout(function () {
                        onerror(request_msg.data, msg.data)
                    }, 0)
                }
            }
            if (msg.type === MsgType.EVENT) {
                for (var j = 0; j < msg.data.length; j++) {
                    var msv_data = msg.data[j];
                    if (is_valid_event(msv_data)) {
                        update_msv_data(msv_data)
                    }
                }
            }
        };
        var ontimeout = function (request_msg) {
            if (request_msg.cmd === MsvCmd.GET) {
                setTimeout(function () {
                    onerror(request_msg.data, "GET timeout")
                }, 0)
            }
        };
        var onerror = function (msvid_list, reason) {
            console.log("ERROR:", reason);
            return
        };
        var last_updates = [];

        function isAcceptable() {
            last_updates.push(performance.now());
            if (last_updates.length < 16) {
                return true
            }
            var cutoff = 0;
            var now = performance.now();
            for (var i in last_updates) {
                if (now - last_updates[i] < 4e3) {
                    cutoff = i - 1;
                    break
                }
            }
            if (cutoff > 0) {
                last_updates.splice(0, cutoff)
            }
            if (last_updates.length > 40) {
                console.log("WARNING: Too many updates, please check http://dev.mcorp.no for how to use motions in interactive settings (", last_updates.length, "updates in", now - last_updates[0], "ms");
                return false
            }
            return true
        }
        var update = function (arg_list) {
            if (!isAcceptable()) {
                throw new Error("Too many updates, ignored")
            }
            var server_ts = io.get_server_clock();
            var msvid_list = make_msvid_list(arg_list);
            var all = check_all_monitored(msvid_list);
            if (!all) {
                throw new MsvError("prior GET has not yet succeeded")
            }
            var tmp_list = msvid_list.filter(can_update);
            if (tmp_list.length !== arg_list.length) {
                throw new MsvError("write access has not been granted")
            }
            all = check_all_params(arg_list);
            if (!all) {
                throw new MsvError("illegal update parameter")
            }
            var token, tokenMap = {};
            arg_list.forEach(function (arg) {
                token = tokenToString(_tokenManager.getToken(arg.msvid));
                if (!tokenMap.hasOwnProperty(token)) {
                    tokenMap[token] = []
                }
                arg.vector[T] = server_ts;
                tokenMap[token].push(arg)
            });
            var msg;
            for (token in tokenMap) {
                msg = {
                    cmd: MsvCmd.UPDATE,
                    token: token,
                    data: tokenMap[token]
                };
                if (server_version === "1") {
                    msg.type = MsgType.MESSAGE;
                    io.send(msg)
                } else if (server_version === "2") {
                    msg.type = MsgType.REQUEST;
                    req_manager.do_request(msg)
                }
            }
        };
        var get = function (msvid_list, token) {
            token = token || _defaultToken;
            _tokenManager.refreshToken(msvid_list, token);
            _get(msvid_list, token)
        };
        var _get = function (msvid_list, token) {
            if (!token || !token.ticket) {
                throw new Error("Token is undefined, that's never supposed to happen")
            }
            if (msvid_list.length === 0) return false;
            var msg = {
                type: MsgType.REQUEST,
                cmd: MsvCmd.GET,
                token: tokenToString(token),
                data: msvid_list
            };
            return req_manager.do_request(msg)
        };
        var reget = function (msvid_list, token) {
            if (!token || !token.ticket) {
                throw new Error("Token is undefined, that's never supposed to happen")
            }
            if (token === "[object Object]" || token === "undefined.undefined") {
                throw new Error("Bad token")
            }
            if (io.is_connected()) {
                try {
                    _get(msvid_list, token)
                } catch (err) {
                    console.log("warning", err.message)
                }
            }
        };
        var has_msv = function (msvid) {
            return msv_map.hasOwnProperty(msvid)
        };
        var get_msv = function (msvid) {
            var list = get_msvs([msvid]);
            return list.length > 0 ? [] : null
        };
        var get_msvs = function (msvid_list) {
            var msv_list = [];
            for (var i = 0; i < msvid_list.length; i++) {
                var msvid = msvid_list[i];
                if (!proxy_map.hasOwnProperty(msvid)) {
                    proxy_map[msvid] = msvproxy(api_proxy, msvid)
                }
                msv_list.push(proxy_map[msvid].api_public)
            }
            var get_list = [];
            for (var j = 0; j < msvid_list.length; j++) {
                var msvid2 = msvid_list[j];
                if (!has_msv(msvid2)) get_list.push(msvid2)
            }
            var first = 0;
            var last;
            while (first < get_list.length) {
                last = Math.min(get_list.length, first + 50);
                get(get_list.slice(first, last));
                first = last
            }
            return msv_list
        };
        var get_vector = function (msvid) {
            if (msv_map.hasOwnProperty(msvid)) {
                return transform_vector(msv_map[msvid].vector)
            }
            return null
        };
        var get_original_vector = function (msvid) {
            if (msv_map.hasOwnProperty(msvid)) {
                return msv_map[msvid].vector
            }
            return null
        };
        var get_before_vector = function (msvid) {
            if (msv_map.hasOwnProperty(msvid)) {
                return transform_vector(msv_map[msvid].before_vector)
            }
            return null
        };
        var query = function (msvid) {
            var v = get_vector(msvid);
            return v !== null ? MSV.compute_msv(v, MSV.client_clock()) : null
        };
        var proxy_update = function (msvid, p, v, a, options) {
            update([{
                msvid: msvid,
                vector: [p, v, a]
            }])
        };
        var is_moving = function (msvid) {
            var v = get_vector(msvid);
            return v !== null ? MSV.is_moving(v) : null
        };
        var get_direction = function (msvid) {
            var v = get_vector(msvid);
            return v !== null ? MSV.compute_direction(v, MSV.client_clock()) : null
        };
        var get_range = function (msvid) {
            return msv_map.hasOwnProperty(msvid) ? msv_map[msvid].range : null
        };
        var can_update = function (msvid) {
            return msv_map.hasOwnProperty(msvid) ? has_write_access(msv_map[msvid]) : null
        };
        var get_cred = function (msvid) {
            if (msv_map.hasOwnProperty(msvid)) {
                var msv_data = msv_map[msvid];
                var s = "";
                if (has_read_access(msv_data)) s += "r";
                if (has_write_access(msv_data)) s += "w";
                return s
            }
            return null
        };
        var proxy_get_url = function (msvid) {
            return io !== null ? io.get_url() + msvid : null
        };
        var get_skew = function () {
            return io !== null ? io.get_skew() : null
        };
        var get_latency = function () {
            return io !== null ? io.get_trans() : null
        };
        var is_connected = function () {
            return io !== null ? io.is_connected() : false
        };
        var conn_type = function () {
            return io !== null ? io.get_type() : ""
        };
        api_public.get_msvs = get_msvs;
        api_public.get_msv = get_msv;
        api_public.token_refresh = token_refresh;
        api_public.token_is_valid = token_is_valid;
        api_proxy.token_refresh = proxy_token_refresh;
        api_proxy.token_is_valid = token_is_valid;
        api_proxy.has_msv = has_msv;
        api_proxy.query = query;
        api_proxy.is_moving = is_moving;
        api_proxy.get_direction = get_direction;
        api_proxy.update = proxy_update;
        api_proxy.can_update = can_update;
        api_proxy.get_url = proxy_get_url;
        api_proxy.get_range = get_range;
        api_proxy.get_vector = get_vector;
        api_proxy.get_original_vector = get_original_vector;
        api_proxy.get_before_vector = get_before_vector;
        api_proxy.get_skew = get_skew;
        api_proxy.get_latency = get_latency;
        api_proxy.is_connected = is_connected;
        api_proxy.conn_type = conn_type;
        api_proxy.get_cred = get_cred;
        api_request.ontimeout = ontimeout;
        req_manager = requestManager(api_request, io);
        io.set_onmessage(onmessage);
        io.set_onconnect(onconnect);
        io.set_onskewchange(onskewchange);
        return api_public
    };
    var _local_msvclient = null;
    var _remote_msvclients = {};
    var get_msvclient = function (host, token, ssl) {
        var io;
        if (new Date > token.expire) {
            throw new MsvError("Token expired")
        }
        if (host === "") {
            if (_local_msvclient === null) {
                if (!MSV.IOLocal) throw new MsvError("Local Motion Not Supported");
                io = MSV.IOLocal();
                _local_msvclient = msvclient(io, token)
            }
            return _local_msvclient
        } else {
            var key = host + "/" + token.appid;
            if (!_remote_msvclients.hasOwnProperty(key)) {
                io = MSV.IORemote(host, {
                    ssl: ssl
                });
                _remote_msvclients[key] = msvclient(io, token)
            }
            return _remote_msvclients[key]
        }
    };
    var token_refresh = function (token) {
        if (new Date > token.expire) {
            return
        }
        var client;
        for (var key in _remote_msvclients) {
            if (!_remote_msvclients.hasOwnProperty(key)) continue;
            client = _remote_msvclients[key];
            client.token_refresh(token)
        }
    };
    var get_msv = function (url, token, ssl) {
        return get_msvs([url], token, ssl)[0]
    };
    var get_msvs = function (url_list, token, ssl) {
        if (ssl === undefined) {
            ssl = true
        }
        if (!token.hasOwnProperty("appid")) throw new MsvError("Illegal token, must specify 'appid'");
        if (!token.hasOwnProperty("user")) {
            if (token.hasOwnProperty("ticket")) {
                token.user = token.ticket
            } else {
                throw new MsvError("Illegal token, must specify 'user'")
            }
        }
        if (!token.hasOwnProperty("expire")) throw new MsvError("Illegal token, must specify 'expire'");
        if (new Date > token.expire) {
            throw new MsvError("Token expired")
        }
        var u, host, client, msvid, msv_list = [];
        var map = {};
        for (var i = 0; i < url_list.length; i++) {
            u = MSV.urlparse(url_list[i]);
            host = u.get_host();
            msvid = u.get_msvid();
            if (!map.hasOwnProperty(host)) {
                map[host] = []
            }
            if (msvid === "") {
                throw new MsvError("msvid is empty string")
            }
            map[host].push(msvid)
        }
        for (host in map) {
            if (!map.hasOwnProperty(host)) continue;
            client = get_msvclient(host, token, ssl);
            msv_list = msv_list.concat(client.get_msvs(map[host]))
        }
        return msv_list
    };
    var msvinfo = function (v) {
        if (v === null) return null;
        return {
            pos: v[MSV.P],
            vel: v[MSV.V],
            acc: v[MSV.A],
            ts: v[MSV.T]
        }
    };
    var STATE = Object.freeze({
        INIT: "init",
        CONNECTING: "connecting",
        EXPIRED: "expired",
        OPEN: "open",
        CLOSED: "closed"
    });
    var msvproxy = function (msvclient, msvid) {
        var api_public = {};
        var api_msvclient = {};
        var readystate = function () {
            var _readystate = STATE.INIT;
            return {
                set: function (new_state) {
                    if (_readystate === STATE.CLOSED) return;
                    if (new_state !== _readystate) {
                        _readystate = new_state;
                        _do_callbacks("readystatechange", new_state)
                    }
                },
                get: function () {
                    return _readystate
                }
            }
        }();
        var refresh_readystate = function () {
            if (msvclient.has_msv(msvid)) {
                if (msvclient.token_is_valid(msvid)) {
                    var state = msvclient.is_connected() ? STATE.OPEN : STATE.CONNECTING;
                    readystate.set(state)
                } else {
                    readystate.set(STATE.EXPIRED)
                }
            }
        };
        var timeupdate_timer = null;
        var last_timeupdate = null;
        var _callbacks = {
            readystatechange: [],
            change: [],
            timeupdate: [],
            error: [],
            skewchange: []
        };
        var _do_callbacks = function (what, e, handler) {
            if (!_callbacks.hasOwnProperty(what)) throw new MsvError("Unsupported event " + what);
            var h;
            for (var i = 0; i < _callbacks[what].length; i++) {
                h = _callbacks[what][i];
                if (handler === undefined) {
                    if (h["_immediate_pending_" + what + msvid]) {
                        continue
                    }
                } else {
                    if (h === handler) handler["_immediate_pending_" + what + msvid] = false;
                    else {
                        continue
                    }
                }
                try {
                    h.call(h["_ctx_" + what + msvid], e)
                } catch (e2) {
                    console.log("Error in " + what + ": " + h + ": ", e2)
                }
            }
        };
        var on = function (what, handler, ctx) {
            if (!handler || typeof handler !== "function") throw new MsvError("Illegal handler");
            if (what === "vectorchange") what = "change";
            if (!_callbacks.hasOwnProperty(what)) throw new MsvError("Unsupported event " + what);
            var index = _callbacks[what].indexOf(handler);
            if (index === -1) {
                handler["_ctx_" + what + msvid] = ctx || api_public;
                _callbacks[what].push(handler);
                handler["_immediate_pending_" + what + msvid] = true;
                setTimeout(function () {
                    if (what === "readystatechange") {
                        _do_callbacks("readystatechange", readystate.get(), handler)
                    } else if (what === "change") {
                        if (readystate.get() === STATE.INIT) {
                            handler["_immediate_pending_" + what + msvid] = false
                        } else {
                            _do_callbacks("change", query(), handler)
                        }
                    } else if (what === "timeupdate") {
                        if (readystate.get() === STATE.INIT) {
                            handler["_immediate_pending_" + what + msvid] = false
                        } else {
                            _do_callbacks("timeupdate", query(), handler)
                        }
                    } else if (what === "error") {
                        handler["_immediate_pending_" + what + msvid] = false
                    } else if (what === "skewchange") {
                        if (readystate.get() === STATE.INIT) {
                            handler["_immediate_pending_" + what + msvid] = false
                        } else {
                            _do_callbacks("skewchange", undefined, handler)
                        }
                    }
                }, 0)
            }
            return api_public
        };
        var off = function (what, handler) {
            if (_callbacks[what] !== undefined) {
                var index = _callbacks[what].indexOf(handler);
                if (index > -1) _callbacks[what].splice(index, 1)
            }
            return api_public
        };
        var handle_update = function () {
            refresh_readystate();
            var e = query();
            _do_callbacks("change", e);
            _do_callbacks("timeupdate", e);
            var is_moving = msvclient.is_moving(msvid);
            if (is_moving && timeupdate_timer === null) {
                timeupdate_timer = setInterval(function () {
                    _do_callbacks("timeupdate", query())
                }, 200)
            } else if (!is_moving && timeupdate_timer !== null) {
                clearTimeout(timeupdate_timer);
                timeupdate_timer = null
            }
        };
        var handle_skewchange = function () {
            _do_callbacks("skewchange", undefined)
        };
        var handle_connect = function () {
            refresh_readystate()
        };
        var handle_token = function () {
            refresh_readystate()
        };
        var handle_error = function (e) {
            readystate.set(STATE.CLOSED);
            _do_callbacks("error", e)
        };
        var isValid = function () {
            return readystate.get() !== STATE.CLOSED && readystate.get() !== STATE.INIT
        };
        var query = function () {
            return msvinfo(msvclient.query(msvid))
        };
        var update = function (p, v, a, options) {
            if (typeof p === "object" && p !== null && p !== undefined) {
                return msvclient.update(msvid, p.position, p.velocity, p.acceleration)
            } else {
                return msvclient.update(msvid, p, v, a, options)
            }
        };
        var getState = function () {
            return isValid() ? {
                readyState: readystate.get(),
                latency: msvclient.get_latency(),
                skew: msvclient.get_skew(),
                range: msvclient.get_range(msvid),
                connType: msvclient.conn_type(),
                src: msvclient.get_url(msvid),
                vector: msvclient.get_vector(msvid),
                lastVector: msvclient.get_before_vector(msvid),
                cred: msvclient.get_cred(msvid)
            } : {
                readyState: readystate.get(),
                latency: msvclient.get_latency(),
                skew: msvclient.get_skew(),
                connType: msvclient.conn_type(),
                src: msvclient.get_url(msvid)
            }
        };
        var isMoving = function () {
            return isValid() ? msvclient.is_moving(msvid) : null
        };
        var getDirection = function () {
            return isValid() ? msvclient.get_direction(msvid) : null
        };
        var tokenRefresh = function () {
            return isValid() ? msvclient.token_refresh(msvid) : null
        };
        api_msvclient.handle_update = handle_update;
        api_msvclient.handle_connect = handle_connect;
        api_msvclient.handle_error = handle_error;
        api_msvclient.handle_token = handle_token;
        api_msvclient.handle_skewchange = handle_skewchange;
        api_public.__defineGetter__("STATE", function () {
            return STATE
        });
        api_public.query = query;
        api_public.update = update;
        api_public.isMoving = isMoving;
        api_public.getDirection = getDirection;
        api_public.tokenRefresh = tokenRefresh;
        api_public.__defineGetter__("pos", function () {
            return query().pos
        });
        api_public.__defineGetter__("vel", function () {
            return query().vel
        });
        api_public.__defineGetter__("acc", function () {
            return query().acc
        });
        api_public.getState = getState;
        api_public.getInfo = getState;
        api_public.on = on;
        api_public.off = off;
        api_public.__defineGetter__("readyState", readystate.get);
        api_public.__defineGetter__("msvid", function () {
            return msvid
        });
        api_public.__defineGetter__("id", function () {
            return msvid
        });
        api_public.__defineGetter__("src", function () {
            return msvclient.get_url(msvid)
        });
        Object.defineProperty(api_public, "skew", {
            get: function () {
                return msvclient.get_skew()
            }
        });
        Object.defineProperty(api_public, "vector", {
            get: function () {
                var v = msvclient.get_original_vector(msvid);
                return {
                    position: v[P],
                    velocity: v[V],
                    acceleration: v[A],
                    timestamp: v[T]
                }
            }
        });
        Object.defineProperty(api_public, "range", {
            get: function () {
                var range = msvclient.get_range(msvid);
                if (range[0] === null) range[0] = -Infinity;
                if (range[1] === null) range[1] = Infinity;
                return range
            }
        });
        refresh_readystate();
        return {
            api_public: api_public,
            api_msvclient: api_msvclient
        }
    };
    _MSV_.msv = get_msv;
    _MSV_.get_msvs = get_msvs;
    _MSV_.token_refresh = token_refresh;
    _MSV_.get_msv = get_msv;
    _MSV_.msvclient = msvclient;
    _MSV_.msvproxy = msvproxy;
    _MSV_.get_msvclient = get_msvclient;
    return _MSV_
}(MSV || {});
var MCorp = function (_mcorp_) {
    (function () {
        if ("performance" in window === false) {
            window.performance = {};
            window.performance.offset = (new Date).getTime()
        }
        if ("now" in window.performance === false) {
            window.performance.now = function now() {
                return (new Date).getTime() - window.performance.offset
            }
        }
    })();
    var app_server = "https://dev.mcorp.no";
    var DEBUG = false;
    if (DEBUG) {
        app_server = "http://localhost:8080"
    }
    var XHR = function () {
        var api = {};
        api.get = function (url, params, onResult, onError) {
            var xhr = new XMLHttpRequest;
            url += "?";
            for (var i in params) {
                url += i + "=" + params[i] + "&"
            }
            xhr.open("GET", url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    onResult(JSON.parse(xhr.response))
                }
            };
            xhr.send()
        };
        return api
    }();
    var JSONP = function () {
        var counter = 0,
            head, window = this,
            config = {};

        function load(url, pfnError) {
            var script = document.createElement("script"),
                done = false;
            script.src = url;
            script.async = true;
            var errorHandler = pfnError || config.error;
            if (typeof errorHandler === "function") {
                script.onerror = function (ex) {
                    errorHandler({
                        url: url,
                        event: ex
                    })
                }
            }
            script.onload = script.onreadystatechange = function () {
                if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                    done = true;
                    script.onload = script.onreadystatechange = null;
                    if (script && script.parentNode) {
                        script.parentNode.removeChild(script)
                    }
                }
            };
            if (!head) {
                head = document.getElementsByTagName("head")[0]
            }
            head.appendChild(script)
        }

        function encode(str) {
            return encodeURIComponent(str)
        }

        function jsonp(url, params, callback, onError) {
            var query = (url || "").indexOf("?") === -1 ? "?" : "&",
                key;
            callbackName = config.callbackName || "callback";
            var uniqueName = callbackName + "_json" + ++counter;
            params = params || {};
            for (key in params) {
                if (params.hasOwnProperty(key)) {
                    query += encode(key) + "=" + encode(params[key]) + "&"
                }
            }
            window[uniqueName] = function (data) {
                if (callback) {
                    callback(data)
                }
                try {
                    delete window[uniqueName]
                } catch (e) { }
                window[uniqueName] = null
            };
            load(url + query + callbackName + "=" + uniqueName, onError);
            return uniqueName
        }

        function setDefaults(obj) {
            config = obj
        }
        return {
            get: jsonp,
            init: setDefaults
        }
    }();
    var STATE = Object.freeze({
        INIT: "init",
        USER: "user",
        CTX: "context",
        OPEN: "open",
        CLOSED: "closed"
    });
    var app = function (appid, options) {
        var self = {
            run: null
        };
        var _token;
        var _user;
        var _logout_url;
        var _msvs = {};
        var _sid;
        var canCast = false;
        var isBusy;
        var cast_session;
        var applicationID = "C95AB3AB";
        options = options || {};
        options.role = options.role || "default";
        if (options.xhr) {
            console.log("USE XHR, not JSONP");
            JSONP = XHR
        }
        var _profile = {};
        var readystate = function () {
            var _readystate = STATE.INIT;
            if (options.profile) _profile.state_init = performance.now();
            return {
                set: function (new_state) {
                    found = false;
                    for (var key in STATE) {
                        if (!STATE.hasOwnProperty(key)) continue;
                        if (STATE[key] === new_state) found = true
                    }
                    if (!found) throw new Error("Illegal state value " + new_state);
                    if (_readystate === STATE.CLOSED) return;
                    if (new_state !== _readystate) {
                        _readystate = new_state;
                        _do_callbacks("readystatechange", new_state)
                    }
                },
                get: function () {
                    return _readystate
                }
            }
        }();
        if (options.profile) {
            setTimeout(function () {
                var url = app_server + "/magic.py/report_stats";
                var params = {
                    profile: JSON.stringify(_profile),
                    appid: appid,
                    result: readystate.get()
                };
                JSONP.get(url, params)
            }, 6e3)
        }
        var _callbacks = {
            readystatechange: [],
            cancast: [],
            castbusy: []
        };
        var _do_callbacks = function (what, e, handler) {
            if (!_callbacks.hasOwnProperty(what)) throw "Unsupported event " + what;
            var h;
            for (var i = 0; i < _callbacks[what].length; i++) {
                h = _callbacks[what][i];
                if (handler === undefined) {
                    if (h._immediate_pending) {
                        continue
                    }
                } else {
                    if (h === handler) handler._immediate_pending = false;
                    else {
                        continue
                    }
                }
                try {
                    h.call(self, e)
                } catch (e2) {
                    console.log("Error in " + what + ": " + h + ": ", e2);
                    throw new Error("Error in " + what + ": " + h + ": " + e2)
                }
            }
        };
        var off = function (what, handler) {
            if (_callbacks[what] !== undefined) {
                var index = _callbacks[what].indexOf(handler);
                if (index > -1) {
                    _callbacks[what].splice(index, 1)
                }
            }
            return self
        };
        var on = function (what, handler) {
            if (!handler || typeof handler !== "function") throw "Illegal handler";
            if (!_callbacks.hasOwnProperty(what)) throw "Unsupported event " + what;
            var index = _callbacks[what].indexOf(handler);
            if (index === -1) {
                _callbacks[what].push(handler);
                setTimeout(function () {
                    if (what === "readystatechange") {
                        handler._immediate_pending = true;
                        _do_callbacks(what, readystate.get(), handler)
                    }
                    if (what === "cancast" && canCast) {
                        handler._immediate_pending = true;
                        _do_callbacks(what, canCast, handler)
                    }
                    if (what === "castbusy" && isBusy !== undefined) {
                        handler._immediate_pending = true;
                        _do_callbacks(what, isBusy, handler)
                    }
                }, 0)
            }
            return self
        };
        var cast = function (url, onSuccess, onError) {
            if (!canCast) {
                throw new Error("No ChromeCast support")
            }
            if (!url && !options.castURL) {
                throw new Error("Need URL to cast")
            }
            if (cast_session) {
                cast_session.stop()
            }
            get_session(function (res) {
                if (res.result === "error") {
                    onError(res.message);
                    return
                }
                _sid = res.sid;
                chrome.cast.requestSession(function (s) {
                    cast_session = s;
                    cast_session.addUpdateListener(function (e) {
                        isBusy = e;
                        _do_callbacks("castbusy", e)
                    });
                    cast_url(url, onSuccess, onError)
                }, function (err) {
                    console.log("Session request failed:", err)
                })
            })
        };
        var stop_cast = function () {
            if (cast_session) {
                cast_session.stop()
            }
        };
        var onComplete = function () {
            if (options.profile) _profile.state_open = performance.now();
            readystate.set(STATE.OPEN);
            if (self.run !== null) {
                try {
                    self.run.call(self)
                } catch (err) {
                    onError(err);
                    console.log("Error in ready handler:", err.stack || err)
                }
            }
        };
        var onError = function (err) {
            readystate.set(STATE.CLOSED);
            if (err == "Quota exceeded") {
                console.log("ERROR: Quota has been exceed")
            }
            throw new Error("Context failed:" + err + "," + err.stack || "")
        };
        var request_context = function (msvlist, onSuccess) {
            if (options.profile) _profile.request_contextStart = performance.now();
            var ts_cs = (new Date).getTime(),
                ts_cr;
            var url = app_server + "/magic.py/get_context";
            var params = {
                app_id: appid,
                role: options.role,
                referrer: window.location.href
            };
            if (options.anon) {
                params.anon = true
            }
            var msvs = msvlist || options.msvs;
            if (msvs) {
                if (msvs instanceof Array) {
                    params.msvs = msvs.join()
                } else {
                    params.msvs = msvs
                }
            }
            var onResult = function (result) {
                if (readystate != "open" && options.profile) _profile.request_contextSuccess = performance.now();
                ts_cr = (new Date).getTime();
                if (result.error === "signin") {
                    if (DEBUG) {
                        window.location = app_server + result.url;
                        return
                    }
                    window.location = result.url;
                    return
                }
                if (result.result === "error") {
                    onError(result.message);
                    return
                }
                set_token(result, ts_cs, ts_cr);
                if (DEBUG) {
                    _logout_url = app_server + result.logout_url
                } else {
                    _logout_url = result.logout_url
                }
                initialise_msvs(result);
                if (readystate != "open") {
                    schedule_token_refresh(url, params);
                    readystate.set(STATE.CTX);
                    if (options.profile) _profile.state_context = performance.now()
                }
                if (onSuccess) onSuccess()
            };
            JSONP.get(url, params, onResult, onError)
        };
        var request_groupcontext = function (sid) {
            if (options.profile) _profile.request_groupcontextStart = performance.now();
            var ts_cs = (new Date).getTime(),
                ts_cr;
            var url = app_server + "/magic.py/get_groupcontext";
            var params = {
                sid: sid,
                referrer: window.location.href
            };
            var onResult = function (result) {
                if (options.profile) _profile.request_groupcontextSuccess = performance.now();
                if (result.result === "error") {
                    console.log("group_context failed, trying normal:", result);
                    request_context();
                    return
                }
                ts_cr = (new Date).getTime();
                set_token(result, ts_cs, ts_cr);
                initialise_msvs(result);
                schedule_token_refresh(url, params, false);
                readystate.set(STATE.CTX);
                if (options.profile) _profile.state_context = performance.now()
            };
            JSONP.get(url, params, onResult, request_context)
        };
        var get_association = function (key, onSuccess, onError) {
            var url = app_server + "/magic.py/get_association";
            var params = {
                id: key,
                referrer: window.location
            };
            JSONP.get(url, params, onSuccess, onError)
        };
        var set_association = function (key, value, onSuccess, onError) {
            var url = app_server + "/magic.py/set_association";
            var params = {
                id: key,
                value: JSON.stringify(value),
                referrer: window.location
            };
            JSONP.get(url, params, onSuccess, onError)
        };
        var set_token = function (ctx_result, cs, cr) {
            var ss = ctx_result.ts * 1e3;
            var skew = ss - (cr + cs) / 2;
            var expire = ctx_result.exp * 1e3 - skew;
            _token = {
                appid: appid,
                ticket: ctx_result.t,
                expire: new Date(expire)
            }
        };
        var get_token = function () {
            return _token
        };
        var get_session = function (onSuccess, onError) {
            if (_sid) {
                onSuccess({
                    result: "success",
                    sid: _sid
                });
                return
            }
            var url = app_server + "/magic.py/get_session";
            var params = {
                app_id: appid,
                referrer: window.location
            };
            JSONP.get(url, params, onSuccess, onError)
        };
        var msvs_left;
        var profile_start;
        var _last_latency = 1e3;
        var profile_skew = function (msv) {
            if (_profile.skew === undefined) {
                _profile.skew = [];
                profile_start = performance.now()
            }
            if (msv.getState() === null) {
                setTimeout(function () {
                    profile_skew(msv)
                }, 10);
                return
            }
            var info = msv.getInfo();
            if (_last_latency != info.latency) {
                _last_latency = info.latency;
                _profile.skew.push({
                    time: performance.now(),
                    skew: info.skew,
                    latency: info.latency
                })
            }
            var now = performance.now() - profile_start;
            if (now < 5e3) {
                setTimeout(function () {
                    profile_skew(msv)
                }, 50)
            }
            return true
        };
        var is_profiling = false;
        var on_msv_readystatechange = function (state, msv) {
            msv = this;
            if (!is_profiling) {
                try {
                    is_profiling = profile_skew(msv)
                } catch (err) {
                    alert(err)
                }
            }
            if (state !== msv.STATE.OPEN) {
                return
            }
            msvs_left -= 1;
            if (msvs_left === 0) {
                onComplete();
                if (options.profile) _profile.initialize_msvsEnd = performance.now()
            }
            msv.off("readystatechange", on_msv_readystatechange)
        };
        var initialise_msvs = function (ctx_result) {
            if (options.profile) _profile.initialize_msvsStart = performance.now();
            var msv_urls = [];
            var msv_nicks = {};
            for (var key in ctx_result.ms) {
                if (!ctx_result.ms.hasOwnProperty(key)) continue;
                msv_urls.push(ctx_result.ms[key].url);
                msv_nicks[ctx_result.ms[key].url] = ctx_result.ms[key].nick
            }
            msvs_left = msv_urls.length;
            var msv, msvs;
            if (msvs_left === 0) {
                setTimeout(onComplete, 0);
                if (options.profile) _profile.initialize_msvsEnd = performance.now()
            } else {
                msvs = MSV.get_msvs(msv_urls, get_token(), options.ssl);
                for (var key2 in msvs) {
                    if (!msvs.hasOwnProperty(key2)) continue;
                    msv = msvs[key2];
                    var nick = msv_nicks[msv.src];
                    if (nick === undefined) {
                        throw new Error(nick + " is undefined")
                    }
                    _msvs[nick] = msv;
                    msv.on("readystatechange", on_msv_readystatechange)
                }
            }
        };
        var get_msv_by_url = function (nick, url, token) {
            if (!nick || !url) {
                throw "Need nickname and url"
            }
            if (_msvs[nick] !== undefined) {
                throw "Already have msv " + nick
            }
            _msvs[nick] = MSV.get_msvs([url], token, options.ssl)[0];
            return _msvs[nick]
        };
        self.create_global_motion = function (nick, mode) {
            return new Promise(function (resolve, reject) {
                if (!nick) throw new Error("Need a nickname for the motion");
                if (!mode) mode = 1604;
                var params = {
                    mode: mode,
                    app_id: appid,
                    nick: nick,
                    referrer: window.location.href
                };
                if (!params["referrer"] || params["referrer"].indexOf("file:") == 0) throw new Error("Missing referrer - the page must be on a web server, not a file");
                var url = app_server + "/magic.py/create_msv";
                JSONP.get(url, params, function (response) {
                    if (response.result != "success") {
                        reject(response)
                    } else {
                        self.get_motions([nick]).then(resolve).catch(reject)
                    }
                }, reject)
            })
        };
        self.create_user_motion = function (nick, onSuccess, onError, mode) {
            return new Promise(function (resolve, reject) {
                if (!nick) throw new Error("Need a nickname for the motion");
                if (!mode) mode = 1536;
                var params = {
                    mode: mode,
                    app_id: appid,
                    nick: nick,
                    referrer: window.location.href
                };
                if (!params["referrer"] || params["referrer"].indexOf("file:") == 0) throw new Error("Missing referrer - the page must be on a web server, not a file");
                var url = app_server + "/magic.py/add_msv_template";
                JSONP.get(url, params, function (response) {
                    if (response.result != "success") {
                        reject(response)
                    } else {
                        self.get_motions([nick]).then(resolve).catch(reject)
                    }
                }, reject)
            })
        };
        var outstanding = 0;
        var schedule_token_refresh = function (url, params, retry) {
            if (retry === undefined) retry = true;
            var ts_cs, ts_cr;
            var onResult = function (result) {
                outstanding--;
                ts_cr = (new Date).getTime();
                set_token(result, ts_cs, ts_cr);
                MSV.token_refresh(get_token());
                schedule_token_refresh(url, params, retry)
            };
            var onError = function (err) {
                outstanding--;
                console.log("token refresh failed - will try again in 1 min: ", err);
                setTimeout(function () {
                    schedule_token_refresh(url, params)
                }, 6e4)
            };
            var timeleft = Math.max(0, get_token().expire - new Date - 3e5);
            if (timeleft === 0 && !retry) return;
            setTimeout(function () {
                if (outstanding > 0) return;
                outstanding++;
                ts_cs = (new Date).getTime();
                try {
                    JSONP.get(url, params, onResult, onError)
                } catch (err) {
                    onError(err)
                }
            }, timeleft)
        };

        function getParameterByName(name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "))
        }
        var init = function () {
            if (options.profile) _profile.initStart = performance.now();
            var sid = getParameterByName("_sid_");
            if (sid && !options.ignoreSession) {
                _sid = sid;
                request_groupcontext(sid)
            } else {
                request_context()
            }
            if (window.chrome) {
                var t;
                var doInit = function () {
                    if (chrome.cast && chrome.cast.isAvailable) {
                        clearInterval(t);
                        initializeCastApi();
                        return true
                    } else {
                        return false
                    }
                };
                if (!doInit()) {
                    t = setInterval(doInit, 100)
                }
            }
            return self
        };
        var logout = function () {
            if (_logout_url) {
                window.location = _logout_url
            }
        };
        var cast_url = function (url, onSuccess, onError) {
            if (options.castNoSesson) {
                session = undefined
            } else {
                if (_sid === undefined) {
                    get_session(function (res) {
                        if (res.result === "error") {
                            if (onError) onError(res.message);
                            return
                        }
                        _sid = res.sid;
                        cast_url(url, onSuccess, onError)
                    });
                    return
                }
                session = _sid
            }
            cast_session.sendMessage("urn:x-cast:no.mcorp.castinmotion", {
                url: url || options.castURL,
                session: session
            }, function (res) {
                isBusy = true;
                _do_callbacks("castbusy", true);
                if (onSuccess) onSuccess(url || options.castURL)
            }, function (err) {
                console.log(err);
                if (onError) onError(err)
            })
        };
        var initializeCastApi = function (url, onSuccess, onError) {
            var sessionRequest = new chrome.cast.SessionRequest(applicationID);
            var apiConfig = new chrome.cast.ApiConfig(sessionRequest, function (s) {
                s.addUpdateListener(function (e) {
                    isBusy = e;
                    _do_callbacks("castbusy", e)
                });
                cast_session = s;
                isBusy = true;
                _do_callbacks("castbusy", true)
            }, function (e) {
                if (e === "available") {
                    _do_callbacks("cancast", true);
                    isBusy = false;
                    canCast = true;
                    _do_callbacks("castbusy", isBusy)
                } else {
                    _do_callbacks("cancast", false)
                }
            }, chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED);
            chrome.cast.initialize(apiConfig, function () {
                chrome.cast.addReceiverActionListener(function (recv, action) {
                    if (action === "cast") {
                        var doCast = function (busy) {
                            if (busy) {
                                off("castbusy", doCast);
                                cast_url()
                            }
                        };
                        on("castbusy", doCast)
                    }
                })
            }, function (err) {
                console.log("ERROR", err);
                if (onError) onError("Initialization error", err)
            })
        };
        self.__defineGetter__("readyState", readystate.get);
        self.__defineGetter__("STATE", function () {
            return STATE
        });
        self.__defineGetter__("appid", function () {
            return appid
        });
        self.__defineGetter__("motions", function () {
            return _msvs
        });
        self.__defineGetter__("logoutUrl", function () {
            return _logout_url
        });
        self.__defineGetter__("token", get_token);
        self.__defineGetter__("ctx", function () {
            return {
                msvs: _msvs
            }
        });
        self.__defineGetter__("msvs", function () {
            return _msvs
        });
        self.__defineGetter__("profile", function () {
            return _profile
        });
        self.on = on;
        self.off = off;
        self.init = init;
        self.logout = logout;
        self.get_msv_by_url = get_msv_by_url;
        self.getAssociation = get_association;
        self.setAssociation = set_association;
        self.ready = new Promise(function (resolve, reject) {
            self.run = function () {
                if (self.readyState !== self.STATE["OPEN"]) reject();
                else resolve()
            };
            self.init()
        });
        self.get_motions = function (msvlist) {
            return new Promise(function (resolve, reject) {
                request_context(msvlist, resolve)
            })
        };
        self.canCast = function () {
            return canCast
        };
        self.cast = cast;
        self.stopCast = stop_cast;
        self.get_session = function (s, e) {
            console("WARNING: Deprecated get_session, use getSession");
            get_session(s, e)
        };
        self.getSession = get_session;
        return self
    };
    var request_user_info = function (onSuccess, onError) {
        var url = app_server + "/magic.py/get_user_info";
        var onResult = function (result) {
            if (result.error === "signin") {
                window.location = result.url;
                return
            }
            if (result.error === "error") {
                onError("Bad user - something internal")
            } else {
                onSuccess(result)
            }
        };
        JSONP.get(url, {
            referrer: window.location.href
        }, onResult, onError)
    };
    var attribution = function (target, animate, nosync) {
        if (target === undefined) {
            throw new Error("No target for logo")
        }
        if (animate) {
            var logo_app = MCorp.app("5500231976530892295", {
                anon: true
            });
            logo_app.run = function () {
                var e = document.createElement("div");
                e.innerHTML += "<div class='stripe_container' id='m_cont' style='width:252px;height:1px;overflow:hidden;position:relative'><div class='stripe' id='m_stripe' style='height:1px;width:400px;background:orange;position:absolute;left:-400px'></div></div>";
                target.appendChild(e);
                var stripe = target.querySelector("#m_stripe");
                var stripe_container = target.querySelector("#m_cont");
                var _animate = function () {
                    var width = target.offsetWidth - 8;
                    stripe_container.style.width = width + "px";
                    stripe.style.width = width + "px";
                    var left = logo_app.motions.shared.pos % 5 * width * 1.4 - width;
                    stripe.style.left = left + "px";
                    window.requestAnimationFrame(_animate)
                };
                window.requestAnimationFrame(_animate)
            };
            logo_app.init()
        }
        var style = "padding:2px;color:orange;background:black;font-variant:small-caps;font-size:14px;letter-spacing:6px;text-align:center;font-family:sans-serif";
        var style2 = "padding-top:4px;color:orange;background:black;font-variant:small-caps;font-size:10px;letter-spacing:16px;text-align:center;font-family:sans-serif";
        var e = document.createElement("div");
        var t = "";
        if (nosync !== true) {
            t = "<div style='" + style2 + "'>Sync by</div>"
        }
        e.innerHTML = t + "<div id='text' style='" + style + "'>Motion Corporation</div><div class='stripe_container' id='m_cont' style='width:252px;height:1px;overflow:hidden;position:relative'><div class='stripe' id='m_stripe' style='height:1px;width:400px;background:orange;position:absolute;left:-400px'></div></div>";
        target.appendChild(e)
    };
    _mcorp_.app = app;
    _mcorp_.user = request_user_info;
    _mcorp_.attribution = attribution;
    return _mcorp_
}(MCorp || {});