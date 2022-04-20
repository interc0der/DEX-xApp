const state = {
    nodetype: 'MAINNET',
    locale: 'en_EN',
    currency: 'USD'
}

const getters = {
    getWebSocketUrl: state => nodetype => {
        switch (nodetype || state.nodetype) {
            case "MAINNET":
                return 'wss://xrplcluster.com'
            case "TESTNET":
                return 'wss://s.altnet.rippletest.net:51233'
                // return 'wss://testnet.xrpl-labs.com'
        }
        return 'wss://xrplcluster.com'
    }
}

const actions = {
    
}

const mutations = {
    
}

export default {
    state,
    getters,
    actions,
    mutations
}
