// src/components/groups/columns.ts

import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import type { Group } from '../../types/group'
import { ArrowUpDown } from 'lucide-vue-next'
import { Button } from '../ui/button'

export const columns: ColumnDef<Group>[] = [
  {
    accessorKey: 'avatar_url',
    header: 'Logo',
    cell: ({ row }) => {
      const avatarUrl = row.getValue('avatar_url')
      return avatarUrl
        ? h('img', {
            src: avatarUrl,
            alt: 'Logo',
            class: 'w-12 h-12 rounded-full'
          })
        : h('i', {
            class: 'fa-solid fa-share-nodes text-4xl'
          })
    }
  },
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'full_name',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          class: 'flex items-center'
        },
        () => ['Name', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      )
    },
    cell: ({ row }) => h('span', { class: 'font-bold text-lg' }, row.getValue('full_name'))
  },
  {
    accessorKey: 'visibility',
    header: 'Visibility',
    cell: ({ row }) => {
      const visibility = row.getValue('visibility')
      if (visibility === 'public') {
        return h('i', { class: 'fa-solid fa-eye' })
      } else if (visibility === 'private') {
        return h('i', { class: 'fa-solid fa-lock' })
      } else {
        return 'Unknown'
      }
    }
  }
]
