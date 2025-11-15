import type { CollectionConfig } from 'payload'

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'company', 'status', 'source', 'assignedTo'],
    description: 'Manage leads and convert them to opportunities',
    listSearchableFields: ['email', 'firstName', 'lastName', 'company', 'phone'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: ({ req: { user } }) => {
      // Only admins and managers can delete leads
      return user?.role === 'admin' || user?.role === 'manager'
    },
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
      admin: {
        description: 'Lead\'s first name',
      },
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
      admin: {
        description: 'Lead\'s last name',
      },
    },
    {
      name: 'email',
      type: 'email',
      unique: true,
      admin: {
        description: 'Lead\'s email address',
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Lead\'s phone number',
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
      name: 'jobTitle',
      type: 'text',
      admin: {
        description: 'Job title',
      },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'website',
      options: [
        {
          label: 'Website',
          value: 'website',
        },
        {
          label: 'Referral',
          value: 'referral',
        },
        {
          label: 'Cold Call',
          value: 'cold-call',
        },
        {
          label: 'Email Campaign',
          value: 'email-campaign',
        },
        {
          label: 'Social Media',
          value: 'social-media',
        },
        {
          label: 'Trade Show',
          value: 'trade-show',
        },
        {
          label: 'Partner',
          value: 'partner',
        },
        {
          label: 'Other',
          value: 'other',
        },
      ],
      admin: {
        description: 'Where did this lead come from?',
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        {
          label: 'New',
          value: 'new',
        },
        {
          label: 'Contacted',
          value: 'contacted',
        },
        {
          label: 'Qualified',
          value: 'qualified',
        },
        {
          label: 'Unqualified',
          value: 'unqualified',
        },
        {
          label: 'Converted',
          value: 'converted',
        },
      ],
      admin: {
        description: 'Current status of the lead',
        position: 'sidebar',
      },
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User assigned to this lead',
        position: 'sidebar',
      },
      filterOptions: ({ user: _user }) => {
        // Only show active users
        return {
          isActive: {
            equals: true,
          },
        }
      },
    },
    {
      name: 'address',
      type: 'group',
      admin: {
        description: 'Lead\'s address',
      },
      fields: [
        {
          name: 'street',
          type: 'text',
        },
        {
          name: 'city',
          type: 'text',
        },
        {
          name: 'state',
          type: 'text',
        },
        {
          name: 'zip',
          type: 'text',
        },
        {
          name: 'country',
          type: 'text',
          defaultValue: 'India',
        },
      ],
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      admin: {
        description: 'Tags for categorizing leads',
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
      name: 'convertedToOpportunity',
      type: 'relationship',
      relationTo: 'opportunities',
      admin: {
        description: 'Opportunity created from this lead',
        readOnly: true,
        position: 'sidebar',
      },
      access: {
        update: () => false, // Can only be set programmatically
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Validate email uniqueness (only if email is provided)
        if (data.email && data.email.trim()) {
          const normalizedEmail = data.email.toLowerCase().trim()
          
          if (operation === 'create') {
            const existingLead = await req.payload.find({
              collection: 'leads',
              where: {
                email: {
                  equals: normalizedEmail,
                },
              },
              limit: 1,
            })

            if (existingLead.docs.length > 0) {
              throw new Error(`A lead with email ${normalizedEmail} already exists`)
            }
          }

          // Normalize email
          data.email = normalizedEmail
        }

        // Normalize names
        if (data.firstName) {
          data.firstName = data.firstName.trim()
        }
        if (data.lastName) {
          data.lastName = data.lastName.trim()
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req: _req }) => {
        // Log activity when lead status changes
        if (operation === 'update' && previousDoc && doc.status !== previousDoc.status) {
          // This will be used in Phase 5 when Notes collection is created
          // For now, we'll just track the change
          console.log(`Lead ${doc.id} status changed from ${previousDoc.status} to ${doc.status}`)
        }
        return doc
      },
    ],
  },
}

