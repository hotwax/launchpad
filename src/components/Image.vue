<template>
  <img :src="imageUrl"/>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useAuthStore } from '@/store/auth';

export default defineComponent({
  name: "Image",
  props: ['src'],
  components: {},
  created() {
    if (
      process.env.VUE_APP_RESOURCE_URL
    ) {
      this.resourceUrl = process.env.VUE_APP_RESOURCE_URL;
    } else {
      const authStore = useAuthStore();
      const baseURL = authStore.getBaseUrl
      this.resourceUrl = baseURL.replace("/api", "")
    }
  },
  mounted() {
    this.setImageUrl();
  },
  updated() {
    this.setImageUrl();
  },
  data() {
    return {
      resourceUrl: '',
      imageUrl: require("@/assets/images/defaultImage.png")
    }
  },
  methods: {
    checkIfImageExists(src: string) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function () {
          resolve(true);
        }
        img.onerror = function (error) {
          reject(false);
        }
        img.src = src;
      })
    },
    setImageUrl() {
      if (this.src) {
        if (this.src.indexOf('assets/') != -1) {
          // Assign directly in case of assets
          this.imageUrl = this.src;
        } else if (this.src.startsWith('http')) {
          // If starts with http, it is web url check for existence and assign
          this.checkIfImageExists(this.src).then(() => {
            this.imageUrl = this.src;
          }).catch(() => {
            console.error("Image doesn't exist", this.src);
          })
        } else {
          // Image is from resource server, hence append to base resource url, check for existence and assign
          const imageUrl = this.resourceUrl.concat(this.src)
          this.checkIfImageExists(imageUrl).then(() => {
            this.imageUrl = imageUrl;
          }).catch(() => {
            console.error("Image doesn't exist", imageUrl);
          })
        }
      }
    }
  },
});
</script>
