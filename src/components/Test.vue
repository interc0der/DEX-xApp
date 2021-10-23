<template>
    <div v-if="start" class="container">
        <h4>{{ $t('test.welcome_header') }}</h4>
        <p>{{ $t('test.welcome_body') }}</p>
        <a class="btn btn-primary" @click="start = false">
            {{ $t('test.button_start') }}
            <fa class="next-btn-icon" :icon="['fas', 'arrow-right']"/>
        </a>
    </div>
    <div v-else-if="!finished" class="container">
        <span>{{ index + 1 }} / {{ questions.length }}</span>

        <progress :value="index + 1" :max="questions.length">2</progress>

        <h4>{{ questions[index].question }}</h4>

        <form @submit.prevent="">
            <fieldset v-for="(choice, i) in questions[index].choices">
                <input type="radio" :name="index" :value="i" v-model="answers[index]">
                <label @click="answers[index] = i">{{ choice }}</label>
            </fieldset>
        </form>
        <a v-if="questions.length <= (index + 1)" @click="check()" class="btn btn-primary">{{ $t('test.button_finish') }}</a>
        <a v-else class="btn btn-primary" @click="next()">
            {{ $t('test.button_next') }}
            <fa class="next-btn-icon" :icon="['fas', 'arrow-right']"/>
        </a>
    </div>
    <template v-else>
        <div v-if="wrongAnswerIndex.length === 0" class="container">
            <h2>{{ $t('test.passed') }}</h2>
            <h3>{{ $t('test.perfect_score') }}</h3>
            <span>{{ $t('test.score') }}: {{ questions.length - wrongAnswerIndex.length }} / {{ questions.length }}</span>
            <a class="btn btn-primary" @click="finish()">
                {{ $t('test.button_launch') }}
                <fa class="next-btn-icon" :icon="['fas', 'arrow-right']"/>
            </a>
        </div>
        <div v-else-if="wrongAnswerIndex.length <= requirement" class="container">
            <h2>{{ $t('test.passed') }}</h2>
            <h3>{{ $t('test.pass_score') }}</h3>
            <hr>
            <h4>Q: {{ questions[wrongAnswerIndex[0]].question }}</h4>
            <p>A: {{ questions[wrongAnswerIndex[0]].choices[questions[wrongAnswerIndex[0]].answer_index] }}</p>
            <span>{{ $t('test.score') }}: {{ questions.length - wrongAnswerIndex.length }} / {{ questions.length }}</span>
            <a class="btn btn-primary" @click="finish()">
                {{ $t('test.button_launch') }}
                <fa class="next-btn-icon" :icon="['fas', 'arrow-right']"/>
            </a>
        </div>
        <div v-else class="container">
            <h2>{{ $t('test.failed') }}</h2>
            <h5>{{ $t('test.failed_score') }}</h5>
            <span>{{ $t('test.score') }}: {{ questions.length - wrongAnswerIndex.length }} / {{ questions.length }}</span>
            <a class="btn btn-primary" @click="close()">
                {{ $t('test.button_close') }}
                <fa class="next-btn-icon" :icon="['fas', 'arrow-right']"/>
            </a>
        </div>
    </template>
</template>

<script>
import xapp from '../plugins/xapp'

export default {
    emits: ['passed'],
    data() {
        return {
            start: true,
            requirement: 2,
            finished: false,
            index: 0,
            answers: [],
            questions: [
                { question: this.$t('test.questions.market_limit_order'), choices: this.createArrayfromAnswers('market_limit_order', 4), answer_index: 1 },
                { question: this.$t('test.questions.limit_price'), choices: this.createArrayfromAnswers('limit_price', 4), answer_index: 3},
                { question: this.$t('test.questions.order_types'), choices: this.createArrayfromAnswers('order_types', 4), answer_index: 2 },
                { question: this.$t('test.questions.fee'), choices: this.createArrayfromAnswers('fee', 4), answer_index: 0 },
                { question: this.$t('test.questions.liablility'), choices: this.createArrayfromAnswers('liablility', 4), answer_index: 2 }
            ],
            wrongAnswerIndex: [] 
        }
    },
    methods: {
        createArrayfromAnswers(object, length) {
            const arr = []
            for(let i = 0; i < length; i++) {
                arr.push(this.$t(`test.answers.${object}.${i}`))
            }
            return arr
        },
        next() {
            if((this.answers[this.index] || this.answers[this.index] === 0) && this.answers[this.index] >= 0 && !isNaN(this.answers[this.index])) {
                this.index ++
            } else {
                this.$emitter.emit('modal', {
                    type: 'info',
                    title: this.$t('xapp.error.modal_title'),
                    text: this.$t('test.no_answer'),
                    buttonText: this.$t('xapp.button.close')
                })
            }
        },
        check() {
            this.questions.forEach((element, index) => {
                if(element.answer_index !== this.answers[index]) {
                    this.wrongAnswerIndex.push(index)
                }
            })
            if(this.wrongAnswerIndex.length <= this.requirement) {
                localStorage.setItem('onboarding', true)
            }
            this.finished = true
        },
        finish() {
            this.$emit('passed', true)
        },
        close() {
            try {
                xapp.closeXapp()
            } catch(e) {
                this.$emitter.emit('modal', {
                    type: 'error',
                    title: this.$t('xapp.error.modal_title'),
                    text: this.$t('xapp.error.react_native_webview'),
                    buttonText: this.$t('xapp.button.close')
                })
            }
        }
    }
}
</script>

<style scoped>
.container {
    padding: 0 10px;
    width: fit-content;
    margin: 0 auto;
    flex: 1 1 auto;
    overflow-y: auto;
}
.btn {
    min-height: 35px;
    margin: 20px 0;
}
.next-btn-icon {
    margin-left: 0.5rem;
}
progress[value] {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    min-height: 4px;
}
progress[value]::-webkit-progress-bar {
    background-color: #FFF;
    border-radius: 2px;
}
progress[value]::-webkit-progress-value {
    background-color: var(--var-primary);
    border-radius: 2px;
}
a {
    /* margin: auto 0 40px 0; */
    margin: 0;
}
fieldset {
    margin: 10px 0;
}
label {
    font-size: 14px;
}
span {
    font-size: 18px;
    font-weight: bold;
}
input[type='radio'] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;

    border-radius: 50%;
    min-width: 16px;
    width: 16px;
    height: 16px;

    border: 2px solid var(--var-border);
    transition: 0.2s all linear;
    margin-right: 10px;
}

input[type='radio']:checked {
    border: 3px solid var(--var-primary);
}

input[type='radio']:active,
input[type='radio']:focus {
    outline: 0;
}
</style>
