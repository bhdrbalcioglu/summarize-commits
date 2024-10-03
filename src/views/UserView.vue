<template>
  <div
    class="flex flex-col lg:flex-row items-start justify-start min-h-screen p-8 bg-gray-100"
  >
    <div class="bg-white shadow-md rounded-lg p-6 max-w-sm lg:mr-8">
      <div class="flex flex-col items-center text-center">
        <img
          :src="userStore.user?.avatar_url"
          alt="Profile Image"
          class="w-24 h-24 rounded-full mb-4"
          @click="showUserStore"
        />
        <h1 class="text-2xl font-bold">{{ userStore.user?.name }}</h1>
        <p class="text-lg text-gray-500">{{ userStore.user?.username }}</p>
        <p class="text-sm text-gray-500">{{ userStore.user?.email }}</p>
        <p class="text-sm text-gray-500">{{ userStore.user?.location }}</p>
        <p class="text-xs text-gray-400 mt-2">
          Member since:
          {{
            userStore.user?.created_at
              ? new Date(userStore.user.created_at).toLocaleDateString()
              : "N/A"
          }}
        </p>

        <div class="mt-4 space-y-2">
          <p class="text-sm text-gray-600">
            <strong>Public Email:</strong>
            {{ userStore.user?.public_email || "Not available" }}
          </p>
          <p class="text-sm text-gray-600">
            <strong>State:</strong> {{ userStore.user?.state }}
          </p>
        </div>

        <div class="mt-4 space-x-4">
          <a
            v-if="userStore.user?.linkedin_url"
            :href="`https://${userStore.user.linkedin_url.replace(
              /^https?:\/\//,
              ''
            )}`"
            target="_blank"
          >
            <i class="fa-brands fa-linkedin text-blue-500"></i>
          </a>
          <a
            v-if="userStore.user?.twitter_url"
            :href="`https://${userStore.user.twitter_url.replace(
              /^https?:\/\//,
              ''
            )}`"
            target="_blank"
          >
            <i class="fa-brands fa-twitter text-blue-400"></i>
          </a>
          <a
            v-if="userStore.user?.website_url"
            :href="userStore.user.website_url"
            target="_blank"
          >
            <i class="fa-solid fa-globe text-gray-600"></i>
          </a>
          <a
            v-if="userStore.user?.skype"
            :href="'skype:' + userStore.user.skype"
            target="_blank"
          >
            <i class="fa-brands fa-skype text-blue-300"></i>
          </a>
          <a
            v-if="userStore.user?.discord"
            :href="'https://discord.com/users/' + userStore.user.discord"
            target="_blank"
          >
            <i class="fa-brands fa-discord text-blue-300"></i>
          </a>
        </div>
      </div>
    </div>

    <div
      class="bg-white shadow-md rounded-lg p-6 max-w-xl w-full mt-8 lg:mt-0 lg:ml-8"
    >
      <h2 class="text-xl font-bold mb-4">Navigation</h2>
      <ul class="space-y-4">
        <li>
          <router-link
            to="/groups"
            class="flex items-center text-blue-500 hover:underline"
          >
            <i class="fa-solid fa-users mr-2"></i> Groups
          </router-link>
          <hr class="my-2 border-t border-gray-300" />
        </li>
        <li>
          <router-link
            to="/projects"
            class="flex items-center text-blue-500 hover:underline"
          >
            <i class="fa-solid fa-folder-open mr-2"></i> Projects
          </router-link>
          <hr class="my-2 border-t border-gray-300" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from "../stores/user";

const userStore = useUserStore();

const showUserStore = () => {
  console.log(userStore.user);
};
</script>