// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pipelines } from './collections/Pipelines'
import { Stages } from './collections/Stages'
import { Leads } from './collections/Leads'
import { Opportunities } from './collections/Opportunities'
import {
  csvImportEndpoint,
  excelImportEndpoint,
  apiImportEndpoint,
} from './endpoints/leads/import'
import {
  kanbanEndpoint,
  updateStageEndpoint,
} from './endpoints/opportunities/kanban'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // Branding configuration
    meta: {
      titleSuffix: '- FireFist CRM',
      description: 'FireFist CRM Dashboard - Manage your leads, opportunities, and sales pipeline',
    },
    // FireFist CRM branding components
    // Use string paths for Payload import map (relative to baseDir)
    // Payload's import map system expects named exports
    components: {
      graphics: {
        Logo: './components/admin/FireFistLogo#FireFistLogo',
        Icon: './components/admin/FireFistIcon#FireFistIcon',
      },
    },
  },
  collections: [Users, Media, Pipelines, Stages, Leads, Opportunities],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  endpoints: [
    csvImportEndpoint,
    excelImportEndpoint,
    apiImportEndpoint,
    kanbanEndpoint,
    updateStageEndpoint,
  ],
  plugins: [
    // storage-adapter-placeholder
  ],
})
