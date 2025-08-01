<script>
import { mapActions } from 'vuex'
import BaseModalContainer from '../../../common/BaseModalContainer'
import { logInWithClever } from 'core/social-handlers/CleverHandler'
const forms = require('core/forms')
const User = require('models/User')
const errors = require('core/errors')

const formSchema = {
  type: 'object',
  properties: {
    emailOrUsername: {
      $or: [
        User.schema.properties.name,
        User.schema.properties.email
      ]
    }
  },
  required: ['emailOrUsername', 'password']
}

export default {
  components: {
    BaseModalContainer
  },
  props: {
    saveProgressModal: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    gplusLoaded: false,
    showingError: false
  }),
  computed: {
    useSocialSignOn () {
      return me.useSocialSignOn()
    }
  },
  mounted () {
    if (me.useSocialSignOn()) {
      application.gplusHandler.loadAPI({
        success: () => {
          this.gplusLoaded = true
          this.onClickGPlusLoginButton()
        }
      })
    }
  },
  methods: {
    ...mapActions({
      joinClass: 'studentModal/joinClass',
      setHocOptions: 'studentModal/setHocOptions'
    }),
    async onSubmitForm (e) {
      forms.clearFormAlerts($('#auth-modal'))
      $('#unknown-error-alert').addClass('hide')
      const userObject = forms.formToObject($('#auth-modal'))

      const res = tv4.validateMultiple(userObject, formSchema)
      if (!res.valid) {
        return forms.applyErrorsToForm($('#auth-modal'), res.errors)
      }
      try {
        await new Promise(me.loginPasswordUser(userObject.emailOrUsername, userObject.password).then)
        if (me.isStudent()) {
          await this.finishLogin()
        }
        this.$emit('done')
      } catch (jqxhr) {
        this.showingError = false
        if (jqxhr.status === 401) {
          const errorID = jqxhr.responseJSON.errorID
          if (errorID === 'not-found') {
            forms.setErrorToProperty($('#auth-modal'), 'emailOrUsername', $.i18n.t('loading_error.not_found'))
            this.showingError = true
          }
          if (errorID === 'wrong-password') {
            forms.setErrorToProperty($('#auth-modal'), 'password', $.i18n.t('account_settings.wrong_password'))
            this.showingError = true
          }
          if (errorID === 'temp-password-expired') {
            forms.setErrorToProperty($('#auth-modal'), 'password', $.i18n.t('account_settings.temp_password_expired'))
            this.showingError = true
          }
          if (errorID === 'individuals-not-supported') {
            forms.setErrorToProperty($('#auth-modal'), 'emailOrUsername', $.i18n.t('login.individual_users_not_supported'))
            this.showingError = true
          }
        }
        if (!this.showingError) {
          $('#unknown-error-alert').removeClass('hide')
        }
      }
    },
    onClickGPlusLoginButton () {
      application.gplusHandler.connect({
        context: this,
        elementId: 'google-login-button-signin',
        success: (resp = {}) => {
          this.postGoogleLoginClick({ resp })
        }
      })
    },
    async postGoogleLoginClick ({ resp = {} }) {
      try {
        const gplusAttrs = await new Promise((resolve, reject) =>
          application.gplusHandler.loadPerson({
            context: this,
            success: resolve,
            error: reject,
            resp
          }))

        const existingUser = new User()
        let loginOptions = {}
        await new Promise((resolve, reject) =>
          existingUser.fetchGPlusUser(gplusAttrs.gplusID, gplusAttrs.email, {
            success: resolve,
            error: function (user, jqxhr) {
              if (jqxhr.status === 409 && jqxhr.responseJSON.errorID && jqxhr.responseJSON.errorID === 'account-with-email-exists') {
                // auto-merge since we roster and create accounts for them
                if (gplusAttrs.email?.includes(User.getNapervilleDomain())) {
                  loginOptions = {
                    merge: true,
                    email: gplusAttrs.email
                  }
                  return resolve()
                }
                noty({
                  text: $.i18n.t('login.accounts_merge_confirmation'),
                  layout: 'topCenter',
                  type: 'info',
                  buttons: [
                    {
                      text: 'Yes',
                      onClick: ($noty) => {
                        $noty.close()
                        loginOptions = {
                          merge: true,
                          email: gplusAttrs.email
                        }
                        resolve()
                      }
                    },
                    {
                      text: 'No',
                      onClick: ($noty) => {
                        $noty.close()
                        reject(new Error('Clicked No'))
                      }
                    }
                  ]
                })
              } else {
                errors.showNotyNetworkError(...arguments)
                reject(new Error('Network Error'))
              }
            }
          }))

        await new Promise((resolve, reject) =>
          me.loginGPlusUser(gplusAttrs.gplusID, {
            data: loginOptions,
            success: resolve,
            error: function (res, jqxhr) {
              if (jqxhr.status === 401 && jqxhr.responseJSON.errorID && jqxhr.responseJSON.errorID === 'individuals-not-supported') {
                forms.setErrorToProperty($('#auth-modal'), 'emailOrUsername', $.i18n.t('login.individual_users_not_supported'))
              } else {
                errors.showNotyNetworkError(...arguments)
              }

              reject(...arguments)
            }
          }))
        if (me.isStudent()) {
          await this.finishLogin()
        }
        this.$emit('done')
      } catch (e) {
        console.log('signup error', e)
      }
    },
    // for hoc students, join the classroom or set hoc options to show progress on dashboard
    async finishLogin () {
      if (this.saveProgressModal) {
        await this.setHocOptions()
      } else {
        try {
          await this.joinClass()
        } catch (err) {
          // Set hoc progress options if could not join the class
          await this.setHocOptions()
        }
      }
    },
    onClickCleverLoginButton () {
      logInWithClever()
    },
    async onClickClasslinkLoginButton () {
      const handler = application.classlinkHandler
      const { loggedIn } = await handler.logInWithEdlink()
      if (!loggedIn) {
        if (me.isStudent()) {
          await this.finishLogin()
        }
        this.$emit('done')
      } else {
        noty({
          text: 'Account already exists, logging you in...',
          type: 'error',
          layout: 'topCenter',
          timeout: 5000,
        })
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      }
    }
  }
}
</script>

<template lang="pug">
.modal-dialog.style-ozaria#auth-modal
  .modal-content
    h2 {{ $t("login.sign_into_ozaria") }}

    .socialSignOn(v-if="useSocialSignOn")
      .auth-network-logins()
        a#google-login-button-signin(:disabled="!gplusLoaded" @click="onClickGPlusLoginButton" href="#")
          img(src="/images/ozaria/common/log-in-google-sso.svg" draggable="false")
          .gplus-login-wrapper
            .gplus-login-button
        a#clever-login-btn(@click="onClickCleverLoginButton" href="#")
          img(src="/images/pages/modal/auth/clever_sso_button@2x.png" draggable="false")
        a#classlink-login-btn(@click="onClickClasslinkLoginButton" href="#")
          img(src="/images/pages/modal/auth/classlink-logo-text.png" draggable="false")
      .row.or-row
        .line
        p.or {{ $t("login.or") }}
        .line
    .auth-form-content

      #unknown-error-alert.alert.alert-danger.hide {{ $t("loading_error.unknown") }}

      form.form(@submit.prevent="onSubmitForm")
        .form-group
          label.control-label(for="username-or-email-input")
            span {{ $t("login.email_or_username") }}
          .input-border
            input#username-or-email-input.input-large.form-control(
              name="emailOrUsername"
              dir="auto"
              required
            )
        .form-group
          label.control-label(for="password-input")
            span {{ $t("general.password") }}
          .input-border
            input#password-input.input-large.form-control(
              name="password"
              type="password"
              dir="auto"
              required
            )
          #recover-account-wrapper
            a#link-to-recover(
              @click="$emit('clickRecoverModal')"
              href="#"
            ) {{ $t("login.forgot_password") }}
        input#login-btn.btn.btn-block.btn-success(
          :value="$t('login.sign_in')"
          type="submit"
        )

      .wait.secret
        h3 {{ $t("login.logging_in") }}

    .extra-pane
      a#switch-to-signup-btn(@click="$emit('switchToSignup')" href="#") {{ $t("login.auth_sign_up") }}
      p {{ $t("login.already_have_account1") }}
      p {{ $t("login.already_have_account2") }}
</template>

<style lang="scss">
@import "app/styles/mixins";
@import "app/styles/bootstrap/variables";
@import "ozaria/site/styles/common/common.scss";

#auth-modal {
  display: flex;
  justify-content: center;
  align-items: center;

  h2 {
    color: $pitch;
    text-align: center;
    padding-bottom: 20px;
  }

  p {
    color: $pitch;
  }

  input.form-control {
    border: 1px solid $teal;
    color: $color-tertiary-brand;
  }

  #login-btn, .btn.btn-primary.btn-lg {
    background-image: unset;
    background-color: $teal;
    border: unset;
    text-shadow: unset;
    font-family: "Open Sans", sans-serif;
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 0.71px;
    line-height: 24px;
    color: $mist;
    min-height: 45px;
    min-width: 182px;
    border-radius: 1px;
  }

  .row.or-row {

    display: flex;
    justify-content: center;
    align-items: center;

    margin-bottom: 15px;

    p.or {
      color: $authGray;
      margin: 0;
    }

    .line {
      height: 2px;
      width: 120px;
      background-color: #f0f0f0;
      margin: 0 32px;
    }
  }

  .modal-content {
    background-color: white;
    padding: 40px 36px 20px;
  }

  .auth-network-logins {
    display: flex;
    justify-content: center;
    margin: 12px 0 30px;
    button {
      margin: 0 13px;
      min-width: 180px;
      min-height: 45px;
    }
  }

  .extra-pane > p:nth-child(2) {
    margin: 12px 0 0;
   }

  .extra-pane {
    text-align: center;
    margin-top: 26px;

    a {
      color: $authGray;
      text-decoration: underline;
    }

    p {
      text-align: center;
      font-size: 14px;
      color: $authGray;
    }
  }

  #recover-account-wrapper {
    text-align: right;

    a {
      color: $authGray;
      text-decoration: underline;
    }
  }

  #google-login-button-signin > img, #clever-login-btn img {
    height: 46px;
  }
}

#login-btn {
  max-width: 180px;
  margin: 0 auto;
}

</style>
