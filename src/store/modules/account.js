import xrpl from '../../plugins/ws-client'

const state = {
    address: '',
    accountInfo: {},
    accountObjects: [],
    accountLines: [],
    accountTransactions: []
}

const getters = {
    getOfferHistory: state => {
        const data = {}

        state.accountObjects.forEach(object => {
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
                data[object.Sequence] = object
            }
        })

        state.accountTransactions.forEach(transaction => {
            const tx = transaction.tx
            switch(tx.TransactionType) {
                case 'OfferCreate':
                    break
                case 'OfferCancel':
                    break
            }
        })

    },
    hasAccountErrors: state => {
        if(typeof state.accountInfo === 'string') return true
        else return false
    },
    getAccount: state => {
        return state.address
    },
    getAccountInfo: state => {
        return state.accountInfo
    },
    getAccountObjects: state => {
        return state.accountObjects
    },
    getAccountLines: state => {
        return state.accountLines
    },
    // Todo ->
    getAccountFunds: state => (currency, issuer) => {
        if(state.accountInfo === null || typeof state.accountInfo === undefined) return null
        if(currency === 'XRP') {
            if(state.accountObjects === null || typeof state.accountObjects === undefined) return null
            if(typeof state.accountInfo === undefined || typeof state.accountInfo.Balance === undefined) return null
            const accountReserve = 20000000
            const reserved = state.accountObjects.length * 5000000
            const balance = (state.accountInfo.Balance - accountReserve - reserved)
            return balance
        } else {
            if(!Array.isArray(state.accountLines)) return 0
            if(state.accountLines.length < 1) return 0
            for(const line of state.accountLines) {
                if(line.account === issuer && line.currency === currency) {
                    const balance = parseFloat(line.balance)
                    return balance
                }
            }
        }
    }
    // <- end
}

const actions = {
    setAccount: async (context, account) => {
        context.commit('setAccount', account)

        await context.dispatch('setAccountInfo')
        context.dispatch('setAccountLines')
        context.dispatch('setAccountObjects')
        context.dispatch('setAccountTransactions')
        return
    },
    setAccountInfo: async (context) => {
        const res = await xrpl.send({
            command: 'account_info',
            account: context.state.address
        })

        if(res.status === 'error') return context.commit('setAccountInfo', res.error)
        else return context.commit('setAccountInfo', res.account_data)
    },
    setAccountLines: async (context) => {
        if(context.getters.hasAccountErrors) return context.commit('setAccountLines', [])
        
        const res = await xrpl.send({
            command: 'account_lines',
            account: context.state.address
        })
        return context.commit('setAccountLines', res.lines)
    },
    setAccountObjects: async (context) => {
        if(context.getters.hasAccountErrors) {
            context.dispatch('setOpenOffers', [])
            return context.commit('setAccountObjects', [])
        }
        
        const res = await xrpl.send({
            command: 'account_objects',
            account: context.state.address
        })

        // Dispatch action to set offers
        context.dispatch('setOpenOffers', res.account_objects)
        return context.commit('setAccountObjects', res.account_objects)
    },
    setAccountTransactions: async (context) => {
        if(context.getters.hasAccountErrors) return context.commit('setAccountTransactions', [])

        const res = await xrpl.send({
            command: 'account_tx',
            account: context.state.address
        })
        context.commit('setAccountTransactions', res.transactions)
    },
    parseTx: (context, tx) => {
        console.log(tx)
    }
}

const mutations = {
    setAccount: (state, account) => {
        state.address = account
    },
    setAccountInfo: (state, obj) => {
        state.accountInfo = obj
    },
    setAccountLines: (state, arr) => {
        state.accountLines = arr
    }, 
    setAccountObjects: (state, arr) => {
        state.accountObjects = arr
    },
    setAccountTransactions: (state, arr) => {
        state.accountTransactions = arr
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}
