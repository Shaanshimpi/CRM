import type { CollectionConfig } from 'payload'

export const Opportunities: CollectionConfig = {
  slug: 'opportunities',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'pipeline', 'currentStage', 'value', 'assignedTo', 'expectedCloseDate'],
    description: 'Manage sales opportunities in pipelines. Use the Kanban View to visualize opportunities by stage.',
    listSearchableFields: ['name', 'company', 'contactName', 'contactEmail'],
    // Note: beforeList component removed temporarily due to import map generation issues
    // The Kanban view is still accessible via direct URL: /admin/collections/opportunities/kanban
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: ({ req: { user } }) => {
      // Only admins and managers can delete opportunities
      return user?.role === 'admin' || user?.role === 'manager'
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Opportunity name or deal name',
      },
    },
    {
      name: 'lead',
      type: 'relationship',
      relationTo: 'leads',
      admin: {
        description: 'Lead this opportunity was converted from',
        position: 'sidebar',
      },
    },
    {
      name: 'pipeline',
      type: 'relationship',
      relationTo: 'pipelines',
      required: true,
      admin: {
        description: 'Pipeline this opportunity belongs to',
        position: 'sidebar',
      },
    },
    {
      name: 'currentStage',
      type: 'relationship',
      relationTo: 'stages',
      required: true,
      admin: {
        description: 'Current stage in the pipeline',
        position: 'sidebar',
      },
    },
    {
      name: 'value',
      type: 'number',
      admin: {
        description: 'Deal value',
        step: 0.01,
      },
      validate: (value: number | number[] | null | undefined): true | string => {
        const numValue = Array.isArray(value) ? value[0] : value
        if (numValue !== undefined && numValue !== null && numValue < 0) {
          return 'Value cannot be negative'
        }
        return true
      },
    },
    {
      name: 'currency',
      type: 'select',
      defaultValue: 'INR',
      options: [
        {
          label: 'Indian Rupee (INR)',
          value: 'INR',
        },
        {
          label: 'US Dollar (USD)',
          value: 'USD',
        },
        {
          label: 'Euro (EUR)',
          value: 'EUR',
        },
        {
          label: 'British Pound (GBP)',
          value: 'GBP',
        },
      ],
      admin: {
        description: 'Currency for deal value',
        position: 'sidebar',
      },
    },
    {
      name: 'probability',
      type: 'number',
      defaultValue: 50,
      admin: {
        description: 'Win probability percentage (0-100)',
        step: 1,
      },
      validate: (value: number | number[] | null | undefined): true | string => {
        const numValue = Array.isArray(value) ? value[0] : value
        if (numValue !== undefined && numValue !== null && (numValue < 0 || numValue > 100)) {
          return 'Probability must be between 0 and 100'
        }
        return true
      },
    },
    {
      name: 'expectedCloseDate',
      type: 'date',
      admin: {
        description: 'Expected date to close this deal',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'actualCloseDate',
      type: 'date',
      admin: {
        description: 'Actual date when deal was closed',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        condition: (data) => {
          // Only show if currentStage is a closed stage
          if (data.currentStage && typeof data.currentStage === 'object' && data.currentStage.isClosedStage) {
            return true
          }
          return false
        },
      },
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'User assigned to this opportunity',
        position: 'sidebar',
      },
    },
    {
      name: 'company',
      type: 'text',
      admin: {
        description: 'Company name',
      },
    },
    {
      name: 'contactName',
      type: 'text',
      admin: {
        description: 'Primary contact name',
      },
    },
    {
      name: 'contactEmail',
      type: 'email',
      admin: {
        description: 'Primary contact email',
      },
    },
    {
      name: 'contactPhone',
      type: 'text',
      admin: {
        description: 'Primary contact phone',
      },
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      admin: {
        description: 'Tags for categorizing opportunities',
      },
    },
    {
      name: 'customFields',
      type: 'json',
      admin: {
        description: 'Custom fields (flexible JSON data)',
      },
    },
    {
      name: 'stageHistory',
      type: 'array',
      admin: {
        description: 'History of stage changes',
        readOnly: true,
      },
      fields: [
        {
          name: 'stage',
          type: 'relationship',
          relationTo: 'stages',
        },
        {
          name: 'changedAt',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'changedBy',
          type: 'relationship',
          relationTo: 'users',
        },
      ],
    },
    {
      name: 'notes',
      type: 'array',
      admin: {
        description: 'Notes related to this opportunity',
      },
      fields: [
        {
          name: 'content',
          type: 'textarea',
          required: true,
          admin: {
            description: 'Note content',
          },
        },
        {
          name: 'isPrivate',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Mark as private note',
          },
        },
        {
          name: 'tags',
          type: 'text',
          hasMany: true,
          admin: {
            description: 'Tags for this note',
          },
        },
        {
          name: 'createdBy',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            description: 'User who created this note',
          },
        },
        {
          name: 'createdAt',
          type: 'date',
          admin: {
            description: 'When this note was created',
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'tasks',
      type: 'array',
      admin: {
        description: 'Tasks related to this opportunity',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: {
            description: 'Task title',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Task description',
          },
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'pending',
          options: [
            {
              label: 'Pending',
              value: 'pending',
            },
            {
              label: 'In Progress',
              value: 'inProgress',
            },
            {
              label: 'Completed',
              value: 'completed',
            },
            {
              label: 'Cancelled',
              value: 'cancelled',
            },
          ],
          admin: {
            description: 'Task status',
          },
        },
        {
          name: 'priority',
          type: 'select',
          defaultValue: 'medium',
          options: [
            {
              label: 'Low',
              value: 'low',
            },
            {
              label: 'Medium',
              value: 'medium',
            },
            {
              label: 'High',
              value: 'high',
            },
            {
              label: 'Urgent',
              value: 'urgent',
            },
          ],
          admin: {
            description: 'Task priority',
          },
        },
        {
          name: 'dueDate',
          type: 'date',
          admin: {
            description: 'Task due date',
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'assignedTo',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            description: 'User assigned to this task',
          },
        },
        {
          name: 'completedAt',
          type: 'date',
          admin: {
            description: 'When this task was completed',
            date: {
              pickerAppearance: 'dayAndTime',
            },
            condition: (data, siblingData) => {
              return siblingData?.status === 'completed'
            },
          },
        },
        {
          name: 'createdBy',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            description: 'User who created this task',
          },
        },
      ],
    },
    {
      name: 'reminders',
      type: 'array',
      admin: {
        description: 'Reminders related to this opportunity',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: {
            description: 'Reminder title',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Reminder description',
          },
        },
        {
          name: 'reminderDate',
          type: 'date',
          required: true,
          admin: {
            description: 'Date for the reminder',
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'type',
          type: 'select',
          defaultValue: 'in-app',
          options: [
            {
              label: 'In-App',
              value: 'in-app',
            },
            {
              label: 'Email',
              value: 'email',
            },
            {
              label: 'SMS',
              value: 'sms',
            },
            {
              label: 'Call',
              value: 'call',
            },
          ],
          admin: {
            description: 'Reminder type',
          },
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'pending',
          options: [
            {
              label: 'Pending',
              value: 'pending',
            },
            {
              label: 'Sent',
              value: 'sent',
            },
            {
              label: 'Dismissed',
              value: 'dismissed',
            },
          ],
          admin: {
            description: 'Reminder status',
          },
        },
        {
          name: 'sentAt',
          type: 'date',
          admin: {
            description: 'When this reminder was sent',
            date: {
              pickerAppearance: 'dayAndTime',
            },
            condition: (data, siblingData) => {
              return siblingData?.status === 'sent'
            },
          },
        },
        {
          name: 'dismissedAt',
          type: 'date',
          admin: {
            description: 'When this reminder was dismissed',
            date: {
              pickerAppearance: 'dayAndTime',
            },
            condition: (data, siblingData) => {
              return siblingData?.status === 'dismissed'
            },
          },
        },
        {
          name: 'createdBy',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            description: 'User who created this reminder',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Validate currentStage belongs to selected pipeline
        if (data.currentStage && data.pipeline) {
          const stageId = typeof data.currentStage === 'string' 
            ? data.currentStage 
            : typeof data.currentStage === 'object' && data.currentStage?.id
              ? data.currentStage.id
              : data.currentStage
          
          const pipelineId = typeof data.pipeline === 'string' 
            ? data.pipeline 
            : typeof data.pipeline === 'object' && data.pipeline?.id
              ? data.pipeline.id
              : data.pipeline

          if (stageId && pipelineId) {
            const stage = await req.payload.findByID({
              collection: 'stages',
              id: stageId,
              depth: 1,
            })

            const stagePipelineId = typeof stage.pipeline === 'string' 
              ? stage.pipeline 
              : typeof stage.pipeline === 'object' && stage.pipeline?.id
                ? stage.pipeline.id
                : stage.pipeline

            // Convert both to strings for comparison to avoid type mismatch issues
            const pipelineIdStr = pipelineId ? String(pipelineId) : null
            const stagePipelineIdStr = stagePipelineId ? String(stagePipelineId) : null

            if (pipelineIdStr && stagePipelineIdStr && pipelineIdStr !== stagePipelineIdStr) {
              throw new Error('Current stage must belong to the selected pipeline')
            }
          }
        }

        // Auto-set currentStage to pipeline's default stage if not set and pipeline is selected
        if (data.pipeline && !data.currentStage && operation === 'create') {
          const pipelineId = typeof data.pipeline === 'string' 
            ? data.pipeline 
            : typeof data.pipeline === 'object' && data.pipeline?.id
              ? data.pipeline.id
              : data.pipeline

          if (pipelineId) {
            const _pipeline = await req.payload.findByID({
              collection: 'pipelines',
              id: pipelineId,
            })

            // Find default stage for this pipeline
            const defaultStage = await req.payload.find({
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

            if (defaultStage.docs.length > 0) {
              data.currentStage = defaultStage.docs[0].id
            } else {
              // If no default stage, get the first stage by order
              const firstStage = await req.payload.find({
                collection: 'stages',
                where: {
                  pipeline: {
                    equals: pipelineId,
                  },
                },
                sort: 'order',
                limit: 1,
              })

              if (firstStage.docs.length > 0) {
                data.currentStage = firstStage.docs[0].id
              }
            }
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        // Track stage changes in stageHistory
        if (operation === 'update' && previousDoc) {
          const currentStageId = typeof doc.currentStage === 'string' 
            ? doc.currentStage 
            : typeof doc.currentStage === 'object' && doc.currentStage?.id
              ? doc.currentStage.id
              : doc.currentStage

          const previousStageId = typeof previousDoc.currentStage === 'string' 
            ? previousDoc.currentStage 
            : typeof previousDoc.currentStage === 'object' && previousDoc.currentStage?.id
              ? previousDoc.currentStage.id
              : previousDoc.currentStage

          if (currentStageId && currentStageId !== previousStageId) {
            // Add to stage history
            const stageHistory = doc.stageHistory || []
            stageHistory.push({
              stage: currentStageId,
              changedAt: new Date().toISOString(),
              changedBy: req.user?.id,
            })

            // Update the document with new history
            await req.payload.update({
              collection: 'opportunities',
              id: doc.id,
              data: {
                stageHistory,
              },
              req,
            })

            // Update lead status to 'converted' if linked
            if (doc.lead) {
              const leadId = typeof doc.lead === 'string' 
                ? doc.lead 
                : typeof doc.lead === 'object' && doc.lead?.id
                  ? doc.lead.id
                  : doc.lead

              if (leadId) {
                await req.payload.update({
                  collection: 'leads',
                  id: leadId,
                  data: {
                    status: 'converted',
                  },
                  req,
                })
              }
            }
          }
        }

        return doc
      },
    ],
  },
}

