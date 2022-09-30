<template>
  <ion-page>
    <ion-content class="ion-padding">
      <h1>
        {{ 'Launch pad' }}
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
    font-size: 46px;
  }

  .type {
  }

  .apps {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(314px, max-content));
  }

  .app-icon {
    background-color: whitesmoke;
    width: inherit;
  }

  ion-card {
    border-radius: 40px;
  }

  .app-icon > img {
    display: block;
    margin: auto;
    object-fit: cover;
  }

  .app-content {
  }

  ion-card-header {
    text-align: center;
  }

  .app-links {
    justify-content: center;
  }
</style>

