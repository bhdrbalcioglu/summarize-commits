<template>
  <div class="overflow-x-auto">
    <table class="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
      <thead class="bg-gray-200">
        <tr>
          <th
            v-for="m in 5"
            :key="'header-cell-' + m"
            class="py-4 px-6 border-b border-gray-200 text-center"
          >
            <Skeleton class="h-4 w-full" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="n in 5" :key="'body-' + n">
          <td class="py-4 px-6 border-b border-gray-200 text-center">
            <Skeleton class="h-12 w-12 rounded-full mx-auto" />
          </td>
          <td class="py-4 px-6 border-b border-gray-200 text-center">
            <Skeleton class="h-4 w-20 mx-auto" />
          </td>
          <td class="py-4 px-6 border-b border-gray-200 text-center">
            <Skeleton class="h-4 w-32 mx-auto" />
          </td>
          <td class="py-4 px-6 border-b border-gray-200 text-center">
            <Skeleton class="h-4 w-48 mx-auto" />
          </td>
          <td class="py-4 px-6 border-b border-gray-200 text-center">
            <Skeleton class="h-4 w-20 mx-auto" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { Skeleton } from "./ui/skeleton";
</script>
