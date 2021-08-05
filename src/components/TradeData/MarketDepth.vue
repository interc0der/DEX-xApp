<template>
    <Chart :options="chartOptions" />
    <div class="table-wrapper">
        <div id="order-book-data-table-container">
            <div class="order-book-table-row table-headers">
                <div class="order-book-column row-bids">
                    <span>Quantity</span>
                    <span>Bid Price</span>
                </div>
                <div class="order-book-column row-asks">
                    <span>Ask Price</span>
                    <span>Quantity</span>
                </div>
            </div>
            <div class="order-book-table-row" v-for="index in maxRows">
                <div class="order-book-column row-bids">
                    <template v-if="bidsList[index - 1]">
                        <span class="number">{{ quantityFormat(bidsList[index - 1].quantity, currencyPair.base.currency) }}</span>
                        <span class="number buy">{{ bidsList[index - 1].price }}</span>
                    </template>
                </div>
                <div class="order-book-column row-asks">
                    <template v-if="asksList[index - 1]">
                        <span class="number sell">{{ asksList[index - 1].price }}</span>
                        <span class="number">{{ quantityFormat(asksList[index - 1].quantity, currencyPair.base.currency) }}</span>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
// https://github.com/highcharts/highcharts-vue
// https://api.highcharts.com/highcharts/chart
import { Chart } from 'highcharts-vue'
import { quantityFormat } from '../../plugins/number-format'

export default {
    components: { Chart },
    data() {
        return {
            maxRows: 25
        }
    },
    methods: {
        quantityFormat
    },
    computed: {
        chartOptions() {
            var style = getComputedStyle(document.body)
            const bg = style.getPropertyValue('--var-bg-color')
            
            const green = style.getPropertyValue('--green')
            const red = style.getPropertyValue('--red')

            const line = style.getPropertyValue('--var-border')

            return {
                chart: {
                    type: 'area',
                    zoomType: 'xy',
                    backgroundColor: bg,
                    height: 200,
                    // spacingTop: 0,
                    spacingRight: 0,
                    // spacingBottom: 0,
                    spacingLeft: 0,
                    plotBorderWidth: 0,
                    // margin: [0,0,0,0]
                    style: {
                        fontFamily: 'din-2014, sans-serif'
                    }
                },
                title: {
                    text: ''
                },
                xAxis: [
                    {
                        // plotLines: [{
                        //     color: line,
                        //     value: 0.1523,
                        //     width: 1
                        // }],
                        // tickAmount: 2,
                        // type: 'logarithmic',
                        title: null,
                        width: '50%',
                        labels: {
                            style: {
                                color: 'white'
                            }
                        },
                        lineWidth: 0,
                        tickWidth: 0,
                        minPadding: 0,
                        maxPadding: 0
                    },
                    {
                        // type: 'logarithmic',
                        title: {
                            text: 'Price',
                            style: {
                            color: '#000000'
                            },
                        },
                        labels: {
                            style: {
                            color: 'white'
                            }
                        },
                        lineWidth: 0,
                        tickWidth: 0,
                        offset: 0,
                        left: '50%',
                        width: '50%',
                        minPadding: 0,
                        maxPadding: 0
                    }
                ],
                yAxis: [
                    {
                        gridLineWidth: 0,
                        title: null,
                        tickWidth: 0,
                        tickPosition: 'inside',
                        labels: {
                            align: 'left',
                            x: 2,
                            style: {
                                color: '#FFFFFF'
                            },
                            // formatter:function(){
                            //     if(this.value !=0){
                            //         return this.value;
                            //     }
                            // }
                        }
                    },
                    {
                        opposite: true,
                        linkedTo: 0,
                        gridLineWidth: 0,
                        title: null,
                        tickLength: 5,
                        tickPosition: 'inside',
                        labels: {
                            align: 'right',
                            x: -2,
                            style: {
                                color: '#FFFFFF'
                            },
                            formatter:function(){
                                if(this.value !=0){
                                    return this.value;
                                }
                            }
                        }
                    }
                ],
                legend: {
                    enabled: false
                },
                plotOptions: {
                    area: {
                        fillOpacity: 0.2,
                        lineWidth: 1,
                        step: 'center'
                    }
                },
                tooltip: {
                    crosshairs: true,
                    headerFormat: '<span style="font-size=10px;">Price: {point.key}</span><br/>',
                    valueDecimals: 2
                },
                series: [
                    {
                        name: 'Bids',
                        data: this.chartDataBids,
                        color: green,
                        xAxis: 0
                    },
                    {
                        name: 'Ask',
                        data: this.chartDataAsk,
                        color: red,
                        xAxis: 1
                    }
                ]
            }
        },
        currencyPair() {
            return this.$store.getters.getCurrencyPair
        },
        chartDataAsk() {
            const array = []
            this.orderBookData.asks.forEach(entry => {
                let total = entry.total
                if(this.currencyPair.base.currency === 'XRP') total = Number(entry.total) / 1_000_000
                array.push([Number(entry.price), Number(total)])
            })
            return array
            // return [[0.1435,242.521842],[0.1436,206.49862099999999],[0.1437,205.823735],[0.1438,197.33275],[0.1439,153.677454],[0.144,146.007722],[0.1442,82.55212900000001],[0.1443,59.152814000000006],[0.1444,57.942260000000005],[0.1445,57.483850000000004],[0.1446,52.39210800000001],[0.1447,51.867208000000005],[0.1448,44.104697],[0.1449,40.131217],[0.145,31.878217],[0.1451,22.794916999999998],[0.1453,12.345828999999998],[0.1454,10.035642],[0.148,9.326642],[0.1522,3.76317]]
        },
        chartDataBids() {
            const array = [] 
            this.orderBookData.bids.forEach(entry => {
                let total = entry.total
                if(this.currencyPair.base.currency === 'XRP') total = Number(entry.total) / 1_000_000
                array.push([Number(entry.price), Number(total)])
            })

            return array
            // return [[0.1524,0.948665],[0.1539,35.510715],[0.154,39.883437],[0.1541,40.499661],[0.1545,43.262994000000006],[0.1547,60.14799400000001],[0.1553,60.30799400000001],[0.1558,60.55018100000001],[0.1564,68.381696],[0.1567,69.46518400000001],[0.1569,69.621464],[0.157,70.398015],[0.1574,70.400197],[0.1575,73.199217],[0.158,77.700017],[0.1583,79.449017],[0.1588,79.584064],[0.159,80.584064],[0.16,81.58156],[0.1608,83.38156]]
        },
        orderBookData() {
            return this.$store.getters.getOrderBookData
        },
        bidsList() {
            return this.orderBookData.bids
        },
        asksList() {
            return this.orderBookData.asks
        }
    }
}
</script>

<style scoped>
.table-wrapper {
    width: 100%;
}
#order-book-data-table-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    padding: 0 20px;
    margin-bottom: 50px;
}
.order-book-table-row {
    display: flex;
    flex-direction: row;
    width: 100%;
    margin: 10px 0; 
    font-size: 0.8rem;
}
.table-headers {
    color: var(--grey) !important;
    margin-top: 10px;
    margin-bottom: 0;
}
.order-book-column {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 50%;
}
.row-bids {
    padding-right: 3px;
}
.row-asks {
    padding-left: 3px;
}
.buy {
    color: var(--green);
}
.sell {
    color: var(--red);
}
</style>
