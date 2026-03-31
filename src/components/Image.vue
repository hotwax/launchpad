<template>
  <img :src="imageUrl" />
</template>

<script setup lang="ts">
import { commonUtil, logger } from "@common";
import { onMounted, onUpdated, ref } from "vue";
import defaultImageUrl from "@/assets/images/defaultImage.png"

const imageUrl = ref(defaultImageUrl)
const props = defineProps(["src"])

onMounted(() => {
  setImageUrl();
})

onUpdated(() => {
  setImageUrl();
})

function checkIfImageExists(src: string) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function load() {
      resolve(true);
    }
    img.onerror = function error() {
      reject(false);
    }
    img.src = src;
  })
}

function setImageUrl() {
  if(props.src) {
    if(props.src.indexOf("assets/") != -1) {
      // Assign directly in case of assets
      imageUrl.value = props.src;
    } else if(props.src.startsWith("http")) {
      // If starts with http, it is web url check for existence and assign
      checkIfImageExists(props.src).then(() => {
        imageUrl.value = props.src;
      }).catch(() => {
        logger.error("Image doesn't exist", props.src);
      })
    } else {
      const baseURL = commonUtil.getOmsURL().replace("/api", "")

      const imageUrl: any = baseURL.concat(props.src)
      checkIfImageExists(imageUrl).then(() => {
        imageUrl.value = imageUrl;
      }).catch(() => {
        logger.error("Image doesn't exist", imageUrl);
      })
    }
  }
}
</script>
