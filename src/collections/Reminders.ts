import type { CollectionConfig } from 'payload'

export const Reminders: CollectionConfig = {
  slug: 'reminders',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'reminderDate', 'status', 'assignedTo', 'opportunity', 'type'],
    description: 'Manage reminders for opportunities and leads. Set reminders for follow-ups, meetings, and important dates.',
    listSearchableFields: ['title', 'description'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Reminder title or subject',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Additional details about the reminder',
      },
    },
    {
      name: 'reminderDate',
      type: 'date',
      required: true,
      admin: {
        description: 'Date and time for the reminder',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      validate: (value, { data }) => {
        if (!value) {
          return 'Reminder date is required'
        }

        const reminderDate = new Date(value)
        if (Number.isNaN(reminderDate.getTime())) {
          return 'Reminder date is invalid'
        }

        const isDismissed = data?.status === 'dismissed'
        if (!isDismissed && reminderDate.getTime() <= Date.now()) {
          return 'Reminder date must be in the future unless the reminder is dismissed'
        }

        return true
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
        description: 'How the reminder should be delivered',
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
        description: 'Current status of the reminder',
      },
    },
    {
      name: 'opportunity',
      type: 'relationship',
      relationTo: 'opportunities',
      admin: {
        description: 'Related opportunity (if applicable)',
        position: 'sidebar',
      },
    },
    {
      name: 'lead',
      type: 'relationship',
      relationTo: 'leads',
      admin: {
        description: 'Related lead (if applicable)',
        position: 'sidebar',
      },
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'User who should be reminded',
        position: 'sidebar',
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
        description: 'Priority level of the reminder',
      },
    },
    {
      name: 'snoozedUntil',
      type: 'date',
      admin: {
        description: 'If snoozed, when to show this reminder again',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        condition: (data) => {
          return data.status === 'pending'
        },
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
        condition: (data) => {
          return data.status === 'sent'
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
        condition: (data) => {
          return data.status === 'dismissed'
        },
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who created this reminder',
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ req, operation, value }) => {
            // Auto-set createdBy to current user if not provided
            if (operation === 'create' && !value && req.user) {
              console.log('[Reminders.beforeChange] Auto-setting createdBy to current user:', req.user.id)
              return req.user.id
            }
            return value
          },
        ],
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        console.log('[Reminders.beforeChange] ========== HOOK CALLED ==========')
        console.log('[Reminders.beforeChange] Operation:', operation)
        console.log('[Reminders.beforeChange] Data:', JSON.stringify(data, null, 2))

        // Validate reminderDate is in future (unless status is dismissed)
        if (data.reminderDate && data.status !== 'dismissed') {
          const reminderDate = new Date(data.reminderDate)
          const now = new Date()
          
          console.log('[Reminders.beforeChange] Validating reminderDate:', {
            reminderDate: reminderDate.toISOString(),
            now: now.toISOString(),
            isFuture: reminderDate > now,
          })

          if (reminderDate <= now) {
            console.warn('[Reminders.beforeChange] WARNING: Reminder date is in the past')
            // Allow it but log warning (user might want to create past reminders for records)
          }
        }

        // Auto-set createdBy if not provided
        if (operation === 'create' && !data.createdBy && req.user) {
          console.log('[Reminders.beforeChange] Auto-setting createdBy:', req.user.id)
          data.createdBy = req.user.id
        }

        console.log('[Reminders.beforeChange] Final data:', JSON.stringify(data, null, 2))
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        console.log('[Reminders.afterChange] ========== HOOK CALLED ==========')
        console.log('[Reminders.afterChange] Operation:', operation)
        console.log('[Reminders.afterChange] Document ID:', doc.id)
        console.log('[Reminders.afterChange] Document:', JSON.stringify(doc, null, 2))

        // Log status changes
        if (operation === 'update' && previousDoc) {
          const previousStatus = previousDoc.status
          const currentStatus = doc.status

          if (previousStatus !== currentStatus) {
            console.log('[Reminders.afterChange] Status changed:', {
              from: previousStatus,
              to: currentStatus,
              reminderId: doc.id,
              reminderTitle: doc.title,
            })

            // Auto-set timestamps based on status
            if (currentStatus === 'sent' && !doc.sentAt) {
              console.log('[Reminders.afterChange] Auto-setting sentAt timestamp')
              await req.payload.update({
                collection: 'reminders',
                id: doc.id,
                data: {
                  sentAt: new Date().toISOString(),
                },
                req,
              })
            }

            if (currentStatus === 'dismissed' && !doc.dismissedAt) {
              console.log('[Reminders.afterChange] Auto-setting dismissedAt timestamp')
              await req.payload.update({
                collection: 'reminders',
                id: doc.id,
                data: {
                  dismissedAt: new Date().toISOString(),
                },
                req,
              })
            }
          }
        }

        console.log('[Reminders.afterChange] Hook completed successfully')
        return doc
      },
    ],
    afterRead: [
      async ({ doc, req }) => {
        // Log reminder reads for debugging (can be removed in production)
        console.log('[Reminders.afterRead] Reminder read:', {
          id: doc.id,
          title: doc.title,
          status: doc.status,
          reminderDate: doc.reminderDate,
        })
        return doc
      },
    ],
  },
}

