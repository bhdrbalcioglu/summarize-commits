import { createApp } from "vue";
import App from "./App.vue";
import "./assets/tailwind.css";
import router from "./router";
import { createPinia } from "pinia";
import piniaPersist from "pinia-plugin-persistedstate";

const pinia = createPinia();
pinia.use(piniaPersist);

const app = createApp(App);

app.use(router);
app.use(pinia);

app.mount("#app");
