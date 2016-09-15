module.exports = {
  History: {
    ALL: ['global.before','global.beforeEach','suite.before','suite.beforeEach','suite1.testcase1','suite.afterEach','suite.beforeEach','suite1.testcase2','suite.afterEach','suite.after','global.afterEach','global.beforeEach','suite.before','suite.beforeEach','suite2.testcase1','suite.afterEach','suite.beforeEach','suite2.testcase2','suite.afterEach','suite.after','global.afterEach','global.after'],
    SKIP_S1T2: ['global.before','global.beforeEach','suite.before','suite.beforeEach','suite1.testcase1','suite.afterEach','suite.after','global.afterEach','global.beforeEach','suite.before','suite.beforeEach','suite2.testcase1','suite.afterEach','suite.beforeEach','suite2.testcase2','suite.afterEach','suite.after','global.afterEach','global.after'],
    SKIP_S1T2_S2: ['global.before','global.beforeEach','suite.before','suite.beforeEach','suite1.testcase1','suite.afterEach','suite.after','global.afterEach','global.after'],
    SKIP_S2: ['global.before','global.beforeEach','suite.before','suite.beforeEach','suite1.testcase1','suite.afterEach','suite.beforeEach','suite1.testcase2','suite.afterEach','suite.after','global.afterEach','global.after'],
    UP_TO_SUITE_BEFOREEACH: ['global.before','global.beforeEach','suite.before','suite.beforeEach','suite.afterEach','suite.after','global.afterEach','global.after'],
    UP_TO_SUITE_BEFORE: ['global.before','global.beforeEach','suite.before','suite.after','global.afterEach','global.after'],
    UP_TO_GLOBAL_BEFOREEACH: ['global.before','global.beforeEach','global.afterEach','global.after'],
    UP_TO_GLOBAL_BEFORE: ['global.before','global.after']
  },
  Results: {
    ALL_PASS: {
      suite1: { results: { passed: 2, errors: 0, failed: 0, skipped: 0 } },
      suite2: { results: { passed: 2, errors: 0, failed: 0, skipped: 0 } },
    }
  }
};
