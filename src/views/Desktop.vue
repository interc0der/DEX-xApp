<template>
    <div id="browser-view">
        <div name="header">
            <Header />
        </div>

        <div name="tickerdata">
            <Ticker />
        </div>

        <div name="markets">
            TODO CURRENCIES WITH ACTIVE MARKETS COMPONENT
        </div>

        <div name="chart">
            <ChartContainer />
        </div>

        <div name="orderform">
            <TradeForm />
        </div>

        <div name="orderbook">
            <OrderBook />
        </div>

        <div name="trades">
            <Trades />
        </div>

        <div name="tradedata">
            <div class="chart-select-tabs tabs-row">
                <label v-for="table in availableTables">
                    <input type="radio" :value="table" name="data-tabs" v-model="tradeDataComponentActive"/>
                    <span>{{ table }}</span>
                </label>
            </div>
            <!-- overflow-x: auto; -->
            <div class="tradedata-table-container">
                <OrderBook v-show="tradeDataComponentActive === 'Order Book'"/>
                <Trades v-show="tradeDataComponentActive === 'Trades'"/>
            </div>
        </div>

        <div name="accountinfo">
            <!-- <AccountData /> -->
            <AccountEvents />
        </div>

        <div name="footer">
            <Footer />
        </div>

    </div>
</template>

<script>
import Header from '../components/Header.vue'
import Ticker from '../components/TickerData.vue'

import ChartContainer from '../components/ChartContainer.vue'

import TradeForm from '../components/TradeForm.vue'
import OrderBook from '../components/OrderBook.vue'
import Trades from '../components/TradeData/TradeHistory.vue'

import AccountData from '../components/TradeData.vue'
import AccountEvents from '@/components/AccountEvents.vue'

import Footer from '../components/Footer.vue'

export default {
    components: {
        Header,
        Ticker,
        ChartContainer,
        TradeForm,
        OrderBook,
        Trades,

        AccountData,
        AccountEvents,

        Footer
    },
    data() {
        return {
            availableTables: ['Order Book', 'Trades'],
            tradeDataComponentActive: 'Order Book' 
        }
    },
    async created() {
        try {
            this.$store.dispatch('connectToNode')
        } catch(e) {
            console.error('WebSocket error:', e)
            alert(e)
        }

        this.$store.dispatch('getTradeHistory')
        this.$store.dispatch('setLastTradedPrice')

        this.$emitter.on('changedCurrency', data => {
            this.$store.dispatch('getOrderBookData')
            this.$store.dispatch('getChartData')
        })
    },
    beforeUnmount() {
        this.$emitter.all.clear()
    }
}
</script>

<style>
:root {
    --var-tradedata-width: 300px;
}
@media only screen
    and (max-width: 560px) {
        #browser-view {
            display: grid;
            grid-template-columns: 1.5fr 150px;
            grid-template-rows: minmax(64px, auto) 1fr 1.6fr;
            grid-template-areas: 
                "header header"
                "orderform orderbook"
                "accountinfo accountinfo";
            margin: 0;
            gap: 3px;
            background-color: black;
            overflow-y: hidden;
        }
        div[name="tickerdata"] {
            display: none !important;
        }
        div[name="chart"] {
            display: none !important;
        }
        div[name="orderbook"] {
            display: block !important;
        }
        div[name="tradedata"] {
            display: none !important;
        }
        div[name="footer"] {
            display: none !important;
        }
    }

@media only screen
    and (min-width: 560px)
    and (max-width: 1024px)
    and (orientation: portrait) {
        #browser-view {
            display: grid;
            /* width: 100vw; */
            /* height: 100vh; */
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: minmax(64px, auto) minmax(64px, auto) 1.6fr 1.15fr 1fr 35px;
            grid-template-areas: 
                "header header header"
                "tickerdata tickerdata tickerdata"
                "chart chart orderform"
                "orderbook trades orderform"
                "accountinfo accountinfo orderform"
                "footer footer footer";
            margin: 0;
            gap: 3px;
            background-color: black;
            overflow-y: hidden;
        }
        div[name="trades"] {
            display: block !important;
        }
    }

@media only screen
    and (min-width: 560px)
    and (max-width: 1024px)
    and (orientation: landscape) {
        #browser-view {
            display: grid;
            /* width: 100vw; */
            /* height: 100vh; */
            grid-template-columns: 1fr var(--var-tradedata-width) 250px;
            grid-template-rows: 64px 64px 1.6fr 1fr 35px;
            grid-template-areas: 
                "header header header"
                "tickerdata tickerdata tickerdata"
                "chart tradedata orderform"
                "accountinfo accountinfo orderform"
                "footer footer footer";
            margin: 0;
            gap: 3px;
            background-color: black;
            overflow-y: hidden;
        }
        div[name="orderbook"] {
            display: none !important;
        }
        div[name="tradedata"] {
            display: block !important;
        }
    }

@media only screen
    and (min-width: 1024px)
    and (max-width: 1760px) {
        #browser-view {
            display: grid;
            /* width: 100vw; */
            /* height: 100vh; */
            grid-template-columns: 1fr var(--var-tradedata-width) 250px;
            grid-template-rows: 64px 64px 1.6fr 1fr 35px;
            grid-template-areas: 
                "header header header"
                "tickerdata tickerdata tickerdata"
                "chart tradedata orderform"
                "accountinfo accountinfo orderform"
                "footer footer footer";
            margin: 0;
            gap: 3px;
            background-color: black;
            overflow-y: hidden;
        }
        div[name="orderbook"] {
            display: none !important;
        }
        div[name="tradedata"] {
            display: block !important;
        }
    }

@media only screen
    and (min-width: 1760px)
    and (max-width: 2040px) {
        #browser-view {
            display: grid;
            /* width: 100vw; */
            /* height: 100vh; */
            grid-template-columns: 200px 1fr var(--var-tradedata-width) 250px;
            grid-template-rows: 64px 64px 1.6fr 1fr 35px;
            grid-template-areas: 
                "header header header header"
                "tickerdata tickerdata tickerdata tickerdata"
                "markets chart tradedata orderform"
                "accountinfo accountinfo accountinfo orderform"
                "footer footer footer footer";
            margin: 0;
            gap: 3px;
            background-color: black;
            overflow-y: hidden;
        }
        div[name="markets"] {
            display: block !important;
        }
        div[name="orderbook"] {
            display: none !important;
        }
        div[name="tradedata"] {
            display: block !important;
        }
    }

@media only screen
    and (min-width: 2040px) {
        #browser-view {
            display: grid;
            /* width: 100vw; */
            /* height: 100vh; */
            grid-template-columns: 300px 1fr 250px 250px 250px;
            grid-template-rows: 64px 64px 1.6fr 1fr 35px;
            grid-template-areas: 
                "header header header header header"
                "tickerdata tickerdata tickerdata tickerdata tickerdata"
                "markets chart orderbook trades orderform"
                "accountinfo accountinfo accountinfo accountinfo orderform"
                "footer footer footer footer footer";
            margin: 0;
            gap: 3px;
            background-color: black;
            overflow-y: hidden;
        }
        div[name="markets"] {
            display: block !important;
        }
        div[name="trades"] {
            display: block !important;
        }
    }

#browser-view > * {
    background-color: var(--var-bg-color);
}

div[name="header"] {
    height: 100%;
    width: 100%;
    grid-area: header / header / header / header;
}

div[name="tickerdata"] {
    height: 100%;
    width: 100%;
    grid-area: tickerdata / tickerdata / tickerdata / tickerdata;
}

div[name="markets"] {
    height: 100%;
    width: 100%;
    display: none;
    grid-area: markets;
}

div[name="chart"] {
    height: 100%;
    width: 100%;
    grid-area: chart / chart / chart / chart ;
}

div[name="orderform"] {
    height: 100%;
    width: 100%;
    grid-area: orderform / orderform / orderform / orderform;
}

div[name="orderbook"] {
    height: 100%;
    width: 100%;
    grid-area: orderbook / orderbook / orderbook / orderbook;
}

div[name="trades"] {
    height: 100%;
    width: 100%;
    grid-area: trades / trades / trades / trades;
    overflow-x: auto;

    display: none;
}

div[name="tradedata"] {
    display: none;
    height: 100%;
    width: 100%;
    grid-area: tradedata / tradedata / tradedata / tradedata;

    overflow: hidden;
}

div[name="tradedata"] .tradedata-table-container {
    height: calc(100% - 30px);
}

div[name="accountinfo"] {
    height: 100%;
    width: 100%;
    grid-area: accountinfo / accountinfo / accountinfo / accountinfo;

    overflow: hidden;
}

div[name="footer"] {
    height: 100%;
    width: 100%;
    grid-area: footer / footer / footer / footer;
}

</style>
