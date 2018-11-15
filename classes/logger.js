/**
 * Created by georgius on 20.07.18.
 */
const options = {
  level: process.env.MODE === 'production' ? 'info' : 'trace',
  extreme: process.env.MODE === 'production',
  prettyPrint: process.env.MODE === 'development',
}
const Logger = require('pino')(options)

module.exports=Logger