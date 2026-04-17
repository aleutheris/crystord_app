import { satisfies, valid } from 'semver'
import type { SchemaInfo } from './schema-info-query'

export interface CompatibilityResult {
  compatible: boolean
  schemaVersion: string
  supportedRange: string
  message: string
}

export function checkSchemaCompatibility(
  schemaInfo: SchemaInfo,
  supportedRange: string,
): CompatibilityResult {
  const { schemaVersion } = schemaInfo

  if (!valid(schemaVersion)) {
    return {
      compatible: false,
      schemaVersion,
      supportedRange,
      message: `Backend returned invalid schema version: "${schemaVersion}".`,
    }
  }

  if (!satisfies(schemaVersion, supportedRange)) {
    return {
      compatible: false,
      schemaVersion,
      supportedRange,
      message: `Backend schema version ${schemaVersion} is outside supported range ${supportedRange}.`,
    }
  }

  return {
    compatible: true,
    schemaVersion,
    supportedRange,
    message: `Schema version ${schemaVersion} is compatible.`,
  }
}
