import { createApp } from 'vue'
import Xapp from './views/Xapp.vue'
import App from './App.vue'
import store from './store'
import router from './router'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faArrowLeft, faArrowRight, faArrowDown, faLevelDownAlt,faSignInAlt, faTimesCircle, faExclamationCircle, faArrowUp, faTimes, faCaretRight, faCaretUp, faCaretDown, faChevronLeft, faChevronRight, faChevronDown, faCheckCircle, faCalendar, faHistory, faChartLine, faBars, faCog, faQuestionCircle, faWifi, faExternalLinkAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import Notifications from '@kyvg/vue3-notification'

library.add(faArrowLeft, faArrowRight, faArrowUp, faArrowDown, faLevelDownAlt, faSignInAlt, faTimesCircle, faTimes, faExclamationCircle, faCaretRight, faCaretUp, faCaretDown, faChevronLeft, faChevronRight, faChevronDown, faCheckCircle, faCalendar, faHistory, faChartLine, faBars, faCog, faQuestionCircle, faWifi, faExternalLinkAlt, faTrashAlt)

let app

const env = process.env.VUE_APP_ENV
switch(env) {
    case 'WEB':
        try {
            store.dispatch('connectToNode')
        } catch(e) {
            console.error('WebSocket error:', e)
            alert(e)
        }

        app = createApp(App).use(router)
        break
    case 'XAPP':
        app = createApp(Xapp)
        break
    default:
        app = createApp(Xapp)
}

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
