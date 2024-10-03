<template>
  <div class="overflow-x-auto">
    <table class="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
      <thead class="bg-gray-200 ">
        <tr v-for="n in 5" :key="'header-' + n" class="animate-pulse">
          <th class="py-4 px-6 border-b border-gray-200 text-center"></th>
          <th class="py-4 px-6 border-b border-gray-200 text-center"></th>
          <th class="py-4 px-6 border-b border-gray-200 text-center"></th>
          <th class="py-4 px-6 border-b border-gray-200 text-center"></th>
          <th class="py-4 px-6 border-b border-gray-200 text-center"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="n in 5" :key="'body-' + n" class="animate-pulse">
          <td class="py-4 px-6 border-b border-gray-200 text-center">
            <div class="bg-gray-300 rounded-full h-12 w-12 mx-auto"></div>
          </td>
          <td class="py-4 px-6 border-b border-gray-200 text-center">
            <div class="bg-gray-300 h-4 w-20 mx-auto"></div>
          </td>
          <td class="py-4 px-6 border-b border-gray-200 text-center">
            <div class="bg-gray-300 h-4 w-32 mx-auto"></div>
          </td>
          <td class="py-4 px-6 border-b border-gray-200 text-center">
            <div class="bg-gray-300 h-4 w-48 mx-auto"></div>
          </td>
          <td class="py-4 px-6 border-b border-gray-200 text-center">
            <div class="bg-gray-300 h-4 w-20 mx-auto"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
