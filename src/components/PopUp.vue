<template>
    <div class="overlay">
        <div id="popup-window">
            <div class="popup-container">
                <slot></slot>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    
}
</script>

<style scoped>
.overlay {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(var(--var-backdrop), 0.4);
    z-index: 99;
}
#popup-window {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--var-bg-color-secondary);
    width: 65%;
    min-height: 250px;
    min-width: 160px;
    max-width: 300px;
    padding: 1rem;
    border-radius: 15px;
    display: flex;
    flex-direction: row;
    align-items: center;
}
.popup-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
}
</style>
