<template>
  <ion-page>
    <ion-content>
      <div class="flex">
        <form class="reset-password-container" @keyup.enter="handleSubmit()" @submit.prevent>
          <Logo />

          <section v-if="!isLinkValid">
            <ion-item lines="none">
              <ion-icon slot="start" color="warning" :icon="warningOutline" />
              <h4>{{ translate('Invalid reset password link') }}</h4>
            </ion-item>
            <p>{{ translate("This password reset link is invalid or incomplete. Please request a new password reset email.") }}</p>
          </section>

          <section v-else>
            <ion-item lines="none">
              <ion-input :label="translate('Username')" label-placement="stacked" name="username" :model-value="username" id="username" type="text" disabled />
            </ion-item>
            <ion-item lines="full">
              <ion-input
                :label="translate('Reset password')"
                label-placement="stacked"
                name="resetPassword"
                v-model="resetPassword"
                id="resetPassword"  
                :type="showOldPassword ? 'text' : 'password'"
                autocomplete="off"
                required
              />
              <ion-button
              fill="clear"
              slot="end"
              @click="showOldPassword = !showOldPassword"
            >
              <ion-icon
                :icon="showOldPassword ? eyeOutline : eyeOffOutline"
                slot="icon-only"
              />
            </ion-button>
            </ion-item>
            <ion-item lines="full">
              <ion-input
                id="newPassword"
                ref="newPasswordInput"
                v-model="newPassword"
                :label="translate('New password')"
                label-placement="stacked"
                name="newPassword"
                :type="showPassword ? 'text' : 'password'"
                :error-text="translate('Password requirements not fulfilled.')"
                autocomplete="new-password"
                @keyup="validateNewPassword"
                @ion-blur="markTouched(newPasswordInput)"
              />
              <ion-button
              fill="clear"
              slot="end"
              @click="showPassword = !showPassword"
            >
              <ion-icon
                :icon="showPassword ? eyeOutline : eyeOffOutline"
                slot="icon-only"
              />
            </ion-button>

            </ion-item>
            <ion-item lines="full">
              <ion-input
                id="newPasswordVerify"
                ref="newPasswordVerifyInput"
                v-model="newPasswordVerify"
                :label="translate('Verify new password')"
                label-placement="stacked"
                name="newPasswordVerify"
                :type="showConfirm ? 'text' : 'password'"
                :error-text="translate('Passwords do not match.')"
                autocomplete="new-password"
                @keyup="validateNewPasswordVerify"
                @ion-blur="markTouched(newPasswordVerifyInput)"
              />
              <ion-button
              fill="clear"
              slot="end"
              @click="showConfirm = !showConfirm"
            >
              <ion-icon
                :icon="showConfirm ? eyeOutline : eyeOffOutline"
                slot="icon-only"
              />
            </ion-button>
            </ion-item>

            <div class="ion-padding">
              <ion-button color="primary" expand="block" :disabled="isSubmitDisabled" @click="submit()">
                {{ translate("Reset password") }}
                <ion-spinner v-if="isSubmitting" slot="end" name="crescent" />
                <ion-icon v-else slot="end" :icon="arrowForwardOutline" />
              </ion-button>
            </div>
          </section>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { IonButton, IonContent, IonIcon, IonInput, IonItem, IonPage, IonSpinner } from "@ionic/vue";
import { arrowForwardOutline, eyeOffOutline, eyeOutline, warningOutline } from "ionicons/icons";
import { commonUtil, logger, translate } from "@common";
import Logo from "@/components/Logo.vue";
import { useAuth } from "@/composables/auth";
import { showToast } from "@/util";

const route = useRoute();
const router = useRouter();

const userId = computed(() => (route.query.userId as string) || "");
const username = computed(() => (route.query.username as string) || "");
const maarg = computed(() => (route.query.maarg as string) || "");

const isLinkValid = computed(() => !!(userId.value && username.value && maarg.value));

const resetPassword = ref("");
const newPassword = ref("");
const newPasswordVerify = ref("");
const showOldPassword = ref(false);
const showPassword = ref(false);
const showConfirm = ref(false);
const isSubmitting = ref(false);
const newPasswordInput = ref<any>(null);
const newPasswordVerifyInput = ref<any>(null);

const isValidPassword = (password: string) => {
  const passwordPattern = /^.*(?=.{5,})(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).*$/;
  return passwordPattern.test(password);
};

// The emailed link only carries an API host reference (maarg), never a session -
// requests here must not depend on cookies/auth state, so we build an explicit baseURL.
const getBaseURL = () => {
  if (maarg.value.startsWith("http")) {
    const cleanMaarg = maarg.value.endsWith("/") ? maarg.value.slice(0, -1) : maarg.value;
    return cleanMaarg.includes("/rest/s1") ? cleanMaarg : `${cleanMaarg}/rest/s1/`;
  }
  return `https://${maarg.value}.hotwax.io/rest/s1/`;
};

const inputElement = (inputRef: any) => inputRef?.value?.$el || inputRef?.$el || inputRef?.value || inputRef;

const markTouched = (inputRef: any) => {
  inputElement(inputRef)?.classList.add("ion-touched");
};

const validateNewPasswordVerify = () => {
  const element = inputElement(newPasswordVerifyInput);
  element?.classList.remove("ion-valid");
  element?.classList.remove("ion-invalid");

  if (newPasswordVerify.value === "") return;
  element?.classList.add(newPassword.value === newPasswordVerify.value ? "ion-valid" : "ion-invalid");
};

const validateNewPassword = () => {
  const element = inputElement(newPasswordInput);
  element?.classList.remove("ion-valid");
  element?.classList.remove("ion-invalid");

  if (newPassword.value === "") return;
  element?.classList.add(isValidPassword(newPassword.value) ? "ion-valid" : "ion-invalid");

  if (newPasswordVerify.value !== "") {
    validateNewPasswordVerify();
  }
};

const isSubmitDisabled = computed(() => {
  return isSubmitting.value ||
    !resetPassword.value ||
    !newPassword.value ||
    !newPasswordVerify.value ||
    newPassword.value !== newPasswordVerify.value ||
    !isValidPassword(newPassword.value);
});

const submit = async () => {
  if (isSubmitDisabled.value) return;

  isSubmitting.value = true;
  try {
    const resp: any = await useAuth().resetPassword(getBaseURL(), userId.value, {
      username: username.value,
      oldPassword: resetPassword.value,
      newPassword: newPassword.value,
      newPasswordVerify: newPasswordVerify.value
    });

    // update#Password reports failures (wrong/missing old password, no permission, weak password) as a public
    // "danger" message with updateSuccessful: false, not as hasError's generic error shape.
    if (!commonUtil.hasError(resp) && resp.data?.updateSuccessful) {
      showToast(translate("Password reset successful. Please login with your new password."));
      router.replace("/login");
    } else {
      throw resp.data;
    }
  } catch (error) {
    showToast(translate("Failed to reset password. Please check your reset password and try again."));
    logger.error("User [Context: authentication] - Failed to reset password", error);
  }
  isSubmitting.value = false;
};

const handleSubmit = () => {
  if (!isSubmitDisabled.value) submit();
};
</script>

<style scoped>
.reset-password-container {
  width: 400px;
}

.flex {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
