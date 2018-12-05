const {generateSecret, getHash} = require('../utils/secret')

const secret = generateSecret()
console.log('New secret generated!')
console.log(secret)
console.log('Hash:')
console.log(getHash(secret))

process.exit()
