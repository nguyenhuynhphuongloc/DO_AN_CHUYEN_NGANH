import type { CollectionConfig } from 'payload'

import { adminFieldOnly, adminOnly, adminOnlyBoolean, adminOrSelf, isAdmin } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    group: 'Finance Operations',
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    admin: adminOnlyBoolean,
    create: () => true,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: adminOnly,
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation, context }) => {
        if (!data) return data

        if (!isAdmin(req.user) && !context.allowRoleOverride) {
          if (operation === 'create') {
            data.role = 'user'
          }

          if (operation === 'update' && 'role' in data) {
            delete data.role
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      defaultValue: 'user',
      required: true,
      saveToJWT: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      admin: {
        position: 'sidebar',
      },
      access: {
        create: adminFieldOnly,
        update: adminFieldOnly,
      },
    },
    {
      name: 'name',
      type: 'text',
      label: 'Ho va ten',
    },
    {
      name: 'currency',
      type: 'select',
      label: 'Don vi tien te',
      options: [
        { label: 'VND', value: 'VND' },
        { label: 'USD', value: 'USD' },
      ],
      defaultValue: 'VND',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'Anh dai dien',
    },
  ],
}
