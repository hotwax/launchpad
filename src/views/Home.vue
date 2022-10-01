<template>
  <ion-page>
    <ion-content class="ion-padding">
      <h1>
        {{ 'Launch Pad' }}
        <ion-icon color="danger" :icon="rocketOutline" />
      </h1>
      <div class="type" v-for="category in Object.keys(appCategory)" :key="category">
        <h3>{{ category }}</h3>
        <div class="apps">
          <ion-card class="app" v-for="app in appCategory[category]" :key="app.handle" :href="scheme + app.handle + domain" :target="_blank">
            <div class="app-icon ion-padding">
              <img :src="app.resource" />
            </div>
            <ion-card-header class="app-content">
              <ion-card-title>{{ app.name }}</ion-card-title>
              <ion-buttons class="app-links">
                <ion-button color="medium" :href="scheme + app.handle + devHandle + domain">
                  <ion-icon slot="icon-only" :icon="codeWorkingOutline" />
                </ion-button>
                <ion-button color="medium" :href="scheme + app.handle + uatHandle + domain">
                  <ion-icon slot="icon-only" :icon="shieldHalfOutline" />
                </ion-button>
              </ion-buttons>
            </ion-card-header>
          </ion-card>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonButton, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonContent, IonIcon, IonPage } from '@ionic/vue';
import { defineComponent, ref } from 'vue';
import { codeWorkingOutline, rocketOutline, shieldHalfOutline } from 'ionicons/icons';

export default defineComponent({
  name: 'Home',
  components: {
    IonButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonIcon,
    IonPage
  },
  setup() {
    const appInfo = [{
      handle: 'bopis',
      name: 'BOPIS',
      resource: require('../assets/images/BOPIS.svg'),
      type: 'Orders'
    }, {
      handle: 'preorder',
      name: 'Pre-Order Management',
      resource: require('../assets/images/PreOrder.svg'),
      type: 'Orders'
    }, {
      handle: 'threshold-management',
      name: 'Threshold Management',
      resource: require('../assets/images/Threshold.svg'),
      type: 'Workflow'
    }, {
      handle: 'job-manager',
      name: 'Job Manager',
      resource: require('../assets/images/Job.svg'),
      type: 'Workflow'
    }, {
      handle: 'receiving',
      name: 'Receiving',
      resource: require('../assets/images/Receiving.svg'),
      type: 'Inventory'
    }, {
      handle: 'inventorycount',
      name: 'Cycle Count',
      resource: require('../assets/images/CycleCount.svg'),
      type: 'Inventory'
    }, {
      handle: 'picking',
      name: 'Picking',
      resource: require('../assets/images/Picking.svg'),
      type: 'Inventory'
    }, {
      handle: 'import',
      name: 'Import',
      resource: require('../assets/images/Import.svg'),
      type: 'Workflow'
    }]

    const appCategory = appInfo.reduce((obj: any, app: any) => {
      if (obj[app.type]) {
        obj[app.type].push(app)
      } else {
        obj[app.type] = [app]
      }

      return obj
    }, {})

    const scheme = ref('https://')
    const domain = ref('.hotwax.io')
    const uatHandle = ref('-uat')
    const devHandle = ref('-dev')

    return {
      appCategory,
      codeWorkingOutline,
      devHandle,
      domain,
      rocketOutline,
      scheme,
      shieldHalfOutline,
      uatHandle
    }
  }
});
</script>

<style>
  h1 {
    font-size: 50px;
    text-align: center;
    font-weight: 700;
  }

  h1 > ion-icon {
    position: relative;
    top: 8px;
  }

  .type {
  }

  .type > * {
    padding-left: 16px;
  }

  .apps {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(314px, max-content));
  }

  .app-icon {
    background-color: whitesmoke;
    width: inherit;
  }

  .app-icon > img {
    display: block;
    margin: auto;
    object-fit: cover;
  }

  .app-content {
  }

  ion-card {
    border-radius: 40px;
    transition: .5s ease-in-out;
    /* alternate transition */
    /* transition: .5s cubic-bezier(0.8, -0.6, 0.23, 1.63); */
  }

  ion-card:hover {
    box-shadow: rgb(0 0 0 / 26%) 0px 3px 17px -2px, rgb(0 0 0 / 14%) 0px 2px 6px 0px, rgb(0 0 0 / 12%) 0px 1px 12px 0px;
    transform: scale(1.05);
    /* alternate box shadow */
    /* box-shadow: 0px 24px 38px rgba(0, 0, 0, 0.14), 0px 9px 46px rgba(0, 0, 0, 0.12), 0px 11px 15px rgba(0, 0, 0, 0.2); */
  }

  ion-card-header {
    text-align: center;
    padding-bottom: 0;
  }

  ion-card-title {
    font-size: 16px;
    font-weight: 900;
  }

  .app-links {
    justify-content: center;
  }

  @media (prefers-color-scheme: dark) {
    .app-icon {
      background-color: #0f0f0f;
    }
  }

</style>

