
/**
 * Adds 0x to any input
 *
 * @param {*} input type gets turned into a string
 * @returns {string} '0xinput'
 */
module.exports = function (input) {
  if (typeof input === 'number') input = String(input)
  if (typeof input !== 'string') return input
  if (input.slice(0, 2) === '0x') return input
  return '0x' + input
}
