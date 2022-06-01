import client from '../../plugins/ws-client'
import client2 from '../../plugins/ws-client-secondary'

const state = {
    node: {
        type: 'MAINNET',
        url: 'wss://xrplcluster.com/'
        // type: 'TESTNET',
        // url: 'wss://s.altnet.rippletest.net:51233'
    },
    locale: 'en_EN',
    currency: 'USD',

    nodes: {
        MAINNET: ['wss://xrplcluster.com/', 'wss://s1.ripple.com/', 'wss://s2.ripple.com/', 'wss://x1.sologenic.org'],
        TESTNET: ['wss://s.altnet.rippletest.net:51233', 'wss://testnet.xrpl-labs.com']
    }
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
    },
    getNodeOptions: state => {
        return state.nodes
    },
    getActiveNode: state => {
        return state.node
    }
}

const actions = {
    setNodeType: async (context, payload) => {
        // { type, url }
        // todo connect to new websocket and save settings
        context.commit('setNodeType', payload)
        await context.dispatch('connectToNode')
    },
    connectToNode: async (context, settings) => {
        settings = { NoUserAgent: true, MaxConnectTryCount: 5 }

        if(client.getState() !== null) {
            console.log('close...')
            await client.close()
            await client2.close()
        }

        // first set node type then connect
        client.connect(context.getters.getActiveNode?.url, settings)
        // Todo wait on issue https://github.com/ripple/rippled/issues/3934
        client2.connect(context.getters.getActiveNode?.url, settings)

        context.dispatch('initDataNode')
    },
    initDataNode: (context) => {
        client.on('transaction', tx => {
			context.dispatch('parseTx', { transaction: tx, notify: true })
		})
        client2.on('transaction', tx => {
            context.dispatch('parseOrderBookChanges', { tx })
        })

        console.log('get new data')
        context.dispatch('getTradeHistory')
        context.dispatch('setLastTradedPrice')

        context.dispatch('getOrderBookData')
    }
}

const mutations = {
    setNodeType: (state, payload) => {
        state.node = {
            type: payload.type,
            url: payload.url
        }
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}
