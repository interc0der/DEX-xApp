// add module support in package.json for this to work:   "type": "module",

import { priceFormat } from '../src/plugins/number-format.js'

const units = [
    {
        in: 0.123456789,
        out: '0.1235'
    },
    {
        in: '12345.6789',
        out: '12345.68'
    },
    {
        in: '0.3990',
        out: '0.3990'
    },
    {
        in: '0.3991',
        out: '0.3991'
    },
    {
        in: '0.99989',
        out: '0.9999'
    },
    {
        in: 12.3456789,
        out: '12.35'
    },
    {
        in: 99.989, //
        out: '99.99'
    },
    {
        in: 9.989, // 
        out: '9.989'
    },
    {
        in: 1.0001,
        out: '1.000'
    },
    {
        in: 0.00098765,
        out: '0.0009877'
    },
    {
        in: 0.00012345, //
        out: '0.0001235'
    },
    {
        in: 0.0012345, //
        out: '0.001235'
    }
]

units.forEach(unit => {
    
    let test = priceFormat(unit.in)
    if(test !== unit.out) {
        console.log( Number(unit.in).toFixed(7) )
        console.log(`Is the ${typeof unit.in} unit equal: ${test === unit.out} \n in: ${unit.in}; exp: ${unit.out}; out: ${test}`)
    }
})
