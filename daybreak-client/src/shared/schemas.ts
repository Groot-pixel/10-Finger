import { z } from 'zod'

export const languageSchema = z.enum(['de', 'en'])
export const editionSchema = z.enum(['java', 'bedrock'])
export const javaLoaderSchema = z.enum(['vanilla', 'fabric', 'forge', 'neoforge', 'quilt'])
export const bedrockChannelSchema = z.enum(['release', 'preview'])
export const postLaunchBehaviorSchema = z.enum(['keepOpen', 'minimize', 'close'])

/** A conservative allow-list: no path separators, no null bytes, printable only. */
const safeNameSchema = z
  .string()
  .trim()
  .min(1, 'Name darf nicht leer sein')
  .max(64, 'Name ist zu lang (max. 64 Zeichen)')
  .regex(/^[^\0]+$/, 'Ungültige Zeichen im Namen')

export const javaProfileInputSchema = z.object({
  name: safeNameSchema,
  edition: z.literal('java'),
  minecraftVersion: z.string().min(1).max(32),
  loader: javaLoaderSchema,
  loaderVersion: z.string().max(64).nullable(),
  ramMb: z.number().int().min(512).max(131072),
  jvmArgs: z.string().max(4096),
  javaPath: z.string().max(4096).nullable(),
  icon: z.string().max(64)
})

export const bedrockProfileInputSchema = z.object({
  name: safeNameSchema,
  edition: z.literal('bedrock'),
  channel: bedrockChannelSchema,
  icon: z.string().max(64)
})

export const profileInputSchema = z.discriminatedUnion('edition', [
  javaProfileInputSchema,
  bedrockProfileInputSchema
])

export const profileIdSchema = z.string().uuid().or(z.literal('daybreak-default'))

/** A partial update must still pick a concrete edition variant - .partial() can't distribute over a discriminated union directly. */
export const profilePatchSchema = z.union([
  javaProfileInputSchema.partial().extend({ edition: z.literal('java') }),
  bedrockProfileInputSchema.partial().extend({ edition: z.literal('bedrock') })
])

export const appSettingsInputSchema = z.object({
  language: languageSchema.optional(),
  defaultRamMb: z.number().int().min(512).max(131072).optional(),
  javaPath: z.string().max(4096).nullable().optional(),
  defaultGameDir: z.string().max(4096).optional(),
  microsoftClientIdOverride: z.string().max(256).nullable().optional(),
  curseForgeApiKey: z.string().max(512).nullable().optional(),
  discordRpcEnabled: z.boolean().optional(),
  postLaunchBehavior: postLaunchBehaviorSchema.optional(),
  autoUpdateEnabled: z.boolean().optional(),
  closeConsoleOnCrashOnly: z.boolean().optional()
})

export const modSearchQuerySchema = z.object({
  platform: z.enum(['modrinth', 'curseforge']),
  query: z.string().max(256),
  minecraftVersion: z.string().max(32).nullable(),
  loader: javaLoaderSchema.nullable(),
  category: z.string().max(64).nullable(),
  sortBy: z.enum(['relevance', 'downloads', 'newest', 'updated']),
  offset: z.number().int().min(0).max(10000),
  limit: z.number().int().min(1).max(50)
})

export const modInstallRequestSchema = z.object({
  profileId: profileIdSchema,
  platform: z.enum(['modrinth', 'curseforge']),
  projectId: z.string().min(1).max(64),
  versionId: z.string().min(1).max(64)
})

export const modToggleRequestSchema = z.object({
  profileId: profileIdSchema,
  modId: z.string().min(1).max(256),
  enabled: z.boolean()
})

export const modRemoveRequestSchema = z.object({
  profileId: profileIdSchema,
  modId: z.string().min(1).max(256)
})

export const manualModAddRequestSchema = z.object({
  profileId: profileIdSchema,
  filePath: z.string().min(1).max(4096)
})

export const serverListEntryInputSchema = z.object({
  name: safeNameSchema,
  address: z
    .string()
    .trim()
    .min(1)
    .max(256)
    .regex(/^[a-zA-Z0-9.-]+(:\d{1,5})?$/, 'Ungültige Server-Adresse'),
  profileId: profileIdSchema
})

export const launchRequestSchema = z.object({
  profileId: profileIdSchema
})

export const deviceCodeLoginSchema = z.object({})

export const removeAccountSchema = z.object({
  accountId: z.string().uuid()
})

export const setActiveAccountSchema = z.object({
  accountId: z.string().uuid()
})

export const skinChangeRequestSchema = z.object({
  variant: z.enum(['classic', 'slim']),
  source: z.enum(['url', 'file']),
  value: z.string().min(1).max(4096)
})

export const profilePlaytimeExportSchema = z.object({
  profileId: profileIdSchema
})

export type JavaProfileInput = z.infer<typeof javaProfileInputSchema>
export type BedrockProfileInput = z.infer<typeof bedrockProfileInputSchema>
export type ProfileInput = z.infer<typeof profileInputSchema>
export type AppSettingsInput = z.infer<typeof appSettingsInputSchema>
export type ModSearchQuery = z.infer<typeof modSearchQuerySchema>

// ---------------------------------------------------------------------------
// Persisted-data schemas: validated on every disk read, not just on IPC input.
// ---------------------------------------------------------------------------

export const javaProfileSchema = z.object({
  id: z.string().min(1),
  name: safeNameSchema,
  edition: z.literal('java'),
  minecraftVersion: z.string().min(1),
  loader: javaLoaderSchema,
  loaderVersion: z.string().nullable(),
  ramMb: z.number().int().min(512),
  jvmArgs: z.string(),
  javaPath: z.string().nullable(),
  gameDir: z.string().min(1),
  icon: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastPlayedAt: z.string().nullable(),
  totalPlaytimeSeconds: z.number().min(0)
})

export const bedrockProfileSchema = z.object({
  id: z.string().min(1),
  name: safeNameSchema,
  edition: z.literal('bedrock'),
  channel: bedrockChannelSchema,
  icon: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastPlayedAt: z.string().nullable(),
  totalPlaytimeSeconds: z.number().min(0)
})

export const profileSchema = z.discriminatedUnion('edition', [javaProfileSchema, bedrockProfileSchema])
export const profilesFileSchema = z.object({ profiles: z.array(profileSchema) })

export const minecraftAccountProfileSchema = z.object({
  id: z.string().uuid(),
  minecraftUuid: z.string(),
  minecraftUsername: z.string(),
  xuid: z.string(),
  skinUrl: z.string().nullable(),
  addedAt: z.string(),
  isActive: z.boolean(),
  tokenExpiresAt: z.string()
})
export const accountsFileSchema = z.object({ accounts: z.array(minecraftAccountProfileSchema) })

export const appSettingsSchema = z.object({
  language: languageSchema,
  defaultRamMb: z.number().int().min(512),
  javaPath: z.string().nullable(),
  defaultGameDir: z.string(),
  microsoftClientIdOverride: z.string().nullable(),
  hasCurseForgeApiKey: z.boolean(),
  discordRpcEnabled: z.boolean(),
  postLaunchBehavior: postLaunchBehaviorSchema,
  autoUpdateEnabled: z.boolean(),
  closeConsoleOnCrashOnly: z.boolean()
})

export const serverListEntrySchema = z.object({
  id: z.string().uuid(),
  name: safeNameSchema,
  address: z.string(),
  profileId: profileIdSchema
})
export const serversFileSchema = z.object({ servers: z.array(serverListEntrySchema) })

export const partnerServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  description: z.string(),
  bannerUrl: z.string().nullable(),
  edition: editionSchema
})
export const partnerServersFileSchema = z.object({ servers: z.array(partnerServerSchema) })

export const newsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  url: z.string().nullable(),
  publishedAt: z.string(),
  imageUrl: z.string().nullable()
})
export const newsFileSchema = z.object({ items: z.array(newsItemSchema) })

export const modDependencyRefSchema = z.object({
  platform: z.enum(['modrinth', 'curseforge']),
  projectId: z.string().nullable(),
  versionId: z.string().nullable(),
  dependencyType: z.enum(['required', 'optional', 'incompatible', 'embedded'])
})

export const installedModSchema = z.object({
  id: z.string(),
  platform: z.enum(['modrinth', 'curseforge', 'manual']),
  projectId: z.string().nullable(),
  versionId: z.string().nullable(),
  fileName: z.string(),
  sha1: z.string().nullable(),
  name: z.string(),
  versionNumber: z.string().nullable(),
  enabled: z.boolean(),
  installedAt: z.string()
})

export const modLockfileSchema = z.object({
  profileId: profileIdSchema,
  mods: z.array(installedModSchema),
  updatedAt: z.string()
})

export const setupWizardStateSchema = z.object({
  completed: z.boolean(),
  language: languageSchema.nullable(),
  javaPath: z.string().nullable(),
  recommendedRamMb: z.number().nullable()
})
