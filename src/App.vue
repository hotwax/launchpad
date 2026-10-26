<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { translate } from "@common";
import { IonApp, IonRouterOutlet, loadingController } from "@ionic/vue";
import { onMounted, onUnmounted, ref } from "vue";
import emitter from "@/event-bus"

const loader = ref<any>(null);
// Set by dismissLoader so a loader still being created when the work finishes is never shown
let isLoaderDismissed = false;

const presentLoader = async (options = { message: "", backdropDismiss: true } as any) => {
  // When having a custom message remove already existing loader
  if(options.message && loader.value) {
    dismissLoader()
  }
  isLoaderDismissed = false;

  if(!loader.value) {
    const newLoader = await loadingController
      .create({
        message: options.message ? translate(options.message) : translate("Click the backdrop to dismiss."),
        translucent: true,
        backdropDismiss: options.backdropDismiss
      });
    if(isLoaderDismissed) return;
    loader.value = newLoader;
  }
  loader.value.present();
};

const dismissLoader = () => {
  isLoaderDismissed = true;
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
