
import { createStore } from 'vuex'

import settings from './modules/settings'
import account from './modules/account'
import orderbook from './modules/orderbook'
import offers from './modules/offers'
import trade from './modules/trade'

export default createStore({
    modules: {
        settings,
        account,
        orderbook,
        offers,
        trade
    }
})
