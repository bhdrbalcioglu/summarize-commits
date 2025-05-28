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
        class: 'w-4 h-4'
      }),
    cell: ({ row }: { row: any }) =>
      h(Checkbox, {
        checked: row.getIsSelected(),
        'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
        'aria-label': 'Select row',
        class: 'w-4 h-4 transition-all duration-200 ease-in-out',
        style: row.getIsSelected() ? 'transform: scale(1.1); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);' : ''
      }),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'short_id',
    header: 'ID',
    cell: ({ row }: { row: any }) => h('span', { class: 'font-mono text-xs sm:text-sm' }, String(row.getValue('short_id') || ''))
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }: { row: any }) => {
      const title = String(row.getValue('title') || 'No title')
      return h(
        'div',
        {
          class: 'text-sm leading-relaxed break-words hyphens-auto pr-2',
          style: 'word-break: break-word; overflow-wrap: break-word; hyphens: auto;'
        },
        title
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
      return h(
        'span',
        {
          class: 'text-xs sm:text-sm block truncate',
          title: authorName // title prop'u için string güvenli
        },
        authorName // Çocuk olarak string güvenli
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
          class: 'flex items-center text-xs sm:text-sm p-1 sm:p-2'
        },
        // Button çocuklarını slot fonksiyonu olarak geçmek daha güvenli olabilir
        () => ['Date', h(ArrowUpDown, { class: 'ml-1 h-3 w-3 sm:h-4 sm:w-4' })]
      )
    },
    cell: ({ row }: { row: any }) => {
      const dateStr = row.getValue('authored_date')
      if (!dateStr) return h('span', { class: 'text-xs sm:text-sm' }, 'Unknown')
      try {
        const date = new Date(dateStr as string) // dateStr'nin string olduğundan emin olun
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
          minute: '2-digit'
        })
        return h(
          'span',
          {
            class: 'text-xs sm:text-sm',
            title: fullFormat
          },
          [h('span', { class: 'sm:hidden' }, shortFormat), h('span', { class: 'hidden sm:inline' }, fullFormat)]
        )
      } catch (e) {
        return h('span', { class: 'text-xs sm:text-sm' }, 'Invalid Date')
      }
    }
  },
  {
    accessorKey: 'web_url',
    header: 'Actions',
    cell: ({ row }: { row: any }) => {
      const commit = row.original as Commit
      const provider = commit.provider || 'provider'
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1)
      return h(
        'a',
        {
          href: row.getValue('web_url') as string, // URL'nin string olduğundan emin olun
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-blue-600 hover:text-blue-800 text-xs sm:text-sm inline-block',
          title: `View on ${providerName}`
        },
        [h('span', { class: 'sm:hidden' }, '🔗'), h('span', { class: 'hidden sm:inline' }, `View on ${providerName}`)]
      )
    }
  }
]
