<template>
    <input :style="trackStyling" :class="{ 'input-light': theme === 'LIGHT' }" type="range" :step="step || 1" :min="min || 0" :max="max || 100" v-model="inputValue">
</template>

<script>
export default {
    data() {
        return {
            theme: 'DARK'
        }
    },
    props: {
        step: {
            type: [Number, String],
            default: 1,
            validator: str => {
                if(typeof str === 'number') return true
                if(typeof str !== 'string') return false
                return !isNaN(str) && !isNaN(parseFloat(str))
            }
        },
        min: {
            type: [Number, String],
            default: 0,
            validator: str => {
                if(typeof str === 'number') return true
                if(typeof str !== 'string') return false
                return !isNaN(str) && !isNaN(parseFloat(str))
            }
        },
        max: {
            type: [Number, String],
            default: 100,
            validator: str => {
                if(typeof str === 'number') return true
                if(typeof str !== 'string') return false
                return !isNaN(str) && !isNaN(parseFloat(str))
            }
        },
        modelValue: {
            type: [Number, String]
        }
    },
    emits: ['update:modelValue'],
    computed: {
        inputValue: {
            get() {
                return this.modelValue
            },
            set(value) {
                this.$emit('update:modelValue', value)
            }
        },
        trackStyling() {
            var value = this.inputValue
            if(!value && value !== 0) value = 50
            if(value === Infinity || value === NaN) value = 50
            return `background: linear-gradient(to right, var(--var-primary) 0%, var(--var-primary) ${value}%, #fff ${value}%, #fff 100%)`
        }
    }
}
</script>

<style scoped>
.input-light {
    border: 1px solid black;
}
input[type=range] {
    border-radius: 8px;
    height: 3px;
    -webkit-appearance: none;
    width: 100%;
    outline: none;
    margin: 0;
}
input[type=range]::-webkit-slider-thumb {
    height: 15px;
    width: 15px;
    border: 1px solid var(--var-txt-color);
    border-radius: 10px;
    background: #FFFFFF;
    cursor: pointer;
    -webkit-appearance: none;
}
input[type=range]::-moz-range-thumb {
    height: 15px;
    width: 15px;
    border-radius: 10px;
    background: #ffffff;
    cursor: pointer;
    -webkit-appearance: none;
}
input[type=range]::-ms-thumb {
    height: 15px;
    width: 15px;
    border-radius: 10px;
    background: #ffffff;
    cursor: pointer;
    -webkit-appearance: none;
}
</style>
