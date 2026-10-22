# SystemPythonLibraries

Application-owned Python code shipped with EnvisionSCADA. The build copies this folder next to the binaries (`<output>/SystemPythonLibraries`, see the `Content` glob in ENVISION.csproj), and PythonScriptEngine puts it on `sys.path` at engine init, so everything here is importable from every Python script and from the report renderer on every install, offline, without pip.

This is NOT the content-root `PythonLibraries` folder. That one is project-owned (user-uploaded libraries: cleared by ResetProjectDirectories and replaced by project transfers) and takes precedence on `sys.path`, so a project can override any library shipped here with its own version. Full precedence: project `PythonLibraries` > `SystemPythonLibraries` > machine site-packages.

## Contents

- `envision_report.py` - the Report Designer renderer (our own code).
- Vendored third-party pure-Python packages, copied verbatim from PyPI releases with their `.dist-info` (version metadata + license texts):

| Package | Version | License |
| --- | --- | --- |
| certifi | 2024.8.30 | MPL 2.0 |
| charset_normalizer | 3.4.0 | MIT |
| et_xmlfile | 2.0.0 | MIT |
| fpdf (PyFPDF) | 1.7.2 | LGPL 3.0 |
| idna | 3.10 | BSD 3-Clause |
| openpyxl | 3.1.5 | MIT |
| requests | 2.33.1 | Apache 2.0 |
| urllib3 | 2.2.3 | MIT |
| xlsxwriter | 3.2.9 | BSD 2-Clause |

These are also listed on the EnvisionPortal Attributions page.

## Why these packages

- fpdf, openpyxl and et_xmlfile are imported by `envision_report.py` (the report renderer).
- requests with its dependency chain (certifi, urllib3, idna, charset_normalizer) and xlsxwriter are not imported by shipped code. They are bundled for customer/user Python scripts on offline installations, where pip is unavailable and LAN HTTP calls and direct Excel writing are common script needs.
- certifi's CA bundle ages; refresh it with the normal package-refresh procedure below.

## Rules

- Pure Python only. No `.pyd`/`.so` files: compiled extensions are bound to one exact Python build and would break silently on a Python upgrade (the charset_normalizer mypyc speedup is deliberately stripped; the package falls back to its pure implementation). Packages with required C extensions (Pillow, numpy, ...) do not belong here.
- Do not modify vendored package code. fpdf is LGPL: it must remain replaceable as-is (it is - drop a different version in the project `PythonLibraries` folder and it wins).
- Changes here need an application restart to take effect (modules are cached in `sys.modules` and the output copy is only refreshed by a build).

## Refreshing a package

1. `py -3.11 -m pip download <package>==<version> --no-deps -d <tmp>` and unzip the `py3-none-any` wheel, or install to a `--target` staging folder.
2. Replace the package folder and its `<package>-<version>.dist-info` here; delete any `__pycache__`, `.pyd`, `.so`.
3. Update the table above and the EnvisionPortal Attributions page.
4. Run the report renderer and an `import` smoke test with `python -S` (no site-packages) to prove the vendored copy stands alone.
