const fs = require('node:fs')
const path = require('node:path')

class CtrfReporter {
  onRunComplete(_contexts, result) {
    const total = result.numTotalTests
    const report = {
      results: {
        summary: {
          tests: total,
          passed: result.numPassedTests,
          failed: result.numFailedTests,
          skipped: (result.numSkippedTests || 0) + (result.numPendingTests || 0) + (result.numTodoTests || 0),
        },
      },
    }
    const outputDirectory = path.join(__dirname, 'ctrf')
    fs.mkdirSync(outputDirectory, { recursive: true })
    fs.writeFileSync(path.join(outputDirectory, 'ctrf-report.json'), JSON.stringify(report, null, 2))
  }
}

module.exports = CtrfReporter
