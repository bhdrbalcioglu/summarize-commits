<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        class="w-[200px] justify-between"
      >
        <span class="flex items-center">
          {{ selectedBranch?.name || "Select branch..." }}
          <Badge v-if="selectedBranch?.default" variant="secondary" class="ml-2"
            >Default</Badge
          >
        </span>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0">
      <Command>
        <CommandInput class="h-9" placeholder="Search branches..." />
        <CommandEmpty>No branch found.</CommandEmpty>
        <CommandList>
          <CommandGroup>
            <CommandItem
              v-for="branch in commitStore.branches"
              :key="branch.name"
              :value="branch.name"
              @select="commitStore.setSelectedBranch(branch.name)"
            >
              <span class="flex items-center">
                {{ branch.name }}
                <Badge v-if="branch.default" class="ml-5">Default</Badge>
              </span>
              <Check
                :class="
                  cn(
                    'ml-auto h-4 w-4 text-green-500',
                    commitStore.selectedBranch === branch.name
                      ? 'opacity-100'
                      : 'opacity-0'
                  )
                "
              />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Check, ChevronsUpDown } from "lucide-vue-next";
import { cn } from "@/components/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCommitStore } from "@/stores/commit";
import { Badge } from "@/components/ui/badge";
const commitStore = useCommitStore();
const open = ref(false);

const selectedBranch = computed(() =>
  commitStore.branches.find(
    (branch) => branch.name === commitStore.selectedBranch
  )
);
</script>
