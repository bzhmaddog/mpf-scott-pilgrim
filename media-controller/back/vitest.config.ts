import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // lcov is consumed by SonarCloud (see sonar-project.properties)
      reporter: ['text', 'html', 'lcov'],
    },
  },
})
