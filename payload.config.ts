import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'your-secret-key',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  editor: lexicalEditor({}),
  collections: [
    {
      slug: 'articles',
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
          admin: {
            position: 'sidebar',
          },
        },
        {
          name: 'excerpt',
          type: 'textarea',
          maxLength: 200,
        },
        {
          name: 'body',
          type: 'richText',
          required: true,
        },
        {
          name: 'category',
          type: 'select',
          required: true,
          options: [
            { label: 'Politics', value: 'politics' },
            { label: 'Economy', value: 'economy' },
            { label: 'Business', value: 'business' },
            { label: 'Culture', value: 'culture' },
            { label: 'Sport', value: 'sport' },
            { label: 'Technology', value: 'technology' },
            { label: 'Health', value: 'health' },
            { label: 'Environment', value: 'environment' },
          ],
        },
        {
          name: 'accessLevel',
          type: 'radio',
          required: true,
          defaultValue: 'free',
          options: [
            { label: 'Free', value: 'free' },
            { label: 'Premium', value: 'premium' },
          ],
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'draft',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Scheduled', value: 'scheduled' },
            { label: 'Published', value: 'published' },
            { label: 'Archived', value: 'archived' },
          ],
          admin: {
            position: 'sidebar',
          },
        },
        {
          name: 'coverImage',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'publishedAt',
          type: 'date',
          admin: {
            position: 'sidebar',
          },
        },
        {
          name: 'metaTitle',
          type: 'text',
          admin: {
            position: 'sidebar',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          admin: {
            position: 'sidebar',
          },
        },
      ],
    },
    {
      slug: 'media',
      upload: {
        staticDir: 'media',
        mimeTypes: ['image/*'],
      },
      fields: [
        {
          name: 'alt',
          type: 'text',
        },
      ],
    },
    {
      slug: 'users',
      auth: true,
      admin: {
        useAsTitle: 'email',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'role',
          type: 'select',
          required: true,
          defaultValue: 'viewer',
          options: [
            { label: 'Admin', value: 'admin' },
            { label: 'Editor', value: 'editor' },
            { label: 'Viewer', value: 'viewer' },
          ],
        },
      ],
    },
  ],
  typescript: {
    outputFile: './payload-types.ts',
  },
})
