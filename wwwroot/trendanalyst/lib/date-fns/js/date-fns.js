/**
 * Bundled by jsDelivr using Rollup v2.79.1 and Terser v5.19.2.
 * Original file: /npm/date-fns@2.30.0/esm/index.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
import t from "./helpers/esm/typeof.js";
import e from "./helpers/esm/createForOfIteratorHelper.js";
import n from "./helpers/esm/assertThisInitialized.js";
import r from "./helpers/esm/inherits.js";
import a from "./helpers/esm/createSuper.js";
import o from "./helpers/esm/classCallCheck.js";
import i from "./helpers/esm/createClass.js";
import u from "./helpers/esm/defineProperty.js";
function l(t) {
  if (null === t || !0 === t || !1 === t) return NaN;
  var e = Number(t);
  return isNaN(e) ? e : e < 0 ? Math.ceil(e) : Math.floor(e);
}
function s(t, e) {
  if (e.length < t)
    throw new TypeError(
      t +
        " argument" +
        (t > 1 ? "s" : "") +
        " required, but only " +
        e.length +
        " present"
    );
}
function c(e) {
  s(1, arguments);
  var n = Object.prototype.toString.call(e);
  return e instanceof Date || ("object" === t(e) && "[object Date]" === n)
    ? new Date(e.getTime())
    : "number" == typeof e || "[object Number]" === n
    ? new Date(e)
    : (("string" != typeof e && "[object String]" !== n) ||
        "undefined" == typeof console ||
        (console.warn(
          "Starting with v2.0.0-beta.1 date-fns doesn't accept strings as date arguments. Please use `parseISO` to parse strings. See: https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#string-arguments"
        ),
        console.warn(new Error().stack)),
      new Date(NaN));
}
function d(t, e) {
  s(2, arguments);
  var n = c(t),
    r = l(e);
  return isNaN(r) ? new Date(NaN) : r ? (n.setDate(n.getDate() + r), n) : n;
}
function f(t, e) {
  s(2, arguments);
  var n = c(t),
    r = l(e);
  if (isNaN(r)) return new Date(NaN);
  if (!r) return n;
  var a = n.getDate(),
    o = new Date(n.getTime());
  return (
    o.setMonth(n.getMonth() + r + 1, 0),
    a >= o.getDate() ? o : (n.setFullYear(o.getFullYear(), o.getMonth(), a), n)
  );
}
function v(e, n) {
  if ((s(2, arguments), !n || "object" !== t(n))) return new Date(NaN);
  var r = n.years ? l(n.years) : 0,
    a = n.months ? l(n.months) : 0,
    o = n.weeks ? l(n.weeks) : 0,
    i = n.days ? l(n.days) : 0,
    u = n.hours ? l(n.hours) : 0,
    v = n.minutes ? l(n.minutes) : 0,
    h = n.seconds ? l(n.seconds) : 0,
    m = c(e),
    g = a || r ? f(m, a + 12 * r) : m,
    w = i || o ? d(g, i + 7 * o) : g,
    y = 1e3 * (h + 60 * (v + 60 * u));
  return new Date(w.getTime() + y);
}
function h(t) {
  s(1, arguments);
  var e = c(t).getDay();
  return 0 === e || 6 === e;
}
function m(t) {
  return s(1, arguments), 0 === c(t).getDay();
}
function g(t) {
  return s(1, arguments), 6 === c(t).getDay();
}
function w(t, e) {
  s(2, arguments);
  var n = c(t),
    r = h(n),
    a = l(e);
  if (isNaN(a)) return new Date(NaN);
  var o = n.getHours(),
    i = a < 0 ? -1 : 1,
    u = l(a / 5);
  n.setDate(n.getDate() + 7 * u);
  for (var d = Math.abs(a % 5); d > 0; )
    n.setDate(n.getDate() + i), h(n) || (d -= 1);
  return (
    r &&
      h(n) &&
      0 !== a &&
      (g(n) && n.setDate(n.getDate() + (i < 0 ? 2 : -1)),
      m(n) && n.setDate(n.getDate() + (i < 0 ? 1 : -2))),
    n.setHours(o),
    n
  );
}
function y(t, e) {
  s(2, arguments);
  var n = c(t).getTime(),
    r = l(e);
  return new Date(n + r);
}
var p = 36e5;
function b(t, e) {
  return s(2, arguments), y(t, l(e) * p);
}
var T = {};
function D() {
  return T;
}
function M(t) {
  T = t;
}
function k(t, e) {
  var n, r, a, o, i, u, d, f;
  s(1, arguments);
  var v = D(),
    h = l(
      null !==
        (n =
          null !==
            (r =
              null !==
                (a =
                  null !== (o = null == e ? void 0 : e.weekStartsOn) &&
                  void 0 !== o
                    ? o
                    : null == e ||
                      null === (i = e.locale) ||
                      void 0 === i ||
                      null === (u = i.options) ||
                      void 0 === u
                    ? void 0
                    : u.weekStartsOn) && void 0 !== a
                ? a
                : v.weekStartsOn) && void 0 !== r
            ? r
            : null === (d = v.locale) ||
              void 0 === d ||
              null === (f = d.options) ||
              void 0 === f
            ? void 0
            : f.weekStartsOn) && void 0 !== n
        ? n
        : 0
    );
  if (!(h >= 0 && h <= 6))
    throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
  var m = c(t),
    g = m.getDay(),
    w = (g < h ? 7 : 0) + g - h;
  return m.setDate(m.getDate() - w), m.setHours(0, 0, 0, 0), m;
}
function C(t) {
  return s(1, arguments), k(t, { weekStartsOn: 1 });
}
function N(t) {
  s(1, arguments);
  var e = c(t),
    n = e.getFullYear(),
    r = new Date(0);
  r.setFullYear(n + 1, 0, 4), r.setHours(0, 0, 0, 0);
  var a = C(r),
    o = new Date(0);
  o.setFullYear(n, 0, 4), o.setHours(0, 0, 0, 0);
  var i = C(o);
  return e.getTime() >= a.getTime()
    ? n + 1
    : e.getTime() >= i.getTime()
    ? n
    : n - 1;
}
function x(t) {
  s(1, arguments);
  var e = N(t),
    n = new Date(0);
  return n.setFullYear(e, 0, 4), n.setHours(0, 0, 0, 0), C(n);
}
function Y(t) {
  var e = new Date(
    Date.UTC(
      t.getFullYear(),
      t.getMonth(),
      t.getDate(),
      t.getHours(),
      t.getMinutes(),
      t.getSeconds(),
      t.getMilliseconds()
    )
  );
  return e.setUTCFullYear(t.getFullYear()), t.getTime() - e.getTime();
}
function S(t) {
  s(1, arguments);
  var e = c(t);
  return e.setHours(0, 0, 0, 0), e;
}
var U = 864e5;
function E(t, e) {
  s(2, arguments);
  var n = S(t),
    r = S(e),
    a = n.getTime() - Y(n),
    o = r.getTime() - Y(r);
  return Math.round((a - o) / U);
}
function H(t, e) {
  s(2, arguments);
  var n = c(t),
    r = l(e),
    a = E(n, x(n)),
    o = new Date(0);
  return (
    o.setFullYear(r, 0, 4),
    o.setHours(0, 0, 0, 0),
    (n = x(o)).setDate(n.getDate() + a),
    n
  );
}
function F(t, e) {
  s(2, arguments);
  var n = l(e);
  return H(t, N(t) + n);
}
var O = 6e4;
function P(t, e) {
  return s(2, arguments), y(t, l(e) * O);
}
function R(t, e) {
  return s(2, arguments), f(t, 3 * l(e));
}
function q(t, e) {
  return s(2, arguments), y(t, 1e3 * l(e));
}
function W(t, e) {
  return s(2, arguments), d(t, 7 * l(e));
}
function A(t, e) {
  return s(2, arguments), f(t, 12 * l(e));
}
function I(t, e, n) {
  s(2, arguments);
  var r = c(null == t ? void 0 : t.start).getTime(),
    a = c(null == t ? void 0 : t.end).getTime(),
    o = c(null == e ? void 0 : e.start).getTime(),
    i = c(null == e ? void 0 : e.end).getTime();
  if (!(r <= a && o <= i)) throw new RangeError("Invalid interval");
  return null != n && n.inclusive ? r <= i && o <= a : r < i && o < a;
}
function L(e) {
  var n, r;
  if ((s(1, arguments), e && "function" == typeof e.forEach)) n = e;
  else {
    if ("object" !== t(e) || null === e) return new Date(NaN);
    n = Array.prototype.slice.call(e);
  }
  return (
    n.forEach(function (t) {
      var e = c(t);
      (void 0 === r || r < e || isNaN(Number(e))) && (r = e);
    }),
    r || new Date(NaN)
  );
}
function Q(e) {
  var n, r;
  if ((s(1, arguments), e && "function" == typeof e.forEach)) n = e;
  else {
    if ("object" !== t(e) || null === e) return new Date(NaN);
    n = Array.prototype.slice.call(e);
  }
  return (
    n.forEach(function (t) {
      var e = c(t);
      (void 0 === r || r > e || isNaN(e.getDate())) && (r = e);
    }),
    r || new Date(NaN)
  );
}
function j(t, e) {
  var n = e.start,
    r = e.end;
  return s(2, arguments), Q([L([t, n]), r]);
}
function X(t, e) {
  s(2, arguments);
  var n = c(t);
  if (isNaN(Number(n))) return NaN;
  var r,
    a,
    o = n.getTime();
  return (
    (null == e
      ? []
      : "function" == typeof e.forEach
      ? e
      : Array.prototype.slice.call(e)
    ).forEach(function (t, e) {
      var n = c(t);
      if (isNaN(Number(n))) return (r = NaN), void (a = NaN);
      var i = Math.abs(o - n.getTime());
      (null == r || i < Number(a)) && ((r = e), (a = i));
    }),
    r
  );
}
function z(t, e) {
  s(2, arguments);
  var n = c(t);
  if (isNaN(Number(n))) return new Date(NaN);
  var r,
    a,
    o = n.getTime();
  return (
    (null == e
      ? []
      : "function" == typeof e.forEach
      ? e
      : Array.prototype.slice.call(e)
    ).forEach(function (t) {
      var e = c(t);
      if (isNaN(Number(e))) return (r = new Date(NaN)), void (a = NaN);
      var n = Math.abs(o - e.getTime());
      (null == r || n < Number(a)) && ((r = e), (a = n));
    }),
    r
  );
}
function G(t, e) {
  s(2, arguments);
  var n = c(t),
    r = c(e),
    a = n.getTime() - r.getTime();
  return a < 0 ? -1 : a > 0 ? 1 : a;
}
function B(t, e) {
  s(2, arguments);
  var n = c(t),
    r = c(e),
    a = n.getTime() - r.getTime();
  return a > 0 ? -1 : a < 0 ? 1 : a;
}
var Z = 7,
  $ = 365.2425,
  J = 24 * Math.pow(10, 8) * 60 * 60 * 1e3,
  K = 6e4,
  V = 36e5,
  _ = 1e3,
  tt = -J,
  et = 60,
  nt = 3,
  rt = 12,
  at = 4,
  ot = 3600,
  it = 60,
  ut = 86400,
  lt = 604800,
  st = 31556952,
  ct = 2629746,
  dt = 7889238;
function ft(t) {
  s(1, arguments);
  var e = t / 7;
  return Math.floor(e);
}
function vt(t, e) {
  s(2, arguments);
  var n = S(t),
    r = S(e);
  return n.getTime() === r.getTime();
}
function ht(e) {
  return (
    s(1, arguments),
    e instanceof Date ||
      ("object" === t(e) &&
        "[object Date]" === Object.prototype.toString.call(e))
  );
}
function mt(t) {
  if ((s(1, arguments), !ht(t) && "number" != typeof t)) return !1;
  var e = c(t);
  return !isNaN(Number(e));
}
function gt(t, e) {
  s(2, arguments);
  var n = c(t),
    r = c(e);
  if (!mt(n) || !mt(r)) return NaN;
  var a = E(n, r),
    o = a < 0 ? -1 : 1,
    i = l(a / 7),
    u = 5 * i;
  for (r = d(r, 7 * i); !vt(n, r); ) (u += h(r) ? 0 : o), (r = d(r, o));
  return 0 === u ? 0 : u;
}
function wt(t, e) {
  return s(2, arguments), N(t) - N(e);
}
function yt(t, e) {
  s(2, arguments);
  var n = C(t),
    r = C(e),
    a = n.getTime() - Y(n),
    o = r.getTime() - Y(r);
  return Math.round((a - o) / 6048e5);
}
function pt(t, e) {
  s(2, arguments);
  var n = c(t),
    r = c(e);
  return (
    12 * (n.getFullYear() - r.getFullYear()) + (n.getMonth() - r.getMonth())
  );
}
function bt(t) {
  s(1, arguments);
  var e = c(t);
  return Math.floor(e.getMonth() / 3) + 1;
}
function Tt(t, e) {
  s(2, arguments);
  var n = c(t),
    r = c(e);
  return 4 * (n.getFullYear() - r.getFullYear()) + (bt(n) - bt(r));
}
var Dt = 6048e5;
function Mt(t, e, n) {
  s(2, arguments);
  var r = k(t, n),
    a = k(e, n),
    o = r.getTime() - Y(r),
    i = a.getTime() - Y(a);
  return Math.round((o - i) / Dt);
}
function kt(t, e) {
  s(2, arguments);
  var n = c(t),
    r = c(e);
  return n.getFullYear() - r.getFullYear();
}
function Ct(t, e) {
  var n =
    t.getFullYear() - e.getFullYear() ||
    t.getMonth() - e.getMonth() ||
    t.getDate() - e.getDate() ||
    t.getHours() - e.getHours() ||
    t.getMinutes() - e.getMinutes() ||
    t.getSeconds() - e.getSeconds() ||
    t.getMilliseconds() - e.getMilliseconds();
  return n < 0 ? -1 : n > 0 ? 1 : n;
}
function Nt(t, e) {
  s(2, arguments);
  var n = c(t),
    r = c(e),
    a = Ct(n, r),
    o = Math.abs(E(n, r));
  n.setDate(n.getDate() - a * o);
  var i = a * (o - Number(Ct(n, r) === -a));
  return 0 === i ? 0 : i;
}
function xt(t, e) {
  return s(2, arguments), c(t).getTime() - c(e).getTime();
}
var Yt = {
    ceil: Math.ceil,
    round: Math.round,
    floor: Math.floor,
    trunc: function (t) {
      return t < 0 ? Math.ceil(t) : Math.floor(t);
    },
  },
  St = "trunc";
function Ut(t) {
  return t ? Yt[t] : Yt[St];
}
function Et(t, e, n) {
  s(2, arguments);
  var r = xt(t, e) / V;
  return Ut(null == n ? void 0 : n.roundingMethod)(r);
}
function Ht(t, e) {
  return s(2, arguments), F(t, -l(e));
}
function Ft(t, e) {
  s(2, arguments);
  var n = c(t),
    r = c(e),
    a = G(n, r),
    o = Math.abs(wt(n, r));
  n = Ht(n, a * o);
  var i = a * (o - Number(G(n, r) === -a));
  return 0 === i ? 0 : i;
}
function Ot(t, e, n) {
  s(2, arguments);
  var r = xt(t, e) / K;
  return Ut(null == n ? void 0 : n.roundingMethod)(r);
}
function Pt(t) {
  s(1, arguments);
  var e = c(t);
  return e.setHours(23, 59, 59, 999), e;
}
function Rt(t) {
  s(1, arguments);
  var e = c(t),
    n = e.getMonth();
  return (
    e.setFullYear(e.getFullYear(), n + 1, 0), e.setHours(23, 59, 59, 999), e
  );
}
function qt(t) {
  s(1, arguments);
  var e = c(t);
  return Pt(e).getTime() === Rt(e).getTime();
}
function Wt(t, e) {
  s(2, arguments);
  var n,
    r = c(t),
    a = c(e),
    o = G(r, a),
    i = Math.abs(pt(r, a));
  if (i < 1) n = 0;
  else {
    1 === r.getMonth() && r.getDate() > 27 && r.setDate(30),
      r.setMonth(r.getMonth() - o * i);
    var u = G(r, a) === -o;
    qt(c(t)) && 1 === i && 1 === G(t, a) && (u = !1), (n = o * (i - Number(u)));
  }
  return 0 === n ? 0 : n;
}
function At(t, e, n) {
  s(2, arguments);
  var r = Wt(t, e) / 3;
  return Ut(null == n ? void 0 : n.roundingMethod)(r);
}
function It(t, e, n) {
  s(2, arguments);
  var r = xt(t, e) / 1e3;
  return Ut(null == n ? void 0 : n.roundingMethod)(r);
}
function Lt(t, e, n) {
  s(2, arguments);
  var r = Nt(t, e) / 7;
  return Ut(null == n ? void 0 : n.roundingMethod)(r);
}
function Qt(t, e) {
  s(2, arguments);
  var n = c(t),
    r = c(e),
    a = G(n, r),
    o = Math.abs(kt(n, r));
  n.setFullYear(1584), r.setFullYear(1584);
  var i = G(n, r) === -a,
    u = a * (o - Number(i));
  return 0 === u ? 0 : u;
}
function jt(t, e) {
  var n;
  s(1, arguments);
  var r = t || {},
    a = c(r.start),
    o = c(r.end).getTime();
  if (!(a.getTime() <= o)) throw new RangeError("Invalid interval");
  var i = [],
    u = a;
  u.setHours(0, 0, 0, 0);
  var l = Number(
    null !== (n = null == e ? void 0 : e.step) && void 0 !== n ? n : 1
  );
  if (l < 1 || isNaN(l))
    throw new RangeError("`options.step` must be a number greater than 1");
  for (; u.getTime() <= o; )
    i.push(c(u)), u.setDate(u.getDate() + l), u.setHours(0, 0, 0, 0);
  return i;
}
function Xt(t, e) {
  var n;
  s(1, arguments);
  var r = t || {},
    a = c(r.start),
    o = c(r.end),
    i = a.getTime(),
    u = o.getTime();
  if (!(i <= u)) throw new RangeError("Invalid interval");
  var l = [],
    d = a;
  d.setMinutes(0, 0, 0);
  var f = Number(
    null !== (n = null == e ? void 0 : e.step) && void 0 !== n ? n : 1
  );
  if (f < 1 || isNaN(f))
    throw new RangeError("`options.step` must be a number greater than 1");
  for (; d.getTime() <= u; ) l.push(c(d)), (d = b(d, f));
  return l;
}
function zt(t) {
  s(1, arguments);
  var e = c(t);
  return e.setSeconds(0, 0), e;
}
function Gt(t, e) {
  var n;
  s(1, arguments);
  var r = zt(c(t.start)),
    a = c(t.end),
    o = r.getTime(),
    i = a.getTime();
  if (o >= i) throw new RangeError("Invalid interval");
  var u = [],
    l = r,
    d = Number(
      null !== (n = null == e ? void 0 : e.step) && void 0 !== n ? n : 1
    );
  if (d < 1 || isNaN(d))
    throw new RangeError(
      "`options.step` must be a number equal to or greater than 1"
    );
  for (; l.getTime() <= i; ) u.push(c(l)), (l = P(l, d));
  return u;
}
function Bt(t) {
  s(1, arguments);
  var e = t || {},
    n = c(e.start),
    r = c(e.end).getTime(),
    a = [];
  if (!(n.getTime() <= r)) throw new RangeError("Invalid interval");
  var o = n;
  for (o.setHours(0, 0, 0, 0), o.setDate(1); o.getTime() <= r; )
    a.push(c(o)), o.setMonth(o.getMonth() + 1);
  return a;
}
function Zt(t) {
  s(1, arguments);
  var e = c(t),
    n = e.getMonth(),
    r = n - (n % 3);
  return e.setMonth(r, 1), e.setHours(0, 0, 0, 0), e;
}
function $t(t) {
  s(1, arguments);
  var e = t || {},
    n = c(e.start),
    r = c(e.end),
    a = r.getTime();
  if (!(n.getTime() <= a)) throw new RangeError("Invalid interval");
  var o = Zt(n);
  a = Zt(r).getTime();
  for (var i = [], u = o; u.getTime() <= a; ) i.push(c(u)), (u = R(u, 1));
  return i;
}
function Jt(t, e) {
  s(1, arguments);
  var n = t || {},
    r = c(n.start),
    a = c(n.end),
    o = a.getTime();
  if (!(r.getTime() <= o)) throw new RangeError("Invalid interval");
  var i = k(r, e),
    u = k(a, e);
  i.setHours(15), u.setHours(15), (o = u.getTime());
  for (var l = [], d = i; d.getTime() <= o; )
    d.setHours(0), l.push(c(d)), (d = W(d, 1)).setHours(15);
  return l;
}
function Kt(t) {
  s(1, arguments);
  for (var e = jt(t), n = [], r = 0; r < e.length; ) {
    var a = e[r++];
    h(a) && (n.push(a), m(a) && (r += 5));
  }
  return n;
}
function Vt(t) {
  s(1, arguments);
  var e = c(t);
  return e.setDate(1), e.setHours(0, 0, 0, 0), e;
}
function _t(t) {
  s(1, arguments);
  var e = Vt(t);
  if (isNaN(e.getTime())) throw new RangeError("The passed date is invalid");
  return Kt({ start: e, end: Rt(t) });
}
function te(t) {
  s(1, arguments);
  var e = c(t),
    n = e.getFullYear();
  return e.setFullYear(n + 1, 0, 0), e.setHours(23, 59, 59, 999), e;
}
function ee(t) {
  s(1, arguments);
  var e = c(t),
    n = new Date(0);
  return n.setFullYear(e.getFullYear(), 0, 1), n.setHours(0, 0, 0, 0), n;
}
function ne(t) {
  return s(1, arguments), Kt({ start: ee(t), end: te(t) });
}
function re(t) {
  s(1, arguments);
  var e = t || {},
    n = c(e.start),
    r = c(e.end).getTime();
  if (!(n.getTime() <= r)) throw new RangeError("Invalid interval");
  var a = [],
    o = n;
  for (o.setHours(0, 0, 0, 0), o.setMonth(0, 1); o.getTime() <= r; )
    a.push(c(o)), o.setFullYear(o.getFullYear() + 1);
  return a;
}
function ae(t) {
  s(1, arguments);
  var e = c(t),
    n = e.getFullYear(),
    r = 9 + 10 * Math.floor(n / 10);
  return e.setFullYear(r, 11, 31), e.setHours(23, 59, 59, 999), e;
}
function oe(t) {
  s(1, arguments);
  var e = c(t);
  return e.setMinutes(59, 59, 999), e;
}
function ie(t, e) {
  var n, r, a, o, i, u, d, f;
  s(1, arguments);
  var v = D(),
    h = l(
      null !==
        (n =
          null !==
            (r =
              null !==
                (a =
                  null !== (o = null == e ? void 0 : e.weekStartsOn) &&
                  void 0 !== o
                    ? o
                    : null == e ||
                      null === (i = e.locale) ||
                      void 0 === i ||
                      null === (u = i.options) ||
                      void 0 === u
                    ? void 0
                    : u.weekStartsOn) && void 0 !== a
                ? a
                : v.weekStartsOn) && void 0 !== r
            ? r
            : null === (d = v.locale) ||
              void 0 === d ||
              null === (f = d.options) ||
              void 0 === f
            ? void 0
            : f.weekStartsOn) && void 0 !== n
        ? n
        : 0
    );
  if (!(h >= 0 && h <= 6))
    throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
  var m = c(t),
    g = m.getDay(),
    w = 6 + (g < h ? -7 : 0) - (g - h);
  return m.setDate(m.getDate() + w), m.setHours(23, 59, 59, 999), m;
}
function ue(t) {
  return s(1, arguments), ie(t, { weekStartsOn: 1 });
}
function le(t) {
  s(1, arguments);
  var e = N(t),
    n = new Date(0);
  n.setFullYear(e + 1, 0, 4), n.setHours(0, 0, 0, 0);
  var r = C(n);
  return r.setMilliseconds(r.getMilliseconds() - 1), r;
}
function se(t) {
  s(1, arguments);
  var e = c(t);
  return e.setSeconds(59, 999), e;
}
function ce(t) {
  s(1, arguments);
  var e = c(t),
    n = e.getMonth(),
    r = n - (n % 3) + 3;
  return e.setMonth(r, 0), e.setHours(23, 59, 59, 999), e;
}
function de(t) {
  s(1, arguments);
  var e = c(t);
  return e.setMilliseconds(999), e;
}
function fe() {
  return Pt(Date.now());
}
function ve() {
  var t = new Date(),
    e = t.getFullYear(),
    n = t.getMonth(),
    r = t.getDate(),
    a = new Date(0);
  return a.setFullYear(e, n, r + 1), a.setHours(23, 59, 59, 999), a;
}
function he() {
  var t = new Date(),
    e = t.getFullYear(),
    n = t.getMonth(),
    r = t.getDate(),
    a = new Date(0);
  return a.setFullYear(e, n, r - 1), a.setHours(23, 59, 59, 999), a;
}
function me(t, e) {
  return s(2, arguments), y(t, -l(e));
}
function ge(t) {
  s(1, arguments);
  var e = c(t),
    n = e.getUTCDay(),
    r = (n < 1 ? 7 : 0) + n - 1;
  return e.setUTCDate(e.getUTCDate() - r), e.setUTCHours(0, 0, 0, 0), e;
}
function we(t) {
  s(1, arguments);
  var e = c(t),
    n = e.getUTCFullYear(),
    r = new Date(0);
  r.setUTCFullYear(n + 1, 0, 4), r.setUTCHours(0, 0, 0, 0);
  var a = ge(r),
    o = new Date(0);
  o.setUTCFullYear(n, 0, 4), o.setUTCHours(0, 0, 0, 0);
  var i = ge(o);
  return e.getTime() >= a.getTime()
    ? n + 1
    : e.getTime() >= i.getTime()
    ? n
    : n - 1;
}
var ye = 6048e5;
function pe(t) {
  s(1, arguments);
  var e = c(t),
    n =
      ge(e).getTime() -
      (function (t) {
        s(1, arguments);
        var e = we(t),
          n = new Date(0);
        return n.setUTCFullYear(e, 0, 4), n.setUTCHours(0, 0, 0, 0), ge(n);
      })(e).getTime();
  return Math.round(n / ye) + 1;
}
function be(t, e) {
  var n, r, a, o, i, u, d, f;
  s(1, arguments);
  var v = D(),
    h = l(
      null !==
        (n =
          null !==
            (r =
              null !==
                (a =
                  null !== (o = null == e ? void 0 : e.weekStartsOn) &&
                  void 0 !== o
                    ? o
                    : null == e ||
                      null === (i = e.locale) ||
                      void 0 === i ||
                      null === (u = i.options) ||
                      void 0 === u
                    ? void 0
                    : u.weekStartsOn) && void 0 !== a
                ? a
                : v.weekStartsOn) && void 0 !== r
            ? r
            : null === (d = v.locale) ||
              void 0 === d ||
              null === (f = d.options) ||
              void 0 === f
            ? void 0
            : f.weekStartsOn) && void 0 !== n
        ? n
        : 0
    );
  if (!(h >= 0 && h <= 6))
    throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
  var m = c(t),
    g = m.getUTCDay(),
    w = (g < h ? 7 : 0) + g - h;
  return m.setUTCDate(m.getUTCDate() - w), m.setUTCHours(0, 0, 0, 0), m;
}
function Te(t, e) {
  var n, r, a, o, i, u, d, f;
  s(1, arguments);
  var v = c(t),
    h = v.getUTCFullYear(),
    m = D(),
    g = l(
      null !==
        (n =
          null !==
            (r =
              null !==
                (a =
                  null !== (o = null == e ? void 0 : e.firstWeekContainsDate) &&
                  void 0 !== o
                    ? o
                    : null == e ||
                      null === (i = e.locale) ||
                      void 0 === i ||
                      null === (u = i.options) ||
                      void 0 === u
                    ? void 0
                    : u.firstWeekContainsDate) && void 0 !== a
                ? a
                : m.firstWeekContainsDate) && void 0 !== r
            ? r
            : null === (d = m.locale) ||
              void 0 === d ||
              null === (f = d.options) ||
              void 0 === f
            ? void 0
            : f.firstWeekContainsDate) && void 0 !== n
        ? n
        : 1
    );
  if (!(g >= 1 && g <= 7))
    throw new RangeError(
      "firstWeekContainsDate must be between 1 and 7 inclusively"
    );
  var w = new Date(0);
  w.setUTCFullYear(h + 1, 0, g), w.setUTCHours(0, 0, 0, 0);
  var y = be(w, e),
    p = new Date(0);
  p.setUTCFullYear(h, 0, g), p.setUTCHours(0, 0, 0, 0);
  var b = be(p, e);
  return v.getTime() >= y.getTime()
    ? h + 1
    : v.getTime() >= b.getTime()
    ? h
    : h - 1;
}
var De = 6048e5;
function Me(t, e) {
  s(1, arguments);
  var n = c(t),
    r =
      be(n, e).getTime() -
      (function (t, e) {
        var n, r, a, o, i, u, c, d;
        s(1, arguments);
        var f = D(),
          v = l(
            null !==
              (n =
                null !==
                  (r =
                    null !==
                      (a =
                        null !==
                          (o = null == e ? void 0 : e.firstWeekContainsDate) &&
                        void 0 !== o
                          ? o
                          : null == e ||
                            null === (i = e.locale) ||
                            void 0 === i ||
                            null === (u = i.options) ||
                            void 0 === u
                          ? void 0
                          : u.firstWeekContainsDate) && void 0 !== a
                      ? a
                      : f.firstWeekContainsDate) && void 0 !== r
                  ? r
                  : null === (c = f.locale) ||
                    void 0 === c ||
                    null === (d = c.options) ||
                    void 0 === d
                  ? void 0
                  : d.firstWeekContainsDate) && void 0 !== n
              ? n
              : 1
          ),
          h = Te(t, e),
          m = new Date(0);
        return m.setUTCFullYear(h, 0, v), m.setUTCHours(0, 0, 0, 0), be(m, e);
      })(n, e).getTime();
  return Math.round(r / De) + 1;
}
function ke(t, e) {
  for (var n = t < 0 ? "-" : "", r = Math.abs(t).toString(); r.length < e; )
    r = "0" + r;
  return n + r;
}
var Ce = {
    y: function (t, e) {
      var n = t.getUTCFullYear(),
        r = n > 0 ? n : 1 - n;
      return ke("yy" === e ? r % 100 : r, e.length);
    },
    M: function (t, e) {
      var n = t.getUTCMonth();
      return "M" === e ? String(n + 1) : ke(n + 1, 2);
    },
    d: function (t, e) {
      return ke(t.getUTCDate(), e.length);
    },
    a: function (t, e) {
      var n = t.getUTCHours() / 12 >= 1 ? "pm" : "am";
      switch (e) {
        case "a":
        case "aa":
          return n.toUpperCase();
        case "aaa":
          return n;
        case "aaaaa":
          return n[0];
        default:
          return "am" === n ? "a.m." : "p.m.";
      }
    },
    h: function (t, e) {
      return ke(t.getUTCHours() % 12 || 12, e.length);
    },
    H: function (t, e) {
      return ke(t.getUTCHours(), e.length);
    },
    m: function (t, e) {
      return ke(t.getUTCMinutes(), e.length);
    },
    s: function (t, e) {
      return ke(t.getUTCSeconds(), e.length);
    },
    S: function (t, e) {
      var n = e.length,
        r = t.getUTCMilliseconds();
      return ke(Math.floor(r * Math.pow(10, n - 3)), e.length);
    },
  },
  Ne = "midnight",
  xe = "noon",
  Ye = "morning",
  Se = "afternoon",
  Ue = "evening",
  Ee = "night",
  He = {
    G: function (t, e, n) {
      var r = t.getUTCFullYear() > 0 ? 1 : 0;
      switch (e) {
        case "G":
        case "GG":
        case "GGG":
          return n.era(r, { width: "abbreviated" });
        case "GGGGG":
          return n.era(r, { width: "narrow" });
        default:
          return n.era(r, { width: "wide" });
      }
    },
    y: function (t, e, n) {
      if ("yo" === e) {
        var r = t.getUTCFullYear(),
          a = r > 0 ? r : 1 - r;
        return n.ordinalNumber(a, { unit: "year" });
      }
      return Ce.y(t, e);
    },
    Y: function (t, e, n, r) {
      var a = Te(t, r),
        o = a > 0 ? a : 1 - a;
      return "YY" === e
        ? ke(o % 100, 2)
        : "Yo" === e
        ? n.ordinalNumber(o, { unit: "year" })
        : ke(o, e.length);
    },
    R: function (t, e) {
      return ke(we(t), e.length);
    },
    u: function (t, e) {
      return ke(t.getUTCFullYear(), e.length);
    },
    Q: function (t, e, n) {
      var r = Math.ceil((t.getUTCMonth() + 1) / 3);
      switch (e) {
        case "Q":
          return String(r);
        case "QQ":
          return ke(r, 2);
        case "Qo":
          return n.ordinalNumber(r, { unit: "quarter" });
        case "QQQ":
          return n.quarter(r, { width: "abbreviated", context: "formatting" });
        case "QQQQQ":
          return n.quarter(r, { width: "narrow", context: "formatting" });
        default:
          return n.quarter(r, { width: "wide", context: "formatting" });
      }
    },
    q: function (t, e, n) {
      var r = Math.ceil((t.getUTCMonth() + 1) / 3);
      switch (e) {
        case "q":
          return String(r);
        case "qq":
          return ke(r, 2);
        case "qo":
          return n.ordinalNumber(r, { unit: "quarter" });
        case "qqq":
          return n.quarter(r, { width: "abbreviated", context: "standalone" });
        case "qqqqq":
          return n.quarter(r, { width: "narrow", context: "standalone" });
        default:
          return n.quarter(r, { width: "wide", context: "standalone" });
      }
    },
    M: function (t, e, n) {
      var r = t.getUTCMonth();
      switch (e) {
        case "M":
        case "MM":
          return Ce.M(t, e);
        case "Mo":
          return n.ordinalNumber(r + 1, { unit: "month" });
        case "MMM":
          return n.month(r, { width: "abbreviated", context: "formatting" });
        case "MMMMM":
          return n.month(r, { width: "narrow", context: "formatting" });
        default:
          return n.month(r, { width: "wide", context: "formatting" });
      }
    },
    L: function (t, e, n) {
      var r = t.getUTCMonth();
      switch (e) {
        case "L":
          return String(r + 1);
        case "LL":
          return ke(r + 1, 2);
        case "Lo":
          return n.ordinalNumber(r + 1, { unit: "month" });
        case "LLL":
          return n.month(r, { width: "abbreviated", context: "standalone" });
        case "LLLLL":
          return n.month(r, { width: "narrow", context: "standalone" });
        default:
          return n.month(r, { width: "wide", context: "standalone" });
      }
    },
    w: function (t, e, n, r) {
      var a = Me(t, r);
      return "wo" === e
        ? n.ordinalNumber(a, { unit: "week" })
        : ke(a, e.length);
    },
    I: function (t, e, n) {
      var r = pe(t);
      return "Io" === e
        ? n.ordinalNumber(r, { unit: "week" })
        : ke(r, e.length);
    },
    d: function (t, e, n) {
      return "do" === e
        ? n.ordinalNumber(t.getUTCDate(), { unit: "date" })
        : Ce.d(t, e);
    },
    D: function (t, e, n) {
      var r = (function (t) {
        s(1, arguments);
        var e = c(t),
          n = e.getTime();
        e.setUTCMonth(0, 1), e.setUTCHours(0, 0, 0, 0);
        var r = n - e.getTime();
        return Math.floor(r / 864e5) + 1;
      })(t);
      return "Do" === e
        ? n.ordinalNumber(r, { unit: "dayOfYear" })
        : ke(r, e.length);
    },
    E: function (t, e, n) {
      var r = t.getUTCDay();
      switch (e) {
        case "E":
        case "EE":
        case "EEE":
          return n.day(r, { width: "abbreviated", context: "formatting" });
        case "EEEEE":
          return n.day(r, { width: "narrow", context: "formatting" });
        case "EEEEEE":
          return n.day(r, { width: "short", context: "formatting" });
        default:
          return n.day(r, { width: "wide", context: "formatting" });
      }
    },
    e: function (t, e, n, r) {
      var a = t.getUTCDay(),
        o = (a - r.weekStartsOn + 8) % 7 || 7;
      switch (e) {
        case "e":
          return String(o);
        case "ee":
          return ke(o, 2);
        case "eo":
          return n.ordinalNumber(o, { unit: "day" });
        case "eee":
          return n.day(a, { width: "abbreviated", context: "formatting" });
        case "eeeee":
          return n.day(a, { width: "narrow", context: "formatting" });
        case "eeeeee":
          return n.day(a, { width: "short", context: "formatting" });
        default:
          return n.day(a, { width: "wide", context: "formatting" });
      }
    },
    c: function (t, e, n, r) {
      var a = t.getUTCDay(),
        o = (a - r.weekStartsOn + 8) % 7 || 7;
      switch (e) {
        case "c":
          return String(o);
        case "cc":
          return ke(o, e.length);
        case "co":
          return n.ordinalNumber(o, { unit: "day" });
        case "ccc":
          return n.day(a, { width: "abbreviated", context: "standalone" });
        case "ccccc":
          return n.day(a, { width: "narrow", context: "standalone" });
        case "cccccc":
          return n.day(a, { width: "short", context: "standalone" });
        default:
          return n.day(a, { width: "wide", context: "standalone" });
      }
    },
    i: function (t, e, n) {
      var r = t.getUTCDay(),
        a = 0 === r ? 7 : r;
      switch (e) {
        case "i":
          return String(a);
        case "ii":
          return ke(a, e.length);
        case "io":
          return n.ordinalNumber(a, { unit: "day" });
        case "iii":
          return n.day(r, { width: "abbreviated", context: "formatting" });
        case "iiiii":
          return n.day(r, { width: "narrow", context: "formatting" });
        case "iiiiii":
          return n.day(r, { width: "short", context: "formatting" });
        default:
          return n.day(r, { width: "wide", context: "formatting" });
      }
    },
    a: function (t, e, n) {
      var r = t.getUTCHours() / 12 >= 1 ? "pm" : "am";
      switch (e) {
        case "a":
        case "aa":
          return n.dayPeriod(r, {
            width: "abbreviated",
            context: "formatting",
          });
        case "aaa":
          return n
            .dayPeriod(r, { width: "abbreviated", context: "formatting" })
            .toLowerCase();
        case "aaaaa":
          return n.dayPeriod(r, { width: "narrow", context: "formatting" });
        default:
          return n.dayPeriod(r, { width: "wide", context: "formatting" });
      }
    },
    b: function (t, e, n) {
      var r,
        a = t.getUTCHours();
      switch (
        ((r = 12 === a ? xe : 0 === a ? Ne : a / 12 >= 1 ? "pm" : "am"), e)
      ) {
        case "b":
        case "bb":
          return n.dayPeriod(r, {
            width: "abbreviated",
            context: "formatting",
          });
        case "bbb":
          return n
            .dayPeriod(r, { width: "abbreviated", context: "formatting" })
            .toLowerCase();
        case "bbbbb":
          return n.dayPeriod(r, { width: "narrow", context: "formatting" });
        default:
          return n.dayPeriod(r, { width: "wide", context: "formatting" });
      }
    },
    B: function (t, e, n) {
      var r,
        a = t.getUTCHours();
      switch (((r = a >= 17 ? Ue : a >= 12 ? Se : a >= 4 ? Ye : Ee), e)) {
        case "B":
        case "BB":
        case "BBB":
          return n.dayPeriod(r, {
            width: "abbreviated",
            context: "formatting",
          });
        case "BBBBB":
          return n.dayPeriod(r, { width: "narrow", context: "formatting" });
        default:
          return n.dayPeriod(r, { width: "wide", context: "formatting" });
      }
    },
    h: function (t, e, n) {
      if ("ho" === e) {
        var r = t.getUTCHours() % 12;
        return 0 === r && (r = 12), n.ordinalNumber(r, { unit: "hour" });
      }
      return Ce.h(t, e);
    },
    H: function (t, e, n) {
      return "Ho" === e
        ? n.ordinalNumber(t.getUTCHours(), { unit: "hour" })
        : Ce.H(t, e);
    },
    K: function (t, e, n) {
      var r = t.getUTCHours() % 12;
      return "Ko" === e
        ? n.ordinalNumber(r, { unit: "hour" })
        : ke(r, e.length);
    },
    k: function (t, e, n) {
      var r = t.getUTCHours();
      return (
        0 === r && (r = 24),
        "ko" === e ? n.ordinalNumber(r, { unit: "hour" }) : ke(r, e.length)
      );
    },
    m: function (t, e, n) {
      return "mo" === e
        ? n.ordinalNumber(t.getUTCMinutes(), { unit: "minute" })
        : Ce.m(t, e);
    },
    s: function (t, e, n) {
      return "so" === e
        ? n.ordinalNumber(t.getUTCSeconds(), { unit: "second" })
        : Ce.s(t, e);
    },
    S: function (t, e) {
      return Ce.S(t, e);
    },
    X: function (t, e, n, r) {
      var a = (r._originalDate || t).getTimezoneOffset();
      if (0 === a) return "Z";
      switch (e) {
        case "X":
          return Oe(a);
        case "XXXX":
        case "XX":
          return Pe(a);
        default:
          return Pe(a, ":");
      }
    },
    x: function (t, e, n, r) {
      var a = (r._originalDate || t).getTimezoneOffset();
      switch (e) {
        case "x":
          return Oe(a);
        case "xxxx":
        case "xx":
          return Pe(a);
        default:
          return Pe(a, ":");
      }
    },
    O: function (t, e, n, r) {
      var a = (r._originalDate || t).getTimezoneOffset();
      switch (e) {
        case "O":
        case "OO":
        case "OOO":
          return "GMT" + Fe(a, ":");
        default:
          return "GMT" + Pe(a, ":");
      }
    },
    z: function (t, e, n, r) {
      var a = (r._originalDate || t).getTimezoneOffset();
      switch (e) {
        case "z":
        case "zz":
        case "zzz":
          return "GMT" + Fe(a, ":");
        default:
          return "GMT" + Pe(a, ":");
      }
    },
    t: function (t, e, n, r) {
      var a = r._originalDate || t;
      return ke(Math.floor(a.getTime() / 1e3), e.length);
    },
    T: function (t, e, n, r) {
      return ke((r._originalDate || t).getTime(), e.length);
    },
  };
function Fe(t, e) {
  var n = t > 0 ? "-" : "+",
    r = Math.abs(t),
    a = Math.floor(r / 60),
    o = r % 60;
  if (0 === o) return n + String(a);
  var i = e || "";
  return n + String(a) + i + ke(o, 2);
}
function Oe(t, e) {
  return t % 60 == 0 ? (t > 0 ? "-" : "+") + ke(Math.abs(t) / 60, 2) : Pe(t, e);
}
function Pe(t, e) {
  var n = e || "",
    r = t > 0 ? "-" : "+",
    a = Math.abs(t);
  return r + ke(Math.floor(a / 60), 2) + n + ke(a % 60, 2);
}
var Re = function (t, e) {
    switch (t) {
      case "P":
        return e.date({ width: "short" });
      case "PP":
        return e.date({ width: "medium" });
      case "PPP":
        return e.date({ width: "long" });
      default:
        return e.date({ width: "full" });
    }
  },
  qe = function (t, e) {
    switch (t) {
      case "p":
        return e.time({ width: "short" });
      case "pp":
        return e.time({ width: "medium" });
      case "ppp":
        return e.time({ width: "long" });
      default:
        return e.time({ width: "full" });
    }
  },
  We = {
    p: qe,
    P: function (t, e) {
      var n,
        r = t.match(/(P+)(p+)?/) || [],
        a = r[1],
        o = r[2];
      if (!o) return Re(t, e);
      switch (a) {
        case "P":
          n = e.dateTime({ width: "short" });
          break;
        case "PP":
          n = e.dateTime({ width: "medium" });
          break;
        case "PPP":
          n = e.dateTime({ width: "long" });
          break;
        default:
          n = e.dateTime({ width: "full" });
      }
      return n.replace("{{date}}", Re(a, e)).replace("{{time}}", qe(o, e));
    },
  },
  Ae = ["D", "DD"],
  Ie = ["YY", "YYYY"];
function Le(t) {
  return -1 !== Ae.indexOf(t);
}
function Qe(t) {
  return -1 !== Ie.indexOf(t);
}
function je(t, e, n) {
  if ("YYYY" === t)
    throw new RangeError(
      "Use `yyyy` instead of `YYYY` (in `"
        .concat(e, "`) for formatting years to the input `")
        .concat(
          n,
          "`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md"
        )
    );
  if ("YY" === t)
    throw new RangeError(
      "Use `yy` instead of `YY` (in `"
        .concat(e, "`) for formatting years to the input `")
        .concat(
          n,
          "`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md"
        )
    );
  if ("D" === t)
    throw new RangeError(
      "Use `d` instead of `D` (in `"
        .concat(e, "`) for formatting days of the month to the input `")
        .concat(
          n,
          "`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md"
        )
    );
  if ("DD" === t)
    throw new RangeError(
      "Use `dd` instead of `DD` (in `"
        .concat(e, "`) for formatting days of the month to the input `")
        .concat(
          n,
          "`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md"
        )
    );
}
var Xe = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds",
  },
  xSeconds: { one: "1 second", other: "{{count}} seconds" },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes",
  },
  xMinutes: { one: "1 minute", other: "{{count}} minutes" },
  aboutXHours: { one: "about 1 hour", other: "about {{count}} hours" },
  xHours: { one: "1 hour", other: "{{count}} hours" },
  xDays: { one: "1 day", other: "{{count}} days" },
  aboutXWeeks: { one: "about 1 week", other: "about {{count}} weeks" },
  xWeeks: { one: "1 week", other: "{{count}} weeks" },
  aboutXMonths: { one: "about 1 month", other: "about {{count}} months" },
  xMonths: { one: "1 month", other: "{{count}} months" },
  aboutXYears: { one: "about 1 year", other: "about {{count}} years" },
  xYears: { one: "1 year", other: "{{count}} years" },
  overXYears: { one: "over 1 year", other: "over {{count}} years" },
  almostXYears: { one: "almost 1 year", other: "almost {{count}} years" },
};
function ze(t) {
  return function () {
    var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
      n = e.width ? String(e.width) : t.defaultWidth;
    return t.formats[n] || t.formats[t.defaultWidth];
  };
}
var Ge = {
    date: ze({
      formats: {
        full: "EEEE, MMMM do, y",
        long: "MMMM do, y",
        medium: "MMM d, y",
        short: "MM/dd/yyyy",
      },
      defaultWidth: "full",
    }),
    time: ze({
      formats: {
        full: "h:mm:ss a zzzz",
        long: "h:mm:ss a z",
        medium: "h:mm:ss a",
        short: "h:mm a",
      },
      defaultWidth: "full",
    }),
    dateTime: ze({
      formats: {
        full: "{{date}} 'at' {{time}}",
        long: "{{date}} 'at' {{time}}",
        medium: "{{date}}, {{time}}",
        short: "{{date}}, {{time}}",
      },
      defaultWidth: "full",
    }),
  },
  Be = {
    lastWeek: "'last' eeee 'at' p",
    yesterday: "'yesterday at' p",
    today: "'today at' p",
    tomorrow: "'tomorrow at' p",
    nextWeek: "eeee 'at' p",
    other: "P",
  };
function Ze(t) {
  return function (e, n) {
    var r;
    if (
      "formatting" ===
        (null != n && n.context ? String(n.context) : "standalone") &&
      t.formattingValues
    ) {
      var a = t.defaultFormattingWidth || t.defaultWidth,
        o = null != n && n.width ? String(n.width) : a;
      r = t.formattingValues[o] || t.formattingValues[a];
    } else {
      var i = t.defaultWidth,
        u = null != n && n.width ? String(n.width) : t.defaultWidth;
      r = t.values[u] || t.values[i];
    }
    return r[t.argumentCallback ? t.argumentCallback(e) : e];
  };
}
function $e(t) {
  return function (e) {
    var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
      r = n.width,
      a = (r && t.matchPatterns[r]) || t.matchPatterns[t.defaultMatchWidth],
      o = e.match(a);
    if (!o) return null;
    var i,
      u = o[0],
      l = (r && t.parsePatterns[r]) || t.parsePatterns[t.defaultParseWidth],
      s = Array.isArray(l)
        ? (function (t, e) {
            for (var n = 0; n < t.length; n++) if (e(t[n])) return n;
            return;
          })(l, function (t) {
            return t.test(u);
          })
        : (function (t, e) {
            for (var n in t) if (t.hasOwnProperty(n) && e(t[n])) return n;
            return;
          })(l, function (t) {
            return t.test(u);
          });
    return (
      (i = t.valueCallback ? t.valueCallback(s) : s),
      {
        value: (i = n.valueCallback ? n.valueCallback(i) : i),
        rest: e.slice(u.length),
      }
    );
  };
}
var Je,
  Ke = {
    code: "en-US",
    formatDistance: function (t, e, n) {
      var r,
        a = Xe[t];
      return (
        (r =
          "string" == typeof a
            ? a
            : 1 === e
            ? a.one
            : a.other.replace("{{count}}", e.toString())),
        null != n && n.addSuffix
          ? n.comparison && n.comparison > 0
            ? "in " + r
            : r + " ago"
          : r
      );
    },
    formatLong: Ge,
    formatRelative: function (t, e, n, r) {
      return Be[t];
    },
    localize: {
      ordinalNumber: function (t, e) {
        var n = Number(t),
          r = n % 100;
        if (r > 20 || r < 10)
          switch (r % 10) {
            case 1:
              return n + "st";
            case 2:
              return n + "nd";
            case 3:
              return n + "rd";
          }
        return n + "th";
      },
      era: Ze({
        values: {
          narrow: ["B", "A"],
          abbreviated: ["BC", "AD"],
          wide: ["Before Christ", "Anno Domini"],
        },
        defaultWidth: "wide",
      }),
      quarter: Ze({
        values: {
          narrow: ["1", "2", "3", "4"],
          abbreviated: ["Q1", "Q2", "Q3", "Q4"],
          wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"],
        },
        defaultWidth: "wide",
        argumentCallback: function (t) {
          return t - 1;
        },
      }),
      month: Ze({
        values: {
          narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
          abbreviated: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ],
          wide: [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ],
        },
        defaultWidth: "wide",
      }),
      day: Ze({
        values: {
          narrow: ["S", "M", "T", "W", "T", "F", "S"],
          short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
          abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          wide: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
        },
        defaultWidth: "wide",
      }),
      dayPeriod: Ze({
        values: {
          narrow: {
            am: "a",
            pm: "p",
            midnight: "mi",
            noon: "n",
            morning: "morning",
            afternoon: "afternoon",
            evening: "evening",
            night: "night",
          },
          abbreviated: {
            am: "AM",
            pm: "PM",
            midnight: "midnight",
            noon: "noon",
            morning: "morning",
            afternoon: "afternoon",
            evening: "evening",
            night: "night",
          },
          wide: {
            am: "a.m.",
            pm: "p.m.",
            midnight: "midnight",
            noon: "noon",
            morning: "morning",
            afternoon: "afternoon",
            evening: "evening",
            night: "night",
          },
        },
        defaultWidth: "wide",
        formattingValues: {
          narrow: {
            am: "a",
            pm: "p",
            midnight: "mi",
            noon: "n",
            morning: "in the morning",
            afternoon: "in the afternoon",
            evening: "in the evening",
            night: "at night",
          },
          abbreviated: {
            am: "AM",
            pm: "PM",
            midnight: "midnight",
            noon: "noon",
            morning: "in the morning",
            afternoon: "in the afternoon",
            evening: "in the evening",
            night: "at night",
          },
          wide: {
            am: "a.m.",
            pm: "p.m.",
            midnight: "midnight",
            noon: "noon",
            morning: "in the morning",
            afternoon: "in the afternoon",
            evening: "in the evening",
            night: "at night",
          },
        },
        defaultFormattingWidth: "wide",
      }),
    },
    match: {
      ordinalNumber:
        ((Je = {
          matchPattern: /^(\d+)(th|st|nd|rd)?/i,
          parsePattern: /\d+/i,
          valueCallback: function (t) {
            return parseInt(t, 10);
          },
        }),
        function (t) {
          var e =
              arguments.length > 1 && void 0 !== arguments[1]
                ? arguments[1]
                : {},
            n = t.match(Je.matchPattern);
          if (!n) return null;
          var r = n[0],
            a = t.match(Je.parsePattern);
          if (!a) return null;
          var o = Je.valueCallback ? Je.valueCallback(a[0]) : a[0];
          return {
            value: (o = e.valueCallback ? e.valueCallback(o) : o),
            rest: t.slice(r.length),
          };
        }),
      era: $e({
        matchPatterns: {
          narrow: /^(b|a)/i,
          abbreviated:
            /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
          wide: /^(before christ|before common era|anno domini|common era)/i,
        },
        defaultMatchWidth: "wide",
        parsePatterns: { any: [/^b/i, /^(a|c)/i] },
        defaultParseWidth: "any",
      }),
      quarter: $e({
        matchPatterns: {
          narrow: /^[1234]/i,
          abbreviated: /^q[1234]/i,
          wide: /^[1234](th|st|nd|rd)? quarter/i,
        },
        defaultMatchWidth: "wide",
        parsePatterns: { any: [/1/i, /2/i, /3/i, /4/i] },
        defaultParseWidth: "any",
        valueCallback: function (t) {
          return t + 1;
        },
      }),
      month: $e({
        matchPatterns: {
          narrow: /^[jfmasond]/i,
          abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
          wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
        },
        defaultMatchWidth: "wide",
        parsePatterns: {
          narrow: [
            /^j/i,
            /^f/i,
            /^m/i,
            /^a/i,
            /^m/i,
            /^j/i,
            /^j/i,
            /^a/i,
            /^s/i,
            /^o/i,
            /^n/i,
            /^d/i,
          ],
          any: [
            /^ja/i,
            /^f/i,
            /^mar/i,
            /^ap/i,
            /^may/i,
            /^jun/i,
            /^jul/i,
            /^au/i,
            /^s/i,
            /^o/i,
            /^n/i,
            /^d/i,
          ],
        },
        defaultParseWidth: "any",
      }),
      day: $e({
        matchPatterns: {
          narrow: /^[smtwf]/i,
          short: /^(su|mo|tu|we|th|fr|sa)/i,
          abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
          wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
        },
        defaultMatchWidth: "wide",
        parsePatterns: {
          narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
          any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
        },
        defaultParseWidth: "any",
      }),
      dayPeriod: $e({
        matchPatterns: {
          narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
          any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i,
        },
        defaultMatchWidth: "any",
        parsePatterns: {
          any: {
            am: /^a/i,
            pm: /^p/i,
            midnight: /^mi/i,
            noon: /^no/i,
            morning: /morning/i,
            afternoon: /afternoon/i,
            evening: /evening/i,
            night: /night/i,
          },
        },
        defaultParseWidth: "any",
      }),
    },
    options: { weekStartsOn: 0, firstWeekContainsDate: 1 },
  },
  Ve = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,
  _e = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,
  tn = /^'([^]*?)'?$/,
  en = /''/g,
  nn = /[a-zA-Z]/;
function rn(t, e, n) {
  var r, a, o, i, u, d, f, v, h, m, g, w, y, p, b, T, M, k;
  s(2, arguments);
  var C = String(e),
    N = D(),
    x =
      null !==
        (r =
          null !== (a = null == n ? void 0 : n.locale) && void 0 !== a
            ? a
            : N.locale) && void 0 !== r
        ? r
        : Ke,
    S = l(
      null !==
        (o =
          null !==
            (i =
              null !==
                (u =
                  null !== (d = null == n ? void 0 : n.firstWeekContainsDate) &&
                  void 0 !== d
                    ? d
                    : null == n ||
                      null === (f = n.locale) ||
                      void 0 === f ||
                      null === (v = f.options) ||
                      void 0 === v
                    ? void 0
                    : v.firstWeekContainsDate) && void 0 !== u
                ? u
                : N.firstWeekContainsDate) && void 0 !== i
            ? i
            : null === (h = N.locale) ||
              void 0 === h ||
              null === (m = h.options) ||
              void 0 === m
            ? void 0
            : m.firstWeekContainsDate) && void 0 !== o
        ? o
        : 1
    );
  if (!(S >= 1 && S <= 7))
    throw new RangeError(
      "firstWeekContainsDate must be between 1 and 7 inclusively"
    );
  var U = l(
    null !==
      (g =
        null !==
          (w =
            null !==
              (y =
                null !== (p = null == n ? void 0 : n.weekStartsOn) &&
                void 0 !== p
                  ? p
                  : null == n ||
                    null === (b = n.locale) ||
                    void 0 === b ||
                    null === (T = b.options) ||
                    void 0 === T
                  ? void 0
                  : T.weekStartsOn) && void 0 !== y
              ? y
              : N.weekStartsOn) && void 0 !== w
          ? w
          : null === (M = N.locale) ||
            void 0 === M ||
            null === (k = M.options) ||
            void 0 === k
          ? void 0
          : k.weekStartsOn) && void 0 !== g
      ? g
      : 0
  );
  if (!(U >= 0 && U <= 6))
    throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
  if (!x.localize)
    throw new RangeError("locale must contain localize property");
  if (!x.formatLong)
    throw new RangeError("locale must contain formatLong property");
  var E = c(t);
  if (!mt(E)) throw new RangeError("Invalid time value");
  var H = me(E, Y(E)),
    F = {
      firstWeekContainsDate: S,
      weekStartsOn: U,
      locale: x,
      _originalDate: E,
    };
  return C.match(_e)
    .map(function (t) {
      var e = t[0];
      return "p" === e || "P" === e ? (0, We[e])(t, x.formatLong) : t;
    })
    .join("")
    .match(Ve)
    .map(function (r) {
      if ("''" === r) return "'";
      var a = r[0];
      if ("'" === a)
        return (function (t) {
          var e = t.match(tn);
          if (!e) return t;
          return e[1].replace(en, "'");
        })(r);
      var o = He[a];
      if (o)
        return (
          (null != n && n.useAdditionalWeekYearTokens) ||
            !Qe(r) ||
            je(r, e, String(t)),
          (null != n && n.useAdditionalDayOfYearTokens) ||
            !Le(r) ||
            je(r, e, String(t)),
          o(H, r, x.localize, F)
        );
      if (a.match(nn))
        throw new RangeError(
          "Format string contains an unescaped latin alphabet character `" +
            a +
            "`"
        );
      return r;
    })
    .join("");
}
function an(t, e) {
  if (null == t)
    throw new TypeError(
      "assign requires that input parameter not be null or undefined"
    );
  for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
  return t;
}
function on(t) {
  return an({}, t);
}
var un = 1440,
  ln = 2520,
  sn = 43200,
  cn = 86400;
function dn(t, e, n) {
  var r, a;
  s(2, arguments);
  var o = D(),
    i =
      null !==
        (r =
          null !== (a = null == n ? void 0 : n.locale) && void 0 !== a
            ? a
            : o.locale) && void 0 !== r
        ? r
        : Ke;
  if (!i.formatDistance)
    throw new RangeError("locale must contain formatDistance property");
  var u = G(t, e);
  if (isNaN(u)) throw new RangeError("Invalid time value");
  var l,
    d,
    f = an(on(n), {
      addSuffix: Boolean(null == n ? void 0 : n.addSuffix),
      comparison: u,
    });
  u > 0 ? ((l = c(e)), (d = c(t))) : ((l = c(t)), (d = c(e)));
  var v,
    h = It(d, l),
    m = (Y(d) - Y(l)) / 1e3,
    g = Math.round((h - m) / 60);
  if (g < 2)
    return null != n && n.includeSeconds
      ? h < 5
        ? i.formatDistance("lessThanXSeconds", 5, f)
        : h < 10
        ? i.formatDistance("lessThanXSeconds", 10, f)
        : h < 20
        ? i.formatDistance("lessThanXSeconds", 20, f)
        : h < 40
        ? i.formatDistance("halfAMinute", 0, f)
        : h < 60
        ? i.formatDistance("lessThanXMinutes", 1, f)
        : i.formatDistance("xMinutes", 1, f)
      : 0 === g
      ? i.formatDistance("lessThanXMinutes", 1, f)
      : i.formatDistance("xMinutes", g, f);
  if (g < 45) return i.formatDistance("xMinutes", g, f);
  if (g < 90) return i.formatDistance("aboutXHours", 1, f);
  if (g < un) {
    var w = Math.round(g / 60);
    return i.formatDistance("aboutXHours", w, f);
  }
  if (g < ln) return i.formatDistance("xDays", 1, f);
  if (g < sn) {
    var y = Math.round(g / un);
    return i.formatDistance("xDays", y, f);
  }
  if (g < cn)
    return (v = Math.round(g / sn)), i.formatDistance("aboutXMonths", v, f);
  if ((v = Wt(d, l)) < 12) {
    var p = Math.round(g / sn);
    return i.formatDistance("xMonths", p, f);
  }
  var b = v % 12,
    T = Math.floor(v / 12);
  return b < 3
    ? i.formatDistance("aboutXYears", T, f)
    : b < 9
    ? i.formatDistance("overXYears", T, f)
    : i.formatDistance("almostXYears", T + 1, f);
}
var fn = 6e4,
  vn = 1440,
  hn = 30 * vn,
  mn = 365 * vn;
function gn(t, e, n) {
  var r, a, o;
  s(2, arguments);
  var i = D(),
    u =
      null !==
        (r =
          null !== (a = null == n ? void 0 : n.locale) && void 0 !== a
            ? a
            : i.locale) && void 0 !== r
        ? r
        : Ke;
  if (!u.formatDistance)
    throw new RangeError(
      "locale must contain localize.formatDistance property"
    );
  var l = G(t, e);
  if (isNaN(l)) throw new RangeError("Invalid time value");
  var d,
    f,
    v = an(on(n), {
      addSuffix: Boolean(null == n ? void 0 : n.addSuffix),
      comparison: l,
    });
  l > 0 ? ((d = c(e)), (f = c(t))) : ((d = c(t)), (f = c(e)));
  var h,
    m = String(
      null !== (o = null == n ? void 0 : n.roundingMethod) && void 0 !== o
        ? o
        : "round"
    );
  if ("floor" === m) h = Math.floor;
  else if ("ceil" === m) h = Math.ceil;
  else {
    if ("round" !== m)
      throw new RangeError("roundingMethod must be 'floor', 'ceil' or 'round'");
    h = Math.round;
  }
  var g,
    w = f.getTime() - d.getTime(),
    y = w / fn,
    p = (w - (Y(f) - Y(d))) / fn,
    b = null == n ? void 0 : n.unit;
  if (
    "second" ===
    (g = b
      ? String(b)
      : y < 1
      ? "second"
      : y < 60
      ? "minute"
      : y < vn
      ? "hour"
      : p < hn
      ? "day"
      : p < mn
      ? "month"
      : "year")
  ) {
    var T = h(w / 1e3);
    return u.formatDistance("xSeconds", T, v);
  }
  if ("minute" === g) {
    var M = h(y);
    return u.formatDistance("xMinutes", M, v);
  }
  if ("hour" === g) {
    var k = h(y / 60);
    return u.formatDistance("xHours", k, v);
  }
  if ("day" === g) {
    var C = h(p / vn);
    return u.formatDistance("xDays", C, v);
  }
  if ("month" === g) {
    var N = h(p / hn);
    return 12 === N && "month" !== b
      ? u.formatDistance("xYears", 1, v)
      : u.formatDistance("xMonths", N, v);
  }
  if ("year" === g) {
    var x = h(p / mn);
    return u.formatDistance("xYears", x, v);
  }
  throw new RangeError(
    "unit must be 'second', 'minute', 'hour', 'day', 'month' or 'year'"
  );
}
function wn(t, e) {
  return s(1, arguments), dn(t, Date.now(), e);
}
function yn(t, e) {
  return s(1, arguments), gn(t, Date.now(), e);
}
var pn = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"];
function bn(t, e) {
  var n, r, a, o, i;
  if (arguments.length < 1)
    throw new TypeError(
      "1 argument required, but only ".concat(arguments.length, " present")
    );
  var u = D(),
    l =
      null !==
        (n =
          null !== (r = null == e ? void 0 : e.locale) && void 0 !== r
            ? r
            : u.locale) && void 0 !== n
        ? n
        : Ke,
    s = null !== (a = null == e ? void 0 : e.format) && void 0 !== a ? a : pn,
    c = null !== (o = null == e ? void 0 : e.zero) && void 0 !== o && o,
    d =
      null !== (i = null == e ? void 0 : e.delimiter) && void 0 !== i ? i : " ";
  return l.formatDistance
    ? s
        .reduce(function (e, n) {
          var r = "x".concat(
              n.replace(/(^.)/, function (t) {
                return t.toUpperCase();
              })
            ),
            a = t[n];
          return "number" == typeof a && (c || t[n])
            ? e.concat(l.formatDistance(r, a))
            : e;
        }, [])
        .join(d)
    : "";
}
function Tn(t, e) {
  var n, r;
  s(1, arguments);
  var a = c(t);
  if (isNaN(a.getTime())) throw new RangeError("Invalid time value");
  var o = String(
      null !== (n = null == e ? void 0 : e.format) && void 0 !== n
        ? n
        : "extended"
    ),
    i = String(
      null !== (r = null == e ? void 0 : e.representation) && void 0 !== r
        ? r
        : "complete"
    );
  if ("extended" !== o && "basic" !== o)
    throw new RangeError("format must be 'extended' or 'basic'");
  if ("date" !== i && "time" !== i && "complete" !== i)
    throw new RangeError(
      "representation must be 'date', 'time', or 'complete'"
    );
  var u = "",
    l = "",
    d = "extended" === o ? "-" : "",
    f = "extended" === o ? ":" : "";
  if ("time" !== i) {
    var v = ke(a.getDate(), 2),
      h = ke(a.getMonth() + 1, 2),
      m = ke(a.getFullYear(), 4);
    u = "".concat(m).concat(d).concat(h).concat(d).concat(v);
  }
  if ("date" !== i) {
    var g = a.getTimezoneOffset();
    if (0 !== g) {
      var w = Math.abs(g),
        y = ke(Math.floor(w / 60), 2),
        p = ke(w % 60, 2);
      l = ""
        .concat(g < 0 ? "+" : "-")
        .concat(y, ":")
        .concat(p);
    } else l = "Z";
    var b = "" === u ? "" : "T",
      T = [
        ke(a.getHours(), 2),
        ke(a.getMinutes(), 2),
        ke(a.getSeconds(), 2),
      ].join(f);
    u = "".concat(u).concat(b).concat(T).concat(l);
  }
  return u;
}
function Dn(t, e) {
  var n, r;
  if (arguments.length < 1)
    throw new TypeError(
      "1 argument required, but only ".concat(arguments.length, " present")
    );
  var a = c(t);
  if (!mt(a)) throw new RangeError("Invalid time value");
  var o = String(
      null !== (n = null == e ? void 0 : e.format) && void 0 !== n
        ? n
        : "extended"
    ),
    i = String(
      null !== (r = null == e ? void 0 : e.representation) && void 0 !== r
        ? r
        : "complete"
    );
  if ("extended" !== o && "basic" !== o)
    throw new RangeError("format must be 'extended' or 'basic'");
  if ("date" !== i && "time" !== i && "complete" !== i)
    throw new RangeError(
      "representation must be 'date', 'time', or 'complete'"
    );
  var u = "",
    l = "extended" === o ? "-" : "",
    s = "extended" === o ? ":" : "";
  if ("time" !== i) {
    var d = ke(a.getDate(), 2),
      f = ke(a.getMonth() + 1, 2),
      v = ke(a.getFullYear(), 4);
    u = "".concat(v).concat(l).concat(f).concat(l).concat(d);
  }
  if ("date" !== i) {
    var h = ke(a.getHours(), 2),
      m = ke(a.getMinutes(), 2),
      g = ke(a.getSeconds(), 2),
      w = "" === u ? "" : " ";
    u = ""
      .concat(u)
      .concat(w)
      .concat(h)
      .concat(s)
      .concat(m)
      .concat(s)
      .concat(g);
  }
  return u;
}
function Mn(e) {
  if ((s(1, arguments), "object" !== t(e)))
    throw new Error("Duration must be an object");
  var n = e.years,
    r = void 0 === n ? 0 : n,
    a = e.months,
    o = void 0 === a ? 0 : a,
    i = e.days,
    u = void 0 === i ? 0 : i,
    l = e.hours,
    c = void 0 === l ? 0 : l,
    d = e.minutes,
    f = void 0 === d ? 0 : d,
    v = e.seconds,
    h = void 0 === v ? 0 : v;
  return "P"
    .concat(r, "Y")
    .concat(o, "M")
    .concat(u, "DT")
    .concat(c, "H")
    .concat(f, "M")
    .concat(h, "S");
}
function kn(t, e) {
  var n;
  if (arguments.length < 1)
    throw new TypeError(
      "1 arguments required, but only ".concat(arguments.length, " present")
    );
  var r = c(t);
  if (!mt(r)) throw new RangeError("Invalid time value");
  var a = Number(
    null !== (n = null == e ? void 0 : e.fractionDigits) && void 0 !== n ? n : 0
  );
  if (!(a >= 0 && a <= 3))
    throw new RangeError("fractionDigits must be between 0 and 3 inclusively");
  var o = ke(r.getDate(), 2),
    i = ke(r.getMonth() + 1, 2),
    u = r.getFullYear(),
    s = ke(r.getHours(), 2),
    d = ke(r.getMinutes(), 2),
    f = ke(r.getSeconds(), 2),
    v = "";
  if (a > 0) {
    var h = r.getMilliseconds();
    v = "." + ke(Math.floor(h * Math.pow(10, a - 3)), a);
  }
  var m = "",
    g = r.getTimezoneOffset();
  if (0 !== g) {
    var w = Math.abs(g),
      y = ke(l(w / 60), 2),
      p = ke(w % 60, 2);
    m = ""
      .concat(g < 0 ? "+" : "-")
      .concat(y, ":")
      .concat(p);
  } else m = "Z";
  return ""
    .concat(u, "-")
    .concat(i, "-")
    .concat(o, "T")
    .concat(s, ":")
    .concat(d, ":")
    .concat(f)
    .concat(v)
    .concat(m);
}
var Cn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  Nn = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
function xn(t) {
  if (arguments.length < 1)
    throw new TypeError(
      "1 arguments required, but only ".concat(arguments.length, " present")
    );
  var e = c(t);
  if (!mt(e)) throw new RangeError("Invalid time value");
  var n = Cn[e.getUTCDay()],
    r = ke(e.getUTCDate(), 2),
    a = Nn[e.getUTCMonth()],
    o = e.getUTCFullYear(),
    i = ke(e.getUTCHours(), 2),
    u = ke(e.getUTCMinutes(), 2),
    l = ke(e.getUTCSeconds(), 2);
  return ""
    .concat(n, ", ")
    .concat(r, " ")
    .concat(a, " ")
    .concat(o, " ")
    .concat(i, ":")
    .concat(u, ":")
    .concat(l, " GMT");
}
function Yn(t, e, n) {
  var r, a, o, i, u, d, f, v, h, m;
  s(2, arguments);
  var g = c(t),
    w = c(e),
    y = D(),
    p =
      null !==
        (r =
          null !== (a = null == n ? void 0 : n.locale) && void 0 !== a
            ? a
            : y.locale) && void 0 !== r
        ? r
        : Ke,
    b = l(
      null !==
        (o =
          null !==
            (i =
              null !==
                (u =
                  null !== (d = null == n ? void 0 : n.weekStartsOn) &&
                  void 0 !== d
                    ? d
                    : null == n ||
                      null === (f = n.locale) ||
                      void 0 === f ||
                      null === (v = f.options) ||
                      void 0 === v
                    ? void 0
                    : v.weekStartsOn) && void 0 !== u
                ? u
                : y.weekStartsOn) && void 0 !== i
            ? i
            : null === (h = y.locale) ||
              void 0 === h ||
              null === (m = h.options) ||
              void 0 === m
            ? void 0
            : m.weekStartsOn) && void 0 !== o
        ? o
        : 0
    );
  if (!p.localize)
    throw new RangeError("locale must contain localize property");
  if (!p.formatLong)
    throw new RangeError("locale must contain formatLong property");
  if (!p.formatRelative)
    throw new RangeError("locale must contain formatRelative property");
  var T,
    M = E(g, w);
  if (isNaN(M)) throw new RangeError("Invalid time value");
  T =
    M < -6
      ? "other"
      : M < -1
      ? "lastWeek"
      : M < 0
      ? "yesterday"
      : M < 1
      ? "today"
      : M < 2
      ? "tomorrow"
      : M < 7
      ? "nextWeek"
      : "other";
  var k = me(g, Y(g)),
    C = me(w, Y(w));
  return rn(g, p.formatRelative(T, k, C, { locale: p, weekStartsOn: b }), {
    locale: p,
    weekStartsOn: b,
  });
}
function Sn(t) {
  return s(1, arguments), c(1e3 * l(t));
}
function Un(t) {
  return s(1, arguments), c(t).getDate();
}
function En(t) {
  return s(1, arguments), c(t).getDay();
}
function Hn(t) {
  s(1, arguments);
  var e = c(t);
  return E(e, ee(e)) + 1;
}
function Fn(t) {
  s(1, arguments);
  var e = c(t),
    n = e.getFullYear(),
    r = e.getMonth(),
    a = new Date(0);
  return a.setFullYear(n, r + 1, 0), a.setHours(0, 0, 0, 0), a.getDate();
}
function On(t) {
  s(1, arguments);
  var e = c(t).getFullYear();
  return e % 400 == 0 || (e % 4 == 0 && e % 100 != 0);
}
function Pn(t) {
  s(1, arguments);
  var e = c(t);
  return "Invalid Date" === String(new Date(e)) ? NaN : On(e) ? 366 : 365;
}
function Rn(t) {
  s(1, arguments);
  var e = c(t).getFullYear();
  return 10 * Math.floor(e / 10);
}
function qn() {
  return an({}, D());
}
function Wn(t) {
  return s(1, arguments), c(t).getHours();
}
function An(t) {
  s(1, arguments);
  var e = c(t).getDay();
  return 0 === e && (e = 7), e;
}
var In = 6048e5;
function Ln(t) {
  s(1, arguments);
  var e = c(t),
    n = C(e).getTime() - x(e).getTime();
  return Math.round(n / In) + 1;
}
function Qn(t) {
  s(1, arguments);
  var e = x(t),
    n = x(W(e, 60)).valueOf() - e.valueOf();
  return Math.round(n / 6048e5);
}
function jn(t) {
  return s(1, arguments), c(t).getMilliseconds();
}
function Xn(t) {
  return s(1, arguments), c(t).getMinutes();
}
function zn(t) {
  return s(1, arguments), c(t).getMonth();
}
function Gn(t, e) {
  s(2, arguments);
  var n = t || {},
    r = e || {},
    a = c(n.start).getTime(),
    o = c(n.end).getTime(),
    i = c(r.start).getTime(),
    u = c(r.end).getTime();
  if (!(a <= o && i <= u)) throw new RangeError("Invalid interval");
  if (!(a < u && i < o)) return 0;
  var l = (u > o ? o : u) - (i < a ? a : i);
  return Math.ceil(l / 864e5);
}
function Bn(t) {
  return s(1, arguments), c(t).getSeconds();
}
function Zn(t) {
  return s(1, arguments), c(t).getTime();
}
function $n(t) {
  return s(1, arguments), Math.floor(Zn(t) / 1e3);
}
function Jn(t, e) {
  var n, r, a, o, i, u, d, f;
  s(1, arguments);
  var v = c(t),
    h = v.getFullYear(),
    m = D(),
    g = l(
      null !==
        (n =
          null !==
            (r =
              null !==
                (a =
                  null !== (o = null == e ? void 0 : e.firstWeekContainsDate) &&
                  void 0 !== o
                    ? o
                    : null == e ||
                      null === (i = e.locale) ||
                      void 0 === i ||
                      null === (u = i.options) ||
                      void 0 === u
                    ? void 0
                    : u.firstWeekContainsDate) && void 0 !== a
                ? a
                : m.firstWeekContainsDate) && void 0 !== r
            ? r
            : null === (d = m.locale) ||
              void 0 === d ||
              null === (f = d.options) ||
              void 0 === f
            ? void 0
            : f.firstWeekContainsDate) && void 0 !== n
        ? n
        : 1
    );
  if (!(g >= 1 && g <= 7))
    throw new RangeError(
      "firstWeekContainsDate must be between 1 and 7 inclusively"
    );
  var w = new Date(0);
  w.setFullYear(h + 1, 0, g), w.setHours(0, 0, 0, 0);
  var y = k(w, e),
    p = new Date(0);
  p.setFullYear(h, 0, g), p.setHours(0, 0, 0, 0);
  var b = k(p, e);
  return v.getTime() >= y.getTime()
    ? h + 1
    : v.getTime() >= b.getTime()
    ? h
    : h - 1;
}
function Kn(t, e) {
  var n, r, a, o, i, u, c, d;
  s(1, arguments);
  var f = D(),
    v = l(
      null !==
        (n =
          null !==
            (r =
              null !==
                (a =
                  null !== (o = null == e ? void 0 : e.firstWeekContainsDate) &&
                  void 0 !== o
                    ? o
                    : null == e ||
                      null === (i = e.locale) ||
                      void 0 === i ||
                      null === (u = i.options) ||
                      void 0 === u
                    ? void 0
                    : u.firstWeekContainsDate) && void 0 !== a
                ? a
                : f.firstWeekContainsDate) && void 0 !== r
            ? r
            : null === (c = f.locale) ||
              void 0 === c ||
              null === (d = c.options) ||
              void 0 === d
            ? void 0
            : d.firstWeekContainsDate) && void 0 !== n
        ? n
        : 1
    ),
    h = Jn(t, e),
    m = new Date(0);
  return m.setFullYear(h, 0, v), m.setHours(0, 0, 0, 0), k(m, e);
}
var Vn = 6048e5;
function _n(t, e) {
  s(1, arguments);
  var n = c(t),
    r = k(n, e).getTime() - Kn(n, e).getTime();
  return Math.round(r / Vn) + 1;
}
function tr(t, e) {
  var n, r, a, o, i, u, c, d;
  s(1, arguments);
  var f = D(),
    v = l(
      null !==
        (n =
          null !==
            (r =
              null !==
                (a =
                  null !== (o = null == e ? void 0 : e.weekStartsOn) &&
                  void 0 !== o
                    ? o
                    : null == e ||
                      null === (i = e.locale) ||
                      void 0 === i ||
                      null === (u = i.options) ||
                      void 0 === u
                    ? void 0
                    : u.weekStartsOn) && void 0 !== a
                ? a
                : f.weekStartsOn) && void 0 !== r
            ? r
            : null === (c = f.locale) ||
              void 0 === c ||
              null === (d = c.options) ||
              void 0 === d
            ? void 0
            : d.weekStartsOn) && void 0 !== n
        ? n
        : 0
    );
  if (!(v >= 0 && v <= 6))
    throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
  var h = Un(t);
  if (isNaN(h)) return NaN;
  var m = v - En(Vt(t));
  m <= 0 && (m += 7);
  var g = h - m;
  return Math.ceil(g / 7) + 1;
}
function er(t) {
  s(1, arguments);
  var e = c(t),
    n = e.getMonth();
  return e.setFullYear(e.getFullYear(), n + 1, 0), e.setHours(0, 0, 0, 0), e;
}
function nr(t, e) {
  return s(1, arguments), Mt(er(t), Vt(t), e) + 1;
}
function rr(t) {
  return s(1, arguments), c(t).getFullYear();
}
function ar(t) {
  return s(1, arguments), Math.floor(t * V);
}
function or(t) {
  return s(1, arguments), Math.floor(60 * t);
}
function ir(t) {
  return s(1, arguments), Math.floor(t * ot);
}
function ur(t) {
  s(1, arguments);
  var e = c(t.start),
    n = c(t.end);
  if (isNaN(e.getTime())) throw new RangeError("Start Date is invalid");
  if (isNaN(n.getTime())) throw new RangeError("End Date is invalid");
  var r = {};
  r.years = Math.abs(Qt(n, e));
  var a = G(n, e),
    o = v(e, { years: a * r.years });
  r.months = Math.abs(Wt(n, o));
  var i = v(o, { months: a * r.months });
  r.days = Math.abs(Nt(n, i));
  var u = v(i, { days: a * r.days });
  r.hours = Math.abs(Et(n, u));
  var l = v(u, { hours: a * r.hours });
  r.minutes = Math.abs(Ot(n, l));
  var d = v(l, { minutes: a * r.minutes });
  return (r.seconds = Math.abs(It(n, d))), r;
}
function lr(t, e, n) {
  var r, a, o;
  return (
    s(1, arguments),
    void 0 === (o = e) || "locale" in o ? (n = e) : (a = e),
    new Intl.DateTimeFormat(
      null === (r = n) || void 0 === r ? void 0 : r.locale,
      a
    ).format(t)
  );
}
function sr(t, e, n) {
  s(2, arguments);
  var r,
    a = 0,
    o = c(t),
    i = c(e);
  if (null != n && n.unit)
    "second" === (r = null == n ? void 0 : n.unit)
      ? (a = It(o, i))
      : "minute" === r
      ? (a = Ot(o, i))
      : "hour" === r
      ? (a = Et(o, i))
      : "day" === r
      ? (a = E(o, i))
      : "week" === r
      ? (a = Mt(o, i))
      : "month" === r
      ? (a = pt(o, i))
      : "quarter" === r
      ? (a = Tt(o, i))
      : "year" === r && (a = kt(o, i));
  else {
    var u = It(o, i);
    Math.abs(u) < 60
      ? ((a = It(o, i)), (r = "second"))
      : Math.abs(u) < ot
      ? ((a = Ot(o, i)), (r = "minute"))
      : Math.abs(u) < ut && Math.abs(E(o, i)) < 1
      ? ((a = Et(o, i)), (r = "hour"))
      : Math.abs(u) < lt && (a = E(o, i)) && Math.abs(a) < 7
      ? (r = "day")
      : Math.abs(u) < ct
      ? ((a = Mt(o, i)), (r = "week"))
      : Math.abs(u) < dt
      ? ((a = pt(o, i)), (r = "month"))
      : Math.abs(u) < st && Tt(o, i) < 4
      ? ((a = Tt(o, i)), (r = "quarter"))
      : ((a = kt(o, i)), (r = "year"));
  }
  return new Intl.RelativeTimeFormat(null == n ? void 0 : n.locale, {
    localeMatcher: null == n ? void 0 : n.localeMatcher,
    numeric: (null == n ? void 0 : n.numeric) || "auto",
    style: null == n ? void 0 : n.style,
  }).format(a, r);
}
function cr(t, e) {
  s(2, arguments);
  var n = c(t),
    r = c(e);
  return n.getTime() > r.getTime();
}
function dr(t, e) {
  s(2, arguments);
  var n = c(t),
    r = c(e);
  return n.getTime() < r.getTime();
}
function fr(t, e) {
  s(2, arguments);
  var n = c(t),
    r = c(e);
  return n.getTime() === r.getTime();
}
function vr(t, e, n) {
  if (arguments.length < 3)
    throw new TypeError(
      "3 argument required, but only " + arguments.length + " present"
    );
  var r = new Date(t, e, n);
  return r.getFullYear() === t && r.getMonth() === e && r.getDate() === n;
}
function hr(t) {
  return s(1, arguments), 1 === c(t).getDate();
}
function mr(t) {
  return s(1, arguments), 5 === c(t).getDay();
}
function gr(t) {
  return s(1, arguments), c(t).getTime() > Date.now();
}
var wr = (function () {
    function t() {
      o(this, t), u(this, "priority", void 0), u(this, "subPriority", 0);
    }
    return (
      i(t, [
        {
          key: "validate",
          value: function (t, e) {
            return !0;
          },
        },
      ]),
      t
    );
  })(),
  yr = (function (t) {
    r(n, wr);
    var e = a(n);
    function n(t, r, a, i, u) {
      var l;
      return (
        o(this, n),
        ((l = e.call(this)).value = t),
        (l.validateValue = r),
        (l.setValue = a),
        (l.priority = i),
        u && (l.subPriority = u),
        l
      );
    }
    return (
      i(n, [
        {
          key: "validate",
          value: function (t, e) {
            return this.validateValue(t, this.value, e);
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return this.setValue(t, e, this.value, n);
          },
        },
      ]),
      n
    );
  })(),
  pr = (function (t) {
    r(l, wr);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 10),
        u(n(t), "subPriority", -1),
        t
      );
    }
    return (
      i(l, [
        {
          key: "set",
          value: function (t, e) {
            if (e.timestampIsSet) return t;
            var n = new Date(0);
            return (
              n.setFullYear(
                t.getUTCFullYear(),
                t.getUTCMonth(),
                t.getUTCDate()
              ),
              n.setHours(
                t.getUTCHours(),
                t.getUTCMinutes(),
                t.getUTCSeconds(),
                t.getUTCMilliseconds()
              ),
              n
            );
          },
        },
      ]),
      l
    );
  })(),
  br = (function () {
    function t() {
      o(this, t),
        u(this, "incompatibleTokens", void 0),
        u(this, "priority", void 0),
        u(this, "subPriority", void 0);
    }
    return (
      i(t, [
        {
          key: "run",
          value: function (t, e, n, r) {
            var a = this.parse(t, e, n, r);
            return a
              ? {
                  setter: new yr(
                    a.value,
                    this.validate,
                    this.set,
                    this.priority,
                    this.subPriority
                  ),
                  rest: a.rest,
                }
              : null;
          },
        },
        {
          key: "validate",
          value: function (t, e, n) {
            return !0;
          },
        },
      ]),
      t
    );
  })(),
  Tr = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 140),
        u(n(t), "incompatibleTokens", ["R", "u", "t", "T"]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "G":
              case "GG":
              case "GGG":
                return (
                  n.era(t, { width: "abbreviated" }) ||
                  n.era(t, { width: "narrow" })
                );
              case "GGGGG":
                return n.era(t, { width: "narrow" });
              default:
                return (
                  n.era(t, { width: "wide" }) ||
                  n.era(t, { width: "abbreviated" }) ||
                  n.era(t, { width: "narrow" })
                );
            }
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return (
              (e.era = n),
              t.setUTCFullYear(n, 0, 1),
              t.setUTCHours(0, 0, 0, 0),
              t
            );
          },
        },
      ]),
      l
    );
  })(),
  Dr = /^(1[0-2]|0?\d)/,
  Mr = /^(3[0-1]|[0-2]?\d)/,
  kr = /^(36[0-6]|3[0-5]\d|[0-2]?\d?\d)/,
  Cr = /^(5[0-3]|[0-4]?\d)/,
  Nr = /^(2[0-3]|[0-1]?\d)/,
  xr = /^(2[0-4]|[0-1]?\d)/,
  Yr = /^(1[0-1]|0?\d)/,
  Sr = /^(1[0-2]|0?\d)/,
  Ur = /^[0-5]?\d/,
  Er = /^[0-5]?\d/,
  Hr = /^\d/,
  Fr = /^\d{1,2}/,
  Or = /^\d{1,3}/,
  Pr = /^\d{1,4}/,
  Rr = /^-?\d+/,
  qr = /^-?\d/,
  Wr = /^-?\d{1,2}/,
  Ar = /^-?\d{1,3}/,
  Ir = /^-?\d{1,4}/,
  Lr = /^([+-])(\d{2})(\d{2})?|Z/,
  Qr = /^([+-])(\d{2})(\d{2})|Z/,
  jr = /^([+-])(\d{2})(\d{2})((\d{2}))?|Z/,
  Xr = /^([+-])(\d{2}):(\d{2})|Z/,
  zr = /^([+-])(\d{2}):(\d{2})(:(\d{2}))?|Z/;
function Gr(t, e) {
  return t ? { value: e(t.value), rest: t.rest } : t;
}
function Br(t, e) {
  var n = e.match(t);
  return n ? { value: parseInt(n[0], 10), rest: e.slice(n[0].length) } : null;
}
function Zr(t, e) {
  var n = e.match(t);
  if (!n) return null;
  if ("Z" === n[0]) return { value: 0, rest: e.slice(1) };
  var r = "+" === n[1] ? 1 : -1,
    a = n[2] ? parseInt(n[2], 10) : 0,
    o = n[3] ? parseInt(n[3], 10) : 0,
    i = n[5] ? parseInt(n[5], 10) : 0;
  return { value: r * (a * V + o * K + i * _), rest: e.slice(n[0].length) };
}
function $r(t) {
  return Br(Rr, t);
}
function Jr(t, e) {
  switch (t) {
    case 1:
      return Br(Hr, e);
    case 2:
      return Br(Fr, e);
    case 3:
      return Br(Or, e);
    case 4:
      return Br(Pr, e);
    default:
      return Br(new RegExp("^\\d{1," + t + "}"), e);
  }
}
function Kr(t, e) {
  switch (t) {
    case 1:
      return Br(qr, e);
    case 2:
      return Br(Wr, e);
    case 3:
      return Br(Ar, e);
    case 4:
      return Br(Ir, e);
    default:
      return Br(new RegExp("^-?\\d{1," + t + "}"), e);
  }
}
function Vr(t) {
  switch (t) {
    case "morning":
      return 4;
    case "evening":
      return 17;
    case "pm":
    case "noon":
    case "afternoon":
      return 12;
    default:
      return 0;
  }
}
function _r(t, e) {
  var n,
    r = e > 0,
    a = r ? e : 1 - e;
  if (a <= 50) n = t || 100;
  else {
    var o = a + 50;
    n = t + 100 * Math.floor(o / 100) - (t >= o % 100 ? 100 : 0);
  }
  return r ? n : 1 - n;
}
function ta(t) {
  return t % 400 == 0 || (t % 4 == 0 && t % 100 != 0);
}
var ea = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 130),
        u(n(t), "incompatibleTokens", [
          "Y",
          "R",
          "u",
          "w",
          "I",
          "i",
          "e",
          "c",
          "t",
          "T",
        ]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            var r = function (t) {
              return { year: t, isTwoDigitYear: "yy" === e };
            };
            switch (e) {
              case "y":
                return Gr(Jr(4, t), r);
              case "yo":
                return Gr(n.ordinalNumber(t, { unit: "year" }), r);
              default:
                return Gr(Jr(e.length, t), r);
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e.isTwoDigitYear || e.year > 0;
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            var r = t.getUTCFullYear();
            if (n.isTwoDigitYear) {
              var a = _r(n.year, r);
              return t.setUTCFullYear(a, 0, 1), t.setUTCHours(0, 0, 0, 0), t;
            }
            var o = "era" in e && 1 !== e.era ? 1 - n.year : n.year;
            return t.setUTCFullYear(o, 0, 1), t.setUTCHours(0, 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  na = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 130),
        u(n(t), "incompatibleTokens", [
          "y",
          "R",
          "u",
          "Q",
          "q",
          "M",
          "L",
          "I",
          "d",
          "D",
          "i",
          "t",
          "T",
        ]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            var r = function (t) {
              return { year: t, isTwoDigitYear: "YY" === e };
            };
            switch (e) {
              case "Y":
                return Gr(Jr(4, t), r);
              case "Yo":
                return Gr(n.ordinalNumber(t, { unit: "year" }), r);
              default:
                return Gr(Jr(e.length, t), r);
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e.isTwoDigitYear || e.year > 0;
          },
        },
        {
          key: "set",
          value: function (t, e, n, r) {
            var a = Te(t, r);
            if (n.isTwoDigitYear) {
              var o = _r(n.year, a);
              return (
                t.setUTCFullYear(o, 0, r.firstWeekContainsDate),
                t.setUTCHours(0, 0, 0, 0),
                be(t, r)
              );
            }
            var i = "era" in e && 1 !== e.era ? 1 - n.year : n.year;
            return (
              t.setUTCFullYear(i, 0, r.firstWeekContainsDate),
              t.setUTCHours(0, 0, 0, 0),
              be(t, r)
            );
          },
        },
      ]),
      l
    );
  })(),
  ra = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 130),
        u(n(t), "incompatibleTokens", [
          "G",
          "y",
          "Y",
          "u",
          "Q",
          "q",
          "M",
          "L",
          "w",
          "d",
          "D",
          "e",
          "c",
          "t",
          "T",
        ]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e) {
            return Kr("R" === e ? 4 : e.length, t);
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            var r = new Date(0);
            return r.setUTCFullYear(n, 0, 4), r.setUTCHours(0, 0, 0, 0), ge(r);
          },
        },
      ]),
      l
    );
  })(),
  aa = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 130),
        u(n(t), "incompatibleTokens", [
          "G",
          "y",
          "Y",
          "R",
          "w",
          "I",
          "i",
          "e",
          "c",
          "t",
          "T",
        ]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e) {
            return Kr("u" === e ? 4 : e.length, t);
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return t.setUTCFullYear(n, 0, 1), t.setUTCHours(0, 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  oa = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 120),
        u(n(t), "incompatibleTokens", [
          "Y",
          "R",
          "q",
          "M",
          "L",
          "w",
          "I",
          "d",
          "D",
          "i",
          "e",
          "c",
          "t",
          "T",
        ]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "Q":
              case "QQ":
                return Jr(e.length, t);
              case "Qo":
                return n.ordinalNumber(t, { unit: "quarter" });
              case "QQQ":
                return (
                  n.quarter(t, {
                    width: "abbreviated",
                    context: "formatting",
                  }) || n.quarter(t, { width: "narrow", context: "formatting" })
                );
              case "QQQQQ":
                return n.quarter(t, { width: "narrow", context: "formatting" });
              default:
                return (
                  n.quarter(t, { width: "wide", context: "formatting" }) ||
                  n.quarter(t, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  n.quarter(t, { width: "narrow", context: "formatting" })
                );
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 1 && e <= 4;
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return t.setUTCMonth(3 * (n - 1), 1), t.setUTCHours(0, 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  ia = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 120),
        u(n(t), "incompatibleTokens", [
          "Y",
          "R",
          "Q",
          "M",
          "L",
          "w",
          "I",
          "d",
          "D",
          "i",
          "e",
          "c",
          "t",
          "T",
        ]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "q":
              case "qq":
                return Jr(e.length, t);
              case "qo":
                return n.ordinalNumber(t, { unit: "quarter" });
              case "qqq":
                return (
                  n.quarter(t, {
                    width: "abbreviated",
                    context: "standalone",
                  }) || n.quarter(t, { width: "narrow", context: "standalone" })
                );
              case "qqqqq":
                return n.quarter(t, { width: "narrow", context: "standalone" });
              default:
                return (
                  n.quarter(t, { width: "wide", context: "standalone" }) ||
                  n.quarter(t, {
                    width: "abbreviated",
                    context: "standalone",
                  }) ||
                  n.quarter(t, { width: "narrow", context: "standalone" })
                );
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 1 && e <= 4;
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return t.setUTCMonth(3 * (n - 1), 1), t.setUTCHours(0, 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  ua = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "incompatibleTokens", [
          "Y",
          "R",
          "q",
          "Q",
          "L",
          "w",
          "I",
          "D",
          "i",
          "e",
          "c",
          "t",
          "T",
        ]),
        u(n(t), "priority", 110),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            var r = function (t) {
              return t - 1;
            };
            switch (e) {
              case "M":
                return Gr(Br(Dr, t), r);
              case "MM":
                return Gr(Jr(2, t), r);
              case "Mo":
                return Gr(n.ordinalNumber(t, { unit: "month" }), r);
              case "MMM":
                return (
                  n.month(t, { width: "abbreviated", context: "formatting" }) ||
                  n.month(t, { width: "narrow", context: "formatting" })
                );
              case "MMMMM":
                return n.month(t, { width: "narrow", context: "formatting" });
              default:
                return (
                  n.month(t, { width: "wide", context: "formatting" }) ||
                  n.month(t, { width: "abbreviated", context: "formatting" }) ||
                  n.month(t, { width: "narrow", context: "formatting" })
                );
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 0 && e <= 11;
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return t.setUTCMonth(n, 1), t.setUTCHours(0, 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  la = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 110),
        u(n(t), "incompatibleTokens", [
          "Y",
          "R",
          "q",
          "Q",
          "M",
          "w",
          "I",
          "D",
          "i",
          "e",
          "c",
          "t",
          "T",
        ]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            var r = function (t) {
              return t - 1;
            };
            switch (e) {
              case "L":
                return Gr(Br(Dr, t), r);
              case "LL":
                return Gr(Jr(2, t), r);
              case "Lo":
                return Gr(n.ordinalNumber(t, { unit: "month" }), r);
              case "LLL":
                return (
                  n.month(t, { width: "abbreviated", context: "standalone" }) ||
                  n.month(t, { width: "narrow", context: "standalone" })
                );
              case "LLLLL":
                return n.month(t, { width: "narrow", context: "standalone" });
              default:
                return (
                  n.month(t, { width: "wide", context: "standalone" }) ||
                  n.month(t, { width: "abbreviated", context: "standalone" }) ||
                  n.month(t, { width: "narrow", context: "standalone" })
                );
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 0 && e <= 11;
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return t.setUTCMonth(n, 1), t.setUTCHours(0, 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })();
var sa = (function (t) {
  r(d, br);
  var e = a(d);
  function d() {
    var t;
    o(this, d);
    for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
      a[i] = arguments[i];
    return (
      (t = e.call.apply(e, [this].concat(a))),
      u(n(t), "priority", 100),
      u(n(t), "incompatibleTokens", [
        "y",
        "R",
        "u",
        "q",
        "Q",
        "M",
        "L",
        "I",
        "d",
        "D",
        "i",
        "t",
        "T",
      ]),
      t
    );
  }
  return (
    i(d, [
      {
        key: "parse",
        value: function (t, e, n) {
          switch (e) {
            case "w":
              return Br(Cr, t);
            case "wo":
              return n.ordinalNumber(t, { unit: "week" });
            default:
              return Jr(e.length, t);
          }
        },
      },
      {
        key: "validate",
        value: function (t, e) {
          return e >= 1 && e <= 53;
        },
      },
      {
        key: "set",
        value: function (t, e, n, r) {
          return be(
            (function (t, e, n) {
              s(2, arguments);
              var r = c(t),
                a = l(e),
                o = Me(r, n) - a;
              return r.setUTCDate(r.getUTCDate() - 7 * o), r;
            })(t, n, r),
            r
          );
        },
      },
    ]),
    d
  );
})();
var ca = (function (t) {
    r(d, br);
    var e = a(d);
    function d() {
      var t;
      o(this, d);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 100),
        u(n(t), "incompatibleTokens", [
          "y",
          "Y",
          "u",
          "q",
          "Q",
          "M",
          "L",
          "w",
          "d",
          "D",
          "e",
          "c",
          "t",
          "T",
        ]),
        t
      );
    }
    return (
      i(d, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "I":
                return Br(Cr, t);
              case "Io":
                return n.ordinalNumber(t, { unit: "week" });
              default:
                return Jr(e.length, t);
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 1 && e <= 53;
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return ge(
              (function (t, e) {
                s(2, arguments);
                var n = c(t),
                  r = l(e),
                  a = pe(n) - r;
                return n.setUTCDate(n.getUTCDate() - 7 * a), n;
              })(t, n)
            );
          },
        },
      ]),
      d
    );
  })(),
  da = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
  fa = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
  va = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 90),
        u(n(t), "subPriority", 1),
        u(n(t), "incompatibleTokens", [
          "Y",
          "R",
          "q",
          "Q",
          "w",
          "I",
          "D",
          "i",
          "e",
          "c",
          "t",
          "T",
        ]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "d":
                return Br(Mr, t);
              case "do":
                return n.ordinalNumber(t, { unit: "date" });
              default:
                return Jr(e.length, t);
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            var n = ta(t.getUTCFullYear()),
              r = t.getUTCMonth();
            return n ? e >= 1 && e <= fa[r] : e >= 1 && e <= da[r];
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return t.setUTCDate(n), t.setUTCHours(0, 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  ha = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 90),
        u(n(t), "subpriority", 1),
        u(n(t), "incompatibleTokens", [
          "Y",
          "R",
          "q",
          "Q",
          "M",
          "L",
          "w",
          "I",
          "d",
          "E",
          "i",
          "e",
          "c",
          "t",
          "T",
        ]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "D":
              case "DD":
                return Br(kr, t);
              case "Do":
                return n.ordinalNumber(t, { unit: "date" });
              default:
                return Jr(e.length, t);
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return ta(t.getUTCFullYear())
              ? e >= 1 && e <= 366
              : e >= 1 && e <= 365;
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return t.setUTCMonth(0, n), t.setUTCHours(0, 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })();
function ma(t, e, n) {
  var r, a, o, i, u, d, f, v;
  s(2, arguments);
  var h = D(),
    m = l(
      null !==
        (r =
          null !==
            (a =
              null !==
                (o =
                  null !== (i = null == n ? void 0 : n.weekStartsOn) &&
                  void 0 !== i
                    ? i
                    : null == n ||
                      null === (u = n.locale) ||
                      void 0 === u ||
                      null === (d = u.options) ||
                      void 0 === d
                    ? void 0
                    : d.weekStartsOn) && void 0 !== o
                ? o
                : h.weekStartsOn) && void 0 !== a
            ? a
            : null === (f = h.locale) ||
              void 0 === f ||
              null === (v = f.options) ||
              void 0 === v
            ? void 0
            : v.weekStartsOn) && void 0 !== r
        ? r
        : 0
    );
  if (!(m >= 0 && m <= 6))
    throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
  var g = c(t),
    w = l(e),
    y = (((w % 7) + 7) % 7 < m ? 7 : 0) + w - g.getUTCDay();
  return g.setUTCDate(g.getUTCDate() + y), g;
}
var ga = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 90),
        u(n(t), "incompatibleTokens", ["D", "i", "e", "c", "t", "T"]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "E":
              case "EE":
              case "EEE":
                return (
                  n.day(t, { width: "abbreviated", context: "formatting" }) ||
                  n.day(t, { width: "short", context: "formatting" }) ||
                  n.day(t, { width: "narrow", context: "formatting" })
                );
              case "EEEEE":
                return n.day(t, { width: "narrow", context: "formatting" });
              case "EEEEEE":
                return (
                  n.day(t, { width: "short", context: "formatting" }) ||
                  n.day(t, { width: "narrow", context: "formatting" })
                );
              default:
                return (
                  n.day(t, { width: "wide", context: "formatting" }) ||
                  n.day(t, { width: "abbreviated", context: "formatting" }) ||
                  n.day(t, { width: "short", context: "formatting" }) ||
                  n.day(t, { width: "narrow", context: "formatting" })
                );
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 0 && e <= 6;
          },
        },
        {
          key: "set",
          value: function (t, e, n, r) {
            return (t = ma(t, n, r)).setUTCHours(0, 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  wa = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 90),
        u(n(t), "incompatibleTokens", [
          "y",
          "R",
          "u",
          "q",
          "Q",
          "M",
          "L",
          "I",
          "d",
          "D",
          "E",
          "i",
          "c",
          "t",
          "T",
        ]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n, r) {
            var a = function (t) {
              var e = 7 * Math.floor((t - 1) / 7);
              return ((t + r.weekStartsOn + 6) % 7) + e;
            };
            switch (e) {
              case "e":
              case "ee":
                return Gr(Jr(e.length, t), a);
              case "eo":
                return Gr(n.ordinalNumber(t, { unit: "day" }), a);
              case "eee":
                return (
                  n.day(t, { width: "abbreviated", context: "formatting" }) ||
                  n.day(t, { width: "short", context: "formatting" }) ||
                  n.day(t, { width: "narrow", context: "formatting" })
                );
              case "eeeee":
                return n.day(t, { width: "narrow", context: "formatting" });
              case "eeeeee":
                return (
                  n.day(t, { width: "short", context: "formatting" }) ||
                  n.day(t, { width: "narrow", context: "formatting" })
                );
              default:
                return (
                  n.day(t, { width: "wide", context: "formatting" }) ||
                  n.day(t, { width: "abbreviated", context: "formatting" }) ||
                  n.day(t, { width: "short", context: "formatting" }) ||
                  n.day(t, { width: "narrow", context: "formatting" })
                );
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 0 && e <= 6;
          },
        },
        {
          key: "set",
          value: function (t, e, n, r) {
            return (t = ma(t, n, r)).setUTCHours(0, 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  ya = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 90),
        u(n(t), "incompatibleTokens", [
          "y",
          "R",
          "u",
          "q",
          "Q",
          "M",
          "L",
          "I",
          "d",
          "D",
          "E",
          "i",
          "e",
          "t",
          "T",
        ]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n, r) {
            var a = function (t) {
              var e = 7 * Math.floor((t - 1) / 7);
              return ((t + r.weekStartsOn + 6) % 7) + e;
            };
            switch (e) {
              case "c":
              case "cc":
                return Gr(Jr(e.length, t), a);
              case "co":
                return Gr(n.ordinalNumber(t, { unit: "day" }), a);
              case "ccc":
                return (
                  n.day(t, { width: "abbreviated", context: "standalone" }) ||
                  n.day(t, { width: "short", context: "standalone" }) ||
                  n.day(t, { width: "narrow", context: "standalone" })
                );
              case "ccccc":
                return n.day(t, { width: "narrow", context: "standalone" });
              case "cccccc":
                return (
                  n.day(t, { width: "short", context: "standalone" }) ||
                  n.day(t, { width: "narrow", context: "standalone" })
                );
              default:
                return (
                  n.day(t, { width: "wide", context: "standalone" }) ||
                  n.day(t, { width: "abbreviated", context: "standalone" }) ||
                  n.day(t, { width: "short", context: "standalone" }) ||
                  n.day(t, { width: "narrow", context: "standalone" })
                );
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 0 && e <= 6;
          },
        },
        {
          key: "set",
          value: function (t, e, n, r) {
            return (t = ma(t, n, r)).setUTCHours(0, 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })();
var pa = (function (t) {
    r(d, br);
    var e = a(d);
    function d() {
      var t;
      o(this, d);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 90),
        u(n(t), "incompatibleTokens", [
          "y",
          "Y",
          "u",
          "q",
          "Q",
          "M",
          "L",
          "w",
          "d",
          "D",
          "E",
          "e",
          "c",
          "t",
          "T",
        ]),
        t
      );
    }
    return (
      i(d, [
        {
          key: "parse",
          value: function (t, e, n) {
            var r = function (t) {
              return 0 === t ? 7 : t;
            };
            switch (e) {
              case "i":
              case "ii":
                return Jr(e.length, t);
              case "io":
                return n.ordinalNumber(t, { unit: "day" });
              case "iii":
                return Gr(
                  n.day(t, { width: "abbreviated", context: "formatting" }) ||
                    n.day(t, { width: "short", context: "formatting" }) ||
                    n.day(t, { width: "narrow", context: "formatting" }),
                  r
                );
              case "iiiii":
                return Gr(
                  n.day(t, { width: "narrow", context: "formatting" }),
                  r
                );
              case "iiiiii":
                return Gr(
                  n.day(t, { width: "short", context: "formatting" }) ||
                    n.day(t, { width: "narrow", context: "formatting" }),
                  r
                );
              default:
                return Gr(
                  n.day(t, { width: "wide", context: "formatting" }) ||
                    n.day(t, { width: "abbreviated", context: "formatting" }) ||
                    n.day(t, { width: "short", context: "formatting" }) ||
                    n.day(t, { width: "narrow", context: "formatting" }),
                  r
                );
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 1 && e <= 7;
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return (
              (t = (function (t, e) {
                s(2, arguments);
                var n = l(e);
                n % 7 == 0 && (n -= 7);
                var r = c(t),
                  a = (((n % 7) + 7) % 7 < 1 ? 7 : 0) + n - r.getUTCDay();
                return r.setUTCDate(r.getUTCDate() + a), r;
              })(t, n)),
              t.setUTCHours(0, 0, 0, 0),
              t
            );
          },
        },
      ]),
      d
    );
  })(),
  ba = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 80),
        u(n(t), "incompatibleTokens", ["b", "B", "H", "k", "t", "T"]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "a":
              case "aa":
              case "aaa":
                return (
                  n.dayPeriod(t, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  n.dayPeriod(t, { width: "narrow", context: "formatting" })
                );
              case "aaaaa":
                return n.dayPeriod(t, {
                  width: "narrow",
                  context: "formatting",
                });
              default:
                return (
                  n.dayPeriod(t, { width: "wide", context: "formatting" }) ||
                  n.dayPeriod(t, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  n.dayPeriod(t, { width: "narrow", context: "formatting" })
                );
            }
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return t.setUTCHours(Vr(n), 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  Ta = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 80),
        u(n(t), "incompatibleTokens", ["a", "B", "H", "k", "t", "T"]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "b":
              case "bb":
              case "bbb":
                return (
                  n.dayPeriod(t, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  n.dayPeriod(t, { width: "narrow", context: "formatting" })
                );
              case "bbbbb":
                return n.dayPeriod(t, {
                  width: "narrow",
                  context: "formatting",
                });
              default:
                return (
                  n.dayPeriod(t, { width: "wide", context: "formatting" }) ||
                  n.dayPeriod(t, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  n.dayPeriod(t, { width: "narrow", context: "formatting" })
                );
            }
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return t.setUTCHours(Vr(n), 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  Da = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 80),
        u(n(t), "incompatibleTokens", ["a", "b", "t", "T"]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "B":
              case "BB":
              case "BBB":
                return (
                  n.dayPeriod(t, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  n.dayPeriod(t, { width: "narrow", context: "formatting" })
                );
              case "BBBBB":
                return n.dayPeriod(t, {
                  width: "narrow",
                  context: "formatting",
                });
              default:
                return (
                  n.dayPeriod(t, { width: "wide", context: "formatting" }) ||
                  n.dayPeriod(t, {
                    width: "abbreviated",
                    context: "formatting",
                  }) ||
                  n.dayPeriod(t, { width: "narrow", context: "formatting" })
                );
            }
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return t.setUTCHours(Vr(n), 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  Ma = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 70),
        u(n(t), "incompatibleTokens", ["H", "K", "k", "t", "T"]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "h":
                return Br(Sr, t);
              case "ho":
                return n.ordinalNumber(t, { unit: "hour" });
              default:
                return Jr(e.length, t);
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 1 && e <= 12;
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            var r = t.getUTCHours() >= 12;
            return (
              r && n < 12
                ? t.setUTCHours(n + 12, 0, 0, 0)
                : r || 12 !== n
                ? t.setUTCHours(n, 0, 0, 0)
                : t.setUTCHours(0, 0, 0, 0),
              t
            );
          },
        },
      ]),
      l
    );
  })(),
  ka = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 70),
        u(n(t), "incompatibleTokens", ["a", "b", "h", "K", "k", "t", "T"]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "H":
                return Br(Nr, t);
              case "Ho":
                return n.ordinalNumber(t, { unit: "hour" });
              default:
                return Jr(e.length, t);
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 0 && e <= 23;
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return t.setUTCHours(n, 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  Ca = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 70),
        u(n(t), "incompatibleTokens", ["h", "H", "k", "t", "T"]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "K":
                return Br(Yr, t);
              case "Ko":
                return n.ordinalNumber(t, { unit: "hour" });
              default:
                return Jr(e.length, t);
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 0 && e <= 11;
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return (
              t.getUTCHours() >= 12 && n < 12
                ? t.setUTCHours(n + 12, 0, 0, 0)
                : t.setUTCHours(n, 0, 0, 0),
              t
            );
          },
        },
      ]),
      l
    );
  })(),
  Na = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 70),
        u(n(t), "incompatibleTokens", ["a", "b", "h", "H", "K", "t", "T"]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "k":
                return Br(xr, t);
              case "ko":
                return n.ordinalNumber(t, { unit: "hour" });
              default:
                return Jr(e.length, t);
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 1 && e <= 24;
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            var r = n <= 24 ? n % 24 : n;
            return t.setUTCHours(r, 0, 0, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  xa = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 60),
        u(n(t), "incompatibleTokens", ["t", "T"]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "m":
                return Br(Ur, t);
              case "mo":
                return n.ordinalNumber(t, { unit: "minute" });
              default:
                return Jr(e.length, t);
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 0 && e <= 59;
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return t.setUTCMinutes(n, 0, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  Ya = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 50),
        u(n(t), "incompatibleTokens", ["t", "T"]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e, n) {
            switch (e) {
              case "s":
                return Br(Er, t);
              case "so":
                return n.ordinalNumber(t, { unit: "second" });
              default:
                return Jr(e.length, t);
            }
          },
        },
        {
          key: "validate",
          value: function (t, e) {
            return e >= 0 && e <= 59;
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return t.setUTCSeconds(n, 0), t;
          },
        },
      ]),
      l
    );
  })(),
  Sa = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 30),
        u(n(t), "incompatibleTokens", ["t", "T"]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e) {
            return Gr(Jr(e.length, t), function (t) {
              return Math.floor(t * Math.pow(10, 3 - e.length));
            });
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return t.setUTCMilliseconds(n), t;
          },
        },
      ]),
      l
    );
  })(),
  Ua = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 10),
        u(n(t), "incompatibleTokens", ["t", "T", "x"]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e) {
            switch (e) {
              case "X":
                return Zr(Lr, t);
              case "XX":
                return Zr(Qr, t);
              case "XXXX":
                return Zr(jr, t);
              case "XXXXX":
                return Zr(zr, t);
              default:
                return Zr(Xr, t);
            }
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return e.timestampIsSet ? t : new Date(t.getTime() - n);
          },
        },
      ]),
      l
    );
  })(),
  Ea = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 10),
        u(n(t), "incompatibleTokens", ["t", "T", "X"]),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t, e) {
            switch (e) {
              case "x":
                return Zr(Lr, t);
              case "xx":
                return Zr(Qr, t);
              case "xxxx":
                return Zr(jr, t);
              case "xxxxx":
                return Zr(zr, t);
              default:
                return Zr(Xr, t);
            }
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return e.timestampIsSet ? t : new Date(t.getTime() - n);
          },
        },
      ]),
      l
    );
  })(),
  Ha = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 40),
        u(n(t), "incompatibleTokens", "*"),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t) {
            return $r(t);
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return [new Date(1e3 * n), { timestampIsSet: !0 }];
          },
        },
      ]),
      l
    );
  })(),
  Fa = (function (t) {
    r(l, br);
    var e = a(l);
    function l() {
      var t;
      o(this, l);
      for (var r = arguments.length, a = new Array(r), i = 0; i < r; i++)
        a[i] = arguments[i];
      return (
        (t = e.call.apply(e, [this].concat(a))),
        u(n(t), "priority", 20),
        u(n(t), "incompatibleTokens", "*"),
        t
      );
    }
    return (
      i(l, [
        {
          key: "parse",
          value: function (t) {
            return $r(t);
          },
        },
        {
          key: "set",
          value: function (t, e, n) {
            return [new Date(n), { timestampIsSet: !0 }];
          },
        },
      ]),
      l
    );
  })(),
  Oa = {
    G: new Tr(),
    y: new ea(),
    Y: new na(),
    R: new ra(),
    u: new aa(),
    Q: new oa(),
    q: new ia(),
    M: new ua(),
    L: new la(),
    w: new sa(),
    I: new ca(),
    d: new va(),
    D: new ha(),
    E: new ga(),
    e: new wa(),
    c: new ya(),
    i: new pa(),
    a: new ba(),
    b: new Ta(),
    B: new Da(),
    h: new Ma(),
    H: new ka(),
    K: new Ca(),
    k: new Na(),
    m: new xa(),
    s: new Ya(),
    S: new Sa(),
    X: new Ua(),
    x: new Ea(),
    t: new Ha(),
    T: new Fa(),
  },
  Pa = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,
  Ra = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,
  qa = /^'([^]*?)'?$/,
  Wa = /''/g,
  Aa = /\S/,
  Ia = /[a-zA-Z]/;
function La(n, r, a, o) {
  var i, u, d, f, v, h, m, g, w, y, p, b, T, M, k, C, N, x;
  s(3, arguments);
  var S = String(n),
    U = String(r),
    E = D(),
    H =
      null !==
        (i =
          null !== (u = null == o ? void 0 : o.locale) && void 0 !== u
            ? u
            : E.locale) && void 0 !== i
        ? i
        : Ke;
  if (!H.match) throw new RangeError("locale must contain match property");
  var F = l(
    null !==
      (d =
        null !==
          (f =
            null !==
              (v =
                null !== (h = null == o ? void 0 : o.firstWeekContainsDate) &&
                void 0 !== h
                  ? h
                  : null == o ||
                    null === (m = o.locale) ||
                    void 0 === m ||
                    null === (g = m.options) ||
                    void 0 === g
                  ? void 0
                  : g.firstWeekContainsDate) && void 0 !== v
              ? v
              : E.firstWeekContainsDate) && void 0 !== f
          ? f
          : null === (w = E.locale) ||
            void 0 === w ||
            null === (y = w.options) ||
            void 0 === y
          ? void 0
          : y.firstWeekContainsDate) && void 0 !== d
      ? d
      : 1
  );
  if (!(F >= 1 && F <= 7))
    throw new RangeError(
      "firstWeekContainsDate must be between 1 and 7 inclusively"
    );
  var O = l(
    null !==
      (p =
        null !==
          (b =
            null !==
              (T =
                null !== (M = null == o ? void 0 : o.weekStartsOn) &&
                void 0 !== M
                  ? M
                  : null == o ||
                    null === (k = o.locale) ||
                    void 0 === k ||
                    null === (C = k.options) ||
                    void 0 === C
                  ? void 0
                  : C.weekStartsOn) && void 0 !== T
              ? T
              : E.weekStartsOn) && void 0 !== b
          ? b
          : null === (N = E.locale) ||
            void 0 === N ||
            null === (x = N.options) ||
            void 0 === x
          ? void 0
          : x.weekStartsOn) && void 0 !== p
      ? p
      : 0
  );
  if (!(O >= 0 && O <= 6))
    throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
  if ("" === U) return "" === S ? c(a) : new Date(NaN);
  var P,
    R = { firstWeekContainsDate: F, weekStartsOn: O, locale: H },
    q = [new pr()],
    W = U.match(Ra)
      .map(function (t) {
        var e = t[0];
        return e in We ? (0, We[e])(t, H.formatLong) : t;
      })
      .join("")
      .match(Pa),
    A = [],
    I = e(W);
  try {
    var L = function () {
      var t = P.value;
      (null != o && o.useAdditionalWeekYearTokens) || !Qe(t) || je(t, U, n),
        (null != o && o.useAdditionalDayOfYearTokens) || !Le(t) || je(t, U, n);
      var e = t[0],
        r = Oa[e];
      if (r) {
        var a = r.incompatibleTokens;
        if (Array.isArray(a)) {
          var i = A.find(function (t) {
            return a.includes(t.token) || t.token === e;
          });
          if (i)
            throw new RangeError(
              "The format string mustn't contain `"
                .concat(i.fullToken, "` and `")
                .concat(t, "` at the same time")
            );
        } else if ("*" === r.incompatibleTokens && A.length > 0)
          throw new RangeError(
            "The format string mustn't contain `".concat(
              t,
              "` and any other token at the same time"
            )
          );
        A.push({ token: e, fullToken: t });
        var u = r.run(S, t, H.match, R);
        if (!u) return { v: new Date(NaN) };
        q.push(u.setter), (S = u.rest);
      } else {
        if (e.match(Ia))
          throw new RangeError(
            "Format string contains an unescaped latin alphabet character `" +
              e +
              "`"
          );
        if (
          ("''" === t
            ? (t = "'")
            : "'" === e && (t = t.match(qa)[1].replace(Wa, "'")),
          0 !== S.indexOf(t))
        )
          return { v: new Date(NaN) };
        S = S.slice(t.length);
      }
    };
    for (I.s(); !(P = I.n()).done; ) {
      var Q = L();
      if ("object" === t(Q)) return Q.v;
    }
  } catch (t) {
    I.e(t);
  } finally {
    I.f();
  }
  if (S.length > 0 && Aa.test(S)) return new Date(NaN);
  var j = q
      .map(function (t) {
        return t.priority;
      })
      .sort(function (t, e) {
        return e - t;
      })
      .filter(function (t, e, n) {
        return n.indexOf(t) === e;
      })
      .map(function (t) {
        return q
          .filter(function (e) {
            return e.priority === t;
          })
          .sort(function (t, e) {
            return e.subPriority - t.subPriority;
          });
      })
      .map(function (t) {
        return t[0];
      }),
    X = c(a);
  if (isNaN(X.getTime())) return new Date(NaN);
  var z,
    G = me(X, Y(X)),
    B = {},
    Z = e(j);
  try {
    for (Z.s(); !(z = Z.n()).done; ) {
      var $ = z.value;
      if (!$.validate(G, R)) return new Date(NaN);
      var J = $.set(G, B, R);
      Array.isArray(J) ? ((G = J[0]), an(B, J[1])) : (G = J);
    }
  } catch (t) {
    Z.e(t);
  } finally {
    Z.f();
  }
  return G;
}
function Qa(t, e, n) {
  return s(2, arguments), mt(La(t, e, new Date(), n));
}
function ja(t) {
  return s(1, arguments), 1 === c(t).getDay();
}
function Xa(t) {
  return s(1, arguments), c(t).getTime() < Date.now();
}
function za(t) {
  s(1, arguments);
  var e = c(t);
  return e.setMinutes(0, 0, 0), e;
}
function Ga(t, e) {
  s(2, arguments);
  var n = za(t),
    r = za(e);
  return n.getTime() === r.getTime();
}
function Ba(t, e, n) {
  s(2, arguments);
  var r = k(t, n),
    a = k(e, n);
  return r.getTime() === a.getTime();
}
function Za(t, e) {
  return s(2, arguments), Ba(t, e, { weekStartsOn: 1 });
}
function $a(t, e) {
  s(2, arguments);
  var n = x(t),
    r = x(e);
  return n.getTime() === r.getTime();
}
function Ja(t, e) {
  s(2, arguments);
  var n = zt(t),
    r = zt(e);
  return n.getTime() === r.getTime();
}
function Ka(t, e) {
  s(2, arguments);
  var n = c(t),
    r = c(e);
  return n.getFullYear() === r.getFullYear() && n.getMonth() === r.getMonth();
}
function Va(t, e) {
  s(2, arguments);
  var n = Zt(t),
    r = Zt(e);
  return n.getTime() === r.getTime();
}
function _a(t) {
  s(1, arguments);
  var e = c(t);
  return e.setMilliseconds(0), e;
}
function to(t, e) {
  s(2, arguments);
  var n = _a(t),
    r = _a(e);
  return n.getTime() === r.getTime();
}
function eo(t, e) {
  s(2, arguments);
  var n = c(t),
    r = c(e);
  return n.getFullYear() === r.getFullYear();
}
function no(t) {
  return s(1, arguments), Ga(Date.now(), t);
}
function ro(t) {
  return s(1, arguments), Za(t, Date.now());
}
function ao(t) {
  return s(1, arguments), Ja(Date.now(), t);
}
function oo(t) {
  return s(1, arguments), Ka(Date.now(), t);
}
function io(t) {
  return s(1, arguments), Va(Date.now(), t);
}
function uo(t) {
  return s(1, arguments), to(Date.now(), t);
}
function lo(t, e) {
  return s(1, arguments), Ba(t, Date.now(), e);
}
function so(t) {
  return s(1, arguments), eo(t, Date.now());
}
function co(t) {
  return s(1, arguments), 4 === c(t).getDay();
}
function fo(t) {
  return s(1, arguments), vt(t, Date.now());
}
function vo(t) {
  return s(1, arguments), vt(t, d(Date.now(), 1));
}
function ho(t) {
  return s(1, arguments), 2 === c(t).getDay();
}
function mo(t) {
  return s(1, arguments), 3 === c(t).getDay();
}
function go(t, e) {
  s(2, arguments);
  var n = c(t).getTime(),
    r = c(e.start).getTime(),
    a = c(e.end).getTime();
  if (!(r <= a)) throw new RangeError("Invalid interval");
  return n >= r && n <= a;
}
function wo(t, e) {
  return s(2, arguments), d(t, -l(e));
}
function yo(t) {
  return s(1, arguments), vt(t, wo(Date.now(), 1));
}
function po(t) {
  s(1, arguments);
  var e = c(t),
    n = e.getFullYear(),
    r = 9 + 10 * Math.floor(n / 10);
  return e.setFullYear(r + 1, 0, 0), e.setHours(0, 0, 0, 0), e;
}
function bo(t, e) {
  var n, r, a, o, i, u, d, f;
  s(1, arguments);
  var v = D(),
    h = l(
      null !==
        (n =
          null !==
            (r =
              null !==
                (a =
                  null !== (o = null == e ? void 0 : e.weekStartsOn) &&
                  void 0 !== o
                    ? o
                    : null == e ||
                      null === (i = e.locale) ||
                      void 0 === i ||
                      null === (u = i.options) ||
                      void 0 === u
                    ? void 0
                    : u.weekStartsOn) && void 0 !== a
                ? a
                : v.weekStartsOn) && void 0 !== r
            ? r
            : null === (d = v.locale) ||
              void 0 === d ||
              null === (f = d.options) ||
              void 0 === f
            ? void 0
            : f.weekStartsOn) && void 0 !== n
        ? n
        : 0
    );
  if (!(h >= 0 && h <= 6))
    throw new RangeError("weekStartsOn must be between 0 and 6");
  var m = c(t),
    g = m.getDay(),
    w = 6 + (g < h ? -7 : 0) - (g - h);
  return m.setHours(0, 0, 0, 0), m.setDate(m.getDate() + w), m;
}
function To(t) {
  return s(1, arguments), bo(t, { weekStartsOn: 1 });
}
function Do(t) {
  s(1, arguments);
  var e = N(t),
    n = new Date(0);
  n.setFullYear(e + 1, 0, 4), n.setHours(0, 0, 0, 0);
  var r = C(n);
  return r.setDate(r.getDate() - 1), r;
}
function Mo(t) {
  s(1, arguments);
  var e = c(t),
    n = e.getMonth(),
    r = n - (n % 3) + 3;
  return e.setMonth(r, 0), e.setHours(0, 0, 0, 0), e;
}
function ko(t) {
  s(1, arguments);
  var e = c(t),
    n = e.getFullYear();
  return e.setFullYear(n + 1, 0, 0), e.setHours(0, 0, 0, 0), e;
}
var Co = /(\w)\1*|''|'(''|[^'])+('|$)|./g,
  No = /^'([^]*?)'?$/,
  xo = /''/g,
  Yo = /[a-zA-Z]/;
function So(t, e) {
  s(2, arguments);
  var n = c(t);
  if (!mt(n)) throw new RangeError("Invalid time value");
  var r = me(n, Y(n)),
    a = e.match(Co);
  return a
    ? a
        .map(function (t) {
          if ("''" === t) return "'";
          var e = t[0];
          if ("'" === e)
            return (function (t) {
              var e = t.match(No);
              if (!e) return t;
              return e[1].replace(xo, "'");
            })(t);
          var n = Ce[e];
          if (n) return n(r, t);
          if (e.match(Yo))
            throw new RangeError(
              "Format string contains an unescaped latin alphabet character `" +
                e +
                "`"
            );
          return t;
        })
        .join("")
    : "";
}
var Uo = 365.2425;
function Eo(t) {
  var e = t.years,
    n = t.months,
    r = t.weeks,
    a = t.days,
    o = t.hours,
    i = t.minutes,
    u = t.seconds;
  s(1, arguments);
  var l = 0;
  e && (l += e * Uo),
    n && (l += 30.436875 * n),
    r && (l += 7 * r),
    a && (l += a);
  var c = 24 * l * 60 * 60;
  return (
    o && (c += 60 * o * 60),
    i && (c += 60 * i),
    u && (c += u),
    Math.round(1e3 * c)
  );
}
function Ho(t) {
  s(1, arguments);
  var e = t / V;
  return Math.floor(e);
}
function Fo(t) {
  s(1, arguments);
  var e = t / K;
  return Math.floor(e);
}
function Oo(t) {
  s(1, arguments);
  var e = t / _;
  return Math.floor(e);
}
function Po(t) {
  s(1, arguments);
  var e = t / 60;
  return Math.floor(e);
}
function Ro(t) {
  return s(1, arguments), Math.floor(t * K);
}
function qo(t) {
  return s(1, arguments), Math.floor(60 * t);
}
function Wo(t) {
  s(1, arguments);
  var e = t / 3;
  return Math.floor(e);
}
function Ao(t) {
  s(1, arguments);
  var e = t / 12;
  return Math.floor(e);
}
function Io(t, e) {
  s(2, arguments);
  var n = e - En(t);
  return n <= 0 && (n += 7), d(t, n);
}
function Lo(t) {
  return s(1, arguments), Io(t, 5);
}
function Qo(t) {
  return s(1, arguments), Io(t, 1);
}
function jo(t) {
  return s(1, arguments), Io(t, 6);
}
function Xo(t) {
  return s(1, arguments), Io(t, 0);
}
function zo(t) {
  return s(1, arguments), Io(t, 4);
}
function Go(t) {
  return s(1, arguments), Io(t, 2);
}
function Bo(t) {
  return s(1, arguments), Io(t, 3);
}
function Zo(t, e) {
  var n;
  s(1, arguments);
  var r = l(
    null !== (n = null == e ? void 0 : e.additionalDigits) && void 0 !== n
      ? n
      : 2
  );
  if (2 !== r && 1 !== r && 0 !== r)
    throw new RangeError("additionalDigits must be 0, 1 or 2");
  if (
    "string" != typeof t &&
    "[object String]" !== Object.prototype.toString.call(t)
  )
    return new Date(NaN);
  var a,
    o = (function (t) {
      var e,
        n = {},
        r = t.split($o.dateTimeDelimiter);
      if (r.length > 2) return n;
      /:/.test(r[0])
        ? (e = r[0])
        : ((n.date = r[0]),
          (e = r[1]),
          $o.timeZoneDelimiter.test(n.date) &&
            ((n.date = t.split($o.timeZoneDelimiter)[0]),
            (e = t.substr(n.date.length, t.length))));
      if (e) {
        var a = $o.timezone.exec(e);
        a
          ? ((n.time = e.replace(a[1], "")), (n.timezone = a[1]))
          : (n.time = e);
      }
      return n;
    })(t);
  if (o.date) {
    var i = (function (t, e) {
      var n = new RegExp(
          "^(?:(\\d{4}|[+-]\\d{" +
            (4 + e) +
            "})|(\\d{2}|[+-]\\d{" +
            (2 + e) +
            "})$)"
        ),
        r = t.match(n);
      if (!r) return { year: NaN, restDateString: "" };
      var a = r[1] ? parseInt(r[1]) : null,
        o = r[2] ? parseInt(r[2]) : null;
      return {
        year: null === o ? a : 100 * o,
        restDateString: t.slice((r[1] || r[2]).length),
      };
    })(o.date, r);
    a = (function (t, e) {
      if (null === e) return new Date(NaN);
      var n = t.match(Jo);
      if (!n) return new Date(NaN);
      var r = !!n[4],
        a = _o(n[1]),
        o = _o(n[2]) - 1,
        i = _o(n[3]),
        u = _o(n[4]),
        l = _o(n[5]) - 1;
      if (r)
        return (function (t, e, n) {
          return e >= 1 && e <= 53 && n >= 0 && n <= 6;
        })(0, u, l)
          ? (function (t, e, n) {
              var r = new Date(0);
              r.setUTCFullYear(t, 0, 4);
              var a = r.getUTCDay() || 7,
                o = 7 * (e - 1) + n + 1 - a;
              return r.setUTCDate(r.getUTCDate() + o), r;
            })(e, u, l)
          : new Date(NaN);
      var s = new Date(0);
      return (function (t, e, n) {
        return e >= 0 && e <= 11 && n >= 1 && n <= (ei[e] || (ni(t) ? 29 : 28));
      })(e, o, i) &&
        (function (t, e) {
          return e >= 1 && e <= (ni(t) ? 366 : 365);
        })(e, a)
        ? (s.setUTCFullYear(e, o, Math.max(a, i)), s)
        : new Date(NaN);
    })(i.restDateString, i.year);
  }
  if (!a || isNaN(a.getTime())) return new Date(NaN);
  var u,
    c = a.getTime(),
    d = 0;
  if (
    o.time &&
    ((d = (function (t) {
      var e = t.match(Ko);
      if (!e) return NaN;
      var n = ti(e[1]),
        r = ti(e[2]),
        a = ti(e[3]);
      if (
        !(function (t, e, n) {
          if (24 === t) return 0 === e && 0 === n;
          return n >= 0 && n < 60 && e >= 0 && e < 60 && t >= 0 && t < 25;
        })(n, r, a)
      )
        return NaN;
      return n * V + r * K + 1e3 * a;
    })(o.time)),
    isNaN(d))
  )
    return new Date(NaN);
  if (!o.timezone) {
    var f = new Date(c + d),
      v = new Date(0);
    return (
      v.setFullYear(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate()),
      v.setHours(
        f.getUTCHours(),
        f.getUTCMinutes(),
        f.getUTCSeconds(),
        f.getUTCMilliseconds()
      ),
      v
    );
  }
  return (
    (u = (function (t) {
      if ("Z" === t) return 0;
      var e = t.match(Vo);
      if (!e) return 0;
      var n = "+" === e[1] ? -1 : 1,
        r = parseInt(e[2]),
        a = (e[3] && parseInt(e[3])) || 0;
      if (
        !(function (t, e) {
          return e >= 0 && e <= 59;
        })(0, a)
      )
        return NaN;
      return n * (r * V + a * K);
    })(o.timezone)),
    isNaN(u) ? new Date(NaN) : new Date(c + d + u)
  );
}
var $o = {
    dateTimeDelimiter: /[T ]/,
    timeZoneDelimiter: /[Z ]/i,
    timezone: /([Z+-].*)$/,
  },
  Jo = /^-?(?:(\d{3})|(\d{2})(?:-?(\d{2}))?|W(\d{2})(?:-?(\d{1}))?|)$/,
  Ko =
    /^(\d{2}(?:[.,]\d*)?)(?::?(\d{2}(?:[.,]\d*)?))?(?::?(\d{2}(?:[.,]\d*)?))?$/,
  Vo = /^([+-])(\d{2})(?::?(\d{2}))?$/;
function _o(t) {
  return t ? parseInt(t) : 1;
}
function ti(t) {
  return (t && parseFloat(t.replace(",", "."))) || 0;
}
var ei = [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function ni(t) {
  return t % 400 == 0 || (t % 4 == 0 && t % 100 != 0);
}
function ri(t) {
  if ((s(1, arguments), "string" == typeof t)) {
    var e = t.match(
      /(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{0,7}))?(?:Z|(.)(\d{2}):?(\d{2})?)?/
    );
    return e
      ? new Date(
          Date.UTC(
            +e[1],
            +e[2] - 1,
            +e[3],
            +e[4] - (+e[9] || 0) * ("-" == e[8] ? -1 : 1),
            +e[5] - (+e[10] || 0) * ("-" == e[8] ? -1 : 1),
            +e[6],
            +((e[7] || "0") + "00").substring(0, 3)
          )
        )
      : new Date(NaN);
  }
  return c(t);
}
function ai(t, e) {
  s(2, arguments);
  var n = En(t) - e;
  return n <= 0 && (n += 7), wo(t, n);
}
function oi(t) {
  return s(1, arguments), ai(t, 5);
}
function ii(t) {
  return s(1, arguments), ai(t, 1);
}
function ui(t) {
  return s(1, arguments), ai(t, 6);
}
function li(t) {
  return s(1, arguments), ai(t, 0);
}
function si(t) {
  return s(1, arguments), ai(t, 4);
}
function ci(t) {
  return s(1, arguments), ai(t, 2);
}
function di(t) {
  return s(1, arguments), ai(t, 3);
}
function fi(t) {
  return s(1, arguments), Math.floor(3 * t);
}
function vi(t) {
  s(1, arguments);
  var e = t / 4;
  return Math.floor(e);
}
function hi(t, e) {
  var n;
  if (arguments.length < 1)
    throw new TypeError("1 argument required, but only none provided present");
  var r = l(
    null !== (n = null == e ? void 0 : e.nearestTo) && void 0 !== n ? n : 1
  );
  if (r < 1 || r > 30)
    throw new RangeError("`options.nearestTo` must be between 1 and 30");
  var a = c(t),
    o = a.getSeconds(),
    i = a.getMinutes() + o / 60,
    u = Ut(null == e ? void 0 : e.roundingMethod)(i / r) * r,
    s = i % r,
    d = Math.round(s / r) * r;
  return new Date(
    a.getFullYear(),
    a.getMonth(),
    a.getDate(),
    a.getHours(),
    u + d
  );
}
function mi(t) {
  s(1, arguments);
  var e = t / ot;
  return Math.floor(e);
}
function gi(t) {
  return s(1, arguments), t * _;
}
function wi(t) {
  s(1, arguments);
  var e = t / 60;
  return Math.floor(e);
}
function yi(t, e) {
  s(2, arguments);
  var n = c(t),
    r = l(e),
    a = n.getFullYear(),
    o = n.getDate(),
    i = new Date(0);
  i.setFullYear(a, r, 15), i.setHours(0, 0, 0, 0);
  var u = Fn(i);
  return n.setMonth(r, Math.min(o, u)), n;
}
function pi(e, n) {
  if ((s(2, arguments), "object" !== t(n) || null === n))
    throw new RangeError("values parameter must be an object");
  var r = c(e);
  return isNaN(r.getTime())
    ? new Date(NaN)
    : (null != n.year && r.setFullYear(n.year),
      null != n.month && (r = yi(r, n.month)),
      null != n.date && r.setDate(l(n.date)),
      null != n.hours && r.setHours(l(n.hours)),
      null != n.minutes && r.setMinutes(l(n.minutes)),
      null != n.seconds && r.setSeconds(l(n.seconds)),
      null != n.milliseconds && r.setMilliseconds(l(n.milliseconds)),
      r);
}
function bi(t, e) {
  s(2, arguments);
  var n = c(t),
    r = l(e);
  return n.setDate(r), n;
}
function Ti(t, e, n) {
  var r, a, o, i, u, f, v, h;
  s(2, arguments);
  var m = D(),
    g = l(
      null !==
        (r =
          null !==
            (a =
              null !==
                (o =
                  null !== (i = null == n ? void 0 : n.weekStartsOn) &&
                  void 0 !== i
                    ? i
                    : null == n ||
                      null === (u = n.locale) ||
                      void 0 === u ||
                      null === (f = u.options) ||
                      void 0 === f
                    ? void 0
                    : f.weekStartsOn) && void 0 !== o
                ? o
                : m.weekStartsOn) && void 0 !== a
            ? a
            : null === (v = m.locale) ||
              void 0 === v ||
              null === (h = v.options) ||
              void 0 === h
            ? void 0
            : h.weekStartsOn) && void 0 !== r
        ? r
        : 0
    );
  if (!(g >= 0 && g <= 6))
    throw new RangeError("weekStartsOn must be between 0 and 6 inclusively");
  var w = c(t),
    y = l(e),
    p = w.getDay(),
    b = 7 - g;
  return d(
    w,
    y < 0 || y > 6
      ? y - ((p + b) % 7)
      : (((((y % 7) + 7) % 7) + b) % 7) - ((p + b) % 7)
  );
}
function Di(t, e) {
  s(2, arguments);
  var n = c(t),
    r = l(e);
  return n.setMonth(0), n.setDate(r), n;
}
function Mi(t) {
  s(1, arguments);
  var e = {},
    n = D();
  for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
  for (var a in t)
    Object.prototype.hasOwnProperty.call(t, a) &&
      (void 0 === t[a] ? delete e[a] : (e[a] = t[a]));
  M(e);
}
function ki(t, e) {
  s(2, arguments);
  var n = c(t),
    r = l(e);
  return n.setHours(r), n;
}
function Ci(t, e) {
  s(2, arguments);
  var n = c(t);
  return d(n, l(e) - An(n));
}
function Ni(t, e) {
  s(2, arguments);
  var n = c(t),
    r = l(e),
    a = Ln(n) - r;
  return n.setDate(n.getDate() - 7 * a), n;
}
function xi(t, e) {
  s(2, arguments);
  var n = c(t),
    r = l(e);
  return n.setMilliseconds(r), n;
}
function Yi(t, e) {
  s(2, arguments);
  var n = c(t),
    r = l(e);
  return n.setMinutes(r), n;
}
function Si(t, e) {
  s(2, arguments);
  var n = c(t),
    r = l(e) - (Math.floor(n.getMonth() / 3) + 1);
  return yi(n, n.getMonth() + 3 * r);
}
function Ui(t, e) {
  s(2, arguments);
  var n = c(t),
    r = l(e);
  return n.setSeconds(r), n;
}
function Ei(t, e, n) {
  s(2, arguments);
  var r = c(t),
    a = l(e),
    o = _n(r, n) - a;
  return r.setDate(r.getDate() - 7 * o), r;
}
function Hi(t, e, n) {
  var r, a, o, i, u, d, f, v;
  s(2, arguments);
  var h = D(),
    m = l(
      null !==
        (r =
          null !==
            (a =
              null !==
                (o =
                  null !== (i = null == n ? void 0 : n.firstWeekContainsDate) &&
                  void 0 !== i
                    ? i
                    : null == n ||
                      null === (u = n.locale) ||
                      void 0 === u ||
                      null === (d = u.options) ||
                      void 0 === d
                    ? void 0
                    : d.firstWeekContainsDate) && void 0 !== o
                ? o
                : h.firstWeekContainsDate) && void 0 !== a
            ? a
            : null === (f = h.locale) ||
              void 0 === f ||
              null === (v = f.options) ||
              void 0 === v
            ? void 0
            : v.firstWeekContainsDate) && void 0 !== r
        ? r
        : 1
    ),
    g = c(t),
    w = l(e),
    y = E(g, Kn(g, n)),
    p = new Date(0);
  return (
    p.setFullYear(w, 0, m),
    p.setHours(0, 0, 0, 0),
    (g = Kn(p, n)).setDate(g.getDate() + y),
    g
  );
}
function Fi(t, e) {
  s(2, arguments);
  var n = c(t),
    r = l(e);
  return isNaN(n.getTime()) ? new Date(NaN) : (n.setFullYear(r), n);
}
function Oi(t) {
  s(1, arguments);
  var e = c(t),
    n = e.getFullYear(),
    r = 10 * Math.floor(n / 10);
  return e.setFullYear(r, 0, 1), e.setHours(0, 0, 0, 0), e;
}
function Pi() {
  return S(Date.now());
}
function Ri() {
  var t = new Date(),
    e = t.getFullYear(),
    n = t.getMonth(),
    r = t.getDate(),
    a = new Date(0);
  return a.setFullYear(e, n, r + 1), a.setHours(0, 0, 0, 0), a;
}
function qi() {
  var t = new Date(),
    e = t.getFullYear(),
    n = t.getMonth(),
    r = t.getDate(),
    a = new Date(0);
  return a.setFullYear(e, n, r - 1), a.setHours(0, 0, 0, 0), a;
}
function Wi(t, e) {
  return s(2, arguments), f(t, -l(e));
}
function Ai(e, n) {
  if ((s(2, arguments), !n || "object" !== t(n))) return new Date(NaN);
  var r = n.years ? l(n.years) : 0,
    a = n.months ? l(n.months) : 0,
    o = n.weeks ? l(n.weeks) : 0,
    i = n.days ? l(n.days) : 0,
    u = n.hours ? l(n.hours) : 0,
    c = n.minutes ? l(n.minutes) : 0,
    d = n.seconds ? l(n.seconds) : 0,
    f = wo(Wi(e, a + 12 * r), i + 7 * o),
    v = 1e3 * (d + 60 * (c + 60 * u));
  return new Date(f.getTime() - v);
}
function Ii(t, e) {
  return s(2, arguments), w(t, -l(e));
}
function Li(t, e) {
  return s(2, arguments), b(t, -l(e));
}
function Qi(t, e) {
  return s(2, arguments), P(t, -l(e));
}
function ji(t, e) {
  return s(2, arguments), R(t, -l(e));
}
function Xi(t, e) {
  return s(2, arguments), q(t, -l(e));
}
function zi(t, e) {
  return s(2, arguments), W(t, -l(e));
}
function Gi(t, e) {
  return s(2, arguments), A(t, -l(e));
}
function Bi(t) {
  return s(1, arguments), Math.floor(7 * t);
}
function Zi(t) {
  return s(1, arguments), Math.floor(12 * t);
}
function $i(t) {
  return s(1, arguments), Math.floor(4 * t);
}
export {
  v as add,
  w as addBusinessDays,
  d as addDays,
  b as addHours,
  F as addISOWeekYears,
  y as addMilliseconds,
  P as addMinutes,
  f as addMonths,
  R as addQuarters,
  q as addSeconds,
  W as addWeeks,
  A as addYears,
  I as areIntervalsOverlapping,
  j as clamp,
  X as closestIndexTo,
  z as closestTo,
  G as compareAsc,
  B as compareDesc,
  Z as daysInWeek,
  $ as daysInYear,
  ft as daysToWeeks,
  gt as differenceInBusinessDays,
  E as differenceInCalendarDays,
  wt as differenceInCalendarISOWeekYears,
  yt as differenceInCalendarISOWeeks,
  pt as differenceInCalendarMonths,
  Tt as differenceInCalendarQuarters,
  Mt as differenceInCalendarWeeks,
  kt as differenceInCalendarYears,
  Nt as differenceInDays,
  Et as differenceInHours,
  Ft as differenceInISOWeekYears,
  xt as differenceInMilliseconds,
  Ot as differenceInMinutes,
  Wt as differenceInMonths,
  At as differenceInQuarters,
  It as differenceInSeconds,
  Lt as differenceInWeeks,
  Qt as differenceInYears,
  jt as eachDayOfInterval,
  Xt as eachHourOfInterval,
  Gt as eachMinuteOfInterval,
  Bt as eachMonthOfInterval,
  $t as eachQuarterOfInterval,
  Jt as eachWeekOfInterval,
  Kt as eachWeekendOfInterval,
  _t as eachWeekendOfMonth,
  ne as eachWeekendOfYear,
  re as eachYearOfInterval,
  Pt as endOfDay,
  ae as endOfDecade,
  oe as endOfHour,
  ue as endOfISOWeek,
  le as endOfISOWeekYear,
  se as endOfMinute,
  Rt as endOfMonth,
  ce as endOfQuarter,
  de as endOfSecond,
  fe as endOfToday,
  ve as endOfTomorrow,
  ie as endOfWeek,
  te as endOfYear,
  he as endOfYesterday,
  rn as format,
  dn as formatDistance,
  gn as formatDistanceStrict,
  wn as formatDistanceToNow,
  yn as formatDistanceToNowStrict,
  bn as formatDuration,
  Tn as formatISO,
  Dn as formatISO9075,
  Mn as formatISODuration,
  kn as formatRFC3339,
  xn as formatRFC7231,
  Yn as formatRelative,
  Sn as fromUnixTime,
  Un as getDate,
  En as getDay,
  Hn as getDayOfYear,
  Fn as getDaysInMonth,
  Pn as getDaysInYear,
  Rn as getDecade,
  qn as getDefaultOptions,
  Wn as getHours,
  An as getISODay,
  Ln as getISOWeek,
  N as getISOWeekYear,
  Qn as getISOWeeksInYear,
  jn as getMilliseconds,
  Xn as getMinutes,
  zn as getMonth,
  Gn as getOverlappingDaysInIntervals,
  bt as getQuarter,
  Bn as getSeconds,
  Zn as getTime,
  $n as getUnixTime,
  _n as getWeek,
  tr as getWeekOfMonth,
  Jn as getWeekYear,
  nr as getWeeksInMonth,
  rr as getYear,
  ar as hoursToMilliseconds,
  or as hoursToMinutes,
  ir as hoursToSeconds,
  ur as intervalToDuration,
  lr as intlFormat,
  sr as intlFormatDistance,
  cr as isAfter,
  dr as isBefore,
  ht as isDate,
  fr as isEqual,
  vr as isExists,
  hr as isFirstDayOfMonth,
  mr as isFriday,
  gr as isFuture,
  qt as isLastDayOfMonth,
  On as isLeapYear,
  Qa as isMatch,
  ja as isMonday,
  Xa as isPast,
  vt as isSameDay,
  Ga as isSameHour,
  Za as isSameISOWeek,
  $a as isSameISOWeekYear,
  Ja as isSameMinute,
  Ka as isSameMonth,
  Va as isSameQuarter,
  to as isSameSecond,
  Ba as isSameWeek,
  eo as isSameYear,
  g as isSaturday,
  m as isSunday,
  no as isThisHour,
  ro as isThisISOWeek,
  ao as isThisMinute,
  oo as isThisMonth,
  io as isThisQuarter,
  uo as isThisSecond,
  lo as isThisWeek,
  so as isThisYear,
  co as isThursday,
  fo as isToday,
  vo as isTomorrow,
  ho as isTuesday,
  mt as isValid,
  mo as isWednesday,
  h as isWeekend,
  go as isWithinInterval,
  yo as isYesterday,
  po as lastDayOfDecade,
  To as lastDayOfISOWeek,
  Do as lastDayOfISOWeekYear,
  er as lastDayOfMonth,
  Mo as lastDayOfQuarter,
  bo as lastDayOfWeek,
  ko as lastDayOfYear,
  So as lightFormat,
  L as max,
  J as maxTime,
  Eo as milliseconds,
  V as millisecondsInHour,
  K as millisecondsInMinute,
  _ as millisecondsInSecond,
  Ho as millisecondsToHours,
  Fo as millisecondsToMinutes,
  Oo as millisecondsToSeconds,
  Q as min,
  tt as minTime,
  et as minutesInHour,
  Po as minutesToHours,
  Ro as minutesToMilliseconds,
  qo as minutesToSeconds,
  nt as monthsInQuarter,
  rt as monthsInYear,
  Wo as monthsToQuarters,
  Ao as monthsToYears,
  Io as nextDay,
  Lo as nextFriday,
  Qo as nextMonday,
  jo as nextSaturday,
  Xo as nextSunday,
  zo as nextThursday,
  Go as nextTuesday,
  Bo as nextWednesday,
  La as parse,
  Zo as parseISO,
  ri as parseJSON,
  ai as previousDay,
  oi as previousFriday,
  ii as previousMonday,
  ui as previousSaturday,
  li as previousSunday,
  si as previousThursday,
  ci as previousTuesday,
  di as previousWednesday,
  at as quartersInYear,
  fi as quartersToMonths,
  vi as quartersToYears,
  hi as roundToNearestMinutes,
  ut as secondsInDay,
  ot as secondsInHour,
  it as secondsInMinute,
  ct as secondsInMonth,
  dt as secondsInQuarter,
  lt as secondsInWeek,
  st as secondsInYear,
  mi as secondsToHours,
  gi as secondsToMilliseconds,
  wi as secondsToMinutes,
  pi as set,
  bi as setDate,
  Ti as setDay,
  Di as setDayOfYear,
  Mi as setDefaultOptions,
  ki as setHours,
  Ci as setISODay,
  Ni as setISOWeek,
  H as setISOWeekYear,
  xi as setMilliseconds,
  Yi as setMinutes,
  yi as setMonth,
  Si as setQuarter,
  Ui as setSeconds,
  Ei as setWeek,
  Hi as setWeekYear,
  Fi as setYear,
  S as startOfDay,
  Oi as startOfDecade,
  za as startOfHour,
  C as startOfISOWeek,
  x as startOfISOWeekYear,
  zt as startOfMinute,
  Vt as startOfMonth,
  Zt as startOfQuarter,
  _a as startOfSecond,
  Pi as startOfToday,
  Ri as startOfTomorrow,
  k as startOfWeek,
  Kn as startOfWeekYear,
  ee as startOfYear,
  qi as startOfYesterday,
  Ai as sub,
  Ii as subBusinessDays,
  wo as subDays,
  Li as subHours,
  Ht as subISOWeekYears,
  me as subMilliseconds,
  Qi as subMinutes,
  Wi as subMonths,
  ji as subQuarters,
  Xi as subSeconds,
  zi as subWeeks,
  Gi as subYears,
  c as toDate,
  Bi as weeksToDays,
  Zi as yearsToMonths,
  $i as yearsToQuarters,
};
export default null;
//# sourceMappingURL=/sm/ebef220189641fd7a76fcbc30ce471d82bcd80520e4ac594c3237bd25e7c517e.map
