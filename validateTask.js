const fs = require('node:fs')

const reportPath = './ctrf/ctrf-report.json'
if (!fs.existsSync(reportPath)) {
  console.error('Test report is missing. Run npm test before sending results.')
  process.exit(1)
}

const { results } = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
const { tests, passed, failed } = results.summary
if (!Number.isInteger(tests) || tests === 0 || passed !== tests || failed !== 0) {
  console.error(`Project validation failed: ${passed}/${tests} tests passed, ${failed} failed.`)
  process.exit(1)
}

console.log(`Project validation passed: ${passed}/${tests} tests.`)
