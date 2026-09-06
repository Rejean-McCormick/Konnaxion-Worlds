// FILE: frontend/jest.config.ts
// jest.config.ts

import type { Config } from 'jest'
import nextJest from 'next/jest'
import { pathsToModuleNameMapper } from 'ts-jest'
import * as ts from 'typescript'

import fs from 'node:fs'
import path from 'node:path'

const createJestConfig = nextJest({ dir: './' })

const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
const tsconfigText = fs.readFileSync(tsconfigPath, 'utf8')
const parsedTsconfig = ts.parseConfigFileTextToJson(tsconfigPath, tsconfigText)

if (parsedTsconfig.error) {
  const message = ts.flattenDiagnosticMessageText(
    parsedTsconfig.error.messageText,
    '\n',
  )
  throw new Error(`Unable to parse tsconfig.json: ${message}`)
}

const compilerPaths =
  (parsedTsconfig.config?.compilerOptions?.paths as
    | Record<string, string[]>
    | undefined) ?? {}

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Keep CI runs fast. Adjust as needed.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/e2e/',
    '/_e2e/',
    '/smoke/',
    '/tests/.*\\.spec\\.[jt]sx?$',
    '/ct/',
    '\\.ct\\.tsx?$',
  ],

  // Mirror tsconfig "paths" while allowing comments in tsconfig.json (JSONC).
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerPaths, {
      prefix: '<rootDir>/',
    }),
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  modulePathIgnorePatterns: ['<rootDir>/dist/'],
}

export default createJestConfig(config)
