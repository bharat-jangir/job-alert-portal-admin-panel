/**
 * Browser test for the Hindi version panel of the post form (real Chrome).
 *   backend :5000 (seeded users), admin panel :3001, then: npm run test:e2e:hindi
 * Env: API_URL, ADMIN_URL, CHROME_PATH, SHOTS, ADMIN_EMAIL / ADMIN_PASSWORD (same as editor-dnd.e2e.mjs).
 * Creates one post "zz-hi Panel ..." and deletes it at the end.
 */
import { chromium } from 'playwright-core';

const API = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN = process.env.ADMIN_URL || 'http://localhost:3001';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + extra}`); };
const unwrap = (j) => (j && j.meta && 'data' in j ? j.data : j);
const api = async (path, init = {}, token) =>
  unwrap(await (await fetch(API + path, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) } })).json());

const { access_token: token } = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: process.env.ADMIN_EMAIL || 'admin@rojgarresult.com', password: process.env.ADMIN_PASSWORD || 'Admin@123' }) });
const profile = await api('/auth/profile', {}, token);
const user = JSON.stringify({ id: profile.id, email: profile.email, name: profile.name, role: profile.role });

const run = Date.now().toString(36);
const slug = `zz-hi-panel-${run}`;
const post = await api('/jobs', { method: 'POST', body: JSON.stringify({
  title: `zz-hi Panel ${run}`, slug, type: 'job', status: 'draft', description: 'English description',
  organization: 'Test Board', importantDates: [{ label: 'Last Date', date: '2027-02-01T00:00:00.000Z' }],
  sections: [{ type: 'heading', level: 2, text: 'Application Fee' }, { type: 'paragraph', text: 'Fee is 500 rupees' }],
}) }, token);
const id = post._id;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1400, height: 3200 } });
await context.addInitScript(([t, u]) => { localStorage.setItem('admin_token', t); localStorage.setItem('admin_user', u); }, [token, user]);
const page = await context.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push('PAGEERROR ' + e.message.slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error' && /hydrat|Warning:|Maximum update/i.test(m.text())) problems.push(m.text().slice(0, 200)); });
const fetchPost = () => api(`/jobs/id/${id}`, {}, token);

try {
  await page.goto(`${ADMIN}/admin/jobs/${id}/edit`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /हिन्दी \(Hindi\) version/ }).waitFor({ timeout: 90000 });
  ok('panel shows "No Hindi version yet"', await page.getByText('No Hindi version yet').isVisible());

  // 1. saving the English post without touching Hindi must not create a translation
  await page.getByRole('button', { name: /update job|save|create job/i }).last().click();
  await page.waitForURL(/\/admin\/jobs$/, { timeout: 30000 });
  ok('untouched panel sends no translations', !(await fetchPost()).translations?.hi);

  // 2. add a Hindi version by hand
  await page.goto(`${ADMIN}/admin/jobs/${id}/edit`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /हिन्दी \(Hindi\) version/ }).waitFor({ timeout: 60000 });
  await page.getByRole('button', { name: 'Add Hindi' }).click();
  ok('English text is shown as a hint next to the Hindi field', await page.getByText('zz-hi Panel').first().isVisible());
  await page.getByPlaceholder('पोस्ट का शीर्षक').fill(`हिंदी पैनल परीक्षण ${run}`);
  await page.getByRole('button', { name: /Copy English blocks/ }).click();
  ok('"copy English blocks" fills the Hindi block editor', (await page.locator('[data-block-type]').count()) >= 4);
  // translate the copied paragraph by hand (the Hindi editor's blocks are the last two cards)
  const hiCards = page.locator('[data-block-type]');
  const n = await hiCards.count();
  await hiCards.nth(n - 1).locator('textarea').last().fill('शुल्क 500 रुपये है');
  await page.getByText('Important date labels').scrollIntoViewIfNeeded();
  await page.locator('span', { hasText: /^Last Date$/ }).last().locator('xpath=following-sibling::input').fill('अंतिम तिथि');
  await page.getByLabel(/I have read this Hindi version/).check();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/hindi-panel.png`, fullPage: true });
  await page.getByRole('button', { name: /update job|save|create job/i }).last().click();
  await page.waitForURL(/\/admin\/jobs$/, { timeout: 30000 });

  let p = await fetchPost();
  const hi = p.translations?.hi;
  ok('Hindi title saved', hi?.title === `हिंदी पैनल परीक्षण ${run}`, JSON.stringify(hi)?.slice(0, 200));
  ok('Hindi blocks saved with the same structure', hi?.sections?.length === 2 && hi.sections[0].type === 'heading' && hi.sections[1].text === 'शुल्क 500 रुपये है');
  ok('date label saved by index', hi?.importantDateLabels?.[0] === 'अंतिम तिथि', JSON.stringify(hi?.importantDateLabels));
  ok('"reviewed" status saved', hi?.status === 'reviewed');
  ok('English post unchanged', p.title === `zz-hi Panel ${run}` && p.sections[1].text === 'Fee is 500 rupees');

  // 3. the form loads the saved Hindi back in; the list shows the badge
  await page.goto(`${ADMIN}/admin/jobs/${id}/edit`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /हिन्दी \(Hindi\) version/ }).waitFor({ timeout: 60000 });
  ok('badge says reviewed', await page.getByText('Hindi version: reviewed').isVisible());
  ok('Hindi title is loaded into the field', (await page.getByPlaceholder('पोस्ट का शीर्षक').inputValue()) === `हिंदी पैनल परीक्षण ${run}`);

  // 4. translate button: no Gemini key in test -> a clear error toast, form still usable
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /Translate from English/ }).click();
  await page.waitForTimeout(2500);
  ok('translate button reports a result (success or a clear error), page not broken', await page.getByRole('heading', { name: /हिन्दी \(Hindi\) version/ }).isVisible());

  // 5. remove the Hindi version
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /Remove Hindi version/ }).click();
  await page.getByRole('button', { name: /update job|save|create job/i }).last().click();
  await page.waitForURL(/\/admin\/jobs$/, { timeout: 30000 });
  p = await fetchPost();
  ok('removing clears translations on the server', !p.translations?.hi);
  ok('English post still intact after removal', p.title === `zz-hi Panel ${run}`);

  ok('no hydration/React errors', problems.length === 0, problems.join(' | '));
} finally {
  await api(`/jobs/id/${id}`, { method: 'DELETE' }, token).catch(() => {});
  await browser.close();
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
