<script setup lang="ts">
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Calendar from "./Calendar.vue";

const emit = defineEmits([
  "selectLast30Days",
  "selectLast90Days",
  "selectCustomDate",
]);
</script>

<template>
  <Popover>
    <PopoverTrigger>
      <Button variant="outline" class="w-full justify-start">
        <i class="fa-solid fa-calendar-days"></i>
        <span class="ml-2">Select Commits by Date </span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-100 p-0">
      <div class="flex flex-col space-y-1">
        <Button
          variant="ghost"
          class="justify-start"
          @click="emit('selectLast30Days')"
        >
          Select Commits on the last 30 days
        </Button>
        <Button
          variant="ghost"
          class="justify-start"
          @click="emit('selectLast90Days')"
        >
          Select Commits on the last 90 days
        </Button>
        <Calendar
          @select-date="
            (date1, date2) => emit('selectCustomDate', date1, date2)
          "
        />
      </div>
    </PopoverContent>
  </Popover>
</template>
