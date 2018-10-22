const {generateSecret} = require('../utils/secret')

const secret = generateSecret()
console.log('New secret generated!')
console.log(secret)

process.exit()
