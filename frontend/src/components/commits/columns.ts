import type { ColumnDef } from '@tanstack/vue-table'
import { h, Ref } from 'vue'
import type { Commit } from '../../types/commit'
import { ArrowUpDown } from 'lucide-vue-next'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { FilterFn } from '@tanstack/vue-table'
import AuthorFilterHeader from './AuthorFilterHeader.vue'

const authorFilterFn: FilterFn<Commit> = (row, columnId, filterValue) => {
  if (!filterValue || filterValue.length === 0) {
    return true // No filter applied
  }
  const authorName = row.getValue(columnId) // getValue string bir değer döndürmeli (accessorFn sayesinde)
  // Eğer filterValue bir dizi ise ve authorName string ise .includes kullanılabilir.
  // filterValue tipinin string[] olduğundan emin olun.
  if (Array.isArray(filterValue) && typeof authorName === 'string') {
    return filterValue.includes(authorName)
  }
  return true // Veya uygun bir filtreleme mantığı
}

export const columns = (selectedAuthors: Ref<string[]>, authorsList: Ref<string[]>): ColumnDef<Commit>[] => [
  {
    id: 'select',
    header: ({ table }: { table: any }) =>
      h(Checkbox, {
        checked: table.getIsAllPageRowsSelected(),
        'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
        'aria-label': 'Select all',
        class: 'w-4 h-4 transition-all duration-200 hover:scale-110'
      }),
    cell: ({ row }: { row: any }) =>
      h(Checkbox, {
        checked: row.getIsSelected(),
        'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
        'aria-label': 'Select row',
        class: 'w-4 h-4 transition-all duration-200 ease-in-out hover:scale-110 focus:ring-2 focus:ring-primary/20',
        style: row.getIsSelected() ? 'transform: scale(1.05); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);' : ''
      }),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'short_id',
    header: () => h('div', { class: 'flex items-center space-x-2' }, [h('i', { class: 'fa-solid fa-hashtag text-xs text-muted-foreground' }), h('span', { class: 'font-medium' }, 'ID')]),
    cell: ({ row }: { row: any }) => {
      const shortId = String(row.getValue('short_id') || '')
      return h('div', { class: 'flex items-center space-x-2 group' }, [
        h('i', { class: 'fa-solid fa-code text-xs text-muted-foreground group-hover:text-primary transition-colors duration-200' }),
        h(
          'span',
          {
            class: 'font-mono text-xs sm:text-sm font-medium text-foreground bg-muted/30 px-2 py-1 rounded border group-hover:bg-muted/50 transition-all duration-200',
            title: shortId
          },
          shortId
        )
      ])
    }
  },
  {
    accessorKey: 'title',
    header: () => h('div', { class: 'flex items-center space-x-2' }, [h('i', { class: 'fa-solid fa-file-lines text-xs text-muted-foreground' }), h('span', { class: 'font-medium' }, 'Title')]),
    cell: ({ row }: { row: any }) => {
      const title = String(row.getValue('title') || 'No title')
      const isLongTitle = title.length > 60
      return h(
        'div',
        {
          class: 'text-sm leading-relaxed break-words hyphens-auto pr-2 group',
          style: 'word-break: break-word; overflow-wrap: break-word; hyphens: auto;'
        },
        [
          h(
            'div',
            {
              class: 'text-foreground font-medium group-hover:text-primary transition-colors duration-200',
              title: title
            },
            isLongTitle ? title.substring(0, 60) + '...' : title
          ),
          ...(isLongTitle
            ? [
                h(
                  'div',
                  {
                    class: 'text-xs text-muted-foreground mt-1 group-hover:text-muted-foreground/80 transition-colors duration-200'
                  },
                  `${title.length} characters`
                )
              ]
            : [])
        ]
      )
    }
  },
  {
    // DEĞİŞİKLİK BURADA: accessorFn'in her zaman string döndürmesini sağlayın
    accessorFn: (originalRow) => {
      const name = originalRow.author?.name
      if (typeof name === 'object' && name !== null) {
        // Eğer 'name' bir nesne ise, uygun bir string gösterimi seçin
        // Örneğin, nesneyi JSON string'ine çevirebilir veya bir placeholder kullanabilirsiniz.
        // return JSON.stringify(name); // Veya
        return '[Nesne Verisi]' // Veya
      }
      return String(name || 'Unknown') // Diğer tüm durumlar için string'e çevir
    },
    id: 'author_name',
    header: () => {
      return h(AuthorFilterHeader, {
        selectedAuthors: selectedAuthors.value,
        authorsList: authorsList.value,
        'onUpdate:selectedAuthors': (newAuthors: string[]) => {
          selectedAuthors.value = newAuthors
        }
      })
    },
    cell: ({ row }) => {
      // accessorFn string döndürdüğü için getValue("author_name") de string olmalı
      const authorName = row.getValue('author_name') as string // Tipini belirtmek iyi bir pratik
      const initials = authorName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
      return h(
        'div',
        {
          class: 'flex items-center space-x-2 group',
          title: `Commits by ${authorName}`
        },
        [
          h(
            'div',
            {
              class: 'w-8 h-8 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center text-xs font-bold group-hover:bg-primary/20 transition-all duration-200'
            },
            initials
          ),
          h(
            'span',
            {
              class: 'text-xs sm:text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200'
            },
            authorName
          )
        ]
      )
    },
    filterFn: authorFilterFn
  },
  {
    accessorFn: (row) => row.authored_date,
    id: 'authored_date',
    header: ({ column }: { column: any }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          class: 'flex items-center space-x-2 text-xs sm:text-sm p-1 sm:p-2 hover:bg-muted/60 transition-all duration-200'
        },
        // Button çocuklarını slot fonksiyonu olarak geçmek daha güvenli olabilir
        () => [h('i', { class: 'fa-solid fa-clock text-xs text-muted-foreground' }), h('span', { class: 'font-medium' }, 'Date'), h(ArrowUpDown, { class: 'ml-1 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' })]
      )
    },
    cell: ({ row }: { row: any }) => {
      const dateStr = row.getValue('authored_date')
      if (!dateStr) return h('span', { class: 'text-xs sm:text-sm text-muted-foreground' }, 'Unknown')
      try {
        const date = new Date(dateStr as string)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        // Color coding based on age
        let colorClass = 'text-green-600 dark:text-green-400' // Recent
        let ageIcon = 'fa-clock'
        if (diffDays > 30) {
          colorClass = 'text-amber-600 dark:text-amber-400' // Medium age
          ageIcon = 'fa-calendar'
        }
        if (diffDays > 90) {
          colorClass = 'text-red-600 dark:text-red-400' // Old
          ageIcon = 'fa-calendar-xmark'
        }

        const shortFormat = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: '2-digit'
        })
        const fullFormat = date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })

        let relativeTime = ''
        if (diffDays === 0) relativeTime = 'Today'
        else if (diffDays === 1) relativeTime = 'Yesterday'
        else if (diffDays < 7) relativeTime = `${diffDays} days ago`
        else if (diffDays < 30) relativeTime = `${Math.floor(diffDays / 7)} weeks ago`
        else if (diffDays < 365) relativeTime = `${Math.floor(diffDays / 30)} months ago`
        else relativeTime = `${Math.floor(diffDays / 365)} years ago`

        return h(
          'div',
          {
            class: 'flex items-center space-x-2 group',
            title: `${fullFormat} (${relativeTime})`
          },
          [h('i', { class: `fa-solid ${ageIcon} text-xs ${colorClass}` }), h('div', { class: 'flex flex-col' }, [h('span', { class: `text-xs sm:text-sm font-medium ${colorClass}` }, [h('span', { class: 'sm:hidden' }, shortFormat), h('span', { class: 'hidden sm:inline' }, fullFormat)]), h('span', { class: 'text-xs text-muted-foreground' }, relativeTime)])]
        )
      } catch (e) {
        return h('span', { class: 'text-xs sm:text-sm text-destructive' }, 'Invalid Date')
      }
    }
  },
  {
    accessorKey: 'web_url',
    header: () => h('div', { class: 'flex items-center space-x-2' }, [h('i', { class: 'fa-solid fa-external-link text-xs text-muted-foreground' }), h('span', { class: 'font-medium' }, 'Actions')]),
    cell: ({ row }: { row: any }) => {
      const commit = row.original as Commit
      const provider = commit.provider || 'provider'
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1)
      const providerIcon = provider === 'github' ? 'fa-brands fa-github' : provider === 'gitlab' ? 'fa-brands fa-gitlab' : 'fa-solid fa-code-branch'

      return h(
        'a',
        {
          href: row.getValue('web_url') as string,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-md hover:bg-primary/20 hover:border-primary/30 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-primary/20',
          title: `View commit on ${providerName}`
        },
        [h('i', { class: `${providerIcon} text-sm` }), h('span', { class: 'hidden sm:inline' }, `View on ${providerName}`), h('span', { class: 'sm:hidden' }, 'View'), h('i', { class: 'fa-solid fa-external-link text-xs opacity-60' })]
      )
    }
  }
]
