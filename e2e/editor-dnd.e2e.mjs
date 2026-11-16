/**
 * Browser test for the post editor's drag-and-drop (real Chrome, real mouse/keyboard events).
 *
 *   1. backend running on :5000 with seeded users (npm run seed:admin), admin panel on :3001 (npm run dev)
 *   2. npm run test:e2e
 *
 * Env: API_URL (default http://localhost:5000/api), ADMIN_URL (default http://localhost:3001),
 *      CHROME_PATH (default /usr/bin/google-chrome), SHOTS=<dir> to save screenshots,
 *      ADMIN_EMAIL / ADMIN_PASSWORD (default admin@rojgarresult.com / Admin@123).
 * It creates one draft post named "zz-dnd Reorder ..." and deletes it at the end.
 */
import { chromium } from 'playwright-core';

const API = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN = process.env.ADMIN_URL || 'http://localhost:3001';
const SHOTS = process.env.SHOTS || '';
const shot = (page, name) => (SHOTS ? page.screenshot({ path: `${SHOTS}/${name}.png` }) : undefined);
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + extra}`); };
const unwrap = (j) => (j && j.meta && 'data' in j ? j.data : j);

// --- log in through the API and hand the token to the app the way its login form does
const j = async (path, init) => unwrap(await (await fetch(API + path, init)).json());
const { access_token: token } = await j('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL || 'admin@rojgarresult.com', password: process.env.ADMIN_PASSWORD || 'Admin@123' }) });
const profile = await j('/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
const user = JSON.stringify({ id: profile.id, email: profile.email, name: profile.name, role: profile.role });

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1400, height: 5200 } });
await context.addInitScript(([t, u]) => { localStorage.setItem('admin_token', t); localStorage.setItem('admin_user', u); }, [token, user]);
const page = await context.newPage();
const problems = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && /hydrat|dnd|Warning:|key|Maximum update/i.test(m.text())) problems.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => problems.push('PAGEERROR ' + e.message.slice(0, 200)));

await page.goto(`${ADMIN}/admin/jobs/create`, { waitUntil: 'domcontentloaded' });
await page.getByText('Structured content').waitFor({ timeout: 60000 });

const cards = () => page.locator('[data-block-type]');
// the block's own text is the LAST textarea (an open style panel sits above it and has inputs of its own)
const valueOf = async (card) => card.locator('textarea').last().inputValue();
const order = async () => { const out = []; for (let i = 0; i < await cards().count(); i++) out.push(await valueOf(cards().nth(i))); return out; };
const addBlock = (label) => page.locator('button', { hasText: new RegExp(`^\\s*${label}\\s*$`) }).last().click();
const handle = (i) => cards().nth(i).locator('[data-drag-handle]').first();

/** Real mouse drag with intermediate moves so dnd-kit's activation distance and collision detection fire. */
async function drag(from, to, where = 'center') {
  await page.evaluate(() => window.scrollTo(0, 0));
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  const sx = a.x + a.width / 2, sy = a.y + a.height / 2;
  const tx = b.x + b.width / 2;
  const ty = where === 'top' ? b.y + 4 : where === 'bottom' ? b.y + b.height - 4 : b.y + b.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx, sy + (ty > sy ? 12 : -12), { steps: 4 });
  await page.mouse.move(tx, ty, { steps: 25 });
  await page.waitForTimeout(150);
  await page.mouse.up();
  await page.waitForTimeout(350);
}

// ---------------------------------------------------------------- set up four paragraph blocks
for (const name of ['Alpha', 'Beta', 'Gamma', 'Delta']) {
  await addBlock('Paragraph');
  await cards().last().locator('textarea').first().fill(name);
}
ok('four blocks created in order', JSON.stringify(await order()) === JSON.stringify(['Alpha', 'Beta', 'Gamma', 'Delta']), JSON.stringify(await order()));
ok('every block has a drag handle', (await page.locator('[data-block-type] > div [data-drag-handle]').count()) >= 4);
await shot(page, 'dnd-1-before');

// ---------------------------------------------------------------- mouse: drag down, then up
await drag(handle(0), cards().nth(2));
ok('mouse: drag Alpha down onto Gamma', JSON.stringify(await order()) === JSON.stringify(['Beta', 'Gamma', 'Alpha', 'Delta']), JSON.stringify(await order()));

await drag(handle(3), cards().nth(0), 'top');
ok('mouse: drag Delta up to the top', JSON.stringify(await order()) === JSON.stringify(['Delta', 'Beta', 'Gamma', 'Alpha']), JSON.stringify(await order()));

// a click on the handle (no movement) must not reorder anything
await handle(1).click();
ok('a plain click on the handle does not move the block', JSON.stringify(await order()) === JSON.stringify(['Delta', 'Beta', 'Gamma', 'Alpha']));

// typing inside a block never starts a drag (handle only)
await cards().nth(1).locator('textarea').click({ position: { x: 20, y: 10 } });
await page.mouse.down(); await page.mouse.move(300, 700, { steps: 10 }); await page.mouse.up();
ok('dragging inside a text field selects text instead of moving the block', JSON.stringify(await order()) === JSON.stringify(['Delta', 'Beta', 'Gamma', 'Alpha']));

// ---------------------------------------------------------------- keyboard
await handle(0).focus();
await page.keyboard.press('Space');
await page.waitForTimeout(200); // dnd-kit starts listening for arrow keys a tick after Space
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(300);
await page.keyboard.press('Space');
await page.waitForTimeout(400);
ok('keyboard: Space, ArrowDown, Space moves a block one step', JSON.stringify(await order()) === JSON.stringify(['Beta', 'Delta', 'Gamma', 'Alpha']), JSON.stringify(await order()));

// ---------------------------------------------------------------- arrow buttons still work
await cards().nth(0).getByRole('button', { name: 'Move down' }).click();
ok('arrow buttons: Move down', JSON.stringify(await order()) === JSON.stringify(['Delta', 'Beta', 'Gamma', 'Alpha']), JSON.stringify(await order()));
await cards().nth(3).getByRole('button', { name: 'Move up' }).click();
ok('arrow buttons: Move up', JSON.stringify(await order()) === JSON.stringify(['Delta', 'Beta', 'Alpha', 'Gamma']), JSON.stringify(await order()));
ok('first block cannot move up, last cannot move down',
  await cards().nth(0).getByRole('button', { name: 'Move up' }).isDisabled() && await cards().nth(3).getByRole('button', { name: 'Move down' }).isDisabled());

// ---------------------------------------------------------------- per-block state follows the block
await cards().nth(2).getByRole('button', { name: /Style/ }).first().click(); // Alpha is index 2
ok('style panel opens on the chosen block', await cards().nth(2).getByText('Background Color').isVisible());
await drag(handle(2), cards().nth(0), 'top');
const o = await order();
ok('moved block went to the top', o[0] === 'Alpha', JSON.stringify(o));
ok('its open style panel moved with it (not left at the old position)', await cards().nth(0).getByText('Background Color').isVisible() && !(await cards().nth(2).getByText('Background Color').isVisible()));
await cards().nth(0).getByRole('button', { name: 'Close' }).first().click().catch(() => {});

// ---------------------------------------------------------------- delete keeps the rest intact and in order
await cards().nth(1).getByRole('button', { name: 'Delete block' }).click();
const afterDelete = await order();
ok('deleting a block keeps the others in order', afterDelete.length === 3 && !afterDelete.includes('Delta') && JSON.stringify(afterDelete) === JSON.stringify(['Alpha', 'Beta', 'Gamma']), JSON.stringify(afterDelete));
// restore a 4th block for the collapse test
await addBlock('Paragraph');
await cards().last().locator('textarea').first().fill('Omega');

// ---------------------------------------------------------------- collapse all: summaries, and drag still works
await page.getByRole('button', { name: 'Collapse all' }).click();
ok('collapse all hides block bodies', (await page.locator('[data-block-type] textarea').count()) === 0);
const summary = await cards().nth(0).innerText();
ok('collapsed blocks show a summary', /Alpha/.test(summary), summary);
await shot(page, 'dnd-2-collapsed');
await drag(handle(3), cards().nth(0), 'top'); // Omega to the top while collapsed
await page.getByRole('button', { name: 'Expand all' }).click();
ok('drag works while collapsed', JSON.stringify(await order()) === JSON.stringify(['Omega', 'Alpha', 'Beta', 'Gamma']), JSON.stringify(await order()));

// ---------------------------------------------------------------- columns: blocks inside a column reorder too
await addBlock('Columns');
const colCard = cards().last();
const colSelect = colCard.locator('select').first();
await colSelect.selectOption('paragraph');
await colSelect.selectOption('paragraph');
const inner = colCard.locator('textarea');
await inner.nth(0).fill('Col-first');
await inner.nth(1).fill('Col-second');
const innerHandles = colCard.locator('[data-drag-handle]'); // [0] is the block's own handle, then the two inner ones
ok('column blocks have their own drag handles', (await innerHandles.count()) === 3, String(await innerHandles.count()));
await drag(innerHandles.nth(2), innerHandles.nth(1), 'top');
const innerOrder = [await colCard.locator('textarea').nth(0).inputValue(), await colCard.locator('textarea').nth(1).inputValue()];
ok('drag reorders blocks inside a column', JSON.stringify(innerOrder) === JSON.stringify(['Col-second', 'Col-first']), JSON.stringify(innerOrder));
const topAfter = await order();
ok('and the top-level order is untouched by the inner drag', JSON.stringify(topAfter.slice(0, 4)) === JSON.stringify(['Omega', 'Alpha', 'Beta', 'Gamma']), JSON.stringify(topAfter));
await shot(page, 'dnd-3-columns');

// ---------------------------------------------------------------- save, then confirm the server stored the dragged order
const title = `zz-dnd Reorder ${Date.now().toString(36)}`;
await page.getByPlaceholder('Enter job title').fill(title);
await page.getByPlaceholder('job-title-slug').fill(title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
// the post-type select is the required one (it starts empty): pick its first real option
await page.locator('select:invalid').first().selectOption({ index: 1 });
await page.getByRole('button', { name: 'Create Job' }).click();
await page.waitForURL(/\/admin\/jobs$/, { timeout: 30000 }).catch(() => {});
const list = await j(`/jobs/admin/list?limit=10&search=${encodeURIComponent(title)}`, { headers: { Authorization: `Bearer ${token}` } });
const created = (list.jobs || []).find((x) => x.title === title);
ok('post was created through the form', !!created);
if (created) {
  const full = await j(`/jobs/id/${created._id}`, { headers: { Authorization: `Bearer ${token}` } });
  const saved = full.sections.map((s) => (s.type === 'paragraph' ? s.text : s.type));
  ok('server stored the blocks in the dragged order', JSON.stringify(saved) === JSON.stringify(['Omega', 'Alpha', 'Beta', 'Gamma', 'columns']), JSON.stringify(saved));
  const colTexts = full.sections.find((s) => s.type === 'columns')?.columns?.[0]?.blocks?.map((b) => b.text);
  ok('and the dragged order inside the column', JSON.stringify(colTexts) === JSON.stringify(['Col-second', 'Col-first']), JSON.stringify(colTexts));

  // re-open the edit page: order survives a reload
  await page.goto(`${ADMIN}/admin/jobs/${created._id}/edit`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Structured content').waitFor({ timeout: 60000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-block-type]').length >= 5, null, { timeout: 30000 });
  ok('edit page loads the saved order', JSON.stringify((await order()).slice(0, 4)) === JSON.stringify(['Omega', 'Alpha', 'Beta', 'Gamma']), JSON.stringify(await order()));
  // drag on the edit page and save with Update
  await drag(handle(3), cards().nth(0), 'top');
  ok('can reorder an existing post (Gamma to top)', (await order())[0] === 'Gamma', JSON.stringify(await order()));
  await page.getByRole('button', { name: 'Update Job' }).click();
  await page.waitForURL(/\/admin\/jobs$/, { timeout: 30000 }).catch(() => {});
  const again = await j(`/jobs/id/${created._id}`, { headers: { Authorization: `Bearer ${token}` } });
  ok('update stored the new order', again.sections[0]?.text === 'Gamma', JSON.stringify(again.sections.map((s) => s.text ?? s.type)));
  await fetch(`${API}/jobs/id/${created._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
}

ok('no hydration / React / dnd-kit warnings in the browser console', problems.length === 0, problems.join(' | '));
console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
