<template>
  <ion-page>
    <ion-content>
      {{ 'Launch pad' }}
      <ion-icon color="danger" :icon="rocketOutline" />
      <main>
        <div class="category" v-for="category in Object.keys(appCategory)" :key="category">
          <h1>{{ category }}</h1>
          <section v-for="app in appCategory[category]" :key="app.handle" class="external">
            <ion-card :href="scheme + app.handle + domain">
              <img :src="app.resource" />
              <ion-card-header>
                <ion-card-title>{{ app.name }}</ion-card-title>
                <ion-buttons>
                  <ion-button :href="scheme + app.handle + devHandle + domain">
                    <ion-icon slot="icon-only" :icon="codeWorkingOutline" />
                  </ion-button>
                  <ion-button :href="scheme + app.handle + uatHandle + domain">
                    <ion-icon slot="icon-only" :icon="shieldHalfOutline" />
                  </ion-button>
                </ion-buttons>
              </ion-card-header>
            </ion-card>
          </section>
        </div>
      </main>
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
      name: 'Bopis',
      resource: require('../assets/images/BOPIS.svg'),
      type: 'Orders'
    }, {
      handle: 'preorder',
      name: 'Pre Order Management',
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

