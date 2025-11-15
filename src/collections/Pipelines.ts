import type { CollectionConfig } from 'payload'

export const Pipelines: CollectionConfig = {
  slug: 'pipelines',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'isActive', 'createdAt'],
    description: 'Manage sales and marketing pipelines (workflows)',
    listSearchableFields: ['name', 'description'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      // Only admins and managers can create pipelines
      return user?.role === 'admin' || user?.role === 'manager'
    },
    update: ({ req: { user } }) => {
      // Only admins and managers can update pipelines
      return user?.role === 'admin' || user?.role === 'manager'
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete pipelines
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Pipeline name (e.g., "Sales Pipeline", "Marketing Pipeline")',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            // Trim whitespace
            return typeof value === 'string' ? value.trim() : value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Brief description of this pipeline\'s purpose',
      },
    },
    {
      name: 'color',
      type: 'text',
      defaultValue: '#6366f1',
      admin: {
        description: 'Hex color code for this pipeline (used in UI)',
        components: {
          Field: undefined, // Use default text field, could customize with color picker later
        },
      },
      validate: (value: string | null | undefined) => {
        if (value && typeof value === 'string' && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
          return 'Must be a valid hex color code (e.g., #6366f1)'
        }
        return true
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Only active pipelines are available for use',
        position: 'sidebar',
      },
    },
    {
      name: 'defaultStage',
      type: 'relationship',
      relationTo: 'stages',
      admin: {
        description: 'Default stage for new opportunities in this pipeline',
        position: 'sidebar',
        condition: (data) => Boolean(data?.id), // Only show after pipeline is created
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Validate defaultStage belongs to this pipeline
        if (data.defaultStage && operation === 'update' && data.id) {
          const stageId = typeof data.defaultStage === 'string' 
            ? data.defaultStage 
            : typeof data.defaultStage === 'object' && data.defaultStage?.id
              ? data.defaultStage.id
              : data.defaultStage
          
          if (stageId) {
            const stage = await req.payload.findByID({
              collection: 'stages',
              id: stageId,
            })
            
            const pipelineId = typeof stage.pipeline === 'string' 
              ? stage.pipeline 
              : typeof stage.pipeline === 'object' && stage.pipeline?.id
                ? stage.pipeline.id
                : stage.pipeline
            
            if (pipelineId !== data.id) {
              throw new Error('Default stage must belong to this pipeline')
            }
          }
        }
        return data
      },
    ],
  },
}

