import assert from 'node:assert/strict'

/** @param {unknown} value @returns {asserts value is Record<string, unknown>} */
export function resultObject(value) { assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected Xcode result dictionary') }

/** @param {unknown} value @returns {import('./xcresult-types.ts').LegacyNode} */
export function legacyNode(value) {
  resultObject(value)
  if (value._type !== undefined) { resultObject(value._type); assert.ok(value._type._name === undefined || typeof value._type._name === 'string') }
  if (value._value !== undefined) assert.ok(value._value === null || ['string', 'number', 'boolean'].includes(typeof value._value))
  if (value._values !== undefined) { assert.ok(Array.isArray(value._values)); for (const item of value._values) legacyNode(item) }
  for (const key of ['actions', 'actionResult', 'testsRef', 'id', 'identifier', 'summaryRef', 'testStatus', 'performanceMetrics', 'displayName', 'unitOfMeasurement', 'measurements', 'baselineName', 'baselineAverage', 'maxPercentRegression', 'maxPercentRelativeStandardDeviation']) {
    if (value[key] !== undefined) legacyNode(value[key])
  }
  return /** @type {import('./xcresult-types.ts').LegacyNode} */ (value)
}

/** @param {unknown} value @returns {import('./xcresult-types.ts').ResultDetails} */
export function resultDetails(value) {
  resultObject(value)
  for (const field of ['testIdentifier', 'testResult']) assert.ok(value[field] === undefined || typeof value[field] === 'string')
  assert.ok(value.hasPerformanceMetrics === undefined || typeof value.hasPerformanceMetrics === 'boolean')
  if (value.devices !== undefined) {
    assert.ok(Array.isArray(value.devices))
    for (const device of value.devices) { resultObject(device); for (const field of ['deviceName', 'deviceId', 'modelName', 'platform', 'osVersion']) assert.ok(device[field] === undefined || typeof device[field] === 'string') }
  }
  if (value.testPlanConfigurations !== undefined) {
    assert.ok(Array.isArray(value.testPlanConfigurations))
    for (const configuration of value.testPlanConfigurations) { resultObject(configuration); assert.ok(configuration.configurationName === undefined || typeof configuration.configurationName === 'string') }
  }
  return /** @type {import('./xcresult-types.ts').ResultDetails} */ (value)
}
