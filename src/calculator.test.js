import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculate} from './calculator.js';
test('calculator handles precedence, brackets, negative values, and percentages',()=>{
 assert.equal(calculate('2 + 3 × 4'),14);assert.equal(calculate('(2+3)÷4'),1.25);
 assert.equal(calculate('-5+2'),-3);assert.equal(calculate('200×10%'),20);
 assert.equal(calculate('0.1+0.2'),.3);assert.equal(calculate('.5 * 8'),4);
});
test('calculator rejects invalid expressions and division by zero',()=>{
 for(const expression of ['', '2/0', '(2+3', '2+', 'alert(1)', '1;2', '2**3'])assert.throws(()=>calculate(expression));
});
