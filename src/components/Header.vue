<template>
  <nav
    class="bg-primary p-4 flex flex-col md:flex-row justify-center md:justify-between items-center"
  >
    <LoginModal :modalActive="modalActive" @close-modal="toggleModal">
      <div class="max-w-lg w-full">
        <h1 class="text-3xl text-foreground text-center font-bold mb-6">
          Login
        </h1>
        <div class="flex flex-col space-y-4">
          <Button
            class="font-medium text-black py-2 px-4 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center justify-center w-full"
            @click="loginWithGitLab"
          >
            <i class="fa-brands fa-gitlab mr-2"></i>
            Login with GitLab
          </Button>
        </div>
        <div class="flex justify-center mt-6">
          <Button
            variant="destructive"
            class="py-2 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2"
            @click="toggleModal"
          >
            Close
          </Button>
        </div>
      </div>
    </LoginModal>

    <div
      class="w-full flex flex-col md:flex-row justify-center md:justify-between items-center mt-4 md:mt-0"
    >
      <h1
        v-if="userStore.user && route.name !== 'User'"
        class="text-3xl text-white text-center font-bold hover:text-muted-foreground cursor-pointer mx-auto"
        @click="pushToUserView"
      >
        Git Commit Summarizer
      </h1>
      <h1 v-else class="text-3xl text-white text-center font-bold mx-auto">
        Git Commit Summarizer
      </h1>

      <div class="mt-4 md:mt-0 flex items-center">
        <div
          v-if="userStore.user"
          class="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4"
        >
          <p class="text-white font-bold">Welcome, {{ userStore.user.name }}</p>
          <p
            class="text-sm text-muted-foreground cursor-pointer hover:text-foreground text-center"
            @click="authStore.logout"
          >
            Logout?
          </p>
        </div>

        <Button
          variant="outline"
          v-else
          class="mt-2 md:mt-0 w-full md:w-auto rounded-lg"
          @click="toggleModal"
        >
          Login with Git
        </Button>
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
import { Button } from "./ui/button";

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
