<script>
export default {
  props: {
    iconName: {
      type: String,
      required: false,
      default: ''
    },
    text: {
      type: String,
      required: true,
      default: ''
    },
    inactive: {
      type: Boolean,
      default: false
    },
    spinning: {
      type: Boolean,
      default: false,
      required: false
    }
  },
  methods: {
    onClick () {
      if (!this.inactive) {
        this.$emit('click')
      }
    }
  }
}
</script>

<template>
  <div
    class="btn-icon-text"
    :class="{ disabled: inactive }"
    :disabled="inactive"
    @click="onClick"
  >
    <img
      v-if="iconName"
      :class="{spinning}"
      :src="'/images/ozaria/teachers/dashboard/svg_icons/' + iconName + '.svg'"
    >
    <span> {{ text }} </span>
  </div>
</template>

<style lang="scss" scoped>
@import "app/styles/bootstrap/variables";
@import "ozaria/site/styles/common/variables.scss";
@import "app/styles/ozaria/_ozaria-style-params.scss";

.btn-icon-text {
  display: flex;
  align-items: center;
  cursor: pointer;

  img {
    width: 23px;
    height: 18px;
    margin: 0 4px;
  }

  span {
    @include font-p-3-small-button-text-purple;
    font-size: 12px;
    font-weight: 500;
    line-height: 12px;
    margin: 0 4px;
    text-align: left;
  }

  &.disabled {
    cursor: default;

    span {
      color: #ADADAD;
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.spinning {
  animation: spin 1s linear infinite;
}
</style>
