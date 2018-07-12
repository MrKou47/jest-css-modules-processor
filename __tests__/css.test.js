/* eslint-env jest */

const css = require('./required.css');
console.log(css);
describe('test require css', () => {
  it('should can require css file', () => {
    expect(css).toBeTruthy();
  });
});
