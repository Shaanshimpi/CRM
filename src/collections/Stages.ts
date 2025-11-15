import type { CollectionConfig } from 'payload'

export const Stages: CollectionConfig = {
  slug: 'stages',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'pipeline', 'order', 'isDefault', 'isClosedStage'],
    description: 'Manage stages within pipelines',
    listSearchableFields: ['name', 'description'],
    defaultSort: 'order',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      // Only admins and managers can create stages
      return user?.role === 'admin' || user?.role === 'manager'
    },
    update: ({ req: { user } }) => {
      // Only admins and managers can update stages
      return user?.role === 'admin' || user?.role === 'manager'
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete stages
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Stage name (e.g., "New Lead", "Qualified", "Proposal")',
      },
    },
    {
      name: 'pipeline',
      type: 'relationship',
      relationTo: 'pipelines',
      required: true,
      admin: {
        description: 'Pipeline this stage belongs to',
        position: 'sidebar',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Display order within the pipeline (lower numbers appear first)',
        step: 1,
      },
    },
    {
      name: 'color',
      type: 'text',
      defaultValue: '#6b7280',
      admin: {
        description: 'Hex color code for this stage (used in Kanban view)',
      },
      validate: (value: string | null | undefined) => {
        if (value && typeof value === 'string' && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
          return 'Must be a valid hex color code (e.g., #6b7280)'
        }
        return true
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Brief description of this stage',
      },
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Set as default stage for new opportunities in this pipeline',
        position: 'sidebar',
      },
    },
    {
      name: 'isClosedStage',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mark this as a closed stage (won or lost)',
        position: 'sidebar',
      },
    },
    {
      name: 'closedType',
      type: 'select',
      options: [
        {
          label: 'Won',
          value: 'won',
        },
        {
          label: 'Lost',
          value: 'lost',
        },
      ],
      admin: {
        description: 'Type of closed stage',
        condition: (data) => Boolean(data?.isClosedStage),
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Validate order uniqueness within pipeline
        if (data.order !== undefined && data.pipeline) {
          const pipelineId = typeof data.pipeline === 'string' 
            ? data.pipeline 
            : typeof data.pipeline === 'object' && data.pipeline?.id
              ? data.pipeline.id
              : data.pipeline
          
          // Find other stages in the same pipeline with the same order
          const existingStages = await req.payload.find({
            collection: 'stages',
            where: {
              and: [
                {
                  pipeline: {
                    equals: pipelineId,
                  },
                },
                {
                  order: {
                    equals: data.order,
                  },
                },
              ],
            },
            limit: 1,
          })

          // If updating, exclude current stage from check
          if (operation === 'update' && data.id) {
            const existingStage = existingStages.docs.find((stage) => stage.id !== data.id)
            if (existingStage) {
              throw new Error(`Another stage in this pipeline already has order ${data.order}`)
            }
          } else if (operation === 'create' && existingStages.docs.length > 0) {
            throw new Error(`Another stage in this pipeline already has order ${data.order}`)
          }
        }

        // Validate only one default stage per pipeline
        if (data.isDefault && data.pipeline) {
          const pipelineId = typeof data.pipeline === 'string' 
            ? data.pipeline 
            : typeof data.pipeline === 'object' && data.pipeline?.id
              ? data.pipeline.id
              : data.pipeline
          
          const defaultStages = await req.payload.find({
            collection: 'stages',
            where: {
              and: [
                {
                  pipeline: {
                    equals: pipelineId,
                  },
                },
                {
                  isDefault: {
                    equals: true,
                  },
                },
              ],
            },
            limit: 1,
          })

          // If updating, exclude current stage from check
          if (operation === 'update' && data.id) {
            const existingDefault = defaultStages.docs.find((stage) => stage.id !== data.id)
            if (existingDefault) {
              throw new Error('Only one stage can be set as default per pipeline')
            }
          } else if (operation === 'create' && defaultStages.docs.length > 0) {
            throw new Error('Only one stage can be set as default per pipeline')
          }
        }

        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        // Prevent deletion if opportunities are using this stage
        // Note: This will be checked in Phase 4 when Opportunities collection is created
        // For now, we'll just check if stage exists
        return true
      },
    ],
  },
}

