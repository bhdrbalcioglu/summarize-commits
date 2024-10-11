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


const handleLast30Days = () => {
  emit("selectLast30Days");
};

const handleLast90Days = () => {
  emit("selectLast90Days");
};

const handleCustomDate = (date1: Date, date2: Date) => {
  emit("selectCustomDate", date1, date2);
};
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
        <Button variant="ghost" class="justify-start" @click="handleLast30Days">
          Select Commits on the last 30 days
        </Button>
        <Button variant="ghost" class="justify-start" @click="handleLast90Days">
          Select Commits on the last 90 days
        </Button>
        <Calendar @select-custom-date="handleCustomDate" />
      </div>
    </PopoverContent>
  </Popover>
</template>
