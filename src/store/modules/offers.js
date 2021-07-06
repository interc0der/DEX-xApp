const state = {
    offers: {}
}

const getters = {
    getOffers: state => {
        return state.offers
    }
}

const actions = {
    setOpenOffers: (context, objects) => {
        context.commit('resetOffers')
        try {
            // const data = context.rootGetters.getAccountObjects
            const data = objects
            data.forEach(object => {
                if(object.LedgerEntryType === 'Offer') {
                    if(object.TakerGets.currency === undefined) {
                        object.TakerGets = {
                            currency: 'XRP',
                            value: object.TakerGets
                        }
                    }
                    if(object.TakerPays.currency === undefined) {
                        object.TakerPays = {
                            currency: 'XRP',
                            value: offer.TakerPays
                        }
                    }
                    context.commit('setOffer', object)
                }
            })
        } catch(e) {
            throw e
        }
    }
}

const mutations = {
    resetOffers: (state) => {
        state.offers = {}
    },
    setOffer: (state, offer) => {
        state.offers[offer.Sequence] = offer
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}
