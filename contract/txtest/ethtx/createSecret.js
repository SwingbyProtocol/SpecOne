const randomBytes = require('randombytes')

const generateSecret = function () {
  return randomBytes(32).toString('hex')
}
console.log('secret → ', generateSecret())

module.exports = generateSecret
process.exit()
