# envision_report - ENVISION Report Designer render engine.
#
# Ships WITH the application: this file lives in the repository's SystemPythonLibraries
# folder (system libraries, not user libraries), is copied next to the binaries at build
# time, and PythonScriptEngine puts <output>/SystemPythonLibraries on sys.path at init.
# It must NOT live in the content-root PythonLibraries folder - that folder is
# project-owned (cleared by ResetProjectDirectories and replaced by project transfers).
#
# A report's generated runner script is:
#
#     import envision_report
#     envision_report.run("ReportName")
#
# run() loads the report template and its output folder (Reports.TemplateJson and
# Reports.OutputPath in Configuration.db, read-only),
# resolves the report period, executes the optional hook Module script, renders a PDF via
# fpdf and - when the template is Excel compatible - an .xlsx via openpyxl, writing both
# into <project>/Reports/. Produced files are picked up by the script engine's preview
# write-recorder on manual runs.
#
# Dependencies: fpdf (1.7.x) and openpyxl, both plain-Python and offline. Charts are drawn
# with fpdf primitives (PDF) and native openpyxl charts (Excel) - no matplotlib required.

import datetime as _dt
import importlib
import json
import math as _math
import os
import re
import sqlite3

from envision import GetStringValue, _env_path

# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------

_TOKEN_RE = re.compile(r"\{([A-Za-z0-9_.\- ]+)\}")
# Inline expression: {= <python expression> }. Braces may not appear inside, which is what
# keeps a plain {Token} and an expression unambiguous (and rules out dict/set literals).
# _TOKEN_RE cannot match this form because its character class excludes "=".
_EXPR_RE = re.compile(r"\{=([^{}]*)\}")


# Common typography that latin-1 cannot hold, mapped to a readable equivalent instead of
# '?'. Genuinely non-latin text (Greek, Cyrillic, CJK) still degrades to '?' - a unicode
# TTF font is the only real fix for those, and fpdf's core fonts do not carry one.
_LATIN1_FALLBACK = {
    "–": "-", "—": "-", "―": "-",            # en/em/horizontal dashes
    "‘": "'", "’": "'", "‚": "'",            # curly single quotes
    "“": '"', "”": '"', "„": '"',            # curly double quotes
    "…": "...", " ": " ", "•": "-",          # ellipsis, nbsp, bullet
    "€": "EUR", "™": "TM",                        # euro, trademark
    "≤": "<=", "≥": ">=", "≠": "!=",         # comparisons
    "×": "x", "−": "-", "→": "->", "←": "<-",
}
_LATIN1_TABLE = str.maketrans(_LATIN1_FALLBACK)


def _latin1(s):
    """fpdf 1.7 core fonts are latin-1 only; degrade anything else readably."""
    return str(s).translate(_LATIN1_TABLE).encode("latin-1", "replace").decode("latin-1")


def _num(value):
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    # A stored "NaN"/"Infinity" sample would otherwise poison chart scaling into literal
    # "nan" PDF operators and make Excel prompt to repair the file; treat it as missing.
    return n if _math.isfinite(n) else None


def _fmt(value, spec):
    """Apply a Python format spec to numeric values; fall back to str()."""
    n = _num(value)
    if n is None:
        return "" if value is None else str(value)
    if not spec:
        # Default: trim trailing zeros of a sensible fixed format.
        text = ("%.3f" % n).rstrip("0").rstrip(".")
        return text if text else "0"
    try:
        return format(n, spec)
    except (ValueError, TypeError):
        return str(value)


def _hex_rgb(color, default=(37, 150, 190)):
    try:
        c = (color or "").lstrip("#")
        if len(c) == 6:
            return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16))
    except ValueError:
        pass
    return default


def _utc_text(dt_local):
    """Local datetime -> the UTC 'YYYY-MM-DD HH:MM:SS' text the historian stores."""
    return dt_local.astimezone(_dt.timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def _open_ro(path):
    # Percent-encode the path: an install folder containing '#' or '%' would otherwise be
    # cut short by SQLite's URI parser and every historian/project open would fail.
    import urllib.parse
    quoted = urllib.parse.quote(path.replace("\\", "/"), safe="/:")
    return sqlite3.connect("file:%s?mode=ro" % quoted, uri=True)


def _utc_to_local_text(ts_text):
    """Historian UTC 'YYYY-MM-DD HH:MM:SS[.fffffff]' -> local text; verbatim on failure."""
    text = str(ts_text or "")
    try:
        ts_utc = _dt.datetime.strptime(text[:19], "%Y-%m-%d %H:%M:%S").replace(tzinfo=_dt.timezone.utc)
        return ts_utc.astimezone().strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return text


# Row caps for table sources. A missing/zero value falls back to the template default; a
# negative value would reach SQLite as "LIMIT -5", which means NO limit and lets one table
# component render an unbounded historian into the PDF. The upper cap bounds a mistyped
# huge value the same way.
_MAX_ROWS_CAP = 10000


def _clamp_rows(max_rows, default=200):
    try:
        n = int(max_rows)
    except (TypeError, ValueError):
        n = default
    if n <= 0:
        n = default
    return min(n, _MAX_ROWS_CAP)


def _sniff_image(path):
    """(format, width, height, png_color_type) read from the file's magic bytes.

    Pure Python on purpose: Pillow is optional (a compiled extension that is not
    vendored), and without dimensions the image cursor advance was a guess that made
    the next component overprint tall images. Returns (None, None, None, None) when
    the format is not recognized."""
    try:
        with open(path, "rb") as f:
            head = f.read(32)
            if head[:8] == b"\x89PNG\r\n\x1a\n" and len(head) >= 26:
                w = int.from_bytes(head[16:20], "big")
                h = int.from_bytes(head[20:24], "big")
                return "PNG", w, h, head[25]
            if head[:3] == b"GIF" and len(head) >= 10:
                w = int.from_bytes(head[6:8], "little")
                h = int.from_bytes(head[8:10], "little")
                return "GIF", w, h, None
            if head[:2] == b"\xff\xd8":
                f.seek(2)
                while True:
                    marker = f.read(2)
                    if len(marker) < 2 or marker[0] != 0xFF:
                        break
                    code = marker[1]
                    if code == 0xD8 or code == 0x01 or 0xD0 <= code <= 0xD7:
                        continue
                    length = int.from_bytes(f.read(2), "big")
                    if length < 2:
                        break
                    if 0xC0 <= code <= 0xCF and code not in (0xC4, 0xC8, 0xCC):
                        data = f.read(5)
                        if len(data) == 5:
                            h = int.from_bytes(data[1:3], "big")
                            w = int.from_bytes(data[3:5], "big")
                            return "JPEG", w, h, None
                        break
                    f.seek(length - 2, 1)
    except Exception:
        pass
    return None, None, None, None


# ---------------------------------------------------------------------------
# Context
# ---------------------------------------------------------------------------

class ReportContext(dict):
    """dict for hook-computed {Expr.*} values, plus period/report/parameter attributes."""

    def __init__(self, name, template, start_local, end_local, params=None):
        super().__init__()
        self.name = name
        self.template = template
        self.period_start = start_local
        self.period_end = end_local
        # Per-run parameters: template defaults overridden by the caller's values.
        self.params = dict(params or {})

    @property
    def period(self):
        return (self.period_start, self.period_end)


_PRESETS = {
    "yesterday": lambda now: (now.replace(hour=0, minute=0, second=0, microsecond=0) - _dt.timedelta(days=1),
                              now.replace(hour=0, minute=0, second=0, microsecond=0)),
    "today": lambda now: (now.replace(hour=0, minute=0, second=0, microsecond=0), now),
    "last24h": lambda now: (now - _dt.timedelta(hours=24), now),
    "last7days": lambda now: (now - _dt.timedelta(days=7), now),
    "last30days": lambda now: (now - _dt.timedelta(days=30), now),
    "thismonth": lambda now: (now.replace(day=1, hour=0, minute=0, second=0, microsecond=0), now),
    "lastmonth": lambda now: ((now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - _dt.timedelta(days=1)).replace(day=1),
                              now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)),
}


def _parse_dt(text):
    text = str(text).strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return _dt.datetime.strptime(text, fmt).astimezone()
        except ValueError:
            continue
    raise ValueError("Cannot parse period timestamp '%s' (expected YYYY-MM-DD HH:MM:SS)" % text)


def _resolve_period(template, period_start=None, period_end=None):
    """Template period -> (start_local, end_local). Explicit arguments win (reruns)."""
    if period_start and period_end:
        return _parse_dt(period_start), _parse_dt(period_end)

    period = template.get("period") or {}
    source = (period.get("source") or "preset").lower()

    if source == "variables":
        start = _parse_dt(GetStringValue(period.get("startVariable")))
        end = _parse_dt(GetStringValue(period.get("endVariable")))
        return start, end

    # The presets work on a NAIVE local now and each boundary is localized on its own:
    # .astimezone() on a naive datetime resolves that date's UTC offset, so "yesterday"
    # still starts at local midnight on the two DST changeover days (a fixed-offset now
    # carried today's offset into yesterday's midnight, one hour off).
    now = _dt.datetime.now()
    preset = (period.get("preset") or "yesterday").lower()
    builder = _PRESETS.get(preset) or _PRESETS["yesterday"]
    start, end = builder(now)
    return start.astimezone(), end.astimezone()


# ---------------------------------------------------------------------------
# Data access
# ---------------------------------------------------------------------------

def hist_agg(variable, agg, start_local, end_local):
    """Aggregate CAST(Value AS REAL) over the period. agg: sum|avg|min|max|count|delta.

    Since schema v74 the historian stores the FULL canonical variable name in one
    Variable column (no Device column); queries match on the name verbatim."""
    agg = (agg or "avg").lower()
    con = _open_ro(_env_path("historian"))
    try:
        cur = con.cursor()
        base = ("FROM HistoricData WHERE Variable = ? "
                "AND TimeStamp >= ? AND TimeStamp < ?")
        args = (str(variable).strip(), _utc_text(start_local), _utc_text(end_local))
        if agg == "delta":
            cur.execute("SELECT Value " + base + " ORDER BY TimeStamp ASC LIMIT 1", args)
            first = cur.fetchone()
            cur.execute("SELECT Value " + base + " ORDER BY TimeStamp DESC LIMIT 1", args)
            last = cur.fetchone()
            if not first or not last:
                return None
            a, b = _num(first[0]), _num(last[0])
            return None if a is None or b is None else b - a
        if agg == "count":
            cur.execute("SELECT COUNT(*) " + base, args)
            return cur.fetchone()[0]
        sql_agg = {"sum": "SUM", "avg": "AVG", "min": "MIN", "max": "MAX"}.get(agg, "AVG")
        cur.execute("SELECT %s(CAST(Value AS REAL)) %s" % (sql_agg, base), args)
        row = cur.fetchone()
        return row[0] if row else None
    finally:
        con.close()


_RESAMPLE_SECONDS = {"15m": 900, "1h": 3600, "1d": 86400}


def hist_series(variable, start_local, end_local, resample="1h"):
    """[(bucket_start_local, avg_value), ...] over the period; raw returns each sample."""
    con = _open_ro(_env_path("historian"))
    try:
        cur = con.cursor()
        cur.execute(
            "SELECT TimeStamp, Value FROM HistoricData WHERE Variable = ? "
            "AND TimeStamp >= ? AND TimeStamp < ? ORDER BY TimeStamp ASC",
            (str(variable).strip(), _utc_text(start_local), _utc_text(end_local)))
        rows = cur.fetchall()
    finally:
        con.close()

    points = []
    for ts_text, value in rows:
        n = _num(value)
        if n is None:
            continue
        ts = str(ts_text)[:19]
        try:
            ts_utc = _dt.datetime.strptime(ts, "%Y-%m-%d %H:%M:%S").replace(tzinfo=_dt.timezone.utc)
        except ValueError:
            continue
        points.append((ts_utc.astimezone(), n))

    seconds = _RESAMPLE_SECONDS.get((resample or "raw").lower())
    if not seconds or not points:
        return points

    buckets = {}
    if seconds == 86400:
        # Daily buckets align to LOCAL midnight, not the UTC day: epoch-floored "daily"
        # averages on a UTC+2 site covered 02:00-02:00 and shifted every day's number.
        for ts, n in points:
            day_start = ts.replace(hour=0, minute=0, second=0, microsecond=0)
            buckets.setdefault(day_start, []).append(n)
        return [(day, sum(vals) / len(vals)) for day, vals in sorted(buckets.items())]
    for ts, n in points:
        epoch = int(ts.timestamp()) // seconds * seconds
        buckets.setdefault(epoch, []).append(n)
    return [( _dt.datetime.fromtimestamp(epoch).astimezone(), sum(vals) / len(vals))
            for epoch, vals in sorted(buckets.items())]


def hist_rows(variables, start_local, end_local, max_rows=200):
    """Raw historian samples for a set of variables over the period, oldest first.
    Columns: TimeStamp (local), Variable (full canonical name), Value."""
    names = [str(v).strip() for v in (variables or []) if v and str(v).strip()]
    if not names:
        return ["TimeStamp", "Variable", "Value"], []
    con = _open_ro(_env_path("historian"))
    try:
        cur = con.cursor()
        placeholders = ",".join("?" for _ in names)
        sql = ("SELECT TimeStamp, Variable, Value FROM HistoricData WHERE Variable IN ("
               + placeholders
               + ") AND TimeStamp >= ? AND TimeStamp < ? ORDER BY TimeStamp ASC LIMIT ?")
        args = names + [_utc_text(start_local), _utc_text(end_local), _clamp_rows(max_rows)]
        cur.execute(sql, args)
        rows = [(_utc_to_local_text(ts_text), var, value) for ts_text, var, value in cur.fetchall()]
        return ["TimeStamp", "Variable", "Value"], rows
    finally:
        con.close()


def alarm_rows(start_local, end_local, min_severity=0, max_rows=200):
    con = _open_ro(_env_path("historian"))
    try:
        cur = con.cursor()
        cur.execute(
            "SELECT OnTime, OffTime, Asset, Message, Severity, AckTime, AckUser "
            "FROM HistoricAlarms WHERE OnTime >= ? AND OnTime < ? AND IFNULL(Severity, 0) >= ? "
            "ORDER BY OnTime ASC LIMIT ?",
            (_utc_text(start_local), _utc_text(end_local), int(min_severity or 0), _clamp_rows(max_rows)))
        cols = [d[0] for d in cur.description]
        # Times print local like the historian tables do; a UTC OnTime next to a local
        # TimeStamp on the same page was off by the site offset.
        rows = [(_utc_to_local_text(on), _utc_to_local_text(off) if off else off, asset, msg,
                 sev, _utc_to_local_text(ack) if ack else ack, user)
                for on, off, asset, msg, sev, ack, user in cur.fetchall()]
        return cols, rows
    finally:
        con.close()


def event_rows(start_local, end_local, max_rows=200):
    con = _open_ro(_env_path("historian"))
    try:
        cur = con.cursor()
        cur.execute(
            "SELECT OnTime, Asset, Message, AckTime, AckUser "
            "FROM HistoricEvents WHERE OnTime >= ? AND OnTime < ? ORDER BY OnTime ASC LIMIT ?",
            (_utc_text(start_local), _utc_text(end_local), _clamp_rows(max_rows)))
        cols = [d[0] for d in cur.description]
        # Local times for the same reason as alarm_rows.
        rows = [(_utc_to_local_text(on), asset, msg, _utc_to_local_text(ack) if ack else ack, user)
                for on, asset, msg, ack, user in cur.fetchall()]
        return cols, rows
    finally:
        con.close()


def project_query(database, query, ctx, max_rows=200):
    """Read-only parameterized query against a SQLite file in the offline project folder.

    {Report.*} placeholders inside the query are bound as SQL parameters (never
    substituted as text), so the query cannot be broken by period values.
    """
    if os.path.sep in database or "/" in database or "\\" in database or ".." in database:
        raise ValueError("Report table database must be a plain file name in the project folder")
    path = os.path.join(_env_path("project"), database)
    if not os.path.isfile(path):
        raise ValueError("Project database '%s' not found in the project folder" % database)

    values = _report_values(ctx)
    params = []

    def _bind(match):
        token = match.group(1)
        if token in values:
            params.append(values[token])
            return "?"
        return match.group(0)

    bound = _TOKEN_RE.sub(_bind, query)

    con = _open_ro(path)
    try:
        cur = con.cursor()
        cur.execute(bound, params)
        cols = [d[0] for d in cur.description] if cur.description else []
        return cols, cur.fetchmany(_clamp_rows(max_rows))
    finally:
        con.close()


# ---------------------------------------------------------------------------
# Placeholders
# ---------------------------------------------------------------------------

def _report_values(ctx):
    values = {
        "Report.Name": ctx.name,
        "Report.Title": (ctx.template.get("title") or ctx.name),
        "Report.PeriodStart": ctx.period_start.strftime("%Y-%m-%d %H:%M"),
        "Report.PeriodEnd": ctx.period_end.strftime("%Y-%m-%d %H:%M"),
        "Report.Day": ctx.period_start.strftime("%Y-%m-%d"),
        "Report.Generated": _dt.datetime.now().strftime("%Y-%m-%d %H:%M"),
    }
    # Per-run parameters join the same namespace so both text placeholders ({Param.key})
    # and parameterized sqlite queries bind them uniformly.
    for key, value in getattr(ctx, "params", {}).items():
        values["Param.%s" % key] = value
    return values


# ---------------------------------------------------------------------------
# Inline expressions - {= python expression }
# ---------------------------------------------------------------------------
#
# A hook Module script is the right tool for genuinely complex logic, but it was also the
# ONLY tool: multiplying a column by 1000 needed a whole PythonScripts row. An inline
# expression covers that case in the template itself. Everything below runs inside the
# renderer, which is already Python, so there is no second engine and no extra process.

_EXPR_CACHE = {}
_EXPR_MAX_LENGTH = 2000

# Names an expression may use. Deliberately small: enough for arithmetic, aggregation and
# string work, nothing that opens files or imports modules.
_EXPR_BUILTINS = {
    "abs": abs, "all": all, "any": any, "bool": bool, "divmod": divmod,
    "enumerate": enumerate, "filter": filter, "float": float, "format": format,
    "int": int, "len": len, "list": list, "map": map, "max": max, "min": min,
    "pow": pow, "range": range, "reversed": reversed, "round": round,
    "sorted": sorted, "str": str, "sum": sum, "tuple": tuple, "zip": zip,
}


class _Ns(dict):
    """dict that also answers attribute access, so Report.Day and Row['Flow'] both work."""

    def __getattr__(self, name):
        try:
            return self[name]
        except KeyError:
            raise AttributeError(name)


def _expr_report(ctx):
    length = ctx.period_end - ctx.period_start
    return _Ns({
        # Same values as the {Report.*} placeholders...
        "Name": ctx.name,
        "Title": ctx.template.get("title") or ctx.name,
        "PeriodStart": ctx.period_start.strftime("%Y-%m-%d %H:%M"),
        "PeriodEnd": ctx.period_end.strftime("%Y-%m-%d %H:%M"),
        "Day": ctx.period_start.strftime("%Y-%m-%d"),
        "Generated": _dt.datetime.now().strftime("%Y-%m-%d %H:%M"),
        # ...plus the typed period, so a rate or a per-hour figure does not have to parse
        # formatted text back into numbers.
        "Start": ctx.period_start,
        "End": ctx.period_end,
        "Hours": length.total_seconds() / 3600.0,
        "Days": length.total_seconds() / 86400.0,
    })


def _expr_globals(ctx, extra=None):
    def Var(name):
        """Live value of a variable, as text."""
        return GetStringValue(str(name))

    def Num(name, default=0.0):
        """Live value of a variable as a number; default when it is missing or not numeric."""
        n = _num(GetStringValue(str(name)))
        return default if n is None else n

    def Hist(variable, agg="avg", default=None):
        """Historian aggregate over the report period: sum|avg|min|max|count|delta."""
        try:
            value = hist_agg(variable, agg, ctx.period_start, ctx.period_end)
        except Exception:
            value = None
        return default if value is None else value

    def Val(value, default=0.0):
        """Coerce a cell or text to a number, with a default instead of an exception."""
        n = _num(value)
        return default if n is None else n

    scope = {
        "__builtins__": _EXPR_BUILTINS,
        "Report": _expr_report(ctx),
        "Param": _Ns(getattr(ctx, "params", {}) or {}),
        "Expr": _Ns(ctx),
        "Var": Var,
        "Num": Num,
        "Hist": Hist,
        "Val": Val,
        "math": _math,
        "datetime": _dt.datetime,
        "timedelta": _dt.timedelta,
    }
    # Row (computed column) and Values/Raw (summary aggregate) are only in scope where they
    # mean something, so a misplaced expression fails loudly instead of reading a stale name.
    if extra:
        scope.update(extra)
    return scope


def eval_expression(source, ctx, extra=None):
    """Evaluate one inline expression. Returns (True, value) or (False, message).

    The namespace is curated so a typo cannot reach the filesystem by accident, but this is
    NOT a sandbox: a report template is Administrators-only configuration, exactly the trust
    level of the hook script it replaces."""
    src = (source or "").strip()
    if not src:
        return False, "the expression is empty"
    if len(src) > _EXPR_MAX_LENGTH:
        return False, "the expression is longer than %d characters" % _EXPR_MAX_LENGTH
    if "__" in src:
        return False, "'__' cannot be used in a report expression"

    code = _EXPR_CACHE.get(src)
    if code is None:
        try:
            # Compiled once per distinct expression: a computed column over 200 rows
            # evaluates the same code object 200 times.
            code = compile(src, "<report-expression>", "eval")
        except SyntaxError as ex:
            return False, "syntax error: %s" % (ex.msg or ex)
        _EXPR_CACHE[src] = code

    try:
        return True, eval(code, _expr_globals(ctx, extra), {})
    except Exception as ex:
        return False, "%s: %s" % (type(ex).__name__, ex)


def _expr_failed(source, message):
    """A failed expression never aborts the report, but it is always reported: the run output
    is where the designer's Run dialog and the script log show what went wrong."""
    print("Report expression {= %s } failed - %s" % ((source or "").strip(), message))


def _expr_text(value):
    if value is None:
        return ""
    if isinstance(value, bool):
        return str(value)
    return _fmt(value, "")


def resolve_expressions(text, ctx, extra=None):
    """Replace every {= expression } in a string with its value. A failed expression is left
    in place so the template author can see which one it was."""
    def _sub(match):
        source = match.group(1)
        ok, value = eval_expression(source, ctx, extra)
        if not ok:
            _expr_failed(source, value)
            return match.group(0)
        return _expr_text(value)

    return _EXPR_RE.sub(_sub, text)


def _shifted_context(ctx):
    """Copy of the context covering the period immediately before this one, used by a KPI
    tile with Compare. Hook-computed {Expr.*} values are carried over unchanged - they were
    computed once, for the current period."""
    length = ctx.period_end - ctx.period_start
    previous = ReportContext(ctx.name, ctx.template, ctx.period_start - length, ctx.period_start, ctx.params)
    previous.update(ctx)
    return previous


# Per-component period override, offset form: -7d, +12h, -90m, +2w.
_OFFSET_RE = re.compile(r"^([+-])\s*(\d+(?:\.\d+)?)\s*(m|h|d|w)$", re.IGNORECASE)
_OFFSET_UNITS = {"m": "minutes", "h": "hours", "d": "days", "w": "weeks"}


def _period_bound(text, base, ctx):
    """One boundary of a component period override. Empty text keeps the report boundary.

    An unresolvable value never aborts the report: it is printed to the run output and the
    report boundary is used, the same way a failed expression degrades."""
    raw = (str(text) if text is not None else "").strip()
    if not raw:
        return base

    offset = _OFFSET_RE.match(raw)
    if offset:
        sign = -1 if offset.group(1) == "-" else 1
        amount = float(offset.group(2))
        return base + _dt.timedelta(**{_OFFSET_UNITS[offset.group(3).lower()]: sign * amount})

    # One whole expression keeps its typed value, so { = Report.End - timedelta(days=1) }
    # arrives as a datetime instead of formatted text that has to be parsed back.
    whole = _EXPR_RE.fullmatch(raw)
    if whole:
        ok, value = eval_expression(whole.group(1), ctx)
        if not ok:
            _expr_failed(whole.group(1), value)
            return base
        if isinstance(value, _dt.datetime):
            return value if value.tzinfo else value.astimezone()
        raw = _expr_text(value)
    else:
        raw = resolve_text(raw, ctx)

    try:
        return _parse_dt(raw)
    except ValueError as ex:
        print("Report component period '%s' ignored - %s" % (text, ex))
        return base


def component_context(comp, ctx):
    """Context a single component renders with. Without an override it IS the report context,
    so a template that does not use the feature behaves exactly as before.

    An override shifts only this component's window: its historian, alarm, event and sqlite
    data, the Hist() aggregates in its expressions, and the {Report.Period*} placeholders it
    prints. The run keeps its own period for the file name, the footer and every other
    component."""
    start_text = (comp.get("periodStart") or "").strip()
    end_text = (comp.get("periodEnd") or "").strip()
    if not start_text and not end_text:
        return ctx

    start = _period_bound(start_text, ctx.period_start, ctx)
    end = _period_bound(end_text, ctx.period_end, ctx)
    if end <= start:
        print("Report component period ignored - the resolved start %s is not before the end %s"
              % (start, end))
        return ctx

    scoped = ReportContext(ctx.name, ctx.template, start, end, ctx.params)
    # Hook-computed {Expr.*} values are carried over unchanged: the hook runs once, for the
    # report period, exactly as it does for a Compare tile.
    scoped.update(ctx)
    return scoped


def resolve_text(text, ctx, extra=None):
    """Resolve {= expression }, {Report.*}, {Expr.*} and {Device.Variable} placeholders.

    Expressions run FIRST and on typed values, so {= Hist("PLC1.Flow","sum") / 1000 } divides
    a number rather than substituted text.
    {Page}/{Pages} are left for the PDF footer machinery ({nb} alias)."""
    if not text:
        return ""
    text = resolve_expressions(text, ctx, extra)
    values = _report_values(ctx)

    def _sub(match):
        token = match.group(1)
        if token in ("Page", "Pages"):
            return match.group(0)
        if token in values:
            return str(values[token])
        if token.startswith("Expr."):
            return str(ctx.get(token[5:], ""))
        try:
            return str(GetStringValue(token))
        except Exception:
            return match.group(0)

    return _TOKEN_RE.sub(_sub, text)


def resolve_binding(binding, ctx, compare=False):
    """KPI binding -> (value, previous_value_or_None). See ReportKpiTile.Binding.

    A broken binding (unknown variable, historian error) degrades to an empty
    value instead of aborting the whole report."""
    binding = (binding or "").strip()
    prev = None
    try:
        # A binding that is nothing but an expression keeps the expression's own type, so the
        # tile's Format and Units still apply to a computed number.
        expression = _EXPR_RE.fullmatch(binding)
        if expression:
            ok, value = eval_expression(expression.group(1), ctx)
            if not ok:
                _expr_failed(expression.group(1), value)
                return None, None
            if compare:
                # Compare re-evaluates the same expression over the previous period.
                ok_prev, previous = eval_expression(expression.group(1), _shifted_context(ctx))
                prev = previous if ok_prev else None
            return value, prev
        if binding.lower().startswith("var:"):
            value = GetStringValue(binding[4:])
        elif binding.lower().startswith("expr:"):
            value = ctx.get(binding[5:])
        elif binding.lower().startswith("hist:"):
            _, agg, variable = binding.split(":", 2)
            value = hist_agg(variable, agg, ctx.period_start, ctx.period_end)
            if compare:
                length = ctx.period_end - ctx.period_start
                prev = hist_agg(variable, agg, ctx.period_start - length, ctx.period_start)
        else:
            value = resolve_text(binding, ctx)
    except Exception:
        value = None
        prev = None
    return value, prev


# ---------------------------------------------------------------------------
# Table building (shared by PDF and Excel)
# ---------------------------------------------------------------------------

class BuiltTable(object):
    __slots__ = ("headers", "formats", "rows", "summary", "summary_excel", "numeric", "group_index")

    def __init__(self):
        self.headers = []
        self.formats = []
        self.rows = []
        self.summary = None        # list of formatted strings or None
        self.summary_excel = None  # list of ("formula", agg) / ("value", v) / None per column
        self.numeric = []
        self.group_index = None    # column index rows are grouped by (matches Name OR Header)


def _table_data(comp, ctx, hook_module):
    source = (comp.get("source") or "sqlite").lower()
    max_rows = comp.get("maxRows") or 200
    if source == "historian":
        return hist_rows(comp.get("variables") or [], ctx.period_start, ctx.period_end, max_rows)
    if source == "alarms":
        return alarm_rows(ctx.period_start, ctx.period_end, comp.get("minSeverity") or 0, max_rows)
    if source == "events":
        return event_rows(ctx.period_start, ctx.period_end, max_rows)
    return project_query(comp.get("database") or "", comp.get("query") or "", ctx, max_rows)


def build_table(comp, ctx, hook_module):
    cols_spec = comp.get("columns") or []
    src_cols, src_rows = _table_data(comp, ctx, hook_module)
    index = {c.lower(): i for i, c in enumerate(src_cols)}

    if not cols_spec:
        cols_spec = [{"name": c, "header": c, "format": "", "aggregate": "", "fn": ""} for c in src_cols]

    table = BuiltTable()
    table.headers = [(c.get("header") or c.get("name") or "") for c in cols_spec]
    table.formats = [c.get("format") or "" for c in cols_spec]

    def _cell(row, spec):
        fn_name = (spec.get("fn") or "").strip()
        if fn_name:
            row_dict = {c: row[i] for i, c in enumerate(src_cols)}
            # An inline expression addresses the source row as Row['Column'] (or Row.Column
            # when the column name is a plain identifier); a bare name is a hook function.
            expression = _EXPR_RE.fullmatch(fn_name)
            if expression:
                ok, value = eval_expression(expression.group(1), ctx, {"Row": _Ns(row_dict)})
                if ok:
                    return value
                _expr_failed(expression.group(1), value)
                return "ERR:%s" % value
            fn = getattr(hook_module, fn_name, None) if hook_module else None
            if fn is None:
                return ""
            try:
                return fn(row_dict, ctx)
            except Exception as ex:
                return "ERR:%s" % ex
        i = index.get((spec.get("name") or "").lower())
        return row[i] if i is not None else ""

    raw_rows = [[_cell(row, spec) for spec in cols_spec] for row in src_rows]

    group_by = comp.get("groupBy") or ""
    if group_by:
        gi = next((i for i, c in enumerate(cols_spec)
                   if (c.get("name") or "").lower() == group_by.lower()
                   or (c.get("header") or "").lower() == group_by.lower()), None)
        if gi is not None:
            raw_rows.sort(key=lambda r: str(r[gi]))
            # Renderers emit group heading rows from this index, so grouping works the
            # same whether GroupBy named the column's Name or its Header.
            table.group_index = gi

    table.rows = raw_rows

    def _code_like(cell):
        # "0012" parses as a number, but reformatting it to "12" destroys a code/serial
        # column's leading zeros (in the PDF and as an Excel number alike). A leading
        # zero before another digit marks the column as text.
        return isinstance(cell, str) and re.match(r"\s*-?0\d", cell) is not None

    table.numeric = [all(_num(r[i]) is not None for r in raw_rows if r[i] not in ("", None)) and
                     any(r[i] not in ("", None) for r in raw_rows) and
                     not any(_code_like(r[i]) for r in raw_rows)
                     for i in range(len(cols_spec))]

    # Kept in the author's own case: lowercasing the whole field would rename a py: hook
    # function and rewrite the identifiers inside an inline expression.
    aggregates = [(c.get("aggregate") or "").strip() for c in cols_spec]
    if any(aggregates):
        summary = []
        summary_excel = []
        for i, agg in enumerate(aggregates):
            name = agg.lower()
            values = [_num(r[i]) for r in raw_rows]
            values = [v for v in values if v is not None]
            if not agg:
                summary.append("")
                summary_excel.append(None)
                continue
            expression = _EXPR_RE.fullmatch(agg)
            if expression:
                # Values is the column's numeric cells, Raw every cell as it was built.
                ok, result = eval_expression(expression.group(1), ctx,
                                             {"Values": values, "Raw": [r[i] for r in raw_rows]})
                if not ok:
                    _expr_failed(expression.group(1), result)
                    result = "ERR:%s" % result
                summary.append(_fmt(result, table.formats[i]))
                summary_excel.append(("value", result))
                continue
            if name.startswith("py:"):
                fn = getattr(hook_module, agg[3:], None) if hook_module else None
                try:
                    result = fn([r[i] for r in raw_rows], ctx) if fn else ""
                except Exception as ex:
                    result = "ERR:%s" % ex
                summary.append(_fmt(result, table.formats[i]))
                summary_excel.append(("value", result))
                continue
            if name == "count":
                result = len(raw_rows)
            elif not values:
                result = ""
            elif name == "sum":
                result = sum(values)
            elif name == "avg":
                result = sum(values) / len(values)
            elif name == "min":
                result = min(values)
            elif name == "max":
                result = max(values)
            else:
                result = ""
            summary.append(_fmt(result, table.formats[i]) if result != "" else "")
            # With no data rows there is no range for a native formula; a value cell
            # keeps the Excel summary from printing the aggregate's NAME ("sum") verbatim.
            summary_excel.append(("formula", name) if raw_rows else ("value", result))
        table.summary = summary
        table.summary_excel = summary_excel

    return table


# ---------------------------------------------------------------------------
# PDF rendering (fpdf)
# ---------------------------------------------------------------------------

_PAGE_MM = {"a4": (210.0, 297.0), "letter": (215.9, 279.4)}
# The designer's page width in px; canvas X/Y/W are in this space. Portrait pages are
# 794px wide in the designer, landscape pages 1123px - the mapping must match or
# free-canvas components land outside the sheet.
_DESIGN_WIDTH_PORTRAIT_PX = 794.0
_DESIGN_WIDTH_LANDSCAPE_PX = 1123.0


def _make_pdf(template):
    from fpdf import FPDF

    size = (template.get("pageSize") or "A4").lower()
    landscape = (template.get("orientation") or "portrait").lower() == "landscape"

    class ReportPdf(FPDF):
        footer_left = ""
        footer_right = ""

        def footer(self):
            if not self.footer_left and not self.footer_right:
                return
            self.set_y(-12)
            self.set_font("Arial", "", 8)
            self.set_text_color(110, 120, 130)
            left = self.footer_left.replace("{Page}", str(self.page_no())).replace("{Pages}", "{nb}")
            right = self.footer_right.replace("{Page}", str(self.page_no())).replace("{Pages}", "{nb}")
            half = (self.w - self.l_margin - self.r_margin) / 2
            self.cell(half, 6, _latin1(left), 0, 0, "L")
            self.cell(half, 6, _latin1(right), 0, 0, "R")

    fmt = "A4" if size == "a4" else "Letter"
    pdf = ReportPdf("L" if landscape else "P", "mm", fmt)
    pdf.alias_nb_pages()
    pdf.set_margins(14, 14, 14)
    pdf.set_auto_page_break(True, 18)
    return pdf


def _px_to_mm(pdf):
    design_w = _DESIGN_WIDTH_LANDSCAPE_PX if pdf.w > pdf.h else _DESIGN_WIDTH_PORTRAIT_PX
    return (pdf.w - 0.0) / design_w


def _fill_polygon(pdf, points):
    """Fill a polygon given in page mm coordinates using raw PDF path operators.

    fpdf 1.7 has no polygon primitive; the content stream uses points with a flipped
    y axis, hence the pdf.k / pdf.h mapping. Fill color comes from set_fill_color."""
    if len(points) < 3:
        return
    k = pdf.k
    ops = []
    for i, (x, y) in enumerate(points):
        ops.append("%.2f %.2f %s" % (x * k, (pdf.h - y) * k, "m" if i == 0 else "l"))
    ops.append("h f")
    pdf._out(" ".join(ops))


def _tint(color, factor=0.78):
    """Mix a color toward white; fpdf 1.7 has no alpha, so area fills use a tint."""
    return tuple(int(c + (255 - c) * factor) for c in color)


class PdfRenderer(object):
    def __init__(self, pdf, ctx, hook_module, accent):
        self.pdf = pdf
        self.ctx = ctx
        self.hook = hook_module
        self.accent = accent

    # -- shared primitives --------------------------------------------------

    def content_width(self):
        return self.pdf.w - self.pdf.l_margin - self.pdf.r_margin

    def reserve(self, height):
        """Ensure `height` mm fits on the current page, else start a new one.

        fpdf only breaks pages inside cell()/multi_cell(). Components drawn with raw
        primitives (chart frames, KPI tiles, images) would otherwise be painted past
        the bottom of the sheet and clipped, with their cell-based labels landing on
        the following page. Banded pages only: on a canvas page the author places
        components deliberately, so nothing may move.

        Returns True when a page break was taken."""
        pdf = self.pdf
        if not pdf.auto_page_break:
            return False
        # page_break_trigger = page height minus the bottom margin.
        if pdf.get_y() + height <= pdf.page_break_trigger:
            return False
        x = pdf.get_x()
        pdf.add_page(pdf.cur_orientation)
        pdf.set_x(x)
        return True

    def text_block(self, comp, width=None):
        pdf = self.pdf
        style = (comp.get("style") or "body").lower()
        text = resolve_text(comp.get("text") or "", self.ctx)
        width = width or self.content_width()
        if style == "h1":
            pdf.set_font("Arial", "B", 16)
            pdf.set_text_color(20, 32, 44)
        elif style == "h2":
            pdf.set_font("Arial", "B", 12)
            pdf.set_text_color(20, 32, 44)
        elif style == "callout":
            pdf.set_font("Arial", "", 9)
            pdf.set_text_color(42, 57, 71)
            x, y = pdf.get_x(), pdf.get_y()
            pdf.set_fill_color(244, 248, 251)
            pdf.set_draw_color(*self.accent)
            pdf.rect(x, y, 1.2, 8, "F")
            pdf.set_x(x + 3)
            pdf.multi_cell(width - 3, 5, _latin1(text), 0, "L")
            return
        else:
            pdf.set_font("Arial", "", 9.5)
            pdf.set_text_color(42, 57, 71)
        pdf.multi_cell(width, 6 if style in ("h1", "h2") else 5, _latin1(text), 0, "L")

    def header_block(self, comp, width=None):
        pdf = self.pdf
        width = width or self.content_width()
        x = pdf.get_x()
        title = resolve_text(comp.get("text") or "", self.ctx)
        sub = resolve_text(comp.get("subText") or "", self.ctx)
        pdf.set_font("Arial", "B", 17)
        pdf.set_text_color(20, 32, 44)
        pdf.cell(width, 8, _latin1(title), 0, 1, "L")
        if sub:
            pdf.set_x(x)
            pdf.set_font("Arial", "", 9)
            pdf.set_text_color(91, 107, 123)
            pdf.cell(width, 5, _latin1(sub), 0, 1, "L")
        pdf.ln(1.5)
        pdf.set_draw_color(*self.accent)
        pdf.set_line_width(0.9)
        pdf.line(x, pdf.get_y(), x + width, pdf.get_y())
        pdf.set_line_width(0.2)
        pdf.ln(4)

    def kpi_row(self, comp, width=None):
        pdf = self.pdf
        tiles = comp.get("tiles") or []
        if not tiles:
            return
        width = width or self.content_width()
        gap = 3.0
        tile_w = (width - gap * (len(tiles) - 1)) / len(tiles)
        tile_h = 18.0
        # Keep the whole row together: without this the tile frames could be drawn at
        # the bottom of a page while their labels/values broke onto the next one.
        self.reserve(tile_h + 3)
        x0, y0 = pdf.get_x(), pdf.get_y()

        for i, tile in enumerate(tiles):
            x = x0 + i * (tile_w + gap)
            value, prev = resolve_binding(tile.get("binding"), self.ctx, tile.get("compare"))
            pdf.set_draw_color(221, 229, 236)
            pdf.rect(x, y0, tile_w, tile_h)
            pdf.set_xy(x + 2.5, y0 + 2.2)
            pdf.set_font("Arial", "B", 6.5)
            pdf.set_text_color(107, 123, 139)
            pdf.cell(tile_w - 5, 3, _latin1((tile.get("label") or "").upper()), 0, 2, "L")
            pdf.set_font("Arial", "B", 13)
            pdf.set_text_color(20, 32, 44)
            text = _fmt(value, tile.get("format"))
            units = tile.get("units") or ""
            pdf.cell(tile_w - 5, 7, _latin1(("%s %s" % (text, units)).strip()), 0, 2, "L")
            if tile.get("compare") and prev not in (None, 0):
                n, p = _num(value), _num(prev)
                if n is not None and p not in (None, 0):
                    delta = (n - p) / abs(p) * 100.0
                    up = delta >= 0
                    pdf.set_font("Arial", "", 6.5)
                    pdf.set_text_color(47, 157, 95) if up else pdf.set_text_color(200, 68, 58)
                    pdf.cell(tile_w - 5, 3, _latin1("%s %+.1f%% vs previous period" % ("^" if up else "v", delta)), 0, 0, "L")

        pdf.set_xy(x0, y0 + tile_h + 3)

    def chart(self, comp, width=None, height=None):
        pdf = self.pdf
        width = width or self.content_width()
        height = height or (comp.get("height") or 55)
        height = max(30.0, float(height))
        chart_type = (comp.get("chartType") or "line").lower()
        series_defs = comp.get("series") or []
        resample = comp.get("resample") or "1h"

        # A chart is drawn almost entirely with rect()/line(), which never trigger a
        # page break; a titleless chart near the bottom used to run off the sheet and
        # scatter its axis labels over the following pages.
        title_h = 5 if resolve_text(comp.get("text") or "", self.ctx) else 0
        self.reserve(height + title_h + 4)

        series = []
        palette = [self.accent, (230, 166, 60), (92, 201, 138), (200, 68, 58), (122, 107, 226)]
        for i, s in enumerate(series_defs):
            try:
                points = hist_series(s.get("variable") or "", self.ctx.period_start, self.ctx.period_end, resample)
            except Exception:
                points = []
            color = _hex_rgb(s.get("color"), palette[i % len(palette)])
            series.append((s.get("label") or s.get("variable") or "", color, points))

        x0, y0 = pdf.get_x(), pdf.get_y()
        title = resolve_text(comp.get("text") or "", self.ctx)
        if title:
            pdf.set_font("Arial", "B", 9)
            pdf.set_text_color(20, 32, 44)
            pdf.cell(width, 5, _latin1(title), 0, 1, "L")
            y0 = pdf.get_y()

        pdf.set_draw_color(221, 229, 236)
        pdf.rect(x0, y0, width, height)

        plot_x, plot_y = x0 + 12, y0 + 3
        plot_w, plot_h = width - 16, height - 12

        # Draft state: a chart without any bound series is saveable by design and prints
        # a clear placeholder instead of an empty frame.
        if not any((s.get("variable") or "").strip() for s in series_defs):
            pdf.set_font("Arial", "", 8)
            pdf.set_text_color(140, 150, 160)
            pdf.set_xy(x0, y0 + height / 2 - 3)
            pdf.cell(width, 6, "Chart not configured (no series)", 0, 0, "C")
            pdf.set_xy(x0, y0 + height + 4)
            return

        all_values = [v for _, _, pts in series for _, v in pts]
        if not all_values:
            pdf.set_font("Arial", "", 8)
            pdf.set_text_color(140, 150, 160)
            pdf.set_xy(x0, y0 + height / 2 - 3)
            pdf.cell(width, 6, "No samples in period", 0, 0, "C")
            pdf.set_xy(x0, y0 + height + 4)
            return

        vmin, vmax = min(all_values), max(all_values)
        if vmin == vmax:
            vmin, vmax = vmin - 1, vmax + 1
        span = vmax - vmin

        start_e = self.ctx.period_start.timestamp()
        end_e = self.ctx.period_end.timestamp()
        t_span = max(1.0, end_e - start_e)

        def sx(ts):
            # Clamped to the plot: a resample bucket floored before the period start (or a
            # component period wider than its data) otherwise drew over the margin/labels.
            x = plot_x + (ts.timestamp() - start_e) / t_span * plot_w
            return min(plot_x + plot_w, max(plot_x, x))

        def sy(v):
            return plot_y + plot_h - (v - vmin) / span * plot_h

        # gridlines + y labels
        pdf.set_font("Arial", "", 6)
        pdf.set_text_color(138, 153, 168)
        for frac in (0.0, 0.5, 1.0):
            gy = plot_y + plot_h * (1 - frac)
            pdf.set_draw_color(238, 242, 246)
            pdf.line(plot_x, gy, plot_x + plot_w, gy)
            pdf.set_xy(x0 + 0.5, gy - 1.5)
            pdf.cell(10, 3, _latin1(_fmt(vmin + span * frac, "")), 0, 0, "R")

        # x labels: start / middle / end
        for frac in (0.0, 0.5, 1.0):
            ts = _dt.datetime.fromtimestamp(start_e + t_span * frac).astimezone()
            pdf.set_xy(plot_x + plot_w * frac - 8, plot_y + plot_h + 1)
            pdf.cell(16, 3, ts.strftime("%H:%M" if t_span <= 86400 * 2 else "%m-%d"), 0, 0, "C")

        for label, color, points in series:
            if not points:
                continue
            pdf.set_draw_color(*color)
            if chart_type == "bar":
                bar_w = max(0.8, plot_w / max(1, len(points)) * 0.6)
                pdf.set_fill_color(*color)
                for ts, v in points:
                    bx = sx(ts) - bar_w / 2
                    by = sy(v)
                    pdf.rect(max(plot_x, bx), by, bar_w, plot_y + plot_h - by, "F")
            else:
                if chart_type == "area" and len(points) >= 2:
                    # Tinted fill down to the plot floor, line drawn on top (no alpha in
                    # fpdf 1.7, so overlapping series use lightened colors).
                    floor = plot_y + plot_h
                    poly = [(sx(ts), sy(v)) for ts, v in points]
                    poly.append((sx(points[-1][0]), floor))
                    poly.append((sx(points[0][0]), floor))
                    pdf.set_fill_color(*_tint(color))
                    _fill_polygon(pdf, poly)
                pdf.set_line_width(0.5)
                prev = None
                for ts, v in points:
                    cur = (sx(ts), sy(v))
                    if prev:
                        pdf.line(prev[0], prev[1], cur[0], cur[1])
                    prev = cur
                if len(points) == 1:
                    # A single sample has no segment to draw; a small dot keeps the series
                    # visible instead of rendering axes and legend around nothing.
                    dot_x, dot_y = sx(points[0][0]), sy(points[0][1])
                    pdf.set_fill_color(*color)
                    pdf.ellipse(dot_x - 0.8, dot_y - 0.8, 1.6, 1.6, "F")
                pdf.set_line_width(0.2)

        # legend
        pdf.set_font("Arial", "", 6.5)
        lx = plot_x
        ly = y0 + height - 4
        for label, color, _pts in series:
            pdf.set_fill_color(*color)
            pdf.rect(lx, ly + 0.7, 2.2, 2.2, "F")
            pdf.set_text_color(70, 86, 106)
            pdf.set_xy(lx + 3, ly)
            text_w = pdf.get_string_width(_latin1(label)) + 4
            pdf.cell(text_w, 4, _latin1(label), 0, 0, "L")
            lx += 3 + text_w + 3

        pdf.set_xy(x0, y0 + height + 4)

    def table(self, comp, width=None):
        pdf = self.pdf
        width = width or self.content_width()

        # Draft state: an unconfigured sqlite table is saveable by design.
        if (comp.get("source") or "sqlite").lower() == "sqlite" \
                and (not (comp.get("database") or "").strip() or not (comp.get("query") or "").strip()):
            pdf.set_font("Arial", "", 8)
            pdf.set_text_color(140, 150, 160)
            pdf.cell(width, 6, "Table not configured (database/query missing)", 0, 1, "L")
            return

        try:
            table = build_table(comp, self.ctx, self.hook)
        except Exception as ex:
            pdf.set_font("Arial", "", 8)
            pdf.set_text_color(200, 68, 58)
            pdf.multi_cell(width, 5, _latin1("Table error: %s" % ex), 0, "L")
            return

        # pdf.ln() resets x to the left margin, which is wrong for a canvas table placed
        # at an explicit x - remember the origin and restore it after every line break.
        x_start = pdf.get_x()

        title = resolve_text(comp.get("text") or "", self.ctx)
        if title:
            pdf.set_font("Arial", "B", 9)
            pdf.set_text_color(20, 32, 44)
            pdf.cell(width, 5, _latin1(title), 0, 1, "L")
            pdf.set_x(x_start)

        n = max(1, len(table.headers))
        col_w = width / n
        row_h = 5.6

        def clip(text):
            # fpdf's cell() never clips: text longer than the column ran under the next
            # cell, where a zebra fill painted over it - rows looked truncated at random
            # places. Cut to the column width with an ellipsis instead.
            text = _latin1(text)
            if pdf.get_string_width(text) <= col_w - 2:
                return text
            while text and pdf.get_string_width(text + "...") > col_w - 2:
                text = text[:-1]
            return text + "..."

        def draw_header():
            pdf.set_font("Arial", "B", 7.5)
            pdf.set_fill_color(*self.accent)
            pdf.set_text_color(255, 255, 255)
            for i, h in enumerate(table.headers):
                pdf.cell(col_w, row_h, clip(h), 0, 0, "R" if table.numeric[i] else "L", True)
            pdf.ln(row_h)
            pdf.set_x(x_start)
            pdf.set_font("Arial", "", 7.5)

        # Keep the header with at least one data row instead of stranding it alone at
        # the bottom of a page.
        self.reserve(row_h * 2)
        draw_header()

        # build_table resolved GroupBy against column Name OR Header; reuse its index so
        # the group heading rows always appear when the rows were sorted.
        gi = table.group_index
        current_group = object()

        for r, row in enumerate(table.rows):
            # A table longer than the page continues on the next one, and the column
            # headings are repeated there - without this the continuation pages showed
            # bare data rows with no headings at all.
            if self.reserve(row_h):
                draw_header()
            if gi is not None and row[gi] != current_group:
                current_group = row[gi]
                pdf.set_font("Arial", "B", 7.5)
                pdf.set_fill_color(238, 246, 250)
                pdf.set_text_color(20, 32, 44)
                pdf.cell(width, row_h, _latin1(str(current_group)), 0, 1, "L", True)
                pdf.set_x(x_start)
                pdf.set_font("Arial", "", 7.5)
            fill = r % 2 == 1
            pdf.set_fill_color(244, 247, 250)
            pdf.set_text_color(42, 57, 71)
            for i, cell in enumerate(row):
                text = _fmt(cell, table.formats[i]) if table.numeric[i] else str(cell if cell is not None else "")
                pdf.cell(col_w, row_h, clip(text), 0, 0, "R" if table.numeric[i] else "L", fill)
            pdf.ln(row_h)
            pdf.set_x(x_start)

        if table.summary:
            self.reserve(row_h + 1)
            pdf.set_font("Arial", "B", 7.5)
            pdf.set_fill_color(238, 246, 250)
            pdf.set_draw_color(*self.accent)
            y = pdf.get_y()
            pdf.line(x_start, y, x_start + width, y)
            pdf.set_text_color(20, 32, 44)
            for i, cell in enumerate(table.summary):
                pdf.cell(col_w, row_h, clip(cell), 0, 0, "R" if table.numeric[i] else "L", True)
            pdf.ln(row_h)
        pdf.ln(2)

    def image(self, comp, width=None):
        """Image from a validated wwwroot-relative path. Missing files degrade to a note.

        fpdf 1.7 dispatches on the file EXTENSION, so a mislabeled file (a PNG saved as
        .jpg is common) or an alpha PNG breaks it. The real format and dimensions come
        from a pure-Python header sniff (_sniff_image), so the aspect ratio - and with
        it the cursor advance - is correct even without Pillow. When Pillow IS available
        (optional, not vendored) it converts anything that is not a clean baseline JPEG
        to a temporary RGB PNG; without it, an incompatible file degrades to a note that
        says exactly how to fix it instead of a raw fpdf error.

        `imageWidth` is a percentage of the width available here (`width` on a canvas page,
        the content width on a banded one) and `align` places the picture inside it. A
        missing or 0 percentage keeps the original defaults - a third of the content width
        banded, the whole box on canvas - so templates written before those fields render
        exactly as they did."""
        pdf = self.pdf
        rel = (comp.get("path") or "").replace("\\", "/")
        if not rel:
            return
        full = os.path.join(_env_path("webroot"), *rel.split("/"))
        if ".." in rel or not os.path.isfile(full):
            pdf.set_font("Arial", "", 7.5)
            pdf.set_text_color(140, 150, 160)
            pdf.cell(width or self.content_width(), 5, _latin1("Image not found: %s" % rel), 0, 1, "L")
            return

        avail = width or self.content_width()
        try:
            pct = float(comp.get("imageWidth") or 0)
        except (TypeError, ValueError):
            pct = 0.0
        w_mm = avail * min(100.0, pct) / 100.0 if pct > 0 else (width or (self.content_width() / 3))

        real_fmt, px_w, px_h, png_color_type = _sniff_image(full)
        aspect = (px_h / float(px_w)) if px_w and px_h else 0.5

        # pdf.image() draws without ever breaking the page; reserve the drawn height
        # (known from the sniffed pixel size) so a tall image is not clipped.
        self.reserve(w_mm * aspect + 2)

        # The cursor stays at the left edge of the available width: alignment only moves the
        # picture, so the next component still starts where it would have.
        left_x, y = pdf.get_x(), pdf.get_y()
        align = (comp.get("align") or "left").strip().lower()
        if align == "center":
            x = left_x + max(0.0, (avail - w_mm) / 2)
        elif align == "right":
            x = left_x + max(0.0, avail - w_mm)
        else:
            x = left_x
        path_for_pdf = full
        temp_path = None

        pillow_available = True
        try:
            from PIL import Image as _PilImage
            with _PilImage.open(full) as im:
                aspect = im.height / float(im.width or 1)
                fmt = (im.format or "").upper()
                clean_jpeg = fmt == "JPEG" and full.lower().endswith((".jpg", ".jpeg"))
                if not clean_jpeg:
                    import tempfile
                    temp_path = os.path.join(tempfile.gettempdir(), "envision_report_img_%d.png" % abs(hash(full)))
                    if im.mode in ("RGBA", "LA", "P"):
                        rgba = im.convert("RGBA")
                        background = _PilImage.new("RGB", im.size, (255, 255, 255))
                        background.paste(rgba, mask=rgba.split()[-1])
                        background.save(temp_path, "PNG")
                    else:
                        im.convert("RGB").save(temp_path, "PNG")
                    path_for_pdf = temp_path
        except ImportError:
            pillow_available = False
        except Exception:
            path_for_pdf = full

        try:
            pdf.image(path_for_pdf, x, y, w_mm)
        except Exception as ex:
            reason = str(ex)
            if not pillow_available:
                ext = os.path.splitext(rel)[1].lstrip(".").upper() or "?"
                if real_fmt and real_fmt != ("JPG" if ext == "JPG" else ext) and not (real_fmt == "JPEG" and ext in ("JPG", "JPEG")):
                    reason = ("file is %s but named .%s - rename to the real format "
                              "or install Pillow to convert automatically" % (real_fmt, ext.lower()))
                elif real_fmt == "PNG" and png_color_type in (4, 6):
                    reason = ("PNG with alpha channel - flatten/re-save without alpha "
                              "or install Pillow to convert automatically")
            pdf.set_font("Arial", "", 7.5)
            pdf.set_text_color(200, 68, 58)
            pdf.cell(width or self.content_width(), 5, _latin1("Image error: %s" % reason), 0, 1, "L")
            return
        finally:
            if temp_path:
                try:
                    os.remove(temp_path)
                except OSError:
                    pass

        # fpdf tracks no cursor after image(); advance by the drawn height (aspect comes
        # from the sniffed pixel size, so tall logos no longer get overprinted).
        pdf.set_xy(left_x, y + w_mm * aspect + 2)

    # -- columns band -------------------------------------------------------

    # Horizontal gap between two columns, in mm.
    COLUMN_GAP_MM = 4.0

    def column_widths(self, slots, avail):
        """Printed width of every slot in mm.

        A slot's `width` is a percentage of the space left once the gaps are taken out;
        0 (the default) means "share what the explicit percentages leave over", equally
        between the slots that ask for it. Two empty slots therefore give two equal
        halves, which is what dropping a Columns band produces."""
        count = len(slots)
        inner = max(0.0, avail - self.COLUMN_GAP_MM * (count - 1))
        explicit = []
        for slot in slots:
            try:
                pct = float(slot.get("width") or 0)
            except (TypeError, ValueError):
                pct = 0.0
            explicit.append(min(100.0, pct) if pct > 0 else 0.0)

        taken = sum(explicit)
        autos = [i for i, pct in enumerate(explicit) if pct <= 0]
        if autos and taken >= 100.0:
            # The explicit widths already claim the whole band, which left an auto slot
            # zero mm and silently dropped its content. Give each auto slot an equal
            # column's claim instead and scale the lot back to 100%, so every slot prints
            # and the explicit slots keep their ratio to each other.
            virtual = 100.0 / count
            claims = [pct if pct > 0 else virtual for pct in explicit]
            total = sum(claims)
            return [inner * pct / total for pct in claims]
        share = max(0.0, inner * (100.0 - taken) / 100.0) / len(autos) if autos else 0.0
        return [share if pct <= 0 else inner * pct / 100.0 for pct in explicit]

    def estimate_height(self, comp, width):
        """Rough printed height in mm.

        Used for ONE decision - whether a Columns band still fits on the page - and never
        for placement, so it is deliberately cheap: the true height of a component is only
        known once it has been drawn, and a table's row count only after its query runs.
        The raw text is measured rather than the resolved text, so estimating costs no
        expression evaluations and cannot fire a hook twice."""
        ctype = (comp.get("type") or "").lower()
        if ctype == "header":
            return 15.0 + (5.0 if comp.get("subText") else 0.0)
        if ctype in ("text", "value"):
            style = (comp.get("style") or "body").lower()
            line_h = 6.0 if style in ("h1", "h2") else 5.0
            char_mm = 3.0 if style == "h1" else (2.3 if style == "h2" else 1.7)
            per_line = max(1, int(width / char_mm))
            lines = 0
            for part in (comp.get("text") or "").split("\n"):
                lines += max(1, int(_math.ceil(len(part) / float(per_line))))
            return lines * line_h
        if ctype == "kpirow":
            return 21.0
        if ctype == "chart":
            try:
                return max(30.0, float(comp.get("height") or 55)) + 12.0
            except (TypeError, ValueError):
                return 67.0
        if ctype == "image":
            rel = (comp.get("path") or "").replace("\\", "/")
            if not rel:
                return 0.0
            try:
                pct = float(comp.get("imageWidth") or 0)
            except (TypeError, ValueError):
                pct = 0.0
            w_mm = width * min(100.0, pct) / 100.0 if pct > 0 else width
            full = os.path.join(_env_path("webroot"), *rel.split("/"))
            _, px_w, px_h, _ = _sniff_image(full) if os.path.isfile(full) else (None, None, None, None)
            aspect = (px_h / float(px_w)) if px_w and px_h else 0.5
            return w_mm * aspect + 2.0
        if ctype in ("table", "alarmlist", "eventlist"):
            try:
                rows = int(comp.get("maxRows") or 50)
            except (TypeError, ValueError):
                rows = 50
            # Capped on purpose: a 200-row table would estimate taller than the sheet and
            # push every band holding one onto a page of its own. Rows past the page end
            # are reported by the note columns_band prints.
            return (min(rows, 12) + 2) * 5.6 + 7.0
        if ctype == "spacer":
            try:
                return float(comp.get("spacerHeight") or 10) * 0.35
            except (TypeError, ValueError):
                return 3.5
        return 8.0

    def columns_band(self, comp, width=None):
        """Components side by side: each slot is a column rendered at its own width.

        Every child is drawn by the ordinary component renderer at the column's width, so
        a column holds anything a page holds (nesting a Columns band inside one is
        refused by validation, as is a footer).

        A band is drawn as ONE unit and does not split over two pages. fpdf breaks pages
        inside cell()/multi_cell(), which mid-column would put the rest of column 1 on the
        next page and start column 2 back on this one; automatic breaking is therefore off
        while the band renders - and with it self.reserve(), which returns False when
        automatic breaking is off. Instead the band is measured first (estimate_height)
        and moved to a fresh page when it does not fit, and anything that still runs past
        the page end is called out in print rather than silently dropped."""
        pdf = self.pdf
        slots = comp.get("slots") or []
        if not slots:
            return
        avail = width or self.content_width()
        widths = self.column_widths(slots, avail)

        estimate = 0.0
        for slot, w in zip(slots, widths):
            column = sum(self.estimate_height(child, w) for child in (slot.get("components") or []))
            estimate = max(estimate, column)
        self.reserve(estimate)

        auto_break = pdf.auto_page_break
        bottom_margin = pdf.b_margin
        pdf.set_auto_page_break(False, bottom_margin)

        left_x, top_y = pdf.get_x(), pdf.get_y()
        x = left_x
        deepest = top_y
        try:
            for slot, w in zip(slots, widths):
                if w <= 0:
                    continue
                pdf.set_xy(x, top_y)
                for child in (slot.get("components") or []):
                    ctype = (child.get("type") or "").lower()
                    if ctype in ("columns", "footer"):
                        continue
                    pdf.set_x(x)
                    self.render_component(child, w)
                deepest = max(deepest, pdf.get_y())
                x += w + self.COLUMN_GAP_MM
        finally:
            pdf.set_auto_page_break(auto_break, bottom_margin)

        # Past the bottom of the sheet the content is gone, so say so where the reader can
        # see it, and continue the report on a clean page.
        if auto_break and deepest > pdf.page_break_trigger:
            pdf.set_xy(left_x, pdf.page_break_trigger - 4.5)
            pdf.set_font("Arial", "", 7.5)
            pdf.set_text_color(200, 68, 58)
            # Filled: the note sits on top of the column content that ran past the margin,
            # which is exactly the text it is warning about.
            pdf.set_fill_color(255, 255, 255)
            pdf.cell(avail, 4.5, _latin1("Columns content does not fit on this page and is cut here."), 0, 1, "L", True)
            pdf.add_page(pdf.cur_orientation)
            pdf.set_xy(left_x, pdf.t_margin)
            return

        pdf.set_xy(left_x, deepest + 2)

    def alarm_or_event_list(self, comp, width=None):
        source = (comp.get("type") or "").lower()
        table_comp = dict(comp)
        table_comp["source"] = "alarms" if source == "alarmlist" else "events"
        table_comp.setdefault("columns", [])
        self.table(table_comp, width)

    # -- component dispatch -------------------------------------------------

    def render_component(self, comp, width=None):
        # A component with a period override renders against its own window; everything below
        # reads self.ctx, so swapping it here covers data, expressions and placeholders alike.
        report_ctx = self.ctx
        self.ctx = component_context(comp, report_ctx)
        try:
            self._render_component(comp, width)
        finally:
            self.ctx = report_ctx

    def _render_component(self, comp, width=None):
        ctype = (comp.get("type") or "").lower()
        if ctype == "header":
            self.header_block(comp, width)
        elif ctype in ("text", "value"):
            self.text_block(comp, width)
        elif ctype == "kpirow":
            self.kpi_row(comp, width)
        elif ctype == "chart":
            self.chart(comp, width)
        elif ctype == "table":
            self.table(comp, width)
        elif ctype in ("alarmlist", "eventlist"):
            self.alarm_or_event_list(comp, width)
        elif ctype == "image":
            self.image(comp, width)
        elif ctype == "columns":
            self.columns_band(comp, width)
        elif ctype == "spacer":
            self.pdf.ln(max(1.0, float(comp.get("spacerHeight") or 10) * 0.35))
        # footer components are handled per page (ReportPdf.footer)

    def render_page(self, page):
        pdf = self.pdf
        components = page.get("components") or []

        canvas = (page.get("layout") or "banded").lower() == "canvas"
        pdf.set_auto_page_break(not canvas, 18)
        pdf.add_page()

        # The footer texts are assigned AFTER add_page(): fpdf draws the footer of the
        # sheet being CLOSED inside add_page(), so assigning first stamped THIS template
        # page's footer onto the previous template page's last sheet. Sheets broken
        # automatically inside this page, and the final sheet at output time, still get
        # the values below.
        footer = next((c for c in components if (c.get("type") or "").lower() == "footer"), None)
        pdf.footer_left = resolve_text((footer or {}).get("text") or "", self.ctx)
        pdf.footer_right = resolve_text((footer or {}).get("subText") or "", self.ctx)

        if not canvas:
            for comp in components:
                if (comp.get("type") or "").lower() == "footer":
                    continue
                self.render_component(comp)
            return

        scale = _px_to_mm(pdf)
        for comp in sorted(components, key=lambda c: (c.get("y") or 0)):
            if (comp.get("type") or "").lower() == "footer":
                continue
            x_mm = (comp.get("x") or 0) * scale
            y_mm = (comp.get("y") or 0) * scale
            w_mm = (comp.get("w") or 0) * scale
            if w_mm <= 5:
                w_mm = self.content_width()
            pdf.set_xy(max(pdf.l_margin, x_mm), max(pdf.t_margin, y_mm))
            self.render_component(comp, w_mm)


# ---------------------------------------------------------------------------
# Excel rendering (openpyxl)
# ---------------------------------------------------------------------------

def _excel_number_format(spec):
    """Map the common Python format specs the designer produces onto Excel number
    formats. Unknown specs return None (general formatting), never an error."""
    if not spec:
        return None
    m = re.match(r"^(,)?\.(\d+)f$", spec.strip())
    if m:
        decimals = int(m.group(2))
        base = "#,##0" if m.group(1) else "0"
        return base + ("." + "0" * decimals if decimals else "")
    if spec.strip() == ",":
        return "#,##0"
    return None


def _render_xlsx(template, ctx, hook_module, out_path, accent_hex):
    # ctx is rebound per component below (period overrides), so the run's own context is kept
    # separately for the footer and anything else that must stay on the report period.
    base_ctx = ctx

    from openpyxl import Workbook
    from openpyxl.chart import AreaChart, BarChart, LineChart, Reference
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter

    wb = Workbook()
    wb.remove(wb.active)
    accent_argb = "FF" + accent_hex.lstrip("#").upper()
    head_fill = PatternFill("solid", fgColor=accent_argb)
    head_font = Font(bold=True, color="FFFFFFFF")
    title_font = Font(bold=True, size=14)
    label_font = Font(bold=True, size=9, color="FF6B7B8B")
    callout_fill = PatternFill("solid", fgColor="FFF4F8FB")
    group_fill = PatternFill("solid", fgColor="FFEEF6FA")
    bold = Font(bold=True)

    size = (template.get("pageSize") or "A4").lower()
    landscape = (template.get("orientation") or "portrait").lower() == "landscape"

    for p, page in enumerate(template.get("pages") or []):
        ws = wb.create_sheet("Page %d" % (p + 1))
        ws.sheet_view.showGridLines = False
        # Mirror the PDF page setup so printing the sheet matches the PDF.
        ws.page_setup.orientation = "landscape" if landscape else "portrait"
        ws.page_setup.paperSize = 1 if size == "letter" else 9  # 1 = Letter, 9 = A4
        row = 2

        # The PDF prints the FIRST footer of a page; take the same one instead of letting
        # a later footer overwrite it.
        page_components = page.get("components") or []
        first_footer = next((c for c in page_components if (c.get("type") or "").lower() == "footer"), None)
        if first_footer is not None:
            # '&' is the header/footer control character in Excel ("R&D" printed "R" plus
            # the current date); escape it BEFORE the {Page}/{Pages} codes are put in.
            left = resolve_text(first_footer.get("text") or "", base_ctx).replace("&", "&&")
            ws.oddFooter.left.text = left.replace("{Page}", "&P").replace("{Pages}", "&N")
            right = resolve_text(first_footer.get("subText") or "", base_ctx).replace("&", "&&")
            ws.oddFooter.right.text = right.replace("{Page}", "&P").replace("{Pages}", "&N")

        for comp in page_components:
            ctype = (comp.get("type") or "").lower()
            # Same rule as the PDF: a component with a period override reads its own window.
            ctx = component_context(comp, base_ctx)

            if ctype == "header":
                ws.cell(row, 2, resolve_text(comp.get("text") or "", ctx)).font = title_font
                sub = resolve_text(comp.get("subText") or "", ctx)
                if sub:
                    row += 1
                    ws.cell(row, 2, sub).font = Font(size=9, color="FF5B6B7B")
                row += 2

            elif ctype in ("text", "value"):
                cell = ws.cell(row, 2, resolve_text(comp.get("text") or "", ctx))
                # Lowercased like the PDF renderer; a hand-written "H1" must bold in both.
                style = (comp.get("style") or "").lower()
                if style in ("h1", "h2"):
                    cell.font = bold
                elif style == "callout":
                    cell.fill = callout_fill
                row += 2

            elif ctype == "kpirow":
                col = 2
                any_compare = False
                for tile in comp.get("tiles") or []:
                    value, prev = resolve_binding(tile.get("binding"), ctx, tile.get("compare"))
                    ws.cell(row, col, tile.get("label") or "").font = label_font
                    n = _num(value)
                    vcell = ws.cell(row + 1, col, n if n is not None else str(value or ""))
                    vcell.font = Font(bold=True, size=12)
                    fmt = _excel_number_format(tile.get("format"))
                    if fmt and n is not None:
                        vcell.number_format = fmt
                    if tile.get("units"):
                        ws.cell(row + 1, col + 1, tile.get("units")).font = Font(size=9, color="FF6B7B8B")
                    # Same comparison the PDF prints: delta vs the previous period.
                    if tile.get("compare") and prev not in (None, 0):
                        pnum = _num(prev)
                        if n is not None and pnum not in (None, 0):
                            delta = (n - pnum) / abs(pnum) * 100.0
                            up = delta >= 0
                            dcell = ws.cell(row + 2, col, "%+.1f%% vs previous period" % delta)
                            dcell.font = Font(size=8, color="FF2F9D5F" if up else "FFC8443A")
                            any_compare = True
                    col += 2
                row += 4 if any_compare else 3

            elif ctype == "chart":
                series_defs = comp.get("series") or []
                resample = comp.get("resample") or "1h"
                title = resolve_text(comp.get("text") or "", ctx)
                data_start = row + 1
                ws.cell(row, 2, title or "Chart").font = bold

                if not any((s.get("variable") or "").strip() for s in series_defs):
                    ws.cell(data_start, 2, "Chart not configured (no series)")
                    row = data_start + 2
                    continue

                # data block: first column = timestamp, one column per series
                all_series = []
                for s in series_defs:
                    try:
                        pts = hist_series(s.get("variable") or "", ctx.period_start, ctx.period_end, resample)
                    except Exception:
                        pts = []
                    all_series.append((s, pts))
                stamps = sorted({ts for _, pts in all_series for ts, _ in pts})
                stamp_index = {ts: i for i, ts in enumerate(stamps)}
                ws.cell(data_start, 2, "Time").font = bold
                for si, (s, _pts) in enumerate(all_series):
                    ws.cell(data_start, 3 + si, s.get("label") or s.get("variable") or "").font = bold
                for ts in stamps:
                    ws.cell(data_start + 1 + stamp_index[ts], 2, ts.strftime("%Y-%m-%d %H:%M"))
                for si, (_s, pts) in enumerate(all_series):
                    for ts, v in pts:
                        ws.cell(data_start + 1 + stamp_index[ts], 3 + si, v)

                if stamps and all_series:
                    chart_type = (comp.get("chartType") or "").lower()
                    chart = {"bar": BarChart, "area": AreaChart}.get(chart_type, LineChart)()
                    chart.title = title or None
                    # Template chart height is millimetres; openpyxl sizes in cm.
                    height_mm = max(30.0, float(comp.get("height") or 55))
                    chart.height = height_mm / 10.0
                    chart.width = 20
                    data = Reference(ws, min_col=3, max_col=2 + len(all_series),
                                     min_row=data_start, max_row=data_start + len(stamps))
                    cats = Reference(ws, min_col=2, min_row=data_start + 1, max_row=data_start + len(stamps))
                    chart.add_data(data, titles_from_data=True)
                    chart.set_categories(cats)
                    # Honor per-series colors like the PDF does.
                    for si, (s, _pts) in enumerate(all_series):
                        color = (s.get("color") or "").lstrip("#")
                        if len(color) == 6 and si < len(chart.series):
                            try:
                                if chart_type in ("bar", "area"):
                                    chart.series[si].graphicalProperties.solidFill = color.upper()
                                else:
                                    chart.series[si].graphicalProperties.line.solidFill = color.upper()
                            except Exception:
                                pass
                    ws.add_chart(chart, "%s%d" % (get_column_letter(4 + len(all_series)), data_start))
                if not stamps:
                    # The PDF prints a note in the empty frame; a bare "Time" header with
                    # nothing under it reads like a broken export.
                    ws.cell(data_start + 1, 2, "No samples in period")
                row = data_start + len(stamps) + 3

            elif ctype in ("table", "alarmlist", "eventlist"):
                table_comp = dict(comp)
                if ctype == "alarmlist":
                    table_comp["source"] = "alarms"
                    table_comp.setdefault("columns", [])
                elif ctype == "eventlist":
                    table_comp["source"] = "events"
                    table_comp.setdefault("columns", [])
                title = resolve_text(comp.get("text") or "", ctx)
                if title:
                    ws.cell(row, 2, title).font = bold
                    row += 1

                if (table_comp.get("source") or "sqlite").lower() == "sqlite" \
                        and (not (table_comp.get("database") or "").strip() or not (table_comp.get("query") or "").strip()):
                    ws.cell(row, 2, "Table not configured (database/query missing)")
                    row += 2
                    continue

                try:
                    table = build_table(table_comp, ctx, hook_module)
                except Exception as ex:
                    ws.cell(row, 2, "Table error: %s" % ex)
                    row += 2
                    continue

                header_row = row
                for i, h in enumerate(table.headers):
                    cell = ws.cell(header_row, 2 + i, h)
                    cell.fill = head_fill
                    cell.font = head_font

                column_formats = [_excel_number_format(f) for f in table.formats]

                # Same group heading rows as the PDF. Formulas stay correct because the
                # summary uses the full data range and group rows carry no numbers.
                gi = table.group_index
                current_group = object()
                out_row = header_row + 1
                for data_row in table.rows:
                    if gi is not None and data_row[gi] != current_group:
                        current_group = data_row[gi]
                        gcell = ws.cell(out_row, 2, str(current_group))
                        gcell.font = bold
                        gcell.fill = group_fill
                        out_row += 1
                    for i, value in enumerate(data_row):
                        n = _num(value)
                        cell = ws.cell(out_row, 2 + i, n if (table.numeric[i] and n is not None) else
                                       ("" if value is None else str(value)))
                        if column_formats[i] and table.numeric[i] and n is not None:
                            cell.number_format = column_formats[i]
                    out_row += 1
                row = out_row

                if table.summary_excel:
                    for i, entry in enumerate(table.summary_excel):
                        if entry is None:
                            continue
                        col_letter = get_column_letter(2 + i)
                        cell = ws.cell(row, 2 + i)
                        kind, payload = entry
                        if kind == "formula" and len(table.rows) > 0:
                            # COUNTA, not COUNT: the PDF counts rows, and COUNT() counts
                            # numeric cells only - 0 on a text column like Message.
                            fn = {"sum": "SUM", "avg": "AVERAGE", "min": "MIN", "max": "MAX", "count": "COUNTA"}.get(payload, "SUM")
                            cell.value = "=%s(%s%d:%s%d)" % (fn, col_letter, header_row + 1, col_letter, row - 1)
                        else:
                            n = _num(payload)
                            cell.value = n if n is not None else str(payload)
                        if column_formats[i]:
                            cell.number_format = column_formats[i]
                        cell.font = bold
                    ws.cell(row, 2).font = bold
                    row += 1
                row += 2

            elif ctype == "image":
                rel = (comp.get("path") or "").replace("\\", "/")
                full = os.path.join(_env_path("webroot"), *rel.split("/")) if rel else ""
                if rel and ".." not in rel and os.path.isfile(full):
                    try:
                        from openpyxl.drawing.image import Image as _XlImage
                        img = _XlImage(full)
                        # A sheet has no page width, so the PDF's content width maps onto a
                        # nominal 1080px: the default (no width set) then still caps at the
                        # ~360px this always used, which is the same third of the width the
                        # PDF prints. A set percentage scales the picture up as well as down.
                        try:
                            pct = float(comp.get("imageWidth") or 0)
                        except (TypeError, ValueError):
                            pct = 0.0
                        target = min(100.0, pct) * 10.8 if pct > 0 else 360.0
                        if img.width and (img.width > target or pct > 0):
                            ratio = target / img.width
                            img.width = int(target)
                            img.height = int(img.height * ratio)
                        ws.add_image(img, "B%d" % row)
                        row += max(2, int((img.height or 60) / 18) + 1)
                    except Exception:
                        ws.cell(row, 2, rel)
                        row += 2
                elif rel:
                    ws.cell(row, 2, "Image not found: %s" % rel)
                    row += 2

            elif ctype == "spacer":
                # ~18px per sheet row, same visual rhythm as the PDF's 0.35 mm/px factor.
                row += max(1, int(round(float(comp.get("spacerHeight") or 10) / 18.0)))

            # footer handled above (first footer per page)

        for col in range(2, 12):
            ws.column_dimensions[get_column_letter(col)].width = 16

    wb.save(out_path)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def _resolve_output_dir(output_path):
    """Destination folder for the rendered files. Mirrors ReportService.ResolveOutputDirectory.

    Empty     -> the project folder's Reports subfolder (the default).
    Full path -> used as given (a local drive or a plant network share). Configuring one is
                 an Administrator action on the Reports page or through the config API.

    Nothing else is accepted: ValidateOutputPath refuses a relative destination on write, so a
    stored value that is not a full path can only come from a hand-edited database. It renders
    into the default folder with a note in the run output, rather than being silently placed
    somewhere inside the project folder.
    """
    default_dir = _env_path("reportsoutput")
    path = (output_path or "").strip()
    if not path:
        return default_dir

    path = path.replace("\\", "/")
    if os.path.isabs(path) or re.match(r"^[A-Za-z]:/", path) or path.startswith("//"):
        return os.path.normpath(path)

    print("Report output path '%s' is not a full path; using the default Reports folder." % output_path)
    return default_dir


def _preview_context(name):
    """(template, ctx) for a preview: the report's stored template over its resolved period, with
    the template's own parameter defaults. Shared by the two preview entry points so a preview can
    never resolve against a different context than its sibling.

    The hook is NOT run here - whether it should be is the caller's decision, because it is the
    difference between a designer preview (runs it, so {Expr.*} is real) and a dialog preview that
    fires on a keystroke (must not run project code)."""
    template, _, _ = load_template(name)
    start_local, end_local = _resolve_period(template)
    params = {str(k): str(v) for k, v in (template.get("parameters") or {}).items()}
    return template, ReportContext(name, template, start_local, end_local, params)


def preview_file_name(name, pattern):
    """Resolve a file name pattern for the Reports page preview and print the result as JSON.

    The hook script is deliberately NOT run here, unlike evaluate_preview: this fires while an
    engineer types in a dialog, and prepare_report(ctx) may write values or take real time. So
    {Expr.*} resolves empty in the preview and the dialog says so, which is the honest trade for
    never having a keystroke run project code.

    An empty pattern previews the built-in naming, which is what an empty field produces."""
    result = {"ok": True, "fileName": "", "hasExcel": False, "error": ""}
    try:
        template, ctx = _preview_context(name)
        result["fileName"] = resolve_file_name(pattern, ctx)
        result["hasExcel"] = bool(template.get("excelCompatible"))
    except Exception as ex:
        result["ok"] = False
        result["error"] = "%s: %s" % (type(ex).__name__, ex)

    print(json.dumps(result))
    return result


def evaluate_preview(name, text, mode="text"):
    """Resolve one designer field against the report's current period and print the result as
    JSON, so the Report Designer can show what a text or an expression produces without
    rendering the whole report.

    mode "text"       -> resolve_text: every {Token} and {= expression } in a free-text field.
    mode "expression" -> eval_expression on one whole expression, reporting its Python type,
                         which is what tells the author a KPI binding will keep its Format.

    The hook script's prepare_report(ctx) runs first when the template names one, exactly as a
    render does, because {Expr.*} values are otherwise blank and the preview would mislead.
    Nothing is written: this only reads the template, the historian and live values."""
    result = {"ok": True, "value": "", "type": "", "error": ""}
    try:
        template, ctx = _preview_context(name)

        hook_name = template.get("hookScript") or ""
        if hook_name:
            try:
                hook_module = importlib.import_module(hook_name)
                prepare = getattr(hook_module, "prepare_report", None)
                if prepare:
                    prepare(ctx)
            except Exception as ex:
                # A broken hook must not hide the field's own result; {Expr.*} simply stays empty.
                result["error"] = "Hook script '%s' failed: %s" % (hook_name, ex)

        if (mode or "text").lower() == "expression":
            match = _EXPR_RE.fullmatch((text or "").strip())
            if not match:
                result["ok"] = False
                result["error"] = ("This field must hold one whole {= expression }."
                                   if (text or "").strip() else "Nothing to evaluate.")
            elif re.search(r"\b(Row|Values|Raw)\b", match.group(1)):
                # Row exists per table row and Values/Raw per column, so there is nothing to bind
                # them to outside a render. Saying so beats a bare "name 'Row' is not defined".
                result["ok"] = False
                result["error"] = ("Row, Values and Raw only exist while a table is being built, "
                                   "so this expression can only be checked by running the report.")
            else:
                ok, value = eval_expression(match.group(1), ctx)
                result["ok"] = ok
                if ok:
                    result["value"] = _expr_text(value)
                    result["type"] = type(value).__name__
                else:
                    result["error"] = value
        else:
            result["value"] = resolve_text(text or "", ctx)
    except Exception as ex:
        result["ok"] = False
        result["error"] = "%s: %s" % (type(ex).__name__, ex)

    print(json.dumps(result))
    return result


# {Report.Start:%Y%m%d_%H%M} and friends. A separate pass because _TOKEN_RE's character class
# excludes ':' and '%', so a strftime spec cannot be an ordinary placeholder.
_FILENAME_STRFTIME_RE = re.compile(r"\{Report\.(Start|End|Generated):([^{}]+)\}")

_FILENAME_DEFAULT = "{Report.Name}_{Report.Day}"


def _safe_file_base(text):
    """The file-name sanitizer. Mirrored in C# by PythonScriptEngine.SafeReportFileBase."""
    safe = re.sub(r"[^A-Za-z0-9_\-\.\(\) ]", "_", text or "").strip()
    return safe or "Report"


def resolve_file_name(pattern, ctx):
    """Base file name (no extension) for a report's rendered output.

    Empty pattern -> the built-in "<Name>_<period start>". Otherwise the pattern goes through the
    same placeholder machinery as a text component - {Report.*}, {Param.*}, {Expr.*}, a variable
    name, {= expression } - plus a strftime spec on the typed period, e.g.
    {Report.Start:%Y%m%d_%H%M}.

    The result is forced to start with the sanitized report name. ValidateFileNamePattern already
    requires the pattern to, but the guarantee is re-established here because the Reports page
    Files list identifies a report's files by exactly that prefix, so a hand-edited database cannot
    produce output the report itself can no longer show."""
    text = (pattern or "").strip() or _FILENAME_DEFAULT

    def _strftime(match):
        which, spec = match.group(1), match.group(2)
        when = {"Start": ctx.period_start, "End": ctx.period_end}.get(which) or _dt.datetime.now()
        try:
            return when.strftime(spec)
        except Exception:
            return ""

    resolved = _safe_file_base(resolve_text(_FILENAME_STRFTIME_RE.sub(_strftime, text), ctx))

    # ValidateFileNamePattern rejects a pattern that ENDS in .pdf/.xlsx, but an extension can
    # still arrive through a placeholder ({Param.Suffix} = ".pdf"), which validation cannot see
    # because it only resolves at render time. Strip it rather than write "Report.pdf.pdf".
    for extension in (".pdf", ".xlsx"):
        if resolved.lower().endswith(extension):
            resolved = _safe_file_base(resolved[:-len(extension)])
            break

    required = _safe_file_base(ctx.name) + "_"
    if not resolved.lower().startswith(required.lower()):
        print("Report file name '%s' does not start with '%s'; prefixed so the Files list still "
              "recognises it." % (resolved, required))
        resolved = required + resolved

    return resolved


def load_template(name):
    """Returns (template dict, output path, file name pattern). The destination and the naming are
    the report's own OutputPath/FileNamePattern columns, not template fields: they are edited on the
    Reports page and apply to the report as a whole, so a template exported to another system does
    not carry a foreign folder or naming."""
    con = _open_ro(_env_path("config"))
    try:
        cur = con.cursor()
        cur.execute("SELECT TemplateJson, OutputPath, FileNamePattern FROM Reports WHERE Name = ?", (name,))
        row = cur.fetchone()
    finally:
        con.close()
    if not row or not row[0]:
        raise ValueError("Report '%s' not found in the configuration database" % name)
    return json.loads(row[0]), (row[1] or ""), (row[2] or "")


def run(name, period_start=None, period_end=None, params=None):
    """Render report <name>.

    period_start/period_end ('YYYY-MM-DD HH:MM:SS') override the template period, e.g. to
    regenerate a report for a past day. params is a dict of per-run parameter values that
    override the template's parameter defaults; the merged set is available as {Param.key}
    placeholders, as SQL parameters in sqlite queries, and as ctx.params in hooks."""
    template, output_path, file_name_pattern = load_template(name)
    start_local, end_local = _resolve_period(template, period_start, period_end)

    merged_params = {str(k): str(v) for k, v in (template.get("parameters") or {}).items()}
    for k, v in (params or {}).items():
        merged_params[str(k)] = str(v)

    ctx = ReportContext(name, template, start_local, end_local, merged_params)

    hook_module = None
    hook_name = template.get("hookScript") or ""
    if hook_name:
        hook_module = importlib.import_module(hook_name)
        prepare = getattr(hook_module, "prepare_report", None)
        if prepare:
            prepare(ctx)

    out_dir = _resolve_output_dir(output_path)
    os.makedirs(out_dir, exist_ok=True)
    # Resolved AFTER the hook has run, so a pattern may use {Expr.*} values it computed.
    file_base = resolve_file_name(file_name_pattern, ctx)
    accent_hex = template.get("accentColor") or "#2596BE"
    accent = _hex_rgb(accent_hex)

    pdf = _make_pdf(template)
    renderer = PdfRenderer(pdf, ctx, hook_module, accent)
    for page in template.get("pages") or []:
        renderer.render_page(page)
    pdf_path = os.path.join(out_dir, file_base + ".pdf")
    pdf.output(pdf_path, "F")

    outputs = [pdf_path]
    if template.get("excelCompatible"):
        xlsx_path = os.path.join(out_dir, file_base + ".xlsx")
        _render_xlsx(template, ctx, hook_module, xlsx_path, accent_hex)
        # openpyxl saves through zipfile/io.open, which the preview write-recorder does not
        # patch; a no-op builtins.open touch makes the file visible to the Preview tab.
        try:
            with open(xlsx_path, "ab"):
                pass
        except OSError:
            pass
        outputs.append(xlsx_path)

    print("Report '%s' rendered: %s" % (name, ", ".join(os.path.basename(p) for p in outputs)))
    return outputs
