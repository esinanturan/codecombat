<template>
  <modal
    title="Create/Edit Tournament"
    @close="$emit('close')"
  >
    <form
      class="edit-tournament-form container"
      @submit.prevent="onFormSubmit"
    >
      <div class="form-group">
        <label for="name">
          {{ $t('courses.arena') }}
        </label>
        <input
          id="name"
          v-model="editableTournament.name"
          type="text"
          class="form-control"
          disabled
        >
      </div>
      <div class="form-group">
        <template v-if="clanId">
          <!-- TODO i18n -->
          <label for="clan"> {{ $t('tournament.team') }} </label>
          <span class="small text-navy"> {{ $t('tournament.team_description') }} </span>
          <clan-selector
            :clans="ownedClans"
            :selected="selectedClanId"
            :label="false"
            :disabled="tournament.editing === 'edit'"
            @change="e => changeClanSelected(e)"
          />
        </template>
      </div>
      <div class="form-group">
        <label for="startDate">
          {{ $t('tournament.start_date_time') }}
        </label>
        <span class="small text-navy"> {{ $t('tournament.start_date_description') }}</span>
        <input
          id="startDate"
          v-model="_startDate"
          type="datetime-local"
          class="form-control"
          :disabled="disableEdit"
        >
      </div>
      <div class="form-group">
        <label for="endDate">
          {{ $t('tournament.end_date_time') }}
        </label>
        <span class="small text-navy">{{ $t('tournament.end_date_description') }}</span>
        <input
          id="endDate"
          v-model="_endDate"
          type="datetime-local"
          class="form-control"
          :disabled="disableEdit"
        >
      </div>
      <div class="form-group">
        <label
          for="publish-options"
        >
          {{ $t('tournament.publish_options') }}
        </label>
        <select
          id="publish-options"
          v-model="_publishOption"
          name="publish-options"
          class="form-control"
        >
          <option
            v-for="op in publishOptions"
            :key="`option-${op.name}`"
            :value="op.name"
          >
            {{ $t(`tournament.${op.label}`) }}
          </option>
        </select>
        <div
          class="small text-navy"
        >
          {{ $t(`tournament.${_publishOption}_description`) }}
        </div>

        <template v-if="_publishOption === 'results_date'">
          <p class="small text-navy">
            {{ $t('tournament.results_date_suggestion_0') }}
          </p>
          <p class="small text-navy">
            {{ $t('tournament.results_date_suggestion_1') }}
          </p>
          <p class="small text-navy">
            {{ $t('tournament.results_date_suggestion_2') }}
          </p>
          <p class="small text-navy">
            {{ $t('tournament.results_date_suggestion_3') }}
          </p>
          <input
            id="resultsDate"
            v-model="_resultsDate"
            type="datetime-local"
            class="form-control"
          >
        </template>
      </div>
      <div class="form-group">
        <input
          id="anonymize"
          v-model="editableTournament.anonymize"
          type="checkbox"
          :disabled="disableEdit"
        >
        <label for="anonymize">
          {{ $t('tournament.anonymize_players') }}
        </label>
        <span class="small text-navy">{{ $t('tournament.anonymize_players_description') }}</span>
      </div>

      <div class="form-group pull-right">
        <span
          v-if="isSuccess"
          class="success-msg"
        >
          {{ $t('teacher.success') }}
        </span>
        <span
          v-if="errorMessage"
          class="error-msg"
        >
          {{ errorMessage }}
        </span>
        <button
          class="btn btn-success btn-lg"
          type="submit"
          :disabled="inProgress || disableEdit"
        >
          {{ $t('common.submit') }}
        </button>
      </div>
    </form>
  </modal>
</template>

<script>
import _ from 'lodash'
import moment from 'moment'
import { mapGetters } from 'vuex'

import { postTournament, putTournament } from '../../../core/api/tournaments'

import Modal from '../../../components/common/Modal'
import ClanSelector from '../../landing-pages/league/components/ClanSelector.vue'

import { HTML5_FMT_DATETIME_LOCAL, GLOBAL_AI_LEAGUE_CREATORS } from '../../../core/constants'

export default {
  name: 'EditTournamentModal',
  components: {
    Modal, ClanSelector
  },
  props: {
    tournament: {
      type: Object,
      default () {
        return {}
      }
    },
    clanId: {
      type: String,
      default () {
        return 'global'
      }
    }
  },
  data () {
    return {
      editableTournament: {},
      selectedClanId: 'global',
      isSuccess: false,
      inProgress: false,
      errorMessage: '',
      publishOptions: [
        { name: 'review', label: 'review_results', desc: 'review_description' },
        { name: 'publish', label: 'publish_immediately', desc: 'publish_description' },
        { name: 'results_date', label: 'results_date_time', desc: 'results_date_description' }
      ]
    }
  },
  computed: {
    ...mapGetters({
      myClans: 'clans/myClans'
    }),
    me () {
      return me
    },
    isSuper () {
      return GLOBAL_AI_LEAGUE_CREATORS.includes(me.get('_id').toString())
    },
    disableEdit () {
      if (this.selectedClanId === 'global') {
        // nick can create global-tournament
        return !this.isSuper
      }
      // admin can create/edit any tournaments
      // normal teacher can only create/edit their own tournaments
      return !this.ownedClanById(this.selectedClanId) && !me.isAdmin()
    },
    ownedClans () {
      return this.myClans.filter(c => c?.ownerID === me.get('_id'))
    },
    _startDate: {
      get () {
        return moment(this.editableTournament.startDate).format(HTML5_FMT_DATETIME_LOCAL)
      },
      set (val) {
        this.$set(this.editableTournament, 'startDate', moment(val).toISOString())
      }
    },
    _endDate: {
      get () {
        return moment(this.editableTournament.endDate).format(HTML5_FMT_DATETIME_LOCAL)
      },
      set (val) {
        this.$set(this.editableTournament, 'endDate', moment(val).toISOString())

        this.$set(this.editableTournament, 'resultsDate', moment(val).add(1, 'days').toISOString())
      }
    },
    _resultsDate: {
      get () {
        return moment(this.editableTournament.resultsDate).format(HTML5_FMT_DATETIME_LOCAL)
      },
      set (val) {
        this.$set(this.editableTournament, 'resultsDate', moment(val).toISOString())
      }
    },
    _publishOption: {
      get () {
        if (this.editableTournament.reviewResults) {
          return 'review'
        } else if (this.editableTournament.publishImmediately) {
          return 'publish'
        } else {
          return 'results_date'
        }
      },
      set (val) {
        this.changePublishOption(val)
      }
    }
  },
  mounted () {
    this.selectedClanId = this.tournament.clan
    this.editableTournament = _.clone(this.tournament)
  },
  methods: {
    changePublishOption (option) {
      if (option === 'review') {
        this.$set(this.editableTournament, 'reviewResults', true)
        this.$set(this.editableTournament, 'publishImmediately', false)
      } else if (option === 'publish') {
        this.$set(this.editableTournament, 'reviewResults', false)
        this.$set(this.editableTournament, 'publishImmediately', true)
      } else { // results_date
        this.$set(this.editableTournament, 'reviewResults', false)
        this.$set(this.editableTournament, 'publishImmediately', false)
        if (!this.editableTournament.resultsDate) { // set default time
          this.$set(this.editableTournament, 'resultsDate', moment().toISOString())
        }
      }
    },
    ownedClanById (id) {
      return _.find(this.ownedClans, c => c?._id === id)
    },
    changeClanSelected (e) {
      this.selectedClanId = e.target.value
      this.editableTournament.clan = e.target.value
    },
    async onFormSubmit () {
      this.inProgress = true
      this.isSuccess = false
      const endDate = new Date(this.editableTournament.endDate)
      const resultsDate = moment(this.editableTournament.resultsDate)
      if (endDate < new Date(this.editableTournament.startDate)) {
        this.errorMessage = this.$t('tournament.error_end_date_too_early')
        this.inProgress = false
        return
      }

      if (this.editableTournament.resultsDate && resultsDate.isBefore(endDate)) {
        this.errorMessage = this.$t('tournament.error_results_date_too_early')
        this.inProgress = false
        return
      }

      if (this.editableTournament.reviewResults || this.editableTournament.publishImmediately) {
        delete this.editableTournament.resultsDate
      }

      try {
        if (this.editableTournament.editing === 'new') {
          await postTournament(this.editableTournament)
        } else if (this.editableTournament.editing === 'edit') {
          await putTournament(this.editableTournament)
        }

        this.isSuccess = true
      } catch (err) {
        console.error('tournament submit err', err)
        noty({ text: `Failed to create tournament - ${err?.message}, please reach out to support@codecombat.com`, type: 'error', timeout: 5000, layout: 'topCenter' })
      }
      this.inProgress = false

      this.$emit('submit')
    }
  }
}
</script>

<style scoped lang="scss">
.edit-tournament-form {
  text-align: initial;
  padding: 2rem;
  width: 800px;
}

::v-deep .title {
  padding-top: 10px;
}

.success-msg {
  font-size: 1.6rem;
  color: #0B6125;
  display: inline-block;
  margin-right: 1rem;
}
.error-msg {
  font-size: 1.6rem;
  color: #7D0101;
  display: inline-block;
  margin-right: 1rem;
}
p.small {
  margin-top: 0;
  margin-bottom: 5px;
}
</style>
