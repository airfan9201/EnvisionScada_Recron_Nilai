// Electronic signature client flow (21 CFR Part 11 subpart C, F19 Phase 2).
// Works together with Pages/Shared/_SignatureModalPartial.cshtml. Signature-gated handlers
// answer { signatureRequired: true, actionKey, meanings }; callers then use
// EnvisionSignature.request(...) to collect the signature (re-authentication via
// POST /API/Signature/Verify) and retry the original request with the X-Signature-Token header.
// No external dependencies beyond the Bootstrap bundle already shipped with the application.
window.EnvisionSignature = (function () {

    var pending = null; // { resolve, reject, actionKey }
    var initialized = false;

    function modalEl() {
        return document.getElementById('SignatureModal');
    }

    function ensureInitialized() {
        var el = modalEl();
        if (!el || initialized) { return el; }
        initialized = true;

        // Cancel / close rejects the pending request so callers can restore their UI state.
        el.addEventListener('hidden.bs.modal', function () {
            if (pending) {
                var p = pending;
                pending = null;
                p.reject(new Error('Signature cancelled'));
            }
        });

        // Enter in the password field signs directly.
        var password = document.getElementById('SignatureModalPassword');
        if (password) {
            password.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sign();
                }
            });
        }

        return el;
    }

    function showError(message) {
        var errorEl = document.getElementById('SignatureModalError');
        if (errorEl) {
            errorEl.textContent = message || 'Error';
            errorEl.style.display = 'block';
        }
    }

    function hideError() {
        var errorEl = document.getElementById('SignatureModalError');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    }

    // Opens the signature dialog for the given action key. Resolves with the single-use token,
    // rejects when the user cancels or the modal is unavailable on the page.
    function request(actionKey, meanings) {
        return new Promise(function (resolve, reject) {
            var el = ensureInitialized();
            if (!el) {
                reject(new Error('Signature dialog is not available on this page.'));
                return;
            }

            document.getElementById('SignatureModalUserName').value = el.getAttribute('data-username') || '';
            document.getElementById('SignatureModalPassword').value = '';
            document.getElementById('SignatureModalComment').value = '';
            hideError();

            var list = (meanings && meanings.length) ? meanings : [];
            if (!list.length) {
                try { list = JSON.parse(el.getAttribute('data-meanings') || '[]'); } catch (e) { list = []; }
            }

            var select = document.getElementById('SignatureModalMeaning');
            select.innerHTML = '';
            list.forEach(function (meaning) {
                var option = document.createElement('option');
                option.value = meaning;
                option.textContent = meaning;
                select.appendChild(option);
            });

            pending = { resolve: resolve, reject: reject, actionKey: actionKey };

            bootstrap.Modal.getOrCreateInstance(el).show();

            setTimeout(function () {
                var password = document.getElementById('SignatureModalPassword');
                if (password) { password.focus(); }
            }, 300);
        });
    }

    // Sign button: verify the credentials and resolve the pending request with the token.
    function sign() {
        if (!pending) { return; }

        var body = {
            userName: document.getElementById('SignatureModalUserName').value,
            password: document.getElementById('SignatureModalPassword').value,
            meaning: document.getElementById('SignatureModalMeaning').value,
            comment: document.getElementById('SignatureModalComment').value,
            actionKey: pending.actionKey
        };

        fetch('/API/Signature/Verify', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(function (response) {
            return response.json().then(function (data) { return { ok: response.ok, data: data }; });
        })
        .then(function (result) {
            if (result.ok && result.data && result.data.token) {
                var p = pending;
                pending = null; // clear before hide so hidden.bs.modal does not reject
                document.getElementById('SignatureModalPassword').value = '';
                var instance = bootstrap.Modal.getInstance(modalEl());
                if (instance) { instance.hide(); }
                p.resolve(result.data.token);
                return;
            }
            showError((result.data && result.data.error) || 'Signature verification failed.');
        })
        .catch(function () {
            showError('Signature verification failed.');
        });
    }

    // fetch() wrapper: performs the request, and when the JSON answer carries
    // { signatureRequired: true } it collects a signature and retries once with the token header.
    function fetchWithSignature(url, options, actionKey) {
        options = options || {};

        return fetch(url, options).then(function (response) {
            return response.clone().json()
                .catch(function () { return null; })
                .then(function (data) {
                    if (!data || !data.signatureRequired) {
                        return response;
                    }

                    return request(data.actionKey || actionKey, data.meanings).then(function (token) {
                        var retryOptions = Object.assign({}, options);
                        retryOptions.headers = Object.assign({}, options.headers || {});
                        retryOptions.headers['X-Signature-Token'] = token;
                        return fetch(url, retryOptions);
                    });
                });
        });
    }

    return {
        request: request,
        sign: sign,
        fetchWithSignature: fetchWithSignature
    };
})();
