const randomBytes = require('randombytes')

const generateSecret = function () {
  return randomBytes(32)
}
const sR = generateSecret()

console.log('secret R (sR) → ', sR)
module.exports = sR
