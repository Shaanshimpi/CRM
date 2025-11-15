import type { CollectionConfig } from 'payload'

// User roles enum
export const userRoles = ['admin', 'manager', 'sales-rep', 'viewer'] as const

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'role', 'department'],
  },
  auth: {
    tokenExpiration: 7200, // 2 hours
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      // Only admins and managers can create users
      return user?.role === 'admin' || user?.role === 'manager'
    },
    update: ({ req: { user } }) => {
      // Admins can update anyone, users can update themselves
      if (user?.role === 'admin') return true
      return {
        id: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete users
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
      admin: {
        description: 'User\'s first name',
      },
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
      admin: {
        description: 'User\'s last name',
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'sales-rep',
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Manager',
          value: 'manager',
        },
        {
          label: 'Sales Rep',
          value: 'sales-rep',
        },
        {
          label: 'Viewer',
          value: 'viewer',
        },
      ],
      admin: {
        description: 'User role determines access permissions',
        position: 'sidebar',
      },
      access: {
        update: ({ req: { user } }) => {
          // Only admins can change roles
          return user?.role === 'admin'
        },
      },
    },
    {
      name: 'department',
      type: 'text',
      admin: {
        description: 'User\'s department',
        position: 'sidebar',
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'User\'s phone number',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'User profile picture',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether the user account is active',
        position: 'sidebar',
      },
      access: {
        update: ({ req: { user } }) => {
          // Only admins can deactivate users
          return user?.role === 'admin'
        },
      },
    },
  ],
}
