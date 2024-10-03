<template>
  <nav
    class="bg-retro-teal p-4 flex flex-col md:flex-row justify-center md:justify-between items-center"
  >
    <LoginModal :modalActive="modalActive" @close-modal="toggleModal">
      <div class="max-w-lg">
        <h1 class="text-3xl text-retro-black text-center font-bold mx-auto">
          Login
        </h1>
        <div class="flex flex-col space-y-2 py-10">
          <button
            class="text-retro-black font-bold py-2 px-4 rounded-retro-rounded border border-retro-dark-gray flex items-center w-full hover:border-retro-dark-gray hover:bg-retro-dark-gray hover:text-white"
            @click="loginWithGitLab"
          >
            <i class="fa-brands fa-gitlab mr-2"></i>
            Login with Gitlab
          </button>
        </div>
        <div class="flex justify-center">
          <button
            class="text-retro-dark-gray py-1 px-2 font-italic text-center"
            @click="toggleModal"
          >
            Close
          </button>
        </div>
      </div>
    </LoginModal>

    <div
      class="w-full flex flex-col md:flex-row justify-center md:justify-between items-center mt-4 md:mt-0"
    >
      <h1
        v-if="userStore.user && route.name !== 'User'"
        class="text-3xl text-retro-black text-center font-bold hover:text-retro-dark-gray cursor-pointer mx-auto"
        @click="pushToUserView"
      >
        Git Commit Summarizer
      </h1>
      <h1
        v-else
        class="text-3xl text-retro-black text-center font-bold mx-auto"
      >
        Git Commit Summarizer
      </h1>

      <div class="mt-4 md:mt-0 flex items-center">
        <div
          v-if="userStore.user"
          class="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4"
        >
          <p class="text-retro-black font-bold">
            Welcome, {{ userStore.user.name }}
          </p>
          <p
            class="text-sm text-retro-dark-gray cursor-pointer hover:text-retro-light-gray text-center"
            @click="authStore.logout"
          >
            Logout?
          </p>
        </div>

        <button
          v-else
          class="mt-2 md:mt-0 text-retro-black font-bold py-2 px-4 rounded-retro-rounded border border-retro-light-gray hover:border-retro-dark-gray hover:bg-retro-dark-gray hover:text-white w-full md:w-auto"
          @click="toggleModal"
        >
          Login with Git
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from "vue";
import LoginModal from "./LoginModal.vue";
import { useAuthStore } from "../stores/auth";
import { useUserStore } from "../stores/user";
import { useRouter, useRoute } from "vue-router";
const modalActive = ref(false);
const gitlabClientId = import.meta.env.VITE_GITLAB_CLIENT_ID;
const gitlabRedirectUri = import.meta.env.VITE_GITLAB_REDIRECT_URI;
const gitlabScope = "read_user read_api read_repository";
const authStore = useAuthStore();
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

const toggleModal = () => {
  modalActive.value = !modalActive.value;
};

const pushToUserView = () => {
  if (userStore.user) {
    router.push("/user");
  }
};

const loginWithGitLab = () => {
  const encodedScope = encodeURIComponent(gitlabScope);
  const authorizationUrl = `https://gitlab.com/oauth/authorize?client_id=${gitlabClientId}&redirect_uri=${gitlabRedirectUri}&response_type=code&scope=${encodedScope}`;

  window.location.href = authorizationUrl;
};
</script>
