<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { initialise, translate } from "@common";
import { IonApp, IonRouterOutlet, loadingController } from "@ionic/vue";
import { onMounted, onUnmounted, ref } from "vue";
import emitter from "@/event-bus"
import { useAuth } from "./composables/auth";
import router from "./router";

const loader = ref<any>(null);

initialise({
  events: {
    unauthorised: unauthorized,
    responseError: () => {
      setTimeout(() => dismissLoader(), 100);
    }
  }
})

async function unauthorized() {
  // Mark the user as unauthorised, this will help in not making the logout api call in actions
  const redirectionUrl = await useAuth().logout({ isUserUnauthorised: true });
  if(redirectionUrl) {
    window.location.href = redirectionUrl
  } else {
    router.replace("/login");
  }
}

const presentLoader = async (options = { message: "", backdropDismiss: true } as any) => {
  // When having a custom message remove already existing loader
  if(options.message && loader.value) {
    dismissLoader()
  }

  if(!loader.value) {
    loader.value = await loadingController
      .create({
        message: options.message ? translate(options.message) : translate("Click the backdrop to dismiss."),
        translucent: true,
        backdropDismiss: options.backdropDismiss
      });
  }
  loader.value.present();
};

const dismissLoader = () => {
  if(loader.value) {
    loader.value.dismiss();
    loader.value = null;
  }
};

onMounted(async () => {


  loader.value = await loadingController
    .create({
      message: translate("Click the backdrop to dismiss."),
      translucent: true,
      backdropDismiss: true
    });
  emitter.on("presentLoader", presentLoader);
  emitter.on("dismissLoader", dismissLoader);
});

onUnmounted(() => {
  emitter.off("presentLoader", presentLoader);
  emitter.off("dismissLoader", dismissLoader);
});
</script>
