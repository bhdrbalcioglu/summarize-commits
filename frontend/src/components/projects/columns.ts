import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import type { Project } from '../../types/project'
import { ArrowUpDown } from 'lucide-vue-next'
import { Button } from '../ui/button'

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          class: 'flex items-center px-0 hover:bg-transparent hover:text-primary transition-colors font-semibold'
        },
        () => ['Project', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      )
    },
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center space-x-3' }, [h('div', { class: 'w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center' }, [h('i', { class: 'fa-solid fa-folder text-primary text-sm' })]), h('div', { class: 'flex flex-col' }, [h('span', { class: 'font-semibold text-foreground group-hover:text-primary transition-colors' }, row.getValue('name')), h('span', { class: 'text-xs text-muted-foreground' }, row.original.path_with_namespace || 'No path')])])
    }
  },
  {
    accessorKey: 'namespace.name',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          class: 'flex items-center px-0 hover:bg-transparent hover:text-primary transition-colors font-semibold'
        },
        () => ['Group', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      )
    },
    cell: ({ row }) => {
      const groupName = row.original.namespace?.name
      if (groupName) {
        return h('div', { class: 'flex items-center space-x-2' }, [h('div', { class: 'w-6 h-6 bg-muted rounded-md flex items-center justify-center' }, [h('i', { class: 'fa-solid fa-users text-muted-foreground text-xs' })]), h('span', { class: 'text-foreground font-medium' }, groupName)])
      }
      return h('span', { class: 'text-muted-foreground italic' }, 'No group')
    }
  },
  {
    accessorKey: 'description',
    header: () => h('span', { class: 'font-semibold text-foreground' }, 'Description'),
    cell: ({ row }) => {
      const description = row.getValue('description') as string
      if (description) {
        return h(
          'p',
          {
            class: 'text-sm text-muted-foreground line-clamp-2 max-w-xs group-hover:text-foreground transition-colors',
            title: description
          },
          description
        )
      }
      return h('span', { class: 'text-muted-foreground italic text-sm' }, 'No description')
    }
  },
  {
    accessorKey: 'visibility',
    header: () => h('span', { class: 'font-semibold text-foreground' }, 'Visibility'),
    cell: ({ row }) => {
      const visibility = row.getValue('visibility') as string
      if (visibility === 'public') {
        return h('div', { class: 'flex items-center space-x-2' }, [h('div', { class: 'w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center' }, [h('i', { class: 'fa-solid fa-eye text-green-600 dark:text-green-400 text-xs' })]), h('span', { class: 'text-sm font-medium text-green-700 dark:text-green-300' }, 'Public')])
      } else if (visibility === 'private') {
        return h('div', { class: 'flex items-center space-x-2' }, [h('div', { class: 'w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-md flex items-center justify-center' }, [h('i', { class: 'fa-solid fa-lock text-orange-600 dark:text-orange-400 text-xs' })]), h('span', { class: 'text-sm font-medium text-orange-700 dark:text-orange-300' }, 'Private')])
      } else {
        return h('span', { class: 'text-muted-foreground italic text-sm' }, 'Unknown')
      }
    }
  },
  {
    accessorKey: 'last_activity_at',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          class: 'flex items-center px-0 hover:bg-transparent hover:text-primary transition-colors font-semibold'
        },
        () => ['Last Activity', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('last_activity_at') as string)
      const now = new Date()
      const diffInMs = now.getTime() - date.getTime()
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

      let timeAgo = ''
      let colorClass = 'text-foreground'

      if (diffInDays === 0) {
        timeAgo = 'Today'
        colorClass = 'text-green-600 dark:text-green-400'
      } else if (diffInDays === 1) {
        timeAgo = '1 day ago'
        colorClass = 'text-green-600 dark:text-green-400'
      } else if (diffInDays < 7) {
        timeAgo = `${diffInDays} days ago`
        colorClass = 'text-blue-600 dark:text-blue-400'
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7)
        timeAgo = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
        colorClass = 'text-orange-600 dark:text-orange-400'
      } else {
        timeAgo = date.toLocaleDateString()
        colorClass = 'text-muted-foreground'
      }

      return h('div', { class: 'flex flex-col' }, [h('span', { class: `text-sm font-medium ${colorClass}` }, timeAgo), h('span', { class: 'text-xs text-muted-foreground' }, date.toLocaleString())])
    }
  }
]
