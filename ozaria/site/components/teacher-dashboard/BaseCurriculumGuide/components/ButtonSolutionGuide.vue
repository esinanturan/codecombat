<script>
export default {
  props: {
    locked: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<template>
  <button
    :class="locked ? 'locked' : null"
    :disabled="locked"
    @click="$emit('click')"
  >
    <div id="IconSolution" /><span>{{ $t('teacher_dashboard.solution_guide') }}</span>
  </button>
</template>

<style lang="scss" scoped>
@import "app/styles/bootstrap/variables";
@import "ozaria/site/styles/common/variables.scss";
@import "app/styles/ozaria/_ozaria-style-params.scss";

#IconSolution {
  background-image: url(/images/ozaria/teachers/dashboard/svg_icons/IconSolution.svg);
  height: 23px;
  width: 18px;
  display: inline-block;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;

  margin-right: 7px;
}

button {
  background-color: $purple;
  border-radius: 4px;
  border-width: 0;
  text-shadow: unset;
  font-weight: bold;
  @include font-p-3-small-button-text-black;
  color: $white;
  font-size: 14px;
  line-height: 16px;
  background-image: unset;

  &:hover {
    background-color: $purple-dark;
    transition: background-color .35s;
  }

  display: flex;
  height: 33px;
  padding: 0 15px;
  justify-content: center;
  align-items: center;

  &.locked {
    background: #adadad;
    cursor: default;
    color: $pitch;
  }
}
</style>
