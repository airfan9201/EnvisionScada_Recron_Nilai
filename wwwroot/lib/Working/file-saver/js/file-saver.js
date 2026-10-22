/**
 * Bundled by jsDelivr using Rollup v2.79.1 and Terser v5.19.2.
 * Original file: /npm/file-saver@2.0.5/dist/FileSaver.min.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
var e,
  t =
    "undefined" != typeof globalThis
      ? globalThis
      : "undefined" != typeof window
      ? window
      : "undefined" != typeof global
      ? global
      : "undefined" != typeof self
      ? self
      : {},
  n = { exports: {} };
(e = n),
  (function () {
    function n(e, t) {
      return (
        void 0 === t
          ? (t = { autoBom: !1 })
          : "object" != typeof t &&
            (console.warn("Deprecated: Expected third argument to be a object"),
            (t = { autoBom: !t })),
        t.autoBom &&
        /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(
          e.type
        )
          ? new Blob(["\ufeff", e], { type: e.type })
          : e
      );
    }
    function o(e, t, n) {
      var o = new XMLHttpRequest();
      o.open("GET", e),
        (o.responseType = "blob"),
        (o.onload = function () {
          l(o.response, t, n);
        }),
        (o.onerror = function () {
          console.error("could not download file");
        }),
        o.send();
    }
    function a(e) {
      var t = new XMLHttpRequest();
      t.open("HEAD", e, !1);
      try {
        t.send();
      } catch (e) {}
      return 200 <= t.status && 299 >= t.status;
    }
    function i(e) {
      try {
        e.dispatchEvent(new MouseEvent("click"));
      } catch (n) {
        var t = document.createEvent("MouseEvents");
        t.initMouseEvent(
          "click",
          !0,
          !0,
          window,
          0,
          0,
          0,
          80,
          20,
          !1,
          !1,
          !1,
          !1,
          0,
          null
        ),
          e.dispatchEvent(t);
      }
    }
    var r =
        "object" == typeof window && window.window === window
          ? window
          : "object" == typeof self && self.self === self
          ? self
          : "object" == typeof t && t.global === t
          ? t
          : void 0,
      s =
        r.navigator &&
        /Macintosh/.test(navigator.userAgent) &&
        /AppleWebKit/.test(navigator.userAgent) &&
        !/Safari/.test(navigator.userAgent),
      l =
        r.saveAs ||
        ("object" != typeof window || window !== r
          ? function () {}
          : "download" in HTMLAnchorElement.prototype && !s
          ? function (e, t, n) {
              var s = r.URL || r.webkitURL,
                l = document.createElement("a");
              (t = t || e.name || "download"),
                (l.download = t),
                (l.rel = "noopener"),
                "string" == typeof e
                  ? ((l.href = e),
                    l.origin === location.origin
                      ? i(l)
                      : a(l.href)
                      ? o(e, t, n)
                      : i(l, (l.target = "_blank")))
                  : ((l.href = s.createObjectURL(e)),
                    setTimeout(function () {
                      s.revokeObjectURL(l.href);
                    }, 4e4),
                    setTimeout(function () {
                      i(l);
                    }, 0));
            }
          : "msSaveOrOpenBlob" in navigator
          ? function (e, t, r) {
              if (((t = t || e.name || "download"), "string" != typeof e))
                navigator.msSaveOrOpenBlob(n(e, r), t);
              else if (a(e)) o(e, t, r);
              else {
                var s = document.createElement("a");
                (s.href = e),
                  (s.target = "_blank"),
                  setTimeout(function () {
                    i(s);
                  });
              }
            }
          : function (e, t, n, a) {
              if (
                ((a = a || open("", "_blank")) &&
                  (a.document.title = a.document.body.innerText =
                    "downloading..."),
                "string" == typeof e)
              )
                return o(e, t, n);
              var i = "application/octet-stream" === e.type,
                l = /constructor/i.test(r.HTMLElement) || r.safari,
                c = /CriOS\/[\d]+/.test(navigator.userAgent);
              if ((c || (i && l) || s) && "undefined" != typeof FileReader) {
                var f = new FileReader();
                (f.onloadend = function () {
                  var e = f.result;
                  (e = c
                    ? e
                    : e.replace(/^data:[^;]*;/, "data:attachment/file;")),
                    a ? (a.location.href = e) : (location = e),
                    (a = null);
                }),
                  f.readAsDataURL(e);
              } else {
                var d = r.URL || r.webkitURL,
                  u = d.createObjectURL(e);
                a ? (a.location = u) : (location.href = u),
                  (a = null),
                  setTimeout(function () {
                    d.revokeObjectURL(u);
                  }, 4e4);
              }
            });
    (r.saveAs = l.saveAs = l), (e.exports = l);
  })();
var o = n.exports;
export { o as default };
//# sourceMappingURL=/sm/f629b7868f4c63b29e50fa895e9e6c358323c31060e93f1275c0d1fcbb22abfd.map
