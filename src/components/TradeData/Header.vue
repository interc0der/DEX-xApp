<template>
    <div class="row header" style="margin-top: 0;">
        <a class="header-btn" @click="openTradeView()">
            <fa class="header-icon" :icon="['fas', 'chevron-left']" />
        </a>
        <div class="column">
            <a @click="selectActive = true" class="currency-pair-select-btn">{{ currencyCodeFormat(currencyPair.base.currency) }}/{{ currencyCodeFormat(currencyPair.quote.currency) }}
                <fa size="xs" :icon="['fas', 'chevron-down']"/>
            </a>
        </div>
    </div>
    <Select v-show="selectActive" @close="selectActive = false"/>
</template>

<script>
import { currencyCodeFormat } from '../../plugins/number-format'

import Select from '@/components/Select.vue'

export default {
    components: { Select },
    data() {
        return {
            selectActive: false
        }
    },
    computed: {
        currencyPair() {
            return this.$store.getters.getCurrencyPair
        },
        account() {
            return this.$store.getters.getAccount
        }
    },
    methods: {
        openTradeView() {
            this.$emitter.emit('changeView', 'trade')
        },
        currencyCodeFormat(string, maxLength) {
            return currencyCodeFormat(string, maxLength)
        }
    }
}
</script>

<style scoped>
.row.header {
    margin-left: 5px;
    padding-bottom: 8px;
    height: 30px;
}
.header-btn {
    width: 30px;
    display: flex;
}
.header-icon {
    margin: auto;
}
.currency-pair-select-btn {
    color: var(--var-txt-color);
    font-weight: 600;
    text-align: start;
}
.account-selector {
    display: flex;
    flex-direction: row;
    align-items: center;
    color: var(--var-txt-color);
    font-size: 0.7rem;
    font-weight: 600;
    margin-right: 5px;
}
.account-selector label {
    margin-right: 5px;
}
</style>
