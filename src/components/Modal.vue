<template>
    <div @click.self="active = false" v-if="active" class="overlay">
        <div class="modal-container">
            <div class="column">
                <h2>{{ header }}</h2>
                <p>{{ msg }}</p>
                <a class="btn btn-primary" @click="active = false">{{ buttonText }}</a>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            active: false,
            type: 'info',
            header: 'Header',
            msg: 'No message',
            buttonText: 'close'
        }
    },
    mounted() {
        this.$emitter.on('modal', options => {
            this.header = options.title
            this.msg = options.text
            this.buttonText = options.buttonText
            this.active = true
        })
    }
}
</script>

<style scoped>
.column {
    padding: 0 5px;
    height: 100%;
}
.overlay {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(var(--var-backdrop), 0.5);
    z-index: 99;
}
.modal-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--var-bg-color-secondary);
    width: 160px;
    height: 160px;
    padding: 10px;
    border-radius: 15px;
    display: flex;
    flex-direction: row;
    align-items: center;
}
.modal-container h2 {
    margin: 0;
    margin-top: 5px;
}
.modal-container p {
    margin-top: 5px;
}
.modal-container .btn {
    margin-top: auto;
    margin-bottom: 8px;
}
</style>
