import xrpl from '../../plugins/ws-client'

const state = {
    address: '',
    accountInfo: {},
    accountObjects: [],
    accountLines: [],
    accountTransactions: []
}

const getters = {
    getCreatedOffersSequenceArray: state => {
        const createdOffersArray = []
        state.accountTransactions.forEach(transactions => {
            const tx = transaction.tx
            switch(tx.TransactionType) {
                case 'OfferCreate':
                    createdOffersArray.push()
                    return true
                default:
                    return false
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
        try {
            await context.dispatch('setAccountInfo')
        } catch(e) {
            console.log('Error with account info: ' + e)
        }
        context.dispatch('setAccountLines')

        await Promise.all([context.dispatch('setAccountObjects'), context.dispatch('setAccountTransactions')])
        
        context.dispatch('checkOpenOffers')

        return
    },
    setAccountInfo: async (context) => {
        return new Promise( async (resolve, reject) => {
            const res = await xrpl.send({
                command: 'account_info',
                account: context.state.address
            })
            if(res.status === 'error') {
                context.commit('setAccountInfo', res.error)
                reject(res.error)
            } else {
                context.commit('setAccountInfo', res.account_data)
                resolve(res.account_data)
            }
        })
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
            account: context.state.address,
            // type: 'offer'
        })

        const objects = res.account_objects
        const offerObjects = objects.filter(object => object.LedgerEntryType === 'Offer')

        // Dispatch action to set offers
        context.dispatch('setOpenOffers', offerObjects)
        return context.commit('setAccountObjects', objects)
    },
    setAccountTransactions: async (context) => {
        if(context.getters.hasAccountErrors) {
            context.dispatch('setOfferHistory', [])
            return context.commit('setAccountTransactions', [])
        }

        const res = await xrpl.send({
            command: 'account_tx',
            account: context.state.address
        })
        const reversedTx = res.transactions.reverse()
        context.commit('setAccountTransactions', reversedTx)
        context.dispatch('setOfferHistory', res.transactions)
    },
    parseTx: (context, payload) => {
        const tx = payload.transaction
        if(payload.notify) console.log(tx)
    },
    changeBalance: (context, balancechanges) => {
        console.log('Balance change parsing please...')
        console.log(balancechanges)
        balancechanges.forEach(change => {
            context.commit('changeBalanceValue', change)
        })
    },
    addObjectToAccount: (context, object) => {
        console.log('Add Object to account please...')
        console.log(object)
        object.NewFields.index = object.LedgerIndex
        context.commit('addObject', object.NewFields)
    },
    removeObjectFromAccount: (context, object) => {
        console.log('Remove Object From account please...')
        console.log(object)
        object.FinalFields.index = object.LedgerIndex
        context.commit('removeObject', object.FinalFields)
    },
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
    },
    addObject: (state, object) => {
        state.accountObjects.push(object)
    },
    removeObject: (state, objectToDelete) => {
        // todo :: !!!
        state.accountObjects = state.accountObjects.filter(object => {
            if(object.index === objectToDelete.index) return false
            else return true
        })
    },
    changeBalanceValue: (state, currencyObj) => {
        if(currencyObj.currency === 'XRP') {
            let value = isNaN(currencyObj.value) ? 0 - currencyObj.fees : Number(currencyObj.value) - Number(currencyObj.fees)
            state.accountInfo.Balance = Math.trunc( Number(state.accountInfo.Balance) + value )
        } else {
            // Todo iou/trustline/ripplestate balance
        }
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}
