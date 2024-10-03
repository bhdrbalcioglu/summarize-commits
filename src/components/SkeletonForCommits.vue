<template>
  <div class="overflow-x-auto">
    <table class="min-w-full bg-white shadow-inner rounded-lg overflow-hidden">
      <thead class="bg-gray-200">
        <tr class="animate-pulse">
          <th class="py-4 px-6 border-b border-gray-200 text-left"></th>
          <th class="py-4 px-6 border-b border-gray-200 text-left"></th>
          <th class="py-4 px-6 border-b border-gray-200 text-left"></th>
          <th class="py-4 px-6 border-b border-gray-200 text-left"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="n in 5" :key="'body-' + n" class="animate-pulse">
          <td class="py-4 px-6 border-b border-gray-200">
            <div class="bg-gray-300 rounded h-4 w-4"></div>
          </td>
          <td class="py-4 px-6 border-b border-gray-200">
            <div class="bg-gray-300 h-4 w-full"></div>
          </td>
          <td class="py-4 px-6 border-b border-gray-200">
            <div class="bg-gray-300 h-4 w-24"></div>
          </td>
          <td class="py-4 px-6 border-b border-gray-200">
            <div class="bg-gray-300 h-4 w-20"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

