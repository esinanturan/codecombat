<script>
import BaseModalContainer from './BaseModalContainer'

export default {
  components: {
    BaseModalContainer
  }
}
</script>

<template>
  <base-modal-container
    class="ozaria-modal"
    role="dialog"
    tabindex="0"
  >
    <slot name="close-icon" />
    <div class="ozaria-modal-content">
      <div class="ozaria-modal-header">
        <slot name="header" />
      </div>
      <div class="ozaria-modal-body">
        <slot name="body" />
      </div>
      <div class="ozaria-modal-footer">
        <slot name="footer" />
      </div>
    </div>
  </base-modal-container>
</template>

<style lang="sass">
@import "ozaria/site/styles/common/variables.scss"

.ozaria-modal
  ::v-deep .modal-container
    width: 100%
    height: 100%

    ::v-deep .modal-container
      width: 60%

      padding: 25px
      border-radius: 10px

      // transition: all .3s ease;

  .ozaria-modal-content
    width: 100%
    height: 100%
    max-height: 95vh
    display: flex
    justify-content: center
    align-items: center
    flex-direction: column
    flex-flow: column

    .ozaria-modal-header, .ozaria-modal-body, .ozaria-modal-footer
      display: flex
      justify-content: center
      align-items: center
      width: inherit
      padding: 10px

    .ozaria-modal-header
      font-weight: bold
      font-size: 30px
      font-family: $title-font-style
      flex: 0 1 auto

    .ozaria-modal-body
      font-size: 20px
      font-family: $body-font-style
      flex: 1 1 auto
      overflow-y: auto
      align-items: baseline

    .ozaria-modal-footer
      font-family: $body-font-style
      flex: 0 1 auto
</style>
