import { chromium } from 'playwright';
import axios from 'axios';

const GST_RATE = 0.18;
const BASE_URL = 'https://urbanspaninfra.co.in';
const API_BASE = 'https://api.urbanspaninfra.co.in/api';

const auditResults = {
  mathSuite: { passed: 0, failed: 0 },
  dispatchTrackerSuite: { passed: 0, failed: 0 },
  e2eSuite: { passed: 0, failed: 0 }
};

function assertMath(condition, name, data = null) {
  if (condition) {
    auditResults.mathSuite.passed++;
  } else {
    auditResults.mathSuite.failed++;
    console.error('[MATH FAIL] ' + name, data);
  }
}

function assertDispatch(condition, name, data = null) {
  if (condition) {
    auditResults.dispatchTrackerSuite.passed++;
  } else {
    auditResults.dispatchTrackerSuite.failed++;
    console.error('[DISPATCH FAIL] ' + name, data);
  }
}

function assertE2E(condition, name, data = null) {
  if (condition) {
    auditResults.e2eSuite.passed++;
    console.log('  [E2E PASS] ' + name);
  } else {
    auditResults.e2eU5ite.failed++;
    console.error('  [E2E FAIL] ' + name, data);
  }
}

// 1. Math Exactness & 500 Randomized Runs
console.log('=== TEST SUITE 1: MATHEMATICAL EXACTNESS & 500 RANDOMIZED RUNS ===');

function calculateCart(items) {
  let subtotal = 0;
  const calculatedItems = items.map(item => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const basePrice = Math.max(0, Number(item.base_price) || 0);
    const lineSubtotal = qty * basePrice;
    const lineGst = lineSubtotal * GST_RATE;
    const lineTotal = lineSubtotal + lineGst;
    subtotal += lineSubtotal;
    return { ...item, quantity: qty, base_price: basePrice, lineSubtotal, lineGst, lineTotal };
  });

  const totalGst = subtotal * GST_RATE;
  const grandTotal = subtotal + totalGst;
  const sumLineTotals = calculatedItems.reduce((acc, i) => acc + i.lineTotal, 0);

  return { calculatedItems, subtotal, totalGst, grandTotal, sumLineTotals };
}

const testItems1 = [
  { id: '1', name: 'Fe-550D Rebar', base_price: 54500, quantity: 25 },
  { id: '2', name: 'ISMB 300 Beam', base_price: 58200, quantity: 50 },
  { id: '3', name: 'HR Coil 3mm', base_price: 52800, quantity: 30 }
];
const res1 = calculateCart(testItems1);
assertMath(res1.subtotal === 54500*25 + 58200*50 + 52800*30, 'Subtotal calculation exact for testItems1');
assertMath(Math.abs(res1.totalGst - res1.subtotal * 0.18) < 1e-9, 'Total GST is exactly Subtotal * 0.18');
assertMath(Math.abs(res1.grandTotal - res1.subtotal * 1.18) < 1e-9, 'Grand Total is exactly Subtotal * 1.18');
assertMath(Math.abs(res1.grandTotal - res1.sumLineTotals) < 1e-9, 'Grand Total strictly equals sum of Line Totals');

for (let i = 0; i < 500; i++) {
  const itemCount = Math.floor(Math.random() * 8) + 1;
  const randomItems = [];
  for (let j = 0; j < itemCount; j++) {
    randomItems.push({
      id: 'item_' + j,
      base_price: Math.floor(Math.random() * 100000) + 1000,
      quantity: Math.floor(Math.random() * 500) + 1
    });
  }
  const calc = calculateCart(randomItems);
  const drift = Math.abs(calc.grandTotal - calc.sumLineTotals);
  const mathDrift = Math.abs(calc.grandTotal - (calc.subtotal * 1.18));
  assertMath(dY�YKM�	ԝ[�	�
�H
�	Έ�\���Y��]�Y[�ܘ[��[[��[Hو[�H�[��N�B�\��\�X]
X]�Y�YKM�	ԝ[�	�
�H
�	Έܘ[��[X]�\��X��[
�K�N	�N�B�CB�B�����KUY\�\�]���ܙ\���X��\��]HXX�[�H\�B��ۜ��K���	�OOHT��RUH��KUQT�T�U���ԑT���P��T��UHPP�S�HOOI�N�B��ۜ�T�U���Q�T�H�B�	�ܙ\���ۙ�\�YY	�B�	�Z[٘X��X�][ۉ�B�	��ZY���Y�W��YY	�B�	�[���[��]	�B�	�[]�\�Y	�B�N�B�B��[��[ۈ]�[X]T�Y�\��\��[��]\�H�B��ۜ��\��[�YHX]�X^
T�U���Q�T˚[�^ي�\��[��]\�JN�B��]\��T�U���Q�T˛X\

�Y
HO�
�K�B��Y�N��B�\�ۙN��\��[�Y�HYB�\��\��[���\��[�YOOHYB�JJN�B�CB�B��ۜ�]�[�ZY���Y�HH]�[X]T�Y�\�	��ZY���Y�W��YY	�N�B�\��\�\�]�
]�[�ZY���Y�V�K�\�ۙHOOH�YH	��]�[�ZY���Y�V�K�\��\��[�OOH�[�K	��Y�H
ܙ\���ۙ�\�YY
H\���\]Y	�N�B�\��\�\�]�
]�[�ZY���Y�V�WK�\�ۙHOOH�YH	��]�[�ZY���Y�V�WK�\��\��[�OOH�[�K	��Y�HH
Z[٘X��X�][ۊH\���\]Y	�N�B�\��\�\�]�
]�[�ZY���Y�V̗K�\�ۙHOOH�YH	��]�[�ZY���Y�V̗K�\��\��[�OOH�YK	��Y�H�
�ZY���Y�W��YY
H\�X�]�I�N�B�\��\�\�]�
]�[�ZY���Y�V��K�\�ۙHOOH�[�H	��]�[�ZY���Y�V��K�\��\��[�OOH�[�K	��Y�H�
[���[��]
H\�[�[���N�B�\��\�\�]�
]�[�ZY���Y�V�K�\�ۙHOOH�[�H	��]�[�ZY���Y�V�K�\��\��[�OOH�[�K	��Y�H
[]�\�Y
H\�[�[���N�B�B���ˈ^]ܚY�U�H�����T�L�CB��ۜ��K���	�OOHT��RUHΈVUԒQ�U�H�����T�L�HOOI�N�B�B�\�[���[��[ۈ�[������\�]Y]

H�B��ۜ������\�H]�Z]���Z][K�][��
�XY\�Έ�YHJN�B�B��H�B���\����Y]�ܝB��ۜ��۝^\���H]�Z]�����\���]��۝^
��Y]�ܝ���Y�MZY��LHJN�B��ۜ�Y�Q\���H]�Z]�۝^\�����]�Y�J
N�B�B��ۜ��K���	�\�[��\����][��[��\���ˋ���N�B�]�Z]Y�Q\��������T�W�T�
�	����X�����Z][�[�	ۙ]�ܚ�YI�[Y[�]��JN�B�B��ۜ��\��H]�Z]Y�Q\������]܊	���K���[�

N�B�\��\�L�J�\���	��][���YY	�
��\��
�	���X��\�
�I�N�B�B��ۜ��X\��[�]HY�Q\������]܊	�[�]�X�Z�\��H��X\���I�N�B�Y�
]�Z]�X\��[�]�\՚\�X�J
JH�B�]�Z]�X\��[�]��[
	�T�P��N�B�]�Z]Y�Q\�����Z]�ܕ[Y[�]

N�B��ۜ�\�X��\��H]�Z]Y�Q\������]܊	���K���[�

N�B�\��\�L�J\�X��\���	��][���X\���܈T�P��]\��Y	�
�\�X��\��
�	��\�[
�I�N�B�]�Z]�X\��[�]��[
	��N�B�CB�B��ۜ��\���\�HY�Q\������]܊	���K��\��

N�B�]�Z]�\���\���X��
N�B�]�Z]Y�Q\�����Z]�ܕT�
����X��ˊ���[Y[�]�MLJN�B�B��ۜ�U^H]�Z]Y�Q\������]܊	�I�K��\��

K�[��\�^

N�B�\��\�L�JU^�[���	���X�]Z[�Y�H�YYN�	�
�U^
N�B�B��ۜ��K���	���\�[��[ؚ[H�Y]�ܝ
�L
K����N�B��ۜ��۝^[ؚ[HH]�Z]�����\���]��۝^
�B��Y]�ܝ���Y��LZY��KB�\�[ؚ[N��YKB�\��X���YCB�JN�B��ۜ�Y�S[ؚ[HH]�Z]�۝^[ؚ[K��]�Y�J
N�B�B�]�Z]Y�S[ؚ[K�����T�W�T���Z][�[�	ۙ]�ܚ�YI�[Y[�]��JN�B��ۜ�[ؚ[R�YSݙ\����H]�Z]Y�S[ؚ[K�]�[X]J

HO���[Y[����[Y[�[[Y[���ܛ��Y��[��˚[��\��Y
N�B�\��\�L�J[[ؚ[R�YSݙ\����	�[ؚ[H�YH\�ܚ^�۝[�ܛ�ݙ\�����N�B�B�]�Z]Y�S[ؚ[K�����T�W�T�
�	����X�����Z][�[�	ۙ]�ܚ�YI�[Y[�]��JN�B��ۜ�[ؚ[P�]ݙ\����H]�Z]Y�S[ؚ[K�]�[X]J

HO���[Y[����[Y[�[[Y[���ܛ��Y��[��˚[��\��Y
N�B�\��\�L�J[[ؚ[P�]ݙ\����	�[ؚ[H�][��\�ܚ^�۝[�ܛ�ݙ\�����N�B�B�]�Z]Y�S[ؚ[K�����T�W�T�
�	���\�	���Z][�[�	ۙ]�ܚ�YI�[Y[�]��JN�B��ۜ�[ؚ[P�\�ݙ\����H]�Z]Y�S[ؚ[K�]�[X]J

HO���[Y[����[Y[�[[Y[���ܛ��Y��[��˚[��\��Y
N�B�\��\�L�J[[ؚ[P�]ݙ\����	�[ؚ[H�\�\�ܚ^�۝[�ܛ�ݙ\�����N�B�B�]�Z]Y�S[ؚ[K�����T�W�T�
�	��ܝ[	���Z][�[�	ۙ]�ܚ�YI�[Y[�]��JN�B��ۜ�[ؚ[Tܝ[ݙ\����H]�Z]Y�S[ؚ[K�]�[X]J

HO���[Y[����[Y[�[[Y[���ܛ��Y��[��˚[��\��Y
N�B�\��\�L�HJ[ؚ[Tܝ[ݙ\����	�[ؚ[Hܝ[\�ܚ^�۝[�ܛ�ݙ\�����N�B�B�]�Z]�۝^\�������J
N�B�]�Z]�۝^[ؚ[K����J
N�B�H�]�
\��H�B��ۜ��K�\��܊	�^]ܚY�]Y]\��܎��\��N�B�\��\�L�J�[�K	�^]ܚY�]Y]�]�^�\[ێ�	�
�\���Y\��Y�JN�B�H�[�[H�B�]�Z]�����\�����J
N�B�CB�CB�B��[������\�]Y]

K�[�

HO��B��ۜ��K���	��OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOI�N�B��ۜ��K���	�'�b�S�TS�S�UQU�SSPT�N��N�B��ۜ��K���	�X]�Z]N�	�
�]Y]�\�[˛X]�Z]K�\��Y
�	�\��Y	�
�]Y]�\�[˛X]�Z]K��Z[Y
�	��Z[Y	�N�B��ۜ��K���	�\�]��X��\��Z]N�	�
�]Y]�\�[˙\�]��X��\��Z]K�\��Y
�	�\��Y	�
�]Y]�\�[˙\�]��X��\��Z]K��Z[Y
�	��Z[Y	�N�B��ۜ��K���	�L�H�����\��Z]N�	�
�]Y]�\�[˙L�T�Z]K�\��Y
�	�\��Y	�
�]Y]�\�[˙L�T�Z]K��Z[Y
�	��Z[Y	�N�B��ۜ��K���	�OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOW��N�B�B��ۜ��[�Z[YH]Y]�\�[˛X]�Z]K��Z[Y
�]Y]�\�[˙\�]��X��\��Z]K��Z[Y
�]Y]�\�[˙L�UMZ]K��Z[Y�B�Y�
�[�Z[Y�
H�B����\�˙^]
JN�B�CB�JN