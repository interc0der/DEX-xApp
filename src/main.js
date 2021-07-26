import { createApp } from 'vue'
import App from './App.vue'
import store from './store'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faArrowLeft, faArrowRight, faArrowDown, faSignInAlt, faTimesCircle, faExclamationCircle, faArrowUp, faTimes, faCaretRight, faChevronLeft, faChevronRight, faChevronDown, faCheckCircle, faCalendar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import Notifications from '@kyvg/vue3-notification'

library.add(faArrowLeft, faArrowRight, faArrowUp, faArrowDown, faSignInAlt, faTimesCircle, faTimes, faExclamationCircle, faCaretRight, faChevronLeft, faChevronRight, faChevronDown, faCheckCircle, faCalendar)

const app = createApp(App)

import { createI18n } from 'vue-i18n'

import { languages, defaultLocale } from './locale/index.js'
const messages = Object.assign(languages)

const i18n = createI18n({
    locale: defaultLocale,
    fallbackLocale: 'en',
    messages
})

import mitt from 'mitt'
const emitter = mitt()
app.config.globalProperties.$emitter = emitter

app.use(store)
app.use(Notifications)
app.use(i18n)
app.component('fa', FontAwesomeIcon)

app.mount('#app')
