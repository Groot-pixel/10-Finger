import { z } from 'zod'

const osRuleSchema = z.object({
  name: z.string().optional(),
  arch: z.string().optional(),
  version: z.string().optional()
})

const ruleSchema = z.object({
  action: z.enum(['allow', 'disallow']),
  os: osRuleSchema.optional(),
  features: z.record(z.string(), z.boolean()).optional()
})

const argumentValueSchema = z.union([
  z.string(),
  z.object({ rules: z.array(ruleSchema), value: z.union([z.string(), z.array(z.string())]) })
])

const artifactSchema = z.object({
  path: z.string().optional(),
  url: z.string(),
  sha1: z.string(),
  size: z.number()
})

export const libraryDownloadsSchema = z.object({
  artifact: artifactSchema.optional(),
  classifiers: z.record(z.string(), artifactSchema).optional()
})

export const librarySchema = z.object({
  name: z.string(),
  downloads: libraryDownloadsSchema.optional(),
  rules: z.array(ruleSchema).optional(),
  natives: z.record(z.string(), z.string()).optional(),
  url: z.string().optional()
})

export const assetIndexRefSchema = z.object({
  id: z.string(),
  sha1: z.string(),
  size: z.number(),
  totalSize: z.number().optional(),
  url: z.string()
})

export const versionJsonSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  inheritsFrom: z.string().optional(),
  mainClass: z.string().optional(),
  minecraftArguments: z.string().optional(),
  arguments: z
    .object({
      game: z.array(argumentValueSchema).optional(),
      jvm: z.array(argumentValueSchema).optional()
    })
    .optional(),
  libraries: z.array(librarySchema).optional(),
  assetIndex: assetIndexRefSchema.optional(),
  assets: z.string().optional(),
  downloads: z
    .object({
      client: artifactSchema.optional()
    })
    .optional(),
  javaVersion: z.object({ majorVersion: z.number() }).optional(),
  releaseTime: z.string().optional()
})

export type Rule = z.infer<typeof ruleSchema>
export type ArgumentValue = z.infer<typeof argumentValueSchema>
export type Artifact = z.infer<typeof artifactSchema>
export type Library = z.infer<typeof librarySchema>
export type VersionJson = z.infer<typeof versionJsonSchema>

export const versionManifestSchema = z.object({
  latest: z.object({ release: z.string(), snapshot: z.string() }),
  versions: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      url: z.string(),
      time: z.string(),
      releaseTime: z.string(),
      sha1: z.string()
    })
  )
})

export type VersionManifest = z.infer<typeof versionManifestSchema>
export type VersionManifestEntry = VersionManifest['versions'][number]
