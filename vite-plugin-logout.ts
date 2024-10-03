import { Plugin } from "vite";
import { useAuthStore } from "./src/stores/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

export function logoutOnExit(): Plugin {
  return {
    name: "logout-on-exit",
    configureServer(server) {
      const exitHandler = () => {
        authStore.authProvider = null;
        authStore.accessToken = null;
        router.push("/");
        console.log("Logged out successfully");
        process.exit();
      };

      process.on("SIGINT", exitHandler);
      process.on("SIGTERM", exitHandler);

      return () => {
        process.off("SIGINT", exitHandler);
        process.off("SIGTERM", exitHandler);
      };
    },
  };
}
