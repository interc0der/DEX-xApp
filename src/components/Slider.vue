<template>
    <!-- <input :style="trackStyling" :class="{ 'input-light': theme === 'LIGHT' }" type="range" :step="step || 1" :min="min || 0" :max="max || 100" v-model="inputValue"> -->
    <div class="slider-container">
        <div class="slider">
            <div class="slider-wrapper"
                @pointerdown.prevent="startDraggingTouch"
                @pointermove.prevent="draggingTouch"
                @pointerleave="cancelDrag('leave')"
                @pointerup="cancelDrag('touch')"
                @pointerover="mouseHover"
                @pointerout="hideValueLabel()"
            ></div>
            <div class="slider-range"></div>
            <div class="slider-steps">
                <template v-for="(step, index) in 5">
                    <div class="slider-step" :data-value="index * (100/4)" :class="{ filled: inputValue >= index * (100/4) }" :style="`left: calc(${index * (100/4)}% - 6px);`"></div>
                </template>
            </div>
            <div class="slider-progress" :style="`width: ${inputValue}%`"></div>
            <div class="thumb" :style="`left: calc(${inputValue}% - 8px)`"></div>
            <div class="value-box" :style="`left: calc(${inputValue}% - 20px)`" v-show="valueLabelActive">
                <span class="number">{{ inputValue || 0 }}%</span>
            </div>
        </div>

        <div class="labels numbers">
            <label>0</label>
            <label>100%</label>
        </div>
    </div>
    
</template>

<script>
export default {
    data() {
        return {
            theme: 'DARK',
            isDragging: false,
            valueLabelActive: false
        }
    },
    methods: {
        posTouch(e) {
            const x = e.clientX - e.target.getBoundingClientRect().left
            const width = e.target.getBoundingClientRect().width
            const one = width / 100
            const value = Math.trunc(x/one)

            if(value < 0) this.inputValue = 0
            else if(value > 100) this.inputValue = 100
            else this.inputValue = value
        },
        startDraggingTouch(e) {
            this.posTouch(e)
            this.isDragging = true
            this.showValueLabel(e)
        },
        draggingTouch(e) {
            if(this.isDragging) this.posTouch(e)
        },
        cancelDrag(method) {
            console.log('cancel by: ' + method)
            this.isDragging = false
            if(method === 'touch') this.hideValueLabel()
        },
        mouseHover(e) {
            console.log('hover')
            this.showValueLabel(e)
        },
        showValueLabel(e) {
            this.valueLabelActive = true
        },
        hideValueLabel() {
            console.log('hide')
            this.valueLabelActive = false
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
                const value = this.modelValue
                if(value < 0) return 0
                else if(value > 100) return 100
                else return parseInt(value)
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
.slider-container {
    width: 100%;
    margin-top: 10px;
    height: 20px;
    touch-action: none;
}
.slider {
    position: relative;
    user-select: none;
    width: 100%;

    cursor: pointer;
}
.slider-wrapper {
    position: absolute;
    top: -20px;
    left: -6px;

    height: 40px;
    width: calc(100% + 12px);

    z-index: 20;
}
.slider-range {
    position: absolute;
    background-color: var(--grey4);
    height: 4px;
    top: 0;
    left: 0;
    right: 0;

    z-index: 1;
}
.slider-steps {
    position: relative;
}
.slider-step {
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: var(--grey4);
    border: solid black 2px;
    border-radius: 50%;
    /* height + border x 2 * 0.5 + heigth * 0.5 */
    top: calc(-12px * 0.5 + 4px * 0.5);
    left: -6px;
    z-index: 2;
}
.slider-step.filled {
    background-color: var(--grey) !important;
    border: solid black 2px !important;
    z-index: 4;
}
.slider-progress {
    position: absolute;
    top: 0;
    left: 0;
    background-color: var(--grey);
    height: 4px;
    z-index: 3;
}
.thumb {
    position: absolute;
    top: calc(-16px * 0.5 + 4px * 0.5);
    left: -8px;
    z-index: 5;

    width: 12px;
    height: 12px;
    background-color: var(--grey);
    border-radius: 50%;
    border: solid black 2px;

    cursor: pointer;
}
.value-box {
    position: absolute;
    top: -35px;
    left: -20px;
    z-index: 10;

    font-size: 0.8rem;
    background-color: rgba(0, 0, 0, 0.9);
    border-radius: 10px;
    width: 38px;
    height: 28px;
    display: flex;
    align-items: center;
}
.value-box > * {
    margin: auto;
}
.labels {
    margin-top: 10px;
    margin-left: -4px;
    width: calc(100% + 8px);
    font-size: 0.8rem;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

/* .input-light {
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
} */
</style>
