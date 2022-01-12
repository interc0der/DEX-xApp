import xrpl from '../../plugins/ws-client'
import _merge from 'lodash/merge'

const state = {
    address: '',
    accountInfo: {},
    accountObjects: [],
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
        let array = []
        for(const object of state.accountObjects) {
            if(object.LedgerEntryType !== 'RippleState') continue

            let issuerRipple
            let accountRipple
            const balanceSign = Math.sign(Number(object.Balance?.value))
            if(balanceSign > 0) {
                issuerRipple = object.HighLimit.issuer
                accountRipple = object.LowLimit.issuer
            } else if(balanceSign < 0) {
                issuerRipple = object.LowLimit.issuer
                accountRipple = object.HighLimit.issuer
            } else {
                issuerRipple = object.LowLimit.issuer === state.address ? object.HighLimit.issuer : object.LowLimit.issuer
                accountRipple = object.HighLimit.issuer === state.address ? object.HighLimit.issuer : object.LowLimit.issuer
            }

            array.push({
                currency: object.Balance.currency,
                issuer: issuerRipple,
                value: Math.abs(object.Balance.value)
            })
        }

        return array
    },
    getAccountFunds: state => (currency, issuer) => {
        if(state.accountInfo === null || typeof state.accountInfo === undefined) return null
        if(state.accountObjects === null || typeof state.accountObjects === undefined) return null

        if(currency === 'XRP') {
            if(typeof state.accountInfo.Balance === undefined) return null
            console.log(xrpl.getState().reserve)
            const accountReserve = xrpl.getState().reserve.base * 1_000_000 || 10_000_000
            const ownerReserve = xrpl.getState().reserve.owner * 1_000_000 || 2_000_000
            const reserved = state.accountInfo.OwnerCount * ownerReserve
            const balance = (state.accountInfo.Balance - accountReserve - reserved)
            return balance
        } else {
            if(!Array.isArray(state.accountObjects)) return null

            for(let object of state.accountObjects) {
                if(object.LedgerEntryType === 'RippleState') {
                    if(object.LowLimit.currency === currency && object.LowLimit.issuer === issuer) {
                        if(object.HighLimit.issuer === state.address) {
                            return Math.abs(object.Balance.value)
                        }
                    } else if(object.HighLimit.currency === currency && object.HighLimit.issuer === issuer) {
                        if(object.LowLimit.issuer === state.address) {
                            return Math.abs(object.Balance.value)
                        }
                    }
                }
                continue
            }
            return null
        }
    }
}

const actions = {
    resetData: (context) => {
        context.dispatch('resetOfferState')
        context.dispatch('setOpenOffers', [])
        context.commit('setAccountObjects', [])
        context.commit('setAccountTransactions', [])
    },

    setAccount: async (context, account) => {
        if(account !== context.state.address) context.dispatch('resetData')
        context.commit('setAccount', account)
        try {
            await context.dispatch('setAccountInfo')
            await Promise.all([context.dispatch('setAccountObjects'), context.dispatch('setAccountTransactions')])
            context.dispatch('checkOpenOffers')
        } catch(e) {
            console.log('Error with account info: ' + e)
        }

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
    setAccountObjects: async (context, marker) => {
        if(context.getters.hasAccountErrors) {
            context.dispatch('setOpenOffers', [])
            return context.commit('setAccountObjects', [])
        }

        const res = await xrpl.send({
            command: 'account_objects',
            account: context.state.address,
            marker: marker
        })

        const objects = res.account_objects
        const offerObjects = objects.filter(object => object.LedgerEntryType === 'Offer')

        // Dispatch action to set offers
        context.dispatch('setOpenOffers', offerObjects)
        if(marker) {
            context.commit('mergeAccountObjects', objects)
        } else {
            context.commit('setAccountObjects', objects)
        }

        if(res.hasOwnProperty('marker')) {
            context.dispatch('setAccountObjects', res.marker)
        } else return
    },
    setAccountTransactions: async (context) => {
        if(context.getters.hasAccountErrors) {
            context.commit('setAccountTransactions', [])
            context.dispatch('resetOfferState')
            return
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
        console.log('Balance changes:')
        console.log(balancechanges)
    },
    onNodeChange: (context, node) => {
        if(!node.hasOwnProperty('FinalFields')) return console.warn('Change object without FinalFields Object')
        node.FinalFields.index = node.LedgerIndex
        if(node.LedgerEntryType === 'AccountRoot') {
            console.log('AccountRoot please make changes')
            context.commit('modifyAccountObject', node.FinalFields)
        } else {
            context.commit('modifyObject', node.FinalFields)
        }
    },
    addObjectToAccount: (context, object) => {
        if(!object.hasOwnProperty('NewFields')) return console.warn('Add object without NewFields Object')
        console.log('Add Object to account please...')
        object.NewFields.index = object.LedgerIndex
        object.NewFields.LedgerEntryType = object.LedgerEntryType
        context.commit('addObject', object.NewFields)
    },
    removeObjectFromAccount: (context, object) => {
        if(!object.hasOwnProperty('FinalFields')) return console.warn('Delete object without FinalFields Object')
        console.log('Remove Object From account please...')
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
    setAccountObjects: (state, arr) => {
        state.accountObjects = arr
    },
    mergeAccountObjects: (state, arr) => {
        state.accountObjects = state.accountObjects.concat(arr)
    },
    setAccountTransactions: (state, arr) => {
        state.accountTransactions = arr
    },
    modifyAccountObject: (state, node) => {
        if(state.accountInfo?.index === node.index && node.index) {
            state.accountInfo = _merge(state.accountInfo, node)
            console.log('AccountRoot changed')
        }
    },
    modifyObject: (state, node) => {
        for(let i = 0; state.accountObjects.length > i; i++) {
            if(state.accountObjects[i].index === node.index) {
                state.accountObjects[i] = _merge(state.accountObjects[i], node)
                console.log(node)
                console.log('Modify Done...')
                break
            }
        }
    },
    addObject: (state, object) => {
        state.accountObjects.push(object)
    },
    removeObject: (state, objectToDelete) => {
        state.accountObjects = state.accountObjects.filter(object => {
            if(object.index === objectToDelete.index) return false
            else return true
        })
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}
