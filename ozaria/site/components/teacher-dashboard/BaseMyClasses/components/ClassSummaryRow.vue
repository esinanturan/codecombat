<script>
import ClassInfoRow from '../../common/ClassInfoRow'
import IconEllipsis from '../../common/icons/IconEllipsis'
import IconButtonWithText from '../../common/buttons/IconButtonWithText'
import IconSharePurple from '../../common/icons/IconSharePurple'

export default {
  components: {
    ClassInfoRow,
    IconEllipsis,
    'icon-button-with-text': IconButtonWithText,
    IconSharePurple
  },
  props: {
    classId: {
      type: String,
      required: true
    },
    classroomName: {
      type: String,
      required: true
    },
    language: {
      type: String,
      required: true
    },
    numStudents: {
      type: Number,
      required: true
    },
    dateCreated: {
      type: String,
      required: true
    },
    dateStart: {
      type: String,
      default: ''
    },
    dateEnd: {
      type: String,
      default: ''
    },
    // TODO: CodeCamel isn't set when spying with administrator teacher.
    codeCamel: {
      type: String,
      default: undefined
    },
    archived: {
      type: Boolean,
      default: false
    },
    displayOnly: {
      type: Boolean,
      default: false
    },
    sharePermission: {
      type: String,
      default: undefined
    },
    classType: {
      type: String,
      default: ''
    }
  },
  methods: {
    trackEvent (eventName) {
      if (eventName) {
        window.tracker?.trackEvent(eventName, { category: 'Teachers' })
      }
    }
  }
}
</script>

<template>
  <div id="class-summary-row">
    <div
      id="class-header"
      class="flex-row"
    >
      <div class="class-hover-area flex-row">
        <router-link
          v-if="!archived && !displayOnly"
          id="class-header-shepherd"
          tag="a"
          :to="`/teachers/classes/${classId}`"
          class="flex-row clickable"
          @click.native="trackEvent('All Classes: Class Card Clicked')"
        >
          <h2 class="padding-left">
            {{ classroomName }}
          </h2>
          <class-info-row
            :language="language"
            :num-students="numStudents"
            :date-created="dateCreated"
            :date-start="dateStart"
            :date-end="dateEnd"
            :share-permission="sharePermission"
            :archived="archived"
            :class-type="classType"
          />
        </router-link>
        <div
          v-else
          class="flex-row full-width"
        >
          <h2 class="padding-left">
            {{ classroomName }}
          </h2>
          <class-info-row
            :language="language"
            :num-students="numStudents"
            :date-created="dateCreated"
            :date-start="dateStart"
            :date-end="dateEnd"
            :share-permission="sharePermission"
            :archived="archived"
            :class-type="classType"
          />
        </div>
        <div
          v-if="!displayOnly && codeCamel"
          class="flex-row class-code"
        >
          <span class="class-code-title">{{ $t('teachers.class_code') }}</span>
          <span class="class-code-text">{{ codeCamel }}</span>
        </div>
        <div class="flex-row floaty-right">
          <icon-button-with-text
            class="icon-with-text"
            :icon-name="displayOnly ? 'IconAddStudents_Gray' : 'IconAddStudents'"
            :text="$t('courses.add_students')"
            :inactive="displayOnly"
            @click="$emit('clickAddStudentsModalButton')"
          />
        </div>
        <div
          v-if="!displayOnly"
          class="btn-ellipse share"
          @click="$emit('clickShareClassWithTeacherModalButton')"
        >
          <icon-share-purple />
          <span class="share-text">{{ $t('teacher_dashboard.share') }}</span>
        </div>
      </div>
      <div
        v-if="!displayOnly"
        class="btn-ellipse"
        @click="$emit('clickTeacherArchiveModalButton')"
      >
        <icon-ellipsis />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @import "app/styles/bootstrap/variables";
  @import "ozaria/site/styles/common/variables.scss";
  @import "app/styles/ozaria/_ozaria-style-params.scss";

  .class-code {
    width: 227px;
    height: 30px;

    margin-right: 20px;
    padding: 0 9.62px 0 9.67px;

    /* gray 0 */
    background: #F2F2F2;

    /* Gray 3 */
    border: 1px solid #D8D8D8;
    border-radius: 4px;

    font-family: $ozaria-main-font-family;

    .class-code-title {
      height: 12px;
      left: 9.67px;
      top: 10px;
      margin-right: 8.15px;

      font-style: italic;
      font-weight: 600;
      font-size: 12px;
      line-height: 12px;

      /* identical to box height, or 100% */
      letter-spacing: 0.333333px;

      display: flex;
      align-items: center;
      letter-spacing: 0.333333px;
      white-space: nowrap;

      /* NOTY */
      color: #1CA0E2;
    }

    .class-code-text {
      font-style: normal;
      font-weight: normal;
      font-size: 14px;
      line-height: 18px;

      /* identical to box height, or 129% */
      letter-spacing: 0.266667px;

      /* Gray 6 (Dark text) */
      color: #545B64;
    }
  }

  h2 {
    @include font-h-4-nav-uppercase-black;
    padding-right: 24px;
    overflow: hidden;
    text-overflow: ellipsis;
    height: 30px;
  }

  #class-summary-row {
    background-color: white;
  }

  #class-header {
    border: 0.5px solid #d8d8d8;
    height: 46px;

    box-shadow: 0px 4px 4px rgba(0,0,0,0.06);

    justify-content: space-between;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .class-hover-area {
    width: 100%;
    &:hover {
      position: relative;
      > * {
        z-index: 10; // Ensure all children will appear over the border element.
      }
      &::after {
        /* In order to make sure the elements inside are not moving, we create a new
        absolute positioned element for the border */
        border: 0.5px solid #74C6DF;
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right:0;
        z-index: 1;
      }
    }
  }

  .clickable {
    width: 100%;
    height: 100%;
    text-decoration: none;
    &:hover {
      cursor: pointer;
    }
  }

  .padding-left {
    padding-left: 30px;
  }

  .floaty-right {
    width: 150px;
    height: 46px;
    white-space: nowrap;
    margin-right: 30px;
  }

  .btn-ellipse {
    border-left: 0.5px solid #d8d8d8;
    width: 62px;
    height: 44px;
    margin: 1px 0;

    display: flex;
    justify-content: center;
    align-items: center;

    cursor: pointer;

    box-shadow: 0px 4px 4px rgba(0,0,0,0.11);

    &:hover {
      box-shadow: inset 0px 3px 10px rgba(0,0,0,0.1);
    }
  }
  .share-text {
    @include font-p-3-small-button-text-purple;
    font-size: 12px;
    font-weight: 500;
    line-height: 12px;
    margin: 0 4px;
    text-align: left;
  }
  .share {
    width: 100px;
  }
  .full-width {
    width: 100%;
  }
</style>
