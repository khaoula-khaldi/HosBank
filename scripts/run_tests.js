const http = require('http');
const qs = require('querystring');

function request(opts, body, cookies) {
    return new Promise((resolve, reject) => {
        const postData = body ? qs.stringify(body) : '';
        const options = {
            hostname: 'localhost', port: 3000,
            path: opts.path, method: opts.method || 'GET',
            headers: {
                ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) } : {}),
                ...(cookies ? { Cookie: cookies } : {})
            }
        };
        const req = http.request(options, res => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

function getCookies(h) {
    const sc = h['set-cookie'];
    if (!sc) return '';
    return sc.map(c => c.split(';')[0]).join('; ');
}

function R(test, pass, detail) {
    const icon = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} | ${test} | ${JSON.stringify(detail)}`);
}

async function runTests() {
    // T3: Unauthenticated -> redirect to /auth/login
    let r = await request({ path: '/client/dashboard' });
    R('T3 Unauthenticated->redirect', r.status === 302 && r.headers.location === '/auth/login', { status: r.status, loc: r.headers.location });

    // T7: Invalid credentials -> generic error message
    r = await request({ path: '/auth/login', method: 'POST' }, { email: 'nobody@hosbank.com', password: 'wrong' });
    R('T7 Invalid credentials->generic error', r.status === 200 && r.body.includes('Email ou mot de passe incorrect'), { status: r.status });

    // T8: Inactive account -> refused (any error on login page)
    r = await request({ path: '/auth/login', method: 'POST' }, { email: 'inactive@hosbank.com', password: 'Inactive1234!' });
    R('T8 Inactive account->refused', r.status === 200 && (r.body.includes('Email ou mot de passe incorrect') || r.body.includes('compte est d')), { status: r.status });

    // T1: Valid client login -> redirect to /client/dashboard
    r = await request({ path: '/auth/login', method: 'POST' }, { email: 'client@hosbank.com', password: 'Client1234!' });
    const clientCookies = getCookies(r.headers);
    R('T1 Client login->redirect', r.status === 302 && r.headers.location === '/client/dashboard', { status: r.status, loc: r.headers.location, hasCookie: !!clientCookies });

    // T2: Client dashboard loads 200 with session
    if (clientCookies) {
        const dash = await request({ path: '/client/dashboard' }, null, clientCookies);
        R('T2 Client dashboard->200', dash.status === 200, { status: dash.status });
    }

    // T4: CHARGE_CLIENT -> 403 on /client/dashboard
    r = await request({ path: '/auth/login', method: 'POST' }, { email: 'charge@hosbank.com', password: 'Charge1234!' });
    const chargeCookies = getCookies(r.headers);
    R('T4 Charge login->redirect', r.status === 302, { status: r.status, loc: r.headers.location });
    if (chargeCookies) {
        const cd = await request({ path: '/client/dashboard' }, null, chargeCookies);
        R('T4 Charge->client dashboard->403', cd.status === 403, { status: cd.status });
    }

    // T5: ADMIN -> 403 on /client/dashboard
    r = await request({ path: '/auth/login', method: 'POST' }, { email: 'admin@hosbank.com', password: 'Admin1234!' });
    const adminCookies = getCookies(r.headers);
    R('T5 Admin login->redirect', r.status === 302, { status: r.status, loc: r.headers.location });
    if (adminCookies) {
        const ad = await request({ path: '/client/dashboard' }, null, adminCookies);
        R('T5 Admin->client dashboard->403', ad.status === 403, { status: ad.status });
    }

    // T6: Logout then dashboard -> redirect to login
    await request({ path: '/auth/logout', method: 'POST' }, {}, clientCookies);
    const afterLogout = await request({ path: '/client/dashboard' }, null, clientCookies);
    R('T6 Logout->dashboard->redirect', afterLogout.status === 302 && afterLogout.headers.location === '/auth/login', { status: afterLogout.status, loc: afterLogout.headers.location });
}

runTests().catch(e => console.error('FATAL:', e.message));
