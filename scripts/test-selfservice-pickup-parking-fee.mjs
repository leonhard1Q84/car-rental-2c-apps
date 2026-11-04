import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const readSource = (relativePath) => readFile(path.join(repoRoot, relativePath), 'utf8');

const [overviewSource, translationsSource, specSource] = await Promise.all([
  readSource('src/components/OverviewScreen.tsx'),
  readSource('src/i18n/pickup-parking-fee.ts'),
  readSource('specs/modules/selfservice-rental/pickup-inspection-security.md')
]);

assert.match(
  overviewSource,
  /const openServiceTerms = \(\) => setView\(AppView\.SERVICE_TERMS\)/,
  'the parking fee notice must reuse the existing service terms destination'
);
assert.equal(
  overviewSource.match(/onClick=\{openServiceTerms\}/g)?.length,
  2,
  'the parking fee notice and sticky footer must share the same service terms handler'
);
assert.match(overviewSource, /t\('pickupParkingFeeDetailsLink'\)/);
assert.match(
  overviewSource,
  /pickupParkingFeeDetailsLink[\s\S]{0,180}<ChevronRight/,
  'the notice detail action must include a directional affordance'
);
assert.match(
  overviewSource,
  /onClick=\{openServiceTerms\}[\s\S]{0,240}min-h-11/,
  'the notice detail action must keep a minimum 44px touch target'
);

const expectedLabels = [
  'View detailed billing information',
  '點擊查看詳細計費說明',
  '詳しい料金説明を見る',
  '상세 요금 안내 보기',
  'ดูรายละเอียดการคิดค่าบริการ'
];
for (const expectedLabel of expectedLabels) {
  assert.ok(
    translationsSource.includes(`pickupParkingFeeDetailsLink: "${expectedLabel}"`),
    `missing parking fee details label: ${expectedLabel}`
  );
}

assert.match(
  specSource,
  /与页面底部入口导航至同一 `AppView\.SERVICE_TERMS`/,
  'the active spec must define the shared service terms destination'
);
assert.match(
  specSource,
  /不新增停车费专属详情页、弹窗、确认状态或独立计费内容/,
  'the active spec must prevent a second parking fee content source'
);

console.log('Self-service pickup parking fee details regression passed.');
